"""
Admin Page Module for Midas Analytics Dashboard
Provides user management, system settings, and access control
Version: 2.0 - Fixed session state initialization
"""

import streamlit as st
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional

# ========================================
# SESSION STATE INITIALIZATION
# ========================================

def initialize_admin_state():
    """Initialize admin session state with default values"""
    if 'users' not in st.session_state:
        st.session_state.users = [
            {
                'id': 1,
                'username': 'admin',
                'email': 'admin@midas.com',
                'password': 'admin123',
                'role': 'Administrator',
                'status': 'Active',
                'created_date': '2025-01-01',
                'last_login': datetime.now().strftime('%Y-%m-%d %H:%M')
            },
            {
                'id': 2,
                'username': 'analyst1',
                'email': 'analyst@midas.com',
                'password': 'admin123',
                'role': 'Analyst',
                'status': 'Active',
                'created_date': '2025-01-15',
                'last_login': '2025-10-20 14:30'
            },
            {
                'id': 3,
                'username': 'viewer1',
                'email': 'viewer@midas.com',
                'password': 'admin123',
                'role': 'Viewer',
                'status': 'Active',
                'created_date': '2025-02-01',
                'last_login': '2025-10-21 09:15'
            }
        ]
    
    if 'next_user_id' not in st.session_state:
        st.session_state.next_user_id = 4
    
    if 'system_settings' not in st.session_state:
        st.session_state.system_settings = {
            'app_name': 'Midas Analytics Platform',
            'timezone': 'UTC',
            'data_retention_days': 90,
            'auto_refresh': True,
            'refresh_interval': 300,
            'enable_notifications': True
        }

# ========================================
# ADMIN STYLES
# ========================================

def apply_admin_styles():
    """Apply admin-specific CSS styles"""
    st.markdown("""
    <style>
    .admin-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 0.5rem;
        margin-bottom: 2rem;
        color: white;
    }
    
    .admin-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }
    
    .user-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .badge-admin {
        background: #ef4444;
        color: white;
    }
    
    .badge-analyst {
        background: #3b82f6;
        color: white;
    }
    
    .badge-viewer {
        background: #10b981;
        color: white;
    }
    
    .status-active {
        color: #10b981;
        font-weight: 600;
    }
    
    .status-inactive {
        color: #ef4444;
        font-weight: 600;
    }
    </style>
    """, unsafe_allow_html=True)

# ========================================
# USER MANAGEMENT
# ========================================

def render_user_management():
    """Render user management interface"""
    st.subheader("👥 User Management")
    
    # Action buttons
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        search_query = st.text_input("🔍 Search users", placeholder="Search by name or email...")
    
    with col2:
        role_filter = st.selectbox("Filter by role", ["All", "Administrator", "Analyst", "Viewer"])
    
    with col3:
        st.write("")  # Spacing
        st.write("")  # Spacing
        if st.button("➕ Add New User", use_container_width=True):
            st.session_state.show_add_user = True
    
    # Users table
    users_df = pd.DataFrame(st.session_state.users)
    
    # Apply filters
    if role_filter != "All":
        users_df = users_df[users_df['role'] == role_filter]
    
    if search_query:
        users_df = users_df[
            users_df['username'].str.contains(search_query, case=False) |
            users_df['email'].str.contains(search_query, case=False)
        ]
    
    # Display users
    st.markdown("---")
    
    for idx, user in users_df.iterrows():
        with st.container():
            col1, col2, col3, col4, col5 = st.columns([2, 2, 1.5, 1.5, 1])
            
            with col1:
                st.markdown(f"**{user['username']}**")
                st.caption(user['email'])
            
            with col2:
                badge_class = f"badge-{user['role'].lower()}"
                st.markdown(f'<span class="user-badge {badge_class}">{user["role"]}</span>', unsafe_allow_html=True)
            
            with col3:
                status_class = "status-active" if user['status'] == 'Active' else "status-inactive"
                st.markdown(f'<span class="{status_class}">{user["status"]}</span>', unsafe_allow_html=True)
            
            with col4:
                st.caption(f"Last login: {user['last_login']}")
            
            with col5:
                if st.button("✏️", key=f"edit_{user['id']}", help="Edit user"):
                    st.session_state.edit_user_id = user['id']
                if st.button("🗑️", key=f"delete_{user['id']}", help="Delete user"):
                    delete_user(user['id'])
            
            st.markdown("---")
    
    # Add user form
    if st.session_state.get('show_add_user', False):
        render_add_user_form()
    
    # Edit user form
    if 'edit_user_id' in st.session_state:
        render_edit_user_form(st.session_state.edit_user_id)

