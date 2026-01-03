"""
Data Assistant - AI Chatbot for Midas Analytics Dashboard
Ask questions about your campaign data in natural language.
Version: 1.0
"""

import streamlit as st
import pandas as pd
import sqlite3
from datetime import datetime, timedelta
import json

# Page config
st.set_page_config(
    page_title="Data Assistant - Midas Analytics",
    page_icon="💬",
    layout="wide"
)

# =============================================================================
# DATABASE HELPERS
# =============================================================================

def get_db_connection():
    """Get database connection."""
    return sqlite3.connect('furniture.db')

@st.cache_data(ttl=3600)
def get_data_summary():
    """Get summary of available data for context."""
    conn = get_db_connection()

    summary = {}

    # Get campaigns
    campaigns_df = pd.read_sql_query("""
        SELECT campaign_name, platform, objective, funnel_stage
        FROM campaigns
    """, conn)
    summary['campaigns'] = campaigns_df.to_dict('records')
    summary['campaign_count'] = len(campaigns_df)
    summary['platforms'] = campaigns_df['platform'].unique().tolist()

    # Get date range
    dates_df = pd.read_sql_query("""
        SELECT MIN(report_date) as min_date, MAX(report_date) as max_date
        FROM daily_performance
    """, conn)
    summary['date_range'] = {
        'start': dates_df['min_date'].iloc[0],
        'end': dates_df['max_date'].iloc[0]
    }

    # Get totals
    totals_df = pd.read_sql_query("""
        SELECT
            SUM(impressions) as total_impressions,
            SUM(clicks) as total_clicks,
            SUM(conversions) as total_conversions
        FROM daily_performance
    """, conn)
    summary['totals'] = totals_df.to_dict('records')[0]

    conn.close()
    return summary

@st.cache_data(ttl=300)
def execute_data_query(query_type: str, params: dict = None):
    """Execute predefined safe queries based on user intent."""
    conn = get_db_connection()
    params = params or {}

    try:
        if query_type == "campaign_performance":
            df = pd.read_sql_query("""
                SELECT
                    c.campaign_name,
                    c.platform,
                    SUM(dp.impressions) as impressions,
                    SUM(dp.clicks) as clicks,
                    SUM(dp.conversions) as conversions,
                    ROUND(SUM(dp.clicks) * 100.0 / NULLIF(SUM(dp.impressions), 0), 2) as ctr
                FROM daily_performance dp
                JOIN campaigns c ON dp.campaign_id = c.campaign_id
                GROUP BY c.campaign_name, c.platform
                ORDER BY impressions DESC
            """, conn)
            return df

        elif query_type == "platform_comparison":
            df = pd.read_sql_query("""
                SELECT
                    c.platform,
                    SUM(dp.impressions) as impressions,
                    SUM(dp.clicks) as clicks,
                    SUM(dp.conversions) as conversions,
                    ROUND(SUM(dp.clicks) * 100.0 / NULLIF(SUM(dp.impressions), 0), 2) as ctr,
                    ROUND(SUM(dp.conversions) * 100.0 / NULLIF(SUM(dp.clicks), 0), 2) as conversion_rate
                FROM daily_performance dp
                JOIN campaigns c ON dp.campaign_id = c.campaign_id
                GROUP BY c.platform
                ORDER BY impressions DESC
            """, conn)
            return df

        elif query_type == "daily_trend":
            days = params.get('days', 30)
            df = pd.read_sql_query(f"""
                SELECT
                    report_date,
                    SUM(impressions) as impressions,
                    SUM(clicks) as clicks,
                    SUM(conversions) as conversions
                FROM daily_performance
                WHERE report_date >= date('now', '-{days} days')
                GROUP BY report_date
                ORDER BY report_date
            """, conn)
            return df

        elif query_type == "top_campaigns":
            limit = params.get('limit', 5)
            metric = params.get('metric', 'conversions')
            df = pd.read_sql_query(f"""
                SELECT
                    c.campaign_name,
                    c.platform,
                    SUM(dp.{metric}) as {metric}
                FROM daily_performance dp
                JOIN campaigns c ON dp.campaign_id = c.campaign_id
                GROUP BY c.campaign_name, c.platform
                ORDER BY {metric} DESC
                LIMIT {limit}
            """, conn)
            return df

        elif query_type == "campaign_details":
            campaign_name = params.get('campaign_name', '')
            df = pd.read_sql_query("""
                SELECT
                    dp.report_date,
                    c.campaign_name,
                    dp.impressions,
                    dp.clicks,
                    dp.conversions
                FROM daily_performance dp
                JOIN campaigns c ON dp.campaign_id = c.campaign_id
                WHERE c.campaign_name LIKE ?
                ORDER BY dp.report_date DESC
                LIMIT 30
            """, conn, params=(f'%{campaign_name}%',))
            return df

        elif query_type == "summary_stats":
            df = pd.read_sql_query("""
                SELECT
                    COUNT(DISTINCT c.campaign_id) as total_campaigns,
                    COUNT(DISTINCT c.platform) as platforms,
                    SUM(dp.impressions) as total_impressions,
                    SUM(dp.clicks) as total_clicks,
                    SUM(dp.conversions) as total_conversions,
                    ROUND(SUM(dp.clicks) * 100.0 / NULLIF(SUM(dp.impressions), 0), 2) as avg_ctr
                FROM daily_performance dp
                JOIN campaigns c ON dp.campaign_id = c.campaign_id
            """, conn)
            return df

    except Exception as e:
        return pd.DataFrame({'error': [str(e)]})
    finally:
        conn.close()

