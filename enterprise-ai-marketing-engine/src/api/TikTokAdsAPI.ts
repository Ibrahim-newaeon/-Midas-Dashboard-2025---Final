import axios, { AxiosInstance } from 'axios';
import {
  Campaign,
  CampaignMetrics,
  TikTokAdvertiser,
  ApiResponse,
  ApiError,
  Creative,
} from '@/types';

interface TikTokAPIConfig {
  accessToken: string;
  appId: string;
  appSecret: string;
  advertiserId: string;
}

export class TikTokAdsAPI {
  private client: AxiosInstance;
  private accessToken: string;
  private advertiserId: string;

  constructor(config: TikTokAPIConfig) {
    this.accessToken = config.accessToken;
    this.advertiserId = config.advertiserId;

    this.client = axios.create({
      baseURL: 'https://business-api.tiktok.com/open_api/v1.3',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': this.accessToken,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[TikTok API Request] ${config.method?.toUpperCase()} ${config.url}`);
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

  // ==================== ADVERTISER OPERATIONS ====================

  async getAdvertiser(): Promise<ApiResponse<TikTokAdvertiser>> {
    try {
      const response = await this.client.get('/advertiser/info/', {
        params: {
          advertiser_id: this.advertiserId,
          fields: ['name', 'currency', 'timezone'],
        },
      });

      const data = response.data.data;

      return {
        success: true,
        data: {
          advertiserId: data.advertiser_id,
          advertiserName: data.name,
          currency: data.currency,
          timezone: data.timezone,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== CAMPAIGN OPERATIONS ====================

  async getCampaigns(): Promise<ApiResponse<Campaign[]>> {
    try {
      const response = await this.client.get('/campaign/get/', {
        params: {
          advertiser_id: this.advertiserId,
          fields: [
            'campaign_id',
            'campaign_name',
            'objective_type',
            'status',
            'budget',
            'budget_mode',
            'create_time',
            'modify_time',
          ],
        },
      });

      const campaigns = response.data.data.list.map((c: any) =>
        this.transformTikTokCampaign(c)
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
      const response = await this.client.get('/campaign/get/', {
        params: {
          advertiser_id: this.advertiserId,
          campaign_ids: [campaignId],
          fields: [
            'campaign_id',
            'campaign_name',
            'objective_type',
            'status',
            'budget',
            'budget_mode',
            'create_time',
            'modify_time',
          ],
        },
      });

      const campaign = this.transformTikTokCampaign(response.data.data.list[0]);

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
        advertiser_id: this.advertiserId,
        campaign_name: campaignData.name,
        objective_type: this.mapObjectiveToTikTok(campaignData.objective),
        budget_mode: campaignData.budget?.type === 'daily' ? 'BUDGET_MODE_DAY' : 'BUDGET_MODE_TOTAL',
        budget: campaignData.budget?.amount || 0,
        status: campaignData.status === 'ACTIVE' ? 'ENABLE' : 'DISABLE',
      };

      const response = await this.client.post('/campaign/create/', payload);

      const campaignId = response.data.data.campaign_id;

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
        advertiser_id: this.advertiserId,
        campaign_id: campaignId,
      };

      if (updates.name) {
        payload.campaign_name = updates.name;
      }

      if (updates.status) {
        payload.status = updates.status === 'ACTIVE' ? 'ENABLE' : 'DISABLE';
      }

      if (updates.budget) {
        payload.budget = updates.budget.amount;
        payload.budget_mode = updates.budget.type === 'daily' ? 'BUDGET_MODE_DAY' : 'BUDGET_MODE_TOTAL';
      }

      await this.client.post('/campaign/update/', payload);

      return await this.getCampaign(campaignId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCampaign(campaignId: string): Promise<ApiResponse<boolean>> {
    try {
      await this.client.post('/campaign/update/', {
        advertiser_id: this.advertiserId,
        campaign_id: campaignId,
        status: 'DELETE',
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

  // ==================== AD GROUP OPERATIONS ====================

  async createAdGroup(campaignId: string, adGroupData: any): Promise<ApiResponse<any>> {
    try {
      const payload = {
        advertiser_id: this.advertiserId,
        campaign_id: campaignId,
        adgroup_name: adGroupData.name,
        placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
        location_ids: adGroupData.locations || [],
        languages: adGroupData.languages || ['en'],
        gender: adGroupData.gender || 'GENDER_UNLIMITED',
        age_groups: adGroupData.ageGroups || [],
        budget: adGroupData.budget || 0,
        schedule_type: 'SCHEDULE_FROM_NOW',
        billing_event: 'CPC',
        bid_type: 'BID_TYPE_NO_BID',
        optimization_goal: 'CLICK',
      };

      const response = await this.client.post('/adgroup/create/', payload);

      return {
        success: true,
        data: response.data.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== CREATIVE OPERATIONS ====================

  async uploadVideo(videoFile: File): Promise<ApiResponse<string>> {
    try {
      const formData = new FormData();
      formData.append('advertiser_id', this.advertiserId);
      formData.append('video_file', videoFile);
      formData.append('upload_type', 'UPLOAD_BY_FILE');

      const response = await this.client.post('/file/video/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.data.video_id,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadImage(imageFile: File): Promise<ApiResponse<string>> {
    try {
      const formData = new FormData();
      formData.append('advertiser_id', this.advertiserId);
      formData.append('image_file', imageFile);
      formData.append('upload_type', 'UPLOAD_BY_FILE');

      const response = await this.client.post('/file/image/ad/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.data.image_id,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAd(adGroupId: string, adData: any): Promise<ApiResponse<any>> {
    try {
      const payload = {
        advertiser_id: this.advertiserId,
        adgroup_id: adGroupId,
        creatives: [
          {
            ad_name: adData.name,
            ad_text: adData.text,
            landing_page_url: adData.landingPageUrl,
            call_to_action: adData.callToAction || 'LEARN_MORE',
            video_id: adData.videoId,
            image_ids: adData.imageIds || [],
          },
        ],
      };

      const response = await this.client.post('/ad/create/', payload);

      return {
        success: true,
        data: response.data.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== AUDIENCE OPERATIONS ====================

  async getAudiences(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.client.get('/dmp/custom_audience/list/', {
        params: {
          advertiser_id: this.advertiserId,
        },
      });

      return {
        success: true,
        data: response.data.data.list || [],
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCustomAudience(audienceData: any): Promise<ApiResponse<any>> {
    try {
      const payload = {
        advertiser_id: this.advertiserId,
        custom_audience_name: audienceData.name,
        audience_type: audienceData.type || 'CUSTOMER_FILE',
        file_paths: audienceData.filePaths || [],
      };

      const response = await this.client.post('/dmp/custom_audience/create/', payload);

      return {
        success: true,
        data: response.data.data,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== REPORTING ====================

  async getCampaignMetrics(
    campaignId: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<ApiResponse<CampaignMetrics>> {
    try {
      const params: any = {
        advertiser_id: this.advertiserId,
        service_type: 'AUCTION',
        report_type: 'BASIC',
        data_level: 'AUCTION_CAMPAIGN',
        dimensions: ['campaign_id'],
        filters: [
          {
            field_name: 'campaign_id',
            filter_type: 'IN',
            filter_value: [campaignId],
          },
        ],
        metrics: [
          'impressions',
          'clicks',
          'spend',
          'reach',
          'conversion',
          'cost_per_conversion',
          'ctr',
          'cpc',
          'cpm',
          'video_views',
          'video_watched_2s',
          'video_watched_6s',
        ],
        page: 1,
        page_size: 1,
      };

      if (dateRange) {
        params.start_date = dateRange.startDate;
        params.end_date = dateRange.endDate;
      }

      const response = await this.client.get('/report/integrated/get/', {
        params,
      });

      const data = response.data.data.list[0] || {};
      const metrics = data.metrics || {};

      const campaignMetrics: CampaignMetrics = {
        impressions: parseInt(metrics.impressions || '0'),
        clicks: parseInt(metrics.clicks || '0'),
        spend: parseFloat(metrics.spend || '0'),
        reach: parseInt(metrics.reach || '0'),
        conversions: parseInt(metrics.conversion || '0'),
        revenue: 0,
        ctr: parseFloat(metrics.ctr || '0'),
        cpc: parseFloat(metrics.cpc || '0'),
        cpm: parseFloat(metrics.cpm || '0'),
        cpa: parseFloat(metrics.cost_per_conversion || '0'),
        roas: 0,
        roi: 0,
        frequency: 0,
        engagements: 0,
        videoViews: parseInt(metrics.video_views || '0'),
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

  async getDailyMetrics(
    campaignId: string,
    dateRange: { startDate: string; endDate: string }
  ): Promise<ApiResponse<any[]>> {
    try {
      const params = {
        advertiser_id: this.advertiserId,
        service_type: 'AUCTION',
        report_type: 'BASIC',
        data_level: 'AUCTION_CAMPAIGN',
        dimensions: ['campaign_id', 'stat_time_day'],
        filters: [
          {
            field_name: 'campaign_id',
            filter_type: 'IN',
            filter_value: [campaignId],
          },
        ],
        metrics: ['impressions', 'clicks', 'spend', 'conversion'],
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        page: 1,
        page_size: 100,
      };

      const response = await this.client.get('/report/integrated/get/', {
        params,
      });

      const dailyData = response.data.data.list.map((item: any) => ({
        date: item.dimensions.stat_time_day,
        impressions: parseInt(item.metrics.impressions || '0'),
        clicks: parseInt(item.metrics.clicks || '0'),
        spend: parseFloat(item.metrics.spend || '0'),
        conversions: parseInt(item.metrics.conversion || '0'),
        revenue: 0,
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

  private transformTikTokCampaign(tiktokCampaign: any): Campaign {
    return {
      id: tiktokCampaign.campaign_id,
      name: tiktokCampaign.campaign_name,
      platform: 'TIKTOK' as const,
      status: this.mapTikTokStatus(tiktokCampaign.status),
      objective: this.mapTikTokObjective(tiktokCampaign.objective_type),
      budget: {
        type: tiktokCampaign.budget_mode === 'BUDGET_MODE_DAY' ? 'daily' : 'lifetime',
        amount: tiktokCampaign.budget || 0,
        currency: 'USD',
        spent: 0,
        remaining: 0,
        bidStrategy: {
          type: 'lowest_cost',
        },
      },
      targeting: {} as any,
      schedule: {
        startDate: new Date(tiktokCampaign.create_time * 1000),
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
            source: 'tiktok',
            medium: 'cpc',
            campaign: tiktokCampaign.campaign_name,
          },
        },
        delivery: {
          pacing: 'standard',
        },
      },
      userId: '',
      accountId: this.advertiserId,
      createdAt: new Date(tiktokCampaign.create_time * 1000),
      updatedAt: new Date(tiktokCampaign.modify_time * 1000),
      lastSyncedAt: new Date(),
    };
  }

  private mapTikTokStatus(status: string): any {
    const statusMap: any = {
      ENABLE: 'ACTIVE',
      DISABLE: 'PAUSED',
      DELETE: 'DELETED',
    };
    return statusMap[status] || 'DRAFT';
  }

  private mapTikTokObjective(objective: string): any {
    const objectiveMap: any = {
      REACH: 'AWARENESS',
      TRAFFIC: 'TRAFFIC',
      VIDEO_VIEWS: 'ENGAGEMENT',
      LEAD_GENERATION: 'LEAD_GENERATION',
      CONVERSIONS: 'CONVERSION',
      PRODUCT_SALES: 'SALES',
      APP_INSTALL: 'CONVERSION',
    };
    return objectiveMap[objective] || 'AWARENESS';
  }

  private mapObjectiveToTikTok(objective: any): string {
    const objectiveMap: any = {
      AWARENESS: 'REACH',
      TRAFFIC: 'TRAFFIC',
      ENGAGEMENT: 'VIDEO_VIEWS',
      LEAD_GENERATION: 'LEAD_GENERATION',
      CONVERSION: 'CONVERSIONS',
      SALES: 'PRODUCT_SALES',
    };
    return objectiveMap[objective] || 'REACH';
  }

  private handleError(error: any): ApiError {
    const apiError: ApiError = {
      code: error.response?.data?.code?.toString() || 'UNKNOWN_ERROR',
      message: error.response?.data?.message || error.message || 'An error occurred',
      details: error.response?.data,
      statusCode: error.response?.status || 500,
    };

    console.error('[TikTok API Error]', apiError);
    throw apiError;
  }
}

export default TikTokAdsAPI;
