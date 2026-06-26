import type { MemberSummary } from "../types/api";
import { StatusBadge } from "./StatusBadge";
import { money, balance, balanceColor } from "../utils/format";

const HEADERS: { label: string; align: "left" | "right" }[] = [
  { label: "Member",           align: "left"  },
  { label: "Total Meals",      align: "right" },
  { label: "Meal Cost",        align: "right" },
  { label: "Room Rent Share",  align: "right" },
  { label: "Total Cost",       align: "right" },
  { label: "Bazar Paid",       align: "right" },
  { label: "Final Balance",    align: "right" },
  { label: "Status",           align: "left"  },
];

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i}>
          {HEADERS.map((h) => (
            <td key={h.label} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-[#2A2A2A]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface SummaryTableProps {
  members?: MemberSummary[];
  loading?: boolean;
}

export function SummaryTable({ members, loading }: SummaryTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#2A2A2A] bg-[#181818] shadow-sm">
      <table className="min-w-full divide-y divide-[#2A2A2A] text-sm">
        <thead className="bg-[#111111]">
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h.label}
                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                  h.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A2A2A]">
          {loading ? (
            <SkeletonRows />
          ) : (
            members?.map((m) => (
              <tr key={m.memberName} className="hover:bg-[#222222] transition-colors">
                <td className="px-4 py-3.5 font-semibold text-white">
                  {m.memberName}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-300">
                  {m.totalMeals}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-300">
                  {money(m.mealCost)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-300">
                  {money(m.roomRentShare)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums font-medium text-white">
                  {money(m.totalCost)}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-300">
                  {money(m.bazarPaid)}
                </td>
                <td
                  className={`px-4 py-3.5 text-right tabular-nums font-semibold ${balanceColor(
                    m.finalBalance
                  )}`}
                >
                  {balance(m.finalBalance)}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={m.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
