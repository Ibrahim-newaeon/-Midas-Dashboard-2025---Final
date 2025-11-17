import axios, { AxiosInstance } from 'axios';
import {
  AnalyticsData,
  AggregatedMetrics,
  TrendData,
  Insight,
  Comparison,
  Forecast,
  DataPoint,
  Campaign,
  CampaignMetrics,
  DateRange,
  ApiResponse,
  ApiError,
} from '@/types';
import CampaignService from './CampaignService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export class AnalyticsService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/analytics`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ==================== ANALYTICS DATA ====================

  async getAnalyticsData(
    campaignIds: { id: string; platform: any }[],
    dateRange: DateRange
  ): Promise<ApiResponse<AnalyticsData>> {
    try {
      // Fetch campaigns
      const campaignPromises = campaignIds.map(({ id, platform }) =>
        CampaignService.getCampaign(id, platform)
      );
      const campaignResults = await Promise.allSettled(campaignPromises);
      const campaigns = campaignResults
        .filter((r): r is PromiseFulfilledResult<ApiResponse<Campaign>> => r.status === 'fulfilled')
        .map((r) => r.value.data);

      // Calculate aggregated metrics
      const totalMetrics = await this.calculateAggregatedMetrics(campaigns);

      // Generate trends
      const trends = await this.generateTrends(campaigns, dateRange);

      // Generate insights
      const insights = await this.generateInsights(campaigns);

      // Generate comparisons
      const comparisons = await this.generateComparisons(campaigns, dateRange);

      // Generate forecasts
      const forecasts = await this.generateForecasts(campaigns, dateRange);

      const analyticsData: AnalyticsData = {
        campaigns,
        totalMetrics,
        trends,
        insights,
        comparisons,
        forecasts,
      };

      return {
        success: true,
        data: analyticsData,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==================== AGGREGATED METRICS ====================

  private async calculateAggregatedMetrics(campaigns: Campaign[]): Promise<AggregatedMetrics> {
    let totalSpend = 0;
    let totalRevenue = 0;
    let totalConversions = 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    campaigns.forEach((campaign) => {
      const metrics = campaign.metrics;
      totalSpend += metrics.spend;
      totalRevenue += metrics.revenue;
      totalConversions += metrics.conversions;
      totalImpressions += metrics.impressions;
      totalClicks += metrics.clicks;
    });

    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const averageROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

    return {
      totalSpend,
      totalRevenue,
      totalConversions,
      totalImpressions,
      totalClicks,
      averageCTR: parseFloat(averageCTR.toFixed(2)),
      averageCPC: parseFloat(averageCPC.toFixed(2)),
      averageROAS: parseFloat(averageROAS.toFixed(2)),
      averageROI: parseFloat(averageROI.toFixed(2)),
    };
  }

  // ==================== TRENDS ====================

  private async generateTrends(campaigns: Campaign[], dateRange: DateRange): Promise<TrendData[]> {
    const metrics = ['impressions', 'clicks', 'spend', 'conversions', 'revenue'];
    const trends: TrendData[] = [];

    for (const metric of metrics) {
      const data = this.aggregateDailyMetrics(campaigns, metric);
      const change = this.calculateChange(data);

      trends.push({
        metric,
        period: 'daily',
        data,
        change: change.absolute,
        changePercent: change.percent,
      });
    }

    return trends;
  }

  private aggregateDailyMetrics(campaigns: Campaign[], metric: string): DataPoint[] {
    const dataMap = new Map<string, number>();

    campaigns.forEach((campaign) => {
      campaign.metrics.dailyMetrics.forEach((daily) => {
        const existing = dataMap.get(daily.date) || 0;
        dataMap.set(daily.date, existing + (daily as any)[metric] || 0);
      });
    });

    return Array.from(dataMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
  }

  private calculateChange(data: DataPoint[]): { absolute: number; percent: number } {
    if (data.length < 2) {
      return { absolute: 0, percent: 0 };
    }

    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    const absolute = latest - previous;
    const percent = previous !== 0 ? (absolute / previous) * 100 : 0;

    return {
      absolute: parseFloat(absolute.toFixed(2)),
      percent: parseFloat(percent.toFixed(2)),
    };
  }

  // ==================== INSIGHTS ====================

  private async generateInsights(campaigns: Campaign[]): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Performance insights
    campaigns.forEach((campaign) => {
      const metrics = campaign.metrics;

      // High ROAS insight
      if (metrics.roas > 3) {
        insights.push({
          id: `insight_${campaign.id}_roas`,
          type: 'positive',
          category: 'performance',
          title: 'Excellent ROAS',
          description: `Campaign "${campaign.name}" has a ROAS of ${metrics.roas.toFixed(2)}x, significantly above the industry average.`,
          recommendation: 'Consider increasing budget to scale this high-performing campaign.',
          impact: 'high',
          campaignId: campaign.id,
          createdAt: new Date(),
        });
      }

      // Low CTR insight
      if (metrics.ctr < 1 && metrics.impressions > 1000) {
        insights.push({
          id: `insight_${campaign.id}_ctr`,
          type: 'negative',
          category: 'performance',
          title: 'Low Click-Through Rate',
          description: `Campaign "${campaign.name}" has a CTR of ${metrics.ctr.toFixed(2)}%, below the industry average.`,
          recommendation: 'Review ad creative and targeting to improve engagement.',
          impact: 'medium',
          campaignId: campaign.id,
          createdAt: new Date(),
        });
      }

      // Budget utilization insight
      if (campaign.budget.remaining < campaign.budget.amount * 0.1) {
        insights.push({
          id: `insight_${campaign.id}_budget`,
          type: 'neutral',
          category: 'budget',
          title: 'Budget Nearly Depleted',
          description: `Campaign "${campaign.name}" has less than 10% budget remaining.`,
          recommendation: 'Consider increasing budget or pausing campaign to avoid unexpected costs.',
          impact: 'high',
          campaignId: campaign.id,
          createdAt: new Date(),
        });
      }

      // Conversion rate insight
      const conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
      if (conversionRate > 5) {
        insights.push({
          id: `insight_${campaign.id}_conversion`,
          type: 'positive',
          category: 'performance',
          title: 'High Conversion Rate',
          description: `Campaign "${campaign.name}" has a conversion rate of ${conversionRate.toFixed(2)}%, indicating excellent targeting.`,
          recommendation: 'Use this campaign as a template for future campaigns.',
          impact: 'medium',
          campaignId: campaign.id,
          createdAt: new Date(),
        });
      }
    });

    return insights;
  }

  // ==================== COMPARISONS ====================

  private async generateComparisons(campaigns: Campaign[], dateRange: DateRange): Promise<Comparison[]> {
    if (campaigns.length < 2) {
      return [];
    }

    const metrics = ['spend', 'revenue', 'conversions', 'ctr', 'roas'];
    const comparisons: Comparison[] = [];

    metrics.forEach((metric) => {
      const values: { [campaignId: string]: number } = {};

      campaigns.forEach((campaign) => {
        values[campaign.id] = (campaign.metrics as any)[metric] || 0;
      });

      comparisons.push({
        id: `comparison_${metric}`,
        name: `${metric.charAt(0).toUpperCase() + metric.slice(1)} Comparison`,
        campaigns: campaigns.map((c) => c.id),
        metrics: [{ metric, values }],
        period: dateRange,
      });
    });

    return comparisons;
  }

  // ==================== FORECASTING ====================

  private async generateForecasts(campaigns: Campaign[], dateRange: DateRange): Promise<Forecast[]> {
    const forecasts: Forecast[] = [];

    // Simple linear regression forecast for spend and revenue
    ['spend', 'revenue'].forEach((metric) => {
      const historicalData = this.aggregateDailyMetrics(campaigns, metric);

      if (historicalData.length >= 7) {
        const predicted = this.linearForecast(historicalData, 7); // Forecast next 7 days

        forecasts.push({
          metric,
          period: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          predicted,
          confidence: 0.75,
          method: 'linear_regression',
        });
      }
    });

    return forecasts;
  }

  private linearForecast(data: DataPoint[], days: number): DataPoint[] {
    // Calculate linear regression
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    data.forEach((point, index) => {
      sumX += index;
      sumY += point.value;
      sumXY += index * point.value;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    const predicted: DataPoint[] = [];
    const lastDate = new Date(data[data.length - 1].label);

    for (let i = 1; i <= days; i++) {
      const value = slope * (n + i - 1) + intercept;
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i);

      predicted.push({
        label: date.toISOString().split('T')[0],
        value: Math.max(0, value),
        timestamp: date,
      });
    }

    return predicted;
  }

  // ==================== REPORTING ====================

  async generateReport(
    campaignIds: { id: string; platform: any }[],
    dateRange: DateRange,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<ApiResponse<any>> {
    try {
      const analyticsData = await this.getAnalyticsData(campaignIds, dateRange);

      if (format === 'json') {
        return analyticsData;
      }

      // Generate report in requested format
      const report = await this.formatReport(analyticsData.data, format);

      return {
        success: true,
        data: report,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async formatReport(data: AnalyticsData, format: 'csv' | 'pdf'): Promise<string | Blob> {
    if (format === 'csv') {
      return this.generateCSVReport(data);
    }

    // For PDF, would use a library like jsPDF
    return 'PDF generation not implemented';
  }

  private generateCSVReport(data: AnalyticsData): string {
    const rows: string[][] = [];

    // Header
    rows.push(['Campaign Analytics Report']);
    rows.push([]);

    // Summary metrics
    rows.push(['Summary Metrics']);
    rows.push(['Total Spend', data.totalMetrics.totalSpend.toString()]);
    rows.push(['Total Revenue', data.totalMetrics.totalRevenue.toString()]);
    rows.push(['Total Conversions', data.totalMetrics.totalConversions.toString()]);
    rows.push(['Average ROAS', data.totalMetrics.averageROAS.toString()]);
    rows.push([]);

    // Campaign details
    rows.push(['Campaign Details']);
    rows.push(['Name', 'Platform', 'Status', 'Spend', 'Revenue', 'ROAS']);

    data.campaigns.forEach((campaign) => {
      rows.push([
        campaign.name,
        campaign.platform,
        campaign.status,
        campaign.metrics.spend.toString(),
        campaign.metrics.revenue.toString(),
        campaign.metrics.roas.toString(),
      ]);
    });

    // Convert to CSV string
    return rows.map((row) => row.join(',')).join('\n');
  }

  // ==================== BENCHMARKING ====================

  async getBenchmarks(platform: string, objective: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/benchmarks', {
        params: { platform, objective },
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
      code: error.response?.data?.code || 'ANALYTICS_ERROR',
      message: error.response?.data?.message || error.message || 'Analytics operation failed',
      details: error.response?.data,
      statusCode: error.response?.status || 500,
    };

    console.error('[Analytics Service Error]', apiError);
    throw apiError;
  }
}

export default new AnalyticsService();
