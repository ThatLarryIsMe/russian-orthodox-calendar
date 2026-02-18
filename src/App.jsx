/**
 * App.jsx
 * Main application component. Manages date state, fetches liturgical data,
 * and renders the full page layout.
 */

import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.jsx';
import { CalendarPosition } from './components/CalendarPosition.jsx';
import { FeastDay } from './components/FeastDay.jsx';
import { SaintsSection } from './components/SaintCard.jsx';
import { ScriptureReadings } from './components/ScriptureReading.jsx';
import { PatristicCommentary } from './components/PatristicCommentary.jsx';
import { OrnamentDivider } from './components/OrnamentDivider.jsx';
import { LoadingSkeleton } from './components/LoadingSkeleton.jsx';
import { fetchLiturgicalDay } from './services/orthocalApi.js';

function ErrorMessage({ error, onRetry }) {
  return (
    <div
      className="rounded-xl p-8 text-center my-8"
      style={{
        background: 'var(--color-parchment-dark)',
        border: '1px solid var(--color-warm-gray-light)',
      }}
    >
      <div className="text-4xl mb-4 select-none" aria-hidden="true">☦</div>
      <h2
        className="text-xl font-medium mb-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-charcoal)' }}
      >
        Unable to Load Liturgical Data
      </h2>
      <p
        className="text-sm mb-6"
        style={{ color: 'var(--color-warm-gray)', fontFamily: 'var(--font-body)' }}
      >
        {error?.message || 'Could not connect to the liturgical calendar service.'}
        <br />
        Please check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: 'var(--color-gold)',
          color: 'white',
          border: 'none',
          fontFamily: 'var(--font-body)',
        }}
      >
        Try Again
      </button>
    </div>
  );
}

function FooterNote() {
  return (
    <footer
      className="mt-16 pt-8 pb-10 text-center"
      style={{ borderTop: '1px solid var(--color-warm-gray-pale)' }}
    >
      <div
        className="text-3xl mb-3 select-none"
        style={{ color: 'var(--color-gold-pale)', fontFamily: 'serif' }}
        aria-hidden="true"
      >
        ☦
      </div>
      <p
        className="text-sm mb-1"
        style={{ color: 'var(--color-warm-gray)', fontFamily: 'var(--font-body)' }}
      >
        Liturgical data sourced from{' '}
        <a
          href="https://orthocal.info"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-gold)' }}
        >
          orthocal.info
        </a>
        {' '}· Scripture text via bible-api.com (KJV)
      </p>
      <p
        className="text-xs"
        style={{ color: 'var(--color-warm-gray-light)', fontFamily: 'var(--font-body)' }}
      >
        Orthodox Christian Liturgical Calendar — for devotional use
      </p>
    </footer>
  );
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [liturgicalData, setLiturgicalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    setLiturgicalData(null);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    try {
      const data = await fetchLiturgicalDay(year, month, day);
      setLiturgicalData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Scroll to top when date changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen byzantine-pattern"
      style={{ background: 'var(--color-parchment)' }}
    >
      <Header
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        liturgicalData={liturgicalData}
      />

      <main className="max-w-3xl mx-auto px-4 py-10">
        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <ErrorMessage error={error} onRetry={() => loadData(selectedDate)} />
        )}

        {!loading && !error && liturgicalData && (
          <article>
            {/* Section 1: Calendar Position */}
            <CalendarPosition
              data={liturgicalData}
              selectedDate={selectedDate}
            />

            <OrnamentDivider />

            {/* Section 2: Feast Days */}
            <FeastDay data={liturgicalData} />

            <OrnamentDivider />

            {/* Section 3: Saints of the Day */}
            <SaintsSection data={liturgicalData} />

            <OrnamentDivider />

            {/* Section 4: Scripture Readings */}
            <ScriptureReadings data={liturgicalData} />

            <OrnamentDivider />

            {/* Section 5: Patristic Commentary */}
            <PatristicCommentary data={liturgicalData} />
          </article>
        )}

        <FooterNote />
      </main>
    </div>
  );
}