def analyze_question(question: str):
    """Analyze question and determine query type."""
    question_lower = question.lower()

    # Keywords for different query types
    if any(word in question_lower for word in ['compare', 'platform', 'meta', 'google', 'tiktok', 'snapchat', 'versus', 'vs']):
        return 'platform_comparison', {}

    elif any(word in question_lower for word in ['trend', 'daily', 'over time', 'last week', 'last month', 'history']):
        days = 30
        if 'week' in question_lower:
            days = 7
        elif 'month' in question_lower:
            days = 30
        elif '90' in question_lower or 'quarter' in question_lower:
            days = 90
        return 'daily_trend', {'days': days}

    elif any(word in question_lower for word in ['top', 'best', 'highest', 'most']):
        metric = 'conversions'
        if 'click' in question_lower:
            metric = 'clicks'
        elif 'impression' in question_lower:
            metric = 'impressions'
        limit = 5
        for word in question_lower.split():
            if word.isdigit():
                limit = int(word)
                break
        return 'top_campaigns', {'limit': limit, 'metric': metric}

    elif any(word in question_lower for word in ['summary', 'overview', 'total', 'how many', 'overall']):
        return 'summary_stats', {}

    elif any(word in question_lower for word in ['campaign', 'specific']):
        # Try to extract campaign name
        return 'campaign_performance', {}

    else:
        return 'campaign_performance', {}

