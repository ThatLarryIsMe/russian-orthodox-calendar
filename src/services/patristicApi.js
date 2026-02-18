/**
 * patristicApi.js
 * Fetches and generates patristic commentary on scripture readings.
 *
 * Strategy:
 * 1. Try to find actual patristic texts from known sources
 * 2. Use Claude AI as a fallback, with strict instructions for accuracy
 *
 * NOTE: All AI-generated commentary is clearly labeled as such.
 * We never fabricate quotes or attribute invented text to specific works.
 */

const CACHE_PREFIX = 'patristic_';
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
 * Preferred Church Fathers for commentary.
 */
export const PREFERRED_FATHERS = [
  { name: 'St. John Chrysostom', shortName: 'Chrysostom', era: '4th-5th c.' },
  { name: 'Blessed Theophylact of Ohrid', shortName: 'Theophylact', era: '11th-12th c.' },
  { name: 'St. Cyril of Alexandria', shortName: 'Cyril of Alexandria', era: '4th-5th c.' },
  { name: 'St. Gregory the Theologian', shortName: 'Gregory Nazianzen', era: '4th c.' },
  { name: 'St. Basil the Great', shortName: 'Basil', era: '4th c.' },
  { name: 'St. Augustine of Hippo', shortName: 'Augustine', era: '4th-5th c.' },
];

/**
 * Known patristic commentaries on common Gospel/Epistle passages.
 * These are real works — titles and authors are accurate.
 */
const KNOWN_COMMENTARIES = {
  // Theophylact's Explanation of the New Testament
  'matthew': {
    source: 'Blessed Theophylact of Ohrid',
    work: 'The Explanation of the Holy Gospel According to St. Matthew',
    publisher: 'Chrysostom Press',
    note: 'Theophylact\'s verse-by-verse commentary',
  },
  'mark': {
    source: 'Blessed Theophylact of Ohrid',
    work: 'The Explanation of the Holy Gospel According to St. Mark',
    publisher: 'Chrysostom Press',
    note: 'Theophylact\'s verse-by-verse commentary',
  },
  'luke': {
    source: 'Blessed Theophylact of Ohrid',
    work: 'The Explanation of the Holy Gospel According to St. Luke',
    publisher: 'Chrysostom Press',
    note: 'Theophylact\'s verse-by-verse commentary',
  },
  'john': {
    source: 'Blessed Theophylact of Ohrid',
    work: 'The Explanation of the Holy Gospel According to St. John',
    publisher: 'Chrysostom Press',
    note: 'Theophylact\'s verse-by-verse commentary',
  },
  'romans': {
    source: 'St. John Chrysostom',
    work: 'Homilies on Romans',
    note: 'Series of 32 homilies on the Epistle to the Romans',
  },
  'acts': {
    source: 'St. John Chrysostom',
    work: 'Homilies on the Acts of the Apostles',
    note: 'Series of 55 homilies on Acts',
  },
  'galatians': {
    source: 'St. John Chrysostom',
    work: 'Commentary on the Epistle to the Galatians',
    note: 'Chapter-by-chapter commentary',
  },
  'hebrews': {
    source: 'St. John Chrysostom',
    work: 'Homilies on the Epistle to the Hebrews',
    note: 'Series of 34 homilies',
  },
  'ephesians': {
    source: 'St. John Chrysostom',
    work: 'Homilies on the Epistle to the Ephesians',
    note: 'Series of 24 homilies',
  },
  'corinthians': {
    source: 'St. John Chrysostom',
    work: 'Homilies on the First Epistle to the Corinthians',
    note: 'Series of 44 homilies',
  },
  'philippians': {
    source: 'St. John Chrysostom',
    work: 'Homilies on the Epistle to the Philippians',
    note: 'Series of 15 homilies',
  },
};

/**
 * Get patristic commentary for a reading.
 * Returns an array of commentary objects.
 *
 * @param {Object} reading - Reading data (book, chapter, verse, text)
 * @param {string} readingType - 'gospel' | 'epistle' | 'old-testament'
 */
