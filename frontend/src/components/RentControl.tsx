import { useState, useEffect } from "react";
import { fetchRent, updateRent } from "../lib/api";
import { money } from "../utils/format";

const MONTH_NAMES = [
  "January", "February", "March",     "April",   "May",      "June",
  "July",    "August",   "September", "October", "November", "December",
];

const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => THIS_YEAR - i);

interface RentControlProps {
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  onYearChange:  (y: number) => void;
  activeMembersCount?: number;
  roomRentPerPerson?: number;
  onSaved?: () => void;
}

const selectCls =
  "rounded-xl border border-[#2A2A2A] bg-[#111111] px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors hover:border-[#333333] cursor-pointer";

export function RentControl({
  month,
  year,
  onMonthChange,
  onYearChange,
  activeMembersCount,
  roomRentPerPerson,
  onSaved,
}: RentControlProps) {
  const [rentAmount, setRentAmount] = useState<number>(12000);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFetchLoading(true);
    setError(null);
    setSaved(false);

    fetchRent(month, year)
      .then((data) => {
        if (!cancelled) { setRentAmount(data.amount); setFetchLoading(false); }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load rent");
          setFetchLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [month, year]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateRent(month, year, rentAmount);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] px-5 py-4 shadow-sm">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Filter Period</h2>
          <p className="text-xs text-gray-500 mt-0.5">Select month, year and set room rent</p>
        </div>
        {!fetchLoading && activeMembersCount !== undefined && roomRentPerPerson !== undefined && (
          <span className="hidden sm:block text-xs text-gray-400 bg-[#111111] rounded-lg px-3 py-1.5 border border-[#2A2A2A]">
            {activeMembersCount} members · {money(roomRentPerPerson)}/person
          </span>
        )}
      </div>

      {/* Controls row — 2-col grid on mobile, auto-flow row on desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-end">
        {/* Month */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400">Month</label>
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className={selectCls}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400">Year</label>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className={selectCls}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Rent amount */}
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400">Monthly Room Rent (৳)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={fetchLoading ? "" : rentAmount}
            disabled={fetchLoading}
            onChange={(e) => setRentAmount(Number(e.target.value))}
            placeholder={fetchLoading ? "Loading…" : "0"}
            className="w-full sm:w-44 rounded-xl border border-[#2A2A2A] bg-[#111111] px-3 py-2.5 text-right text-sm tabular-nums text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 outline-none transition-colors"
          />
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={fetchLoading || saving}
          className={`col-span-2 sm:col-span-1 w-full sm:w-auto rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            saved
              ? "bg-green-700 text-white"
              : "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
          }`}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      {/* Mobile rent-per-person hint */}
      {!fetchLoading && activeMembersCount !== undefined && roomRentPerPerson !== undefined && (
        <p className="sm:hidden mt-3 text-xs text-gray-500">
          {activeMembersCount} active members · {money(roomRentPerPerson)} per person
        </p>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