def render_add_user_form():
    """Render add user form"""
    st.markdown("### ➕ Add New User")
    
    with st.form("add_user_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            username = st.text_input("Username *", placeholder="john_doe")
            email = st.text_input("Email *", placeholder="john@midas.com")
            password = st.text_input("Password *", type="password", placeholder="Set password")
        
        with col2:
            role = st.selectbox("Role *", ["Viewer", "Analyst", "Administrator"])
            status = st.selectbox("Status", ["Active", "Inactive"])
        
        col1, col2 = st.columns(2)
        
        with col1:
            submitted = st.form_submit_button("✅ Create User", use_container_width=True)
        
        with col2:
            cancelled = st.form_submit_button("❌ Cancel", use_container_width=True)
        
        if submitted:
            if username and email and password:
                new_user = {
                    'id': st.session_state.next_user_id,
                    'username': username,
                    'email': email,
                    'password': password,
                    'role': role,
                    'status': status,
                    'created_date': datetime.now().strftime('%Y-%m-%d'),
                    'last_login': 'Never'
                }
                st.session_state.users.append(new_user)
                st.session_state.next_user_id += 1
                st.session_state.show_add_user = False
                st.success(f"✅ User '{username}' created successfully!")
                st.rerun()
            else:
                st.error("⚠️ Please fill in all required fields")
        
        if cancelled:
            st.session_state.show_add_user = False
            st.rerun()

def render_edit_user_form(user_id: int):
    """Render edit user form"""
    user = next((u for u in st.session_state.users if u['id'] == user_id), None)
    
    if not user:
        del st.session_state.edit_user_id
        return
    
    st.markdown(f"### ✏️ Edit User: {user['username']}")
    
    with st.form("edit_user_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            username = st.text_input("Username", value=user['username'])
            email = st.text_input("Email", value=user['email'])
        
        with col2:
            role = st.selectbox("Role", ["Viewer", "Analyst", "Administrator"], 
                              index=["Viewer", "Analyst", "Administrator"].index(user['role']))
            status = st.selectbox("Status", ["Active", "Inactive"],
                                index=["Active", "Inactive"].index(user['status']))
        
        col1, col2 = st.columns(2)
        
        with col1:
            submitted = st.form_submit_button("💾 Save Changes", use_container_width=True)
        
        with col2:
            cancelled = st.form_submit_button("❌ Cancel", use_container_width=True)
        
        if submitted:
            user['username'] = username
            user['email'] = email
            user['role'] = role
            user['status'] = status
            del st.session_state.edit_user_id
            st.success(f"✅ User '{username}' updated successfully!")
            st.rerun()
        
        if cancelled:
            del st.session_state.edit_user_id
            st.rerun()

def delete_user(user_id: int):
    """Delete a user"""
    st.session_state.users = [u for u in st.session_state.users if u['id'] != user_id]
    st.success("✅ User deleted successfully!")
    st.rerun()

# ========================================
# SYSTEM SETTINGS
# ========================================

def render_system_settings():
    """Render system settings interface"""
    st.subheader("⚙️ System Settings")
    
    settings = st.session_state.system_settings
    
    with st.form("system_settings_form"):
        st.markdown("#### General Settings")
        
        col1, col2 = st.columns(2)
        
        with col1:
            app_name = st.text_input("Application Name", value=settings['app_name'])
            timezone = st.selectbox("Timezone", ["UTC", "EST", "PST", "GMT"], 
                                   index=["UTC", "EST", "PST", "GMT"].index(settings['timezone']))
        
        with col2:
            retention_days = st.number_input("Data Retention (days)", 
                                            min_value=30, max_value=365, 
                                            value=settings['data_retention_days'])
        
        st.markdown("#### Performance Settings")
        
        col1, col2 = st.columns(2)
        
        with col1:
            auto_refresh = st.checkbox("Enable Auto-Refresh", value=settings['auto_refresh'])
        
        with col2:
            refresh_interval = st.slider("Refresh Interval (seconds)", 
                                        min_value=60, max_value=600, 
                                        value=settings['refresh_interval'])
        
        st.markdown("#### Notifications")
        
        enable_notifications = st.checkbox("Enable Notifications", value=settings['enable_notifications'])
        
        submitted = st.form_submit_button("💾 Save Settings", use_container_width=True)
        
        if submitted:
            st.session_state.system_settings = {
                'app_name': app_name,
                'timezone': timezone,
                'data_retention_days': retention_days,
                'auto_refresh': auto_refresh,
                'refresh_interval': refresh_interval,
                'enable_notifications': enable_notifications
            }
            st.success("✅ Settings saved successfully!")
            st.rerun()

# ========================================
# USAGE ANALYTICS
# ========================================

def render_usage_analytics():
    """Render usage analytics"""
    st.subheader("📊 Usage Analytics")
    
    # Mock analytics data
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Users", len(st.session_state.users))
    
    with col2:
        active_users = len([u for u in st.session_state.users if u['status'] == 'Active'])
        st.metric("Active Users", active_users)
    
    with col3:
        st.metric("Total Sessions", "1,234")
    
    with col4:
        st.metric("Avg Session Duration", "12m 34s")
    
    st.markdown("---")
    
    # User activity chart
    st.markdown("#### Recent Activity")
    
    activity_data = pd.DataFrame({
        'date': pd.date_range(start='2025-10-01', end='2025-10-22', freq='D'),
        'sessions': [30 + i*2 for i in range(22)]
    })
    
    st.line_chart(activity_data.set_index('date'))

# ========================================
# MAIN ADMIN PAGE
# ========================================

def render_admin_page():
    """Main admin page renderer"""
    
    # Initialize session state
    initialize_admin_state()
    
    # Apply styles
    apply_admin_styles()
    
    # Header
    st.markdown("""
    <div class="admin-header">
        <h1 style="margin: 0;">👑 Admin Dashboard</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Manage users, settings, and system configuration</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation tabs
    tab1, tab2, tab3 = st.tabs(["👥 Users", "⚙️ Settings", "📊 Analytics"])
    
    with tab1:
        render_user_management()
    
    with tab2:
        render_system_settings()
    
    with tab3:
        render_usage_analytics()

if __name__ == "__main__":
    render_admin_page()
