import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchEnrollments, fetchEnrollmentDates, createEnrollment,
  patchEnrollmentDate, deleteEnrollment,
} from "../lib/api";
import type { Enrollment, EnrollmentDate, LunchDinnerOption } from "../types/api";
import { useAuth } from "../context/AuthContext";
import { useMember } from "../context/MemberContext";
import { toast } from "../components/ui/Toast";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_ABBR = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function monthLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]} - ${year}`;
}

function formatDateCell(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}-${MONTH_ABBR[parseInt(m) - 1]}-${y}`;
}

function nowMonthYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

// ── Yes/No segmented button ──────────────────────────────────────────────────
function MealToggle({
  value, onChange, disabled, size = "md",
}: {
  value: LunchDinnerOption;
  onChange: (v: LunchDinnerOption) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? "px-2.5 py-1" : "px-3.5 py-1.5";
  const text = size === "sm" ? "text-xs" : "text-xs font-semibold";
  return (
    <div className={`inline-flex rounded-lg border border-[#2A2A2A] overflow-hidden ${disabled ? "opacity-50" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("yes")}
        className={`${px} ${text} transition-colors border-r border-[#2A2A2A] ${
          value === "yes"
            ? "bg-red-600 text-white shadow-sm"
            : "bg-[#222222] text-gray-500 hover:bg-[#2a2a2a] hover:text-gray-300"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("no")}
        className={`${px} ${text} transition-colors ${
          value === "no"
            ? "bg-[#111111] text-gray-300 shadow-sm"
            : "bg-[#222222] text-gray-500 hover:bg-[#2a2a2a] hover:text-gray-300"
        }`}
      >
        No
      </button>
    </div>
  );
}

// ── New Enrollment Modal ─────────────────────────────────────────────────────
function NewEnrollmentModal({
  existingMonths,
  onClose,
  onCreated,
}: {
  existingMonths: Set<string>;
  onClose: () => void;
  onCreated: (enrollment: Enrollment, dates: EnrollmentDate[]) => void;
}) {
  const { user } = useAuth();
  const { myMember } = useMember();
  const { month: m0, year: y0 } = nowMonthYear();
  const [month, setMonth]             = useState(m0);
  const [year, setYear]               = useState(y0);
  const [defaultLunch, setLunch]      = useState<LunchDinnerOption>("yes");
  const [defaultDinner, setDinner]    = useState<LunchDinnerOption>("yes");
  const [remarks, setRemarks]         = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const years = [y0 - 1, y0, y0 + 1];
  const key = `${month}-${year}`;
  const alreadyExists = existingMonths.has(key);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (alreadyExists) { setError("Enrollment for this month already exists."); return; }
    if (!user) return;
    setSaving(true); setError(null);
    try {
      const result = await createEnrollment({
        userId:    user.id,
        memberId:  myMember?.id ?? null,
        month, year, defaultLunch, defaultDinner,
        remarks:   remarks.trim() || undefined,
      });
      onCreated(result, result.dates);
      toast(`Enrollment created for ${monthLabel(month, year)}.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create enrollment");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#181818] shadow-2xl rounded-2xl overflow-hidden border border-[#2A2A2A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] bg-gradient-to-r from-red-950/50 to-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-red-900/30 flex items-center justify-center">
              <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white">New Meal Enrollment</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-[#222222] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Month + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Month <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  title="Month"
                  className="w-full appearance-none rounded-xl border border-[#2A2A2A] bg-[#111111] px-3 py-2.5 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer transition"
                >
                  {MONTH_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Year <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  title="Year"
                  className="w-full appearance-none rounded-xl border border-[#2A2A2A] bg-[#111111] px-3 py-2.5 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer transition"
                >
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {alreadyExists && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-800 bg-amber-950/50 px-3 py-2 text-xs text-amber-400">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              Enrollment for {monthLabel(month, year)} already exists.
            </div>
          )}

          {/* Default Lunch + Dinner */}
          <div className="rounded-xl border border-[#2A2A2A] overflow-hidden divide-y divide-[#2A2A2A]">
            <div className="flex items-center justify-between px-4 py-3 bg-[#111111]">
              <div>
                <p className="text-sm font-medium text-white">Default Lunch</p>
                <p className="text-xs text-gray-600">Applied to all days</p>
              </div>
              <MealToggle value={defaultLunch} onChange={setLunch} />
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-[#111111]">
              <div>
                <p className="text-sm font-medium text-white">Default Dinner</p>
                <p className="text-xs text-gray-600">Applied to all days</p>
              </div>
              <MealToggle value={defaultDinner} onChange={setDinner} />
            </div>
          </div>

          {/* Remarks */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Remarks <span className="text-gray-600 font-normal">(optional)</span></label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Any notes or remarks for this enrollment…"
              className="w-full rounded-xl border border-[#2A2A2A] bg-[#111111] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#2A2A2A] px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-[#222222] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || alreadyExists}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating…
                </>
              ) : "Create Enrollment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function MealEnrollmentPage() {
  const { user } = useAuth();
  const { myMember } = useMember();
  const navigate = useNavigate();

  const [enrollments, setEnrollments]   = useState<Enrollment[]>([]);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [dates, setDates]               = useState<EnrollmentDate[]>([]);
  const [search, setSearch]             = useState("");
  const [showModal, setShowModal]       = useState(false);
  const [loadingList, setLoadingList]   = useState(true);
  const [loadingDates, setLoadingDates] = useState(false);
  const [savingId, setSavingId]         = useState<string | null>(null);
  const [clearing, setClearing]         = useState(false);
  const [listError, setListError]       = useState<string | null>(null);

  const selectedEnrollment = enrollments.find((e) => e.id === selectedId) ?? null;

  const loadEnrollments = useCallback(async () => {
    if (!user) return;
    setLoadingList(true); setListError(null);
    try {
      const list = await fetchEnrollments(user.id);
      setEnrollments(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load");
    } finally { setLoadingList(false); }
  }, [user, selectedId]);

  const loadDates = useCallback(async (enrollmentId: string) => {
    setLoadingDates(true);
    try {
      const d = await fetchEnrollmentDates(enrollmentId);
      setDates(d);
    } catch {
      setDates([]);
    } finally { setLoadingDates(false); }
  }, []);

  useEffect(() => { void loadEnrollments(); }, [loadEnrollments]);

  useEffect(() => {
    if (selectedId) void loadDates(selectedId);
    else setDates([]);
  }, [selectedId, loadDates]);

  async function handleUpdate(
    dateId: string,
    field: "lunchOption" | "dinnerOption",
    newValue: LunchDinnerOption
  ) {
    const prevDate = dates.find((d) => d.id === dateId);
    if (!prevDate || prevDate[field] === newValue) return;
    const oldValue = prevDate[field];

    setSavingId(dateId);
    setDates((prev) => prev.map((d) => d.id === dateId ? { ...d, [field]: newValue } : d));
    try {
      await patchEnrollmentDate(dateId, { [field]: newValue });
    } catch (err) {
      setDates((prev) => prev.map((d) => d.id === dateId ? { ...d, [field]: oldValue } : d));
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally { setSavingId(null); }
  }

  async function handleClear() {
    if (!selectedId || !selectedEnrollment) return;
    const label = monthLabel(selectedEnrollment.month, selectedEnrollment.year);
    if (!confirm(`Clear all meal enrollment for ${label}? This cannot be undone.`)) return;
    setClearing(true);
    try {
      await deleteEnrollment(selectedId);
      setEnrollments((prev) => prev.filter((e) => e.id !== selectedId));
      setSelectedId(null);
      setDates([]);
      toast(`${label} enrollment cleared.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to clear", "error");
    } finally { setClearing(false); }
  }

  function handleCreated(enrollment: Enrollment, newDates: EnrollmentDate[]) {
    setEnrollments((prev) => [enrollment, ...prev]);
    setSelectedId(enrollment.id);
    setDates(newDates);
  }

  const existingMonths = new Set(enrollments.map((e) => `${e.month}-${e.year}`));

  const filtered = enrollments.filter((e) =>
    monthLabel(e.month, e.year).toLowerCase().includes(search.toLowerCase())
  );

  const displayName = myMember?.name ?? user?.email?.split("@")[0] ?? "User";

  // Meal counts summary
  const yesLunch   = dates.filter((d) => d.lunchOption  === "yes").length;
  const yesDinner  = dates.filter((d) => d.dinnerOption === "yes").length;
  const totalDays  = dates.length;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">

      {/* ── Mobile month picker (shown only on mobile) ──────────────────── */}
      <div className="md:hidden bg-[#111111] border-b border-[#2A2A2A] px-4 py-3 flex items-center gap-2">
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          title="Select enrollment month"
          className="flex-1 min-w-0 rounded-xl border border-[#2A2A2A] bg-[#181818] px-3 py-2 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none"
        >
          <option value="">Select a month…</option>
          {enrollments.map((e) => (
            <option key={e.id} value={e.id}>{monthLabel(e.month, e.year)}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="shrink-0 rounded-xl bg-red-600 p-2.5 text-white hover:bg-red-700 transition-colors shadow-sm"
          title="New Enrollment"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* ── Left Sidebar (desktop only) ──────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[#2A2A2A] bg-[#111111]">
        {/* Sidebar header */}
        <div className="px-3 pt-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-1 mb-2">Meal Months</p>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search months..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#2A2A2A] bg-[#181818] text-xs text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

        {/* Month list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {loadingList ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#2A2A2A] animate-pulse rounded-xl mx-1" />
            ))
          ) : listError ? (
            <p className="text-xs text-red-500 px-3 py-2">{listError}</p>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-gray-600">No enrollments yet.</p>
              <button type="button" onClick={() => setShowModal(true)} className="mt-2 text-xs text-red-400 hover:underline">
                Create one →
              </button>
            </div>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelectedId(e.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group ${
                  selectedId === e.id
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-gray-400 hover:bg-[#1a1a1a]"
                }`}
              >
                <p className="text-sm font-semibold truncate">{monthLabel(e.month, e.year)}</p>
                <p className={`text-xs mt-0.5 ${selectedId === e.id ? "text-red-100" : "text-gray-600"}`}>
                  {new Date(e.year, e.month, 0).getDate()} days
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Breadcrumb + Actions */}
        <div className="sticky top-0 z-10 bg-[#030303] border-b border-[#2A2A2A] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <nav className="flex items-center gap-1.5 text-sm">
            <button type="button" onClick={() => navigate(-1)} className="text-red-400 hover:underline">Home</button>
            <svg className="h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            <span className="font-semibold text-white">Meal Enrollment</span>
          </nav>
          <div className="flex items-center gap-2">
            {selectedId && (
              <button
                type="button"
                onClick={handleClear}
                disabled={clearing}
                className="rounded-lg border border-red-800 bg-[#181818] px-3.5 py-1.5 text-sm font-medium text-red-400 hover:bg-red-950/50 disabled:opacity-50 transition-colors"
              >
                {clearing ? "Clearing…" : "Clear"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="hidden md:flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              New Enrollment
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {!selectedEnrollment ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-24 text-center">
              <div className="h-16 w-16 rounded-2xl bg-red-900/30 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-300">No enrollment selected</p>
              <p className="mt-1 text-sm text-gray-500">Select a month from the sidebar or create a new enrollment.</p>
              <button type="button" onClick={() => setShowModal(true)}
                className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm">
                New Meal Enrollment
              </button>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-red-950/50 to-[#181818] px-5 py-3">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Meal Enrollment Summary</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A2A] p-0">
                  {[
                    { label: "Employee / User", value: displayName },
                    { label: "Meal Month", value: monthLabel(selectedEnrollment.month, selectedEnrollment.year) },
                    { label: "Lunch Days", value: `${yesLunch} of ${totalDays} days` },
                    { label: "Dinner Days", value: `${yesDinner} of ${totalDays} days` },
                  ].map(({ label, value }) => (
                    <div key={label} className="px-5 py-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-white truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Table */}
              <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2A2A] bg-[#111111]">
                  <h3 className="text-sm font-semibold text-white">
                    Daily Meal Details — {monthLabel(selectedEnrollment.month, selectedEnrollment.year)}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />Lunch Yes: {yesLunch}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />Dinner Yes: {yesDinner}
                    </span>
                  </div>
                </div>

                {loadingDates ? (
                  <div className="p-5 space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="h-10 bg-[#2A2A2A] animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : dates.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-600">No date entries found.</div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="min-w-[560px] w-full divide-y divide-[#2A2A2A] text-sm">
                      <thead className="bg-[#111111]">
                        <tr>
                          {["#","Meal Date","Day","Lunch Option","Dinner Option","Remarks"].map((h, i) => (
                            <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap ${i === 0 ? "text-center w-10" : i <= 2 ? "text-left" : "text-center"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A2A2A]">
                        {dates.map((d, idx) => {
                          const isWeekend = d.dayName === "Friday" || d.dayName === "Saturday";
                          const isSaving  = savingId === d.id;
                          return (
                            <tr
                              key={d.id}
                              className={`transition-colors ${isSaving ? "bg-red-950/20" : isWeekend ? "bg-[#151515]" : "hover:bg-[#222222]"}`}
                            >
                              <td className="px-4 py-2.5 text-center text-gray-500 tabular-nums text-xs">{idx + 1}</td>
                              <td className="px-4 py-2.5 tabular-nums font-medium text-white whitespace-nowrap">
                                {formatDateCell(d.date)}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`text-xs font-medium ${isWeekend ? "text-red-400" : "text-gray-500"}`}>
                                  {d.dayName}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <MealToggle
                                  value={d.lunchOption}
                                  onChange={(v) => handleUpdate(d.id, "lunchOption", v)}
                                  disabled={isSaving}
                                  size="sm"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <MealToggle
                                  value={d.dinnerOption}
                                  onChange={(v) => handleUpdate(d.id, "dinnerOption", v)}
                                  disabled={isSaving}
                                  size="sm"
                                />
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs italic">
                                {d.remarks ?? "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showModal && (
        <NewEnrollmentModal
          existingMonths={existingMonths}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
