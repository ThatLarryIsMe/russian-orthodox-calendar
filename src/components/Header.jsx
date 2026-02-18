/**
 * Header.jsx
 * Sticky header with date navigation, calendar picker, and Orthodox branding.
 */

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { formatDate, addDays, getDateParts, dateFromParts, isToday, gregorianToJulian } from '../utils/dateHelpers.js';

function NavButton({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
      style={{
        background: 'var(--color-parchment-dark)',
        border: '1px solid var(--color-warm-gray-pale)',
        color: 'var(--color-charcoal)',
      }}
    >
      {children}
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function Header({ selectedDate, onDateChange, liturgicalData }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);

  const today = new Date();
  const isCurrentDay = isToday(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    selectedDate.getDate()
  );

  const julianDate = gregorianToJulian(selectedDate);
  const julianFormatted = julianDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const handlePrev = () => {
    onDateChange(addDays(selectedDate, -1));
  };

  const handleNext = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleDaySelect = (date) => {
    if (date) {
      onDateChange(date);
      setShowPicker(false);
    }
  };

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e) => {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  // Close on escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setShowPicker(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Get feast rank for header color
  const hasGreatFeast = liturgicalData?.feasts?.some(f => f.rank <= 2);
  const hasFast = liturgicalData?.fastingLevel > 0;

  const accentColor = hasGreatFeast
    ? 'var(--color-gold)'
    : hasFast
    ? 'var(--color-fast-purple)'
    : 'var(--color-burgundy)';

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(245, 240, 232, 0.97)',
        backdropFilter: 'blur(8px)',
        borderBottom: `2px solid ${accentColor}`,
        boxShadow: '0 2px 12px rgba(43, 43, 43, 0.08)',
      }}
    >
      <div
        className="max-w-3xl mx-auto px-4 py-3"
      >
        {/* Top row: branding + nav */}
        <div className="flex items-center gap-3">
          {/* Cross mark */}
          <span
            className="text-2xl select-none flex-shrink-0"
            style={{ color: accentColor, fontFamily: 'serif', lineHeight: 1 }}
            aria-hidden="true"
          >
            ☦
          </span>

          {/* Date display */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-lg md:text-xl font-medium leading-tight truncate"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-charcoal)' }}
            >
              {formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h1>
            <p
              className="text-xs leading-tight"
              style={{ color: 'var(--color-warm-gray)', fontFamily: 'var(--font-body)' }}
            >
              <span className="italic">{julianFormatted}</span>
              <span className="ml-1">Julian (O.S.)</span>
            </p>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <NavButton onClick={handlePrev} label="Previous day">
              <ChevronLeft />
            </NavButton>

            {/* Calendar picker button */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setShowPicker(p => !p)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: showPicker ? 'var(--color-parchment-darker)' : 'var(--color-parchment-dark)',
                  border: '1px solid var(--color-warm-gray-pale)',
                  color: 'var(--color-charcoal)',
                  fontFamily: 'var(--font-body)',
                }}
                aria-label="Open calendar picker"
                aria-expanded={showPicker}
              >
                <CalendarIcon />
                <span className="hidden sm:inline">Date</span>
              </button>

              {/* Calendar picker dropdown */}
              {showPicker && (
                <div
                  ref={pickerRef}
                  className="absolute right-0 mt-2 z-50 rounded-xl shadow-xl"
                  style={{
                    background: 'var(--color-parchment)',
                    border: '1px solid var(--color-warm-gray-light)',
                    boxShadow: '0 8px 32px rgba(43, 43, 43, 0.15)',
                    minWidth: '280px',
                  }}
                >
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDaySelect}
                    defaultMonth={selectedDate}
                    style={{
                      fontFamily: 'var(--font-body)',
                      '--rdp-accent-color': 'var(--color-gold)',
                      '--rdp-accent-background-color': '#FDF3DC',
                      '--rdp-day-height': '36px',
                      '--rdp-day-width': '36px',
                    }}
                  />
                </div>
              )}
            </div>

            <NavButton onClick={handleNext} label="Next day">
              <ChevronRight />
            </NavButton>

            {!isCurrentDay && (
              <button
                onClick={handleToday}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: 'var(--color-parchment-dark)',
                  border: `1px solid ${accentColor}`,
                  color: accentColor,
                  fontFamily: 'var(--font-body)',
                }}
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Feast indicator bar — shown when there's a named feast */}
        {liturgicalData?.feastNames?.[0] && (
          <div
            className="mt-2 text-sm truncate"
            style={{
              color: hasGreatFeast ? 'var(--color-gold)' : 'var(--color-charcoal-light)',
              fontFamily: 'var(--font-body)',
              fontStyle: hasGreatFeast ? 'normal' : 'italic',
            }}
          >
            {hasGreatFeast && (
              <span className="mr-1" aria-hidden="true">✦</span>
            )}
            {liturgicalData.feastNames[0]}
            {liturgicalData.feastNames.length > 1 && (
              <span style={{ color: 'var(--color-warm-gray)' }}>
                {' '}+ {liturgicalData.feastNames.length - 1} more
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
