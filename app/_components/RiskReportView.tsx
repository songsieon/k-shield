import type { RiskLevel, RiskReport } from "@/lib/types";

import EvidenceList from "./EvidenceList";

// Design Ref: §8.3 — 리스크 검토 보고서: 전문가별 쟁점(위험요소 → 근거 → 위험 수준 → 개선 권고) → 추가 확인 필요 사항

const LEVEL_STYLE: Record<RiskLevel, string> = {
  상: "bg-risk-high",
  중: "bg-risk-mid",
  하: "bg-risk-low",
};

export default function RiskReportView({ report }: { report: RiskReport }) {
  const total = report.experts.reduce((n, e) => n + e.issues.length, 0);
  const high = report.experts.reduce((n, e) => n + e.issues.filter((i) => i.level === "상").length, 0);

  return (
    <article className="flex flex-col gap-5">
      <header className="rounded-xl border border-border bg-card px-5 py-4">
        <h2 className="text-lg font-bold">리스크 검토 보고서</h2>
        <p className="text-sm text-muted">
          쟁점 {total}개 (위험 수준 상 {high}개) · 추가 확인 필요 {report.followUps.length}건
        </p>
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
                    <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold text-white ${LEVEL_STYLE[issue.level]}`}>{issue.level}</span>
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
