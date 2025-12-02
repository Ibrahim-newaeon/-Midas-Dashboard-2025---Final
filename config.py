# config.py
# Configuration file for Midas Furniture Dashboard

import os

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

# Meta (Facebook) Ads API
META_ACCESS_TOKEN = os.getenv('META_ACCESS_TOKEN', '')
META_AD_ACCOUNT_ID = os.getenv('META_AD_ACCOUNT_ID', '')

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