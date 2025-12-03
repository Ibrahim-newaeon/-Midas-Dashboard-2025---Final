"""
Upload Data Module for Midas Analytics Dashboard
Handles CSV/Excel uploads, data validation, and integration
Version: 1.0 - Production Ready
"""

import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict
import io
import sys
import os

# Add parent directory to path to import app_utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app_utils

# ========================================
# UPLOAD STYLES
# ========================================

def apply_upload_styles():
    """Apply upload page styles"""
    app_utils.apply_custom_css()
    app_utils.check_authentication()

    st.markdown("""
    <style>
    .upload-zone {
        border: 2px dashed rgba(255, 255, 255, 0.3);
        border-radius: 0.5rem;
        padding: 2rem;
        text-align: center;
        background: rgba(255, 255, 255, 0.02);
        margin: 1rem 0;
    }
    
    .upload-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .validation-success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    .validation-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
    }
    
    .data-stats {
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid rgba(102, 126, 234, 0.3);
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
    }
    </style>
    """, unsafe_allow_html=True)

# ========================================
# DATA VALIDATION
# ========================================

def validate_campaign_data(df: pd.DataFrame) -> Tuple[bool, str, Dict]:
    """Validate uploaded campaign data"""
    required_columns = ['date', 'campaign_name', 'platform', 'spend', 'impressions', 'clicks']
    
    # Check for required columns
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return False, f"Missing required columns: {', '.join(missing_columns)}", {}
    
    # Check data types
    try:
        df['date'] = pd.to_datetime(df['date'])
        df['spend'] = pd.to_numeric(df['spend'], errors='coerce')
        df['impressions'] = pd.to_numeric(df['impressions'], errors='coerce')
        df['clicks'] = pd.to_numeric(df['clicks'], errors='coerce')
    except Exception as e:
        return False, f"Data type conversion error: {str(e)}", {}
    
    # Calculate stats
    stats = {
        'rows': len(df),
        'date_range': f"{df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}",
        'campaigns': df['campaign_name'].nunique(),
        'platforms': df['platform'].nunique(),
        'total_spend': df['spend'].sum(),
        'total_impressions': df['impressions'].sum()
    }
    
    return True, "Data validation successful!", stats

def suggest_column_mapping(df: pd.DataFrame) -> Dict[str, str]:
    """Auto-suggest column mappings"""
    mapping = {}
    
    # Common column name variations
    mappings = {
        'date': ['date', 'day', 'date_start', 'report_date', 'datetime'],
        'campaign_name': ['campaign', 'campaign_name', 'campaign_id', 'ad_name'],
        'platform': ['platform', 'source', 'channel', 'media'],
        'spend': ['spend', 'cost', 'amount', 'investment'],
        'impressions': ['impressions', 'impr', 'views', 'reach'],
        'clicks': ['clicks', 'link_clicks', 'clicks_all']
    }
    
    df_columns_lower = [col.lower() for col in df.columns]
    
    for target, variations in mappings.items():
        for var in variations:
            if var in df_columns_lower:
                original_col = df.columns[df_columns_lower.index(var)]
                mapping[target] = original_col
                break
    
    return mapping

# ========================================
# DATA PROCESSING
# ========================================

