/**
 * FeastDay.jsx
 * Displays feast days with rank, classification, and description.
 */

import { SectionHeader } from './OrnamentDivider.jsx';
import { formatFeastRank, stripHtml } from '../utils/formatters.js';

function FeastRankBadge({ rank, rankName }) {
  const info = formatFeastRank(rank);
  const label = rankName || info.label;

  const isGreat = rank <= 2;
  const isPolyeleos = rank === 3;

  let styles = {
    background: 'var(--color-warm-gray-pale)',
    border: '1px solid var(--color-warm-gray-light)',
    color: 'var(--color-warm-gray)',
  };

  if (isGreat) {
    styles = {
      background: '#FDF3DC',
      border: '1px solid var(--color-gold-pale)',
      color: 'var(--color-gold)',
    };
  } else if (isPolyeleos) {
    styles = {
      background: '#F5F0FA',
      border: '1px solid #C4A6D8',
      color: 'var(--color-fast-purple)',
    };
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
      style={{ ...styles, fontFamily: 'var(--font-body)' }}
    >
      {info.symbol && <span aria-hidden="true">{info.symbol}</span>}
      <span>{label}</span>
    </div>
  );
}

function FeastCard({ feast, index }) {
  const isGreat = feast.rank <= 2;
  const description = stripHtml(feast.description);

  return (
    <div
      className="rounded-lg p-5 mb-4"
      style={{
        background: isGreat ? '#FFFBF0' : 'var(--color-parchment-dark)',
        border: isGreat
          ? '1px solid var(--color-gold-pale)'
          : '1px solid var(--color-warm-gray-pale)',
        borderLeft: isGreat ? '4px solid var(--color-gold)' : undefined,
      }}
    >
      <div className="flex flex-wrap items-start gap-3 mb-2">
        <h3
          className="text-xl font-medium flex-1"
          style={{
            fontFamily: 'var(--font-heading)',
            color: isGreat ? 'var(--color-gold)' : 'var(--color-charcoal)',
            fontSize: '1.25rem',
          }}
        >
          {feast.name || feast.title || `Feast ${index + 1}`}
        </h3>
        {(feast.rank || feast.rankName) && (
          <FeastRankBadge rank={feast.rank} rankName={feast.rankName} />
        )}
      </div>

      {description && (
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-charcoal-light)', fontFamily: 'var(--font-body)' }}
        >
          {description}
        </p>
      )}

      {feast.colorName && (
        <p
          className="text-xs mt-2"
          style={{ color: 'var(--color-warm-gray)' }}
        >
          Liturgical color: {feast.colorName}
        </p>
      )}
    </div>
  );
}

export function FeastDay({ data }) {
  if (!data) return null;

  const feasts = data.feasts || [];
  const feastNames = data.feastNames || [];

  // Combine structured feast data with simple feast names
  const allFeasts = feasts.length > 0
    ? feasts
    : feastNames.map((name, i) => ({ name, rank: 6, rankName: 'Commemoration' }));

  if (allFeasts.length === 0) {
    return (
      <section aria-labelledby="feasts-heading">
        <SectionHeader id="feasts-heading">Feast Days</SectionHeader>
        <p style={{ color: 'var(--color-warm-gray)' }}>
          No special feast recorded for this day.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="feasts-heading">
      <SectionHeader id="feasts-heading">Feast Days</SectionHeader>
      <div>
        {allFeasts.map((feast, i) => (
          <FeastCard key={feast.id || i} feast={feast} index={i} />
        ))}
      </div>
    </section>
  );
}
