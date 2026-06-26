import type { MemberStatus } from "../types/api";

const CONFIG: Record<MemberStatus, { cls: string; label: string }> = {
  GET:     { cls: "bg-green-900/50 text-green-400 ring-1 ring-green-700/40",  label: "Will Get" },
  PAY:     { cls: "bg-red-900/50 text-red-400 ring-1 ring-red-700/40",       label: "Will Pay" },
  SETTLED: { cls: "bg-[#222222] text-gray-400 ring-1 ring-[#2A2A2A]",        label: "Settled"  },
};

interface StatusBadgeProps {
  status: MemberStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { cls, label } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
