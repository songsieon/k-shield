"use client";

import { useState } from "react";

import { MAX_INPUT_LENGTH, MESSAGES } from "@/lib/messages";
import { hasPrivacy } from "@/lib/privacy";
import type { BusinessRiskResponse, ErrorBody, RiskReport, Turn } from "@/lib/types";

import RiskReportView from "./RiskReportView";

// Design Ref: §8.3, §5.2 — 사업 리스크 콕! 화면. 사업계획과 추가 답은 브라우저에만 두고 매번 함께 보낸다.

const DONT_KNOW = "미정이에요";

export default function BusinessRiskCheck() {
  const [draft, setDraft] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<RiskReport | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send(nextPlan: string, nextTurns: Turn[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/business-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: nextPlan, turns: nextTurns }),
      });
      const data = (await res.json()) as BusinessRiskResponse | ErrorBody;
      if ("error" in data) {
        setError(data.error.message);
        return false;
      }
      setPlan(nextPlan);
      setTurns(nextTurns);
      setQuestion(data.kind === "question" ? data.question : null);
      setReport(data.kind === "report" ? data.report : null);
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
    if (!plan || !question) return;
    const value = text.trim();
    if (!value) return setError(MESSAGES.emptyInput);
    if (hasPrivacy(value)) return setError(MESSAGES.privacyDetected);
    const ok = await send(plan, [...turns, { question, answer: value }]);
    if (ok) setAnswer("");
  }

  function reset() {
    setDraft("");
    setPlan(null);
    setTurns([]);
    setQuestion(null);
    setAnswer("");
    setReport(null);
    setNotice(null);
    setError(null);
  }

  const started = plan !== null;

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
          <label htmlFor="business-plan" className="font-semibold">
            사업계획을 적어 주세요
          </label>
          <p className="text-sm text-muted">사업 목적·대상·예산·계약 방식을 함께 적으면 바로 검토합니다.</p>
          <textarea
            id="business-plan"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_INPUT_LENGTH}
            rows={8}
            placeholder="예: 온비드 이용을 늘리기 위해 외부 홍보대행사에 SNS 홍보 용역을 맡기려 합니다. 대상은 일반 국민, 예산은 약 8천만원, 계약 방식은 수의계약을 검토 중입니다."
            className="rounded-lg border border-border bg-background px-3 py-2 leading-6 outline-none focus:border-accent"
          />
          <p className="text-xs text-muted">{MESSAGES.businessPrivacyNotice}</p>
          <button
            type="submit"
            disabled={loading}
            className="self-end rounded-lg bg-accent px-5 py-2 font-semibold text-accent-foreground disabled:opacity-50"
          >
            검토하기
          </button>
        </form>
      )}

      {started && (
        <section aria-label="사업계획" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted">검토할 사업계획</h3>
          <p className="whitespace-pre-wrap leading-6">{plan}</p>
          {turns.map((turn, i) => (
            <p key={i} className="text-sm">
              <span className="text-muted">🤖 {turn.question}</span>
              <br />→ {turn.answer}
            </p>
          ))}
          {question && (
            <div className="flex flex-col gap-2 rounded-lg border border-accent p-3">
              <p className="font-medium">🤖 {question}</p>
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
            </div>
          )}
        </section>
      )}

      {loading && (
        <p role="status" className="text-center text-sm text-muted">
          {MESSAGES.waiting} <span className="block text-xs">전문가 4명이 함께 검토하고 있어요</span>
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-verdict-danger px-3 py-2 text-sm text-verdict-danger">
          {error}
        </p>
      )}
      {notice && <p className="rounded-lg border border-border bg-card px-4 py-3">{notice}</p>}
      {report && <RiskReportView report={report} />}

      {started && !loading && (report || notice) && (
        <button type="button" onClick={reset} className="self-center rounded-lg border border-border px-5 py-2 hover:border-accent">
          새로 검토하기
        </button>
      )}
    </div>
  );
}
