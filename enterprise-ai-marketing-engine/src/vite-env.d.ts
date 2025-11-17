/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_JWT_SECRET: string;
  readonly VITE_JWT_EXPIRATION: string;
  readonly VITE_REFRESH_TOKEN_EXPIRATION: string;
  readonly VITE_MFA_ENABLED: string;
  readonly VITE_META_APP_ID: string;
  readonly VITE_META_APP_SECRET: string;
  readonly VITE_META_ACCESS_TOKEN: string;
  readonly VITE_META_API_VERSION: string;
  readonly VITE_META_BUSINESS_ID: string;
  readonly VITE_GOOGLE_ADS_CLIENT_ID: string;
  readonly VITE_GOOGLE_ADS_CLIENT_SECRET: string;
  readonly VITE_GOOGLE_ADS_DEVELOPER_TOKEN: string;
  readonly VITE_GOOGLE_ADS_REFRESH_TOKEN: string;
  readonly VITE_GOOGLE_ADS_CUSTOMER_ID: string;
  readonly VITE_GOOGLE_ADS_LOGIN_CUSTOMER_ID: string;
  readonly VITE_TIKTOK_APP_ID: string;
  readonly VITE_TIKTOK_APP_SECRET: string;
  readonly VITE_TIKTOK_ACCESS_TOKEN: string;
  readonly VITE_TIKTOK_ADVERTISER_ID: string;
  readonly VITE_SNAPCHAT_CLIENT_ID: string;
  readonly VITE_SNAPCHAT_CLIENT_SECRET: string;
  readonly VITE_SNAPCHAT_ACCESS_TOKEN: string;
  readonly VITE_SNAPCHAT_AD_ACCOUNT_ID: string;
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
