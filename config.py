# config.py
# Configuration file for Midas Furniture Dashboard

import os
import json

# ============================================================================
# HELPER FUNCTION FOR STREAMLIT SECRETS
# ============================================================================

def get_secret(key, default=''):
    """Get value from Streamlit secrets or environment variable."""
    # Try Streamlit secrets first
    try:
        import streamlit as st
        if key in st.secrets:
            return st.secrets[key]
    except:
        pass
    # Fall back to environment variable
    return os.getenv(key, default)

def get_secret_dict(key):
    """Get dictionary from Streamlit secrets or environment variable."""
    # Try Streamlit secrets first (nested TOML format)
    try:
        import streamlit as st
        if key in st.secrets:
            secret_val = st.secrets[key]
            # If it's already a dict-like object (from TOML section)
            if hasattr(secret_val, 'to_dict'):
                return dict(secret_val.to_dict())
            elif isinstance(secret_val, dict):
                return secret_val
            elif isinstance(secret_val, str):
                return json.loads(secret_val)
    except:
        pass
    # Fall back to environment variable (JSON string)
    env_val = os.getenv(key, '{}')
    try:
        return json.loads(env_val)
    except:
        return {}

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# SQLite database path
DB_PATH = 'furniture.db'

# ============================================================================
# MODEL STORAGE
# ============================================================================

# Path for ML model storage
CONVERSION_MODEL_PATH = 'models/conversion_model.pkl'

# Ensure model directory exists
os.makedirs('models', exist_ok=True)

# ============================================================================
# API CREDENTIALS (Optional - for future live data integration)
# ============================================================================

# Meta (Facebook) Ads API - Multi-Account Support
META_ACCESS_TOKEN = get_secret('META_ACCESS_TOKEN', '')

# Single account (legacy support)
META_AD_ACCOUNT_ID = get_secret('META_AD_ACCOUNT_ID', '')

# Multiple accounts - comma-separated list: "act_111111,act_222222,act_333333"
_meta_accounts_str = str(get_secret('META_AD_ACCOUNTS', ''))
META_AD_ACCOUNTS = [acc.strip() for acc in _meta_accounts_str.split(',') if acc.strip()]

# If no multi-account config, fall back to single account
if not META_AD_ACCOUNTS and META_AD_ACCOUNT_ID:
    META_AD_ACCOUNTS = [META_AD_ACCOUNT_ID]

# Account name mapping (optional)
# Supports both TOML section format and JSON string
META_ACCOUNT_NAMES = get_secret_dict('META_ACCOUNT_NAMES')

# Use live API data (set to True when credentials are configured)
_use_live = get_secret('USE_LIVE_META_DATA', 'false')
USE_LIVE_META_DATA = str(_use_live).lower() == 'true'

# Google Ads API
GOOGLE_DEVELOPER_TOKEN = os.getenv('GOOGLE_DEVELOPER_TOKEN', '')
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REFRESH_TOKEN = os.getenv('GOOGLE_REFRESH_TOKEN', '')

# TikTok Ads API
TIKTOK_ACCESS_TOKEN = os.getenv('TIKTOK_ACCESS_TOKEN', '')
TIKTOK_ADVERTISER_ID = os.getenv('TIKTOK_ADVERTISER_ID', '')

# Snapchat Ads API
SNAPCHAT_ACCESS_TOKEN = os.getenv('SNAPCHAT_ACCESS_TOKEN', '')
SNAPCHAT_AD_ACCOUNT_ID = os.getenv('SNAPCHAT_AD_ACCOUNT_ID', '')

# ============================================================================
# APPLICATION SETTINGS
# ============================================================================

# Data refresh interval (in seconds)
DATA_CACHE_TTL = 3600  # 1 hour

# Default date range for reports (in days)
DEFAULT_DATE_RANGE = 30

# Performance thresholds
ROAS_TARGET = 2.5
CPA_TARGET = 35.0
CTR_TARGET = 1.8

# ============================================================================
# FEATURE FLAGS
# ============================================================================

# Enable/disable features
ENABLE_ML_PREDICTIONS = True
ENABLE_ANOMALY_DETECTION = True
ENABLE_AUTO_RECOMMENDATIONS = True
ENABLE_CHATBOT = False  # Set to True when Tawk.to configured

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'