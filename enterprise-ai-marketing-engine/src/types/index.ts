// ==================== USER MANAGEMENT TYPES ====================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER',
}

export enum Permission {
  // Campaign permissions
  CREATE_CAMPAIGN = 'CREATE_CAMPAIGN',
  EDIT_CAMPAIGN = 'EDIT_CAMPAIGN',
  DELETE_CAMPAIGN = 'DELETE_CAMPAIGN',
  VIEW_CAMPAIGN = 'VIEW_CAMPAIGN',
  PAUSE_CAMPAIGN = 'PAUSE_CAMPAIGN',

  // User management permissions
  CREATE_USER = 'CREATE_USER',
  EDIT_USER = 'EDIT_USER',
  DELETE_USER = 'DELETE_USER',
  VIEW_USER = 'VIEW_USER',

  // Analytics permissions
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_DATA = 'EXPORT_DATA',

  // Budget permissions
  MANAGE_BUDGET = 'MANAGE_BUDGET',
  APPROVE_BUDGET = 'APPROVE_BUDGET',

  // System permissions
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  VIEW_AUDIT_LOG = 'VIEW_AUDIT_LOG',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  phoneNumber?: string;
  mfaEnabled: boolean;
  mfaMethod?: 'sms' | 'email' | 'authenticator';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  campaignAlerts: boolean;
  budgetAlerts: boolean;
  performanceAlerts: boolean;
  weeklyReports: boolean;
}

export interface DashboardPreferences {
  defaultView: 'grid' | 'list';
  defaultDateRange: string;
  favoriteMetrics: string[];
  chartType: 'line' | 'bar' | 'pie';
}

// ==================== AUTHENTICATION TYPES ====================

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface MFASetup {
  method: 'sms' | 'email' | 'authenticator';
  secret?: string;
  qrCode?: string;
}

export interface MFAVerification {
  code: string;
  mfaToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  location?: string;
}

// ==================== CAMPAIGN MANAGEMENT TYPES ====================

export enum Platform {
  META = 'META',
  GOOGLE = 'GOOGLE',
  TIKTOK = 'TIKTOK',
  SNAPCHAT = 'SNAPCHAT',
}

export enum CampaignStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  DELETED = 'DELETED',
}

export enum CampaignObjective {
  AWARENESS = 'AWARENESS',
  CONSIDERATION = 'CONSIDERATION',
  CONVERSION = 'CONVERSION',
  TRAFFIC = 'TRAFFIC',
  ENGAGEMENT = 'ENGAGEMENT',
  LEAD_GENERATION = 'LEAD_GENERATION',
  SALES = 'SALES',
}

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: CampaignStatus;
  objective: CampaignObjective;
  budget: Budget;
  targeting: Targeting;
  schedule: Schedule;
  creatives: Creative[];
  metrics: CampaignMetrics;
  settings: CampaignSettings;
  userId: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
}

export interface Budget {
  type: 'daily' | 'lifetime';
  amount: number;
  currency: string;
  spent: number;
  remaining: number;
  bidStrategy: BidStrategy;
}

export interface BidStrategy {
  type: 'lowest_cost' | 'target_cost' | 'cost_cap' | 'bid_cap' | 'manual';
  amount?: number;
}

export interface Targeting {
  locations: Location[];
  ageRange: AgeRange;
  genders: Gender[];
  languages: string[];
  interests: Interest[];
  behaviors: Behavior[];
  demographics: Demographics;
  devices: Device[];
  placements: Placement[];
  audiences: Audience[];
}

export interface Location {
  type: 'country' | 'region' | 'city' | 'zip';
  name: string;
  key: string;
  radius?: number;
  radiusUnit?: 'km' | 'miles';
}

export interface AgeRange {
  min: number;
  max: number;
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  ALL = 'ALL',
}

export interface Interest {
  id: string;
  name: string;
  category: string;
}

export interface Behavior {
  id: string;
  name: string;
  category: string;
}

export interface Demographics {
  education?: string[];
  jobTitles?: string[];
  income?: string[];
  relationship?: string[];
}

export interface Device {
  type: 'mobile' | 'desktop' | 'tablet';
  os?: string[];
  models?: string[];
}

export interface Placement {
  platform: Platform;
  position: string;
  deviceType?: string;
}

export interface Audience {
  id: string;
  name: string;
  type: 'custom' | 'lookalike' | 'saved';
  size: number;
}

export interface Schedule {
  startDate: Date;
  endDate?: Date;
  timezone: string;
  dayparting?: Dayparting[];
}

export interface Dayparting {
  days: number[]; // 0-6 (Sunday-Saturday)
  startHour: number;
  endHour: number;
}

export interface Creative {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'collection';
  name: string;
  headline: string;
  description: string;
  callToAction: string;
  assets: CreativeAsset[];
  preview?: string;
  status: 'active' | 'paused' | 'rejected';
}

export interface CreativeAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  dimensions?: { width: number; height: number };
  size?: number;
  duration?: number;
}

export interface CampaignSettings {
  optimization: OptimizationSettings;
  tracking: TrackingSettings;
  delivery: DeliverySettings;
}

export interface OptimizationSettings {
  enabled: boolean;
  goal: string;
  conversionWindow: number;
  attributionSetting: string;
}

export interface TrackingSettings {
  pixelId?: string;
  conversionEvents: string[];
  utmParameters: UTMParameters;
}

