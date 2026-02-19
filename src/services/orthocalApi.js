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
const CACHE_PREFIX = 'orthocal_v3_';
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
 *
 * The actual orthocal.info API (v1.1, Django Ninja schema) returns:
 *   saints   → List[str]          (just name strings, no detail objects)
 *   feasts   → List[str]          (just feast-name strings)
 *   stories  → List[{title,story}] (HTML saint-life text, separate from saints)
 *   readings → List[ReadingSchema] (passage is List[VerseSchema], reference is in display)
 */
function normalizeOrthocalData(raw, source) {
  // Build a story lookup so we can attach life text to each saint by name
  const storyByTitle = {};
  (raw.stories || []).forEach(s => {
    if (s && s.title) storyByTitle[s.title] = toStr(s.story);
  });

  // saints is an array of name strings in the real API
  const rawSaints = Array.isArray(raw.saint_details) && raw.saint_details.length > 0
    ? raw.saint_details
    : (raw.saints || []);

  const saints = rawSaints.map(s => {
    const normalized = normalizeSaint(s);
    // Attach the story (HTML life text) if not already populated
    if (!normalized.life && storyByTitle[normalized.name]) {
      normalized.life = storyByTitle[normalized.name];
    }
    return normalized;
  });

  // feasts is an array of name strings in the real API; feast_details may not exist
  const rawFeasts = Array.isArray(raw.feast_details) && raw.feast_details.length > 0
    ? raw.feast_details
    : (raw.feasts || []);

  const feasts = rawFeasts.map(normalizeFeast);
  const feastNames = (raw.feasts || []).map(f => (typeof f === 'string' ? f : toStr(f.name || '')));

  return {
    source,
    // Calendar position
    year: raw.year,
    month: raw.month,
    day: raw.day,
    julianDay: raw.jdn || raw.julian_day_number || null,
    oldCalendarDate: raw.old_calendar_date || null,
    tone: raw.tone || null,
    // pascha_distance is days from Pascha (negative = before); store separately
    // from weekOfYear so the season label isn't computed incorrectly
    paschaDistance: typeof raw.pdist === 'number' ? raw.pdist
      : typeof raw.pascha_distance === 'number' ? raw.pascha_distance : null,
    weekOfYear: raw.week_of_year || null,
    // Liturgical season & fasting
    fastingLevel: raw.fast_level || 0,
    fastingLevelName: toStr(raw.fast_level_desc),
    fastingException: raw.fast_exception || 0,
    fastingExceptionDesc: toStr(raw.fast_exception_desc),
    // Feasts
    feasts,
    feastNames,
    // Saints (with stories attached)
    saints,
    // Readings
    readings: (raw.readings || []).map(normalizeReading),
    // Raw for debugging
    _raw: raw,
  };
}

function normalizeFeast(feast) {
  // The real API returns feasts as plain strings; handle that case gracefully
  if (typeof feast === 'string') {
    return { id: null, name: feast, rank: null, rankName: '', color: null, colorName: '', description: '' };
  }
  return {
    id: feast.id || null,
    name: toStr(feast.name) || toStr(feast.title),
    rank: feast.rank || null,
    rankName: toStr(feast.rank_name) || toStr(feast.rank_desc),
    color: feast.colour || feast.color || null,
    colorName: toStr(feast.colour_name) || toStr(feast.color_name),
    description: toStr(feast.description),
  };
}

function toStr(val) {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join('\n\n');
  return '';
}

function normalizeSaint(saint) {
  // The real API returns saints as plain strings (just the name)
  if (typeof saint === 'string') {
    return {
      id: null, name: saint, rank: null, rankName: '', life: '',
      troparionTitle: '', troparion: '', troparionTone: null,
      kontakionTitle: '', kontakion: '', kontakionTone: null,
      iconUrl: null, iconDesc: '', shortLife: '',
    };
  }

  const troparionText = typeof saint.troparion === 'string'
    ? saint.troparion
    : saint.troparion?.text || '';
  const kontakionText = typeof saint.kontakion === 'string'
    ? saint.kontakion
    : saint.kontakion?.text || '';

  const extractTone = (text, explicitTone) => {
    if (explicitTone) return explicitTone;
    const match = text?.match(/^Tone\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  return {
    id: saint.id || null,
    name: toStr(saint.name) || toStr(saint.title),
    rank: saint.rank || null,
    rankName: toStr(saint.rank_name) || toStr(saint.rank_desc),
    life: toStr(saint.life) || toStr(saint.biography),
    troparionTitle: toStr(saint.troparion_title),
    troparion: troparionText,
    troparionTone: extractTone(troparionText, saint.troparion_tone || saint.troparion?.tone),
    kontakionTitle: toStr(saint.kontakion_title),
    kontakion: kontakionText,
    kontakionTone: extractTone(kontakionText, saint.kontakion_tone || saint.kontakion?.tone),
    iconUrl: saint.icon || saint.image || null,
    iconDesc: toStr(saint.icon_desc),
    shortLife: toStr(saint.short_life),
  };
}

function normalizeReading(reading) {
  // The real API (ReadingSchema) has:
  //   display       → full scripture reference string, e.g. "Romans 5:1-11"
  //   short_display → abbreviated reference, e.g. "Rom 5:1-11"
  //   source        → which service, e.g. "Apostol", "Vespers"
  //   book          → Bible book from the pericope (e.g. "Rom", "Mt")
  //   description   → reading descriptor (alias 'desc' in older field naming)
  //   passage       → List[VerseSchema] (array of verse objects — NOT a string)
  //
  // Older/alternate field names are kept as fallbacks.

  const passageRef =
    toStr(reading.display) ||
    toStr(reading['pericope.display']) ||
    toStr(reading.sd_reading);

  const sdReading =
    toStr(reading.short_display) ||
    toStr(reading['pericope.sdisplay']) ||
    toStr(reading.sd_reading);

  const book =
    toStr(reading.book) ||
    toStr(reading['pericope.book']) ||
    toStr(reading.book_abbrev);

  const desc =
    toStr(reading.description) ||
    toStr(reading.desc);

  const liturgy =
    toStr(reading.source) ||
    toStr(reading.liturgy) ||
    toStr(reading.service);

  return {
    id: reading.id || null,
    book,
    // chapter/verse may not exist in the new API (reference is in display)
    chapter: reading.chapter || null,
    verse: reading.verse || null,
    verseEnd: reading.verse_end || null,
    bookAbbrev: book,
    desc,
    sdReading,
    pericope: typeof reading.pericope === 'number' ? reading.pericope : null,
    liturgy,
    passageRef: passageRef || sdReading,
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
