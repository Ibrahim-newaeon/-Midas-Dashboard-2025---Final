"""
Budget Pacing Module for Midas Analytics Dashboard
Budget tracking, pacing analysis, and spend forecasting
Version: 1.0 - Production Ready
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
from typing import Tuple, Optional, Dict, Any
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app_utils

# ========================================
# BUDGET PACING STYLES
# ========================================

def apply_budget_styles():
    """Apply budget pacing page styles"""
    app_utils.apply_custom_css()
    app_utils.check_authentication()

    st.markdown("""
    <style>
    .budget-card {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    
    .alert-card {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 0.75rem;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    .warning-card {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 0.75rem;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    .success-card {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 0.75rem;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    .pacing-status {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    .status-on-track {
        background: #10b981;
        color: white;
    }
    
    .status-underspend {
        background: #3b82f6;
        color: white;
    }
    
    .status-overspend {
        background: #ef4444;
        color: white;
    }
    
    .status-warning {
        background: #f59e0b;
        color: white;
    }
    </style>
    """, unsafe_allow_html=True)

# ========================================
# BUDGET DATA GENERATION
# ========================================

def get_monthly_budgets() -> pd.DataFrame:
    """Get monthly budget data"""
    months = pd.date_range(start='2025-01-01', end='2025-12-01', freq='MS')
    
    data = []
    for month in months:
        budget = 50000 if month.month not in [11, 12] else 75000  # Higher budget for holiday season
        spent = budget * np.random.uniform(0.85, 1.05)
        
        data.append({
            'month': month,
            'month_name': month.strftime('%B'),
            'budget': budget,
            'spent': round(spent, 2),
            'remaining': round(budget - spent, 2),
            'pacing': round((spent / budget) * 100, 1)
        })
    
    return pd.DataFrame(data)

def get_daily_pacing(month_budget: float, days_in_month: int, current_day: int) -> pd.DataFrame:
    """Get daily pacing data for current month"""
    dates = pd.date_range(start='2025-10-01', periods=days_in_month, freq='D')
    
    daily_budget = month_budget / days_in_month
    
    data = []
    cumulative_spent = 0
    
    for i, date in enumerate(dates):
        day_num = i + 1
        
        # Simulate spending with some randomness
        if day_num <= current_day:
            daily_spend = daily_budget * np.random.uniform(0.8, 1.2)
            cumulative_spent += daily_spend
        else:
            daily_spend = 0
        
        target_spend = daily_budget * day_num
        
        data.append({
            'date': date,
            'day': day_num,
            'daily_spend': round(daily_spend, 2),
            'cumulative_spend': round(cumulative_spent, 2),
            'target_cumulative': round(target_spend, 2),
            'variance': round(cumulative_spent - target_spend, 2),
            'daily_budget': round(daily_budget, 2)
        })
    
    return pd.DataFrame(data)

def get_campaign_budgets() -> pd.DataFrame:
    """Get campaign-level budget data"""
    campaigns = [
        'Spring Sale 2025',
        'Summer Collection',
        'Bedroom Special',
        'Living Room Deals',
        'Office Furniture'
    ]
    
    data = []
    for campaign in campaigns:
        budget = np.random.uniform(8000, 15000)
        spent = budget * np.random.uniform(0.75, 1.1)
        days_left = np.random.randint(5, 20)
        
        pacing_status = 'On Track'
        if spent / budget > 1.05:
            pacing_status = 'Overspending'
        elif spent / budget < 0.85:
            pacing_status = 'Underspending'
        elif spent / budget > 0.95:
            pacing_status = 'At Risk'
        
        data.append({
            'campaign': campaign,
            'budget': round(budget, 2),
            'spent': round(spent, 2),
            'remaining': round(budget - spent, 2),
            'pacing': round((spent / budget) * 100, 1),
            'days_left': days_left,
            'daily_required': round((budget - spent) / days_left, 2) if days_left > 0 else 0,
            'status': pacing_status
        })
    
    return pd.DataFrame(data)

def get_platform_budgets() -> pd.DataFrame:
    """Get platform budget allocation"""
    platforms = ['Meta', 'Google', 'TikTok', 'Snapchat']
    
    data = []
    for platform in platforms:
        allocation_pct = np.random.uniform(15, 35)
        budget = 50000 * (allocation_pct / 100)
        spent = budget * np.random.uniform(0.85, 1.05)
        
        data.append({
            'platform': platform,
            'allocation_pct': round(allocation_pct, 1),
            'budget': round(budget, 2),
            'spent': round(spent, 2),
            'remaining': round(budget - spent, 2),
            'efficiency': round(np.random.uniform(2.5, 4.5), 2)  # ROAS
        })
    
    return pd.DataFrame(data)

# ========================================
# PACING CALCULATIONS
# ========================================

def calculate_pacing_status(pacing_pct: float) -> Tuple[str, str]:
    """Calculate pacing status and CSS class"""
    if 95 <= pacing_pct <= 105:
        return "On Track", "status-on-track"
    elif pacing_pct < 95:
        return "Underspending", "status-underspend"
    elif pacing_pct > 105:
        return "Overspending", "status-overspend"
    else:
        return "Warning", "status-warning"

def get_budget_alerts(campaign_df: pd.DataFrame) -> list:
    """Generate budget alerts"""
    alerts = []
    
    for _, row in campaign_df.iterrows():
        if row['pacing'] > 105:
            alerts.append({
                'type': 'error',
                'campaign': row['campaign'],
                'message': f"Overspending by {row['pacing'] - 100:.1f}%"
            })
        elif row['pacing'] < 85:
            alerts.append({
                'type': 'warning',
                'campaign': row['campaign'],
                'message': f"Underspending by {100 - row['pacing']:.1f}%"
            })
        elif row['days_left'] < 7 and row['remaining'] > row['daily_required'] * 7:
            alerts.append({
                'type': 'info',
                'campaign': row['campaign'],
                'message': f"Need to spend ${row['daily_required']:.0f}/day to meet budget"
            })
    
    return alerts

# ========================================
# VISUALIZATION COMPONENTS
# ========================================

def create_pacing_chart(daily_df: pd.DataFrame):
    """Create daily pacing chart"""
    
    fig = go.Figure()
    
    # Actual spend
    fig.add_trace(go.Scatter(
        name='Actual Spend',
        x=daily_df['date'],
        y=daily_df['cumulative_spend'],
        mode='lines',
        line=dict(color='#667eea', width=3),
        fill='tozeroy',
        fillcolor='rgba(102, 126, 234, 0.1)'
    ))
    
    # Target spend
    fig.add_trace(go.Scatter(
        name='Target Spend',
        x=daily_df['date'],
        y=daily_df['target_cumulative'],
        mode='lines',
        line=dict(color='#10b981', width=2, dash='dash')
    ))
    
    fig.update_layout(
        title='Daily Budget Pacing',
        xaxis_title='Date',
        yaxis_title='Cumulative Spend ($)',
        height=500,
        hovermode='x unified'
    )
    
    return fig

def create_campaign_budget_chart(campaign_df: pd.DataFrame):
    """Create campaign budget comparison chart"""
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        name='Spent',
        x=campaign_df['campaign'],
        y=campaign_df['spent'],
        marker_color='#667eea'
    ))
    
    fig.add_trace(go.Bar(
        name='Remaining',
        x=campaign_df['campaign'],
        y=campaign_df['remaining'],
        marker_color='#10b981'
    ))
    
    fig.update_layout(
        title='Campaign Budget Status',
        xaxis_title='Campaign',
        yaxis_title='Amount ($)',
        barmode='stack',
        height=400
    )
    
    return fig

def create_platform_allocation_chart(platform_df: pd.DataFrame):
    """Create platform allocation pie chart"""
    
    fig = px.pie(
        platform_df,
        values='budget',
        names='platform',
        title='Budget Allocation by Platform',
        color_discrete_sequence=px.colors.sequential.Purples_r
    )
    
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(height=400)
    
    return fig

def create_forecast_chart(daily_df: pd.DataFrame, total_budget: float):
    """Create spend forecast chart"""
    
    # Get actual data
    actual_data = daily_df[daily_df['daily_spend'] > 0].copy()
    
    # Create forecast
    if len(actual_data) > 0:
        avg_daily_spend = actual_data['daily_spend'].mean()
        last_date = actual_data['date'].max()
        last_cumulative = actual_data['cumulative_spend'].max()
        
        # Forecast remaining days
        days_left = 31 - len(actual_data)
        forecast_dates = pd.date_range(start=last_date + timedelta(days=1), periods=days_left, freq='D')
        
        forecast_data = []
        cumulative = last_cumulative
        for date in forecast_dates:
            cumulative += avg_daily_spend
            forecast_data.append({
                'date': date,
                'forecast_cumulative': cumulative
            })
        
        forecast_df = pd.DataFrame(forecast_data)
        
        fig = go.Figure()
        
        # Actual spend
        fig.add_trace(go.Scatter(
            name='Actual',
            x=actual_data['date'],
            y=actual_data['cumulative_spend'],
            mode='lines',
            line=dict(color='#667eea', width=3)
        ))
        
        # Forecast
        fig.add_trace(go.Scatter(
            name='Forecast',
            x=forecast_df['date'],
            y=forecast_df['forecast_cumulative'],
            mode='lines',
            line=dict(color='#f59e0b', width=2, dash='dash')
        ))
        
        # Budget line
        fig.add_hline(
            y=total_budget,
            line_dash="dot",
            line_color="red",
            annotation_text="Budget Limit"
        )
        
        fig.update_layout(
            title='Budget Forecast',
            xaxis_title='Date',
            yaxis_title='Cumulative Spend ($)',
            height=400,
            hovermode='x unified'
        )
        
        return fig, forecast_df['forecast_cumulative'].iloc[-1]
    
    return None, None

# ========================================
# MAIN BUDGET PACING PAGE
# ========================================

def render_budget_pacing_page():
    """Main budget pacing page renderer"""
    
    apply_budget_styles()
    
    st.title("💰 Budget Pacing")
    st.markdown("Track spending, monitor pacing, and forecast budget utilization")
    st.markdown("---")
    
    # Load data
    monthly_df = get_monthly_budgets()
    current_month_data = monthly_df[monthly_df['month'].dt.month == 10].iloc[0]
    daily_df = get_daily_pacing(current_month_data['budget'], 31, 22)
    campaign_df = get_campaign_budgets()
    platform_df = get_platform_budgets()
    
    # Tabs
    tab1, tab2, tab3, tab4 = st.tabs([
        "📊 Overview",
        "📈 Daily Pacing",
        "🎯 Campaign Budgets",
        "💡 Recommendations"
    ])
    
    with tab1:
        render_overview(monthly_df, current_month_data, campaign_df, platform_df)
    
    with tab2:
        render_daily_pacing(daily_df, current_month_data)
    
    with tab3:
        render_campaign_budgets(campaign_df, platform_df)
    
    with tab4:
        render_recommendations(campaign_df, daily_df, current_month_data)

def render_overview(monthly_df: pd.DataFrame, current_month: pd.Series, 
                   campaign_df: pd.DataFrame, platform_df: pd.DataFrame):
    """Render overview tab"""
    
    st.subheader("📊 Budget Overview")
    
    # Current month metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            "Monthly Budget",
            f"${current_month['budget']:,.0f}",
            f"{current_month['month_name']}"
        )
    
    with col2:
        st.metric(
            "Spent to Date",
            f"${current_month['spent']:,.0f}",
            f"{current_month['pacing']:.1f}% of budget"
        )
    
    with col3:
        st.metric(
            "Remaining",
            f"${current_month['remaining']:,.0f}",
            f"{100 - current_month['pacing']:.1f}% left"
        )
    
    with col4:
        status, status_class = calculate_pacing_status(current_month['pacing'])
        st.markdown(f"""
        <div style="text-align: center; padding: 1rem;">
            <div style="color: #8b92a7; font-size: 0.85rem; margin-bottom: 0.5rem;">Pacing Status</div>
            <div class="pacing-status {status_class}">{status}</div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Budget alerts
    alerts = get_budget_alerts(campaign_df)
    
    if alerts:
        st.markdown("### 🚨 Budget Alerts")
        
        for alert in alerts[:5]:  # Show top 5 alerts
            if alert['type'] == 'error':
                st.error(f"**{alert['campaign']}**: {alert['message']}")
            elif alert['type'] == 'warning':
                st.warning(f"**{alert['campaign']}**: {alert['message']}")
            else:
                st.info(f"**{alert['campaign']}**: {alert['message']}")
    
    st.markdown("---")
    
    # Monthly trend
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### 📈 Monthly Spending Trend")
        fig1 = go.Figure()
        
        fig1.add_trace(go.Bar(
            name='Budget',
            x=monthly_df['month_name'],
            y=monthly_df['budget'],
            marker_color='#10b981'
        ))
        
        fig1.add_trace(go.Bar(
            name='Spent',
            x=monthly_df['month_name'],
            y=monthly_df['spent'],
            marker_color='#667eea'
        ))
        
        fig1.update_layout(barmode='group', height=400)
        st.plotly_chart(fig1, width="stretch")
    
    with col2:
        st.markdown("### 🎯 Platform Allocation")
        fig2 = create_platform_allocation_chart(platform_df)
        st.plotly_chart(fig2, width="stretch")

def render_daily_pacing(daily_df: pd.DataFrame, current_month: pd.Series):
    """Render daily pacing tab"""
    
    st.subheader("📈 Daily Pacing Analysis")
    st.info(f"💡 Tracking daily spend against target for {current_month['month_name']}")
    
    # Current pacing metrics
    current_day_data = daily_df[daily_df['daily_spend'] > 0].iloc[-1]
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            "Today's Spend",
            f"${current_day_data['daily_spend']:,.0f}",
            f"Target: ${current_day_data['daily_budget']:,.0f}"
        )
    
    with col2:
        variance_pct = (current_day_data['variance'] / current_day_data['target_cumulative']) * 100
        st.metric(
            "Cumulative Variance",
            f"${current_day_data['variance']:,.0f}",
            f"{variance_pct:+.1f}%"
        )
    
    with col3:
        days_remaining = 31 - current_day_data['day']
        st.metric(
            "Days Remaining",
            f"{days_remaining}",
            f"Day {int(current_day_data['day'])} of 31"
        )
    
    with col4:
        remaining_budget = current_month['budget'] - current_day_data['cumulative_spend']
        daily_required = remaining_budget / days_remaining if days_remaining > 0 else 0
        st.metric(
            "Required Daily Spend",
            f"${daily_required:,.0f}",
            f"to meet budget"
        )
    
    st.markdown("---")
    
    # Pacing chart
    fig1 = create_pacing_chart(daily_df)
    st.plotly_chart(fig1, width="stretch")
    
    # Forecast
    st.markdown("---")
    st.markdown("### 🔮 Budget Forecast")
    
    fig2, forecast_end = create_forecast_chart(daily_df, current_month['budget'])
    
    if fig2:
        st.plotly_chart(fig2, width="stretch")
        
        if forecast_end:
            forecast_variance = forecast_end - current_month['budget']
            forecast_pct = (forecast_end / current_month['budget']) * 100
            
            if abs(forecast_variance) < 1000:
                st.success(f"✅ Forecast: On track to spend ${forecast_end:,.0f} ({forecast_pct:.1f}% of budget)")
            elif forecast_variance > 0:
                st.warning(f"⚠️ Forecast: Projected to overspend by ${forecast_variance:,.0f} ({forecast_pct:.1f}% of budget)")
            else:
                st.info(f"📊 Forecast: Projected to underspend by ${abs(forecast_variance):,.0f} ({forecast_pct:.1f}% of budget)")
    
    # Daily breakdown table
    st.markdown("---")
    st.markdown("### 📋 Daily Breakdown")
    
    display_df = daily_df[daily_df['daily_spend'] > 0][['date', 'daily_spend', 'cumulative_spend', 'target_cumulative', 'variance']].copy()
    display_df['date'] = display_df['date'].dt.strftime('%Y-%m-%d')
    
    st.dataframe(
        display_df,
        width="stretch",
        hide_index=True,
        column_config={
            "date": "Date",
            "daily_spend": st.column_config.NumberColumn("Daily Spend", format="$%.2f"),
            "cumulative_spend": st.column_config.NumberColumn("Cumulative", format="$%.2f"),
            "target_cumulative": st.column_config.NumberColumn("Target", format="$%.2f"),
            "variance": st.column_config.NumberColumn("Variance", format="$%.2f")
        }
    )

def render_campaign_budgets(campaign_df: pd.DataFrame, platform_df: pd.DataFrame):
    """Render campaign budgets tab"""
    
    st.subheader("🎯 Campaign Budget Management")
    
    # Campaign overview chart
    fig = create_campaign_budget_chart(campaign_df)
    st.plotly_chart(fig, width="stretch")
    
    st.markdown("---")
    
    # Campaign details table
    st.markdown("### 📋 Campaign Details")
    
    for _, campaign in campaign_df.iterrows():
        with st.expander(f"**{campaign['campaign']}** - {campaign['status']}"):
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("Budget", f"${campaign['budget']:,.0f}")
            with col2:
                st.metric("Spent", f"${campaign['spent']:,.0f}")
            with col3:
                st.metric("Remaining", f"${campaign['remaining']:,.0f}")
            with col4:
                st.metric("Pacing", f"{campaign['pacing']:.1f}%")
            
            st.markdown(f"**Days Left:** {campaign['days_left']} | **Required Daily Spend:** ${campaign['daily_required']:,.0f}")
            
            # Pacing bar
            progress = min(campaign['pacing'] / 100, 1.0)
            color = '#10b981' if 0.95 <= campaign['pacing'] / 100 <= 1.05 else '#ef4444'
            st.progress(progress)
    
    st.markdown("---")
    
    # Platform performance
    st.markdown("### 🏆 Platform Budget Efficiency")
    
    st.dataframe(
        platform_df,
        width="stretch",
        hide_index=True,
        column_config={
            "platform": "Platform",
            "allocation_pct": st.column_config.NumberColumn("Allocation", format="%.1f%%"),
            "budget": st.column_config.NumberColumn("Budget", format="$%.2f"),
            "spent": st.column_config.NumberColumn("Spent", format="$%.2f"),
            "remaining": st.column_config.NumberColumn("Remaining", format="$%.2f"),
            "efficiency": st.column_config.NumberColumn("ROAS", format="%.2fx")
        }
    )

def render_recommendations(campaign_df: pd.DataFrame, daily_df: pd.DataFrame, current_month: pd.Series):
    """Render recommendations tab"""
    
    st.subheader("💡 Budget Optimization Recommendations")
    
    # Analyze data
    overspending_campaigns = campaign_df[campaign_df['pacing'] > 105]
    underspending_campaigns = campaign_df[campaign_df['pacing'] < 85]
    
    # Recommendations
    st.markdown("### 🎯 Priority Actions")
    
    if len(overspending_campaigns) > 0:
        st.markdown("#### 🚨 Overspending Campaigns")
        for _, campaign in overspending_campaigns.iterrows():
            st.error(f"""
            **{campaign['campaign']}**
            - Currently at {campaign['pacing']:.1f}% of budget
            - Reduce daily spend to ${campaign['daily_required']:,.0f}
            - Consider pausing underperforming ad sets
            """)
    
    if len(underspending_campaigns) > 0:
        st.markdown("#### 📊 Underspending Campaigns")
        for _, campaign in underspending_campaigns.iterrows():
            st.warning(f"""
            **{campaign['campaign']}**
            - Currently at {campaign['pacing']:.1f}% of budget
            - Increase daily spend to ${campaign['daily_required']:,.0f}
            - Scale winning ad sets
            - Test new audiences
            """)
    
    st.markdown("---")
    
    # General recommendations
    st.markdown("### 💡 General Recommendations")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.success("""
        **✅ Budget Optimization:**
        - Shift budget from Meta to TikTok (higher ROAS)
        - Increase budget for top-performing campaigns
        - Set up automated budget rules
        - Monitor daily at 10 AM and 4 PM
        """)
    
    with col2:
        st.info("""
        **📈 Growth Opportunities:**
        - Q4 is approaching - prepare for 50% budget increase
        - Test new creative formats
        - Expand to lookalike audiences
        - Consider increasing budgets by 20% for Black Friday
        """)
    
    st.markdown("---")
    
    # Budget adjustment calculator
    st.markdown("### 🧮 Budget Adjustment Calculator")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        campaign_select = st.selectbox("Select Campaign", campaign_df['campaign'].tolist())
    
    with col2:
        current_budget = campaign_df[campaign_df['campaign'] == campaign_select]['budget'].iloc[0]
        new_budget = st.number_input("New Budget ($)", min_value=0.0, value=float(current_budget), step=1000.0)
    
    with col3:
        st.write("")
        st.write("")
        if st.button("Calculate Impact", width="stretch"):
            change = new_budget - current_budget
            change_pct = (change / current_budget) * 100
            
            if change > 0:
                st.success(f"Budget increase of ${change:,.0f} ({change_pct:+.1f}%)")
            elif change < 0:
                st.warning(f"Budget decrease of ${abs(change):,.0f} ({change_pct:.1f}%)")
            else:
                st.info("No change in budget")

# Call the main function directly (required for Streamlit multi-page apps)
render_budget_pacing_page()
