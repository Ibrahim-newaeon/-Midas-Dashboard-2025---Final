import numeral from 'numeral';
import { CURRENCY_SYMBOLS } from '@/constants';

// Number formatting
export const formatNumber = (value: number, decimals: number = 0): string => {
  if (decimals === 0) {
    return numeral(value).format('0,0');
  }
  return numeral(value).format(`0,0.${'0'.repeat(decimals)}`);
};

export const formatCurrency = (value: number, currency: string = 'USD', decimals: number = 2): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  return `${symbol}${formatNumber(value, decimals)}`;
};

export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${formatNumber(value, decimals)}%`;
};

export const formatCompactNumber = (value: number): string => {
  return numeral(value).format('0.0a').toUpperCase();
};

// ROAS formatting
export const formatROAS = (value: number): string => {
  return `${formatNumber(value, 2)}x`;
};

// Change/Growth formatting
export const formatChange = (value: number, showSign: boolean = true): string => {
  const sign = value > 0 ? '+' : '';
  return showSign ? `${sign}${formatNumber(value, 2)}` : formatNumber(Math.abs(value), 2);
};

export const formatChangePercent = (value: number, showSign: boolean = true): string => {
  const sign = value > 0 ? '+' : '';
  return showSign ? `${sign}${formatPercent(value)}` : formatPercent(Math.abs(value));
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Duration formatting
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// Text truncation
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export default {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatCompactNumber,
  formatROAS,
  formatChange,
  formatChangePercent,
  formatFileSize,
  formatDuration,
  truncate,
  getInitials,
};
