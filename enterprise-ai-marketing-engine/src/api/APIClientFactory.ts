import MetaAdsAPI from './MetaAdsAPI';
import GoogleAdsAPI from './GoogleAdsAPI';
import TikTokAdsAPI from './TikTokAdsAPI';
import SnapchatAdsAPI from './SnapchatAdsAPI';
import { Platform, PlatformCredentials } from '@/types';

export class APIClientFactory {
  private static instances: Map<string, any> = new Map();

  static getMetaClient(credentials: PlatformCredentials): MetaAdsAPI {
    const key = `meta_${credentials.accountId}`;

    if (!this.instances.has(key)) {
      this.instances.set(
        key,
        new MetaAdsAPI({
          accessToken: credentials.accessToken,
          apiVersion: import.meta.env.VITE_META_API_VERSION || 'v18.0',
          businessId: import.meta.env.VITE_META_BUSINESS_ID,
        })
      );
    }

    return this.instances.get(key);
  }

  static getGoogleClient(credentials: PlatformCredentials): GoogleAdsAPI {
    const key = `google_${credentials.accountId}`;

    if (!this.instances.has(key)) {
      this.instances.set(
        key,
        new GoogleAdsAPI({
          clientId: import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID,
          clientSecret: import.meta.env.VITE_GOOGLE_ADS_CLIENT_SECRET,
          developerToken: import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN,
          refreshToken: credentials.refreshToken || import.meta.env.VITE_GOOGLE_ADS_REFRESH_TOKEN,
          customerId: credentials.accountId,
          loginCustomerId: import.meta.env.VITE_GOOGLE_ADS_LOGIN_CUSTOMER_ID,
        })
      );
    }

    return this.instances.get(key);
  }

  static getTikTokClient(credentials: PlatformCredentials): TikTokAdsAPI {
    const key = `tiktok_${credentials.accountId}`;

    if (!this.instances.has(key)) {
      this.instances.set(
        key,
        new TikTokAdsAPI({
          accessToken: credentials.accessToken,
          appId: import.meta.env.VITE_TIKTOK_APP_ID,
          appSecret: import.meta.env.VITE_TIKTOK_APP_SECRET,
          advertiserId: credentials.accountId,
        })
      );
    }

    return this.instances.get(key);
  }

  static getSnapchatClient(credentials: PlatformCredentials): SnapchatAdsAPI {
    const key = `snapchat_${credentials.accountId}`;

    if (!this.instances.has(key)) {
      this.instances.set(
        key,
        new SnapchatAdsAPI({
          accessToken: credentials.accessToken,
          clientId: import.meta.env.VITE_SNAPCHAT_CLIENT_ID,
          clientSecret: import.meta.env.VITE_SNAPCHAT_CLIENT_SECRET,
          adAccountId: credentials.accountId,
        })
      );
    }

    return this.instances.get(key);
  }

  static getClient(platform: Platform, credentials: PlatformCredentials): any {
    switch (platform) {
      case Platform.META:
        return this.getMetaClient(credentials);
      case Platform.GOOGLE:
        return this.getGoogleClient(credentials);
      case Platform.TIKTOK:
        return this.getTikTokClient(credentials);
      case Platform.SNAPCHAT:
        return this.getSnapchatClient(credentials);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  static clearCache(platform?: Platform, accountId?: string): void {
    if (platform && accountId) {
      const key = `${platform.toLowerCase()}_${accountId}`;
      this.instances.delete(key);
    } else {
      this.instances.clear();
    }
  }
}

export default APIClientFactory;
