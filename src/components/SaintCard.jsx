/**
 * SaintCard.jsx
 * Displays a saint with icon, life/biography, troparion, kontakion.
 */

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader, CollapsibleSection } from './OrnamentDivider.jsx';
import { formatSaintName, parseLifeText, formatTone, stripHtml, truncateWords } from '../utils/formatters.js';
import { getSaintIconUrl } from '../services/iconSearch.js';

// Orthodox cross placeholder SVG
function IconPlaceholder({ saintName }) {
  return (
    <div
      className="icon-frame flex items-center justify-center rounded"
      style={{
        width: '140px',
        height: '170px',
        background: 'linear-gradient(135deg, #1a1008 0%, #2d1f0a 100%)',
        flexShrink: 0,
      }}
      aria-label={`Icon placeholder for ${saintName}`}
    >
      <div className="text-center">
        <div
          className="text-5xl mb-2 select-none"
          style={{ color: 'var(--color-gold-pale)', fontFamily: 'serif' }}
          aria-hidden="true"
        >
          ☦
        </div>
        <div
          className="text-xs text-center px-2 leading-tight"
          style={{ color: 'var(--color-gold-pale)', opacity: 0.7, maxWidth: '110px' }}
        >
          {saintName?.split(' ').slice(-2).join(' ')}
        </div>
      </div>
    </div>
  );
}

