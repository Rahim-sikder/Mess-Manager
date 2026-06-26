import { useState, useEffect, useCallback } from "react";
import { fetchMealOpts, upsertMealOpt, deleteMealOpt } from "../lib/api";
import type { MealOpt, MealStatus } from "../types/api";
import { useAuth } from "../context/AuthContext";
import { useMember } from "../context/MemberContext";
import { toast } from "../components/ui/Toast";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function nowMonthYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function YesNoToggle({
  value, onChange, disabled,
}: { value: MealStatus; onChange: (v: MealStatus) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-[#2A2A2A] bg-[#111111] p-0.5 w-fit">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("yes")}
        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
          value === "yes"
            ? "bg-green-600 text-white shadow-sm"
            : "text-gray-500 hover:text-green-400 hover:bg-green-900/30"
        } disabled:opacity-50`}
      >
        Yes
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("no")}
        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
          value === "no"
            ? "bg-red-500 text-white shadow-sm"
            : "text-gray-500 hover:text-red-400 hover:bg-red-950/50"
        } disabled:opacity-50`}
      >
        No
      </button>
    </div>
  );
}

interface EditRowState {
  id: string;
  mealStatus: MealStatus;
}

export function MyMealPage() {
  const { user } = useAuth();
  const { myMember } = useMember();
  const { month: m0, year: y0 } = nowMonthYear();
  const [month, setMonth] = useState(m0);
  const [year, setYear]   = useState(y0);

  const [opts, setOpts]   = useState<MealOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Add-entry form state
  const today = new Date().toISOString().slice(0, 10);
  const [newDate, setNewDate]           = useState(today);
  const [newStatus, setNewStatus]       = useState<MealStatus>("yes");
  const [saving, setSaving]             = useState(false);

  // Inline edit state
  const [editRow, setEditRow]           = useState<EditRowState | null>(null);
  const [updating, setUpdating]         = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const data = await fetchMealOpts(user.id, month, year);
      setOpts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally { setLoading(false); }
  }, [user, month, year]);

  useEffect(() => { void load(); }, [load]);

  async function handleAdd() {
    if (!user || !newDate) return;
    setSaving(true);
    try {
      const opt = await upsertMealOpt({
        userId:     user.id,
        memberId:   myMember?.id ?? null,
        date:       newDate,
        mealStatus: newStatus,
      });
      setOpts((prev) => {
        const idx = prev.findIndex((o) => o.date === opt.date);
        if (idx >= 0) { const n = [...prev]; n[idx] = opt; return n; }
        return [...prev, opt].sort((a, b) => a.date.localeCompare(b.date));
      });
      toast(opt.mealStatus === "yes" ? "Meal marked as Yes." : "Meal marked as No.");
    } catch (err) { toast(err instanceof Error ? err.message : "Failed to save", "error"); }
    finally { setSaving(false); }
  }

  async function handleUpdate() {
    if (!editRow || !user) return;
    setUpdating(true);
    try {
      const original = opts.find((o) => o.id === editRow.id)!;
      const opt = await upsertMealOpt({
        userId:     user.id,
        memberId:   myMember?.id ?? null,
        date:       original.date,
        mealStatus: editRow.mealStatus,
      });
      setOpts((prev) => prev.map((o) => o.id === editRow.id ? opt : o));
      setEditRow(null);
      toast("Meal updated.");
    } catch (err) { toast(err instanceof Error ? err.message : "Failed to update", "error"); }
    finally { setUpdating(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteMealOpt(id);
      setOpts((prev) => prev.filter((o) => o.id !== id));
      toast("Meal entry deleted.");
    } catch (err) { toast(err instanceof Error ? err.message : "Failed to delete", "error"); }
    finally { setDeletingId(null); }
  }

  const years = [y0 - 1, y0, y0 + 1];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 mymeal-bg" aria-hidden="true" />
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="mymeal-page relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-white">My Meal Schedule</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Mark whether you'll take meals each day — {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        {/* Month/Year selector */}
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} title="Month"
            className="rounded-lg border border-[#2A2A2A] bg-[#111111] px-2.5 py-1.5 text-sm text-gray-300 focus:ring-2 focus:ring-red-500 outline-none">
            {MONTH_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} title="Year"
            className="rounded-lg border border-[#2A2A2A] bg-[#111111] px-2.5 py-1.5 text-sm text-gray-300 focus:ring-2 focus:ring-red-500 outline-none">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Add entry card */}
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-4">
        <p className="text-xs font-semibold text-gray-400 mb-3">Add / Update Entry</p>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            title="Entry date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-xl border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:ring-2 focus:ring-red-500 outline-none"
          />
          <YesNoToggle value={newStatus} onChange={setNewStatus} disabled={saving} />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newDate}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
            Save
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          If an entry already exists for that date, it will be updated automatically.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={load} className="shrink-0 rounded-lg border border-red-800 bg-[#181818] px-3 py-1.5 text-xs font-medium text-red-400">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
          <h3 className="text-sm font-semibold text-white">
            {MONTH_NAMES[month - 1]} {year} — {opts.length} {opts.length === 1 ? "entry" : "entries"}
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-gray-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {opts.filter((o) => o.mealStatus === "yes").length} Yes
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              {opts.filter((o) => o.mealStatus === "no").length} No
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {[1,2,3,4].map((i) => <div key={i} className="h-12 bg-[#2A2A2A] animate-pulse rounded-xl" />)}
          </div>
        ) : opts.length === 0 ? (
          <div className="py-8 sm:py-12 text-center">
            <p className="text-sm font-medium text-gray-400">No entries for this month</p>
            <p className="mt-1 text-xs text-gray-500">Use the form above to add your meal schedule.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden sm:table min-w-full divide-y divide-[#2A2A2A] text-sm">
              <thead className="bg-[#111111]">
                <tr>
                  {["SL","Date","Meal","Action"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${i >= 2 ? "text-center" : "text-left"} ${i === 3 ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {opts.map((opt, idx) => (
                  <tr key={opt.id} className={`hover:bg-[#222222] transition-colors ${editRow?.id === opt.id ? "bg-red-900/10" : ""}`}>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-white tabular-nums">{opt.date}</td>
                    <td className="px-4 py-3 text-center">
                      {editRow?.id === opt.id ? (
                        <div className="flex justify-center">
                          <YesNoToggle value={editRow.mealStatus} onChange={(v) => setEditRow({ ...editRow, mealStatus: v })} disabled={updating} />
                        </div>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          opt.mealStatus === "yes"
                            ? "bg-green-900/40 text-green-400"
                            : "bg-red-900/40 text-red-400"
                        }`}>
                          {opt.mealStatus === "yes" ? "Yes" : "No"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {editRow?.id === opt.id ? (
                          <>
                            <button type="button" onClick={handleUpdate} disabled={updating}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                              {updating ? "Saving…" : "Update"}
                            </button>
                            <button type="button" onClick={() => setEditRow(null)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#222222] transition-colors">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => setEditRow({ id: opt.id, mealStatus: opt.mealStatus })}
                              className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors" aria-label="Edit">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </button>
                            <button type="button" onClick={() => handleDelete(opt.id)} disabled={deletingId === opt.id}
                              className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/50 transition-colors disabled:opacity-40" aria-label="Delete">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-[#2A2A2A]">
              {opts.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs text-gray-500 tabular-nums w-5 shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white tabular-nums">{opt.date}</p>
                  </div>
                  {editRow?.id === opt.id ? (
                    <div className="flex items-center gap-1.5">
                      <YesNoToggle value={editRow.mealStatus} onChange={(v) => setEditRow({ ...editRow, mealStatus: v })} />
                      <button type="button" onClick={handleUpdate} disabled={updating}
                        className="rounded-lg px-2 py-1 text-xs font-semibold bg-red-600 text-white">
                        {updating ? "…" : "Save"}
                      </button>
                      <button type="button" onClick={() => setEditRow(null)} className="rounded-lg px-2 py-1 text-xs text-gray-400 bg-[#222222]">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${opt.mealStatus === "yes" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                        {opt.mealStatus === "yes" ? "Yes" : "No"}
                      </span>
                      <button type="button" onClick={() => setEditRow({ id: opt.id, mealStatus: opt.mealStatus })}
                        className="rounded-lg px-2 py-1 text-xs text-red-400 bg-red-900/30">Edit</button>
                      <button type="button" onClick={() => handleDelete(opt.id)} disabled={deletingId === opt.id}
                        className="rounded-lg px-2 py-1 text-xs text-red-400 bg-red-950/50 disabled:opacity-40">Del</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