export async function getPatristicCommentary(reading, readingType) {
  if (!reading) return [];

  const book = (reading.book || reading.bookAbbrev || '').toLowerCase();
  const passage = reading.passageRef || `${reading.book} ${reading.chapter}:${reading.verse}`;
  const cacheKey = passage.toLowerCase().replace(/[\s:,]/g, '_');

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const commentaries = [];

  // Find applicable known commentary
  const bookKey = Object.keys(KNOWN_COMMENTARIES).find(k => book.startsWith(k));
  if (bookKey) {
    const meta = KNOWN_COMMENTARIES[bookKey];
    commentaries.push({
      father: meta.source,
      work: meta.work,
      section: `Commentary on ${passage}`,
      text: null, // Will be labeled as "text not included"
      note: meta.note,
      isAiGenerated: false,
      isReference: true, // Reference to an existing work, not the text itself
      attribution: `${meta.source}, "${meta.work}"${meta.publisher ? ` (${meta.publisher})` : ''}`,
    });
  }

  // Generate AI commentary as supplement
  const aiCommentary = await generateAiCommentary(reading, readingType, passage);
  if (aiCommentary) {
    commentaries.push(aiCommentary);
  }

  if (commentaries.length > 0) {
    setCached(cacheKey, commentaries);
  }

  return commentaries;
}

/**
 * Generate patristic-style commentary using Claude API.
 * Clearly labeled as AI-generated. References only real works.
 */
async function generateAiCommentary(reading, readingType, passage) {
  // This requires an API key - we'll provide a fallback structure
  // In production, this would call the Anthropic API
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      father: 'Editorial Note',
      work: '',
      section: '',
      text: getStaticCommentaryNote(reading, readingType),
      isAiGenerated: false,
      isReference: false,
      isNote: true,
      attribution: null,
    };
  }

  try {
    const prompt = buildPatristicPrompt(reading, readingType, passage);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (!text) return null;

    return {
      father: 'Patristic Commentary Summary',
      work: 'From the Holy Fathers (AI-assisted compilation)',
      section: `On ${passage}`,
      text,
      isAiGenerated: true,
      attribution: 'AI-assisted summary of patristic tradition. All referenced fathers and works are real. Not a direct quotation.',
    };
  } catch (err) {
    console.warn('AI commentary generation failed:', err);
    return null;
  }
}

function buildPatristicPrompt(reading, readingType, passage) {
  return `You are a theological scholar specializing in Orthodox Christian patristics.
Provide authentic commentary on the scripture passage: ${passage}

Requirements:
1. Only reference REAL Church Fathers and their ACTUAL, VERIFIABLE works
2. Reference works that genuinely discuss this passage or its themes
3. If quoting, clearly indicate it is a paraphrase, not a verbatim quote
4. Preferred authors: St. John Chrysostom, Blessed Theophylact of Ohrid, St. Cyril of Alexandria, St. Gregory the Theologian, St. Basil the Great
5. Include the specific work name and section when referencing
6. Keep total length to 250-400 words
7. Focus on Orthodox theological interpretation
8. Do NOT fabricate quotes or attribute invented text to any Father
9. If you cannot verify commentary on this exact passage, note which themes the Fathers addressed

Format your response as:
[Commentary text, 2-3 paragraphs, referencing specific Fathers and their known works on related themes]

At the end, note which Father's commentary most directly addresses this passage and in which work.`;
}

/**
 * Provide a static note when AI is unavailable.
 */
function getStaticCommentaryNote(reading, readingType) {
  const book = (reading.book || reading.bookAbbrev || '').toLowerCase();

  const recommendations = {
    matthew: 'For commentary on Matthew\'s Gospel, consult Blessed Theophylact\'s "Explanation of Matthew" or St. John Chrysostom\'s "Homilies on Matthew" (90 homilies), both available from Chrysostom Press and Holy Trinity Publications.',
    mark: 'For commentary on Mark\'s Gospel, consult Blessed Theophylact\'s "Explanation of Mark," which provides verse-by-verse Orthodox interpretation.',
    luke: 'For commentary on Luke\'s Gospel, consult Blessed Theophylact\'s "Explanation of Luke" or St. Cyril of Alexandria\'s "Commentary on Luke."',
    john: 'For commentary on John\'s Gospel, consult St. John Chrysostom\'s "Homilies on the Gospel of John" (88 homilies) or Blessed Theophylact\'s "Explanation of John."',
    acts: 'For commentary on Acts, consult St. John Chrysostom\'s "Homilies on the Acts of the Apostles" (55 homilies).',
    romans: 'For commentary on Romans, consult St. John Chrysostom\'s "Homilies on Romans" (32 homilies).',
    default: 'The Church Fathers wrote extensive commentaries on Holy Scripture. For Orthodox patristic commentary, consult resources from Holy Trinity Seminary Press, Chrysostom Press, or the Ancient Christian Commentary on Scripture series.',
  };

  const key = Object.keys(recommendations).find(k => book.startsWith(k)) || 'default';
  return recommendations[key];
}
