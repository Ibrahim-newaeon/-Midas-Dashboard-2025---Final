import streamlit as st
import datetime

def apply_custom_css():
    st.markdown(
        """
        <style>
        /* ============================================
           AL-AI.AI DASHBOARD THEME
           Dark theme with blue/green gradient accents
           ============================================ */

        /* Main Background */
        .stApp {
            background: #0e1117;
        }

        /* Sidebar Styling */
        [data-testid="stSidebar"] {
            background: #262730;
            border-right: 1px solid #333;
        }

        [data-testid="stSidebar"] h1,
        [data-testid="stSidebar"] h2,
        [data-testid="stSidebar"] h3,
        [data-testid="stSidebar"] p,
        [data-testid="stSidebar"] span,
        [data-testid="stSidebar"] label,
        [data-testid="stSidebar"] div {
            color: #fafafa !important;
        }

        /* Sidebar Logo Box */
        .sidebar-logo {
            background: #1f77b4;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 1.2rem;
            font-weight: bold;
        }

        /* Sidebar Section Headers */
        .sidebar-header {
            color: #fafafa;
            font-size: 1.1rem;
            margin: 20px 0 10px 0;
            border-bottom: 2px solid #1f77b4;
            padding-bottom: 5px;
        }

        /* Header Banner */
        .header-banner {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #1f77b4 0%, #2ca02c 100%);
            border-radius: 10px;
        }

        .header-banner h1 {
            font-size: 2rem;
            margin-bottom: 10px;
            color: white;
        }

        .header-banner p {
            font-size: 1rem;
            color: rgba(255,255,255,0.9);
        }

        /* KPI Cards */
        .kpi-card {
            background: linear-gradient(135deg, #262730 0%, #1e1e1e 100%);
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #1f77b4;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            margin-bottom: 15px;
        }

        .kpi-card .label {
            font-size: 0.9rem;
            color: #999;
            margin-bottom: 10px;
        }

        .kpi-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #1f77b4;
            margin-bottom: 5px;
        }

        .kpi-card .delta {
            font-size: 0.85rem;
            color: #2ca02c;
        }

        .kpi-card .delta.negative {
            color: #d62728;
        }

        /* Metric Values Override */
        [data-testid="stMetricValue"] {
            color: #1f77b4 !important;
            font-weight: 700;
            font-size: 1.8rem !important;
        }

        [data-testid="stMetricDelta"] svg {
            display: none;
        }

        /* Tab Styling */
        .stTabs [data-baseweb="tab-list"] {
            gap: 10px;
            border-bottom: 2px solid #333;
        }

        .stTabs [data-baseweb="tab"] {
            padding: 15px 30px;
            background: #262730;
            border-radius: 5px 5px 0 0;
            color: #fafafa;
        }

        .stTabs [aria-selected="true"] {
            background: #1f77b4 !important;
            color: white !important;
        }

        /* Chart Container */
        .chart-container {
            background: #262730;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            margin-bottom: 20px;
        }

        .chart-container h3 {
            margin-bottom: 15px;
            color: #fafafa;
            border-bottom: 2px solid #1f77b4;
            padding-bottom: 10px;
        }

        /* Table Styling */
        .stDataFrame {
            background: #262730;
            border-radius: 10px;
        }

        .stDataFrame thead tr th {
            background: #1f77b4 !important;
            color: white !important;
            padding: 12px !important;
        }

        .stDataFrame tbody tr td {
            padding: 12px !important;
            border-bottom: 1px solid #333 !important;
        }

        .stDataFrame tbody tr:hover {
            background: #1e1e1e !important;
        }

        /* Alert Cards */
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 5px solid;
        }

        .alert.critical {
            background: rgba(214, 39, 40, 0.1);
            border-color: #d62728;
        }

        .alert.warning {
            background: rgba(255, 193, 7, 0.1);
            border-color: #ffc107;
        }

        .alert.good {
            background: rgba(44, 160, 44, 0.1);
            border-color: #2ca02c;
        }

        .alert-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #fafafa;
        }

        .alert-body {
            color: #ccc;
        }

        .alert-recommendation {
            margin-top: 5px;
            font-size: 0.9rem;
            color: #999;
        }

        /* Buttons */
        .stButton > button {
            width: 100%;
            padding: 12px;
            background: #1f77b4;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            transition: background 0.3s;
        }

        .stButton > button:hover {
            background: #1557a0;
            color: white;
        }

        /* Select boxes */
        .stSelectbox > div > div {
            background: #1e1e1e;
            border: 1px solid #444;
            color: #fafafa;
        }

        /* Date inputs */
        .stDateInput > div > div > input {
            background: #1e1e1e;
            border: 1px solid #444;
            color: #fafafa;
        }

        /* Multiselect */
        .stMultiSelect > div > div {
            background: #1e1e1e;
            border: 1px solid #444;
        }

        /* Login Container */
        .login-container {
            max-width: 400px;
            margin: auto;
            padding: 2rem;
            background: rgba(38, 39, 48, 0.95);
            border-radius: 10px;
            border: 1px solid #333;
        }

        .login-container h1,
        .login-container h2,
        .login-container h3,
        .login-container p,
        .login-container span,
        .login-container label,
        .login-container div {
            color: #fafafa !important;
        }

        /* Divider */
        hr {
            border: 1px solid #333;
            margin: 30px 0;
        }

        /* Footer */
        .footer {
            margin-top: 50px;
            padding: 20px;
            text-align: center;
            border-top: 2px solid #333;
            color: #999;
        }

        .footer strong {
            color: #1f77b4;
        }

        /* Grafana Panel (legacy support) */
        .grafana-panel {
            background-color: #262730;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
        }

        .panel-header {
            color: #fafafa;
            font-weight: 500;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 2px solid #1f77b4;
            padding-bottom: 10px;
        }

        /* Hide Streamlit branding */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}

        </style>
        """,
        unsafe_allow_html=True,
    )

