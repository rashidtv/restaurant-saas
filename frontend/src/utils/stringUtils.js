// Safe string utility functions
export const safeSubstring = (text, start, end) => {
  if (!text || typeof text !== 'string') return '';
  return text.substring(start, end);
};

export const truncateText = (text, maxLength = 20) => {
  if (!text || typeof text !== 'string') return 'Unknown Item';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const getSafeString = (text, fallback = '') => {
  return text && typeof text === 'string' ? text : fallback;
};