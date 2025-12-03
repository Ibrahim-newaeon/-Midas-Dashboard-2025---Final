"""
Midas Furniture Campaign Analytics Dashboard — Platform-Smart Metrics
Version: 6.1 (Streamlit 2026 Ready: Width + Config Compatibility)

- Updated to replace deprecated `use_container_width` with `width='stretch'`
- All Plotly charts use the new `config` parameter instead of deprecated keyword args
- Retains vibrant sidebar + tab color theming
"""

import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple
import plotly.express as px
import plotly.graph_objects as go
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
import admin_page as admin

# =============================
# PAGE CONFIG & STYLE
# =============================

st.set_page_config(
    page_title="Midas Analytics Platform",
    page_icon="🛋️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    [data-testid="stSidebar"] {background: linear-gradient(180deg, #0B0F1A 0%, #1C2331 100%); color: white;}
    [data-testid="stSidebar"] h1, [data-testid="stSidebar"] h2, [data-testid="stSidebar"] h3, [data-testid="stSidebar"] span {color: #f0f0f0 !important;}
    [data-testid="stMetricValue"] {color: #00A86B !important; font-weight: 700;}
    div[data-baseweb="tab"] button[aria-selected="true"]:nth-child(1) {background-color: #00A86B !important; color: white !important;}
    div[data-baseweb="tab"] button[aria-selected="true"]:nth-child(2) {background-color: #CE1126 !important; color: white !important;}
    div[data-baseweb="tab"] button[aria-selected="true"]:nth-child(3) {background-color: #0066CC !important; color: white !important;}
    .login-container {
        max-width: 400px;
        margin: auto;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    </style>
    """,
    unsafe_allow_html=True,
)

PLOTLY_TEMPLATE = "plotly_white"
PLOTLY_CONFIG = {"displaylogo": False, "modeBarButtonsToRemove": ["lasso2d", "select2d"]}

# =============================
# DATA LOADING
# =============================

@st.cache_data(ttl=3600)
def load_campaign_data() -> pd.DataFrame:
    now = datetime.now()
    dates = pd.date_range(start=now - timedelta(days=90), end=now, freq="D")
    campaigns = ["Spring Sale 2025", "Summer Collection", "Bedroom Special", "Living Room Deals", "Office Furniture"]
    platforms = ["Meta", "Google", "TikTok", "Snapchat"]
    rng = np.random.default_rng(42)

    rows = []
    for date in dates:
        for campaign in campaigns:
            for platform in platforms:
                spend = rng.uniform(500, 2000)
                impressions = int(spend * rng.uniform(800, 1200))
                clicks = max(1, int(impressions * rng.uniform(0.008, 0.035)))
                conversions = max(0, int(clicks * rng.uniform(0.02, 0.08)))
                revenue = conversions * rng.uniform(300, 800)
                rows.append({
                    'date': date, 'campaign_name': campaign, 'platform': platform,
                    'spend': spend, 'impressions': impressions, 'clicks': clicks,
                    'conversions': conversions, 'revenue': revenue
                })

    df = pd.DataFrame(rows)
    df['roas'] = (df['revenue'] / df['spend']).replace([np.inf, -np.inf], 0).fillna(0)
    df['cpa'] = (df['spend'] / df['conversions']).replace([np.inf, -np.inf], 0).fillna(0)
    df['ctr'] = (df['clicks'] / df['impressions'] * 100).replace([np.inf, -np.inf], 0).fillna(0)
    df['cpc'] = (df['spend'] / df['clicks']).replace([np.inf, -np.inf], 0).fillna(0)
    df['cpm'] = (df['spend'] / df['impressions'] * 1000).replace([np.inf, -np.inf], 0).fillna(0)
    return df

# =============================
# ML & ANALYTICS
# =============================

def train_conversion_model(df: pd.DataFrame):
    """Train a simple linear regression model for conversion prediction."""
    # Prepare features
    feature_cols = ['spend', 'impressions', 'clicks']
    X = df[feature_cols]
    y = df['conversions']

    # Simple training (on full dataset for demo purposes)
    model = LinearRegression()
    model.fit(X, y)

    return model

def detect_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """Detect anomalies in ROAS using Isolation Forest."""
    # Prepare data for anomaly detection
    data = df[['roas', 'cpa', 'ctr']].fillna(0)

    # Train Isolation Forest
    clf = IsolationForest(contamination=0.05, random_state=42)
    df['is_anomaly'] = clf.fit_predict(data)

    # -1 indicates anomaly
    anomalies = df[df['is_anomaly'] == -1].copy()
    return anomalies

# =============================
# SIDEBAR
# =============================

def render_sidebar(df: pd.DataFrame):
    st.sidebar.image("https://midasfurniture.com/logo.png", width=180)
    st.sidebar.markdown("---")
    st.sidebar.title("🧭 Navigation")

    platforms = ["All"] + sorted(df['platform'].unique().tolist())
    selected_platform = st.sidebar.selectbox("🌐 Platform", platforms, index=1)

    min_date, max_date = df['date'].min(), df['date'].max()
    date_range = st.sidebar.date_input("📅 Date Range", value=(min_date, max_date), min_value=min_date, max_value=max_date)

    campaigns = sorted(df['campaign_name'].unique().tolist())
    selected_campaigns = st.sidebar.multiselect("🎯 Campaigns", campaigns, default=campaigns)

    st.sidebar.markdown("---")
    st.sidebar.subheader("⚡ Quick Stats")
    st.sidebar.metric("Active Campaigns", f"{df['campaign_name'].nunique()}")
    st.sidebar.metric("Total Spend", f"${df['spend'].sum():,.0f}")
    avg_roas = (df['revenue'].sum() / df['spend'].sum()) if df['spend'].sum() > 0 else 0
    st.sidebar.metric("Avg ROAS", f"{avg_roas:.2f}x", delta="Target: 2.5x")

    st.sidebar.caption(f"🕐 Updated: {datetime.now().strftime('%H:%M:%S')}")
    return selected_platform, selected_campaigns, date_range

# =============================
# MAIN DASHBOARD
# =============================

def render_dashboard(df: pd.DataFrame, selected_platform: str):
    st.title("✨ Midas Campaign Analytics Dashboard")

    tabs = st.tabs(["🟩 Overview", "🟥 Platform Deep Dive", "🟦 Top Campaigns"])

    with tabs[0]:
        st.subheader("Overview Metrics")
        c1, c2 = st.columns(2)
        with c1:
            fig1 = px.bar(df, x='platform', y='revenue', color='platform', title='Revenue by Platform', template=PLOTLY_TEMPLATE)
            st.plotly_chart(fig1, width='stretch', config=PLOTLY_CONFIG)
        with c2:
            fig2 = px.line(df.groupby('date')['roas'].mean().reset_index(), x='date', y='roas', title='ROAS Over Time', template=PLOTLY_TEMPLATE)
            st.plotly_chart(fig2, width='stretch', config=PLOTLY_CONFIG)

    with tabs[1]:
        st.subheader(f"Deep Dive: {selected_platform}")
        c1, c2 = st.columns(2)
        fig3 = px.scatter(df, x='cpm', y='ctr', size='impressions', color='platform', title='CTR vs CPM', template=PLOTLY_TEMPLATE)
        fig4 = px.line(df.groupby('date')['cpa'].mean().reset_index(), x='date', y='cpa', title='CPA Trend', template=PLOTLY_TEMPLATE)
        c1.plotly_chart(fig3, width='stretch', config=PLOTLY_CONFIG)
        c2.plotly_chart(fig4, width='stretch', config=PLOTLY_CONFIG)

    with tabs[2]:
        st.subheader("Top Performing Campaigns")
        top = df.groupby('campaign_name').agg({'spend':'sum','revenue':'sum'}).reset_index().sort_values('revenue',ascending=False).head(10)
        st.dataframe(top, width='stretch', hide_index=True)

def render_ml_insights(df: pd.DataFrame):
    st.title("🤖 Machine Learning & Insights")

    # 1. Anomaly Detection
    st.markdown("### ⚠️ Performance Anomalies")
    st.markdown("Automatic detection of unusual performance patterns (e.g., sudden ROAS drops or CPA spikes).")

    anomalies = detect_anomalies(df)

    if not anomalies.empty:
        st.warning(f"Detected {len(anomalies)} anomalies in the current dataset.")

        # Show recent anomalies
        recent_anomalies = anomalies.sort_values('date', ascending=False).head(5)
        for idx, row in recent_anomalies.iterrows():
            with st.expander(f"Anomaly detected on {row['date'].strftime('%Y-%m-%d')} ({row['platform']})"):
                c1, c2, c3 = st.columns(3)
                c1.metric("ROAS", f"{row['roas']:.2f}")
                c2.metric("CPA", f"${row['cpa']:.2f}")
                c3.metric("CTR", f"{row['ctr']:.2f}%")
                st.caption(f"Campaign: {row['campaign_name']}")
    else:
        st.success("No significant anomalies detected.")

    st.markdown("---")

    # 2. ML Predictions
    st.markdown("### 🔮 Conversion Predictor")
    st.markdown("Predict conversions based on planned spend and historical performance.")

    c1, c2 = st.columns([1, 2])

    with c1:
        st.markdown("#### Scenario Planner")
        input_spend = st.number_input("Planned Spend ($)", min_value=100.0, max_value=10000.0, value=1000.0, step=100.0)

        # Heuristics for inputs based on averages
        avg_cpc = df['cpc'].mean()
        avg_ctr = df['ctr'].mean()

        est_clicks = input_spend / avg_cpc if avg_cpc > 0 else 0
        est_impressions = est_clicks / (avg_ctr / 100) if avg_ctr > 0 else 0

        st.info(f"Estimated Impressions: {int(est_impressions):,}")
        st.info(f"Estimated Clicks: {int(est_clicks):,}")

    with c2:
        model = train_conversion_model(df)

        # Predict
        # Features: ['spend', 'impressions', 'clicks']
        input_data = pd.DataFrame({
            'spend': [input_spend],
            'impressions': [est_impressions],
            'clicks': [est_clicks]
        })

        prediction = model.predict(input_data)[0]

        st.metric("Predicted Conversions", f"{int(prediction)}")

        # Visualization of the model
        st.markdown("#### Model Insights (Spend vs Conversions)")
        fig_pred = px.scatter(df, x='spend', y='conversions', color='platform', opacity=0.6, title="Historical Spend vs Conversions", template=PLOTLY_TEMPLATE)
        # Add the prediction point
        fig_pred.add_traces(go.Scatter(x=[input_spend], y=[prediction], mode='markers', marker=dict(color='red', size=15, symbol='star'), name='Prediction'))
        st.plotly_chart(fig_pred, width='stretch', config=PLOTLY_CONFIG)

# =============================
# AUTHENTICATION
# =============================

def login_page():
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("<div class='login-container'>", unsafe_allow_html=True)
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
                    # Update last login
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
    # Initialize Admin State (users)
    admin.initialize_admin_state()

    if 'logged_in' not in st.session_state:
        st.session_state.logged_in = False

    if not st.session_state.logged_in:
        login_page()
        return

    # If logged in
    st.sidebar.title(f"👤 {st.session_state.username}")

    # Navigation
    if st.session_state.user_role == 'Administrator':
        page = st.sidebar.radio("Navigate", ["Dashboard", "ML & Insights", "Admin Settings"])
    else:
        page = st.sidebar.radio("Navigate", ["Dashboard", "ML & Insights"])

    if st.sidebar.button("Logout", key="logout_btn"):
        st.session_state.logged_in = False
        st.rerun()

    if page == "Dashboard":
        with st.spinner("Loading data..."):
            df = load_campaign_data()
        selected_platform, selected_campaigns, date_range = render_sidebar(df)
        render_dashboard(df, selected_platform)
    elif page == "ML & Insights":
        with st.spinner("Loading data..."):
            df = load_campaign_data()
        render_ml_insights(df)
    elif page == "Admin Settings":
        admin.render_admin_page()

if __name__ == "__main__":
    main()
