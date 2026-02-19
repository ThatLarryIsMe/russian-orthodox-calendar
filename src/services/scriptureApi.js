/**
 * scriptureApi.js
 * Fetches full scripture text for readings.
 * Uses Bible Gateway API (via CORS proxy if needed) or
 * builds from reading references provided by orthocal.
 */

const CACHE_PREFIX = 'scripture_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days — scripture doesn't change

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

function setCached(key, data) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Quota exceeded
  }
}

/**
 * Fetch full text of a scripture passage using the ESV API or API.Bible.
 * Orthocal sometimes provides the passage text directly — use that if available.
 *
 * @param {string} passage  e.g. "Romans 5:1-11" or "John 3:16-21"
 * @returns {Promise<{text: string, reference: string, version: string}>}
 */
export async function fetchScriptureText(passage) {
  if (!passage) return null;

  const cacheKey = passage.toLowerCase().replace(/\s+/g, '_');
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Try Bible API (api.bible) with ESV or NRSV
  // Using a public endpoint that doesn't require auth for basic use
  try {
    const result = await fetchFromBibleApi(passage);
    if (result) {
      setCached(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('Bible API fetch failed:', err);
  }

  return {
    text: null,
    reference: passage,
    version: 'NKJV',
    error: 'Full text unavailable — please look up this passage in your Bible.',
  };
}

/**
 * Attempt to fetch passage from a Bible text API.
 * Uses the bible-api.com free service (KJV, no auth required).
 */
async function fetchFromBibleApi(passage) {
  // bible-api.com supports KJV, ASV, BBE, Darby, etc.
  // It uses URL-encoded passage references
  const encoded = encodeURIComponent(passage);
  const url = `https://bible-api.com/${encoded}?translation=kjv`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data || data.error) return null;

  // Format the text nicely
  const verses = data.verses || [];
  let formattedText = '';

  if (verses.length > 0) {
    formattedText = verses.map(v =>
      `<sup class="verse-num">${v.verse}</sup>${v.text.trim()}`
    ).join(' ');
  } else if (data.text) {
    formattedText = data.text;
  }

  return {
    text: formattedText,
    reference: data.reference || passage,
    version: 'KJV',
  };
}

/**
 * Parse a reading reference into components.
 * e.g. "Romans 5:1-11" -> { book: "Romans", chapter: 5, verseStart: 1, verseEnd: 11 }
 */
export function parseReference(ref) {
  if (!ref) return null;

  const match = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return { raw: ref };

  return {
    book: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verseStart: parseInt(match[3], 10),
    verseEnd: match[4] ? parseInt(match[4], 10) : null,
    raw: ref,
  };
}

/**
 * Determine if a reading is Epistle, Gospel, or OT from its descriptor.
 * Works with both the old API field names and the new orthocal.info schema where:
 *   reading.book    = Bible book abbreviation (e.g. "Mt", "Rom") OR liturgical book name
 *   reading.passageRef = full reference string (e.g. "Matthew 5:1-7", "Romans 5:1-11")
 */
export function categorizeReading(reading) {
  const book = (reading.book || reading.bookAbbrev || '').toLowerCase();
  // Extract the book portion of the passage reference string (first word)
  const refBook = (reading.passageRef || reading.sdReading || '').split(/[\s:]/)[0].toLowerCase();

  const gospels = ['matthew', 'mark', 'luke', 'john', 'mt', 'mk', 'lk', 'jn'];
  const ot = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
               'joshua', 'judges', 'ruth', 'samuel', 'kings', 'chronicles',
               'ezra', 'nehemiah', 'esther', 'job', 'psalm', 'psalms', 'proverbs',
               'ecclesiastes', 'isaiah', 'jeremiah', 'ezekiel', 'daniel',
               'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum',
               'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi',
               'wisdom', 'sirach', 'baruch', 'maccabees'];

  // Check passage reference first (most reliable — full book name like "Matthew")
  if (gospels.some(g => refBook.startsWith(g))) return 'gospel';
  if (ot.some(b => refBook.startsWith(b))) return 'old-testament';

  // Fall back to reading.book (Bible abbreviation like "Mt" or liturgical name "Evangelion")
  if (gospels.some(g => book.startsWith(g))) return 'gospel';
  if (book === 'evangelion') return 'gospel';
  if (ot.some(b => book.startsWith(b))) return 'old-testament';
  if (book === 'acts' || book === 'act') return 'epistle';
  return 'epistle';
}

/**
 * Map liturgy descriptor to a human-readable service name.
 */
export function getLiturgyName(reading) {
  const liturgy = (reading.liturgy || reading.desc || '').toLowerCase();

  if (liturgy.includes('matins') || liturgy.includes('orthros')) return 'Matins';
  if (liturgy.includes('vesper')) return 'Vespers';
  if (liturgy.includes('liturgy') || liturgy.includes('divine liturgy')) return 'Divine Liturgy';
  if (liturgy.includes('hours')) return 'Hours';
  if (liturgy.includes('apostol')) return 'Divine Liturgy';

  return 'Divine Liturgy';
}
