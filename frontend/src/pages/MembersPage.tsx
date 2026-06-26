import { useState, useEffect, useCallback } from "react";
import { fetchUsers, patchMember, patchMemberRole } from "../lib/api";
import type { AuthUser } from "../types/api";
import { useMember } from "../context/MemberContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/Toast";

// MembersPage shows ALL registered Supabase auth users.
// Fetched from /api/users (backend uses supabase.auth.admin.listUsers + members table merge).
// Admin can toggle role/active for users linked to a members table record (memberId != null).

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatJoined(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso.slice(0, 10); }
}

const AVATAR_COLORS = [
  "bg-red-700","bg-red-800","bg-rose-700","bg-rose-800",
  "bg-red-600","bg-rose-600","bg-red-900","bg-rose-900",
];
function avatarColor(s: string) { return AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]; }

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-900/50 px-2.5 py-0.5 text-xs font-medium text-green-400">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#222222] px-2.5 py-0.5 text-xs font-medium text-gray-500">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
      Inactive
    </span>
  );
}

function RoleBadge({ role }: { role: AuthUser["role"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${role === "admin" ? "bg-red-900/50 text-red-400" : "bg-[#222222] text-gray-500"}`}>
      {role}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MembersPage() {
  const { user: authUser } = useAuth();
  const { isAdmin } = useMember();

  const [users,     setUsers]     = useState<AuthUser[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [toggling,  setToggling]  = useState<string | null>(null); // userId
  const [roling,    setRoling]    = useState<string | null>(null); // userId

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleToggleActive(u: AuthUser) {
    if (!u.memberId) return;
    setToggling(u.id);
    try {
      const updated = await patchMember(u.memberId, !u.active);
      setUsers((prev) => prev.map((m) => m.id === u.id ? { ...m, active: updated.active } : m));
      toast(`${u.name} marked as ${updated.active ? "active" : "inactive"}.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally { setToggling(null); }
  }

  async function handleToggleRole(u: AuthUser) {
    if (!u.memberId) return;
    const newRole: AuthUser["role"] = u.role === "admin" ? "member" : "admin";
    setRoling(u.id);
    try {
      const updated = await patchMemberRole(u.memberId, newRole);
      setUsers((prev) => prev.map((m) => m.id === u.id ? { ...m, role: updated.role } : m));
      toast(`${u.name} is now ${newRole}.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally { setRoling(null); }
  }

  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 members-bg" aria-hidden="true" />
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="members-page relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Members</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading…" : `${users.length} registered users · ${activeCount} active`}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={load} className="shrink-0 rounded-lg border border-red-700 bg-[#181818] px-3 py-1.5 text-xs font-medium hover:bg-red-950/50">Retry</button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#2A2A2A]" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && users.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-[#2A2A2A] bg-[#181818] p-8 sm:p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#222222] flex items-center justify-center mx-auto mb-4">
            <svg className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-400">No users registered yet</p>
        </div>
      )}

      {/* Desktop table */}
      {!loading && users.length > 0 && (
        <>
          <div className="hidden md:block rounded-2xl border border-[#2A2A2A] bg-[#181818] shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-[#2A2A2A] text-sm">
              <thead className="bg-[#111111]">
                <tr>
                  <th className="w-10 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {users.map((u, idx) => {
                  const isSelf    = u.id === authUser?.id;
                  const canAction = isAdmin && u.memberId != null && !isSelf;
                  return (
                    <tr key={u.id} className="hover:bg-[#222222] transition-colors">
                      <td className="px-4 py-3 text-center text-gray-600 text-xs tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-full ${avatarColor(u.name)} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">
                              {u.name}
                              {isSelf && <span className="ml-1.5 text-xs text-red-400">(you)</span>}
                            </p>
                            {!u.memberId && (
                              <p className="text-xs text-gray-600">Not linked to member</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{u.email ?? "—"}</td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3"><StatusBadge active={u.active} /></td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap tabular-nums">{formatJoined(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {canAction && (
                            <>
                              <button type="button"
                                disabled={roling === u.id}
                                onClick={() => handleToggleRole(u)}
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                                  u.role === "admin"
                                    ? "bg-[#222222] text-gray-400 hover:bg-[#2A2A2A]"
                                    : "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                                }`}
                              >
                                {roling === u.id ? "…" : u.role === "admin" ? "Demote" : "Make Admin"}
                              </button>
                              <button type="button"
                                disabled={toggling === u.id}
                                onClick={() => handleToggleActive(u)}
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                                  u.active
                                    ? "bg-[#222222] text-gray-400 hover:bg-[#2A2A2A]"
                                    : "bg-green-900/30 text-green-400 hover:bg-green-900/50"
                                }`}
                              >
                                {toggling === u.id ? "…" : u.active ? "Deactivate" : "Activate"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((u) => {
              const isSelf    = u.id === authUser?.id;
              const canAction = isAdmin && u.memberId != null && !isSelf;
              return (
                <div key={u.id} className="rounded-2xl border border-[#2A2A2A] bg-[#181818] shadow-sm px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-full ${avatarColor(u.name)} flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-0.5`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {u.name}
                        {isSelf && <span className="ml-1.5 text-xs text-red-400">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{u.email ?? "—"}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Joined {formatJoined(u.createdAt)}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <RoleBadge role={u.role} />
                        <StatusBadge active={u.active} />
                      </div>
                    </div>
                  </div>
                  {canAction && (
                    <div className="mt-3 flex gap-3 border-t border-[#2A2A2A] pt-3">
                      <button type="button"
                        disabled={roling === u.id}
                        onClick={() => handleToggleRole(u)}
                        className="flex-1 rounded-xl border border-[#2A2A2A] py-1.5 text-xs font-semibold text-gray-400 hover:bg-[#222222] transition-colors disabled:opacity-40"
                      >
                        {roling === u.id ? "…" : u.role === "admin" ? "Demote" : "Make Admin"}
                      </button>
                      <button type="button"
                        disabled={toggling === u.id}
                        onClick={() => handleToggleActive(u)}
                        className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                          u.active
                            ? "border-[#2A2A2A] text-gray-400 hover:bg-[#222222]"
                            : "border-green-800 text-green-400 hover:bg-green-900/30"
                        }`}
                      >
                        {toggling === u.id ? "…" : u.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
    </div>
  );
}
