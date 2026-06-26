import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllBazar, deleteMyBazarEntry } from "../lib/api";
import type { MyBazarEntry } from "../types/api";
import { useAuth } from "../context/AuthContext";
import { useMember } from "../context/MemberContext";
import { toast } from "../components/ui/Toast";

// BazarPage now shows ALL users' my_bazar_entries.
// "Add Bazar Entry" navigates to the user's own MyBazarPage.

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAmount(n: number) {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]}, ${y}`;
}

const AVATAR_COLORS = ["bg-red-700","bg-red-800","bg-rose-700","bg-rose-800","bg-red-600","bg-rose-600","bg-red-900","bg-rose-900"];
function avatarColor(s: string) { return AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]; }

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ entry, onCancel, onDeleted }: {
  entry:     MyBazarEntry;
  onCancel:  () => void;
  onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await deleteMyBazarEntry(entry.id);
      onDeleted(entry.id);
      toast("Bazar entry deleted.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white">Delete Entry?</h3>
        <p className="mt-1 text-sm text-gray-400">{formatDate(entry.date)} — {fmtAmount(entry.grandTotal)}</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-[#222222]">Cancel</button>
          <button type="button" onClick={confirm} disabled={busy} className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BazarPage() {
  const { user } = useAuth();
  const { isAdmin } = useMember();

  const [entries, setEntries]         = useState<MyBazarEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const navigate = useNavigate();
  const [expanded, setExpanded]       = useState<Set<string>>(new Set());
  const [deleteEntry, setDeleteEntry] = useState<MyBazarEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setEntries(await fetchAllBazar());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Summary stats
  const totalAmount   = entries.reduce((s, e) => s + e.grandTotal, 0);
  const uniqueUsers   = new Set(entries.map((e) => e.userId)).size;

  // Per-user totals for "Highest Paid"
  const userTotals = new Map<string, { name: string; total: number }>();
  for (const e of entries) {
    const key  = e.userId;
    const name = e.memberName ?? e.userId.slice(0, 8);
    const cur  = userTotals.get(key);
    cur ? (cur.total += e.grandTotal) : userTotals.set(key, { name, total: e.grandTotal });
  }
  const topUser = [...userTotals.values()].sort((a, b) => b.total - a.total)[0] ?? null;


  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bazar-bg" aria-hidden="true" />
      <div className="fixed inset-0 bg-black/35" aria-hidden="true" />

      {/* Content */}
      <div className="bazar-page relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Bazar</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            All members' market entries · {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <button type="button" onClick={() => navigate("/my-bazar")}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Bazar Entry
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={load} className="shrink-0 rounded-lg border border-red-800 bg-red-950/50 px-3 py-1.5 text-xs font-medium hover:bg-red-900/50">Retry</button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Bazar",           value: fmtAmount(totalAmount), sub: "all entries",          border: "border-l-green-500"  },
          { label: "Total Entries",          value: String(entries.length), sub: "transactions",         border: "border-l-blue-500"   },
          { label: "Highest Paid",           value: topUser?.name ?? "—",  sub: topUser ? fmtAmount(topUser.total) : undefined, border: "border-l-amber-500" },
          { label: "Members Contributed",    value: String(uniqueUsers),   sub: "unique users",         border: "border-l-violet-500" },
        ].map(({ label, value, sub, border }) => (
          <div key={label} className={`rounded-2xl border bg-[#181818] p-4 border-[#2A2A2A] border-l-4 ${border}`}>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-bold text-white truncate tabular-nums">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#2A2A2A]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2A2A2A] bg-[#181818] p-8 sm:p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#222222] flex items-center justify-center mx-auto mb-4">
            <svg className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-400">No bazar entries yet</p>
          <p className="mt-1 text-sm text-gray-600">Click "Add Bazar Entry" to get started.</p>
          <button type="button" onClick={() => navigate("/my-bazar")}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm">
            Add Bazar Entry
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-[#2A2A2A] bg-[#181818] overflow-hidden">
            <table className="min-w-full divide-y divide-[#2A2A2A] text-sm">
              <thead className="bg-[#111111]">
                <tr>
                  {["#","Date","User / Member","Products","Total Amount","Action"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${i === 0 ? "text-center w-10" : i >= 4 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {entries.map((e, idx) => {
                  const isOwner = user?.id === e.userId;
                  const canDelete = isOwner || isAdmin;
                  const name = e.memberName ?? e.userId.slice(0, 8) + "…";
                  const isOpen = expanded.has(e.id);
                  return (
                    <>
                      <tr key={e.id} className="hover:bg-[#222222] transition-colors cursor-pointer" onClick={() => toggleExpand(e.id)}>
                        <td className="px-4 py-3 text-center text-gray-500 text-xs tabular-nums">{idx + 1}</td>
                        <td className="px-4 py-3 tabular-nums text-gray-300 whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white truncate max-w-[140px]">
                              {name}
                              {isOwner && <span className="ml-1 text-xs text-red-400">(you)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <span className="text-xs bg-[#222222] text-gray-400 rounded-full px-2 py-0.5">
                            {e.products.length} {e.products.length === 1 ? "item" : "items"}
                          </span>
                          {e.products.length > 0 && (
                            <span className="ml-2 text-xs text-gray-500 truncate max-w-[120px] inline-block align-middle">
                              {e.products.slice(0, 2).map(p => p.productName).join(", ")}
                              {e.products.length > 2 ? "…" : ""}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-white tabular-nums">{fmtAmount(e.grandTotal)}</td>
                        <td className="px-4 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                          {canDelete && (
                            <button type="button" onClick={() => setDeleteEntry(e)}
                              className="rounded-lg p-1.5 text-gray-600 hover:bg-red-950/40 hover:text-red-400 transition-colors" title="Delete">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${e.id}-exp`} className="bg-[#111111]">
                          <td colSpan={6} className="px-8 pb-3">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-500">
                                  <th className="text-left pb-1 font-semibold w-8">#</th>
                                  <th className="text-left pb-1 font-semibold">Product</th>
                                  <th className="text-right pb-1 font-semibold w-20">Qty</th>
                                  <th className="text-right pb-1 font-semibold w-24">Unit Price</th>
                                  <th className="text-right pb-1 font-semibold w-24">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#2A2A2A]">
                                {e.products.map((p, pi) => (
                                  <tr key={p.id}>
                                    <td className="py-1 text-gray-500">{pi + 1}</td>
                                    <td className="py-1 font-medium text-gray-300">{p.productName}</td>
                                    <td className="py-1 text-right text-gray-500 tabular-nums">{p.quantity}{p.unit ? ` ${p.unit}` : ""}</td>
                                    <td className="py-1 text-right text-gray-500 tabular-nums">{fmtAmount(p.unitPrice)}</td>
                                    <td className="py-1 text-right font-semibold text-white tabular-nums">{fmtAmount(p.totalPrice)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {e.note && <p className="mt-2 text-xs text-gray-500 italic">Note: {e.note}</p>}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {entries.map((e) => {
              const isOwner = user?.id === e.userId;
              const name = e.memberName ?? e.userId.slice(0, 8) + "…";
              const isOpen = expanded.has(e.id);
              return (
                <div key={e.id} className="rounded-2xl border border-[#2A2A2A] bg-[#181818] overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3" onClick={() => toggleExpand(e.id)}>
                    <div className={`h-9 w-9 rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {name}{isOwner && <span className="ml-1 text-xs text-red-400">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(e.date)} · {e.products.length} items</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white tabular-nums">{fmtAmount(e.grandTotal)}</p>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-[#2A2A2A] px-4 py-3 space-y-1">
                      {e.products.map((p) => (
                        <div key={p.id} className="flex justify-between text-xs">
                          <span className="text-gray-500">{p.productName} ({p.quantity}{p.unit ? ` ${p.unit}` : ""})</span>
                          <span className="font-semibold text-white tabular-nums">{fmtAmount(p.totalPrice)}</span>
                        </div>
                      ))}
                      {(isOwner || isAdmin) && (
                        <button type="button" onClick={() => setDeleteEntry(e)}
                          className="mt-2 text-xs text-red-400 hover:underline">Delete entry</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {deleteEntry && (
        <DeleteConfirm
          entry={deleteEntry}
          onCancel={() => setDeleteEntry(null)}
          onDeleted={(id) => { setEntries((prev) => prev.filter((e) => e.id !== id)); setDeleteEntry(null); }}
        />
      )}
    </div>
    </div>
  );
}
