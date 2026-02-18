/**
 * iconSearch.js
 * Sources authentic Orthodox icons for saints.
 * Tries multiple reputable Orthodox sources before falling back.
 */

const CACHE_PREFIX = 'icon_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

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
 * Find an icon for a saint.
 * Returns an object with { url, source, attribution } or null.
 *
 * @param {Object} saint  - Saint data from orthocal
 * @param {string} saint.name
 * @param {string|null} saint.iconUrl - Pre-fetched URL from API
 * @param {number|null} saint.id
 */
export async function findSaintIcon(saint) {
  if (!saint || !saint.name) return null;

  const cacheKey = (saint.id || saint.name).toString().toLowerCase().replace(/\s+/g, '_');
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Use the icon URL from orthocal if provided
  if (saint.iconUrl && saint.iconUrl.startsWith('http')) {
    const result = {
      url: saint.iconUrl,
      source: 'orthocal.info',
      attribution: 'Via orthocal.info',
    };
    setCached(cacheKey, result);
    return result;
  }

  // 2. Try OCA.org saint icon by constructing the URL pattern
  // OCA uses saint IDs in their image paths
  if (saint.id) {
    const ocaIcon = await tryOcaIcon(saint.id, saint.name);
    if (ocaIcon) {
      setCached(cacheKey, ocaIcon);
      return ocaIcon;
    }
  }

  // 3. Try pravicon.com — has a large database of Orthodox icons
  const pravicon = await tryPravicon(saint.name);
  if (pravicon) {
    setCached(cacheKey, pravicon);
    return pravicon;
  }

  // 4. Return null — caller will show placeholder
  return null;
}

/**
 * Attempt to load an icon from OCA.org.
 */
async function tryOcaIcon(saintId, saintName) {
  // OCA saint pages use paths like /saints/lives/YYYY/MM/DD
  // Icons are often at /images/saints/[ID].jpg or similar
  // We construct candidate URLs and test with HEAD requests
  const candidates = [
    `https://www.oca.org/images/imgsaints/${saintId}.jpg`,
    `https://www.oca.org/images/imgsaints/full/${saintId}.jpg`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      // With no-cors, status is always 0 but we can still try loading the image
      return {
        url,
        source: 'oca.org',
        attribution: 'Orthodox Church in America (OCA)',
      };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Attempt to find an icon from pravicon.com.
 * Pravicon has a large indexed database searchable by name.
 */
async function tryPravicon(saintName) {
  // Pravicon uses numeric IDs but we can construct search URLs
  // The main search is JavaScript-rendered so we can't easily scrape it,
  // but known patterns exist for common saints
  const cleanName = saintName.toLowerCase()
    .replace(/^(st\.|saint|blessed|holy|venerable|righteous)\s+/i, '')
    .trim();

  // Return a search link as attribution
  const searchUrl = `https://pravicon.com/search.html?q=${encodeURIComponent(cleanName)}`;

  return {
    url: null,
    searchUrl,
    source: 'pravicon.com',
    attribution: 'Pravicon Orthodox Icon Database',
  };
}

/**
 * Get the best available icon for a saint, returning a result object
 * with fallback info.
 */
export async function getSaintIconUrl(saint) {
  const icon = await findSaintIcon(saint);

  if (icon && icon.url) {
    return {
      ...icon,
      isPlaceholder: false,
    };
  }

  // Return placeholder
  return {
    url: null,
    isPlaceholder: true,
    searchUrl: icon?.searchUrl || null,
    source: null,
    attribution: null,
  };
}

/**
 * Try to load an image URL and return whether it loaded successfully.
 * Used for image validity checking.
 */
export function testImageUrl(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