def render_header_banner(title: str, subtitle: str = None):
    """Render the header banner with gradient background."""
    subtitle_html = f'<p>{subtitle}</p>' if subtitle else ''
    st.markdown(f"""
        <div class="header-banner">
            <h1>{title}</h1>
            {subtitle_html}
        </div>
    """, unsafe_allow_html=True)

def render_kpi_card(label: str, value: str, delta: str = None, delta_negative: bool = False):
    """Render a KPI card with the new styling."""
    delta_class = "negative" if delta_negative else ""
    delta_html = f'<div class="delta {delta_class}">{delta}</div>' if delta else ''
    st.markdown(f"""
        <div class="kpi-card">
            <div class="label">{label}</div>
            <div class="value">{value}</div>
            {delta_html}
        </div>
    """, unsafe_allow_html=True)

def render_alert(alert_type: str, title: str, body: str, recommendation: str = None):
    """
    Render an alert card.
    alert_type: 'critical', 'warning', or 'good'
    """
    rec_html = f'<div class="alert-recommendation"><strong>Recommendation:</strong> {recommendation}</div>' if recommendation else ''
    st.markdown(f"""
        <div class="alert {alert_type}">
            <div class="alert-title">{title}</div>
            <div class="alert-body">{body}</div>
            {rec_html}
        </div>
    """, unsafe_allow_html=True)

def render_chart_container(title: str):
    """Start a chart container - use with st.markdown to close."""
    st.markdown(f"""
        <div class="chart-container">
            <h3>{title}</h3>
    """, unsafe_allow_html=True)

def close_chart_container():
    """Close a chart container."""
    st.markdown("</div>", unsafe_allow_html=True)

def render_footer():
    """Render the footer."""
    import datetime
    st.markdown(f"""
        <div class="footer">
            <p>🚀 Built by <strong>al-ai.ai</strong> | Digital Media Buying Dashboard v2.0</p>
            <p style="margin-top: 10px;">📧 info@al-ai.ai | 🌐 Platform: Meta • Google • TikTok • Snapchat</p>
        </div>
    """, unsafe_allow_html=True)

def check_authentication():
    if 'logged_in' not in st.session_state:
        st.session_state.logged_in = False

    if not st.session_state.logged_in:
        st.error("Please login via the main Dashboard page.")
        st.stop()

    st.sidebar.markdown("---")
    st.sidebar.title(f"👤 {st.session_state.get('username', 'User')}")
    if st.sidebar.button("Logout", key="logout_btn_common"):
        st.session_state.logged_in = False
        st.switch_page("dashboard.py")

PLOTLY_TEMPLATE = "plotly_dark"
PLOTLY_CONFIG = {"displaylogo": False, "modeBarButtonsToRemove": ["lasso2d", "select2d"]}

# Plotly color scheme matching the theme
PLOTLY_COLORS = {
    'primary': '#1f77b4',
    'secondary': '#2ca02c',
    'warning': '#ffc107',
    'danger': '#d62728',
    'info': '#17a2b8',
    'platforms': {
        'Meta': '#1f77b4',
        'Google': '#2ca02c',
        'TikTok': '#ff7f0e',
        'Snapchat': '#ffc107'
    }
}
