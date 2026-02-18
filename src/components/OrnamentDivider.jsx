/**
 * OrnamentDivider.jsx
 * Decorative divider used between sections.
 */

export function OrnamentDivider({ symbol = '☦' }) {
  return (
    <div className="ornament-divider my-8 select-none" aria-hidden="true">
      <span
        className="text-gold text-lg px-2 flex-shrink-0"
        style={{ fontFamily: 'serif' }}
      >
        {symbol}
      </span>
    </div>
  );
}

export function SectionHeader({ children, icon = '☦', id }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span
          className="text-gold text-sm flex-shrink-0"
          aria-hidden="true"
          style={{ fontFamily: 'serif' }}
        >
          {icon}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-gold-pale to-transparent" />
      </div>
      <h2
        id={id}
        className="text-2xl md:text-3xl font-medium"
        style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-burgundy)',
          letterSpacing: '0.02em',
        }}
      >
        {children}
      </h2>
    </div>
  );
}

export function CollapsibleSection({ title, children, defaultOpen = true, id }) {
  return (
    <details open={defaultOpen} className="group" id={id}>
      <summary
        className="flex items-center justify-between cursor-pointer list-none py-2"
        style={{ color: 'var(--color-gold)' }}
      >
        <span
          className="text-sm font-medium tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--color-warm-gray)' }}
        >
          {title}
        </span>
        <svg
          className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{ color: 'var(--color-gold)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="mt-3 pb-2">
        {children}
      </div>
    </details>
  );
}
