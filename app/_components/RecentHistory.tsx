"use client";

import { useSyncExternalStore } from "react";

import { clearHistory, getHistory, getServerHistory, subscribeHistory, type HistoryEntry } from "@/lib/history";
import { overallRiskSignal, SIGNAL_EMOJI, verdictSignal } from "@/lib/signal";

// nice 기능: 최근 점검 기록 (이 브라우저에만 저장, 최대 10개)

interface RecentHistoryProps {
  kind: HistoryEntry["kind"];
  onOpen: (entry: HistoryEntry) => void;
}

export default function RecentHistory({ kind, onOpen }: RecentHistoryProps) {
  const all = useSyncExternalStore(subscribeHistory, getHistory, getServerHistory);
  const entries = all.filter((e) => e.kind === kind);
  if (entries.length === 0) return null;

  return (
    <section aria-label="최근 점검 기록" className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 print:hidden">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">최근 {kind === "integrity" ? "점검" : "검토"} 기록</h3>
        <button type="button" onClick={() => clearHistory(kind)} className="text-xs text-muted underline hover:text-foreground">
          모두 지우기
        </button>
      </div>
      <p className="text-xs text-muted">이 브라우저에만 저장되고 서버에는 저장되지 않습니다.</p>
      <ul className="flex flex-col gap-1.5">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onOpen(entry)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-accent"
            >
              <span className="min-w-0 truncate">{entry.title}</span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                <span className="rounded-full border border-border px-2 py-0.5">
                  {SIGNAL_EMOJI[entry.kind === "integrity" ? verdictSignal(entry.result.verdict) : overallRiskSignal(entry.report).signal]}{" "}
                  {entry.label}
                </span>
                {new Date(entry.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
