import { useState, useEffect } from "react";
import { fetchToday } from "../lib/api";
import type { TodayData, EntryStatus } from "../types/api";

const AVATAR_COLORS = [
  "bg-red-700","bg-red-800","bg-rose-700","bg-red-600",
  "bg-rose-800","bg-red-900","bg-rose-600","bg-red-700",
];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function StatusDot({ status }: { status: EntryStatus }) {
  const cls =
    status === "approved" ? "bg-green-500" :
    status === "rejected" ? "bg-red-500" : "bg-amber-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls} shrink-0`} />;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function TodayWidget() {
  const [data, setData]       = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchToday()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#2A2A2A] bg-gradient-to-r from-red-950/50 to-[#181818] flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-900/30 shrink-0">
            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Today</p>
            {data && <p className="text-xs text-gray-500 truncate">{formatDate(data.date)}</p>}
          </div>
        </div>
        {!loading && data && (
          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="rounded-full bg-red-900/50 px-2.5 py-1 font-medium text-red-400 whitespace-nowrap">
              {data.totalMeals} meals
            </span>
            <span className="rounded-full bg-green-900/50 px-2.5 py-1 font-medium text-green-400 whitespace-nowrap">
              ৳{data.totalBazar.toFixed(0)} bazar
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-4 sm:p-5 space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-[#2A2A2A]" />)}
        </div>
      ) : error ? (
        <div className="px-4 sm:px-5 py-4 text-sm text-red-400">{error}</div>
      ) : !data || (data.meals.length === 0 && data.bazar.length === 0) ? (
        <div className="px-4 sm:px-5 py-6 sm:py-8 text-center">
          <p className="text-sm font-medium text-gray-400">No submissions today</p>
          <p className="mt-1 text-xs text-gray-600">Meal and bazar entries for today will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2A2A2A]">
          {/* Meals section */}
          <div className="p-3 sm:p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Meals ({data.meals.length})
            </p>
            {data.meals.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No meal submissions</p>
            ) : (
              <div className="space-y-2">
                {data.meals.map((m, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-full ${avatarColor(m.memberName)} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                      {m.memberName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">{m.memberName}</p>
                      <p className="text-xs text-gray-500">
                        B:{m.breakfast} L:{m.lunch} D:{m.dinner} = {m.total}
                      </p>
                    </div>
                    <StatusDot status={m.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bazar section */}
          <div className="p-3 sm:p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Bazar ({data.bazar.length})
            </p>
            {data.bazar.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No bazar entries</p>
            ) : (
              <div className="space-y-2">
                {data.bazar.map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-full ${avatarColor(b.memberName)} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                      {b.memberName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">{b.memberName}</p>
                      <p className="text-xs text-gray-500 truncate">{b.description ?? b.category ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-semibold text-gray-200">৳{b.amount.toFixed(2)}</span>
                      <StatusDot status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
