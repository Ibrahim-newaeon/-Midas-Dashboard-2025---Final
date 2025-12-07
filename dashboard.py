"""
Digital Media Buying Dashboard - al-ai.ai
Version: 3.0 - New Design with Multi-Account Support
"""

import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple, Optional
import plotly.express as px
import plotly.graph_objects as go
import admin_page as admin
import app_utils
from app_utils import (
    render_header_banner,
    render_kpi_card,
    render_alert,
    render_footer,
    PLOTLY_COLORS,
)

# Multi-Account Support
from app.ui_components.account_selector import (
    render_account_selector,
    render_data_source_indicator,
    init_account_session_state,
)
from app.data_integration.meta_api import get_available_accounts, fetch_meta_live_data, get_meta_client

# =============================
# PAGE CONFIG & STYLE
# =============================

st.set_page_config(
    page_title="al-ai.ai | Digital Media Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

app_utils.apply_custom_css()

PLOTLY_TEMPLATE = app_utils.PLOTLY_TEMPLATE
PLOTLY_CONFIG = app_utils.PLOTLY_CONFIG

# =============================
# DATA LOADING
# =============================

@st.cache_data(ttl=3600)
def load_campaign_data(start_date: str = None, end_date: str = None, account_id: str = None) -> pd.DataFrame:
    """
    Load campaign data from Meta API.
    Falls back to demo data if API is not configured or fails.
    """
    # Default date range: last 30 days
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    # Try to fetch from Meta API
    try:
        df = fetch_meta_live_data(start_date, end_date, account_id)

        if not df.empty:
            # Normalize column names for dashboard compatibility
            df = df.rename(columns={
                'campaign_name': 'campaign_name',
                'account_friendly_name': 'account_name',
                'date_start': 'date',
            })

            # Ensure date column exists and is datetime
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
            elif 'date_start' in df.columns:
                df['date'] = pd.to_datetime(df['date_start'])

            # Add platform column (all Meta data)
            df['platform'] = 'Meta Ads'

            # Add region column (default, can be enhanced with geo breakdown)
            df['region'] = 'Saudi Arabia'

            # Ensure required columns exist
            for col in ['impressions', 'clicks', 'spend', 'conversions', 'revenue']:
                if col not in df.columns:
                    df[col] = 0

            # Calculate derived metrics
            df['roas'] = (df['revenue'] / df['spend']).replace([np.inf, -np.inf], 0).fillna(0)
            df['cpa'] = (df['spend'] / df['conversions']).replace([np.inf, -np.inf], 0).fillna(0)
            df['ctr'] = (df['clicks'] / df['impressions'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
            df['cpc'] = (df['spend'] / df['clicks']).replace([np.inf, -np.inf], 0).fillna(0)
            df['cpm'] = (df['spend'] / df['impressions'] * 1000).replace([np.inf, -np.inf], 0).fillna(0)

            return df
    except Exception as e:
        st.warning(f"Could not fetch Meta API data: {e}. Using demo data.")

    # Fallback to demo data
    return _generate_demo_data()


def _generate_demo_data() -> pd.DataFrame:
    """Generate demo data when API is not available."""
    now = datetime.now()
    dates = pd.date_range(start=now - timedelta(days=90), end=now, freq="D")
    campaigns = [
        "FB_Furniture_SAU_Ret_001",
        "GGL_Search_SAU_Conv_045",
        "TT_Feed_UAE_Pros_022",
        "META_Bedroom_KSA_Ret_089",
        "GGL_Shopping_UAE_Conv_033",
        "SNAP_Story_QAT_Aware_015",
        "FB_Living_KWT_Ret_067",
        "TT_TopView_SAU_Brand_012"
    ]
    rng = np.random.default_rng(42)

    rows = []
    for date in dates:
        for campaign in campaigns:
            # Determine platform based on campaign prefix
            if campaign.startswith("FB") or campaign.startswith("META"):
                platform = "Meta Ads"
            elif campaign.startswith("GGL"):
                platform = "Google Ads"
            elif campaign.startswith("TT"):
                platform = "TikTok Ads"
            else:
                platform = "Snapchat Ads"

            # Determine region based on campaign suffix
            if "SAU" in campaign or "KSA" in campaign:
                region = "Saudi Arabia"
            elif "UAE" in campaign:
                region = "UAE"
            elif "QAT" in campaign:
                region = "Qatar"
            else:
                region = "Kuwait"

            spend = rng.uniform(500, 2500)
            impressions = int(spend * rng.uniform(800, 1200))
            clicks = max(1, int(impressions * rng.uniform(0.015, 0.045)))
            conversions = max(0, int(clicks * rng.uniform(0.03, 0.10)))
            revenue = conversions * rng.uniform(150, 450)

            rows.append({
                'date': date,
                'campaign_name': campaign,
                'platform': platform,
                'region': region,
                'spend': spend,
                'impressions': impressions,
                'clicks': clicks,
                'conversions': conversions,
                'revenue': revenue
            })

    df = pd.DataFrame(rows)
    df['roas'] = (df['revenue'] / df['spend']).replace([np.inf, -np.inf], 0).fillna(0)
    df['cpa'] = (df['spend'] / df['conversions']).replace([np.inf, -np.inf], 0).fillna(0)
    df['ctr'] = (df['clicks'] / df['impressions'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    df['cpc'] = (df['spend'] / df['clicks']).replace([np.inf, -np.inf], 0).fillna(0)
    df['cpm'] = (df['spend'] / df['impressions'] * 1000).replace([np.inf, -np.inf], 0).fillna(0)
    return df

# =============================
# SIDEBAR
# =============================

def render_sidebar_filters() -> Tuple[List[str], List[str], Tuple, Optional[str]]:
    """Render sidebar filters without requiring df initially."""
    # Logo
    st.sidebar.markdown('<div class="sidebar-logo">al-ai.ai</div>', unsafe_allow_html=True)

    # Data source indicator
    render_data_source_indicator()

    st.sidebar.markdown("---")

    # Ad Account Selector
    st.sidebar.markdown('<h3 class="sidebar-header">📊 Ad Account</h3>', unsafe_allow_html=True)
    account_label, selected_account_id = render_account_selector(
        key="main_account_selector",
        show_all_option=True,
        sidebar=True,
    )

    # Date Range
    st.sidebar.markdown('<h3 class="sidebar-header">📅 Date Range</h3>', unsafe_allow_html=True)
    now = datetime.now()
    min_date = now - timedelta(days=90)
    max_date = now
    date_range = st.sidebar.date_input(
        "Select dates",
        value=(now - timedelta(days=30), now),
        min_value=min_date,
        max_value=max_date,
        label_visibility="collapsed"
    )

    # Platform Filter (Meta is the only platform for now with live API)
    st.sidebar.markdown('<h3 class="sidebar-header">🔧 Platform Filter</h3>', unsafe_allow_html=True)
    platforms = ["Meta Ads", "Google Ads", "TikTok Ads", "Snapchat Ads"]
    selected_platforms = st.sidebar.multiselect(
        "Select platforms",
        platforms,
        default=["Meta Ads"],
        label_visibility="collapsed"
    )

    # Region Filter
    st.sidebar.markdown('<h3 class="sidebar-header">🌍 Region</h3>', unsafe_allow_html=True)
    regions = ["Saudi Arabia", "UAE", "Qatar", "Kuwait"]
    selected_regions = st.sidebar.multiselect(
        "Select regions",
        regions,
        default=regions,
        label_visibility="collapsed"
    )

    # Refresh button
    if st.sidebar.button("🔄 Refresh Data", use_container_width=True):
        st.cache_data.clear()
        st.rerun()

    return selected_platforms, selected_regions, date_range, selected_account_id

# =============================
# MAIN DASHBOARD
# =============================

def render_dashboard(df: pd.DataFrame, selected_platforms: List[str], selected_regions: List[str], date_range):
    # Filter data
    if isinstance(date_range, tuple) and len(date_range) == 2:
        start_date, end_date = date_range
        df = df[(df['date'] >= pd.Timestamp(start_date)) & (df['date'] <= pd.Timestamp(end_date))]

    df = df[df['platform'].isin(selected_platforms)]
    df = df[df['region'].isin(selected_regions)]

    # Header Banner
    last_updated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    render_header_banner(
        "📊 Digital Media Buying Performance Dashboard",
        f"Last Updated: {last_updated} | Data Source: Sample Data (Demo)"
    )

    # Tabs
    tabs = st.tabs(["📈 Overview", "🎯 Platform Deep-Dive", "💰 Budget Optimizer", "🚨 Alerts & Insights", "📊 Detailed Reports"])

    with tabs[0]:
        render_overview_tab(df)

    with tabs[1]:
        render_platform_tab(df)

    with tabs[2]:
        render_budget_tab(df)

    with tabs[3]:
        render_alerts_tab(df)

    with tabs[4]:
        render_reports_tab(df)

    # Footer
    render_footer()

def render_overview_tab(df: pd.DataFrame):
    # KPI Cards
    total_spend = df['spend'].sum()
    total_revenue = df['revenue'].sum()
    total_roas = total_revenue / total_spend if total_spend > 0 else 0
    total_conversions = df['conversions'].sum()
    avg_cpa = total_spend / total_conversions if total_conversions > 0 else 0
    avg_ctr = df['ctr'].mean()

    # KPI Row
    cols = st.columns(6)
    with cols[0]:
        render_kpi_card("💰 Total Spend", f"${total_spend:,.2f}", "+12.4% vs last period")
    with cols[1]:
        render_kpi_card("💵 Total Revenue", f"${total_revenue:,.2f}", "+18.7% vs last period")
    with cols[2]:
        render_kpi_card("📊 ROAS", f"{total_roas:.2f}x", "+0.35x vs target")
    with cols[3]:
        render_kpi_card("🎯 Conversions", f"{total_conversions:,}", "+15.2% vs last period")
    with cols[4]:
        render_kpi_card("💳 CPA", f"${avg_cpa:.2f}", "-$5.12", delta_negative=True)
    with cols[5]:
        render_kpi_card("👆 CTR", f"{avg_ctr:.2f}%", "+0.38%")

    st.markdown("<hr>", unsafe_allow_html=True)

    # Charts Row 1
    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="chart-container"><h3>📊 Platform Performance Comparison</h3>', unsafe_allow_html=True)
        platform_data = df.groupby('platform').agg({'spend': 'sum', 'revenue': 'sum'}).reset_index()
        fig = px.bar(
            platform_data,
            x='platform',
            y='revenue',
            color='platform',
            color_discrete_map=PLOTLY_COLORS['platforms'],
            template=PLOTLY_TEMPLATE
        )
        fig.update_layout(
            margin=dict(l=0, r=0, t=10, b=0),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            showlegend=False,
            xaxis_title="",
            yaxis_title="Revenue ($)"
        )
        st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CONFIG)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="chart-container"><h3>🎯 ROAS by Platform</h3>', unsafe_allow_html=True)
        platform_roas = df.groupby('platform').apply(
            lambda x: x['revenue'].sum() / x['spend'].sum() if x['spend'].sum() > 0 else 0
        ).reset_index(name='roas')
        fig = px.bar(
            platform_roas,
            x='platform',
            y='roas',
            color='roas',
            color_continuous_scale=['#d62728', '#ffc107', '#2ca02c'],
            template=PLOTLY_TEMPLATE
        )
        fig.add_hline(y=2.0, line_dash="dash", line_color="#d62728", annotation_text="Target: 2.0x")
        fig.update_layout(
            margin=dict(l=0, r=0, t=10, b=0),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            showlegend=False,
            xaxis_title="",
            yaxis_title="ROAS"
        )
        st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CONFIG)
        st.markdown('</div>', unsafe_allow_html=True)

    # Charts Row 2
    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="chart-container"><h3>📈 Daily Performance Trend</h3>', unsafe_allow_html=True)
        daily_data = df.groupby('date').agg({'spend': 'sum', 'revenue': 'sum'}).reset_index()
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=daily_data['date'], y=daily_data['spend'], name='Spend', line=dict(color='#1f77b4')))
        fig.add_trace(go.Scatter(x=daily_data['date'], y=daily_data['revenue'], name='Revenue', line=dict(color='#2ca02c')))
        fig.update_layout(
            margin=dict(l=0, r=0, t=10, b=0),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            template=PLOTLY_TEMPLATE,
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CONFIG)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="chart-container"><h3>🌍 Performance by Region</h3>', unsafe_allow_html=True)
        region_data = df.groupby('region').agg({'spend': 'sum'}).reset_index()
        fig = px.pie(
            region_data,
            values='spend',
            names='region',
            color_discrete_sequence=['#1f77b4', '#2ca02c', '#ff7f0e', '#d62728'],
            hole=0.4,
            template=PLOTLY_TEMPLATE
        )
        fig.update_layout(
            margin=dict(l=0, r=0, t=10, b=0),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CONFIG)
        st.markdown('</div>', unsafe_allow_html=True)

    # Top Campaigns Table
    st.markdown('<div class="chart-container"><h3>📋 Top Performing Campaigns</h3>', unsafe_allow_html=True)
    top_campaigns = df.groupby(['campaign_name', 'platform']).agg({
        'spend': 'sum',
        'revenue': 'sum',
        'conversions': 'sum',
        'clicks': 'sum',
        'impressions': 'sum'
    }).reset_index()
    top_campaigns['roas'] = top_campaigns['revenue'] / top_campaigns['spend']
    top_campaigns['cpa'] = top_campaigns['spend'] / top_campaigns['conversions'].replace(0, 1)
    top_campaigns['ctr'] = (top_campaigns['clicks'] / top_campaigns['impressions'] * 100).round(2)
    top_campaigns = top_campaigns.sort_values('revenue', ascending=False).head(10)

    display_df = top_campaigns[['campaign_name', 'platform', 'spend', 'revenue', 'roas', 'cpa', 'conversions', 'ctr']].copy()
    display_df.columns = ['Campaign Name', 'Platform', 'Spend', 'Revenue', 'ROAS', 'CPA', 'Conversions', 'CTR']
    display_df['Spend'] = display_df['Spend'].apply(lambda x: f"${x:,.2f}")
    display_df['Revenue'] = display_df['Revenue'].apply(lambda x: f"${x:,.2f}")
    display_df['ROAS'] = display_df['ROAS'].apply(lambda x: f"{x:.2f}x")
    display_df['CPA'] = display_df['CPA'].apply(lambda x: f"${x:.2f}")
    display_df['CTR'] = display_df['CTR'].apply(lambda x: f"{x:.1f}%")

    st.dataframe(display_df, use_container_width=True, hide_index=True)
    st.markdown('</div>', unsafe_allow_html=True)

def render_platform_tab(df: pd.DataFrame):
    st.subheader("Platform Deep-Dive Analysis")

    selected_platform = st.selectbox("Select Platform", df['platform'].unique())
    platform_df = df[df['platform'] == selected_platform]

    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="chart-container"><h3>CTR vs CPM Analysis</h3>', unsafe_allow_html=True)
        fig = px.scatter(
            platform_df.groupby('campaign_name').agg({
                'cpm': 'mean', 'ctr': 'mean', 'impressions': 'sum'
            }).reset_index(),
            x='cpm',
            y='ctr',
            size='impressions',
            color='ctr',
            color_continuous_scale='RdYlGn',
            template=PLOTLY_TEMPLATE
        )
        fig.update_layout(
            margin=dict(l=0, r=0, t=10, b=0),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CONFIG)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="chart-container"><h3>CPA Trend</h3>', unsafe_allow_html=True)
        daily_cpa = platform_df.groupby('date').apply(
            lambda x: x['spend'].sum() / x['conversions'].sum() if x['conversions'].sum() > 0 else 0
        ).reset_index(name='cpa')
        fig = px.line(daily_cpa, x='date', y='cpa', template=PLOTLY_TEMPLATE)
        fig.update_traces(line_color='#1f77b4')
        fig.update_layout(
            margin=dict(l=0, r=0, t=10, b=0),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CONFIG)
        st.markdown('</div>', unsafe_allow_html=True)

def render_budget_tab(df: pd.DataFrame):
    st.subheader("Budget Optimizer")
    st.info("💡 Budget optimization recommendations based on current performance")

    platform_perf = df.groupby('platform').agg({
        'spend': 'sum',
        'revenue': 'sum',
        'conversions': 'sum'
    }).reset_index()
    platform_perf['roas'] = platform_perf['revenue'] / platform_perf['spend']
    platform_perf['recommendation'] = platform_perf['roas'].apply(
        lambda x: "🟢 Scale Up 30%" if x > 2.5 else ("🟡 Maintain" if x > 1.5 else "🔴 Reduce 20%")
    )

    st.dataframe(platform_perf, use_container_width=True, hide_index=True)

def render_alerts_tab(df: pd.DataFrame):
    st.subheader("🚨 Recent Alerts")

    # Calculate alerts
    platform_roas = df.groupby('platform').apply(
        lambda x: x['revenue'].sum() / x['spend'].sum() if x['spend'].sum() > 0 else 0
    )
    high_performers = platform_roas[platform_roas > 2.5]
    low_performers = platform_roas[platform_roas < 1.5]

    avg_cpa = df['spend'].sum() / df['conversions'].sum() if df['conversions'].sum() > 0 else 0

    # Good alerts
    if len(high_performers) > 0:
        render_alert(
            "good",
            f"🟢 {len(high_performers)} High-Performance Platforms Identified",
            f"Excellent ROAS (avg {high_performers.mean():.2f}x) across {', '.join(high_performers.index)}",
            "Scale these platforms by 30-50%"
        )

    # Warning alerts
    render_alert(
        "warning",
        "🟡 High CPA Detected in Some Campaigns",
        f"Average CPA is ${avg_cpa:.2f}. Some campaigns exceed target.",
        "Optimize landing pages, refine targeting"
    )

    # Critical alerts
    if len(low_performers) > 0:
        render_alert(
            "critical",
            f"🔴 {len(low_performers)} Platforms Below Target ROAS",
            f"Platforms with ROAS below 1.5x: {', '.join(low_performers.index)}",
            "Pause lowest performers immediately"
        )

def render_reports_tab(df: pd.DataFrame):
    st.subheader("📊 Detailed Reports")

    report_type = st.selectbox("Select Report Type", [
        "Campaign Performance Summary",
        "Platform Comparison",
        "Regional Analysis",
        "Daily Trends"
    ])

    if report_type == "Campaign Performance Summary":
        st.dataframe(df.groupby('campaign_name').agg({
            'spend': 'sum',
            'revenue': 'sum',
            'conversions': 'sum',
            'clicks': 'sum'
        }).round(2), use_container_width=True)
    elif report_type == "Platform Comparison":
        st.dataframe(df.groupby('platform').agg({
            'spend': 'sum',
            'revenue': 'sum',
            'conversions': 'sum',
            'roas': 'mean'
        }).round(2), use_container_width=True)
    elif report_type == "Regional Analysis":
        st.dataframe(df.groupby('region').agg({
            'spend': 'sum',
            'revenue': 'sum',
            'conversions': 'sum'
        }).round(2), use_container_width=True)
    else:
        st.dataframe(df.groupby('date').agg({
            'spend': 'sum',
            'revenue': 'sum'
        }).round(2), use_container_width=True)

# =============================
# AUTHENTICATION
# =============================

def login_page():
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("<div class='login-container'>", unsafe_allow_html=True)
        st.markdown('<div class="sidebar-logo" style="margin-bottom: 20px;">al-ai.ai</div>', unsafe_allow_html=True)
        st.title("🔐 Login")
        st.markdown("Please sign in to continue")

        username = st.text_input("Username")
        password = st.text_input("Password", type="password")

        if st.button("Login", use_container_width=True):
            user = next((u for u in st.session_state.users if u['username'] == username and u.get('password') == password), None)
            if user:
                if user['status'] != 'Active':
                    st.error("Account is inactive.")
                else:
                    st.session_state.logged_in = True
                    st.session_state.user_role = user['role']
                    st.session_state.username = user['username']
                    user['last_login'] = datetime.now().strftime('%Y-%m-%d %H:%M')
                    st.success("Logged in successfully!")
                    st.rerun()
            else:
                st.error("Invalid username or password")
        st.markdown("</div>", unsafe_allow_html=True)

# =============================
# MAIN
# =============================

def main():
    admin.initialize_admin_state()
    init_account_session_state()

    if 'logged_in' not in st.session_state:
        st.session_state.logged_in = False

    if not st.session_state.logged_in:
        login_page()
        return

    # Logged in user info
    st.sidebar.markdown("---")
    st.sidebar.markdown(f"👤 **{st.session_state.username}**")
    if st.sidebar.button("Logout", key="logout_btn"):
        st.session_state.logged_in = False
        st.rerun()

    # Render sidebar first to get filters
    selected_platforms, selected_regions, date_range, selected_account_id = render_sidebar_filters()
    st.session_state.selected_account_id = selected_account_id

    # Load data based on selected account and date range
    with st.spinner("Loading data from Meta API..."):
        start_date = None
        end_date = None
        if isinstance(date_range, tuple) and len(date_range) == 2:
            start_date = date_range[0].strftime('%Y-%m-%d')
            end_date = date_range[1].strftime('%Y-%m-%d')

        df = load_campaign_data(start_date, end_date, selected_account_id)

    render_dashboard(df, selected_platforms, selected_regions, date_range)

if __name__ == "__main__":
    main()
