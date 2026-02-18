/**
 * PatristicCommentary.jsx
 * Displays patristic commentary on the day's scripture readings.
 */

import { useState, useEffect } from 'react';
import { SectionHeader, CollapsibleSection } from './OrnamentDivider.jsx';
import { getPatristicCommentary, PREFERRED_FATHERS } from '../services/patristicApi.js';
import { categorizeReading } from '../services/scriptureApi.js';

function CommentaryCard({ commentary }) {
  const isNote = commentary.isNote;
  const isAi = commentary.isAiGenerated;
  const isRef = commentary.isReference;

  return (
    <div
      className="mb-5 rounded-lg overflow-hidden"
      style={{
        border: `1px solid ${isAi ? 'var(--color-warm-gray-light)' : 'var(--color-gold-pale)'}`,
        background: isNote ? 'var(--color-parchment-dark)' : 'var(--color-parchment)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex flex-wrap items-start gap-2"
        style={{
          background: isNote
            ? 'var(--color-parchment-darker)'
            : isAi
            ? 'var(--color-parchment-dark)'
            : '#FFFBF0',
          borderBottom: `1px solid ${isAi ? 'var(--color-warm-gray-pale)' : 'var(--color-gold-pale)'}`,
        }}
      >
        <div className="flex-1">
          {commentary.father && (
            <h4
              className="font-medium"
              style={{
                fontFamily: 'var(--font-heading)',
                color: isNote ? 'var(--color-warm-gray)' : 'var(--color-gold)',
                fontSize: '1.05rem',
              }}
            >
              {commentary.father}
            </h4>
          )}
          {commentary.work && (
            <p
              className="text-sm italic"
              style={{ color: 'var(--color-charcoal-light)', fontFamily: 'var(--font-body)' }}
            >
              {commentary.work}
              {commentary.section && ` — ${commentary.section}`}
            </p>
          )}
        </div>
        {isAi && (
          <span
            className="text-xs px-2 py-0.5 rounded flex-shrink-0"
            style={{
              background: 'var(--color-parchment-darker)',
              color: 'var(--color-warm-gray)',
              border: '1px solid var(--color-warm-gray-light)',
              fontFamily: 'var(--font-body)',
            }}
          >
            AI-assisted
          </span>
        )}
        {isRef && !isAi && (
          <span
            className="text-xs px-2 py-0.5 rounded flex-shrink-0"
            style={{
              background: '#FDF3DC',
              color: 'var(--color-gold)',
              border: '1px solid var(--color-gold-pale)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Reference
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {isRef && !commentary.text ? (
          <p
            className="text-sm"
            style={{ color: 'var(--color-charcoal-light)', fontFamily: 'var(--font-body)', lineHeight: '1.8' }}
          >
            {commentary.note && (
              <>
                <span className="font-medium" style={{ color: 'var(--color-charcoal)' }}>
                  Available commentary:
                </span>{' '}
                {commentary.note}
              </>
            )}
            <br />
            <span className="text-xs italic" style={{ color: 'var(--color-warm-gray)' }}>
              This refers to a real patristic work. Consult the published volume for the full text of this commentary.
            </span>
          </p>
        ) : (
          <div
            className="text-sm leading-relaxed"
            style={{
              color: 'var(--color-charcoal-light)',
              fontFamily: 'var(--font-body)',
              lineHeight: '1.8',
            }}
          >
            {commentary.text}
          </div>
        )}

        {commentary.attribution && (
          <p
            className="text-xs mt-3 pt-3 italic"
            style={{
              color: 'var(--color-warm-gray)',
              borderTop: '1px solid var(--color-warm-gray-pale)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {commentary.attribution}
          </p>
        )}
      </div>
    </div>
  );
}

function ReadingCommentary({ reading, readingType, index }) {
  const [commentaries, setCommentaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const ref = reading.passageRef || reading.sdReading ||
    `${reading.book || ''} ${reading.chapter || ''}:${reading.verse || ''}`.trim();

  const loadCommentary = async () => {
    if (loaded || loading) return;
    setLoading(true);
    try {
      const data = await getPatristicCommentary(reading, readingType);
      setCommentaries(data || []);
    } catch {
      setCommentaries([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  // Auto-load for the first 2 readings
  useEffect(() => {
    if (index < 2) loadCommentary();
  }, [ref]);

  const typeLabel = readingType === 'gospel' ? 'Gospel'
    : readingType === 'epistle' ? 'Epistle'
    : 'Old Testament';

  return (
    <div className="mb-6">
      <h3
        className="text-sm font-semibold tracking-wide uppercase mb-3 pb-2"
        style={{
          color: 'var(--color-warm-gray)',
          fontFamily: 'var(--font-body)',
          borderBottom: '1px solid var(--color-warm-gray-pale)',
        }}
      >
        On {typeLabel}: {ref}
      </h3>

      {loading && (
        <div className="space-y-2 mb-4">
          <div className="shimmer h-4 rounded w-full" />
          <div className="shimmer h-4 rounded w-5/6" />
          <div className="shimmer h-4 rounded w-full" />
        </div>
      )}

      {loaded && commentaries.length === 0 && (
        <p
          className="text-sm italic"
          style={{ color: 'var(--color-warm-gray)', fontFamily: 'var(--font-body)' }}
        >
          Commentary not available for this passage.
        </p>
      )}

      {loaded && commentaries.map((c, i) => (
        <CommentaryCard key={i} commentary={c} />
      ))}

      {!loaded && !loading && (
        <button
          onClick={loadCommentary}
          className="text-sm font-medium"
          style={{ color: 'var(--color-gold)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          Load commentary →
        </button>
      )}
    </div>
  );
}

export function PatristicCommentary({ data }) {
  if (!data) return null;

  const readings = (data.readings || []).filter(r => {
    const type = categorizeReading(r);
    return type === 'gospel' || type === 'epistle';
  });

  if (readings.length === 0) {
    return (
      <section aria-labelledby="patristic-heading">
        <SectionHeader id="patristic-heading">Patristic Commentary</SectionHeader>
        <p style={{ color: 'var(--color-warm-gray)' }}>
          No readings available for patristic commentary.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="patristic-heading">
      <SectionHeader id="patristic-heading">Patristic Commentary</SectionHeader>

      <div
        className="mb-6 p-4 rounded-lg text-sm"
        style={{
          background: '#FFFBF0',
          border: '1px solid var(--color-gold-pale)',
          color: 'var(--color-charcoal-light)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <strong style={{ color: 'var(--color-gold)' }}>Preferred sources:</strong>{' '}
        {PREFERRED_FATHERS.map(f => f.name).join(', ')}.
        Commentary references are to real published works. Where full text is not
        available inline, consult the cited volume.
      </div>

      {readings.map((reading, i) => (
        <ReadingCommentary
          key={reading.id || i}
          reading={reading}
          readingType={categorizeReading(reading)}
          index={i}
        />
      ))}
    </section>
  );
}
