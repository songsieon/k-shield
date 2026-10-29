// nice 기능: 최근 점검 기록 10개. 서버가 아니라 이 브라우저(localStorage)에만 저장한다 (PRD 7장).
import type { IntegrityResult, RiskReport, Turn } from "./types";

const STORAGE_KEY = "junbeop-signal-history-v1";
const MAX_ENTRIES = 10;
const CHANGE_EVENT = "junbeop-signal-history-change";

export type HistoryEntry =
  | { id: string; kind: "integrity"; createdAt: string; title: string; label: string; input: string; turns: Turn[]; result: IntegrityResult }
  | { id: string; kind: "business"; createdAt: string; title: string; label: string; input: string; turns: Turn[]; report: RiskReport };

type NewEntry =
  | { kind: "integrity"; input: string; turns: Turn[]; result: IntegrityResult }
  | { kind: "business"; input: string; turns: Turn[]; report: RiskReport };

const EMPTY: HistoryEntry[] = [];
let cachedRaw: string | null = null;
let cachedEntries: HistoryEntry[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** useSyncExternalStore용: 같은 저장값이면 같은 배열을 돌려준다 */
export function getHistory(): HistoryEntry[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedEntries;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : EMPTY;
    cachedEntries = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cachedEntries = EMPTY;
  }
  return cachedEntries;
}

export function getServerHistory(): HistoryEntry[] {
  return EMPTY;
}

export function subscribeHistory(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // 저장 공간이 없거나 막혀 있으면 기록만 건너뛴다
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addHistory(entry: NewEntry) {
  const title = entry.input.replace(/\s+/g, " ").trim().slice(0, 40);
  const label =
    entry.kind === "integrity"
      ? entry.result.verdict
      : `쟁점 ${entry.report.experts.reduce((n, e) => n + e.issues.length, 0)}개`;
  const next = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), title, label } as HistoryEntry;
  write([next, ...getHistory()].slice(0, MAX_ENTRIES));
}

export function clearHistory(kind: HistoryEntry["kind"]) {
  write(getHistory().filter((e) => e.kind !== kind));
}
