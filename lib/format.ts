/**
 * Number and currency formatting utilities
 */

/**
 * Formats a number as US currency with proper dollar signs, commas, and 2 decimal places
 * @param amount - The number to format as currency
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

/**
 * Formats a number with thousands separators (commas)
 * @param num - The number to format
 * @returns Formatted number string (e.g., "1,234")
 */
export const formatNumber = (num: number) =>
  new Intl.NumberFormat("en-US").format(num);

/**
 * Formats a percentage with proper decimal places
 * @param percentage - The percentage to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "12.5%")
 */
export const formatPercentage = (percentage: number, decimals: number = 1) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentage / 100);
