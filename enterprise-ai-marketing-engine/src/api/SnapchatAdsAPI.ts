import axios, { AxiosInstance } from 'axios';
import {
  Campaign,
  CampaignMetrics,
  SnapchatAdAccount,
  ApiResponse,
  ApiError,
} from '@/types';

interface SnapchatAPIConfig {
  accessToken: string;
  clientId: string;
  clientSecret: string;
  adAccountId: string;
}

export class SnapchatAdsAPI {
  private client: AxiosInstance;
  private accessToken: string;
  private adAccountId: string;

  constructor(config: SnapchatAPIConfig) {
    this.accessToken = config.accessToken;
    this.adAccountId = config.adAccountId;

    this.client = axios.create({
      baseURL: 'https://adsapi.snapchat.com/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Snapchat API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  // ==================== ACCOUNT OPERATIONS ====================

  async getAdAccount(): Promise<ApiResponse<SnapchatAdAccount>> {
    try {
      const response = await this.client.get(`/adaccounts/${this.adAccountId}`);

      const account = response.data.adaccount;

      return {
        success: true,
        data: {
          id: account.id,
          name: account.name,
          type: account.type,
          status: account.status,
          currency: account.currency,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getOrganizations(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/me/organizations');

      return {
        success: true,
        data: response.data.organizations || [],
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== CAMPAIGN OPERATIONS ====================

  async getCampaigns(): Promise<ApiResponse<Campaign[]>> {
    try {
      const response = await this.client.get(`/adaccounts/${this.adAccountId}/campaigns`);

      const campaigns = response.data.campaigns.map((c: any) =>
        this.transformSnapchatCampaign(c.campaign)
      );

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
      const response = await this.client.get(`/campaigns/${campaignId}`);

      const campaign = this.transformSnapchatCampaign(response.data.campaign);

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
      const payload = {
        campaigns: [
          {
            name: campaignData.name,
            ad_account_id: this.adAccountId,
            status: campaignData.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
            objective: this.mapObjectiveToSnapchat(campaignData.objective),
            daily_budget_micro: campaignData.budget?.amount
              ? campaignData.budget.amount * 1000000
              : undefined,
            lifetime_spend_cap_micro: campaignData.budget?.type === 'lifetime'
              ? campaignData.budget.amount * 1000000
              : undefined,
            start_time: campaignData.schedule?.startDate?.toISOString(),
            end_time: campaignData.schedule?.endDate?.toISOString(),
          },
        ],
      };

      const response = await this.client.post(`/adaccounts/${this.adAccountId}/campaigns`, payload);

      const campaignId = response.data.campaigns[0].campaign.id;

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
      const payload: any = {
        campaigns: [
          {
            id: campaignId,
          },
        ],
      };

      if (updates.name) {
        payload.campaigns[0].name = updates.name;
      }

      if (updates.status) {
        payload.campaigns[0].status = updates.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED';
      }

      if (updates.budget) {
        if (updates.budget.type === 'daily') {
          payload.campaigns[0].daily_budget_micro = updates.budget.amount * 1000000;
        } else {
          payload.campaigns[0].lifetime_spend_cap_micro = updates.budget.amount * 1000000;
        }
      }

      await this.client.put(`/campaigns/${campaignId}`, payload);

      return await this.getCampaign(campaignId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCampaign(campaignId: string): Promise<ApiResponse<boolean>> {
    try {
      await this.client.delete(`/campaigns/${campaignId}`);

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

  // ==================== AD SQUAD OPERATIONS ====================

  async getAdSquads(campaignId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get(`/campaigns/${campaignId}/adsquads`);

      return {
        success: true,
        data: response.data.adsquads || [],
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAdSquad(campaignId: string, adSquadData: any): Promise<ApiResponse<any>> {
    try {
      const payload = {
        adsquads: [
          {
            name: adSquadData.name,
            campaign_id: campaignId,
            status: 'ACTIVE',
            type: 'SNAP_ADS',
            targeting: {
              geos: adSquadData.geos || [],
              demographics: adSquadData.demographics || [],
            },
            placement_v2: {
              config: 'AUTOMATIC',
            },
            billing_event: 'IMPRESSION',
            bid_micro: adSquadData.bid * 1000000,
            daily_budget_micro: adSquadData.dailyBudget * 1000000,
            start_time: new Date().toISOString(),
            optimization_goal: 'IMPRESSIONS',
          },
        ],
      };

      const response = await this.client.post(`/campaigns/${campaignId}/adsquads`, payload);

      return {
        success: true,
        data: response.data.adsquads[0],
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== CREATIVE OPERATIONS ====================

  async uploadMedia(mediaFile: File, type: 'IMAGE' | 'VIDEO'): Promise<ApiResponse<string>> {
    try {
      const formData = new FormData();
      formData.append('media', mediaFile);
      formData.append('ad_account_id', this.adAccountId);
      formData.append('type', type);

      const response = await this.client.post(`/adaccounts/${this.adAccountId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.media.id,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCreative(creativeData: any): Promise<ApiResponse<any>> {
    try {
      const payload = {
        creatives: [
          {
            name: creativeData.name,
            ad_account_id: this.adAccountId,
            type: creativeData.type || 'SNAP_AD',
            brand_name: creativeData.brandName,
            headline: creativeData.headline,
            shareable: true,
            top_snap_media_id: creativeData.mediaId,
            call_to_action: creativeData.callToAction || 'WATCH',
            web_view_url: creativeData.url,
          },
        ],
      };

      const response = await this.client.post(`/adaccounts/${this.adAccountId}/creatives`, payload);

      return {
        success: true,
        data: response.data.creatives[0],
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAd(adSquadId: string, creativeId: string, adData: any): Promise<ApiResponse<any>> {
    try {
      const payload = {
        ads: [
          {
            name: adData.name,
            ad_squad_id: adSquadId,
            creative_id: creativeId,
            status: 'ACTIVE',
            type: 'SNAP_AD',
          },
        ],
      };

      const response = await this.client.post(`/adsquads/${adSquadId}/ads`, payload);

      return {
        success: true,
        data: response.data.ads[0],
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== AUDIENCE OPERATIONS ====================

  async getAudiences(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get(`/adaccounts/${this.adAccountId}/segments`);

      return {
        success: true,
        data: response.data.segments || [],
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAudience(audienceData: any): Promise<ApiResponse<any>> {
    try {
      const payload = {
        segments: [
          {
            name: audienceData.name,
            ad_account_id: this.adAccountId,
            description: audienceData.description,
            source_type: audienceData.sourceType || 'FIRST_PARTY',
            retention_in_days: audienceData.retentionDays || 180,
          },
        ],
      };

      const response = await this.client.post(`/adaccounts/${this.adAccountId}/segments`, payload);

      return {
        success: true,
        data: response.data.segments[0],
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== REPORTING ====================

  async getCampaignStats(
    campaignId: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<ApiResponse<CampaignMetrics>> {
    try {
      const params: any = {
        granularity: 'TOTAL',
        fields: 'impressions,swipes,spend,conversion_purchases,conversion_purchases_value',
      };

      if (dateRange) {
        params.start_time = dateRange.startDate;
        params.end_time = dateRange.endDate;
      }

      const response = await this.client.get(`/campaigns/${campaignId}/stats`, { params });

      const stats = response.data.total_stats[0]?.total_stat || {};

      const campaignMetrics: CampaignMetrics = {
        impressions: parseInt(stats.impressions || '0'),
        clicks: parseInt(stats.swipes || '0'), // Snapchat uses "swipes" instead of clicks
        spend: parseFloat(stats.spend || '0') / 1000000,
        conversions: parseInt(stats.conversion_purchases || '0'),
        revenue: parseFloat(stats.conversion_purchases_value || '0') / 1000000,
        ctr: stats.impressions > 0 ? (stats.swipes / stats.impressions) * 100 : 0,
        cpc: stats.swipes > 0 ? parseFloat(stats.spend || '0') / 1000000 / stats.swipes : 0,
        cpm: stats.impressions > 0 ? (parseFloat(stats.spend || '0') / 1000000 / stats.impressions) * 1000 : 0,
        cpa: stats.conversion_purchases > 0 ? parseFloat(stats.spend || '0') / 1000000 / stats.conversion_purchases : 0,
        roas: parseFloat(stats.spend || '0') > 0 ? (parseFloat(stats.conversion_purchases_value || '0') / parseFloat(stats.spend || '0')) : 0,
        roi: 0,
        reach: 0,
        frequency: 0,
        engagements: parseInt(stats.swipes || '0'),
        videoViews: parseInt(stats.video_views || '0'),
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

  async getDailyStats(
    campaignId: string,
    dateRange: { startDate: string; endDate: string }
  ): Promise<ApiResponse<any[]>> {
    try {
      const params = {
        granularity: 'DAY',
        fields: 'impressions,swipes,spend,conversion_purchases,conversion_purchases_value',
        start_time: dateRange.startDate,
        end_time: dateRange.endDate,
      };

      const response = await this.client.get(`/campaigns/${campaignId}/stats`, { params });

      const dailyData = response.data.timeseries_stats.map((item: any) => ({
        date: item.start_time.split('T')[0],
        impressions: parseInt(item.stats.impressions || '0'),
        clicks: parseInt(item.stats.swipes || '0'),
        spend: parseFloat(item.stats.spend || '0') / 1000000,
        conversions: parseInt(item.stats.conversion_purchases || '0'),
        revenue: parseFloat(item.stats.conversion_purchases_value || '0') / 1000000,
      }));

      return {
        success: true,
        data: dailyData,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== HELPER METHODS ====================

  private transformSnapchatCampaign(snapCampaign: any): Campaign {
    return {
      id: snapCampaign.id,
      name: snapCampaign.name,
      platform: 'SNAPCHAT' as const,
      status: this.mapSnapchatStatus(snapCampaign.status),
      objective: this.mapSnapchatObjective(snapCampaign.objective),
      budget: {
        type: snapCampaign.daily_budget_micro ? 'daily' : 'lifetime',
        amount: snapCampaign.daily_budget_micro
          ? snapCampaign.daily_budget_micro / 1000000
          : snapCampaign.lifetime_spend_cap_micro / 1000000,
        currency: 'USD',
        spent: 0,
        remaining: 0,
        bidStrategy: {
          type: 'lowest_cost',
        },
      },
      targeting: {} as any,
      schedule: {
        startDate: new Date(snapCampaign.start_time),
        endDate: snapCampaign.end_time ? new Date(snapCampaign.end_time) : undefined,
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
          conversionWindow: 28,
          attributionSetting: 'last_click',
        },
        tracking: {
          conversionEvents: [],
          utmParameters: {
            source: 'snapchat',
            medium: 'cpc',
            campaign: snapCampaign.name,
          },
        },
        delivery: {
          pacing: 'standard',
        },
      },
      userId: '',
      accountId: this.adAccountId,
      createdAt: new Date(snapCampaign.created_at),
      updatedAt: new Date(snapCampaign.updated_at),
      lastSyncedAt: new Date(),
    };
  }

  private mapSnapchatStatus(status: string): any {
    const statusMap: any = {
      ACTIVE: 'ACTIVE',
      PAUSED: 'PAUSED',
      DELETED: 'DELETED',
    };
    return statusMap[status] || 'DRAFT';
  }

  private mapSnapchatObjective(objective: string): any {
    const objectiveMap: any = {
      AWARENESS: 'AWARENESS',
      TRAFFIC: 'TRAFFIC',
      VIDEO_VIEWS: 'ENGAGEMENT',
      LEAD_GENERATION: 'LEAD_GENERATION',
      CONVERSIONS: 'CONVERSION',
      APP_INSTALLS: 'CONVERSION',
      CATALOG_SALES: 'SALES',
    };
    return objectiveMap[objective] || 'AWARENESS';
  }

  private mapObjectiveToSnapchat(objective: any): string {
    const objectiveMap: any = {
      AWARENESS: 'AWARENESS',
      TRAFFIC: 'TRAFFIC',
      ENGAGEMENT: 'VIDEO_VIEWS',
      LEAD_GENERATION: 'LEAD_GENERATION',
      CONVERSION: 'CONVERSIONS',
      SALES: 'CATALOG_SALES',
    };
    return objectiveMap[objective] || 'AWARENESS';
  }

  private handleError(error: any): ApiError {
    const apiError: ApiError = {
      code: error.response?.data?.request_status || 'UNKNOWN_ERROR',
      message: error.response?.data?.error_message || error.message || 'An error occurred',
      details: error.response?.data,
      statusCode: error.response?.status || 500,
    };

    console.error('[Snapchat API Error]', apiError);
    throw apiError;
  }
}

export default SnapchatAdsAPI;
