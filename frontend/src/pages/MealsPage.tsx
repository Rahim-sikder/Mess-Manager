import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMealSummary, fetchMyMealDates } from "../lib/api";
import type { MealUserSummary, EnrollmentDate } from "../types/api";
import { useAuth } from "../context/AuthContext";

// MealsPage shows ALL users' monthly meal counts for the selected month.
// Each row has a "View Details" button that opens a modal with that user's date-wise entries.

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${parseInt(day, 10)} ${MONTHS[parseInt(m, 10) - 1].slice(0, 3)}, ${y}`;
}

const AVATAR_COLORS = [
  "bg-blue-500","bg-violet-500","bg-green-500","bg-amber-500",
  "bg-rose-500","bg-cyan-500","bg-fuchsia-500","bg-teal-500",
];
function avatarColor(s: string) { return AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]; }

// ── View Details Modal ────────────────────────────────────────────────────────

function DetailsModal({
  user, month, year, onClose,
}: {
  user:    MealUserSummary;
  month:   number;
  year:    number;
  onClose: () => void;
}) {
  const [dates,   setDates]   = useState<EnrollmentDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        setDates(await fetchMyMealDates(user.userId, month, year));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally { setLoading(false); }
    }
    void load();
  }, [user.userId, month, year]);

  const lunchYes  = dates.filter((d) => d.lunchOption  === "yes").length;
  const dinnerYes = dates.filter((d) => d.dinnerOption === "yes").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full ${avatarColor(user.userName)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {user.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{user.userName}</h3>
              <p className="text-xs text-gray-500">{MONTHS[month - 1]} {year} — meal schedule</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#222222] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary strip */}
        {!loading && dates.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-[#2A2A2A] border-b border-[#2A2A2A] bg-[#111111]">
            {[
              { label: "Enrolled",     value: dates.length },
              { label: "Lunch (Yes)",  value: lunchYes     },
              { label: "Dinner (Yes)", value: dinnerYes    },
              { label: "Total Meals",  value: lunchYes + dinnerYes },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3 text-center">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-0.5 text-lg font-bold text-white tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-[#2A2A2A]" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 text-center py-6">{error}</p>
          ) : dates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No meal entries found.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
            <table className="min-w-full divide-y divide-[#2A2A2A] text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-[#111111]">
                  <th className="w-10 px-3 py-2.5 text-center">#</th>
                  <th className="px-3 py-2.5 text-left">Date</th>
                  <th className="px-3 py-2.5 text-left">Day</th>
                  <th className="px-3 py-2.5 text-center">Lunch</th>
                  <th className="px-3 py-2.5 text-center">Dinner</th>
                  <th className="px-3 py-2.5 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {dates.map((d, idx) => (
                  <tr key={d.id} className="hover:bg-[#222222]">
                    <td className="px-3 py-2.5 text-center text-gray-500 text-xs tabular-nums">{idx + 1}</td>
                    <td className="px-3 py-2.5 tabular-nums text-white whitespace-nowrap font-medium">{formatDate(d.date)}</td>
                    <td className="px-3 py-2.5 text-gray-300">{d.dayName}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${d.lunchOption === "yes" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                        {d.lunchOption === "yes" ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${d.dinnerOption === "yes" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                        {d.dinnerOption === "yes" ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs italic max-w-[140px] truncate">
                      {d.remarks ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#2A2A2A] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#2A2A2A] px-5 py-2 text-sm font-medium text-gray-300 hover:bg-[#222222] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function MealsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const now   = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const [summary, setSummary] = useState<MealUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<MealUserSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setSummary(await fetchMealSummary(month, year));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { void load(); }, [load]);

  // Aggregate totals for summary cards
  const totalUsers   = summary.length;
  const totalLunch   = summary.reduce((s, r) => s + r.lunchCount,  0);
  const totalDinner  = summary.reduce((s, r) => s + r.dinnerCount, 0);
  const totalMeals   = totalLunch + totalDinner;

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 meals-bg" aria-hidden="true" />
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="meals-page relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Meals</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            All users' meal summary for {MONTHS[month - 1]} {year}
          </p>
        </div>
        {true && (
          <button
            type="button"
            onClick={() => navigate("/enrollment")}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Meal Enrollment
          </button>
        )}
      </div>

      {/* Month/Year picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-xl border border-[#2A2A2A] bg-[#181818] overflow-hidden shadow-sm">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border-0 bg-[#111111] px-3 py-2 text-sm text-white focus:outline-none focus:ring-red-500 cursor-pointer"
            title="Month"
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <div className="w-px bg-[#2A2A2A]" />
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border-0 bg-[#111111] px-3 py-2 text-sm text-white focus:outline-none focus:ring-red-500 cursor-pointer"
            title="Year"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {!loading && (
          <span className="text-sm text-gray-500">
            {totalUsers} user{totalUsers !== 1 ? "s" : ""} enrolled
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={load}
            className="shrink-0 rounded-lg border border-red-800 bg-[#181818] px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Users Enrolled",   value: totalUsers,  border: "border-l-indigo-500", sub: "for this month"   },
            { label: "Total Lunch",      value: totalLunch,  border: "border-l-green-500",  sub: "lunch (Yes)"      },
            { label: "Total Dinner",     value: totalDinner, border: "border-l-amber-500",  sub: "dinner (Yes)"     },
            { label: "Total Meals",      value: totalMeals,  border: "border-l-violet-500", sub: "lunch + dinner"   },
          ].map(({ label, value, border, sub }) => (
            <div key={label} className={`rounded-2xl border border-l-4 bg-[#181818] border-[#2A2A2A] p-4 ${border}`}>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-white tabular-nums">{value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#2A2A2A]" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && summary.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#2A2A2A] bg-[#181818] p-8 sm:p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#222222] flex items-center justify-center mx-auto mb-4">
            <svg className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-400">
            No meal entries found for {MONTHS[month - 1]} {year}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Users can click <strong>Meal Enrollment</strong> to add their monthly meal schedule.
          </p>
          {true && (
            <button
              type="button"
              onClick={() => navigate("/enrollment")}
              className="mt-4 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm mx-auto"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Enroll Now
            </button>
          )}
        </div>
      )}

      {/* Desktop table */}
      {!loading && summary.length > 0 && (
        <>
          <div className="hidden md:block rounded-2xl border border-[#2A2A2A] bg-[#181818] overflow-hidden">
            <table className="min-w-full divide-y divide-[#2A2A2A] text-sm">
              <thead className="bg-[#111111]">
                <tr>
                  <th className="w-10 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">User Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Month</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Enrolled</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Lunch</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Dinner</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {summary.map((row, idx) => {
                  const isSelf = row.userId === user?.id;
                  return (
                    <tr key={row.userId} className={`hover:bg-[#222222] transition-colors ${isSelf ? "bg-red-900/10" : ""}`}>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-7 w-7 rounded-full ${avatarColor(row.userName)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {row.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white truncate max-w-[140px]">
                            {row.userName}
                            {isSelf && <span className="ml-1.5 text-xs text-red-400 font-normal">(you)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[160px]">
                        {row.userEmail ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {MONTHS[month - 1]} {year}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums font-medium text-gray-300">{row.enrolledDays}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                          <span className="font-semibold text-gray-300">{row.lunchCount}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                          <span className="font-semibold text-gray-300">{row.dinnerCount}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-red-900/40 text-red-400 px-2.5 py-0.5 text-xs font-bold tabular-nums">
                          {row.totalMeals}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewUser(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#222222] px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#2A2A2A] transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.574-3.007-9.964-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals row */}
              <tfoot className="bg-[#111111] border-t-2 border-[#2A2A2A]">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Totals
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-white tabular-nums">—</td>
                  <td className="px-4 py-3 text-center font-bold text-green-400 tabular-nums">{totalLunch}</td>
                  <td className="px-4 py-3 text-center font-bold text-amber-400 tabular-nums">{totalDinner}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white px-2.5 py-0.5 text-xs font-bold tabular-nums">
                      {totalMeals}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {summary.map((row) => {
              const isSelf = row.userId === user?.id;
              return (
                <div
                  key={row.userId}
                  className={`rounded-2xl border bg-[#181818] shadow-sm px-4 py-3 ${isSelf ? "border-red-900/50" : "border-[#2A2A2A]"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full ${avatarColor(row.userName)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {row.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {row.userName}
                        {isSelf && <span className="ml-1.5 text-xs text-red-400">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{row.userEmail ?? "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewUser(row)}
                      className="shrink-0 rounded-lg border border-[#2A2A2A] px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#222222] transition-colors"
                    >
                      Details
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                    {[
                      { label: "Lunch",  value: row.lunchCount,  color: "text-green-400"  },
                      { label: "Dinner", value: row.dinnerCount, color: "text-amber-400"  },
                      { label: "Total",  value: row.totalMeals,  color: "text-red-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-xl bg-[#111111] px-2 py-1.5">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* View Details Modal */}
      {viewUser && (
        <DetailsModal
          user={viewUser}
          month={month}
          year={year}
          onClose={() => setViewUser(null)}
        />
      )}
    </div>
    </div>
  );
}
