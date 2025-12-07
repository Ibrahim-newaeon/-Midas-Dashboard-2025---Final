import pandas as pd
import numpy as np
from faker import Faker
from typing import Optional

fake = Faker()

# Import Meta API client for live data
from app.data_integration.meta_api import (
    fetch_meta_live_data,
    fetch_meta_campaigns,
    get_available_accounts,
    get_meta_client,
)
from config import USE_LIVE_META_DATA


def fetch_meta_data(start_date: str, end_date: str, account_id: Optional[str] = None) -> pd.DataFrame:
    """
    Fetch Meta (Facebook) Ads data.

    Uses live API data if USE_LIVE_META_DATA=true and credentials are configured,
    otherwise falls back to mock data.

    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        account_id: Optional specific account ID (fetches all if None)

    Returns:
        DataFrame with ad performance data
    """
    if USE_LIVE_META_DATA:
        # Use live Meta API
        df = fetch_meta_live_data(start_date, end_date, account_id)
        if not df.empty:
            # Rename columns to match expected format
            df = df.rename(columns={
                'date_start': 'report_date',
            })
            return df

    # Fallback to mock data
    return _generate_mock_meta_data(start_date, account_id)


def _generate_mock_meta_data(start_date: str, account_id: Optional[str] = None) -> pd.DataFrame:
    """Generate mock Meta data (legacy function)."""
    # Get account prefix for IDs
    acc_prefix = account_id[-6:] if account_id else 'DEMO'

    main_ad = {
        'report_date': [start_date],
        'ad_id': [f'{acc_prefix}_AD01'],
        'campaign_id': [f'{acc_prefix}_C01'],
        'impressions': [np.random.randint(5000, 15000)],
        'reach': [np.random.randint(4000, 10000)],
        'frequency': [np.random.uniform(1.5, 4.5)],
        'clicks': [np.random.randint(50, 200)],
        'spend': [np.random.uniform(100.0, 300.0)],
        'conversions': [np.random.randint(0, 5)],
        'revenue': [np.random.uniform(0, 2500.0) if np.random.rand() > 0.5 else 0],
        'account_id': [account_id or 'act_demo'],
    }
    test_ad_A = {
        'report_date': [start_date],
        'ad_id': [f'{acc_prefix}_AD05_A'],
        'campaign_id': [f'{acc_prefix}_C01'],
        'impressions': [np.random.randint(1000, 2000)],
        'reach': [np.random.randint(800, 1800)],
        'frequency': [np.random.uniform(1.0, 2.0)],
        'clicks': [np.random.randint(10, 25)],
        'spend': [np.random.uniform(15.0, 30.0)],
        'conversions': [np.random.randint(0, 2)],
        'revenue': [np.random.uniform(0, 300.0) if np.random.rand() > 0.6 else 0],
        'account_id': [account_id or 'act_demo'],
    }
    test_ad_B = {
        'report_date': [start_date],
        'ad_id': [f'{acc_prefix}_AD05_B'],
        'campaign_id': [f'{acc_prefix}_C01'],
        'impressions': [np.random.randint(1000, 2000)],
        'reach': [np.random.randint(800, 1800)],
        'frequency': [np.random.uniform(1.0, 2.0)],
        'clicks': [np.random.randint(15, 35)],
        'spend': [np.random.uniform(15.0, 30.0)],
        'conversions': [np.random.randint(0, 3)],
        'revenue': [np.random.uniform(0, 400.0) if np.random.rand() > 0.5 else 0],
        'account_id': [account_id or 'act_demo'],
    }
    return pd.concat([pd.DataFrame(main_ad), pd.DataFrame(test_ad_A), pd.DataFrame(test_ad_B)], ignore_index=True)

def fetch_google_data(start_date: str, end_date: str) -> pd.DataFrame:
    data = {'report_date': [start_date], 'ad_id': ['GOOG_AD02'], 'campaign_id': ['GOOG_C02'], 'impressions': [np.random.randint(8000, 20000)], 'reach': [0], 'frequency': [1.0], 'clicks': [np.random.randint(200, 600)], 'spend': [np.random.uniform(200.0, 500.0)], 'conversions': [np.random.randint(5, 15)], 'revenue': [np.random.uniform(1000.0, 8000.0)]}
    return pd.DataFrame(data)

def fetch_tiktok_data(start_date: str, end_date: str) -> pd.DataFrame:
    data = {'report_date': [start_date], 'ad_id': ['TIKTOK_AD03'], 'campaign_id': ['TIKTOK_C03'], 'impressions': [np.random.randint(15000, 40000)], 'reach': [np.random.randint(12000, 35000)], 'frequency': [np.random.uniform(2.0, 5.0)], 'clicks': [np.random.randint(150, 400)], 'spend': [np.random.uniform(150.0, 350.0)], 'conversions': [np.random.randint(2, 10)], 'revenue': [np.random.uniform(100.0, 1500.0) if np.random.rand() > 0.4 else 0]}
    return pd.DataFrame(data)