def format_response(query_type: str, df: pd.DataFrame, question: str):
    """Format the query results into a natural language response."""
    if df.empty:
        return "I couldn't find any data matching your query. Please try rephrasing your question."

    if 'error' in df.columns:
        return f"Sorry, I encountered an error: {df['error'].iloc[0]}"

    response = ""

    if query_type == 'platform_comparison':
        response = "📊 **Platform Comparison**\n\n"
        for _, row in df.iterrows():
            response += f"**{row['platform']}**\n"
            response += f"- Impressions: {row['impressions']:,.0f}\n"
            response += f"- Clicks: {row['clicks']:,.0f}\n"
            response += f"- Conversions: {row['conversions']:,.0f}\n"
            response += f"- CTR: {row['ctr']:.2f}%\n\n"

    elif query_type == 'daily_trend':
        response = "📈 **Daily Performance Trend**\n\n"
        response += f"Showing data from {df['report_date'].min()} to {df['report_date'].max()}\n\n"
        total_impressions = df['impressions'].sum()
        total_clicks = df['clicks'].sum()
        total_conversions = df['conversions'].sum()
        response += f"- Total Impressions: {total_impressions:,.0f}\n"
        response += f"- Total Clicks: {total_clicks:,.0f}\n"
        response += f"- Total Conversions: {total_conversions:,.0f}\n"
        response += f"- Avg Daily Impressions: {df['impressions'].mean():,.0f}\n"

    elif query_type == 'top_campaigns':
        metric = list(df.columns)[-1]
        response = f"🏆 **Top Campaigns by {metric.title()}**\n\n"
        for i, row in df.iterrows():
            response += f"{i+1}. **{row['campaign_name']}** ({row['platform']})\n"
            response += f"   {metric.title()}: {row[metric]:,.0f}\n\n"

    elif query_type == 'summary_stats':
        row = df.iloc[0]
        response = "📋 **Overall Summary**\n\n"
        response += f"- Total Campaigns: {row['total_campaigns']:,.0f}\n"
        response += f"- Platforms: {row['platforms']:,.0f}\n"
        response += f"- Total Impressions: {row['total_impressions']:,.0f}\n"
        response += f"- Total Clicks: {row['total_clicks']:,.0f}\n"
        response += f"- Total Conversions: {row['total_conversions']:,.0f}\n"
        response += f"- Average CTR: {row['avg_ctr']:.2f}%\n"

    elif query_type == 'campaign_performance':
        response = "📊 **Campaign Performance**\n\n"
        for _, row in df.head(10).iterrows():
            response += f"**{row['campaign_name']}** ({row['platform']})\n"
            response += f"- Impressions: {row['impressions']:,.0f}\n"
            response += f"- Clicks: {row['clicks']:,.0f}\n"
            response += f"- CTR: {row['ctr']:.2f}%\n\n"

    return response

# =============================================================================
# MAIN UI
# =============================================================================

st.title("💬 Data Assistant")
st.markdown("Ask questions about your campaign data in natural language.")

# Sidebar with data context
with st.sidebar:
    st.header("📊 Data Context")

    try:
        summary = get_data_summary()

        st.metric("Campaigns", summary['campaign_count'])
        st.write("**Platforms:**", ", ".join(summary['platforms']))
        st.write("**Date Range:**")
        st.write(f"  {summary['date_range']['start']} to {summary['date_range']['end']}")

        st.divider()
        st.subheader("💡 Example Questions")
        st.markdown("""
        - "Compare performance across platforms"
        - "Show me the top 5 campaigns"
        - "What's the daily trend this month?"
        - "Give me an overall summary"
        - "Which campaigns have the most clicks?"
        """)
    except Exception as e:
        st.error(f"Could not load data summary: {e}")
        st.info("Make sure to run `python setup_database.py` first.")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": "👋 Hi! I'm your Data Assistant. Ask me anything about your campaign performance data!\n\nFor example:\n- 'Compare platforms'\n- 'Top 5 campaigns by conversions'\n- 'Daily trend last week'"
        }
    ]

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "data" in message:
            st.dataframe(message["data"], use_container_width=True)

# Chat input
if prompt := st.chat_input("Ask about your data..."):
    # Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Generate response
    with st.chat_message("assistant"):
        with st.spinner("Analyzing your question..."):
            # Determine query type
            query_type, params = analyze_question(prompt)

            # Execute query
            result_df = execute_data_query(query_type, params)

            # Format response
            response = format_response(query_type, result_df, prompt)

            st.markdown(response)

            # Show data table if available
            if not result_df.empty and 'error' not in result_df.columns:
                with st.expander("📋 View Raw Data"):
                    st.dataframe(result_df, use_container_width=True)

            # Save to history
            st.session_state.messages.append({
                "role": "assistant",
                "content": response,
                "data": result_df if not result_df.empty else None
            })

# Clear chat button
if st.button("🗑️ Clear Chat"):
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": "👋 Chat cleared! Ask me anything about your campaign data."
        }
    ]
    st.rerun()