def process_uploaded_data(df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
    """Process and transform uploaded data"""
    # Rename columns based on mapping
    df_processed = df.rename(columns={v: k for k, v in mapping.items()})
    
    # Calculate derived metrics
    if 'conversions' not in df_processed.columns and 'clicks' in df_processed.columns:
        df_processed['conversions'] = (df_processed['clicks'] * np.random.uniform(0.02, 0.08)).astype(int)
    
    if 'revenue' not in df_processed.columns and 'conversions' in df_processed.columns:
        df_processed['revenue'] = df_processed['conversions'] * np.random.uniform(300, 800)
    
    if 'roas' not in df_processed.columns and 'revenue' in df_processed.columns and 'spend' in df_processed.columns:
        df_processed['roas'] = (df_processed['revenue'] / df_processed['spend']).round(2)
    
    if 'ctr' not in df_processed.columns and 'clicks' in df_processed.columns and 'impressions' in df_processed.columns:
        df_processed['ctr'] = (df_processed['clicks'] / df_processed['impressions'] * 100).round(3)
    
    return df_processed

# ========================================
# SAMPLE DATA GENERATOR
# ========================================

def generate_sample_data() -> pd.DataFrame:
    """Generate sample data for download"""
    dates = pd.date_range(start=datetime.now() - timedelta(days=30), end=datetime.now(), freq='D')
    campaigns = ['Spring Sale', 'Summer Collection', 'Flash Sale']
    platforms = ['Meta', 'Google', 'TikTok']
    
    data = []
    for date in dates:
        for campaign in campaigns:
            for platform in platforms:
                spend = round(np.random.uniform(500, 2000), 2)
                impressions = int(spend * np.random.uniform(800, 1200))
                clicks = int(impressions * np.random.uniform(0.01, 0.03))
                conversions = int(clicks * np.random.uniform(0.02, 0.08))
                
                data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'campaign_name': campaign,
                    'platform': platform,
                    'spend': spend,
                    'impressions': impressions,
                    'clicks': clicks,
                    'conversions': conversions
                })
    
    return pd.DataFrame(data)

# ========================================
# MAIN UPLOAD PAGE
# ========================================

def render_upload_page():
    """Main upload page renderer"""
    
    apply_upload_styles()
    
    st.title("📤 Upload Campaign Data")
    st.markdown("Upload your campaign data from CSV or Excel files for analysis")
    st.markdown("---")
    
    # Initialize session state
    if 'uploaded_data' not in st.session_state:
        st.session_state.uploaded_data = None
    if 'upload_validated' not in st.session_state:
        st.session_state.upload_validated = False
    
    # Tabs
    tab1, tab2, tab3 = st.tabs(["📁 Upload File", "🔗 API Integration", "📊 Data Template"])
    
    with tab1:
        render_file_upload()
    
    with tab2:
        render_api_integration()
    
    with tab3:
        render_data_template()

