import axios, { AxiosInstance } from 'axios';
import jwtDecode from 'jwt-decode';
import CryptoJS from 'crypto-js';
import { OTPAuth } from 'otpauth';
import QRCode from 'qrcode';
import {
  User,
  UserRole,
  Permission,
  LoginCredentials,
  RegisterData,
  MFASetup,
  MFAVerification,
  TokenPayload,
  Session,
  ApiResponse,
  ApiError,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = import.meta.env.VITE_JWT_EXPIRATION || '24h';
const REFRESH_TOKEN_EXPIRATION = import.meta.env.VITE_REFRESH_TOKEN_EXPIRATION || '7d';

export class AuthService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/auth`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Load tokens from storage
    this.loadTokensFromStorage();
  }

  // ==================== AUTHENTICATION ====================

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: any; mfaRequired?: boolean; mfaToken?: string }>> {
    try {
      const response = await this.client.post('/login', credentials);

      // Check if MFA is required
      if (response.data.mfaRequired) {
        return {
          success: true,
          data: {
            user: null as any,
            tokens: null,
            mfaRequired: true,
            mfaToken: response.data.mfaToken,
          },
          timestamp: new Date(),
        };
      }

      const { user, accessToken, refreshToken } = response.data;

      this.setTokens(accessToken, refreshToken);

      // Log session
      await this.logSession(user.id);

      return {
        success: true,
        data: {
          user,
          tokens: { accessToken, refreshToken },
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(data: RegisterData): Promise<ApiResponse<User>> {
    try {
      const hashedPassword = this.hashPassword(data.password);

      const response = await this.client.post('/register', {
        ...data,
        password: hashedPassword,
      });

      return {
        success: true,
        data: response.data.user,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/logout', {
        refreshToken: this.refreshToken,
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken(): Promise<string> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: this.refreshToken,
      });

      const { accessToken, refreshToken } = response.data;

      this.setTokens(accessToken, refreshToken);

      return accessToken;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== MFA OPERATIONS ====================

  async setupMFA(method: 'sms' | 'email' | 'authenticator'): Promise<ApiResponse<MFASetup>> {
    try {
      const user = await this.getCurrentUser();

      let secret: string | undefined;
      let qrCode: string | undefined;

      if (method === 'authenticator') {
        // Generate TOTP secret
        const totp = new OTPAuth.TOTP({
          issuer: 'Marketing Engine',
          label: user.data.email,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(this.generateSecret()),
        });

        secret = totp.secret.base32;

        // Generate QR code
        const otpauthUrl = totp.toString();
        qrCode = await QRCode.toDataURL(otpauthUrl);
      }

      const response = await this.client.post('/mfa/setup', {
        method,
        secret,
      });

      return {
        success: true,
        data: {
          method,
          secret: response.data.secret || secret,
          qrCode,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyMFA(verification: MFAVerification): Promise<ApiResponse<{ user: User; tokens: any }>> {
    try {
      const response = await this.client.post('/mfa/verify', verification);

      const { user, accessToken, refreshToken } = response.data;

      this.setTokens(accessToken, refreshToken);

      return {
        success: true,
        data: {
          user,
          tokens: { accessToken, refreshToken },
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async enableMFA(code: string): Promise<ApiResponse<boolean>> {
    try {
      await this.client.post('/mfa/enable', { code });

      return {
        success: true,
        data: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async disableMFA(code: string): Promise<ApiResponse<boolean>> {
    try {
      await this.client.post('/mfa/disable', { code });

      return {
        success: true,
        data: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== USER OPERATIONS ====================

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.get('/me');

      return {
        success: true,
        data: response.data.user,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.put('/profile', updates);

      return {
        success: true,
        data: response.data.user,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<boolean>> {
    try {
      await this.client.post('/password/change', {
        currentPassword: this.hashPassword(currentPassword),
        newPassword: this.hashPassword(newPassword),
      });

      return {
        success: true,
        data: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<boolean>> {
    try {
      await this.client.post('/password/reset/request', { email });

      return {
        success: true,
        data: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<boolean>> {
    try {
      await this.client.post('/password/reset', {
        token,
        newPassword: this.hashPassword(newPassword),
      });

      return {
        success: true,
        data: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== SESSION MANAGEMENT ====================

  async getSessions(): Promise<ApiResponse<Session[]>> {
    try {
      const response = await this.client.get('/sessions');

      return {
        success: true,
        data: response.data.sessions,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async revokeSession(sessionId: string): Promise<ApiResponse<boolean>> {
    try {
      await this.client.delete(`/sessions/${sessionId}`);

      return {
        success: true,
        data: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async logSession(userId: string): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();

      await this.client.post('/sessions/log', {
        userId,
        deviceInfo,
        ipAddress: await this.getIPAddress(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log session:', error);
    }
  }

  // ==================== PERMISSIONS & ROLES ====================

  hasPermission(user: User, permission: Permission): boolean {
    return user.permissions.includes(permission);
  }

  hasRole(user: User, role: UserRole): boolean {
    return user.role === role;
  }

  hasAnyRole(user: User, roles: UserRole[]): boolean {
    return roles.includes(user.role);
  }

  canAccessResource(user: User, resourceOwnerId: string): boolean {
    // Super admins can access everything
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Admins can access everything in their organization
    if (user.role === UserRole.ADMIN) return true;

    // Users can only access their own resources
    return user.id === resourceOwnerId;
  }

  getRolePermissions(role: UserRole): Permission[] {
    const rolePermissions: Record<UserRole, Permission[]> = {
      [UserRole.SUPER_ADMIN]: Object.values(Permission),
      [UserRole.ADMIN]: [
        Permission.CREATE_CAMPAIGN,
        Permission.EDIT_CAMPAIGN,
        Permission.DELETE_CAMPAIGN,
        Permission.VIEW_CAMPAIGN,
        Permission.PAUSE_CAMPAIGN,
        Permission.CREATE_USER,
        Permission.EDIT_USER,
        Permission.VIEW_USER,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
        Permission.MANAGE_BUDGET,
        Permission.APPROVE_BUDGET,
        Permission.MANAGE_SETTINGS,
      ],
      [UserRole.MANAGER]: [
        Permission.CREATE_CAMPAIGN,
        Permission.EDIT_CAMPAIGN,
        Permission.VIEW_CAMPAIGN,
        Permission.PAUSE_CAMPAIGN,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
        Permission.MANAGE_BUDGET,
      ],
      [UserRole.ANALYST]: [
        Permission.VIEW_CAMPAIGN,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
      ],
      [UserRole.VIEWER]: [
        Permission.VIEW_CAMPAIGN,
        Permission.VIEW_ANALYTICS,
      ],
    };

    return rolePermissions[role] || [];
  }

  // ==================== TOKEN MANAGEMENT ====================

  getAccessToken(): string | null {
    return this.accessToken || localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return this.refreshToken || localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private loadTokensFromStorage(): void {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  decodeToken(token: string): TokenPayload {
    return jwtDecode<TokenPayload>(token);
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired(token);
  }

  // ==================== HELPER METHODS ====================

  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  private generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private getDeviceInfo(): any {
    const ua = navigator.userAgent;

    return {
      browser: this.getBrowser(ua),
      os: this.getOS(ua),
      device: this.getDevice(ua),
    };
  }

  private getBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getDevice(ua: string): string {
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  private async getIPAddress(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch {
      return 'Unknown';
    }
  }

  private handleError(error: any): ApiError {
    const apiError: ApiError = {
      code: error.response?.data?.code || 'AUTH_ERROR',
      message: error.response?.data?.message || error.message || 'Authentication failed',
      details: error.response?.data,
      statusCode: error.response?.status || 500,
    };

    console.error('[Auth Service Error]', apiError);
    throw apiError;
  }
}

export default new AuthService();
