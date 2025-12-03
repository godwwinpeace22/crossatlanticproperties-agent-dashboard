/**
 * Number and currency formatting utilities
 */

/**
 * Formats a number as Nigerian currency with proper naira signs, commas, and 2 decimal places
 * @param amount - The number to format as currency
 * @returns Formatted currency string (e.g., "₦1,234.56")
 */
export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatCompactCurrency = (amount: number) => {
  if (!Number.isFinite(amount)) return formatCurrency(0);

  const absAmount = Math.abs(amount);
  if (absAmount >= 1_000_000) {
    const short = (amount / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `₦${short}M`;
  }

  if (absAmount >= 1_000) {
    const short = (amount / 1_000).toFixed(1).replace(/\.0$/, "");
    return `₦${short}K`;
  }

  return formatCurrency(amount);
};

/**
 * Formats a number with thousands separators (commas)
 * @param num - The number to format
 * @returns Formatted number string (e.g., "1,234")
 */
export const formatNumber = (num: number) =>
  new Intl.NumberFormat("en-NG").format(num);

/**
 * Formats a percentage with proper decimal places
 * @param percentage - The percentage to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "12.5%")
 */
export const formatPercentage = (percentage: number, decimals: number = 1) =>
  new Intl.NumberFormat("en-NG", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentage / 100);

/**
 * Formats a date string to a localized date format
 * @param dateString - The date string to format
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats a date string to a relative time format
 * @param dateString - The date string to format
 * @returns Formatted relative time string (e.g., "2 days ago")
 */
export const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};
