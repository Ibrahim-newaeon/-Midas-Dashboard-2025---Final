"""
Meta API Connection Status - Debug Page
Check your Meta Ads API connection and troubleshoot issues.
"""

import streamlit as st
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

st.set_page_config(
    page_title="API Status - Midas Analytics",
    page_icon="🔌",
    layout="wide"
)

st.title("🔌 Meta API Connection Status")

# Check configuration
st.header("1. Configuration Check")

try:
    import config

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Credentials Status")

        # Check token
        token = config.META_ACCESS_TOKEN
        if token and len(token) > 10:
            st.success(f"✅ Access Token: Set ({len(token)} chars, starts with '{token[:10]}...')")
        else:
            st.error("❌ Access Token: Not set or too short")

        # Check account ID
        account_id = config.META_AD_ACCOUNT_ID
        if account_id:
            if account_id.startswith('act_'):
                st.success(f"✅ Ad Account ID: {account_id}")
            else:
                st.warning(f"⚠️ Ad Account ID: {account_id} (should start with 'act_')")
        else:
            st.error("❌ Ad Account ID: Not set")

        # Check accounts list
        accounts = config.META_AD_ACCOUNTS
        if accounts:
            st.success(f"✅ Multiple Accounts: {len(accounts)} configured")
            for acc in accounts:
                st.write(f"   - {acc}")
        else:
            st.info("ℹ️ Multiple Accounts: Not configured (using single account)")

    with col2:
        st.subheader("Feature Flags")

        use_live = config.USE_LIVE_META_DATA
        if use_live:
            st.success("✅ USE_LIVE_META_DATA: True (Live mode)")
        else:
            st.warning("⚠️ USE_LIVE_META_DATA: False (Demo mode)")
            st.info("Set USE_LIVE_META_DATA = \"true\" in secrets to enable live data")

except Exception as e:
    st.error(f"❌ Config Error: {e}")

st.divider()

# Check SDK
st.header("2. Facebook SDK Check")

try:
    from facebook_business.api import FacebookAdsApi
    from facebook_business.adobjects.adaccount import AdAccount
    st.success("✅ Facebook Business SDK: Installed")
except ImportError as e:
    st.error(f"❌ Facebook Business SDK: Not installed")
    st.code("pip install facebook-business")

st.divider()

# Test Connection
st.header("3. API Connection Test")

if st.button("🔄 Test Connection Now"):
    with st.spinner("Testing connection..."):
        try:
            from app.data_integration.meta_api import MetaAdsClient, get_config_values

            # Get config
            cfg = get_config_values()

            st.write("**Config Values:**")
            st.json({
                'access_token': f"{cfg['access_token'][:15]}..." if cfg['access_token'] else "NOT SET",
                'ad_accounts': cfg['ad_accounts'],
                'use_live_data': cfg['use_live_data'],
            })

            if not cfg['use_live_data']:
                st.warning("⚠️ Live data is DISABLED. Set USE_LIVE_META_DATA = \"true\"")
                st.stop()

            if not cfg['access_token']:
                st.error("❌ No access token configured")
                st.stop()

            # Initialize client
            client = MetaAdsClient()

            if client.initialized:
                st.success("✅ Meta API: Connected successfully!")

                # Try to fetch account info
                st.write("**Fetching account info...**")
                for acc_id in client.account_ids[:3]:  # Limit to first 3
                    info = client.fetch_account_info(acc_id)
                    if 'error' in info:
                        st.error(f"❌ {acc_id}: {info['error']}")
                    else:
                        st.success(f"✅ {acc_id}: {info.get('name', 'Unknown')}")
                        st.json(info)
            else:
                st.error("❌ Meta API: Failed to initialize")
                st.info("Check your access token and permissions")

        except Exception as e:
            st.error(f"❌ Connection Error: {str(e)}")
            st.exception(e)

st.divider()

# Help section
st.header("4. Troubleshooting Guide")

with st.expander("🔑 How to get Access Token"):
    st.markdown("""
    1. Go to [business.facebook.com/settings](https://business.facebook.com/settings)
    2. Navigate to **Users** → **System Users**
    3. Create a System User (if none exists)
    4. Click **Generate New Token**
    5. Select your **App**
    6. Select permissions:
       - `ads_read` ✓
       - `ads_management` (optional)
       - `business_management` (optional)
    7. Copy the token
    """)

with st.expander("🏢 How to get Ad Account ID"):
    st.markdown("""
    1. Go to [business.facebook.com/settings](https://business.facebook.com/settings)
    2. Navigate to **Accounts** → **Ad Accounts**
    3. Copy the **Account ID** (format: `act_XXXXXXXXXX`)

    **Important:** The ID must start with `act_`
    """)

with st.expander("⚠️ Common Errors"):
    st.markdown("""
    | Error | Solution |
    |-------|----------|
    | `Invalid OAuth access token` | Token expired or invalid - generate new one |
    | `User does not have permission` | Add your System User to the Ad Account |
    | `Ad account not found` | Check account ID starts with `act_` |
    | `Rate limit exceeded` | Wait a few minutes and try again |
    """)

with st.expander("📝 Correct Secrets Format"):
    st.code("""
# In Streamlit Cloud Secrets:

META_ACCESS_TOKEN = "EAAGxxxxxxxxxxxx"
META_AD_ACCOUNT_ID = "act_123456789"
USE_LIVE_META_DATA = "true"

# Optional: Multiple accounts
META_AD_ACCOUNTS = "act_111111,act_222222"

[META_ACCOUNT_NAMES]
"act_111111" = "Client A"
"act_222222" = "Client B"
    """, language="toml")