function SaintIcon({ saint, iconData }) {
  const [imgError, setImgError] = useState(false);

  if (!iconData || !iconData.url || imgError || iconData.isPlaceholder) {
    return (
      <div className="flex flex-col items-center gap-2">
        <IconPlaceholder saintName={saint.name} />
        {iconData?.searchUrl && (
          <a
            href={iconData.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-center"
            style={{ color: 'var(--color-warm-gray)', maxWidth: '140px' }}
          >
            Search icons →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="icon-frame rounded" style={{ flexShrink: 0 }}>
        <img
          src={iconData.url}
          alt={`Icon of ${saint.name}`}
          className="block rounded"
          style={{ width: '140px', height: '170px', objectFit: 'cover' }}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
      {iconData.attribution && (
        <p
          className="text-xs text-center"
          style={{ color: 'var(--color-warm-gray)', maxWidth: '140px' }}
        >
          {iconData.attribution}
        </p>
      )}
    </div>
  );
}

function LiturgicalTextBlock({ title, text, tone, className = '' }) {
  if (!text) return null;
  const formatted = stripHtml(text);
  const toneLabel = formatTone(tone);

  return (
    <div className={`mt-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <h4
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-body)' }}
        >
          {title}
        </h4>
        {toneLabel && (
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{
              background: 'var(--color-parchment-darker)',
              color: 'var(--color-warm-gray)',
              border: '1px solid var(--color-warm-gray-light)',
            }}
          >
            {toneLabel}
          </span>
        )}
      </div>
      <div
        className="liturgical-text rounded-lg p-4"
        style={{
          background: 'var(--color-parchment-dark)',
          borderLeft: '3px solid var(--color-gold-pale)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {formatted}
      </div>
    </div>
  );
}

function LifeSection({ life }) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = parseLifeText(life);

  if (paragraphs.length === 0) return null;

  const previewWordCount = 120;
  const fullText = paragraphs.join('\n\n');
  const preview = truncateWords(paragraphs[0], previewWordCount);
  const hasMore = fullText.split(/\s+/).length > previewWordCount || paragraphs.length > 1;

  return (
    <div className="mt-4">
      <h4
        className="text-sm font-semibold tracking-wide uppercase mb-3"
        style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-body)' }}
      >
        Life
      </h4>
      <div
        className="text-sm leading-relaxed"
        style={{ color: 'var(--color-charcoal-light)', fontFamily: 'var(--font-body)' }}
      >
        {expanded ? (
          <>
            {paragraphs.map((p, i) => (
              <p key={i} className={i > 0 ? 'mt-3' : ''}>
                {p}
              </p>
            ))}
          </>
        ) : (
          <p>{preview}</p>
        )}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 text-sm font-medium transition-colors"
          style={{ color: 'var(--color-gold)', background: 'none', border: 'none', padding: 0 }}
        >
          {expanded ? '← Show less' : 'Read full life →'}
        </button>
      )}
    </div>
  );
}

function SingleSaint({ saint, isFirst = false }) {
  const [iconData, setIconData] = useState(null);
  const [iconLoading, setIconLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadIcon() {
      try {
        const data = await getSaintIconUrl(saint);
        if (mounted) setIconData(data);
      } catch {
        if (mounted) setIconData(null);
      } finally {
        if (mounted) setIconLoading(false);
      }
    }
    loadIcon();
    return () => { mounted = false; };
  }, [saint.id, saint.name]);

  const hasTroparion = !!(saint.troparion);
  const hasKontakion = !!(saint.kontakion);
  const hasLife = !!(saint.life || saint.shortLife);

  return (
    <div
      className="rounded-lg p-5 mb-6"
      style={{
        background: 'var(--color-parchment-dark)',
        border: '1px solid var(--color-warm-gray-pale)',
      }}
    >
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Icon */}
        <div className="flex-shrink-0 flex justify-center sm:justify-start">
          {iconLoading ? (
            <div
              className="shimmer rounded"
              style={{ width: '140px', height: '170px' }}
              aria-hidden="true"
            />
          ) : (
            <SaintIcon saint={saint} iconData={iconData} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-xl font-medium mb-1"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-charcoal)',
              fontSize: '1.3rem',
            }}
          >
            {formatSaintName(saint.name)}
          </h3>
          {saint.rankName && (
            <p
              className="text-xs mb-3 tracking-wide"
              style={{ color: 'var(--color-warm-gray)', fontFamily: 'var(--font-body)' }}
            >
              {saint.rankName}
            </p>
          )}

          {/* Life */}
          {hasLife && (
            <LifeSection life={saint.life || saint.shortLife} />
          )}
        </div>
      </div>

      {/* Troparion and Kontakion below the main row */}
      {(hasTroparion || hasKontakion) && (
        <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--color-warm-gray-pale)' }}>
          <CollapsibleSection title="Troparion & Kontakion" defaultOpen={isFirst}>
            <LiturgicalTextBlock
              title="Troparion"
              text={saint.troparion}
              tone={saint.troparionTone}
            />
            <LiturgicalTextBlock
              title="Kontakion"
              text={saint.kontakion}
              tone={saint.kontakionTone}
              className="mt-4"
            />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

export function SaintsSection({ data }) {
  if (!data) return null;

  const saints = data.saints || [];

  if (saints.length === 0) {
    return (
      <section aria-labelledby="saints-heading">
        <SectionHeader id="saints-heading">Saints of the Day</SectionHeader>
        <p style={{ color: 'var(--color-warm-gray)' }}>
          No saints recorded for this day.
        </p>
      </section>
    );
  }

  // Show top saints with full detail, rest in a collapsed list
  const PRIMARY_SAINT_COUNT = 3;
  const primarySaints = saints.slice(0, PRIMARY_SAINT_COUNT);
  const remainingSaints = saints.slice(PRIMARY_SAINT_COUNT);

  return (
    <section aria-labelledby="saints-heading">
      <SectionHeader id="saints-heading">Saints of the Day</SectionHeader>

      <div>
        {primarySaints.map((saint, i) => (
          <SingleSaint
            key={saint.id || i}
            saint={saint}
            isFirst={i === 0}
          />
        ))}
      </div>

      {remainingSaints.length > 0 && (
        <CollapsibleSection
          title={`${remainingSaints.length} more saint${remainingSaints.length > 1 ? 's' : ''} commemorated today`}
          defaultOpen={false}
        >
          <ul
            className="space-y-1 mt-3"
            style={{ color: 'var(--color-charcoal-light)', fontFamily: 'var(--font-body)' }}
          >
            {remainingSaints.map((saint, i) => (
              <li
                key={saint.id || i}
                className="flex items-center gap-2 text-sm py-1"
                style={{ borderBottom: '1px solid var(--color-warm-gray-pale)' }}
              >
                <span className="text-gold text-xs" aria-hidden="true">·</span>
                {formatSaintName(saint.name)}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}
    </section>
  );
}
