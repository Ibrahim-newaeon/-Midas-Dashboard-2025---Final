"""
A/B Testing Module for Midas Analytics Dashboard
Statistical testing, variant comparison, and winner detection
Version: 1.0 - Production Ready
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
from scipy import stats
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app_utils

# ========================================
# A/B TESTING STYLES
# ========================================

def apply_ab_testing_styles():
    """Apply A/B testing page styles"""
    app_utils.apply_custom_css()
    app_utils.check_authentication()

    st.markdown("""
    <style>
    .test-card {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin: 1rem 0;
    }
    
    .winner-badge {
        background: #10b981;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 700;
        font-size: 1rem;
        display: inline-block;
    }
    
    .loser-badge {
        background: #ef4444;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 700;
        font-size: 1rem;
        display: inline-block;
    }
    
    .testing-badge {
        background: #f59e0b;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 700;
        font-size: 1rem;
        display: inline-block;
    }
    
    .significance-indicator {
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
        text-align: center;
    }
    
    .significant {
        background: rgba(16, 185, 129, 0.1);
        border: 2px solid #10b981;
        color: #10b981;
    }
    
    .not-significant {
        background: rgba(239, 68, 68, 0.1);
        border: 2px solid #ef4444;
        color: #ef4444;
    }
    
    .variant-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 0.5rem 0;
    }
    </style>
    """, unsafe_allow_html=True)

# ========================================
# TEST DATA GENERATION
# ========================================

def get_active_tests() -> pd.DataFrame:
    """Get active A/B tests"""
    tests = [
        {
            'test_id': 'TEST_001',
            'test_name': 'CTA Button Color',
            'start_date': datetime.now() - timedelta(days=14),
            'status': 'Running',
            'variants': 2,
            'metric': 'CTR',
            'sample_size': 15420,
            'significance': 0.037
        },
        {
            'test_id': 'TEST_002',
            'test_name': 'Headline Copy',
            'start_date': datetime.now() - timedelta(days=21),
            'status': 'Running',
            'variants': 3,
            'metric': 'CVR',
            'sample_size': 24680,
            'significance': 0.002
        },
        {
            'test_id': 'TEST_003',
            'test_name': 'Image vs Video',
            'start_date': datetime.now() - timedelta(days=7),
            'status': 'Running',
            'variants': 2,
            'metric': 'ROAS',
            'sample_size': 8920,
            'significance': 0.156
        },
        {
            'test_id': 'TEST_004',
            'test_name': 'Landing Page Layout',
            'start_date': datetime.now() - timedelta(days=28),
            'status': 'Completed',
            'variants': 2,
            'metric': 'CVR',
            'sample_size': 32450,
            'significance': 0.001
        }
    ]
    
    df = pd.DataFrame(tests)
    df['days_running'] = (datetime.now() - df['start_date']).dt.days
    return df

def get_test_variants(test_id: str) -> pd.DataFrame:
    """Get variant data for a specific test"""
    
    # Generate variant performance data
    if test_id == 'TEST_001':  # CTA Button Color
        variants = [
            {
                'variant': 'Control (Blue)',
                'impressions': 7800,
                'clicks': 156,
                'conversions': 12,
                'ctr': 2.0,
                'cvr': 7.7,
                'cost': 980.50,
                'revenue': 3240.00
            },
            {
                'variant': 'Variant A (Orange)',
                'impressions': 7620,
                'clicks': 189,
                'conversions': 18,
                'ctr': 2.48,
                'cvr': 9.5,
                'cost': 975.20,
                'revenue': 4860.00
            }
        ]
    elif test_id == 'TEST_002':  # Headline Copy
        variants = [
            {
                'variant': 'Control',
                'impressions': 8200,
                'clicks': 164,
                'conversions': 14,
                'ctr': 2.0,
                'cvr': 8.5,
                'cost': 1050.00,
                'revenue': 3780.00
            },
            {
                'variant': 'Variant A',
                'impressions': 8340,
                'clicks': 183,
                'conversions': 19,
                'ctr': 2.19,
                'cvr': 10.4,
                'cost': 1065.00,
                'revenue': 5130.00
            },
            {
                'variant': 'Variant B',
                'impressions': 8140,
                'clicks': 195,
                'conversions': 21,
                'ctr': 2.40,
                'cvr': 10.8,
                'cost': 1040.00,
                'revenue': 5670.00
            }
        ]
    elif test_id == 'TEST_003':  # Image vs Video
        variants = [
            {
                'variant': 'Control (Image)',
                'impressions': 4580,
                'clicks': 92,
                'conversions': 8,
                'ctr': 2.01,
                'cvr': 8.7,
                'cost': 586.00,
                'revenue': 2160.00
            },
            {
                'variant': 'Variant A (Video)',
                'impressions': 4340,
                'clicks': 108,
                'conversions': 11,
                'ctr': 2.49,
                'cvr': 10.2,
                'cost': 555.00,
                'revenue': 2970.00
            }
        ]
    else:  # TEST_004 - Landing Page Layout
        variants = [
            {
                'variant': 'Control',
                'impressions': 16200,
                'clicks': 324,
                'conversions': 28,
                'ctr': 2.0,
                'cvr': 8.6,
                'cost': 2074.00,
                'revenue': 7560.00
            },
            {
                'variant': 'Variant A (New Layout)',
                'impressions': 16250,
                'clicks': 390,
                'conversions': 40,
                'ctr': 2.4,
                'cvr': 10.3,
                'cost': 2080.00,
                'revenue': 10800.00
            }
        ]
    
    df = pd.DataFrame(variants)
    df['roas'] = (df['revenue'] / df['cost']).round(2)
    df['cpa'] = (df['cost'] / df['conversions']).round(2)
    
    return df

def get_test_time_series(test_id: str, days: int) -> pd.DataFrame:
    """Get time series data for test variants"""
    dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
    
    data = []
    for date in dates:
        # Control variant
        control_ctr = 2.0 + np.random.uniform(-0.2, 0.2)
        # Variant A (better performance)
        variant_ctr = 2.4 + np.random.uniform(-0.2, 0.2)
        
        data.append({
            'date': date,
            'variant': 'Control',
            'ctr': round(control_ctr, 2),
            'cvr': round(8.5 + np.random.uniform(-1, 1), 2),
            'conversions': int(12 + np.random.uniform(-3, 3))
        })
        
        data.append({
            'date': date,
            'variant': 'Variant A',
            'ctr': round(variant_ctr, 2),
            'cvr': round(10.3 + np.random.uniform(-1, 1), 2),
            'conversions': int(18 + np.random.uniform(-4, 4))
        })
    
    return pd.DataFrame(data)

# ========================================
# STATISTICAL ANALYSIS
# ========================================

def calculate_statistical_significance(control_conversions: int, control_impressions: int,
                                       variant_conversions: int, variant_impressions: int) -> tuple:
    """Calculate statistical significance using Z-test"""
    
    # Conversion rates
    p1 = control_conversions / control_impressions
    p2 = variant_conversions / variant_impressions
    
    # Pooled proportion
    p_pool = (control_conversions + variant_conversions) / (control_impressions + variant_impressions)
    
    # Standard error
    se = np.sqrt(p_pool * (1 - p_pool) * (1/control_impressions + 1/variant_impressions))
    
    # Z-score
    z_score = (p2 - p1) / se
    
    # P-value (two-tailed)
    p_value = 2 * (1 - stats.norm.cdf(abs(z_score)))
    
    # Lift
    lift = ((p2 - p1) / p1) * 100
    
    # Confidence level
    confidence = (1 - p_value) * 100
    
    return p_value, lift, confidence, z_score

def calculate_sample_size_needed(baseline_rate: float, mde: float, alpha: float = 0.05, power: float = 0.8) -> int:
    """Calculate required sample size for A/B test"""
    
    # Z-scores
    z_alpha = stats.norm.ppf(1 - alpha/2)
    z_beta = stats.norm.ppf(power)
    
    # Expected rates
    p1 = baseline_rate
    p2 = baseline_rate * (1 + mde)
    
    # Sample size per variant
    n = ((z_alpha * np.sqrt(2 * p1 * (1-p1)) + z_beta * np.sqrt(p1*(1-p1) + p2*(1-p2))) / (p2 - p1)) ** 2
    
    return int(np.ceil(n))

# ========================================
# VISUALIZATION COMPONENTS
# ========================================

def create_variant_comparison_chart(variants_df: pd.DataFrame, metric: str):
    """Create variant comparison chart"""
    
    metric_col = metric.lower().replace(' ', '_')
    
    fig = go.Figure()
    
    colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444']
    
    for i, (idx, variant) in enumerate(variants_df.iterrows()):
        fig.add_trace(go.Bar(
            name=variant['variant'],
            x=[metric],
            y=[variant[metric_col]],
            marker_color=colors[i % len(colors)],
            text=[f"{variant[metric_col]:.2f}"],
            textposition='auto'
        ))
    
    fig.update_layout(
        title=f'{metric} by Variant',
        yaxis_title=metric,
        height=400,
        barmode='group'
    )
    
    return fig

def create_time_series_chart(time_series_df: pd.DataFrame, metric: str):
    """Create time series comparison chart"""
    
    fig = go.Figure()
    
    for variant in time_series_df['variant'].unique():
        variant_data = time_series_df[time_series_df['variant'] == variant]
        
        fig.add_trace(go.Scatter(
            name=variant,
            x=variant_data['date'],
            y=variant_data[metric.lower()],
            mode='lines+markers',
            line=dict(width=3)
        ))
    
    fig.update_layout(
        title=f'{metric} Over Time',
        xaxis_title='Date',
        yaxis_title=metric,
        height=400,
        hovermode='x unified'
    )
    
    return fig

def create_funnel_chart(variants_df: pd.DataFrame):
    """Create conversion funnel chart"""
    
    fig = go.Figure()
    
    for idx, variant in variants_df.iterrows():
        fig.add_trace(go.Funnel(
            name=variant['variant'],
            y=['Impressions', 'Clicks', 'Conversions'],
            x=[variant['impressions'], variant['clicks'], variant['conversions']],
            textinfo='value+percent initial'
        ))
    
    fig.update_layout(
        title='Conversion Funnel Comparison',
        height=500
    )
    
    return fig

# ========================================
# MAIN A/B TESTING PAGE
# ========================================

def render_ab_testing_page():
    """Main A/B testing page renderer"""
    
    apply_ab_testing_styles()
    
    st.title("🔬 A/B Testing Lab")
    st.markdown("Statistical testing, variant analysis, and winner detection")
    st.markdown("---")
    
    # Load data
    tests_df = get_active_tests()
    
    # Tabs
    tab1, tab2, tab3, tab4 = st.tabs([
        "🧪 Active Tests",
        "📊 Test Analysis",
        "📈 Results",
        "🧮 Test Planner"
    ])
    
    with tab1:
        render_active_tests(tests_df)
    
    with tab2:
        render_test_analysis(tests_df)
    
    with tab3:
        render_test_results(tests_df)
    
    with tab4:
        render_test_planner()

def render_active_tests(tests_df: pd.DataFrame):
    """Render active tests tab"""
    
    st.subheader("🧪 Active A/B Tests")
    
    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Tests", len(tests_df))
    
    with col2:
        running_tests = len(tests_df[tests_df['status'] == 'Running'])
        st.metric("Running", running_tests)
    
    with col3:
        completed_tests = len(tests_df[tests_df['status'] == 'Completed'])
        st.metric("Completed", completed_tests)
    
    with col4:
        significant_tests = len(tests_df[tests_df['significance'] < 0.05])
        st.metric("Significant Results", significant_tests)
    
    st.markdown("---")
    
    # Tests list
    st.markdown("### 📋 All Tests")
    
    for _, test in tests_df.iterrows():
        with st.expander(f"**{test['test_name']}** ({test['test_id']})"):
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                if test['status'] == 'Running':
                    st.markdown('<span class="testing-badge">🔄 Running</span>', unsafe_allow_html=True)
                else:
                    st.markdown('<span class="winner-badge">✅ Completed</span>', unsafe_allow_html=True)
            
            with col2:
                st.metric("Days Running", test['days_running'])
            
            with col3:
                st.metric("Sample Size", f"{test['sample_size']:,}")
            
            with col4:
                st.metric("Variants", test['variants'])
            
            st.markdown(f"**Testing Metric:** {test['metric']}")
            st.markdown(f"**P-value:** {test['significance']:.4f}")
            
            if test['significance'] < 0.05:
                st.success("✅ Statistically significant result (p < 0.05)")
            else:
                st.warning("⚠️ Not yet statistically significant - continue testing")
            
            if st.button(f"View Details", key=f"details_{test['test_id']}"):
                st.session_state.selected_test = test['test_id']

def render_test_analysis(tests_df: pd.DataFrame):
    """Render test analysis tab"""
    
    st.subheader("📊 Detailed Test Analysis")
    
    # Test selector
    if 'selected_test' not in st.session_state:
        st.session_state.selected_test = tests_df.iloc[0]['test_id']
    
    selected_test_id = st.selectbox(
        "Select Test",
        tests_df['test_id'].tolist(),
        format_func=lambda x: f"{x} - {tests_df[tests_df['test_id']==x]['test_name'].iloc[0]}"
    )
    
    test_info = tests_df[tests_df['test_id'] == selected_test_id].iloc[0]
    variants_df = get_test_variants(selected_test_id)
    
    # Test overview
    st.markdown("### 📋 Test Overview")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.info(f"""
        **Test Name:** {test_info['test_name']}
        **Test ID:** {test_info['test_id']}
        **Status:** {test_info['status']}
        """)
    
    with col2:
        st.info(f"""
        **Start Date:** {test_info['start_date'].strftime('%Y-%m-%d')}
        **Days Running:** {test_info['days_running']}
        **Sample Size:** {test_info['sample_size']:,}
        """)
    
    with col3:
        st.info(f"""
        **Primary Metric:** {test_info['metric']}
        **Variants:** {test_info['variants']}
        **P-value:** {test_info['significance']:.4f}
        """)
    
    st.markdown("---")
    
    # Statistical significance
    if len(variants_df) == 2:
        control = variants_df.iloc[0]
        variant = variants_df.iloc[1]
        
        p_value, lift, confidence, z_score = calculate_statistical_significance(
            control['conversions'], control['impressions'],
            variant['conversions'], variant['impressions']
        )
        
        st.markdown("### 📊 Statistical Analysis")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("P-value", f"{p_value:.4f}")
        
        with col2:
            st.metric("Confidence", f"{confidence:.1f}%")
        
        with col3:
            st.metric("Lift", f"{lift:+.1f}%")
        
        with col4:
            st.metric("Z-score", f"{z_score:.2f}")
        
        # Significance indicator
        if p_value < 0.05:
            st.markdown(f"""
            <div class="significance-indicator significant">
                <h3>✅ STATISTICALLY SIGNIFICANT</h3>
                <p>The variant is {abs(lift):.1f}% {'better' if lift > 0 else 'worse'} than control with {confidence:.1f}% confidence</p>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div class="significance-indicator not-significant">
                <h3>⚠️ NOT YET SIGNIFICANT</h3>
                <p>Continue testing to reach statistical significance (need p < 0.05)</p>
            </div>
            """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Variant comparison
    st.markdown("### 🏆 Variant Performance")
    
    st.dataframe(
        variants_df,
        width="stretch",
        hide_index=True,
        column_config={
            "variant": "Variant",
            "impressions": st.column_config.NumberColumn("Impressions", format="%d"),
            "clicks": st.column_config.NumberColumn("Clicks", format="%d"),
            "conversions": st.column_config.NumberColumn("Conversions", format="%d"),
            "ctr": st.column_config.NumberColumn("CTR", format="%.2f%%"),
            "cvr": st.column_config.NumberColumn("CVR", format="%.2f%%"),
            "cost": st.column_config.NumberColumn("Cost", format="$%.2f"),
            "revenue": st.column_config.NumberColumn("Revenue", format="$%.2f"),
            "roas": st.column_config.NumberColumn("ROAS", format="%.2fx"),
            "cpa": st.column_config.NumberColumn("CPA", format="$%.2f")
        }
    )
    
    # Charts
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        fig1 = create_variant_comparison_chart(variants_df, 'CTR')
        st.plotly_chart(fig1, width="stretch")
    
    with col2:
        fig2 = create_variant_comparison_chart(variants_df, 'CVR')
        st.plotly_chart(fig2, width="stretch")
    
    # Funnel
    st.markdown("---")
    fig3 = create_funnel_chart(variants_df)
    st.plotly_chart(fig3, width="stretch")
    
    # Time series
    st.markdown("---")
    st.markdown("### 📈 Performance Over Time")
    
    time_series_df = get_test_time_series(selected_test_id, test_info['days_running'])
    
    fig4 = create_time_series_chart(time_series_df, 'CTR')
    st.plotly_chart(fig4, width="stretch")

def render_test_results(tests_df: pd.DataFrame):
    """Render test results tab"""
    
    st.subheader("📈 Test Results & Recommendations")
    
    # Filter completed tests
    completed_tests = tests_df[tests_df['status'] == 'Completed']
    
    if len(completed_tests) == 0:
        st.info("No completed tests yet. Check back when tests finish running.")
        return
    
    for _, test in completed_tests.iterrows():
        variants_df = get_test_variants(test['test_id'])
        
        st.markdown(f"### {test['test_name']}")
        
        # Determine winner
        if test['metric'] == 'CTR':
            winner_idx = variants_df['ctr'].idxmax()
        elif test['metric'] == 'CVR':
            winner_idx = variants_df['cvr'].idxmax()
        else:  # ROAS
            winner_idx = variants_df['roas'].idxmax()
        
        winner = variants_df.loc[winner_idx]
        control = variants_df.iloc[0]
        
        # Winner announcement
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            st.markdown(f'<span class="winner-badge">🏆 WINNER: {winner["variant"]}</span>', unsafe_allow_html=True)
        
        with col2:
            if test['metric'] == 'CTR':
                improvement = ((winner['ctr'] - control['ctr']) / control['ctr']) * 100
                st.metric("CTR Improvement", f"{improvement:+.1f}%")
            elif test['metric'] == 'CVR':
                improvement = ((winner['cvr'] - control['cvr']) / control['cvr']) * 100
                st.metric("CVR Improvement", f"{improvement:+.1f}%")
            else:
                improvement = ((winner['roas'] - control['roas']) / control['roas']) * 100
                st.metric("ROAS Improvement", f"{improvement:+.1f}%")
        
        with col3:
            revenue_impact = winner['revenue'] - control['revenue']
            st.metric("Revenue Impact", f"${revenue_impact:,.0f}")
        
        # Recommendation
        st.success(f"""
        **💡 Recommendation:**
        - Deploy {winner['variant']} to all campaigns
        - Expected monthly revenue increase: ${revenue_impact * 30:,.0f}
        - Implement changes within 48 hours for maximum impact
        """)
        
        st.markdown("---")

def render_test_planner():
    """Render test planner tab"""
    
    st.subheader("🧮 A/B Test Planner")
    st.info("💡 Plan your next A/B test with statistical confidence")
    
    # Input parameters
    st.markdown("### 📊 Test Parameters")
    
    col1, col2 = st.columns(2)
    
    with col1:
        baseline_rate = st.slider("Baseline Conversion Rate (%)", 0.0, 10.0, 2.0, 0.1) / 100
        mde = st.slider("Minimum Detectable Effect (%)", 5, 50, 20, 5) / 100
    
    with col2:
        alpha = st.slider("Significance Level (α)", 0.01, 0.10, 0.05, 0.01)
        power = st.slider("Statistical Power (1-β)", 0.70, 0.95, 0.80, 0.05)
    
    # Calculate sample size
    sample_size_per_variant = calculate_sample_size_needed(baseline_rate, mde, alpha, power)
    total_sample_size = sample_size_per_variant * 2
    
    st.markdown("---")
    st.markdown("### 📈 Required Sample Size")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Per Variant", f"{sample_size_per_variant:,}")
    
    with col2:
        st.metric("Total Required", f"{total_sample_size:,}")
    
    with col3:
        # Estimate test duration
        daily_traffic = st.number_input("Daily Traffic", min_value=100, value=1000, step=100)
        test_duration = int(np.ceil(total_sample_size / daily_traffic))
        st.metric("Est. Duration", f"{test_duration} days")
    
    # Test setup guide
    st.markdown("---")
    st.markdown("### 📋 Test Setup Checklist")
    
    st.markdown("""
    **Before Starting:**
    - [ ] Define clear hypothesis and success metric
    - [ ] Ensure sufficient traffic for test duration
    - [ ] Set up proper tracking and analytics
    - [ ] Document test parameters and expected outcomes
    
    **During Test:**
    - [ ] Monitor daily for anomalies
    - [ ] Ensure equal traffic split (50/50)
    - [ ] Don't peek at results before significance
    - [ ] Run test for full calculated duration
    
    **After Test:**
    - [ ] Verify statistical significance (p < 0.05)
    - [ ] Calculate confidence intervals
    - [ ] Document learnings and insights
    - [ ] Implement winning variant if significant
    """)
    
    # Quick test ideas
    st.markdown("---")
    st.markdown("### 💡 Test Ideas")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.success("""
        **🎨 Creative Tests:**
        - Image vs Video ads
        - Different CTA button colors
        - Headline copy variations
        - Product showcase formats
        """)
    
    with col2:
        st.info("""
        **🎯 Targeting Tests:**
        - Audience segment comparison
        - Geographic targeting
        - Device type optimization
        - Time of day performance
        """)

# Call the main function directly (required for Streamlit multi-page apps)
render_ab_testing_page()
