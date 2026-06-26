import type { MemberSummary } from "../types/api";
import { StatusBadge } from "./StatusBadge";
import { money, balance, balanceColor } from "../utils/format";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-gray-500">{label}</span>
      <span className="text-right tabular-nums font-medium text-gray-200">{value}</span>
    </>
  );
}

export function MemberCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#2A2A2A]" />
          <div className="h-4 w-28 rounded bg-[#2A2A2A]" />
        </div>
        <div className="h-5 w-16 rounded-full bg-[#2A2A2A]" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-[#2A2A2A]" />
        ))}
      </div>
      <div className="mt-3 h-8 w-full rounded-xl bg-[#2A2A2A]" />
    </div>
  );
}

function getInitialColor(name: string): string {
  const colors = [
    "bg-red-700", "bg-rose-700", "bg-red-800",
    "bg-rose-800", "bg-red-600", "bg-rose-600",
    "bg-red-900", "bg-rose-900",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

interface MemberCardProps {
  member: MemberSummary;
}

export function MemberCard({ member }: MemberCardProps) {
  const initial = member.memberName.charAt(0).toUpperCase();
  const avatarColor = getInitialColor(member.memberName);

  return (
    <div className="rounded-2xl border border-[#2A2A2A] bg-[#181818] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-8 w-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-semibold shrink-0`}
          >
            {initial}
          </div>
          <span className="font-semibold text-white">{member.memberName}</span>
        </div>
        <StatusBadge status={member.status} />
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <DetailRow label="Meals"       value={String(member.totalMeals)} />
        <DetailRow label="Meal Cost"   value={money(member.mealCost)} />
        <DetailRow label="Rent Share"  value={money(member.roomRentShare)} />
        <DetailRow label="Total Cost"  value={money(member.totalCost)} />
        <DetailRow label="Bazar Paid"  value={money(member.bazarPaid)} />
      </div>

      {/* Final balance banner */}
      <div
        className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold tabular-nums ${
          member.finalBalance > 0
            ? "bg-green-900/30 text-green-400"
            : member.finalBalance < 0
            ? "bg-red-900/30 text-red-400"
            : "bg-[#222222] text-gray-400"
        }`}
      >
        <span>Final Balance</span>
        <span className={balanceColor(member.finalBalance)}>{balance(member.finalBalance)}</span>
      </div>
    </div>
  );
}
