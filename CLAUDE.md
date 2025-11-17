# CLAUDE.md - AI Assistant Guide for Midas Furniture Dashboard

**Last Updated:** 2025-11-17
**Project:** Midas Furniture Campaign Analytics Dashboard
**Version:** 6.1 (Streamlit 2026 Ready)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Codebase Structure](#codebase-structure)
4. [Database Architecture](#database-architecture)
5. [Key Components](#key-components)
6. [Development Workflows](#development-workflows)
7. [Coding Conventions](#coding-conventions)
8. [Common Tasks](#common-tasks)
9. [Security & Authentication](#security--authentication)
10. [Testing Strategy](#testing-strategy)
11. [AI Assistant Guidelines](#ai-assistant-guidelines)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

### Purpose
Midas Furniture Dashboard is a comprehensive analytics platform for digital marketing teams to track, analyze, and optimize multi-platform advertising campaigns across Meta, Google, TikTok, and Snapchat.

### Core Features
- **Multi-Platform Analytics**: Campaign performance tracking across 4 advertising platforms
- **User Management**: Role-based access control with bcrypt authentication
- **Creative Analysis**: Ad creative performance and fatigue detection
- **Customer Segmentation**: RFM analysis and persona intelligence
- **Budget Pacing**: Real-time budget tracking with automated alerts
- **A/B Testing**: Statistical significance testing for ad variants
- **Data Export**: CSV, Excel, and PDF export capabilities
- **ML Predictions**: Optional machine learning-powered conversion predictions
- **Anomaly Detection**: Automated performance anomaly alerts

### Deployment Target
- Primary: Streamlit Cloud (production)
- Secondary: Local development environment

---

## 🛠 Technology Stack

### Core Framework
- **Streamlit** (>=1.28.0) - Web application framework
- **Python** (3.8+) - Programming language

### Data Processing
- **Pandas** (>=2.0.0) - Data manipulation and analysis
- **NumPy** (>=1.24.0) - Numerical computing

### Visualization
- **Plotly** (>=5.18.0) - Interactive charts and graphs
- **Matplotlib** (>=3.7.0) - Additional plotting capabilities

### Database
- **SQLite** - Embedded database (via `furniture.db`)
- **SQLAlchemy** (>=2.0.0) - ORM and database toolkit

### Authentication & Security
- **bcrypt** (>=4.0.0) - Password hashing
- **passlib** (>=1.7.4) - Password handling utilities

### Data Export
- **openpyxl** (>=3.1.0) - Excel file generation
- **xlsxwriter** (>=3.1.0) - Excel writing
- **reportlab** (>=4.0.0) - PDF generation

### Machine Learning (Optional)
- **scikit-learn** (>=1.3.0) - ML models
- **scipy** (>=1.11.0) - Scientific computing
- **joblib** (>=1.3.0) - Model persistence

### Testing & Development
- **Faker** (>=20.0.0) - Test data generation

---

## 📁 Codebase Structure

```
midas-furniture-dashboard-final/
│
├── dashboard.py                 # Main application entry point
├── admin_page.py                # User management module
├── Config.py                    # Configuration settings
├── setup_database.py            # Database initialization script
├── requirements.txt             # Python dependencies
├── Readme.md                    # User documentation
├── CLAUDE.md                    # This file - AI assistant guide
│
├── database/                    # Database layer
│   ├── schema.sql              # Database structure definition
│   ├── db_setup.py             # Database population logic
│   └── base.py                 # SQLAlchemy configuration
│
├── pages/                       # Streamlit multi-page app pages
│   ├── 2_👥_Segmentation_Analysis.py
│   ├── 3_🎨_Creative_Analysis.py
│   ├── 5_📈_Live_Benchmarking.py
│   ├── 7_💰_Budget_Pacing.py
│   ├── 9_🔬_AB_Testing.py
│   ├── 10_📤_Export_Data.py
│   ├── 11_📤_Upload_Data.py
│   └── 12_👑_Admin.py
│
├── export/                      # Data export functionality
│   ├── __init__.py
│   ├── data_exporter.py        # Export logic (CSV, Excel, PDF)
│   └── export_page.py          # Export UI components
│
├── app/                         # Advanced feature modules
│   ├── __init__.py
│   ├── analysis_modules/       # Analysis engines
│   │   ├── campaign_performance.py
│   │   └── segmentation_analysis.py
│   ├── data_integration/       # API connectors
│   │   ├── api_connectors.py
│   │   └── file_uploader.py
│   ├── predictive_engine/      # ML models (optional)
│   └── ui_components/          # Reusable UI widgets
│
└── scripts/                     # Automation scripts
    ├── __init__.py
    ├── app_setup.py            # Full setup automation
    ├── anomaly_detector.py     # Automated anomaly detection
    └── daily_data_refresh.py   # Data refresh automation
```

### File Naming Conventions
- **Main files**: `snake_case.py` (e.g., `setup_database.py`)
- **Page files**: `N_emoji_Page_Name.py` (e.g., `2_👥_Segmentation_Analysis.py`)
- **Modules**: `snake_case.py` in subdirectories
- **Config files**: `Config.py` (capitalized)

---

## 🗄️ Database Architecture

### Database File
- **Location**: `furniture.db` (SQLite)
- **Initialization**: Run `python setup_database.py`
- **Schema**: Defined in `database/schema.sql`

### Core Tables

#### Campaign Structure
```sql
campaigns (campaign_id, campaign_name, platform, objective, funnel_stage)
ad_sets (ad_set_id, ad_set_name, campaign_id, targeting_criteria)
ads (ad_id, ad_name, ad_set_id, creative_type, creative_url, headline_text, body_text, test_id)
```

#### Performance Data
```sql
daily_performance (id, report_date, ad_id, campaign_id, impressions, reach,
                   frequency, clicks, spend, video_views, add_to_carts,
                   conversions, revenue)

performance_by_segment (id, report_date, ad_id, campaign_id, segment_type,
                        segment_value, impressions, clicks, spend,
                        conversions, revenue)

performance_by_country (id, report_date, platform, country, impressions,
                        clicks, spend, conversions, revenue)
```

#### User Management
```sql
users (username PK, name, password_hash, role_id)
roles (role_id PK, role_name)
role_permissions (permission_id PK, role_id, page_name)
```

#### Advanced Features
```sql
campaign_budgets (id, campaign_id, start_date, end_date, total_budget)
ab_tests (test_id, test_name, hypothesis, start_date, end_date)
customers (customer_id, first_seen_date)
sales (sale_id, customer_id, sale_date, sale_amount)
alerts (id, alert_date, metric, ad_id, justification, status)
recommendations (id, generation_date, ad_id, recommendation_type, justification, status)
```

### Key Metrics Calculations
```python
# ROAS (Return on Ad Spend)
roas = revenue / spend

# CPA (Cost Per Acquisition)
cpa = spend / conversions

# CTR (Click-Through Rate)
ctr = (clicks / impressions) * 100

# CPC (Cost Per Click)
cpc = spend / clicks

# CPM (Cost Per Mille/Thousand Impressions)
cpm = (spend / impressions) * 1000
```

### Database Constraints
- **Unique constraints**: On date-entity combinations to prevent duplicates
- **Foreign keys**: Enforce referential integrity between tables
- **NOT NULL**: Required fields like names, dates, and IDs
- **Primary keys**: Auto-increment for performance tables, text IDs for entities

---

## 🔑 Key Components

### 1. Main Dashboard (`dashboard.py`)
**Purpose**: Primary application entry point and overview dashboard

**Key Functions**:
```python
load_campaign_data() -> pd.DataFrame  # Data loading with caching
render_sidebar(df: pd.DataFrame)      # Navigation and filters
display_kpi_metrics(df: pd.DataFrame) # Top-level KPI cards
render_charts(df: pd.DataFrame)       # Visualization rendering
```

**Caching Strategy**:
- Uses `@st.cache_data(ttl=3600)` for 1-hour data caching
- Reduces database queries and improves performance

**Styling**:
- Custom CSS for sidebar gradients
- Plotly configuration: `{"displaylogo": False, "modeBarButtonsToRemove": ["lasso2d", "select2d"]}`
- Platform-specific tab colors (Meta: green, Google: red, TikTok: blue)

### 2. Authentication (`admin_page.py`)
**Purpose**: User management and access control

**Key Features**:
- Bcrypt password hashing (cost factor: 12)
- Session-based authentication via `st.session_state`
- Role-based permissions (Admin, Analyst, Viewer)

**Default Credentials**:
```
Username: admin
Password: admin123
```
**⚠️ CRITICAL**: Must be changed after first deployment!

### 3. Configuration (`Config.py`)
**Purpose**: Centralized settings management

**Key Settings**:
```python
# Database
DB_PATH = 'furniture.db'

# Performance Thresholds
ROAS_TARGET = 2.5
CPA_TARGET = 35.0
CTR_TARGET = 1.8

# Caching
DATA_CACHE_TTL = 3600  # 1 hour

# Feature Flags
ENABLE_ML_PREDICTIONS = True
ENABLE_ANOMALY_DETECTION = True
ENABLE_AUTO_RECOMMENDATIONS = True
ENABLE_CHATBOT = False
```

**Environment Variables** (for API integration):
- `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`
- `GOOGLE_DEVELOPER_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID`
- `SNAPCHAT_ACCESS_TOKEN`, `SNAPCHAT_AD_ACCOUNT_ID`

### 4. Database Setup (`setup_database.py`)
**Purpose**: Initialize database with schema and sample data

**Usage**:
```bash
python setup_database.py
```

**What It Does**:
1. Creates `furniture.db` SQLite database
2. Executes schema from `database/schema.sql`
3. Populates sample campaigns, ads, and performance data
4. Creates default admin user

### 5. Page Modules (`pages/`)
Each page follows the Streamlit multi-page app convention:
- **Naming**: `N_emoji_Page_Name.py` (N = sort order)
- **Access**: Automatic in Streamlit sidebar navigation
- **Structure**: Self-contained modules with own data loading and rendering

**Available Pages**:
- `2_👥_Segmentation_Analysis.py` - Customer segmentation and RFM analysis
- `3_🎨_Creative_Analysis.py` - Ad creative performance tracking
- `5_📈_Live_Benchmarking.py` - Platform benchmarking
- `7_💰_Budget_Pacing.py` - Budget tracking and pacing analysis
- `9_🔬_AB_Testing.py` - A/B test management and analysis
- `10_📤_Export_Data.py` - Data export functionality
- `11_📤_Upload_Data.py` - Data import/upload
- `12_👑_Admin.py` - User management

### 6. Export Module (`export/`)
**Purpose**: Data export in multiple formats

**Supported Formats**:
- CSV: Simple delimiter-separated values
- Excel: Formatted spreadsheets with multiple sheets
- PDF: Report-style documents with charts

**Key Files**:
- `data_exporter.py`: Core export logic
- `export_page.py`: UI for export configuration

---

## 🔄 Development Workflows

### Initial Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd -Midas-Dashboard-2025---Final
```

#### 2. Create Virtual Environment (Recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Initialize Database
```bash
python setup_database.py
```

#### 5. Run Application
```bash
streamlit run dashboard.py
```

#### 6. Access Dashboard
- URL: `http://localhost:8501`
- Login: `admin` / `admin123`

### Git Workflow

#### Branch Strategy
- **Main branch**: Production-ready code
- **Feature branches**: `feature/feature-name` or `claude/session-id`
- **Development**: Work on designated branch specified by user

#### Commit Guidelines
```bash
# Format: <type>: <description>

# Types:
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code formatting (no logic change)
refactor: Code restructuring
test: Add or update tests
chore: Maintenance tasks

# Examples:
git commit -m "feat: add budget forecasting to Budget_Pacing page"
git commit -m "fix: resolve division by zero in ROAS calculation"
git commit -m "docs: update CLAUDE.md with new deployment steps"
```

#### Push Strategy
```bash
# Always push to feature branch with -u flag
git push -u origin <branch-name>

# Retry with exponential backoff on network errors (2s, 4s, 8s, 16s)
```

### Adding New Features

#### 1. New Page
```bash
# Create file in pages/ directory
touch pages/13_🔥_New_Feature.py
```

**Template Structure**:
```python
"""
New Feature Page for Midas Analytics Dashboard
Description of functionality
Version: 1.0
"""

import streamlit as st
import pandas as pd

# Page config
st.set_page_config(
    page_title="New Feature - Midas Analytics",
    page_icon="🔥",
    layout="wide"
)

# Title
st.title("🔥 New Feature")

# Data loading
@st.cache_data(ttl=3600)
def load_data():
    # Your data loading logic
    pass

# Main logic
def main():
    df = load_data()
    # Your feature implementation
    pass

if __name__ == "__main__":
    main()
```

#### 2. New Database Table
1. Add table definition to `database/schema.sql`
2. Delete existing `furniture.db`
3. Run `python setup_database.py`
4. Update `database/db_setup.py` with sample data logic

#### 3. New Configuration
1. Add setting to `Config.py`
2. Use environment variables for secrets
3. Update `Readme.md` documentation

### Testing Changes

#### Manual Testing Checklist
- [ ] Run locally with `streamlit run dashboard.py`
- [ ] Test all navigation links
- [ ] Verify data loads correctly
- [ ] Test filters and date ranges
- [ ] Check export functionality
- [ ] Test on different screen sizes
- [ ] Verify authentication works
- [ ] Check for console errors
- [ ] Test with sample data

#### Automated Testing (Optional)
```bash
# If pytest is installed
pytest tests/
```

---

## 📝 Coding Conventions

### Python Style Guide
- **Standard**: PEP 8
- **Line Length**: 100 characters maximum
- **Indentation**: 4 spaces (no tabs)
- **Imports**: Group by standard library, third-party, local
- **Docstrings**: Use triple-quoted strings for all functions

### Naming Conventions
```python
# Variables and functions: snake_case
campaign_data = load_campaign_data()

# Classes: PascalCase
class CampaignAnalyzer:
    pass

# Constants: UPPER_SNAKE_CASE
ROAS_TARGET = 2.5
DEFAULT_DATE_RANGE = 30

# Private methods: _leading_underscore
def _calculate_internal_metric():
    pass
```

### Streamlit Best Practices

#### 1. Page Configuration
```python
# Always at the top of main entry point
st.set_page_config(
    page_title="Page Title",
    page_icon="🔥",
    layout="wide",
    initial_sidebar_state="expanded"
)
```

#### 2. Caching
```python
# Use for expensive operations
@st.cache_data(ttl=3600)  # 1-hour cache
def load_data():
    # Database queries, API calls
    pass

# Clear cache when data changes
if st.button("Refresh Data"):
    st.cache_data.clear()
```

#### 3. Session State
```python
# Initialize once
if 'user_logged_in' not in st.session_state:
    st.session_state.user_logged_in = False

# Access throughout session
if st.session_state.user_logged_in:
    show_dashboard()
```

#### 4. Layout
```python
# Use columns for side-by-side content
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("ROAS", "3.2")

# Use tabs for organized content
tab1, tab2 = st.tabs(["Overview", "Details"])
with tab1:
    st.write("Overview content")
```

### Database Queries

#### Best Practices
```python
import sqlite3
import pandas as pd

# Always use parameterized queries to prevent SQL injection
def get_campaign_data(campaign_id: str) -> pd.DataFrame:
    conn = sqlite3.connect('furniture.db')
    query = """
        SELECT * FROM daily_performance
        WHERE campaign_id = ?
    """
    df = pd.read_sql_query(query, conn, params=(campaign_id,))
    conn.close()
    return df

# Never use string concatenation for queries (security risk!)
# BAD: query = f"SELECT * FROM table WHERE id = {user_input}"
```

#### Common Query Patterns
```sql
-- Aggregated daily performance
SELECT
    report_date,
    SUM(spend) as total_spend,
    SUM(revenue) as total_revenue,
    SUM(revenue) / SUM(spend) as roas
FROM daily_performance
WHERE campaign_id = ?
GROUP BY report_date
ORDER BY report_date DESC;

-- Platform comparison
SELECT
    c.platform,
    SUM(dp.spend) as total_spend,
    SUM(dp.conversions) as total_conversions,
    SUM(dp.spend) / SUM(dp.conversions) as cpa
FROM daily_performance dp
JOIN campaigns c ON dp.campaign_id = c.campaign_id
GROUP BY c.platform;
```

### Error Handling
```python
try:
    data = load_data_from_source()
except FileNotFoundError:
    st.error("Database file not found. Please run setup_database.py")
    st.stop()
except Exception as e:
    st.error(f"An error occurred: {str(e)}")
    st.info("Please contact support if the issue persists.")
```

### Chart Styling
```python
# Plotly configuration
PLOTLY_TEMPLATE = "plotly_white"
PLOTLY_CONFIG = {
    "displaylogo": False,
    "modeBarButtonsToRemove": ["lasso2d", "select2d"]
}

# Create chart
fig = px.line(df, x='date', y='roas', title="ROAS Trend")
st.plotly_chart(fig, config=PLOTLY_CONFIG, use_container_width=True)

# Or with new Streamlit 2026 syntax
st.plotly_chart(fig, config=PLOTLY_CONFIG, width='stretch')
```

---

## 🔒 Security & Authentication

### Password Security
- **Hashing**: bcrypt with cost factor 12
- **Storage**: Only hashed passwords in database (never plaintext)
- **Verification**: Use `bcrypt.checkpw()` for authentication

**Example**:
```python
import bcrypt

# Hashing password
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# Verifying password
def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(
        password.encode('utf-8'),
        hashed.encode('utf-8')
    )
```

### Session Management
- Uses Streamlit's built-in session state
- Session persists during single browser session
- No cross-session data leakage

**Key Session Variables**:
```python
st.session_state.authenticated = True/False
st.session_state.username = "admin"
st.session_state.role = "Administrator"
```

### Role-Based Access Control (RBAC)
**Available Roles**:
1. **Administrator**: Full access to all pages and features
2. **Analyst**: Access to analytics pages, no admin functions
3. **Viewer**: Read-only access to dashboards

**Implementation**:
```python
def check_permission(username: str, page_name: str) -> bool:
    """Check if user has permission to access page"""
    # Query role_permissions table
    # Return True/False
    pass
```

### Security Checklist
- [ ] Change default admin password immediately after deployment
- [ ] Use environment variables for API credentials
- [ ] Never commit credentials to version control
- [ ] Use HTTPS in production (handled by Streamlit Cloud)
- [ ] Validate and sanitize all user inputs
- [ ] Use parameterized SQL queries
- [ ] Keep dependencies updated (`pip list --outdated`)
- [ ] Review user permissions regularly

---

## 🧪 Testing Strategy

### Manual Testing

#### Pre-Deployment Checklist
1. **Database**: Verify `furniture.db` exists and has data
2. **Authentication**: Test login with multiple users
3. **Navigation**: Check all page links work
4. **Data Loading**: Confirm all charts render
5. **Filters**: Test date ranges, platform filters, campaign selectors
6. **Export**: Verify CSV, Excel, PDF exports work
7. **Responsive**: Check on desktop, tablet, mobile
8. **Performance**: Monitor page load times

#### Test Data
Located in `database/db_setup.py`:
- 4 sample campaigns (Meta, Google, TikTok, Snapchat)
- 6 sample ads
- 90 days of daily performance data
- Default admin user

### Automated Testing (Optional)

#### Directory Structure
```
tests/
├── __init__.py
├── test_database.py
├── test_calculations.py
└── test_exports.py
```

#### Example Test
```python
# tests/test_calculations.py
import pytest
from dashboard import calculate_roas

def test_roas_calculation():
    assert calculate_roas(revenue=1000, spend=400) == 2.5
    assert calculate_roas(revenue=0, spend=100) == 0
    assert calculate_roas(revenue=100, spend=0) == 0  # Handle division by zero
```

#### Run Tests
```bash
pip install pytest
pytest tests/
```

---

## 🤖 AI Assistant Guidelines

### When Working on This Codebase

#### DO:
✅ **Read configuration** from `Config.py` before making changes
✅ **Check existing patterns** in similar files before creating new ones
✅ **Use parameterized queries** for all database operations
✅ **Add `@st.cache_data` decorator** for expensive operations
✅ **Follow existing naming conventions** (snake_case, PascalCase as appropriate)
✅ **Test locally** before committing changes
✅ **Update documentation** when adding features
✅ **Use type hints** for function parameters and return values
✅ **Handle edge cases** (empty data, zero values, missing files)
✅ **Add error handling** with user-friendly messages

#### DON'T:
❌ **Don't hardcode credentials** or API keys in code
❌ **Don't use string concatenation** for SQL queries
❌ **Don't commit database files** (`furniture.db`) to version control
❌ **Don't modify schema** without updating `database/schema.sql`
❌ **Don't create pages** without emoji + number prefix
❌ **Don't skip data validation** on user inputs
❌ **Don't remove existing functionality** without confirmation
❌ **Don't use globals** for state management (use `st.session_state`)
❌ **Don't ignore dependencies** - update `requirements.txt` when adding packages

### Common Requests and How to Handle Them

#### "Add a new analysis page"
1. Create file: `pages/14_🔥_New_Analysis.py`
2. Copy structure from existing page (e.g., `pages/3_🎨_Creative_Analysis.py`)
3. Implement data loading with caching
4. Add visualizations with Plotly
5. Test locally
6. Update `Readme.md` if user-facing

#### "Fix a bug in calculations"
1. Locate calculation (likely in main file or `app/analysis_modules/`)
2. Check for edge cases (division by zero, empty data)
3. Add defensive programming:
   ```python
   roas = (revenue / spend) if spend > 0 else 0
   ```
4. Test with edge cases
5. Verify in UI

#### "Add a new database table"
1. Add CREATE TABLE to `database/schema.sql`
2. Add sample data logic to `database/db_setup.py`
3. Delete `furniture.db`
4. Run `python setup_database.py`
5. Update queries in relevant modules
6. Test data access

#### "Improve performance"
1. Add `@st.cache_data(ttl=3600)` to expensive functions
2. Optimize SQL queries (add indexes, reduce joins)
3. Lazy-load modules (import only when needed)
4. Reduce chart complexity (aggregate data before plotting)
5. Profile with `streamlit run dashboard.py --logger.level=debug`

#### "Update styling"
1. Modify CSS in `st.markdown(..., unsafe_allow_html=True)` blocks
2. Update Plotly template/config in constants
3. Test across pages for consistency
4. Consider dark mode compatibility

#### "Add authentication check"
```python
# Add to top of page after imports
if 'authenticated' not in st.session_state or not st.session_state.authenticated:
    st.error("Please log in to access this page")
    st.stop()

# Check role permission
if st.session_state.role not in ['Administrator', 'Analyst']:
    st.error("You don't have permission to access this page")
    st.stop()
```

### Code Review Self-Checklist
Before submitting changes, verify:
- [ ] Code follows PEP 8 style guide
- [ ] All functions have docstrings
- [ ] Type hints are used for parameters
- [ ] Error handling is implemented
- [ ] Edge cases are handled (zero, null, empty)
- [ ] Database queries are parameterized
- [ ] Caching is used for expensive operations
- [ ] No hardcoded credentials
- [ ] No console errors or warnings
- [ ] Tested locally with sample data
- [ ] Documentation is updated

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: "No such file: furniture.db"
**Solution**: Run database initialization
```bash
python setup_database.py
```

#### Issue: "ModuleNotFoundError: No module named 'config'"
**Solution**: Ensure `Config.py` exists in project root (capital C)
```bash
ls -la Config.py
```

#### Issue: "Invalid credentials" on login
**Solution**:
1. Verify credentials: `admin` / `admin123` (exact case)
2. Delete and recreate database:
   ```bash
   rm furniture.db
   python setup_database.py
   ```
3. Check bcrypt is installed: `pip list | grep bcrypt`

#### Issue: Charts not rendering
**Solution**:
1. Check browser console for JavaScript errors
2. Verify Plotly is installed: `pip list | grep plotly`
3. Clear Streamlit cache: Delete `.streamlit/` directory
4. Restart Streamlit server

#### Issue: Slow page loads
**Solution**:
1. Add `@st.cache_data` to data loading functions
2. Reduce date range in queries
3. Optimize SQL queries (add WHERE clauses)
4. Profile with `streamlit run --logger.level=debug`

#### Issue: Database locked
**Solution**:
```bash
# Close all connections, restart Streamlit
# Or use write-ahead logging
sqlite3 furniture.db "PRAGMA journal_mode=WAL;"
```

#### Issue: Import errors in Streamlit Cloud
**Solution**:
1. Verify all dependencies in `requirements.txt`
2. Check for version conflicts
3. Pin exact versions if needed
4. Review deployment logs in Streamlit Cloud dashboard

### Debugging Techniques

#### 1. Add Debug Output
```python
if st.checkbox("Show Debug Info"):
    st.write("Session State:", st.session_state)
    st.write("DataFrame Shape:", df.shape)
    st.write("DataFrame Sample:", df.head())
```

#### 2. Use Streamlit Debugging
```python
# Show execution trace
import streamlit as st
st.write("Current file:", __file__)
st.write("Python version:", sys.version)
```

#### 3. Check Database Content
```bash
sqlite3 furniture.db
> .tables
> SELECT COUNT(*) FROM daily_performance;
> .exit
```

#### 4. Profile Performance
```bash
# Run with profiler
streamlit run dashboard.py --logger.level=debug
```

### Getting Help
1. **Check this document** first
2. **Review Readme.md** for user-facing documentation
3. **Search GitHub issues** (if applicable)
4. **Check Streamlit docs**: https://docs.streamlit.io
5. **Review deployment logs** in Streamlit Cloud

---

## 📚 Additional Resources

### Project Documentation
- **Readme.md**: User guide and deployment instructions
- **database/schema.sql**: Complete database schema
- **Config.py**: All configuration options
- **requirements.txt**: Full dependency list

### External Documentation
- [Streamlit Documentation](https://docs.streamlit.io)
- [Plotly Python Documentation](https://plotly.com/python/)
- [Pandas Documentation](https://pandas.pydata.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [bcrypt Documentation](https://github.com/pyca/bcrypt/)

### Development Tools
- **Streamlit Cloud**: https://streamlit.io/cloud
- **Python Docs**: https://docs.python.org/3/
- **PEP 8 Style Guide**: https://pep8.org/

---

## 📋 Quick Reference Card

### File Locations
| Need | Location |
|------|----------|
| Main app | `dashboard.py` |
| Configuration | `Config.py` |
| Database | `furniture.db` |
| Schema | `database/schema.sql` |
| Add page | `pages/N_emoji_Name.py` |
| Export logic | `export/data_exporter.py` |
| User management | `admin_page.py` |

### Common Commands
```bash
# Setup
python setup_database.py

# Run locally
streamlit run dashboard.py

# Install dependencies
pip install -r requirements.txt

# Database inspection
sqlite3 furniture.db

# Clear cache
rm -rf .streamlit/cache/

# Check dependencies
pip list --outdated
```

### Code Snippets

**Load data with caching**:
```python
@st.cache_data(ttl=3600)
def load_data():
    conn = sqlite3.connect('furniture.db')
    df = pd.read_sql_query("SELECT * FROM daily_performance", conn)
    conn.close()
    return df
```

**Create metric card**:
```python
col1, col2, col3 = st.columns(3)
col1.metric("ROAS", "3.2", delta="+0.5")
col2.metric("CPA", "$28.50", delta="-$2.10")
col3.metric("Conversions", "1,245", delta="+12%")
```

**Authentication check**:
```python
if 'authenticated' not in st.session_state:
    st.error("Please log in")
    st.stop()
```

---

## ✅ Pre-Commit Checklist

Before committing changes:
- [ ] Code runs without errors locally
- [ ] All imports are used
- [ ] No hardcoded credentials
- [ ] Database queries are parameterized
- [ ] Functions have docstrings
- [ ] Edge cases are handled
- [ ] Error messages are user-friendly
- [ ] Caching is used appropriately
- [ ] No console warnings
- [ ] Follows existing code style
- [ ] Documentation is updated

---

## 🎯 Project-Specific Notes

### Performance Targets
- ROAS Target: **2.5** (defined in `Config.py`)
- CPA Target: **$35.00**
- CTR Target: **1.8%**

### Supported Platforms
1. **Meta** (Facebook/Instagram)
2. **Google** (Ads/Display)
3. **TikTok**
4. **Snapchat**

### Feature Flags (Config.py)
- `ENABLE_ML_PREDICTIONS`: Machine learning features
- `ENABLE_ANOMALY_DETECTION`: Automated alerts
- `ENABLE_AUTO_RECOMMENDATIONS`: AI suggestions
- `ENABLE_CHATBOT`: Tawk.to integration (default: False)

### Cache TTL
Default: **3600 seconds (1 hour)**
Configurable in `Config.py` as `DATA_CACHE_TTL`

### Database Size Limits
- Current: Handles **100K+ daily performance records**
- SQLite suitable for: **<100GB data**
- Upgrade path: PostgreSQL/MySQL for larger scale

---

**Last Updated**: 2025-11-17
**Maintainer**: AI Assistant / Development Team
**For Questions**: Refer to Readme.md or contact development team

---

*This document is specifically designed for AI assistants working on the Midas Furniture Dashboard codebase. Keep it updated as the project evolves.*
