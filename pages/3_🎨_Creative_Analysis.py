"""
Creative Analysis Page
"""
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app_utils

st.set_page_config(page_title="Creative Analysis", page_icon="🎨", layout="wide")
app_utils.apply_custom_css()
app_utils.check_authentication()

@st.cache_data(ttl=3600)
def load_creative_data():
    creative_ids = [f"CR_{i:04d}" for i in range(1, 51)]
    formats = ['Video', 'Image', 'Carousel']
    data = []
    for creative_id in creative_ids:
        impressions = int(np.random.uniform(10000, 100000))
        clicks = int(impressions * np.random.uniform(0.01, 0.03))
        data.append({
            'creative_id': creative_id,
            'format': np.random.choice(formats),
            'impressions': impressions,
            'clicks': clicks,
            'conversions': int(clicks * np.random.uniform(0.02, 0.08)),
            'spend': round(np.random.uniform(200, 1500), 2),
            'revenue': round(np.random.uniform(500, 4000), 2),
            'ctr': round(clicks/impressions*100, 2)
        })
    return pd.DataFrame(data)

st.title("🎨 Creative Analysis")
st.markdown("---")

creative_df = load_creative_data()
format_stats = creative_df.groupby('format').agg({
    'impressions': 'sum',
    'clicks': 'sum',
    'conversions': 'sum',
    'spend': 'sum',
    'revenue': 'sum'
}).reset_index()
format_stats['ctr'] = (format_stats['clicks'] / format_stats['impressions'] * 100).round(2)
format_stats['roas'] = (format_stats['revenue'] / format_stats['spend']).round(2)

col1, col2 = st.columns(2)
with col1:
    fig = px.bar(format_stats, x='format', y='ctr', title='CTR by Format')
    st.plotly_chart(fig, use_container_width=True)
with col2:
    fig = px.bar(format_stats, x='format', y='roas', title='ROAS by Format')
    st.plotly_chart(fig, use_container_width=True)

st.subheader("Top Performing Creatives")
st.dataframe(creative_df.nlargest(20, 'revenue'), use_container_width=True, hide_index=True)
