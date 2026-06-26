import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useMember } from "../context/MemberContext";
import { fetchMyBazar, createMyBazarEntry, updateMyBazarEntry, deleteMyBazarEntry } from "../lib/api";
import type { MyBazarEntry } from "../types/api";
import { toast } from "../components/ui/Toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]}, ${y}`;
}

function fmtAmount(n: number) {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ── Product row (form state) ──────────────────────────────────────────────────

interface ProductRow {
  tempId:      string;
  productName: string;
  quantity:    string;
  unit:        string;
  unitPrice:   string;
  totalPrice:  number;
}

function emptyRow(): ProductRow {
  return {
    tempId:      crypto.randomUUID(),
    productName: "",
    quantity:    "",
    unit:        "",
    unitPrice:   "",
    totalPrice:  0,
  };
}

function calcTotal(qty: string, price: string): number {
  const q = parseFloat(qty);
  const p = parseFloat(price);
  if (isNaN(q) || isNaN(p)) return 0;
  return Math.round(q * p * 100) / 100;
}

// ── My Bazar Modal ────────────────────────────────────────────────────────────

interface ModalProps {
  entry:     MyBazarEntry | null;
  userId:    string;
  memberId?: string | null;
  onClose:   () => void;
  onSaved:   (entry: MyBazarEntry) => void;
}

function MyBazarModal({ entry, userId, memberId, onClose, onSaved }: ModalProps) {
  const [date, setDate]     = useState(entry?.date ?? todayStr());
  const [note, setNote]     = useState(entry?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [products, setProducts] = useState<ProductRow[]>(() =>
    entry && entry.products.length > 0
      ? entry.products.map((p) => ({
          tempId:      crypto.randomUUID(),
          productName: p.productName,
          quantity:    String(p.quantity),
          unit:        p.unit,
          unitPrice:   String(p.unitPrice),
          totalPrice:  p.totalPrice,
        }))
      : [emptyRow()]
  );

  const grandTotal = products.reduce((s, r) => s + r.totalPrice, 0);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  function updateRow(tempId: string, field: keyof ProductRow, value: string) {
    setProducts((prev) =>
      prev.map((r) => {
        if (r.tempId !== tempId) return r;
        const updated = { ...r, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.totalPrice = calcTotal(
            field === "quantity" ? value : r.quantity,
            field === "unitPrice" ? value : r.unitPrice
          );
        }
        return updated;
      })
    );
    setErrors((e) => { const n = { ...e }; delete n[`${tempId}_${field}`]; return n; });
  }

  function addRow() { setProducts((prev) => [...prev, emptyRow()]); }

  function removeRow(tempId: string) {
    setProducts((prev) => prev.length === 1 ? prev : prev.filter((r) => r.tempId !== tempId));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!date) errs.date = "Date is required.";
    products.forEach((r) => {
      if (!r.productName.trim()) errs[`${r.tempId}_productName`] = "Required";
      const qty = parseFloat(r.quantity);
      if (isNaN(qty) || qty <= 0) errs[`${r.tempId}_quantity`] = "Must be > 0";
      const up  = parseFloat(r.unitPrice);
      if (isNaN(up) || up <= 0) errs[`${r.tempId}_unitPrice`] = "Must be > 0";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        userId,
        memberId: memberId ?? null,
        date,
        note:      note.trim() || undefined,
        grandTotal,
        products:  products.map((r) => ({
          productName: r.productName.trim(),
          quantity:    parseFloat(r.quantity),
          unit:        r.unit.trim() || undefined,
          unitPrice:   parseFloat(r.unitPrice),
          totalPrice:  r.totalPrice,
        })),
      };
      const saved = entry
        ? await updateMyBazarEntry(entry.id, payload)
        : await createMyBazarEntry(payload);
      onSaved(saved);
      toast(entry ? "Bazar entry updated." : "Bazar entry saved.");
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-800 to-red-600 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">My Bazar</h2>
            <p className="text-xs text-red-200 mt-0.5">
              {entry ? "Edit bazar entry" : "Add daily market list with products"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="h-7 w-7 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-5">

            {/* Date */}
            <div className="flex flex-col gap-1">
              <label htmlFor="bazar-date" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Date <span className="text-red-500">*</span>
              </label>
              <input id="bazar-date" type="date" value={date}
                onChange={(e) => { setDate(e.target.value); setErrors((err) => { const n = {...err}; delete n.date; return n; }); }}
                className={`w-48 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none text-white placeholder:text-gray-600 ${errors.date ? "border-red-400 bg-red-950/50" : "border-[#2A2A2A] bg-[#111111]"}`}
              />
              {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
            </div>

            {/* Product table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Products <span className="text-red-500">*</span>
                </h3>
                <button type="button" onClick={addRow}
                  className="flex items-center gap-1.5 rounded-lg bg-red-900/30 border border-red-800 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/50 transition-colors">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Product
                </button>
              </div>

              <div className="rounded-xl border border-[#2A2A2A] overflow-hidden overflow-x-auto">
                <table className="min-w-[560px] w-full text-sm">
                  <thead className="bg-[#111111]">
                    <tr>
                      <th className="w-8 px-3 py-2.5 text-center text-xs font-semibold text-gray-500">SL</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Product Name</th>
                      <th className="w-20 px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Qty</th>
                      <th className="w-20 px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Unit</th>
                      <th className="w-24 px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Unit Price</th>
                      <th className="w-24 px-3 py-2.5 text-right text-xs font-semibold text-gray-500">Total</th>
                      <th className="w-10 px-2 py-2.5 text-xs font-semibold text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {products.map((row, idx) => (
                      <tr key={row.tempId} className="hover:bg-[#222222]">
                        <td className="px-3 py-1.5 text-center text-gray-500 text-xs tabular-nums">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <input type="text" value={row.productName}
                            onChange={(e) => updateRow(row.tempId, "productName", e.target.value)}
                            placeholder="e.g. Rice"
                            className={`w-full rounded border px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-red-500 text-white placeholder:text-gray-600 ${errors[`${row.tempId}_productName`] ? "border-red-400 bg-red-950/50" : "border-[#2A2A2A] bg-[#111111]"}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="any" value={row.quantity}
                            onChange={(e) => updateRow(row.tempId, "quantity", e.target.value)}
                            placeholder="0"
                            className={`w-full rounded border px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-red-500 tabular-nums text-white placeholder:text-gray-600 ${errors[`${row.tempId}_quantity`] ? "border-red-400 bg-red-950/50" : "border-[#2A2A2A] bg-[#111111]"}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="text" value={row.unit}
                            onChange={(e) => updateRow(row.tempId, "unit", e.target.value)}
                            placeholder="kg / pcs"
                            className="w-full rounded border border-[#2A2A2A] bg-[#111111] px-2 py-1.5 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="any" value={row.unitPrice}
                            onChange={(e) => updateRow(row.tempId, "unitPrice", e.target.value)}
                            placeholder="0.00"
                            className={`w-full rounded border px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-red-500 tabular-nums text-white placeholder:text-gray-600 ${errors[`${row.tempId}_unitPrice`] ? "border-red-400 bg-red-950/50" : "border-[#2A2A2A] bg-[#111111]"}`}
                          />
                        </td>
                        <td className="px-3 py-1.5 text-right text-sm font-semibold text-white tabular-nums">
                          {row.totalPrice > 0 ? fmtAmount(row.totalPrice) : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button type="button" onClick={() => removeRow(row.tempId)} disabled={products.length === 1}
                            title="Remove row"
                            className="h-6 w-6 flex items-center justify-center rounded-full text-gray-500 hover:bg-red-950/50 hover:text-red-400 disabled:opacity-25 transition-colors mx-auto">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Note */}
            <div className="flex flex-col gap-1">
              <label htmlFor="bazar-note" className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Note / Remarks (Optional)
              </label>
              <textarea id="bazar-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                placeholder="Any notes for this bazar entry…"
                className="rounded-lg border border-[#2A2A2A] bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:ring-2 focus:ring-red-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[#2A2A2A] bg-[#111111] px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-500 font-medium">Total Bazar Amount:</span>
              <span className="text-xl font-bold text-red-400 tabular-nums">{fmtAmount(grandTotal)}</span>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-[#2A2A2A] bg-[#181818] px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-[#222222] transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm">
                {saving ? "Saving…" : entry ? "Update Bazar" : "Save Bazar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

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
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="h-12 w-12 rounded-full bg-red-900/40 flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white">Delete Bazar Entry?</h3>
        <p className="mt-1 text-sm text-gray-500">
          {formatDate(entry.date)} — {fmtAmount(entry.grandTotal)} ({entry.products.length} product{entry.products.length !== 1 ? "s" : ""})
        </p>
        <p className="mt-2 text-xs text-gray-500">This action cannot be undone.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-[#222222] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={busy}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function MyBazarPage() {
  const { user } = useAuth();
  const { myMember } = useMember();

  const [entries, setEntries]         = useState<MyBazarEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [modalEntry, setModalEntry]   = useState<MyBazarEntry | null | "new">(null);
  const [deleteEntry, setDeleteEntry] = useState<MyBazarEntry | null>(null);
  const [expanded, setExpanded]       = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      setEntries(await fetchMyBazar(user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  function handleSaved(saved: MyBazarEntry) {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === saved.id);
      return exists
        ? prev.map((e) => (e.id === saved.id ? saved : e))
        : [saved, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
  }

  function handleDeleted(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleteEntry(null);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalSpent     = entries.reduce((s, e) => s + e.grandTotal, 0);
  const now            = new Date();
  const thisMonthTotal = entries
    .filter((e) => {
      const [y, m] = e.date.split("-").map(Number);
      return y === now.getFullYear() && m === now.getMonth() + 1;
    })
    .reduce((s, e) => s + e.grandTotal, 0);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#111111]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">My Bazar</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your personal daily market list</p>
          </div>
          <button type="button" onClick={() => setModalEntry("new")}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Bazar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Entries",  value: String(entries.length),    color: "text-white"    },
            { label: "This Month",     value: fmtAmount(thisMonthTotal), color: "text-red-400"  },
            { label: "All Time Spent", value: fmtAmount(totalSpent),     color: "text-red-400"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl bg-[#181818] border border-[#2A2A2A] px-5 py-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-[#2A2A2A] animate-pulse rounded-2xl border border-[#2A2A2A]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-800 bg-red-950/50 px-5 py-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button type="button" onClick={load} className="mt-3 text-sm text-red-400 underline">Try again</button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] px-6 py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-400">No bazar entries yet</p>
            <p className="mt-1 text-sm text-gray-500">Start by adding your daily market list.</p>
            <button type="button" onClick={() => setModalEntry("new")}
              className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm">
              Add Bazar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isOpen = expanded.has(entry.id);
              return (
                <div key={entry.id} className="rounded-2xl border border-[#2A2A2A] bg-[#181818] overflow-hidden">
                  <div className="flex items-center gap-4 px-5 py-4">
                    <button type="button" onClick={() => toggleExpand(entry.id)}
                      className="flex items-center gap-3 flex-1 text-left min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-red-900/30 flex items-center justify-center shrink-0">
                        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{formatDate(entry.date)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {entry.products.length} {entry.products.length === 1 ? "product" : "products"}
                          {entry.note ? ` · ${entry.note}` : ""}
                        </p>
                      </div>
                      <svg className={`ml-2 h-4 w-4 text-gray-500 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-base font-bold text-red-400 tabular-nums">{fmtAmount(entry.grandTotal)}</span>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setModalEntry(entry)} title="Edit"
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#2A2A2A] text-gray-500 hover:bg-red-900/30 hover:text-red-400 hover:border-red-800 transition-colors">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => setDeleteEntry(entry)} title="Delete"
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#2A2A2A] text-gray-500 hover:bg-red-950/50 hover:text-red-400 hover:border-red-800 transition-colors">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[#2A2A2A]">
                      <table className="w-full text-sm">
                        <thead className="bg-[#111111]">
                          <tr>
                            <th className="w-8 px-4 py-2 text-center text-xs font-semibold text-gray-500">#</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Product</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2A]">
                          {entry.products.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-[#222222]">
                              <td className="px-4 py-2 text-center text-gray-500 text-xs tabular-nums">{idx + 1}</td>
                              <td className="px-4 py-2 font-medium text-gray-300">{p.productName}</td>
                              <td className="px-4 py-2 text-right text-gray-300 tabular-nums">
                                {p.quantity}{p.unit ? <span className="ml-1 text-xs text-gray-500">{p.unit}</span> : null}
                              </td>
                              <td className="px-4 py-2 text-right text-gray-300 tabular-nums">{fmtAmount(p.unitPrice)}</td>
                              <td className="px-4 py-2 text-right font-semibold text-white tabular-nums">{fmtAmount(p.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-[#2A2A2A] bg-[#111111]">
                            <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-gray-300 text-right">
                              Total Bazar Amount
                            </td>
                            <td className="px-4 py-2.5 text-right text-base font-bold text-red-400 tabular-nums">
                              {fmtAmount(entry.grandTotal)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalEntry && user && (
        <MyBazarModal
          entry={modalEntry === "new" ? null : modalEntry}
          userId={user.id}
          memberId={myMember?.id}
          onClose={() => setModalEntry(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteEntry && (
        <DeleteConfirm
          entry={deleteEntry}
          onCancel={() => setDeleteEntry(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
