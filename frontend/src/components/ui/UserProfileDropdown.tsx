import { useState, useRef, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ProfileModal } from "./ProfileModal";

function getInitial(user: User): string {
  const name = user.user_metadata?.full_name as string | undefined;
  if (name) return name.charAt(0).toUpperCase();
  return (user.email ?? "U").charAt(0).toUpperCase();
}

function getDisplayName(user: User): string {
  const name = user.user_metadata?.full_name as string | undefined;
  if (name) return name;
  const prefix = (user.email ?? "User").split("@")[0];
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function getPhone(user: User): string | null {
  return (user.user_metadata?.phone_number as string | undefined) ?? null;
}

function getAvatarUrl(user: User): string | null {
  return (user.user_metadata?.avatar_url as string | undefined) ?? null;
}

function Avatar({ user, size = "sm" }: { user: User; size?: "sm" | "md" }) {
  const [imgErr, setImgErr] = useState(false);
  const avatarUrl = getAvatarUrl(user);
  const initial   = getInitial(user);
  const dim       = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";

  if (avatarUrl && !imgErr) {
    return (
      <img
        src={avatarUrl}
        alt={getDisplayName(user)}
        className={`${dim} rounded-full object-cover shrink-0 shadow-sm border border-slate-200`}
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold shrink-0 shadow-sm`}>
      {initial}
    </div>
  );
}

function IconBazar() {
  return (
    <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

export function UserProfileDropdown() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open,        setOpen]        = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  if (!user) return null;

  const name  = getDisplayName(user);
  const email = user.email ?? "";
  const phone = getPhone(user);

  function nav(path: string) {
    setOpen(false);
    navigate(path);
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 hover:bg-[#181818] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <Avatar user={user} size="sm" />
          <span className="hidden sm:block text-sm font-medium text-gray-300 max-w-[120px] truncate">
            {name}
          </span>
          <IconChevron open={open} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#2A2A2A] bg-[#181818] shadow-2xl z-50 overflow-hidden">
            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-4">
              <Avatar user={user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{name}</p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
                {phone && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{phone}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-[#2A2A2A] mx-3" />

            {/* Quick actions */}
            <div className="p-1.5">
              <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Access</p>
              <button type="button" onClick={() => nav("/my-bazar")}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white hover:bg-[#222222] active:bg-[#222222] transition-colors">
                <IconBazar />
                <span>My Bazar</span>
                <span className="ml-auto text-xs text-gray-400">My expenses</span>
              </button>
              <button type="button" onClick={() => nav("/enrollment")}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white hover:bg-[#222222] active:bg-[#222222] transition-colors">
                <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
                <span>Meal Enrollment</span>
                <span className="ml-auto text-xs text-gray-400">Schedule</span>
              </button>
            </div>

            <div className="h-px bg-[#2A2A2A] mx-3" />

            <div className="p-1.5">
              <button
                type="button"
                onClick={() => { setOpen(false); setShowProfile(true); }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white hover:bg-[#222222] active:bg-[#222222] transition-colors"
              >
                <IconProfile /> Profile
              </button>
              <button type="button" onClick={() => nav("/summary")}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white hover:bg-[#222222] active:bg-[#222222] transition-colors">
                <IconSettings /> Settings
              </button>
            </div>

            <div className="h-px bg-[#2A2A2A] mx-3" />

            <div className="p-1.5">
              <button type="button" onClick={() => { setOpen(false); void signOut(); }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-950/50 active:bg-red-950/50 transition-colors">
                <IconSignOut /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}