export interface UTMParameters {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

export interface DeliverySettings {
  pacing: 'standard' | 'accelerated';
  frequencyCap?: FrequencyCap;
}

export interface FrequencyCap {
  impressions: number;
  duration: number;
  timeUnit: 'hour' | 'day' | 'week';
}

// ==================== CAMPAIGN METRICS TYPES ====================

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  roas: number;
  roi: number;
  reach: number;
  frequency: number;
  engagements: number;
  videoViews: number;
  videoWatchTime: number;
  dailyMetrics: DailyMetric[];
  platformMetrics?: PlatformSpecificMetrics;
}

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
}

export interface PlatformSpecificMetrics {
  [key: string]: any;
}

// ==================== ANALYTICS TYPES ====================

export interface AnalyticsData {
  campaigns: Campaign[];
  totalMetrics: AggregatedMetrics;
  trends: TrendData[];
  insights: Insight[];
  comparisons: Comparison[];
  forecasts: Forecast[];
}

export interface AggregatedMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averageCPC: number;
  averageROAS: number;
  averageROI: number;
}

export interface TrendData {
  metric: string;
  period: string;
  data: DataPoint[];
  change: number;
  changePercent: number;
}

export interface DataPoint {
  label: string;
  value: number;
  timestamp?: Date;
}

export interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  impact: 'high' | 'medium' | 'low';
  campaignId?: string;
  createdAt: Date;
}

export interface Comparison {
  id: string;
  name: string;
  campaigns: string[];
  metrics: ComparisonMetric[];
  period: DateRange;
}

export interface ComparisonMetric {
  metric: string;
  values: { [campaignId: string]: number };
}

export interface Forecast {
  metric: string;
  period: DateRange;
  predicted: DataPoint[];
  confidence: number;
  method: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// ==================== FILE UPLOAD TYPES ====================

export enum FileUploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  VALIDATING = 'VALIDATING',
  MAPPING = 'MAPPING',
  IMPORTING = 'IMPORTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ImportType {
  CAMPAIGNS = 'CAMPAIGNS',
  AUDIENCES = 'AUDIENCES',
  KEYWORDS = 'KEYWORDS',
  CREATIVES = 'CREATIVES',
  BUDGETS = 'BUDGETS',
}

export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileUploadStatus;
  progress: number;
  importType: ImportType;
  userId: string;
  uploadedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  error?: string;
  data?: FileData;
  validation?: ValidationResult;
  mapping?: FieldMapping;
  result?: ImportResult;
}

export interface FileData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  preview: any[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
  type: 'required' | 'type' | 'format' | 'range' | 'duplicate';
}

export interface ValidationWarning {
  row: number;
  column: string;
  value: any;
  message: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errorCount: number;
  warningCount: number;
}

export interface FieldMapping {
  [sourceField: string]: string; // maps source field to target field
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
  createdRecords: string[];
  updatedRecords: string[];
}

export interface ImportError {
  row: number;
  data: any;
  error: string;
}

// ==================== API TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: ResponseMeta;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  statusCode: number;
}

export interface ResponseMeta {
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalRecords?: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

// ==================== STATE MANAGEMENT TYPES ====================

export interface RootState {
  auth: AuthState;
  campaigns: CampaignState;
  analytics: AnalyticsState;
  upload: UploadState;
  ui: UIState;
  notifications: NotificationState;
}

export interface CampaignState {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;
  filters: CampaignFilters;
  pagination: PaginationState;
}

export interface CampaignFilters {
  platform?: Platform[];
  status?: CampaignStatus[];
  objective?: CampaignObjective[];
  dateRange?: DateRange;
  searchQuery?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface AnalyticsState {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  dateRange: DateRange;
  selectedMetrics: string[];
  comparisonMode: boolean;
}

export interface UploadState {
  uploads: FileUpload[];
  activeUpload: FileUpload | null;
  isUploading: boolean;
  error: string | null;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  language: string;
  loading: { [key: string]: boolean };
  modals: { [key: string]: boolean };
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// ==================== CHART TYPES ====================

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: any;
  scales?: any;
}

// ==================== TABLE TYPES ====================

export interface TableColumn<T = any> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface TableConfig {
  columns: TableColumn[];
  pagination: boolean;
  selectable: boolean;
  exportable: boolean;
}

// ==================== FORM TYPES ====================

export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  validation?: any;
  options?: SelectOption[];
  placeholder?: string;
  helperText?: string;
}

export interface SelectOption {
  label: string;
  value: any;
}

// ==================== EXPORT TYPES ====================

export enum ExportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
  JSON = 'JSON',
  PDF = 'PDF',
}

export interface ExportConfig {
  format: ExportFormat;
  filename: string;
  data: any[];
  columns?: string[];
  includeHeaders?: boolean;
}

// ==================== WEBHOOK TYPES ====================

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
}

// ==================== AUDIT LOG TYPES ====================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// ==================== API INTEGRATION TYPES ====================

export interface MetaAdAccount {
  id: string;
  name: string;
  accountId: string;
  currency: string;
  timezone: string;
}

export interface GoogleAdsAccount {
  customerId: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
}

export interface TikTokAdvertiser {
  advertiserId: string;
  advertiserName: string;
  currency: string;
  timezone: string;
}

export interface SnapchatAdAccount {
  id: string;
  name: string;
  type: string;
  status: string;
  currency: string;
}

export interface PlatformCredentials {
  platform: Platform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  accountId: string;
}
