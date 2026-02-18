/**
 * orthocalApi.js
 * Primary data source for Orthodox liturgical information.
 * Uses orthocal.info API which provides feast days, saints, fasting rules,
 * readings, troparia, and kontakia.
 */

// In production (Vercel) we go through our own serverless proxy to avoid CORS.
// In local dev we can hit orthocal.info directly via the same proxy path because
// Vite's dev server doesn't serve /api — so we fall back to the real URL.
const IS_DEV = import.meta.env.DEV;
const BASE_URL = IS_DEV ? 'https://orthocal.info/api' : '/api/orthocal';
const CACHE_PREFIX = 'orthocal_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get a cached value from localStorage, respecting TTL.
 */
function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Store a value in localStorage with a timestamp.
 */
function setCached(key, data) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Storage quota exceeded — fail silently
  }
}

/**
 * Fetch liturgical data for a given date.
 * Tries OCA calendar first, falls back to ROCOR.
 *
 * @param {number} year
 * @param {number} month  1-indexed
 * @param {number} day
 * @returns {Promise<Object>} Normalized liturgical data object
 */
export async function fetchLiturgicalDay(year, month, day) {
  const cacheKey = `${year}-${month}-${day}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');

  let data = null;
  let source = 'oca';

  const buildUrl = (calendar) =>
    IS_DEV
      ? `${BASE_URL}/${calendar}/${year}/${paddedMonth}/${paddedDay}/`
      : `${BASE_URL}?calendar=${calendar}&year=${year}&month=${paddedMonth}&day=${paddedDay}`;

  // Try OCA calendar
  try {
    const res = await fetch(buildUrl('oca'));
    if (res.ok) {
      data = await res.json();
      source = 'oca';
    }
  } catch (err) {
    console.warn('OCA calendar fetch failed:', err);
  }

  // Fallback to ROCOR calendar
  if (!data) {
    try {
      const res = await fetch(buildUrl('rocor'));
      if (res.ok) {
        data = await res.json();
        source = 'rocor';
      }
    } catch (err) {
      console.warn('ROCOR calendar fetch failed:', err);
    }
  }

  if (!data) {
    throw new Error(`Unable to fetch liturgical data for ${year}-${paddedMonth}-${paddedDay}`);
  }

  const normalized = normalizeOrthocalData(data, source);
  setCached(cacheKey, normalized);
  return normalized;
}

/**
 * Normalize the raw orthocal API response into a consistent shape.
 */
function normalizeOrthocalData(raw, source) {
  return {
    source,
    // Calendar position
    year: raw.year,
    month: raw.month,
    day: raw.day,
    julianDay: raw.jdn,
    oldCalendarDate: raw.old_calendar_date || null,
    tone: raw.tone || null,
    weekOfYear: raw.week_of_year || null,
    // Liturgical season & fasting
    fastingLevel: raw.fast_level || 0,
    fastingLevelName: raw.fast_level_desc || '',
    fastingException: raw.fast_exception || 0,
    fastingExceptionDesc: raw.fast_exception_desc || '',
    // Feasts
    feasts: (raw.feast_details || []).map(normalizeFeast),
    feastNames: raw.feasts || [],
    // Saints
    saints: (raw.saint_details || raw.saints || []).map(normalizeSaint),
    // Readings
    readings: (raw.readings || []).map(normalizeReading),
    // Raw for debugging
    _raw: raw,
  };
}

function normalizeFeast(feast) {
  return {
    id: feast.id || null,
    name: feast.name || feast.title || '',
    rank: feast.rank || null,
    rankName: feast.rank_name || feast.rank_desc || '',
    color: feast.colour || feast.color || null,
    colorName: feast.colour_name || feast.color_name || '',
    description: feast.description || '',
  };
}

function normalizeSaint(saint) {
  const troparionText = typeof saint.troparion === 'string'
    ? saint.troparion
    : saint.troparion?.text || '';
  const kontakionText = typeof saint.kontakion === 'string'
    ? saint.kontakion
    : saint.kontakion?.text || '';

  // Try to extract tone from the text if not explicitly given
  const extractTone = (text, explicitTone) => {
    if (explicitTone) return explicitTone;
    const match = text?.match(/^Tone\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  return {
    id: saint.id || null,
    name: saint.name || saint.title || '',
    rank: saint.rank || null,
    rankName: saint.rank_name || saint.rank_desc || '',
    life: saint.life || saint.biography || '',
    troparionTitle: saint.troparion_title || '',
    troparion: troparionText,
    troparionTone: extractTone(troparionText, saint.troparion_tone || saint.troparion?.tone),
    kontakionTitle: saint.kontakion_title || '',
    kontakion: kontakionText,
    kontakionTone: extractTone(kontakionText, saint.kontakion_tone || saint.kontakion?.tone),
    iconUrl: saint.icon || saint.image || null,
    iconDesc: saint.icon_desc || '',
    shortLife: saint.short_life || '',
  };
}

function normalizeReading(reading) {
  // Build a human-readable passage reference from the reading data
  const book = reading.book || reading.book_abbrev || '';
  const chapter = reading.chapter;
  const verse = reading.verse;
  const verseEnd = reading.verse_end;
  let passageRef = reading.passage || reading.sd_reading || '';

  if (!passageRef && book) {
    passageRef = book;
    if (chapter) {
      passageRef += ` ${chapter}`;
      if (verse) {
        passageRef += `:${verse}`;
        if (verseEnd && verseEnd !== verse) {
          passageRef += `-${verseEnd}`;
        }
      }
    }
  }

  return {
    id: reading.id || null,
    book,
    chapter: chapter || null,
    verse: verse || null,
    verseEnd: verseEnd || null,
    bookAbbrev: reading.book_abbrev || reading.book_name || book,
    desc: reading.desc || reading.description || '',
    sdReading: reading.sd_reading || '',
    pericope: reading.pericope || null,
    liturgy: reading.liturgy || reading.source || reading.service || '',
    passageRef,
    // Full text fetched separately
    fullText: null,
  };
}

/**
 * Get the fasting description for a given fast level.
 */
export function getFastingDescription(level, exceptionLevel, exceptionDesc) {
  // Exception overrides base level
  if (exceptionLevel && exceptionDesc) {
    return exceptionDesc;
  }

  const levels = {
    0: 'Fast-free day',
    1: 'No fasting rule',
    2: 'Vegetarian (no meat)',
    3: 'Fast day — no meat, fish, wine, or oil',
    4: 'Fast day — fish, wine, and oil allowed',
    5: 'Fast day — wine and oil allowed',
    6: 'Fast day — wine allowed',
    7: 'Strict fast — no food until evening',
  };

  return levels[level] || 'Fasting rule varies';
}

/**
 * Determine the liturgical color from feast data.
 */
export function getLiturgicalColor(feasts, fastLevel) {
  if (!feasts || feasts.length === 0) {
    if (fastLevel > 1) return { name: 'Purple/Black', hex: '#3D2645' };
    return { name: 'Green', hex: '#2D5A27' };
  }

  // Find the highest-ranked feast
  const feast = feasts[0];
  const colorMap = {
    'white': { name: 'White', hex: '#F5F0E8' },
    'gold': { name: 'Gold', hex: '#B8860B' },
    'red': { name: 'Red', hex: '#8B0000' },
    'green': { name: 'Green', hex: '#2D5A27' },
    'blue': { name: 'Blue', hex: '#1A3A5C' },
    'purple': { name: 'Purple', hex: '#5B3A6B' },
    'black': { name: 'Black', hex: '#1A1A1A' },
    'yellow': { name: 'Gold/Yellow', hex: '#B8860B' },
  };

  const colorKey = feast.color?.toLowerCase();
  return colorMap[colorKey] || { name: feast.colorName || 'Green', hex: '#2D5A27' };
}
