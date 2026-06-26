import type { MemberSummary } from "../types/api";
import { SummaryTable } from "./SummaryTable";
import { MemberCard, MemberCardSkeleton } from "./MemberCard";

interface SummarySectionProps {
  members?: MemberSummary[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function SummarySection({ members, loading, error, onRetry }: SummarySectionProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red-800/50 bg-red-950/30 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-900/30">
            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-400">Failed to load summary</p>
            <p className="mt-0.5 text-sm text-red-300">{error}</p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded-lg border border-red-700 bg-[#181818] px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950/50 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!loading && (!members || members.length === 0)) {
    return (
      <div className="rounded-2xl border border-dashed border-[#2A2A2A] bg-[#181818] p-8 sm:p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#222222]">
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5m-9.75-1.5h.375a1.125 1.125 0 011.125 1.125v1.5a1.125 1.125 0 01-1.125 1.125H12m.375-3.75h6.375M12.375 12c.621 0 1.125.504 1.125 1.125v1.5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-400">No data for this period</p>
        <p className="mt-1 text-sm text-gray-600">Try selecting a different month or year.</p>
      </div>
    );
  }

  return (
    <>
      <SummaryTable members={members} loading={loading} />

      <div className="md:hidden space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <MemberCardSkeleton key={i} />)
          : members?.map((m) => <MemberCard key={m.memberName} member={m} />)}
      </div>
    </>
  );
}
