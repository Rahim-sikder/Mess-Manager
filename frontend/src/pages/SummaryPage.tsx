import { useState, useEffect, useCallback } from "react";
import { RentControl } from "../components/RentControl";
import { StatStrip } from "../components/StatStrip";
import { SummarySection } from "../components/SummarySection";
import { TodayWidget } from "../components/TodayWidget";
import { fetchSummary } from "../lib/api";
import type { MonthlySummary } from "../types/api";

function nowMonthYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function SummaryPage() {
  const { month: m0, year: y0 } = nowMonthYear();
  const [month, setMonth] = useState(m0);
  const [year,  setYear]  = useState(y0);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const loadSummary = useCallback(() => {
    let cancelled = false;
    setSummary(null);
    setLoading(true);
    setError(null);

    fetchSummary(month, year)
      .then((data) => {
        if (!cancelled) { setSummary(data); setLoading(false); }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load summary");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [month, year]);

  useEffect(() => loadSummary(), [loadSummary]);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 summary-bg" aria-hidden="true" />
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Content */}
      <div className="summary-page relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-6">
        <TodayWidget />

        <RentControl
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
          activeMembersCount={summary?.activeMembersCount}
          roomRentPerPerson={summary?.roomRentPerPerson}
          onSaved={loadSummary}
        />

        <StatStrip data={summary ?? undefined} loading={loading} />

        <SummarySection
          members={summary?.members}
          loading={loading}
          error={error}
          onRetry={loadSummary}
        />
      </div>
    </div>
  );
}
