# meta_api.py
# Meta (Facebook) Ads API Integration with Multi-Account Support

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Try to import Meta SDK
try:
    from facebook_business.api import FacebookAdsApi
    from facebook_business.adobjects.adaccount import AdAccount
    from facebook_business.adobjects.campaign import Campaign
    from facebook_business.adobjects.adset import AdSet
    from facebook_business.adobjects.ad import Ad
    from facebook_business.adobjects.adsinsights import AdsInsights
    META_SDK_AVAILABLE = True
except ImportError:
    META_SDK_AVAILABLE = False
    logger.warning("facebook-business SDK not installed. Using mock data.")

# Import config module (not values - to allow dynamic reading)
import sys
sys.path.insert(0, '.')
import config


def get_config_values():
    """Get fresh config values (supports Streamlit secrets reloading)."""
    # Re-import to get fresh values from Streamlit secrets
    import importlib
    importlib.reload(config)
    return {
        'access_token': config.META_ACCESS_TOKEN,
        'ad_accounts': config.META_AD_ACCOUNTS,
        'account_names': config.META_ACCOUNT_NAMES,
        'use_live_data': config.USE_LIVE_META_DATA,
    }


class MetaAdsClient:
    """
    Multi-account Meta Ads API client.
    Supports fetching data from multiple ad accounts with a single access token.
    """

    # Standard fields to fetch for insights
    # NOTE: Cost/spend metrics excluded (spend, cpc, cpm, cost_per_conversion, purchase_roas)
    INSIGHT_FIELDS = [
        'account_id',
        'account_name',
        'campaign_id',
        'campaign_name',
        'adset_id',
        'adset_name',
        'ad_id',
        'ad_name',
        'impressions',
        'reach',
        'frequency',
        'clicks',
        'unique_clicks',
        'ctr',
        'conversions',
        'actions',
        'action_values',
        'date_start',
        'date_stop',
    ]

    # Breakdown fields for segmented data
    BREAKDOWN_FIELDS = {
        'age_gender': ['age', 'gender'],
        'placement': ['publisher_platform', 'platform_position'],
        'device': ['device_platform'],
        'country': ['country'],
        'region': ['region'],
    }

    def __init__(self, access_token: str = None, account_ids: List[str] = None):
        """
        Initialize the Meta Ads client.

        Args:
            access_token: Meta API access token (uses config if not provided)
            account_ids: List of ad account IDs (uses config if not provided)
        """
        # Get fresh config values
        cfg = get_config_values()

        self.access_token = access_token or cfg['access_token']
        self.account_ids = account_ids or cfg['ad_accounts']
        self.account_names = cfg['account_names']
        self.use_live_data = cfg['use_live_data']
        self.initialized = False

        if META_SDK_AVAILABLE and self.access_token and self.use_live_data:
            try:
                FacebookAdsApi.init(access_token=self.access_token)
                self.initialized = True
                logger.info(f"Meta API initialized with {len(self.account_ids)} accounts")
            except Exception as e:
                logger.error(f"Failed to initialize Meta API: {e}")
                self.initialized = False

    def get_account_name(self, account_id: str) -> str:
        """Get friendly name for an account ID."""
        return self.account_names.get(account_id, account_id)

    def fetch_account_info(self, account_id: str) -> Dict[str, Any]:
        """
        Fetch account information.

        Args:
            account_id: The ad account ID (format: act_XXXXXXXXXX)

        Returns:
            Dictionary with account details
        """
        if not self.initialized:
            return self._mock_account_info(account_id)

        try:
            account = AdAccount(account_id)
            # NOTE: Cost/spend metrics excluded (spend_cap, amount_spent, balance)
            info = account.api_get(fields=[
                'name',
                'account_id',
                'account_status',
                'currency',
                'timezone_name',
                'business_name',
            ])
            return dict(info)
        except Exception as e:
            logger.error(f"Error fetching account info for {account_id}: {e}")
            return {'account_id': account_id, 'error': str(e)}

    def fetch_all_accounts_info(self) -> List[Dict[str, Any]]:
        """Fetch info for all configured accounts."""
        results = []
        for account_id in self.account_ids:
            info = self.fetch_account_info(account_id)
            info['friendly_name'] = self.get_account_name(account_id)
            results.append(info)
        return results

    def fetch_insights(
        self,
        account_id: str,
        start_date: str,
        end_date: str,
        level: str = 'ad',
        breakdown: str = None,
        time_increment: str = '1',
    ) -> pd.DataFrame:
        """
        Fetch insights for a specific account.

        Args:
            account_id: The ad account ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            level: Data level (account, campaign, adset, ad)
            breakdown: Optional breakdown type (age_gender, placement, device, country)
            time_increment: Time grouping (1=daily, 7=weekly, 'monthly')

        Returns:
            DataFrame with insights data
        """
        if not self.initialized:
            return self._mock_insights(account_id, start_date, end_date, level)

        try:
            account = AdAccount(account_id)

            params = {
                'time_range': {
                    'since': start_date,
                    'until': end_date,
                },
                'level': level,
                'time_increment': time_increment,
            }

            # Add breakdown if specified
            if breakdown and breakdown in self.BREAKDOWN_FIELDS:
                params['breakdowns'] = self.BREAKDOWN_FIELDS[breakdown]

            insights = account.get_insights(
                fields=self.INSIGHT_FIELDS,
                params=params,
            )

            # Convert to DataFrame
            data = [dict(insight) for insight in insights]
            df = pd.DataFrame(data)

            if df.empty:
                return df

            # Process actions and action_values
            df = self._process_actions(df)

            # Add account friendly name
            df['account_friendly_name'] = self.get_account_name(account_id)

            return df

        except Exception as e:
            logger.error(f"Error fetching insights for {account_id}: {e}")
            return pd.DataFrame()

    def fetch_all_accounts_insights(
        self,
        start_date: str,
        end_date: str,
        level: str = 'ad',
        breakdown: str = None,
    ) -> pd.DataFrame:
        """
        Fetch insights from all configured accounts.

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            level: Data level
            breakdown: Optional breakdown

        Returns:
            Combined DataFrame from all accounts
        """
        all_data = []

        for account_id in self.account_ids:
            logger.info(f"Fetching data for account: {account_id}")
            df = self.fetch_insights(
                account_id=account_id,
                start_date=start_date,
                end_date=end_date,
                level=level,
                breakdown=breakdown,
            )
            if not df.empty:
                all_data.append(df)

        if not all_data:
            return pd.DataFrame()

        return pd.concat(all_data, ignore_index=True)

    def fetch_campaigns(self, account_id: str) -> pd.DataFrame:
        """Fetch all campaigns for an account."""
        if not self.initialized:
            return self._mock_campaigns(account_id)

        try:
            account = AdAccount(account_id)
            # NOTE: Cost/spend/budget metrics excluded (daily_budget, lifetime_budget, budget_remaining)
            campaigns = account.get_campaigns(
                fields=[
                    'id',
                    'name',
                    'status',
                    'effective_status',
                    'objective',
                    'created_time',
                    'start_time',
                    'stop_time',
                ],
                params={'limit': 500}
            )

            data = [dict(campaign) for campaign in campaigns]
            df = pd.DataFrame(data)
            df['account_id'] = account_id
            df['account_friendly_name'] = self.get_account_name(account_id)

            return df

        except Exception as e:
            logger.error(f"Error fetching campaigns for {account_id}: {e}")
            return pd.DataFrame()

    def fetch_all_campaigns(self) -> pd.DataFrame:
        """Fetch campaigns from all accounts."""
        all_campaigns = []

        for account_id in self.account_ids:
            df = self.fetch_campaigns(account_id)
            if not df.empty:
                all_campaigns.append(df)

        if not all_campaigns:
            return pd.DataFrame()

        return pd.concat(all_campaigns, ignore_index=True)

    def _process_actions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process the actions column to extract specific action types."""
        if 'actions' not in df.columns:
            return df

        # Extract common action types
        action_types = ['purchase', 'add_to_cart', 'lead', 'complete_registration', 'link_click']

        for action_type in action_types:
            df[f'action_{action_type}'] = df['actions'].apply(
                lambda x: self._get_action_value(x, action_type) if pd.notna(x) else 0
            )

        # Process action values (revenue)
        if 'action_values' in df.columns:
            df['purchase_value'] = df['action_values'].apply(
                lambda x: self._get_action_value(x, 'purchase') if pd.notna(x) else 0
            )

        return df

    @staticmethod
    def _get_action_value(actions: list, action_type: str) -> float:
        """Extract value for a specific action type."""
        if not actions:
            return 0

        for action in actions:
            if action.get('action_type') == action_type:
                return float(action.get('value', 0))

        return 0

    # =========================================================================
    # MOCK DATA METHODS (used when API is not available)
    # =========================================================================

    def _mock_account_info(self, account_id: str) -> Dict[str, Any]:
        """Generate mock account info."""
        # NOTE: Cost/spend metrics excluded (amount_spent)
        return {
            'account_id': account_id,
            'name': self.get_account_name(account_id) or f'Account {account_id[-6:]}',
            'account_status': 1,
            'currency': 'USD',
            'timezone_name': 'Asia/Riyadh',
            'business_name': 'Demo Business',
        }

    def _mock_insights(
        self,
        account_id: str,
        start_date: str,
        end_date: str,
        level: str,
    ) -> pd.DataFrame:
        """Generate mock insights data."""
        from faker import Faker
        fake = Faker()

        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        days = (end - start).days + 1

        data = []
        num_records = min(days * 3, 100)  # Simulate multiple ads

        campaigns = [f'Campaign_{i}' for i in range(1, 4)]
        adsets = [f'AdSet_{i}' for i in range(1, 7)]
        ads = [f'Ad_{i}' for i in range(1, 13)]

        for i in range(num_records):
            date = start + timedelta(days=i % days)
            impressions = np.random.randint(1000, 50000)
            clicks = int(impressions * np.random.uniform(0.01, 0.05))
            conversions = int(clicks * np.random.uniform(0.02, 0.15))

            # NOTE: Cost/spend metrics excluded (spend, cpc, cpm, cost_per_conversion, purchase_roas, revenue)
            data.append({
                'account_id': account_id,
                'account_name': self.get_account_name(account_id),
                'campaign_id': f'{account_id}_{np.random.choice(campaigns)}',
                'campaign_name': np.random.choice(campaigns),
                'adset_id': f'{account_id}_{np.random.choice(adsets)}',
                'adset_name': np.random.choice(adsets),
                'ad_id': f'{account_id}_{np.random.choice(ads)}',
                'ad_name': np.random.choice(ads),
                'date_start': date.strftime('%Y-%m-%d'),
                'date_stop': date.strftime('%Y-%m-%d'),
                'impressions': impressions,
                'reach': int(impressions * np.random.uniform(0.7, 0.95)),
                'frequency': np.random.uniform(1.1, 3.5),
                'clicks': clicks,
                'unique_clicks': int(clicks * np.random.uniform(0.85, 0.98)),
                'ctr': round((clicks / impressions) * 100, 2),
                'conversions': conversions,
                'account_friendly_name': self.get_account_name(account_id),
            })

        return pd.DataFrame(data)

    def _mock_campaigns(self, account_id: str) -> pd.DataFrame:
        """Generate mock campaign data."""
        # NOTE: Cost/spend/budget metrics excluded (daily_budget, lifetime_budget, budget_remaining)
        campaigns = []
        statuses = ['ACTIVE', 'PAUSED', 'ACTIVE', 'ACTIVE']
        objectives = ['CONVERSIONS', 'TRAFFIC', 'BRAND_AWARENESS', 'LEAD_GENERATION']

        for i in range(np.random.randint(3, 8)):
            campaigns.append({
                'id': f'{account_id}_campaign_{i}',
                'name': f'Campaign {i + 1} - {np.random.choice(objectives)}',
                'status': np.random.choice(statuses),
                'effective_status': np.random.choice(statuses),
                'objective': np.random.choice(objectives),
                'account_id': account_id,
                'account_friendly_name': self.get_account_name(account_id),
            })

        return pd.DataFrame(campaigns)


# =============================================================================
# CONVENIENCE FUNCTIONS (for backward compatibility)
# =============================================================================

def get_meta_client() -> MetaAdsClient:
    """Get a configured Meta Ads client instance."""
    return MetaAdsClient()


def fetch_meta_live_data(start_date: str, end_date: str, account_id: str = None) -> pd.DataFrame:
    """
    Fetch Meta data for specified date range.

    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        account_id: Specific account ID (optional, fetches all if not provided)

    Returns:
        DataFrame with insights data
    """
    client = get_meta_client()

    if account_id:
        return client.fetch_insights(account_id, start_date, end_date)
    else:
        return client.fetch_all_accounts_insights(start_date, end_date)


def fetch_meta_campaigns(account_id: str = None) -> pd.DataFrame:
    """
    Fetch Meta campaigns.

    Args:
        account_id: Specific account ID (optional, fetches all if not provided)

    Returns:
        DataFrame with campaign data
    """
    client = get_meta_client()

    if account_id:
        return client.fetch_campaigns(account_id)
    else:
        return client.fetch_all_campaigns()


def get_available_accounts() -> List[Dict[str, str]]:
    """
    Get list of available ad accounts.

    Returns:
        List of dicts with account_id and name
    """
    client = get_meta_client()
    return [
        {
            'account_id': acc_id,
            'name': client.get_account_name(acc_id),
        }
        for acc_id in client.account_ids
    ]
