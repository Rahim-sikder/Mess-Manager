import { useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserProfileDropdown } from "./ui/UserProfileDropdown";

function AppLogo() {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigate("/summary")}
      className="flex items-center gap-2.5 shrink-0 mr-1 rounded-xl px-1 py-1 hover:bg-[#181818] transition-colors"
    >
      {imgFailed ? (
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
          M
        </div>
      ) : (
        <img
          src="/logo.png"
          alt="Logo"
          className="h-10 w-10 rounded-xl object-cover shadow-sm shrink-0"
          onError={() => setImgFailed(true)}
        />
      )}
      <div className="hidden sm:block text-left">
        <p className="font-bold text-white text-[15px] leading-tight tracking-tight">বাবা সেপাইয়ের</p>
        <p className="text-xs text-gray-500 leading-tight font-medium">গোপন চিলেকোঠা</p>
      </div>
      <span className="font-bold text-white text-[15px] tracking-tight sm:hidden">মেস</span>
    </button>
  );
}

interface TabDef {
  path: string;
  label: string;
  icon: ReactNode;
}

function IconChart() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 003 0v-13A1.5 1.5 0 0015.5 2zM9.5 6A1.5 1.5 0 008 7.5v9a1.5 1.5 0 003 0v-9A1.5 1.5 0 009.5 6zM3.5 10A1.5 1.5 0 002 11.5v5a1.5 1.5 0 003 0v-5A1.5 1.5 0 003.5 10z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  );
}

function IconUtensils() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-1.5-.75M9 12.75L7.5 18m9-5.25L18 18" />
    </svg>
  );
}

const TABS: TabDef[] = [
  { path: "/summary", label: "Summary", icon: <IconChart /> },
  { path: "/members", label: "Members", icon: <IconUsers /> },
  { path: "/bazar",   label: "Bazar",   icon: <IconBag />   },
  { path: "/meals",   label: "Meals",   icon: <IconUtensils /> },
];

export function TopBar() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  function isActive(path: string) {
    return pathname === path || pathname.startsWith(path + "/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Main row */}
        <div className="flex h-16 items-center gap-4">

          {/* Logo + Brand */}
          <AppLogo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {TABS.map((t) => (
              <button
                key={t.path}
                type="button"
                onClick={() => navigate(t.path)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(t.path)
                    ? "bg-red-600/20 text-red-400"
                    : "text-gray-400 hover:text-white hover:bg-[#181818]"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Profile dropdown */}
          <UserProfileDropdown />
        </div>

        {/* Mobile tab row */}
        <div className="md:hidden flex overflow-x-auto scrollbar-none gap-1 pb-2.5 -mx-1 px-1">
          {TABS.map((t) => (
            <button
              key={t.path}
              type="button"
              onClick={() => navigate(t.path)}
              className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive(t.path)
                  ? "bg-red-600/20 text-red-400"
                  : "text-gray-400 hover:text-white hover:bg-[#181818]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
