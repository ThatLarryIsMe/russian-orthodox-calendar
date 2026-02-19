/**
 * CalendarPosition.jsx
 * Displays calendar information: date, tone, fasting, liturgical season.
 */

import { SectionHeader } from './OrnamentDivider.jsx';
import { getToneName, getLiturgicalSeasonLabel, formatDate, gregorianToJulian } from '../utils/dateHelpers.js';
import { formatLiturgicalColor } from '../utils/formatters.js';
import { getLiturgicalColor, getFastingDescription } from '../services/orthocalApi.js';

function InfoCard({ label, value, subValue, colorDot }) {
  if (!value) return null;
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--color-parchment-dark)',
        border: '1px solid var(--color-warm-gray-pale)',
      }}
    >
      <div
        className="text-xs font-medium tracking-widest uppercase mb-1"
        style={{ color: 'var(--color-warm-gray)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </div>
      <div className="flex items-center gap-2">
        {colorDot && (
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: colorDot }}
            aria-hidden="true"
          />
        )}
        <div
          className="text-base font-medium"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-charcoal)', fontSize: '1.1rem' }}
        >
          {value}
        </div>
      </div>
      {subValue && (
        <div
          className="text-sm mt-1"
          style={{ color: 'var(--color-charcoal-light)' }}
        >
          {subValue}
        </div>
      )}
    </div>
  );
}

function FastingBadge({ level, description }) {
  const isFasting = level > 0;
  const colors = isFasting
    ? { bg: '#F3EEF8', border: '#C4A6D8', text: '#5B3A6B' }
    : { bg: '#EBF5F2', border: '#A0C4B8', text: '#1F6F5C' };

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontFamily: 'var(--font-body)',
      }}
    >
      <span aria-hidden="true">{isFasting ? '🕯️' : '✓'}</span>
      <span>{description || (isFasting ? 'Fasting Day' : 'Fast-Free Day')}</span>
    </div>
  );
}

export function CalendarPosition({ data, selectedDate }) {
  if (!data) return null;

  const julianDate = gregorianToJulian(selectedDate);
  const julianFormatted = formatDate(julianDate, {
    month: 'long',
    day: 'numeric',
  });
  const gregFormatted = formatDate(selectedDate, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const tone = data.tone;
  const toneName = getToneName(tone);
  const season = getLiturgicalSeasonLabel(data);
  const litColor = getLiturgicalColor(data.feasts, data.fastingLevel);
  const fastDesc = getFastingDescription(
    data.fastingLevel,
    data.fastingException,
    data.fastingExceptionDesc
  );

  return (
    <section aria-labelledby="cal-position-heading">
      <SectionHeader id="cal-position-heading">Calendar Position</SectionHeader>

      {/* Date Display */}
      <div className="mb-5">
        <h3
          className="text-3xl md:text-4xl font-medium mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-charcoal)' }}
        >
          {gregFormatted}
        </h3>
        <p
          className="text-base"
          style={{ color: 'var(--color-warm-gray)', fontFamily: 'var(--font-body)' }}
        >
          <span className="italic">{julianFormatted}</span>
          <span className="ml-1 text-sm">(Julian / Old Calendar)</span>
        </p>
      </div>

      {/* Fasting Badge */}
      <div className="mb-5">
        <FastingBadge level={data.fastingLevel} description={fastDesc} />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tone && (
          <InfoCard
            label="Tone"
            value={`Tone ${tone}`}
            subValue={toneName}
          />
        )}
        {season && (
          <InfoCard
            label="Season"
            value={season}
          />
        )}
        {data.fastingLevel > 0 && (
          <InfoCard
            label="Fasting Rule"
            value={fastDesc}
          />
        )}
        {litColor && (
          <InfoCard
            label="Liturgical Color"
            value={litColor.name}
            colorDot={litColor.hex}
          />
        )}
      </div>
    </section>
  );
}
