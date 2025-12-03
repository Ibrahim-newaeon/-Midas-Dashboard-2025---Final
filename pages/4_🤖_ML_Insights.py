"""
ML & Insights Page
Machine Learning predictions and anomaly detection
"""
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path to import app_utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app_utils

# Initialize Page
st.set_page_config(page_title="ML & Insights", page_icon="🤖", layout="wide")
app_utils.apply_custom_css()
app_utils.check_authentication()

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
# MAIN RENDER
# =============================

df = load_campaign_data()

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
    st.markdown('<div class="grafana-panel"><div class="panel-header">Model Insights (Spend vs Conversions)</div>', unsafe_allow_html=True)
    fig_pred = px.scatter(df, x='spend', y='conversions', color='platform', opacity=0.6, template=app_utils.PLOTLY_TEMPLATE)
    # Add the prediction point
    fig_pred.add_traces(go.Scatter(x=[input_spend], y=[prediction], mode='markers', marker=dict(color='red', size=15, symbol='star'), name='Prediction'))
    fig_pred.update_layout(margin=dict(l=0, r=0, t=0, b=0), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
    st.plotly_chart(fig_pred, width='stretch', config=app_utils.PLOTLY_CONFIG)
    st.markdown('</div>', unsafe_allow_html=True)
