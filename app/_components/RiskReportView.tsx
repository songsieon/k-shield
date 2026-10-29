import { levelSignal, overallRiskSignal, SIGNAL_NAME, type Signal } from "@/lib/signal";
import type { RiskReport } from "@/lib/types";

import EvidenceList from "./EvidenceList";
import PrintButton from "./PrintButton";
import SignalLight from "./SignalLight";

// Design Ref: §8.3 — 리스크 검토 보고서: 종합 신호 → 전문가별 쟁점(위험요소 → 근거 → 위험 수준(신호) → 개선 권고) → 추가 확인 필요 사항
// 쟁점마다 상=빨강, 중=노랑, 하=초록. 종합 신호는 상이 1개 이상이면 빨강, 중이 있으면 노랑, 모두 하이면 초록.

const BADGE_STYLE: Record<Signal, string> = {
  green: "bg-signal-green text-signal-green-fg",
  yellow: "bg-signal-yellow text-signal-yellow-fg",
  red: "bg-signal-red text-signal-red-fg",
};

export default function RiskReportView({ report }: { report: RiskReport }) {
  const total = report.experts.reduce((n, e) => n + e.issues.length, 0);
  const high = report.experts.reduce((n, e) => n + e.issues.filter((i) => i.level === "상").length, 0);
  const overall = overallRiskSignal(report);

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">리스크 검토 보고서</h2>
          <div className="flex flex-wrap items-center gap-3">
            <SignalLight signal={overall.signal} />
            <span className={`signal-badge rounded-full px-3 py-1 text-sm font-bold ${BADGE_STYLE[overall.signal]}`}>
              종합 신호 · {SIGNAL_NAME[overall.signal]}
            </span>
            <span className="text-sm">{overall.text}</span>
          </div>
          <p className="text-sm text-muted">
            쟁점 {total}개 (위험 수준 상 {high}개) · 추가 확인 필요 {report.followUps.length}건
          </p>
          <p className="hidden text-xs text-muted print:block">
            사전 점검용 참고 자료이며 효력 있는 판정이나 법률 자문이 아닙니다. 공식 판단은 담당 부서가 합니다.
          </p>
        </div>
        <PrintButton />
      </header>

      {report.experts.map((expert) => (
        <section key={expert.role} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <h3 className="font-bold">
            {expert.role.endsWith("관점") ? expert.role : `${expert.role} 관점`} <span className="text-sm font-normal text-muted">쟁점 {expert.issues.length}개</span>
          </h3>
          {expert.issues.length === 0 && <p className="text-sm text-muted">근거 조문과 함께 제시할 쟁점이 없습니다.</p>}
          <ol className="flex flex-col gap-4">
            {expert.issues.map((issue, i) => (
              <li key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">1) 위험요소</span>
                  <p className="leading-6">{issue.risk}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">2) 근거</span>
                  <EvidenceList items={issue.evidence} title="" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">3) 위험 수준</span>
                  <p className="flex flex-wrap items-center gap-2 leading-6">
                    <span className={`signal-badge rounded-full px-2.5 py-0.5 text-sm font-bold ${BADGE_STYLE[levelSignal(issue.level)]}`}>
                      {SIGNAL_NAME[levelSignal(issue.level)]} · {issue.level}
                    </span>
                    <span>{issue.reason}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">4) 개선 권고</span>
                  <p className="leading-6">{issue.improvement}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {report.followUps.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <h3 className="font-bold">추가 확인 필요 사항</h3>
          <ul className="flex flex-col gap-2 text-sm">
            {report.followUps.map((followUp, i) => (
              <li key={i} className="flex flex-col gap-1.5 rounded-lg border border-border px-3 py-2">
                <span className="leading-6">{followUp.item}</span>
                {followUp.relatedLaws.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-muted">관련 가능 법령 (앱 근거 문서에 없음):</span>
                    {followUp.relatedLaws.map((law) => (
                      <span key={law} className="rounded-full border border-border px-2 py-0.5">
                        {law}
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
