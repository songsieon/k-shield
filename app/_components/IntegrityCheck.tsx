"use client";

import { useState } from "react";

import { addHistory, type HistoryEntry } from "@/lib/history";
import { MAX_INPUT_LENGTH, MESSAGES } from "@/lib/messages";
import { hasPrivacy } from "@/lib/privacy";
import type { ErrorBody, IntegrityResponse, IntegrityResult, Turn } from "@/lib/types";

import IntegrityResultCard from "./IntegrityResultCard";
import RecentHistory from "./RecentHistory";

// Design Ref: §8.2, §5.1 — 반부패·청렴 Check 화면. 대화(상황·질문·답)는 브라우저에만 두고 매번 함께 보낸다.

const DONT_KNOW = "잘 모르겠어요";

/** nice 기능: 자주 묻는 상황 버튼. 누르면 입력칸에 적을 내용의 틀을 넣어 준다 (PRD 4장 "점검 항목 선택") */
const CHECK_ITEMS = [
  { label: "선물·금품", template: "직무와 관련된 사람(예: A업체 담당자)에게서 선물을 받았어요. 받은 것과 금액: " },
  { label: "모바일 상품권", template: "업무로 만나는 사람(예: A업체 담당자)이 카카오톡 모바일 상품권을 보냈어요. 상품권 종류와 금액: " },
  { label: "식사·경조사비", template: "업무로 만나는 사람(예: A업체 담당자)이 식사를 사거나 경조사비를 줬어요. 금액과 자리: " },
  { label: "외부강의", template: "외부 기관에서 강의(강연·기고)를 요청받았어요. 요청한 곳, 시간, 사례금: " },
  { label: "외부활동", template: "업무와 관련된 곳에서 자문·위원 등 외부활동을 제안받았어요. 활동 내용과 대가: " },
  { label: "부동산·주식", template: "부동산(또는 주식)을 사려고 해요. 제 담당 업무와 사려는 것: " },
  { label: "사적 이해관계", template: "제가 맡은 업무의 상대방이 가족·친척·지인이에요. 상대방과의 관계와 제 업무: " },
  { label: "부정청탁", template: "업무와 관련해 규정에 맞지 않는 부탁을 받았어요. 누가, 어떤 부탁을: " },
];

type Pending = { question: string; asked: number; max: number };

export default function IntegrityCheck() {
  const [draft, setDraft] = useState("");
  const [situation, setSituation] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send(nextSituation: string, nextTurns: Turn[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: nextSituation, turns: nextTurns }),
      });
      const data = (await res.json()) as IntegrityResponse | ErrorBody;
      if ("error" in data) {
        setError(data.error.message);
        return false;
      }
      setSituation(nextSituation);
      setTurns(nextTurns);
      setPending(data.kind === "question" ? { question: data.question, asked: data.asked, max: data.max } : null);
      setResult(data.kind === "result" ? data.result : null);
      setNotice(data.kind === "out_of_scope" ? data.message : null);
      if (data.kind === "result") addHistory({ kind: "integrity", input: nextSituation, turns: nextTurns, result: data.result });
      return true;
    } catch {
      setError(MESSAGES.aiError);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function start() {
    const text = draft.trim();
    if (!text) return setError(MESSAGES.emptyInput);
    if (hasPrivacy(text)) return setError(MESSAGES.privacyDetected);
    void send(text, []);
  }

  async function reply(text: string) {
    if (!situation || !pending) return;
    const value = text.trim();
    if (!value) return setError(MESSAGES.emptyInput);
    if (hasPrivacy(value)) return setError(MESSAGES.privacyDetected);
    const ok = await send(situation, [...turns, { question: pending.question, answer: value }]);
    if (ok) setAnswer("");
  }

  function pickItem(template: string) {
    setDraft((current) => (current.trim() ? `${current.trimEnd()}\n${template}` : template));
    setError(null);
  }

  function openHistory(entry: HistoryEntry) {
    if (entry.kind !== "integrity") return;
    setSituation(entry.input);
    setTurns(entry.turns);
    setPending(null);
    setResult(entry.result);
    setNotice(null);
    setError(null);
  }

  function reset() {
    setDraft("");
    setSituation(null);
    setTurns([]);
    setPending(null);
    setAnswer("");
    setResult(null);
    setNotice(null);
    setError(null);
  }

  const started = situation !== null;

  return (
    <div className="flex flex-col gap-4">
      {!started && (
        <form
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
        >
          <label htmlFor="integrity-situation" className="font-semibold">
            어떤 상황인가요?
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">자주 묻는 상황을 누르면 적을 내용의 틀이 들어갑니다.</span>
            <div className="flex flex-wrap gap-1.5">
              {CHECK_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => pickItem(item.template)}
                  className="rounded-full border border-border px-3 py-1 text-sm hover:border-accent hover:text-accent"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            id="integrity-situation"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_INPUT_LENGTH}
            rows={5}
            placeholder="예: 용역 계약 중인 업체 담당자가 카카오톡으로 3만원 커피 상품권을 보냈어요"
            className="rounded-lg border border-border bg-background px-3 py-2 leading-6 outline-none focus:border-accent"
          />
          <p className="text-xs text-muted">{MESSAGES.privacyNotice}</p>
          <button
            type="submit"
            disabled={loading}
            className="self-end rounded-lg bg-accent px-5 py-2 font-semibold text-accent-foreground disabled:opacity-50"
          >
            점검하기
          </button>
        </form>
      )}
      {!started && <RecentHistory kind="integrity" onOpen={openHistory} />}

      {started && (
        <section aria-label="대화" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <Bubble who="me" text={situation} />
          {turns.map((turn, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Bubble who="ai" label={`질문 ${i + 1}`} text={turn.question} />
              <Bubble who="me" text={turn.answer} />
            </div>
          ))}
          {pending && (
            <>
              <Bubble who="ai" label={`질문 ${pending.asked}/${pending.max}`} text={pending.question} />
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void reply(answer);
                }}
              >
                <input
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  maxLength={1000}
                  aria-label="답 입력"
                  placeholder="답을 입력해 주세요"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground disabled:opacity-50">
                    보내기
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void reply(DONT_KNOW)}
                    className="rounded-lg border border-border px-4 py-2 disabled:opacity-50"
                  >
                    {DONT_KNOW}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      )}

      {loading && (
        <p role="status" className="text-center text-sm text-muted">
          {MESSAGES.waiting}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-verdict-danger px-3 py-2 text-sm text-verdict-danger">
          {error}
        </p>
      )}
      {notice && <p className="rounded-lg border border-border bg-card px-4 py-3">{notice}</p>}
      {result && <IntegrityResultCard result={result} />}

      {started && !loading && (result || notice) && (
        <button type="button" onClick={reset} className="self-center rounded-lg border border-border px-5 py-2 hover:border-accent">
          새로 점검하기
        </button>
      )}
    </div>
  );
}

function Bubble({ who, text, label }: { who: "me" | "ai"; text: string; label?: string }) {
  const mine = who === "me";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2 leading-6 ${mine ? "bg-accent text-accent-foreground" : "border border-border bg-background"}`}>
        {label && <span className="mb-0.5 block text-xs font-semibold text-muted">🤖 {label}</span>}
        <span className="whitespace-pre-wrap">{text}</span>
      </div>
    </div>
  );
}
