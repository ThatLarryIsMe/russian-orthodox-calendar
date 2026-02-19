/**
 * dateHelpers.js
 * Julian/Gregorian calendar conversions and liturgical date calculations.
 */

/**
 * Convert a Gregorian date to Julian (Old Calendar) date.
 * The Julian calendar is currently 13 days behind the Gregorian calendar
 * (for dates between March 1, 1900 and February 28, 2100).
 *
 * @param {Date} gregorianDate
 * @returns {Date} Julian calendar date (as a JS Date object representing the Julian date)
 */
export function gregorianToJulian(gregorianDate) {
  // Current offset: Julian = Gregorian - 13 days (valid through 2100)
  const julianDate = new Date(gregorianDate);
  julianDate.setDate(julianDate.getDate() - 13);
  return julianDate;
}

/**
 * Convert a Julian (Old Calendar) date to Gregorian.
 * @param {Date} julianDate
 * @returns {Date} Gregorian date
 */
export function julianToGregorian(julianDate) {
  const gregorianDate = new Date(julianDate);
  gregorianDate.setDate(gregorianDate.getDate() + 13);
  return gregorianDate;
}

/**
 * Format a date for display.
 * @param {Date} date
 * @param {Object} options - Intl.DateTimeFormat options
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
}

/**
 * Format just the month and day (short form).
 */
export function formatShortDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Get today's date as { year, month, day } (1-indexed month).
 */
export function getTodayParts() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}

/**
 * Parse date parts from a Date object.
 */
export function getDateParts(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/**
 * Create a Date object from year/month/day (1-indexed month).
 */
export function dateFromParts({ year, month, day }) {
  return new Date(year, month - 1, day);
}

/**
 * Add days to a date.
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if two dates are the same calendar day.
 */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Format the Julian calendar date for display.
 * Returns a string like "February 5 (Old Calendar)" or "February 5 / 18"
 */
export function formatJulianDate(gregorianDate) {
  const julian = gregorianToJulian(gregorianDate);
  const julianMonth = julian.toLocaleString('en-US', { month: 'long' });
  const julianDay = julian.getDate();
  const gregDay = gregorianDate.getDate();
  const gregMonth = gregorianDate.toLocaleString('en-US', { month: 'long' });

  return `${julianMonth} ${julianDay} (O.S.) / ${gregMonth} ${gregDay} (N.S.)`;
}

/**
 * Get the name of a liturgical tone (1-8 cycle).
 */
export function getToneName(tone) {
  if (!tone || tone < 1 || tone > 8) return null;
  const toneNames = {
    1: 'First Tone',
    2: 'Second Tone',
    3: 'Third Tone',
    4: 'Fourth Tone',
    5: 'Fifth (Plagal First) Tone',
    6: 'Sixth (Plagal Second) Tone',
    7: 'Seventh (Grave) Tone',
    8: 'Eighth (Plagal Fourth) Tone',
  };
  return toneNames[tone] || `Tone ${tone}`;
}

/**
 * Get a season name from the liturgical data.
 * Uses paschaDistance (days from Pascha, negative = before) for accurate labels,
 * with feast-name keywords as higher-priority overrides.
 */
export function getLiturgicalSeasonLabel(data) {
  if (!data) return '';

  const feastNames = (data.feastNames || []).join(' ').toLowerCase();

  // Keyword overrides — feast names give us the most specific labels
  if (feastNames.includes('great lent') || feastNames.includes('clean monday')) return 'Great Lent';
  if (feastNames.includes('nativity fast') || feastNames.includes('advent')) return 'Nativity Fast';
  if (feastNames.includes('dormition fast')) return 'Dormition Fast';
  if (feastNames.includes('apostles') && data.fastingLevel > 1) return "Apostles' Fast";
  if (feastNames.includes('bright week') || feastNames.includes('paschal week')) return 'Bright Week';
  if (feastNames.includes('pascha') || feastNames.includes('easter')) return 'Paschal Season';

  // Derive season from paschaDistance (days relative to Pascha)
  const pdist = data.paschaDistance;
  if (typeof pdist === 'number') {
    if (pdist <= -48) return 'Triodion Season';         // pre-Lenten Triodion
    if (pdist < -6)   return 'Great Lent';              // Clean Monday through Holy Thursday
    if (pdist < 0)    return 'Holy Week';
    if (pdist === 0)  return 'Pascha';
    if (pdist <= 7)   return 'Bright Week';
    if (pdist <= 49) {
      const wk = Math.ceil(pdist / 7);
      return `Week ${wk} of Pascha`;
    }
    // After Pentecost (pdist 50+)
    const wk = Math.ceil((pdist - 49) / 7);
    return `Week ${wk} after Pentecost`;
  }

  // Explicit week number (rare — older API versions)
  if (data.weekOfYear) return `Week ${data.weekOfYear} after Pentecost`;

  return '';
}

/**
 * Get a human-readable fasting period name from fast level.
 */
export function getFastPeriodLabel(fastLevel, fastDesc) {
  if (fastLevel === 0) return 'Fast-free Day';
  if (fastDesc) return fastDesc;

  const labels = {
    1: 'Lenten Day',
    2: 'Fast Day',
    3: 'Strict Fast',
    4: 'Fast (Fish Permitted)',
    5: 'Fast (Wine & Oil Permitted)',
    6: 'Fast (Wine Permitted)',
    7: 'Xerophagy',
  };
  return labels[fastLevel] || 'Fasting Day';
}

/**
 * Determine if the current date is today.
 */
export function isToday(year, month, day) {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day
  );
}

/**
 * Format date parts into a URL-friendly string.
 */
export function dateToPath(year, month, day) {
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

/**
 * Get the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
