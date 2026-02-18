/**
 * formatters.js
 * Text formatting utilities for liturgical content.
 */

/**
 * Format a feast rank into a display string with appropriate styling class.
 */
export function formatFeastRank(rank) {
  const ranks = {
    1: { label: 'Great Feast', cssClass: 'rank-great', symbol: '✦✦✦' },
    2: { label: 'Great Feast of the Lord/Theotokos', cssClass: 'rank-great', symbol: '✦✦✦' },
    3: { label: 'Polyeleos', cssClass: 'rank-polyeleos', symbol: '✦✦' },
    4: { label: 'Doxology (Slavoslovie)', cssClass: 'rank-doxology', symbol: '✦' },
    5: { label: 'Six Verses', cssClass: 'rank-six-verses', symbol: '◆' },
    6: { label: 'Simple Commemoration', cssClass: 'rank-simple', symbol: '·' },
    7: { label: 'Minor Feast', cssClass: 'rank-minor', symbol: '' },
  };
  return ranks[rank] || { label: `Rank ${rank}`, cssClass: '', symbol: '' };
}

/**
 * Clean and format troparion/kontakion text.
 * Handles basic HTML entities, line breaks, and formatting.
 */
export function formatLiturgicalText(text) {
  if (!text) return '';

  return text
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    // Normalize whitespace but preserve paragraph breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Strip HTML tags from text, preserving line breaks.
 */
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Truncate text to a maximum word count, adding an ellipsis.
 */
export function truncateWords(text, maxWords) {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '…';
}

/**
 * Format a scripture reference for display.
 * e.g. "Romans 5:1-11" or "John 3:16"
 */
export function formatScriptureRef(book, chapter, verseStart, verseEnd) {
  if (!book) return '';
  let ref = book;
  if (chapter) {
    ref += ` ${chapter}`;
    if (verseStart) {
      ref += `:${verseStart}`;
      if (verseEnd && verseEnd !== verseStart) {
        ref += `-${verseEnd}`;
      }
    }
  }
  return ref;
}

/**
 * Convert a fasting level number to a descriptive string.
 */
export function fastingLevelToString(level) {
  const descriptions = {
    0: 'Fast-free',
    1: 'No fasting rule',
    2: 'Vegetarian',
    3: 'Strict Fast',
    4: 'Fish Allowed',
    5: 'Wine & Oil Allowed',
    6: 'Wine Allowed',
    7: 'Xerophagy (bread, water, uncooked vegetables only)',
  };
  return descriptions[level] || 'Fasting';
}

/**
 * Get an appropriate CSS color class for a fast level.
 */
export function fastingColorClass(level) {
  if (level === 0) return 'text-teal';
  if (level <= 2) return 'text-warm-gray';
  if (level <= 4) return 'text-fast-purple';
  return 'text-burgundy';
}

/**
 * Format saint name with proper prefix.
 * Strips redundant prefix if already present.
 */
export function formatSaintName(name) {
  if (!name) return '';
  // Remove HTML if any
  const clean = stripHtml(name);
  return clean;
}

/**
 * Split a saint's life text into paragraphs.
 */
export function parseLifeText(life) {
  if (!life) return [];
  const stripped = stripHtml(life);
  return stripped
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Get tone number display (handles both numeric and "Tone X" format).
 */
export function formatTone(tone) {
  if (!tone) return null;
  if (typeof tone === 'number') return `Tone ${tone}`;
  if (typeof tone === 'string') {
    const num = parseInt(tone, 10);
    if (!isNaN(num)) return `Tone ${num}`;
    return tone;
  }
  return String(tone);
}

/**
 * Generate a stable key for list rendering from an object.
 */
export function stableKey(obj, index, field = 'id') {
  return obj?.[field] || `${index}`;
}

/**
 * Format the liturgical color indicator.
 */
export function formatLiturgicalColor(color) {
  if (!color) return null;

  const colorMap = {
    'white': { label: 'White', bg: '#F0EDE0', text: '#4A4A4A' },
    'gold': { label: 'Gold', bg: '#B8860B', text: '#FFFFFF' },
    'yellow': { label: 'Gold', bg: '#B8860B', text: '#FFFFFF' },
    'red': { label: 'Red', bg: '#8B0000', text: '#FFFFFF' },
    'green': { label: 'Green', bg: '#2D5A27', text: '#FFFFFF' },
    'blue': { label: 'Royal Blue', bg: '#1A3A5C', text: '#FFFFFF' },
    'purple': { label: 'Purple', bg: '#5B3A6B', text: '#FFFFFF' },
    'black': { label: 'Black', bg: '#1A1A1A', text: '#FFFFFF' },
    'burgundy': { label: 'Burgundy', bg: '#722F37', text: '#FFFFFF' },
  };

  const key = typeof color === 'string' ? color.toLowerCase() : '';
  return colorMap[key] || { label: color, bg: '#8A8278', text: '#FFFFFF' };
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
