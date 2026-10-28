"use client";

import { useState } from "react";

import { MAX_INPUT_LENGTH, MESSAGES } from "@/lib/messages";
import { hasPrivacy } from "@/lib/privacy";
import type { ErrorBody, IntegrityResponse, IntegrityResult, Turn } from "@/lib/types";

import IntegrityResultCard from "./IntegrityResultCard";

// Design Ref: §8.2, §5.1 — 청렴 콕! 화면. 대화(상황·질문·답)는 브라우저에만 두고 매번 함께 보낸다.

const DONT_KNOW = "잘 모르겠어요";

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
