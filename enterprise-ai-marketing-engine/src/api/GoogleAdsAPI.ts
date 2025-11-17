import axios, { AxiosInstance } from 'axios';
import {
  Campaign,
  CampaignMetrics,
  GoogleAdsAccount,
  ApiResponse,
  ApiError,
  Targeting,
} from '@/types';

interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string;
}

interface GoogleCampaignResource {
  resourceName: string;
  id: string;
  name: string;
  status: string;
  advertisingChannelType: string;
  biddingStrategyType: string;
  campaignBudget: string;
  startDate: string;
  endDate?: string;
}

export class GoogleAdsAPI {
  private client: AxiosInstance;
  private config: GoogleAdsConfig;
  private accessToken?: string;
  private tokenExpiresAt?: Date;

  constructor(config: GoogleAdsConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: 'https://googleads.googleapis.com/v14',
      headers: {
        'Content-Type': 'application/json',
        'developer-token': config.developerToken,
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.accessToken || this.isTokenExpired()) {
          await this.refreshAccessToken();
        }

        config.headers.Authorization = `Bearer ${this.accessToken}`;
        if (this.config.loginCustomerId) {
          config.headers['login-customer-id'] = this.config.loginCustomerId;
        }

        console.log(`[Google Ads API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        return this.handleError(error);
      }
    );
  }

  // ==================== AUTHENTICATION ====================

  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token',
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      console.log('[Google Ads API] Access token refreshed');
    } catch (error) {
      console.error('[Google Ads API] Failed to refresh access token', error);
      throw this.handleError(error);
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;
    return new Date() >= this.tokenExpiresAt;
  }

  // ==================== ACCOUNT OPERATIONS ====================

  async getCustomer(): Promise<ApiResponse<GoogleAdsAccount>> {
    try {
      const query = `
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone
        FROM customer
        WHERE customer.id = ${this.config.customerId}
      `;

      const response = await this.searchStream(query);
      const customer = response[0]?.customer;

      return {
        success: true,
        data: {
          customerId: customer.id.toString(),
          descriptiveName: customer.descriptiveName,
          currencyCode: customer.currencyCode,
          timeZone: customer.timeZone,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAccessibleCustomers(): Promise<ApiResponse<string[]>> {
    try {
      const response = await axios.get(
        'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'developer-token': this.config.developerToken,
          },
        }
      );

      return {
        success: true,
        data: response.data.resourceNames || [],
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== CAMPAIGN OPERATIONS ====================

  async getCampaigns(): Promise<ApiResponse<Campaign[]>> {
    try {
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.bidding_strategy_type,
          campaign_budget.amount_micros,
          campaign.start_date,
          campaign.end_date,
          campaign.optimization_score,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        AND segments.date DURING LAST_30_DAYS
      `;

      const results = await this.searchStream(query);

      const campaigns = results.map((row: any) => this.transformGoogleCampaign(row));

      return {
        success: true,
        data: campaigns,
        meta: {
          totalRecords: campaigns.length,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCampaign(campaignId: string): Promise<ApiResponse<Campaign>> {
    try {
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.bidding_strategy_type,
          campaign_budget.amount_micros,
          campaign.start_date,
          campaign.end_date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE campaign.id = ${campaignId}
      `;

      const results = await this.searchStream(query);

      if (results.length === 0) {
        throw new Error('Campaign not found');
      }

      const campaign = this.transformGoogleCampaign(results[0]);

      return {
        success: true,
        data: campaign,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCampaign(campaignData: Partial<Campaign>): Promise<ApiResponse<Campaign>> {
    try {
      // First create campaign budget
      const budgetResourceName = await this.createCampaignBudget(campaignData.budget!);

      // Create campaign
      const operation = {
        create: {
          name: campaignData.name,
          status: this.mapStatusToGoogle(campaignData.status!),
          advertisingChannelType: 'SEARCH',
          biddingStrategyType: 'TARGET_CPA',
          campaignBudget: budgetResourceName,
          networkSettings: {
            targetGoogleSearch: true,
            targetSearchNetwork: true,
            targetContentNetwork: false,
            targetPartnerSearchNetwork: false,
          },
          startDate: this.formatDate(campaignData.schedule?.startDate!),
          endDate: campaignData.schedule?.endDate
            ? this.formatDate(campaignData.schedule.endDate)
            : undefined,
        },
      };

      const response = await this.client.post(
        `/customers/${this.config.customerId}/campaigns:mutate`,
        {
          operations: [operation],
        }
      );

      const resourceName = response.data.results[0].resourceName;
      const campaignId = resourceName.split('/').pop();

      return await this.getCampaign(campaignId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<ApiResponse<Campaign>> {
    try {
      const resourceName = `customers/${this.config.customerId}/campaigns/${campaignId}`;

      const operation: any = {
        update: {
          resourceName,
        },
        updateMask: { paths: [] },
      };

      if (updates.name) {
        operation.update.name = updates.name;
        operation.updateMask.paths.push('name');
      }

      if (updates.status) {
        operation.update.status = this.mapStatusToGoogle(updates.status);
        operation.updateMask.paths.push('status');
      }

      await this.client.post(`/customers/${this.config.customerId}/campaigns:mutate`, {
        operations: [operation],
      });

      return await this.getCampaign(campaignId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCampaign(campaignId: string): Promise<ApiResponse<boolean>> {
    try {
      const resourceName = `customers/${this.config.customerId}/campaigns/${campaignId}`;

      await this.client.post(`/customers/${this.config.customerId}/campaigns:mutate`, {
        operations: [
          {
            remove: resourceName,
          },
        ],
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

  async pauseCampaign(campaignId: string): Promise<ApiResponse<Campaign>> {
    return this.updateCampaign(campaignId, { status: 'PAUSED' } as any);
  }

  async activateCampaign(campaignId: string): Promise<ApiResponse<Campaign>> {
    return this.updateCampaign(campaignId, { status: 'ACTIVE' } as any);
  }

  // ==================== BUDGET OPERATIONS ====================

  private async createCampaignBudget(budget: any): Promise<string> {
    try {
      const operation = {
        create: {
          name: `Budget ${Date.now()}`,
          amountMicros: budget.amount * 1000000,
          deliveryMethod: 'STANDARD',
        },
      };

      const response = await this.client.post(
        `/customers/${this.config.customerId}/campaignBudgets:mutate`,
        {
          operations: [operation],
        }
      );

      return response.data.results[0].resourceName;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== KEYWORD OPERATIONS ====================

  async getKeywords(campaignId: string): Promise<ApiResponse<any[]>> {
    try {
      const query = `
        SELECT
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.quality_info.quality_score,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM keyword_view
        WHERE campaign.id = ${campaignId}
        AND segments.date DURING LAST_30_DAYS
      `;

      const results = await this.searchStream(query);

      return {
        success: true,
        data: results,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addKeywords(adGroupId: string, keywords: string[]): Promise<ApiResponse<any>> {
    try {
      const operations = keywords.map((keyword) => ({
        create: {
          adGroup: `customers/${this.config.customerId}/adGroups/${adGroupId}`,
          status: 'ENABLED',
          keyword: {
            text: keyword,
            matchType: 'BROAD',
          },
        },
      }));

      const response = await this.client.post(
        `/customers/${this.config.customerId}/adGroupCriteria:mutate`,
        {
          operations,
        }
      );

      return {
        success: true,
        data: response.data.results,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== PERFORMANCE METRICS ====================

  async getCampaignMetrics(
    campaignId: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<ApiResponse<CampaignMetrics>> {
    try {
      const dateCondition = dateRange
        ? `AND segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'`
        : 'AND segments.date DURING LAST_30_DAYS';

      const query = `
        SELECT
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value,
          metrics.ctr,
          metrics.average_cpc,
          metrics.average_cpm,
          metrics.cost_per_conversion,
          metrics.all_conversions_value_per_cost
        FROM campaign
        WHERE campaign.id = ${campaignId}
        ${dateCondition}
      `;

      const results = await this.searchStream(query);

      if (results.length === 0) {
        throw new Error('No metrics found for campaign');
      }

      const metrics = results[0].metrics;

      const campaignMetrics: CampaignMetrics = {
        impressions: parseInt(metrics.impressions || '0'),
        clicks: parseInt(metrics.clicks || '0'),
        spend: parseFloat(metrics.costMicros || '0') / 1000000,
        conversions: parseFloat(metrics.conversions || '0'),
        revenue: parseFloat(metrics.conversionsValue || '0'),
        ctr: parseFloat(metrics.ctr || '0') * 100,
        cpc: parseFloat(metrics.averageCpc || '0') / 1000000,
        cpm: parseFloat(metrics.averageCpm || '0') / 1000000,
        cpa: parseFloat(metrics.costPerConversion || '0') / 1000000,
        roas: parseFloat(metrics.allConversionsValuePerCost || '0'),
        roi: 0,
        reach: 0,
        frequency: 0,
        engagements: 0,
        videoViews: 0,
        videoWatchTime: 0,
        dailyMetrics: [],
      };

      return {
        success: true,
        data: campaignMetrics,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDailyMetrics(campaignId: string, days: number = 30): Promise<ApiResponse<any[]>> {
    try {
      const query = `
        SELECT
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE campaign.id = ${campaignId}
        AND segments.date DURING LAST_${days}_DAYS
        ORDER BY segments.date DESC
      `;

      const results = await this.searchStream(query);

      return {
        success: true,
        data: results.map((row: any) => ({
          date: row.segments.date,
          impressions: parseInt(row.metrics.impressions || '0'),
          clicks: parseInt(row.metrics.clicks || '0'),
          spend: parseFloat(row.metrics.costMicros || '0') / 1000000,
          conversions: parseFloat(row.metrics.conversions || '0'),
          revenue: parseFloat(row.metrics.conversionsValue || '0'),
        })),
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== SEARCH OPERATIONS ====================

  private async searchStream(query: string): Promise<any[]> {
    try {
      const response = await this.client.post(
        `/customers/${this.config.customerId}/googleAds:searchStream`,
        {
          query,
        }
      );

      const results: any[] = [];
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((batch: any) => {
          if (batch.results) {
            results.push(...batch.results);
          }
        });
      }

      return results;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== HELPER METHODS ====================

  private transformGoogleCampaign(row: any): Campaign {
    const campaign = row.campaign;
    const metrics = row.metrics || {};
    const budget = row.campaignBudget || {};

    return {
      id: campaign.id?.toString() || '',
      name: campaign.name || '',
      platform: 'GOOGLE' as const,
      status: this.mapGoogleStatus(campaign.status),
      objective: this.mapGoogleObjective(campaign.advertisingChannelType),
      budget: {
        type: 'daily',
        amount: parseFloat(budget.amountMicros || '0') / 1000000,
        currency: 'USD',
        spent: parseFloat(metrics.costMicros || '0') / 1000000,
        remaining: 0,
        bidStrategy: {
          type: this.mapBiddingStrategy(campaign.biddingStrategyType),
        },
      },
      targeting: {} as Targeting,
      schedule: {
        startDate: new Date(campaign.startDate || Date.now()),
        endDate: campaign.endDate ? new Date(campaign.endDate) : undefined,
        timezone: 'UTC',
      },
      creatives: [],
      metrics: {
        impressions: parseInt(metrics.impressions || '0'),
        clicks: parseInt(metrics.clicks || '0'),
        spend: parseFloat(metrics.costMicros || '0') / 1000000,
        conversions: parseFloat(metrics.conversions || '0'),
        revenue: parseFloat(metrics.conversionsValue || '0'),
        ctr: 0,
        cpc: 0,
        cpm: 0,
        cpa: 0,
        roas: 0,
        roi: 0,
        reach: 0,
        frequency: 0,
        engagements: 0,
        videoViews: 0,
        videoWatchTime: 0,
        dailyMetrics: [],
      },
      settings: {
        optimization: {
          enabled: true,
          goal: 'CONVERSIONS',
          conversionWindow: 30,
          attributionSetting: 'last_click',
        },
        tracking: {
          conversionEvents: [],
          utmParameters: {
            source: 'google',
            medium: 'cpc',
            campaign: campaign.name,
          },
        },
        delivery: {
          pacing: 'standard',
        },
      },
      userId: '',
      accountId: this.config.customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    };
  }

  private mapGoogleStatus(status: string): any {
    const statusMap: any = {
      ENABLED: 'ACTIVE',
      PAUSED: 'PAUSED',
      REMOVED: 'DELETED',
    };
    return statusMap[status] || 'DRAFT';
  }

  private mapStatusToGoogle(status: string): string {
    const statusMap: any = {
      ACTIVE: 'ENABLED',
      PAUSED: 'PAUSED',
      DELETED: 'REMOVED',
    };
    return statusMap[status] || 'PAUSED';
  }

  private mapGoogleObjective(channelType: string): any {
    const objectiveMap: any = {
      SEARCH: 'TRAFFIC',
      DISPLAY: 'AWARENESS',
      SHOPPING: 'SALES',
      VIDEO: 'AWARENESS',
      MULTI_CHANNEL: 'CONVERSION',
    };
    return objectiveMap[channelType] || 'TRAFFIC';
  }

  private mapBiddingStrategy(strategy: string): any {
    const strategyMap: any = {
      TARGET_CPA: 'target_cost',
      TARGET_ROAS: 'target_cost',
      MAXIMIZE_CONVERSIONS: 'lowest_cost',
      MAXIMIZE_CONVERSION_VALUE: 'lowest_cost',
      MANUAL_CPC: 'manual',
      ENHANCED_CPC: 'manual',
    };
    return strategyMap[strategy] || 'lowest_cost';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private handleError(error: any): ApiError {
    const apiError: ApiError = {
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.error?.message || error.message || 'An error occurred',
      details: error.response?.data?.error,
      statusCode: error.response?.status || 500,
    };

    console.error('[Google Ads API Error]', apiError);
    throw apiError;
  }
}

export default GoogleAdsAPI;