def fetch_snapchat_data(start_date: str, end_date: str) -> pd.DataFrame:
    data = {'report_date': [start_date], 'ad_id': ['SNAP_AD04'], 'campaign_id': ['SNAP_C04'], 'impressions': [np.random.randint(10000, 25000)], 'reach': [np.random.randint(8000, 20000)], 'frequency': [np.random.uniform(1.8, 4.0)], 'clicks': [np.random.randint(80, 250)], 'spend': [np.random.uniform(80.0, 200.0)], 'conversions': [np.random.randint(0, 4)], 'revenue': [np.random.uniform(0, 500.0) if np.random.rand() > 0.7 else 0]}
    return pd.DataFrame(data)

def _generate_segmented_data(start_date, ad_id, campaign_id, segments):
    all_segment_data = []
    for seg_type, seg_values in segments.items():
        for seg_value in seg_values:
            data = {'report_date': [start_date], 'ad_id': [ad_id], 'campaign_id': [campaign_id], 'segment_type': [seg_type], 'segment_value': [seg_value], 'impressions': [np.random.randint(1000, 5000)], 'clicks': [np.random.randint(10, 100)], 'spend': [np.random.uniform(20.0, 100.0)], 'conversions': [np.random.randint(0, 3)], 'revenue': [np.random.uniform(0, 800.0) if np.random.rand() > 0.6 else 0]}
            all_segment_data.append(pd.DataFrame(data))
    return pd.concat(all_segment_data, ignore_index=True) if all_segment_data else pd.DataFrame()

def fetch_meta_segmented_data(start_date: str, end_date: str) -> pd.DataFrame:
    return _generate_segmented_data(start_date, 'META_AD01', 'META_C01', {'Age': ['18-24', '25-34', '35-44'], 'Gender': ['Male', 'Female'], 'Placement': ['Instagram Feed', 'Instagram Stories']})

def fetch_google_segmented_data(start_date: str, end_date: str) -> pd.DataFrame:
    return _generate_segmented_data(start_date, 'GOOG_AD02', 'GOOG_C02', {'Device': ['Mobile', 'Desktop', 'Tablet'], 'Keyword': ['buy leather sofa', 'modern couch online', 'midas furniture sale']})

def fetch_tiktok_segmented_data(start_date: str, end_date: str) -> pd.DataFrame:
    return _generate_segmented_data(start_date, 'TIKTOK_AD03', 'TIKTOK_C03', {'Age': ['18-24', '25-34'], 'Interest': ['Interior Design', 'Home Decor', 'DIY Projects']})

def fetch_snapchat_segmented_data(start_date: str, end_date: str) -> pd.DataFrame:
    return _generate_segmented_data(start_date, 'SNAP_AD04', 'SNAP_C04', {'Age': ['16-22', '23-28'], 'Region': ['Riyadh', 'Doha', 'Kuwait City']})

def fetch_country_data(start_date: str, end_date: str) -> pd.DataFrame:
    countries, platforms, all_country_data = ['KSA', 'Qatar', 'Kuwait'], ['Meta', 'Google'], []
    for country in countries:
        for platform in platforms:
            spend_multiplier, revenue_multiplier = {'KSA': 1.5, 'Qatar': 1.1, 'Kuwait': 0.9}[country], {'KSA': 1.6, 'Qatar': 1.3, 'Kuwait': 0.8}[country]
            data = {'report_date': [start_date], 'platform': [platform], 'country': [country], 'impressions': [int(np.random.randint(20000, 50000) * spend_multiplier)], 'clicks': [int(np.random.randint(200, 600) * spend_multiplier)], 'spend': [np.random.uniform(300.0, 700.0) * spend_multiplier], 'conversions': [int(np.random.randint(10, 30) * revenue_multiplier)], 'revenue': [np.random.uniform(2000.0, 6000.0) * revenue_multiplier]}
            all_country_data.append(pd.DataFrame(data))
    return pd.concat(all_country_data, ignore_index=True) if all_country_data else pd.DataFrame()

def fetch_customer_sales_data(run_date_str: str):
    num_sales, customers, sales_data = np.random.randint(5, 20), [f'CUST_{i}' for i in range(100)], []
    for _ in range(num_sales):
        sales_data.append({'customer_id': np.random.choice(customers), 'sale_date': run_date_str, 'sale_amount': np.random.uniform(150.0, 3500.0)})
    return pd.DataFrame(sales_data)