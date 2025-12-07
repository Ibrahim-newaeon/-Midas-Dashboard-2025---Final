# account_selector.py
# Multi-Account Selector UI Component for Streamlit

import streamlit as st
from typing import List, Dict, Optional, Tuple
import pandas as pd

# Import Meta API client
import sys
sys.path.insert(0, '.')
from app.data_integration.meta_api import (
    get_meta_client,
    get_available_accounts,
    fetch_meta_live_data,
    fetch_meta_campaigns,
    get_config_values,
)


def render_account_selector(
    key: str = "account_selector",
    show_all_option: bool = True,
    sidebar: bool = True,
) -> Tuple[str, Optional[str]]:
    """
    Render account selector dropdown.

    Args:
        key: Unique key for the widget
        show_all_option: Whether to include "All Accounts" option
        sidebar: Whether to render in sidebar

    Returns:
        Tuple of (selected_option_label, selected_account_id or None for all)
    """
    container = st.sidebar if sidebar else st

    # Get available accounts
    accounts = get_available_accounts()

    if not accounts:
        container.warning("No ad accounts configured. Please set META_AD_ACCOUNTS environment variable.")
        return ("No Accounts", None)

    # Build options
    options = {}
    if show_all_option:
        options["All Accounts"] = None

    for acc in accounts:
        label = acc['name'] if acc['name'] != acc['account_id'] else f"Account {acc['account_id'][-6:]}"
        options[label] = acc['account_id']

    # Render selector
    selected_label = container.selectbox(
        "Select Ad Account",
        options=list(options.keys()),
        key=key,
        help="Choose an ad account to view data for, or select 'All Accounts' to aggregate data."
    )

    return (selected_label, options[selected_label])


def render_account_cards(accounts_data: List[Dict]) -> None:
    """
    Render account info cards in a grid layout.

    Args:
        accounts_data: List of account info dictionaries
    """
    if not accounts_data:
        st.info("No account data available.")
        return

    # Create columns for cards
    cols = st.columns(min(len(accounts_data), 3))

    for idx, account in enumerate(accounts_data):
        with cols[idx % 3]:
            with st.container():
                # Account card
                st.markdown(f"""
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 1rem;
                    border-radius: 10px;
                    color: white;
                    margin-bottom: 1rem;
                ">
                    <h4 style="margin: 0; color: white;">
                        {account.get('friendly_name', account.get('name', 'Unknown'))}
                    </h4>
                    <p style="font-size: 0.8rem; opacity: 0.8; margin: 0.5rem 0;">
                        {account.get('account_id', 'N/A')}
                    </p>
                </div>
                """, unsafe_allow_html=True)

                # Account metrics
                if 'error' not in account:
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric(
                            "Currency",
                            account.get('currency', 'USD')
                        )
                    with col2:
                        spent = account.get('amount_spent', 0)
                        if isinstance(spent, (int, float)):
                            st.metric(
                                "Total Spent",
                                f"${spent:,.2f}" if spent else "$0"
                            )
                else:
                    st.error(f"Error: {account.get('error', 'Unknown error')}")


def render_account_performance_comparison(
    start_date: str,
    end_date: str,
) -> None:
    """
    Render performance comparison across all accounts.

    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
    """
    st.subheader("Account Performance Comparison")

    # Fetch data for all accounts
    with st.spinner("Loading account data..."):
        df = fetch_meta_live_data(start_date, end_date)

    if df.empty:
        st.info("No data available for the selected date range.")
        return

    # Aggregate by account
    account_metrics = df.groupby('account_friendly_name').agg({
        'impressions': 'sum',
        'clicks': 'sum',
        'spend': 'sum',
        'conversions': 'sum',
        'revenue': 'sum',
    }).reset_index()

    # Calculate derived metrics
    account_metrics['CTR'] = (account_metrics['clicks'] / account_metrics['impressions'] * 100).round(2)
    account_metrics['CPC'] = (account_metrics['spend'] / account_metrics['clicks']).round(2)
    account_metrics['ROAS'] = (account_metrics['revenue'] / account_metrics['spend']).round(2)
    account_metrics['Conv. Rate'] = (account_metrics['conversions'] / account_metrics['clicks'] * 100).round(2)

    # Display metrics table
    st.dataframe(
        account_metrics.rename(columns={
            'account_friendly_name': 'Account',
            'impressions': 'Impressions',
            'clicks': 'Clicks',
            'spend': 'Spend ($)',
            'conversions': 'Conversions',
            'revenue': 'Revenue ($)',
        }),
        use_container_width=True,
        hide_index=True,
    )

    # Visualization
    import plotly.express as px
    import plotly.graph_objects as go

    col1, col2 = st.columns(2)

    with col1:
        # Spend by account
        fig_spend = px.pie(
            account_metrics,
            values='spend',
            names='account_friendly_name',
            title='Spend Distribution',
            hole=0.4,
        )
        st.plotly_chart(fig_spend, use_container_width=True)

    with col2:
        # ROAS comparison
        fig_roas = px.bar(
            account_metrics,
            x='account_friendly_name',
            y='ROAS',
            title='ROAS by Account',
            color='ROAS',
            color_continuous_scale='RdYlGn',
        )
        fig_roas.add_hline(y=1, line_dash="dash", line_color="red", annotation_text="Break-even")
        st.plotly_chart(fig_roas, use_container_width=True)


def render_data_source_indicator() -> None:
    """Render indicator showing whether live or mock data is being used."""
    cfg = get_config_values()
    if cfg['use_live_data']:
        st.sidebar.success("🟢 Using Live Meta API Data")
    else:
        st.sidebar.info("🔵 Using Demo/Mock Data")
        st.sidebar.caption("Set USE_LIVE_META_DATA=true and configure API credentials for live data.")


def get_filtered_data(
    start_date: str,
    end_date: str,
    account_id: Optional[str] = None,
    level: str = 'ad',
) -> pd.DataFrame:
    """
    Get filtered Meta data based on account selection.

    Args:
        start_date: Start date
        end_date: End date
        account_id: Optional specific account ID (None for all accounts)
        level: Data level (account, campaign, adset, ad)

    Returns:
        Filtered DataFrame
    """
    return fetch_meta_live_data(
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
    )


# =============================================================================
# SESSION STATE HELPERS
# =============================================================================

def init_account_session_state():
    """Initialize session state for account selection."""
    if 'selected_account_id' not in st.session_state:
        st.session_state.selected_account_id = None
    if 'selected_account_label' not in st.session_state:
        st.session_state.selected_account_label = "All Accounts"


def get_selected_account() -> Tuple[str, Optional[str]]:
    """Get currently selected account from session state."""
    init_account_session_state()
    return (
        st.session_state.selected_account_label,
        st.session_state.selected_account_id,
    )


def set_selected_account(label: str, account_id: Optional[str]):
    """Set selected account in session state."""
    st.session_state.selected_account_label = label
    st.session_state.selected_account_id = account_id
