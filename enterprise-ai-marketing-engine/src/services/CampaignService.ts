import APIClientFactory from '@/api/APIClientFactory';
import {
  Campaign,
  CampaignMetrics,
  Platform,
  PlatformCredentials,
  ApiResponse,
  ApiError,
  CampaignStatus,
} from '@/types';
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export class CampaignService {
  private client: AxiosInstance;
  private platformCredentials: Map<Platform, PlatformCredentials> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/campaigns`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token from localStorage
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ==================== PLATFORM CREDENTIALS ====================

  setPlatformCredentials(platform: Platform, credentials: PlatformCredentials): void {
    this.platformCredentials.set(platform, credentials);
    // Store in localStorage for persistence
    localStorage.setItem(
      `credentials_${platform}`,
      JSON.stringify(credentials)
    );
  }

  getPlatformCredentials(platform: Platform): PlatformCredentials | undefined {
    if (!this.platformCredentials.has(platform)) {
      // Try to load from localStorage
      const stored = localStorage.getItem(`credentials_${platform}`);
      if (stored) {
        this.platformCredentials.set(platform, JSON.parse(stored));
      }
    }
    return this.platformCredentials.get(platform);
  }

  // ==================== CAMPAIGN OPERATIONS ====================

  async getCampaigns(filters?: {
    platform?: Platform[];
    status?: CampaignStatus[];
    userId?: string;
  }): Promise<ApiResponse<Campaign[]>> {
    try {
      // Fetch campaigns from all connected platforms
      const platforms = filters?.platform || [
        Platform.META,
        Platform.GOOGLE,
        Platform.TIKTOK,
        Platform.SNAPCHAT,
      ];

      const campaignPromises = platforms.map((platform) =>
        this.getCampaignsByPlatform(platform).catch((error) => {
          console.error(`Failed to fetch ${platform} campaigns:`, error);
          return { success: false, data: [], timestamp: new Date() };
        })
      );

      const results = await Promise.all(campaignPromises);
      let allCampaigns: Campaign[] = [];

      results.forEach((result) => {
        if (result.success) {
          allCampaigns = [...allCampaigns, ...result.data];
        }
      });

      // Apply filters
      if (filters?.status) {
        allCampaigns = allCampaigns.filter((c) => filters.status!.includes(c.status));
      }

      if (filters?.userId) {
        allCampaigns = allCampaigns.filter((c) => c.userId === filters.userId);
      }

      // Sort by updated date
      allCampaigns.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      return {
        success: true,
        data: allCampaigns,
        meta: {
          totalRecords: allCampaigns.length,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCampaignsByPlatform(platform: Platform): Promise<ApiResponse<Campaign[]>> {
    try {
      const credentials = this.getPlatformCredentials(platform);
      if (!credentials) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      const client = APIClientFactory.getClient(platform, credentials);
      const response = await client.getCampaigns();

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCampaign(campaignId: string, platform: Platform): Promise<ApiResponse<Campaign>> {
    try {
      const credentials = this.getPlatformCredentials(platform);
      if (!credentials) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      const client = APIClientFactory.getClient(platform, credentials);
      const response = await client.getCampaign(campaignId);

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCampaign(
    platform: Platform,
    campaignData: Partial<Campaign>
  ): Promise<ApiResponse<Campaign>> {
    try {
      const credentials = this.getPlatformCredentials(platform);
      if (!credentials) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      const client = APIClientFactory.getClient(platform, credentials);
      const response = await client.createCampaign(campaignData);

      // Store in local database
      await this.storeCampaignLocally(response.data);

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCampaign(
    campaignId: string,
    platform: Platform,
    updates: Partial<Campaign>
  ): Promise<ApiResponse<Campaign>> {
    try {
      const credentials = this.getPlatformCredentials(platform);
      if (!credentials) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      const client = APIClientFactory.getClient(platform, credentials);
      const response = await client.updateCampaign(campaignId, updates);

      // Update in local database
      await this.storeCampaignLocally(response.data);

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCampaign(campaignId: string, platform: Platform): Promise<ApiResponse<boolean>> {
    try {
      const credentials = this.getPlatformCredentials(platform);
      if (!credentials) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      const client = APIClientFactory.getClient(platform, credentials);
      const response = await client.deleteCampaign(campaignId);

      // Delete from local database
      await this.deleteCampaignLocally(campaignId);

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async pauseCampaign(campaignId: string, platform: Platform): Promise<ApiResponse<Campaign>> {
    try {
      const credentials = this.getPlatformCredentials(platform);
      if (!credentials) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      const client = APIClientFactory.getClient(platform, credentials);
      const response = await client.pauseCampaign(campaignId);

      await this.storeCampaignLocally(response.data);

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async activateCampaign(campaignId: string, platform: Platform): Promise<ApiResponse<Campaign>> {
    try {
      const credentials = this.getPlatformCredentials(platform);
      if (!credentials) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      const client = APIClientFactory.getClient(platform, credentials);
      const response = await client.activateCampaign(campaignId);

      await this.storeCampaignLocally(response.data);

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== BULK OPERATIONS ====================

  async bulkPauseCampaigns(campaignIds: { id: string; platform: Platform }[]): Promise<ApiResponse<any>> {
    try {
      const results = await Promise.allSettled(
        campaignIds.map(({ id, platform }) => this.pauseCampaign(id, platform))
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        success: true,
        data: {
          successful,
          failed,
          total: campaignIds.length,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bulkActivateCampaigns(campaignIds: { id: string; platform: Platform }[]): Promise<ApiResponse<any>> {
    try {
      const results = await Promise.allSettled(
        campaignIds.map(({ id, platform }) => this.activateCampaign(id, platform))
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        success: true,
        data: {
          successful,
          failed,
          total: campaignIds.length,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bulkDeleteCampaigns(campaignIds: { id: string; platform: Platform }[]): Promise<ApiResponse<any>> {
    try {
      const results = await Promise.allSettled(
        campaignIds.map(({ id, platform }) => this.deleteCampaign(id, platform))
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        success: true,
        data: {
          successful,
          failed,
          total: campaignIds.length,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== METRICS & ANALYTICS ====================

  async getCampaignMetrics(
    campaignId: string,
    platform: Platform,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<ApiResponse<CampaignMetrics>> {
    try {
      const credentials = this.getPlatformCredentials(platform);
      if (!credentials) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      const client = APIClientFactory.getClient(platform, credentials);
      const response = await client.getCampaignMetrics(campaignId, dateRange);

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDailyMetrics(
    campaignId: string,
    platform: Platform,
    dateRange: { startDate: string; endDate: string }
  ): Promise<ApiResponse<any[]>> {
    try {
      const credentials = this.getPlatformCredentials(platform);
      if (!credentials) {
        throw new Error(`No credentials found for platform: ${platform}`);
      }

      const client = APIClientFactory.getClient(platform, credentials);
      const response = await client.getDailyMetrics(campaignId, dateRange);

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAggregatedMetrics(
    campaignIds: { id: string; platform: Platform }[]
  ): Promise<ApiResponse<any>> {
    try {
      const metricsPromises = campaignIds.map(({ id, platform }) =>
        this.getCampaignMetrics(id, platform).catch(() => null)
      );

      const results = await Promise.all(metricsPromises);

      const aggregated = {
        totalSpend: 0,
        totalRevenue: 0,
        totalConversions: 0,
        totalImpressions: 0,
        totalClicks: 0,
        averageCTR: 0,
        averageCPC: 0,
        averageROAS: 0,
      };

      let validMetrics = 0;

      results.forEach((result) => {
        if (result && result.success) {
          const metrics = result.data;
          aggregated.totalSpend += metrics.spend;
          aggregated.totalRevenue += metrics.revenue;
          aggregated.totalConversions += metrics.conversions;
          aggregated.totalImpressions += metrics.impressions;
          aggregated.totalClicks += metrics.clicks;
          validMetrics++;
        }
      });

      if (validMetrics > 0) {
        aggregated.averageCTR = (aggregated.totalClicks / aggregated.totalImpressions) * 100;
        aggregated.averageCPC = aggregated.totalSpend / aggregated.totalClicks;
        aggregated.averageROAS = aggregated.totalRevenue / aggregated.totalSpend;
      }

      return {
        success: true,
        data: aggregated,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== SYNCHRONIZATION ====================

  async syncAllCampaigns(): Promise<ApiResponse<any>> {
    try {
      const platforms = [Platform.META, Platform.GOOGLE, Platform.TIKTOK, Platform.SNAPCHAT];

      const syncResults = await Promise.allSettled(
        platforms.map((platform) => this.syncPlatformCampaigns(platform))
      );

      let totalSynced = 0;
      let totalFailed = 0;

      syncResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          totalSynced += result.value.data.synced;
        } else {
          totalFailed++;
        }
      });

      return {
        success: true,
        data: {
          totalSynced,
          totalFailed,
          platforms: platforms.length,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async syncPlatformCampaigns(platform: Platform): Promise<ApiResponse<any>> {
    try {
      const response = await this.getCampaignsByPlatform(platform);

      if (response.success) {
        // Store all campaigns locally
        await Promise.all(response.data.map((c) => this.storeCampaignLocally(c)));

        return {
          success: true,
          data: {
            platform,
            synced: response.data.length,
          },
          timestamp: new Date(),
        };
      }

      throw new Error(`Failed to sync ${platform} campaigns`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== LOCAL STORAGE ====================

  private async storeCampaignLocally(campaign: Campaign): Promise<void> {
    try {
      await this.client.post('/store', campaign);
    } catch (error) {
      console.error('Failed to store campaign locally:', error);
    }
  }

  private async deleteCampaignLocally(campaignId: string): Promise<void> {
    try {
      await this.client.delete(`/${campaignId}`);
    } catch (error) {
      console.error('Failed to delete campaign locally:', error);
    }
  }

  // ==================== CAMPAIGN TEMPLATES ====================

  async createTemplate(campaign: Campaign, templateName: string): Promise<ApiResponse<any>> {
    try {
      const template = {
        name: templateName,
        platform: campaign.platform,
        objective: campaign.objective,
        budget: campaign.budget,
        targeting: campaign.targeting,
        schedule: campaign.schedule,
        settings: campaign.settings,
      };

      const response = await this.client.post('/templates', template);

      return {
        success: true,
        data: response.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTemplates(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/templates');

      return {
        success: true,
        data: response.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async applyTemplate(templateId: string, campaignName: string): Promise<ApiResponse<Partial<Campaign>>> {
    try {
      const response = await this.client.post(`/templates/${templateId}/apply`, {
        name: campaignName,
      });

      return {
        success: true,
        data: response.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== HELPER METHODS ====================

  private handleError(error: any): ApiError {
    const apiError: ApiError = {
      code: error.response?.data?.code || 'CAMPAIGN_ERROR',
      message: error.response?.data?.message || error.message || 'Campaign operation failed',
      details: error.response?.data,
      statusCode: error.response?.status || 500,
    };

    console.error('[Campaign Service Error]', apiError);
    throw apiError;
  }
}

export default new CampaignService();
