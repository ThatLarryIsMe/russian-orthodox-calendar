/**
 * ScriptureReading.jsx
 * Displays scripture readings for the day with full text.
 */

import { useState, useEffect } from 'react';
import { SectionHeader, CollapsibleSection } from './OrnamentDivider.jsx';
import { categorizeReading, getLiturgyName, fetchScriptureText } from '../services/scriptureApi.js';
import { stripHtml } from '../utils/formatters.js';

function ReadingTypeBadge({ type }) {
  const config = {
    'gospel': {
      label: 'Gospel',
      style: { background: '#F0F5EA', border: '1px solid #9CB884', color: '#2D5A27' },
    },
    'epistle': {
      label: 'Epistle',
      style: { background: '#EEF2F8', border: '1px solid #9AAEC8', color: '#1A3A5C' },
    },
    'old-testament': {
      label: 'Old Testament',
      style: { background: '#FAF0E6', border: '1px solid #D4A575', color: '#7A4A20' },
    },
  };

  const { label, style } = config[type] || {
    label: 'Reading',
    style: { background: 'var(--color-parchment-dark)', border: '1px solid var(--color-warm-gray-pale)', color: 'var(--color-warm-gray)' },
  };

  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ ...style, fontFamily: 'var(--font-body)' }}
    >
      {label}
    </span>
  );
}

function ServiceBadge({ liturgy }) {
  if (!liturgy) return null;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded"
      style={{
        background: 'var(--color-parchment-darker)',
        color: 'var(--color-warm-gray)',
        border: '1px solid var(--color-warm-gray-light)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {liturgy}
    </span>
  );
}

function ScriptureText({ passage, text, version, error, loading }) {
  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        <div className="shimmer h-4 rounded w-full" />
        <div className="shimmer h-4 rounded w-full" />
        <div className="shimmer h-4 rounded w-5/6" />
      </div>
    );
  }

  if (error || !text) {
    return (
      <div
        className="mt-3 p-4 rounded-lg text-sm italic"
        style={{
          background: 'var(--color-parchment-dark)',
          color: 'var(--color-warm-gray)',
          border: '1px solid var(--color-warm-gray-pale)',
        }}
      >
        {error || 'Full text not available. Please look up this passage in your Bible.'}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div
        className="scripture-verse rounded-lg p-5"
        style={{
          background: 'var(--color-parchment-dark)',
          border: '1px solid var(--color-warm-gray-pale)',
          fontFamily: 'var(--font-body)',
          lineHeight: '1.9',
          color: 'var(--color-charcoal)',
          fontSize: '0.95rem',
        }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
      {version && (
        <p
          className="text-xs mt-2 text-right"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          {version} translation
        </p>
      )}
    </div>
  );
}

function SingleReading({ reading, index }) {
  const [scriptureData, setScriptureData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const type = categorizeReading(reading);
  const liturgyName = getLiturgyName(reading);

  // Build a human-readable reference
  const ref = reading.passageRef ||
    reading.sdReading ||
    reading.desc ||
    `${reading.book || reading.bookAbbrev || ''} ${reading.chapter || ''}:${reading.verse || ''}`.trim();

  const fetchText = async () => {
    if (fetched || loading) return;
    setLoading(true);
    try {
      const data = await fetchScriptureText(ref);
      setScriptureData(data);
    } catch {
      setScriptureData({ error: 'Failed to load scripture text.' });
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  // Auto-fetch for the first 3 readings
  useEffect(() => {
    if (index < 3) {
      fetchText();
    }
  }, [ref]);

  return (
    <div
      className="mb-5 rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-warm-gray-pale)' }}
    >
      <div
        className="px-5 py-3 flex flex-wrap items-center gap-2"
        style={{ background: 'var(--color-parchment-darker)' }}
      >
        <ReadingTypeBadge type={type} />
        <ServiceBadge liturgy={liturgyName} />
        <h3
          className="font-medium flex-1"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-charcoal)',
            fontSize: '1.05rem',
            minWidth: '200px',
          }}
        >
          {stripHtml(ref) || reading.desc}
        </h3>
      </div>

      <div className="px-5 py-4">
        {reading.desc && reading.desc !== ref && (
          <p
            className="text-sm mb-3"
            style={{ color: 'var(--color-warm-gray)', fontFamily: 'var(--font-body)' }}
          >
            {reading.desc}
          </p>
        )}

        {index < 3 ? (
          <ScriptureText
            passage={ref}
            text={scriptureData?.text}
            version={scriptureData?.version}
            error={scriptureData?.error}
            loading={loading}
          />
        ) : (
          !fetched ? (
            <button
              onClick={fetchText}
              className="mt-2 text-sm font-medium transition-colors"
              style={{
                color: 'var(--color-gold)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Load scripture text →
            </button>
          ) : (
            <ScriptureText
              passage={ref}
              text={scriptureData?.text}
              version={scriptureData?.version}
              error={scriptureData?.error}
              loading={loading}
            />
          )
        )}
      </div>
    </div>
  );
}

export function ScriptureReadings({ data }) {
  if (!data) return null;

  const readings = data.readings || [];

  if (readings.length === 0) {
    return (
      <section aria-labelledby="readings-heading">
        <SectionHeader id="readings-heading">Scripture Readings</SectionHeader>
        <p style={{ color: 'var(--color-warm-gray)' }}>
          No readings recorded for this day.
        </p>
      </section>
    );
  }

  // Group readings by liturgy
  const grouped = readings.reduce((acc, reading) => {
    const liturgy = getLiturgyName(reading);
    if (!acc[liturgy]) acc[liturgy] = [];
    acc[liturgy].push(reading);
    return acc;
  }, {});

  const liturgyOrder = ['Divine Liturgy', 'Matins', 'Vespers', 'Hours'];
  const orderedKeys = [
    ...liturgyOrder.filter(k => grouped[k]),
    ...Object.keys(grouped).filter(k => !liturgyOrder.includes(k)),
  ];

  return (
    <section aria-labelledby="readings-heading">
      <SectionHeader id="readings-heading">Scripture Readings</SectionHeader>

      {orderedKeys.map((liturgy) => (
        <div key={liturgy} className="mb-6">
          {orderedKeys.length > 1 && (
            <h3
              className="text-sm font-semibold tracking-widest uppercase mb-3"
              style={{
                color: 'var(--color-warm-gray)',
                fontFamily: 'var(--font-body)',
                borderBottom: '1px solid var(--color-warm-gray-pale)',
                paddingBottom: '0.5rem',
              }}
            >
              {liturgy}
            </h3>
          )}
          {grouped[liturgy].map((reading, i) => (
            <SingleReading
              key={reading.id || i}
              reading={reading}
              index={i}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
