import { useState, useEffect } from "react";
import { fetchMembers } from "../lib/api";
import { useMember } from "../context/MemberContext";
import type { Member } from "../types/api";

const AVATAR_COLORS = [
  "bg-blue-500","bg-violet-500","bg-green-500","bg-amber-500",
  "bg-rose-500","bg-cyan-500","bg-fuchsia-500","bg-teal-500",
];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function MemberLinkModal({ onSkip }: { onSkip: () => void }) {
  const { link } = useMember();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetchMembers()
      .then((data) => setMembers(data.filter((m) => m.active)))
      .catch(() => setError("Couldn't load members — try refreshing."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(memberId: string) {
    setLinking(memberId);
    setError(null);
    try {
      await link(memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link member.");
      setLinking(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <button type="button" onClick={onSkip} className="rounded-lg p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors" aria-label="Skip for now">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-base font-bold">Who are you?</h2>
          <p className="mt-1 text-sm text-indigo-100">
            Select your name to link your account to a mess member profile.
          </p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="py-4 space-y-3 text-center">
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchMembers()
                    .then((data) => setMembers(data.filter((m) => m.active)))
                    .catch(() => setError("Couldn't load members — try refreshing."))
                    .finally(() => setLoading(false));
                }}
                className="text-xs text-indigo-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No active members found. Ask your admin to add you first.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelect(m.id)}
                  disabled={!!linking}
                  className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-all disabled:opacity-50"
                >
                  <div className={`h-9 w-9 rounded-full ${avatarColor(m.name)} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{m.role}</p>
                  </div>
                  {linking === m.id && (
                    <svg className="h-4 w-4 animate-spin text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-slate-400">
            This links your login to your member profile for meal and bazar submissions.
          </p>
        </div>
      </div>
    </div>
  );
}
