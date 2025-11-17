import axios, { AxiosInstance } from 'axios';
import {
  Campaign,
  CampaignMetrics,
  Creative,
  Targeting,
  Budget,
  MetaAdAccount,
  ApiResponse,
  ApiError,
} from '@/types';

interface MetaAPIConfig {
  accessToken: string;
  apiVersion?: string;
  businessId?: string;
}

interface MetaCampaignParams {
  name: string;
  objective: string;
  status: string;
  special_ad_categories?: string[];
  budget_optimization?: boolean;
}

interface MetaInsightsParams {
  fields: string[];
  date_preset?: string;
  time_range?: { since: string; until: string };
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  breakdowns?: string[];
}

export class MetaAdsAPI {
  private client: AxiosInstance;
  private accessToken: string;
  private apiVersion: string;
  private businessId?: string;

  constructor(config: MetaAPIConfig) {
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || 'v18.0';
    this.businessId = config.businessId;

    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        access_token: this.accessToken,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Meta API Request] ${config.method?.toUpperCase()} ${config.url}`);
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

  // ==================== ACCOUNT OPERATIONS ====================

  async getAdAccounts(): Promise<ApiResponse<MetaAdAccount[]>> {
    try {
      const response = await this.client.get(`/me/adaccounts`, {
        params: {
          fields: 'id,name,account_id,currency,timezone_name,account_status',
        },
      });

      return {
        success: true,
        data: response.data.data.map((account: any) => ({
          id: account.id,
          name: account.name,
          accountId: account.account_id,
          currency: account.currency,
          timezone: account.timezone_name,
        })),
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAdAccount(accountId: string): Promise<ApiResponse<MetaAdAccount>> {
    try {
      const response = await this.client.get(`/${accountId}`, {
        params: {
          fields: 'id,name,account_id,currency,timezone_name,account_status,balance,spend_cap',
        },
      });

      return {
        success: true,
        data: {
          id: response.data.id,
          name: response.data.name,
          accountId: response.data.account_id,
          currency: response.data.currency,
          timezone: response.data.timezone_name,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== CAMPAIGN OPERATIONS ====================

  async getCampaigns(accountId: string): Promise<ApiResponse<Campaign[]>> {
    try {
      const response = await this.client.get(`/${accountId}/campaigns`, {
        params: {
          fields: [
            'id',
            'name',
            'objective',
            'status',
            'effective_status',
            'daily_budget',
            'lifetime_budget',
            'budget_remaining',
            'start_time',
            'stop_time',
            'created_time',
            'updated_time',
            'configured_status',
          ].join(','),
          limit: 100,
        },
      });

      const campaigns = await Promise.all(
        response.data.data.map((c: any) => this.transformMetaCampaign(c, accountId))
      );

      return {
        success: true,
        data: campaigns,
        meta: {
          totalRecords: response.data.data.length,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCampaign(campaignId: string): Promise<ApiResponse<Campaign>> {
    try {
      const response = await this.client.get(`/${campaignId}`, {
        params: {
          fields: [
            'id',
            'name',
            'objective',
            'status',
            'effective_status',
            'daily_budget',
            'lifetime_budget',
            'budget_remaining',
            'start_time',
            'stop_time',
            'created_time',
            'updated_time',
          ].join(','),
        },
      });

      const campaign = await this.transformMetaCampaign(response.data);

      return {
        success: true,
        data: campaign,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCampaign(
    accountId: string,
    campaignData: Partial<Campaign>
  ): Promise<ApiResponse<Campaign>> {
    try {
      const params: MetaCampaignParams = {
        name: campaignData.name || 'New Campaign',
        objective: this.mapObjectiveToMeta(campaignData.objective),
        status: campaignData.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
        special_ad_categories: [],
      };

      if (campaignData.budget?.type === 'daily') {
        params.budget_optimization = true;
      }

      const response = await this.client.post(`/${accountId}/campaigns`, params);

      const campaign = await this.getCampaign(response.data.id);

      return {
        success: true,
        data: campaign.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<ApiResponse<Campaign>> {
    try {
      const params: any = {};

      if (updates.name) params.name = updates.name;
      if (updates.status) params.status = updates.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED';
      if (updates.budget?.amount) {
        if (updates.budget.type === 'daily') {
          params.daily_budget = updates.budget.amount * 100; // Convert to cents
        } else {
          params.lifetime_budget = updates.budget.amount * 100;
        }
      }

      await this.client.post(`/${campaignId}`, params);

      const campaign = await this.getCampaign(campaignId);

      return {
        success: true,
        data: campaign.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCampaign(campaignId: string): Promise<ApiResponse<boolean>> {
    try {
      await this.client.delete(`/${campaignId}`);

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
    try {
      await this.client.post(`/${campaignId}`, {
        status: 'PAUSED',
      });

      const campaign = await this.getCampaign(campaignId);

      return {
        success: true,
        data: campaign.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async activateCampaign(campaignId: string): Promise<ApiResponse<Campaign>> {
    try {
      await this.client.post(`/${campaignId}`, {
        status: 'ACTIVE',
      });

      const campaign = await this.getCampaign(campaignId);

      return {
        success: true,
        data: campaign.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== INSIGHTS & METRICS ====================

  async getCampaignInsights(
    campaignId: string,
    params?: MetaInsightsParams
  ): Promise<ApiResponse<CampaignMetrics>> {
    try {
      const defaultFields = [
        'impressions',
        'clicks',
        'spend',
        'reach',
        'frequency',
        'ctr',
        'cpc',
        'cpm',
        'cpp',
        'actions',
        'action_values',
        'conversions',
        'cost_per_action_type',
      ];

      const response = await this.client.get(`/${campaignId}/insights`, {
        params: {
          fields: params?.fields?.join(',') || defaultFields.join(','),
          date_preset: params?.date_preset || 'last_30d',
          time_range: params?.time_range,
          level: params?.level || 'campaign',
        },
      });

      const insights = response.data.data[0] || {};

      const metrics: CampaignMetrics = {
        impressions: parseInt(insights.impressions || '0'),
        clicks: parseInt(insights.clicks || '0'),
        spend: parseFloat(insights.spend || '0'),
        reach: parseInt(insights.reach || '0'),
        frequency: parseFloat(insights.frequency || '0'),
        ctr: parseFloat(insights.ctr || '0'),
        cpc: parseFloat(insights.cpc || '0'),
        cpm: parseFloat(insights.cpm || '0'),
        conversions: this.extractConversions(insights.actions),
        revenue: this.extractRevenue(insights.action_values),
        cpa: this.calculateCPA(insights),
        roas: this.calculateROAS(insights),
        roi: 0,
        engagements: this.extractEngagements(insights.actions),
        videoViews: this.extractVideoViews(insights.actions),
        videoWatchTime: 0,
        dailyMetrics: [],
      };

      return {
        success: true,
        data: metrics,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDailyInsights(
    campaignId: string,
    dateRange: { since: string; until: string }
  ): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get(`/${campaignId}/insights`, {
        params: {
          fields: 'impressions,clicks,spend,actions,action_values',
          time_range: dateRange,
          time_increment: 1,
          level: 'campaign',
        },
      });

      return {
        success: true,
        data: response.data.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== AUDIENCE MANAGEMENT ====================

  async getCustomAudiences(accountId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get(`/${accountId}/customaudiences`, {
        params: {
          fields: 'id,name,description,approximate_count,delivery_status,operation_status',
        },
      });

      return {
        success: true,
        data: response.data.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCustomAudience(
    accountId: string,
    audienceData: any
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post(`/${accountId}/customaudiences`, {
        name: audienceData.name,
        description: audienceData.description,
        subtype: audienceData.subtype || 'CUSTOM',
        customer_file_source: audienceData.source || 'USER_PROVIDED_ONLY',
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

  // ==================== CREATIVE MANAGEMENT ====================

  async uploadCreative(
    accountId: string,
    creativeData: Partial<Creative>
  ): Promise<ApiResponse<Creative>> {
    try {
      // Upload image/video first
      let assetHash;
      if (creativeData.assets && creativeData.assets.length > 0) {
        assetHash = await this.uploadAsset(accountId, creativeData.assets[0]);
      }

      // Create ad creative
      const response = await this.client.post(`/${accountId}/adcreatives`, {
        name: creativeData.name,
        object_story_spec: {
          page_id: accountId,
          link_data: {
            message: creativeData.description,
            link: creativeData.callToAction,
            name: creativeData.headline,
            image_hash: assetHash,
          },
        },
      });

      return {
        success: true,
        data: response.data as Creative,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async uploadAsset(accountId: string, asset: any): Promise<string> {
    try {
      // This would upload the actual file to Meta
      // For now, return a mock hash
      return 'mock_asset_hash_' + Date.now();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== HELPER METHODS ====================

  private async transformMetaCampaign(metaCampaign: any, accountId?: string): Promise<Campaign> {
    return {
      id: metaCampaign.id,
      name: metaCampaign.name,
      platform: 'META' as const,
      status: this.mapMetaStatus(metaCampaign.status),
      objective: this.mapMetaObjective(metaCampaign.objective),
      budget: {
        type: metaCampaign.daily_budget ? 'daily' : 'lifetime',
        amount: parseFloat(metaCampaign.daily_budget || metaCampaign.lifetime_budget || '0') / 100,
        currency: 'USD',
        spent: 0,
        remaining: parseFloat(metaCampaign.budget_remaining || '0') / 100,
        bidStrategy: {
          type: 'lowest_cost',
        },
      },
      targeting: {} as Targeting,
      schedule: {
        startDate: new Date(metaCampaign.start_time),
        endDate: metaCampaign.stop_time ? new Date(metaCampaign.stop_time) : undefined,
        timezone: 'UTC',
      },
      creatives: [],
      metrics: {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        revenue: 0,
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
          conversionWindow: 7,
          attributionSetting: 'last_click',
        },
        tracking: {
          conversionEvents: [],
          utmParameters: {
            source: 'facebook',
            medium: 'cpc',
            campaign: metaCampaign.name,
          },
        },
        delivery: {
          pacing: 'standard',
        },
      },
      userId: '',
      accountId: accountId || metaCampaign.account_id,
      createdAt: new Date(metaCampaign.created_time),
      updatedAt: new Date(metaCampaign.updated_time),
      lastSyncedAt: new Date(),
    };
  }

  private mapMetaStatus(status: string): any {
    const statusMap: any = {
      ACTIVE: 'ACTIVE',
      PAUSED: 'PAUSED',
      DELETED: 'DELETED',
      ARCHIVED: 'COMPLETED',
    };
    return statusMap[status] || 'DRAFT';
  }

  private mapMetaObjective(objective: string): any {
    const objectiveMap: any = {
      BRAND_AWARENESS: 'AWARENESS',
      REACH: 'AWARENESS',
      LINK_CLICKS: 'TRAFFIC',
      POST_ENGAGEMENT: 'ENGAGEMENT',
      PAGE_LIKES: 'ENGAGEMENT',
      EVENT_RESPONSES: 'ENGAGEMENT',
      CONVERSIONS: 'CONVERSION',
      PRODUCT_CATALOG_SALES: 'SALES',
      LEAD_GENERATION: 'LEAD_GENERATION',
    };
    return objectiveMap[objective] || 'AWARENESS';
  }

  private mapObjectiveToMeta(objective: any): string {
    const objectiveMap: any = {
      AWARENESS: 'BRAND_AWARENESS',
      TRAFFIC: 'LINK_CLICKS',
      ENGAGEMENT: 'POST_ENGAGEMENT',
      CONVERSION: 'CONVERSIONS',
      SALES: 'PRODUCT_CATALOG_SALES',
      LEAD_GENERATION: 'LEAD_GENERATION',
    };
    return objectiveMap[objective] || 'BRAND_AWARENESS';
  }

  private extractConversions(actions: any[]): number {
    if (!actions) return 0;
    const conversionAction = actions.find((a) =>
      ['offsite_conversion', 'omni_purchase'].includes(a.action_type)
    );
    return parseInt(conversionAction?.value || '0');
  }

  private extractRevenue(actionValues: any[]): number {
    if (!actionValues) return 0;
    const revenueAction = actionValues.find((a) =>
      ['offsite_conversion', 'omni_purchase'].includes(a.action_type)
    );
    return parseFloat(revenueAction?.value || '0');
  }

  private extractEngagements(actions: any[]): number {
    if (!actions) return 0;
    const engagementActions = actions.filter((a) =>
      ['post_engagement', 'like', 'comment', 'share'].includes(a.action_type)
    );
    return engagementActions.reduce((sum, a) => sum + parseInt(a.value || '0'), 0);
  }

  private extractVideoViews(actions: any[]): number {
    if (!actions) return 0;
    const videoAction = actions.find((a) => a.action_type === 'video_view');
    return parseInt(videoAction?.value || '0');
  }

  private calculateCPA(insights: any): number {
    const spend = parseFloat(insights.spend || '0');
    const conversions = this.extractConversions(insights.actions);
    return conversions > 0 ? spend / conversions : 0;
  }

  private calculateROAS(insights: any): number {
    const spend = parseFloat(insights.spend || '0');
    const revenue = this.extractRevenue(insights.action_values);
    return spend > 0 ? revenue / spend : 0;
  }

  private handleError(error: any): ApiError {
    const apiError: ApiError = {
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.error?.message || error.message || 'An error occurred',
      details: error.response?.data?.error,
      statusCode: error.response?.status || 500,
    };

    console.error('[Meta API Error]', apiError);
    throw apiError;
  }
}

export default MetaAdsAPI;
