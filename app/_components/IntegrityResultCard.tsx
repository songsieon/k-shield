import { MESSAGES } from "@/lib/messages";
import { SIGNAL_NAME, verdictSignal, type Signal } from "@/lib/signal";
import type { ActionKind, IntegrityResult, RequirementStatus } from "@/lib/types";

import EvidenceList from "./EvidenceList";
import SignalLight from "./SignalLight";

// Design Ref: §8.2 — 청렴 신호등 결과 카드: 신호등 → 단계 → 요약 → 예외 요건표 → 금액 비교 → 해야 할 일 → 확인할 것 → 근거
// 내부 판정은 4단계 그대로이고, 화면에는 신호 3색(초록·노랑·빨강)으로 함께 보여 준다. 노랑은 "위반 가능성 있음"과 "확인 필요"를 글자로 구분한다.

const BADGE_STYLE: Record<Signal, string> = {
  green: "bg-signal-green text-signal-green-fg",
  yellow: "bg-signal-yellow text-signal-yellow-fg",
  red: "bg-signal-red text-signal-red-fg",
};

const STATUS_STYLE: Record<RequirementStatus, string> = {
  충족: "text-verdict-ok",
  불충족: "text-verdict-danger",
  "확인 필요": "text-verdict-check",
};

const ACTION_ORDER: ActionKind[] = ["법령 조치", "사내 절차", "시스템 경로"];

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export default function IntegrityResultCard({ result }: { result: IntegrityResult }) {
  const signal = verdictSignal(result.verdict);
  return (
    <article className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SignalLight signal={signal} />
          <span className={`signal-badge rounded-full px-3 py-1 text-sm font-bold ${BADGE_STYLE[signal]}`}>
            {SIGNAL_NAME[signal]} 신호 · {result.verdict}
          </span>
        </div>
        <p className="leading-7">{result.summary}</p>
        {result.conflict && (
          <p className="rounded-lg border border-verdict-caution px-3 py-2 text-sm">⚖️ 법령과 내규가 {MESSAGES.conflict}</p>
        )}
      </header>

      {result.exception && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted">예외사유 검토 · {result.exception.clause}</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-1.5 pr-3 font-medium">요건</th>
                  <th className="py-1.5 pr-3 font-medium">판단</th>
                  <th className="py-1.5 font-medium">이유</th>
                </tr>
              </thead>
              <tbody>
                {result.exception.requirements.map((req) => (
                  <tr key={req.item} className="border-b border-border align-top">
                    <td className="py-2 pr-3">{req.item}</td>
                    <td className={`py-2 pr-3 font-semibold whitespace-nowrap ${STATUS_STYLE[req.status]}`}>{req.status}</td>
                    <td className="py-2">{req.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {result.amounts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted">금액 비교</h3>
          <ul className="flex flex-col gap-2">
            {result.amounts.map((amount) => {
              const over = amount.given > amount.limit;
              return (
                <li key={amount.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="font-medium">{amount.label}</span>
                  <span>
                    받은 금액 <b className={over ? "text-verdict-danger" : "text-verdict-ok"}>{won(amount.given)}</b>
                    {amount.summed && " (합산)"}
                  </span>
                  <span className="text-muted">vs</span>
                  <span>기준 <b>{won(amount.limit)}</b></span>
                  <span className={`text-xs font-semibold ${over ? "text-verdict-danger" : "text-verdict-ok"}`}>
                    {over ? "기준 초과" : "기준 이내"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {result.actions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted">해야 할 일</h3>
          <ol className="flex flex-col gap-2">
            {ACTION_ORDER.flatMap((kind) => result.actions.filter((a) => a.kind === kind)).map((action, i) => (
              <li key={`${action.kind}-${i}`} className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">{action.kind}</span>
                  {action.deadline && <span className="rounded-full border border-border px-2 py-0.5">기한: {action.deadline}</span>}
                  {action.pathStatus && (
                    <span className={`rounded-full px-2 py-0.5 ${action.pathStatus === "확정" ? "border border-verdict-ok text-verdict-ok" : "border border-verdict-caution text-verdict-caution"}`}>
                      {action.pathStatus === "확정" ? "확정 경로" : "예시 경로"}
                    </span>
                  )}
                </span>
                <span>{action.text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {result.toCheck.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted">확인할 것</h3>
          <ul className="list-disc pl-5 text-sm leading-6">
            {result.toCheck.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <EvidenceList items={result.evidence} title="근거" />
      <EvidenceList items={result.references} title="함께 볼 참고 자료" />
    </article>
  );
}
