import streamlit as st
import datetime

def apply_custom_css():
    st.markdown(
        """
        <style>
        /* Sidebar Background & Text */
        [data-testid="stSidebar"] {
            background: linear-gradient(180deg, #0B0F1A 0%, #1C2331 100%);
            color: white !important;
        }

        /* Force white text for all headers and spans in sidebar */
        [data-testid="stSidebar"] h1,
        [data-testid="stSidebar"] h2,
        [data-testid="stSidebar"] h3,
        [data-testid="stSidebar"] p,
        [data-testid="stSidebar"] span,
        [data-testid="stSidebar"] label,
        [data-testid="stSidebar"] div[data-baseweb="radio"] div {
            color: #f0f0f0 !important;
        }

        /* Metric Values */
        [data-testid="stMetricValue"] {
            color: #00A86B !important;
            font-weight: 700;
        }

        /* Tab Colors */
        div[data-baseweb="tab"] button[aria-selected="true"]:nth-child(1) {background-color: #00A86B !important; color: white !important;}
        div[data-baseweb="tab"] button[aria-selected="true"]:nth-child(2) {background-color: #CE1126 !important; color: white !important;}
        div[data-baseweb="tab"] button[aria-selected="true"]:nth-child(3) {background-color: #0066CC !important; color: white !important;}

        /* Login Container */
        .login-container {
            max-width: 400px;
            margin: auto;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Fix specific widget labeling in sidebar */
        [data-testid="stSidebar"] div[data-baseweb="select"] div {
            color: #f0f0f0 !important;
        }

        /* Grafana Style Panel */
        .grafana-panel {
            background-color: #181b1f;
            border: 1px solid #2c3235;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .panel-header {
            color: #d8d9da;
            font-weight: 500;
            font-size: 16px;
            margin-bottom: 10px;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

def check_authentication():
    # If using multipage apps, session state is preserved.
    # We need to check if logged in.
    if 'logged_in' not in st.session_state:
        st.session_state.logged_in = False

    if not st.session_state.logged_in:
        st.error("Please login via the main Dashboard page.")
        st.stop()

    # Render Sidebar User Info
    st.sidebar.markdown("---")
    st.sidebar.title(f"👤 {st.session_state.get('username', 'User')}")
    if st.sidebar.button("Logout", key="logout_btn_common"):
        st.session_state.logged_in = False
        st.switch_page("dashboard.py") # Redirect to main page

PLOTLY_TEMPLATE = "plotly_dark"
PLOTLY_CONFIG = {"displaylogo": False, "modeBarButtonsToRemove": ["lasso2d", "select2d"]}