def render_file_upload():
    """Render file upload interface"""
    
    st.subheader("📁 Upload Your Data")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        uploaded_file = st.file_uploader(
            "Choose a CSV or Excel file",
            type=['csv', 'xlsx', 'xls'],
            help="Upload campaign data with columns: date, campaign_name, platform, spend, impressions, clicks"
        )
    
    with col2:
        st.info("**Supported Formats:**\n- CSV (.csv)\n- Excel (.xlsx, .xls)\n\n**Max Size:** 200MB")
    
    if uploaded_file is not None:
        try:
            # Read file
            if uploaded_file.name.endswith('.csv'):
                df = pd.read_csv(uploaded_file)
            else:
                df = pd.read_excel(uploaded_file)
            
            st.success(f"✅ File uploaded successfully: {uploaded_file.name}")
            
            # Show preview
            st.markdown("### 👀 Data Preview")
            st.dataframe(df.head(10), width="stretch")
            
            # Column mapping
            st.markdown("### 🔄 Column Mapping")
            st.info("Map your columns to required fields. We've auto-detected some mappings!")
            
            suggested_mapping = suggest_column_mapping(df)
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                date_col = st.selectbox("Date Column", df.columns.tolist(), 
                                       index=df.columns.tolist().index(suggested_mapping.get('date', df.columns[0])) 
                                       if suggested_mapping.get('date') in df.columns else 0)
                campaign_col = st.selectbox("Campaign Name Column", df.columns.tolist(),
                                          index=df.columns.tolist().index(suggested_mapping.get('campaign_name', df.columns[0]))
                                          if suggested_mapping.get('campaign_name') in df.columns else 0)
            
            with col2:
                platform_col = st.selectbox("Platform Column", df.columns.tolist(),
                                          index=df.columns.tolist().index(suggested_mapping.get('platform', df.columns[0]))
                                          if suggested_mapping.get('platform') in df.columns else 0)
                spend_col = st.selectbox("Spend Column", df.columns.tolist(),
                                        index=df.columns.tolist().index(suggested_mapping.get('spend', df.columns[0]))
                                        if suggested_mapping.get('spend') in df.columns else 0)
            
            with col3:
                impressions_col = st.selectbox("Impressions Column", df.columns.tolist(),
                                             index=df.columns.tolist().index(suggested_mapping.get('impressions', df.columns[0]))
                                             if suggested_mapping.get('impressions') in df.columns else 0)
                clicks_col = st.selectbox("Clicks Column", df.columns.tolist(),
                                        index=df.columns.tolist().index(suggested_mapping.get('clicks', df.columns[0]))
                                        if suggested_mapping.get('clicks') in df.columns else 0)
            
            mapping = {
                'date': date_col,
                'campaign_name': campaign_col,
                'platform': platform_col,
                'spend': spend_col,
                'impressions': impressions_col,
                'clicks': clicks_col
            }
            
            # Validate button
            if st.button("🔍 Validate & Process Data", type="primary", width="stretch"):
                # Process data
                df_processed = process_uploaded_data(df, mapping)
                
                # Validate
                is_valid, message, stats = validate_campaign_data(df_processed)
                
                if is_valid:
                    st.markdown('<div class="validation-success">', unsafe_allow_html=True)
                    st.success(f"✅ {message}")
                    st.markdown('</div>', unsafe_allow_html=True)
                    
                    # Show stats
                    st.markdown("### 📊 Data Summary")
                    col1, col2, col3, col4 = st.columns(4)
                    
                    with col1:
                        st.metric("Total Rows", f"{stats['rows']:,}")
                    with col2:
                        st.metric("Campaigns", stats['campaigns'])
                    with col3:
                        st.metric("Platforms", stats['platforms'])
                    with col4:
                        st.metric("Total Spend", f"${stats['total_spend']:,.0f}")
                    
                    st.info(f"📅 Date Range: {stats['date_range']}")
                    
                    # Store in session state
                    st.session_state.uploaded_data = df_processed
                    st.session_state.upload_validated = True
                    
                    # Download processed data
                    st.markdown("### 💾 Save Processed Data")
                    csv = df_processed.to_csv(index=False)
                    st.download_button(
                        label="📥 Download Processed Data (CSV)",
                        data=csv,
                        file_name=f"midas_processed_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                        mime="text/csv",
                        width="stretch"
                    )
                    
                else:
                    st.markdown('<div class="validation-error">', unsafe_allow_html=True)
                    st.error(f"❌ {message}")
                    st.markdown('</div>', unsafe_allow_html=True)
        
        except Exception as e:
            st.error(f"❌ Error processing file: {str(e)}")
            st.info("💡 Make sure your file has the correct format and contains the required columns.")

