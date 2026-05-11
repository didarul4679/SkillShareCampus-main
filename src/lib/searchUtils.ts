/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param str - The string to escape
 * @returns Escaped string safe for HTML rendering
 */
const escapeHtml = (str: string): string => {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
};

/**
 * Escapes special regex characters to prevent regex injection
 * @param str - The string to escape
 * @returns Escaped string safe for regex
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Highlights matching text in search results (XSS-safe)
 * @param text - The text to highlight
 * @param query - The search query to match
 * @returns HTML string with highlighted matches
 */
export const highlightText = (text: string, query: string): string => {
  if (!query || !text) return escapeHtml(text);
  
  // Escape both the text and query for safe HTML rendering
  const safeText = escapeHtml(text);
  const safeQuery = escapeHtml(query);
  
  // Escape regex special characters in the query
  const regexSafeQuery = escapeRegex(safeQuery);
  
  const regex = new RegExp(`(${regexSafeQuery})`, 'gi');
  return safeText.replace(regex, '<mark class="bg-primary/20 text-primary">$1</mark>');
};

/**
 * Formats search result counts
 * @param count - The number of results
 * @returns Formatted count string
 */
export const formatResultCount = (count: number): string => {
  if (count === 0) return '';
  if (count > 99) return '(99+)';
  return `(${count})`;
};
