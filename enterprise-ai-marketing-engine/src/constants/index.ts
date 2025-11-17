import { Platform, CampaignObjective, CampaignStatus, UserRole, Permission } from '@/types';

// Platform Constants
export const PLATFORMS = Object.values(Platform);

export const PLATFORM_COLORS: Record<Platform, string> = {
  [Platform.META]: '#1877F2',
  [Platform.GOOGLE]: '#4285F4',
  [Platform.TIKTOK]: '#000000',
  [Platform.SNAPCHAT]: '#FFFC00',
};

export const PLATFORM_NAMES: Record<Platform, string> = {
  [Platform.META]: 'Meta/Facebook',
  [Platform.GOOGLE]: 'Google Ads',
  [Platform.TIKTOK]: 'TikTok',
  [Platform.SNAPCHAT]: 'Snapchat',
};

// Campaign Constants
export const CAMPAIGN_OBJECTIVES = Object.values(CampaignObjective);

export const CAMPAIGN_OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  [CampaignObjective.AWARENESS]: 'Brand Awareness',
  [CampaignObjective.CONSIDERATION]: 'Consideration',
  [CampaignObjective.CONVERSION]: 'Conversions',
  [CampaignObjective.TRAFFIC]: 'Traffic',
  [CampaignObjective.ENGAGEMENT]: 'Engagement',
  [CampaignObjective.LEAD_GENERATION]: 'Lead Generation',
  [CampaignObjective.SALES]: 'Sales',
};

export const CAMPAIGN_STATUSES = Object.values(CampaignStatus);

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  [CampaignStatus.ACTIVE]: 'Active',
  [CampaignStatus.PAUSED]: 'Paused',
  [CampaignStatus.DRAFT]: 'Draft',
  [CampaignStatus.SCHEDULED]: 'Scheduled',
  [CampaignStatus.COMPLETED]: 'Completed',
  [CampaignStatus.DELETED]: 'Deleted',
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  [CampaignStatus.ACTIVE]: 'success',
  [CampaignStatus.PAUSED]: 'warning',
  [CampaignStatus.DRAFT]: 'default',
  [CampaignStatus.SCHEDULED]: 'info',
  [CampaignStatus.COMPLETED]: 'default',
  [CampaignStatus.DELETED]: 'error',
};

// User Role Constants
export const USER_ROLES = Object.values(UserRole);

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.ANALYST]: 'Analyst',
  [UserRole.VIEWER]: 'Viewer',
};

export const USER_PERMISSIONS = Object.values(Permission);

// Date Range Presets
export const DATE_RANGE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'Last 14 Days', value: 'last_14_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'Last 90 Days', value: 'last_90_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'Last Quarter', value: 'last_quarter' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Last Year', value: 'last_year' },
  { label: 'All Time', value: 'all_time' },
  { label: 'Custom', value: 'custom' },
];

// Metric Constants
export const METRICS = [
  { key: 'impressions', label: 'Impressions', format: 'number' },
  { key: 'clicks', label: 'Clicks', format: 'number' },
  { key: 'spend', label: 'Spend', format: 'currency' },
  { key: 'conversions', label: 'Conversions', format: 'number' },
  { key: 'revenue', label: 'Revenue', format: 'currency' },
  { key: 'ctr', label: 'CTR', format: 'percent' },
  { key: 'cpc', label: 'CPC', format: 'currency' },
  { key: 'cpm', label: 'CPM', format: 'currency' },
  { key: 'cpa', label: 'CPA', format: 'currency' },
  { key: 'roas', label: 'ROAS', format: 'number' },
  { key: 'roi', label: 'ROI', format: 'percent' },
  { key: 'reach', label: 'Reach', format: 'number' },
  { key: 'frequency', label: 'Frequency', format: 'number' },
];

// Chart Colors
export const CHART_COLORS = [
  '#1976d2',
  '#dc004e',
  '#9c27b0',
  '#f57c00',
  '#388e3c',
  '#00796b',
  '#5c6bc0',
  '#e91e63',
  '#8e24aa',
  '#ff6f00',
];

// Currency Symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
};

// File Upload Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['.csv', '.xlsx', '.xls', '.json'];

// Pagination Constants
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// API Rate Limiting
export const API_RATE_LIMIT = 100;
export const API_RATE_WINDOW = 60000; // 1 minute

// LocalStorage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_STATE: 'sidebarState',
  PLATFORM_CREDENTIALS: 'platformCredentials',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UPLOAD_ERROR: 'File upload failed. Please try again.',
  CAMPAIGN_ERROR: 'Campaign operation failed. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CAMPAIGN_CREATED: 'Campaign created successfully',
  CAMPAIGN_UPDATED: 'Campaign updated successfully',
  CAMPAIGN_DELETED: 'Campaign deleted successfully',
  CAMPAIGN_PAUSED: 'Campaign paused successfully',
  CAMPAIGN_ACTIVATED: 'Campaign activated successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  DATA_IMPORTED: 'Data imported successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
};

// Export default object
export default {
  PLATFORMS,
  PLATFORM_COLORS,
  PLATFORM_NAMES,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_OBJECTIVE_LABELS,
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  USER_ROLES,
  USER_ROLE_LABELS,
  USER_PERMISSIONS,
  DATE_RANGE_PRESETS,
  METRICS,
  CHART_COLORS,
  CURRENCY_SYMBOLS,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  API_RATE_LIMIT,
  API_RATE_WINDOW,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
