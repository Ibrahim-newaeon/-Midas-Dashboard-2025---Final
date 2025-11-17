import { format, parse, startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isValid, differenceInDays } from 'date-fns';

// Date formatting
export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatDisplayDate = (date: Date | string): string => {
  return formatDate(date, 'MMM dd, yyyy');
};

export const formatDisplayDateTime = (date: Date | string): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const formatRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const days = differenceInDays(now, dateObj);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

// Date parsing
export const parseDate = (dateStr: string, formatStr: string = 'yyyy-MM-dd'): Date => {
  return parse(dateStr, formatStr, new Date());
};

// Date validation
export const isValidDate = (date: any): boolean => {
  return isValid(date);
};

// Date range helpers
export const getDateRange = (preset: string): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const today = startOfDay(now);

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: endOfDay(now),
      };

    case 'yesterday':
      return {
        startDate: startOfDay(subDays(now, 1)),
        endDate: endOfDay(subDays(now, 1)),
      };

    case 'last_7_days':
      return {
        startDate: startOfDay(subDays(now, 7)),
        endDate: endOfDay(now),
      };

    case 'last_14_days':
      return {
        startDate: startOfDay(subDays(now, 14)),
        endDate: endOfDay(now),
      };

    case 'last_30_days':
      return {
        startDate: startOfDay(subDays(now, 30)),
        endDate: endOfDay(now),
      };

    case 'last_90_days':
      return {
        startDate: startOfDay(subDays(now, 90)),
        endDate: endOfDay(now),
      };

    case 'this_month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };

    case 'last_month':
      return {
        startDate: startOfMonth(subMonths(now, 1)),
        endDate: endOfMonth(subMonths(now, 1)),
      };

    case 'this_quarter':
      return {
        startDate: startOfQuarter(now),
        endDate: endOfQuarter(now),
      };

    case 'last_quarter':
      return {
        startDate: startOfQuarter(subMonths(now, 3)),
        endDate: endOfQuarter(subMonths(now, 3)),
      };

    case 'this_year':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };

    case 'last_year':
      return {
        startDate: startOfYear(subMonths(now, 12)),
        endDate: endOfYear(subMonths(now, 12)),
      };

    case 'all_time':
    default:
      return {
        startDate: new Date(2020, 0, 1),
        endDate: endOfDay(now),
      };
  }
};

// Generate date array
export const generateDateArray = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

// Get days in range
export const getDaysInRange = (startDate: Date, endDate: Date): number => {
  return differenceInDays(endDate, startDate) + 1;
};

export default {
  formatDate,
  formatDateTime,
  formatDisplayDate,
  formatDisplayDateTime,
  formatRelativeDate,
  parseDate,
  isValidDate,
  getDateRange,
  generateDateArray,
  getDaysInRange,
};
