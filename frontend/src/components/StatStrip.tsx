import type { ReactNode } from "react";
import type { MonthlySummary } from "../types/api";
import { money } from "../utils/format";

interface StatCardProps {
  label:    string;
  value:    string;
  sub?:     string;
  accent:   string;      // border-l-* class
  iconBg:   string;      // bg-* class for icon container
  iconText: string;      // text-* class for icon
  icon:     ReactNode;
}

function StatCard({ label, value, sub, accent, iconBg, iconText, icon }: StatCardProps) {
  return (
    <div className={`rounded-2xl border border-[#2A2A2A] bg-[#181818] p-4 shadow-sm border-l-4 ${accent} flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 leading-tight">
          {label}
        </span>
        <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <span className={iconText}>{icon}</span>
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white tabular-nums leading-none">
          {value}
        </div>
        {sub && <p className="mt-1 text-xs text-gray-600">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-4 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-3 w-20 rounded bg-[#2A2A2A]" />
        <div className="h-8 w-8 rounded-lg bg-[#2A2A2A]" />
      </div>
      <div className="h-7 w-24 rounded bg-[#2A2A2A]" />
    </div>
  );
}

function IconPeople() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconMeals() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-1.5-.75" />
    </svg>
  );
}

function IconBazar() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  );
}

function IconRate() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
    </svg>
  );
}

function IconRent() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

interface StatStripProps {
  data?: MonthlySummary;
  loading?: boolean;
}

export function StatStrip({ data, loading }: StatStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {loading || !data ? (
        Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
      ) : (
        <>
          <StatCard
            label="Active Members"
            value={String(data.activeMembersCount)}
            sub="registered users"
            accent="border-l-red-600"
            iconBg="bg-red-900/30"
            iconText="text-red-400"
            icon={<IconPeople />}
          />
          <StatCard
            label="Total Meals"
            value={String(data.totalMeals)}
            sub="this period"
            accent="border-l-red-600"
            iconBg="bg-red-900/30"
            iconText="text-red-400"
            icon={<IconMeals />}
          />
          <StatCard
            label="Total Bazar"
            value={money(data.totalBazar)}
            sub="market spend"
            accent="border-l-red-600"
            iconBg="bg-red-900/30"
            iconText="text-red-400"
            icon={<IconBazar />}
          />
          <StatCard
            label="Meal Rate"
            value={money(data.mealRate)}
            sub="per meal"
            accent="border-l-red-600"
            iconBg="bg-red-900/30"
            iconText="text-red-400"
            icon={<IconRate />}
          />
          <StatCard
            label="Room Rent"
            value={money(data.monthlyRoomRent)}
            sub={`${money(data.roomRentPerPerson)}/person`}
            accent="border-l-red-600"
            iconBg="bg-red-900/30"
            iconText="text-red-400"
            icon={<IconRent />}
          />
        </>
      )}
    </div>
  );
}