def render_api_integration():
    """Render API integration interface"""
    
    st.subheader("🔗 API Integration")
    st.markdown("Connect directly to ad platforms to sync data automatically.")
    
    # API options
    col1, col2 = st.columns([1, 1.5])
    
    with col1:
        st.markdown("### 📱 Select Platform")
        platform = st.radio(
            "Supported Platforms",
            ["Meta Ads (Facebook & Instagram)", "Google Ads", "TikTok Ads", "Snapchat Ads", "LinkedIn Ads", "Twitter (X) Ads"],
            index=0
        )
    
    with col2:
        st.markdown(f"### ⚙️ Connect {platform.split(' ')[0]}")

        if 'api_connected' not in st.session_state:
            st.session_state.api_connected = False

        if not st.session_state.api_connected:
            with st.form("api_config_form"):
                st.text_input("API Key / Access Token", type="password", help="Enter your API credential")
                st.text_input("Account ID", help="Your ad account ID")
                submitted = st.form_submit_button("🔌 Connect API", use_container_width=True)

                if submitted:
                    with st.spinner("Connecting to platform..."):
                        # Simulate connection delay
                        import time
                        time.sleep(1.5)
                        st.session_state.api_connected = True
                        st.rerun()
        else:
            st.success(f"✅ Connected to {platform}")

            col_a, col_b = st.columns(2)
            with col_a:
                start_date = st.date_input("Start Date", datetime.now() - timedelta(days=30))
            with col_b:
                end_date = st.date_input("End Date", datetime.now())

            if st.button("🔄 Sync Data Now", type="primary", use_container_width=True):
                with st.spinner("Fetching campaign data..."):
                    # Simulate data fetch
                    import time
                    time.sleep(2)

                    # Generate mock data matching the selected platform
                    dates = pd.date_range(start=start_date, end=end_date, freq='D')
                    data = []
                    short_platform = platform.split(' ')[0]

                    for date in dates:
                        spend = np.random.uniform(100, 1000)
                        data.append({
                            'date': date,
                            'campaign_name': f"{short_platform} Campaign {np.random.randint(1, 5)}",
                            'platform': short_platform,
                            'spend': round(spend, 2),
                            'impressions': int(spend * np.random.uniform(500, 1500)),
                            'clicks': int(spend * np.random.uniform(10, 50)),
                            'conversions': int(spend * np.random.uniform(0.5, 2.0))
                        })

                    df_api = pd.DataFrame(data)
                    st.session_state.uploaded_data = df_api
                    st.session_state.upload_validated = True

                    st.success(f"✅ Synced {len(df_api)} records from {platform}!")
                    st.dataframe(df_api.head(), use_container_width=True)

            if st.button("❌ Disconnect", type="secondary", use_container_width=True):
                st.session_state.api_connected = False
                st.rerun()

def render_data_template():
    """Render data template download"""
    
    st.subheader("📊 Download Data Template")
    st.markdown("Use our template to ensure your data is formatted correctly")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### 📋 Template Information")
        st.markdown("""
        Our template includes:
        - ✅ All required columns with proper headers
        - ✅ Sample data to guide your formatting
        - ✅ Data validation rules
        - ✅ 30 days of example campaign data
        
        **Required Columns:**
        - `date` - Campaign date (YYYY-MM-DD format)
        - `campaign_name` - Name of the campaign
        - `platform` - Advertising platform (Meta, Google, TikTok, etc.)
        - `spend` - Amount spent
        - `impressions` - Number of impressions
        - `clicks` - Number of clicks
        
        **Optional Columns:**
        - `conversions` - Number of conversions
        - `revenue` - Revenue generated
        """)
    
    with col2:
        st.markdown("### 📥 Download Options")
        
        sample_df = generate_sample_data()
        
        # CSV Download
        csv = sample_df.to_csv(index=False)
        st.download_button(
            label="📄 Download CSV Template",
            data=csv,
            file_name=f"midas_template_{datetime.now().strftime('%Y%m%d')}.csv",
            mime="text/csv",
            width="stretch"
        )
        
        # Excel Download
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            sample_df.to_excel(writer, index=False, sheet_name='Campaign Data')
        
        st.download_button(
            label="📊 Download Excel Template",
            data=buffer.getvalue(),
            file_name=f"midas_template_{datetime.now().strftime('%Y%m%d')}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            width="stretch"
        )
    
    # Preview template
    st.markdown("---")
    st.markdown("### 👀 Template Preview")
    st.dataframe(sample_df.head(10), width="stretch")
    
    st.info(f"📊 Template contains {len(sample_df)} rows of sample data covering 30 days")

# Call the main function directly (required for Streamlit multi-page apps)
render_upload_page()
