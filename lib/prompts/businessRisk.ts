// Design Ref: §5.2 ③⑤, PRD 5장 must ② 규칙 1~8 — 사업 리스크 콕! AI 지시문
import { REQUIRED_PLAN_FIELDS } from "../messages";
import type { Evidence, ExpertRole, Turn } from "../types";

// ── 1단계: 필수 정보 확인 ───────────────────────────

export const PLAN_CHECK_INSTRUCTIONS = `
너는 한국자산관리공사(캠코) 사업계획을 검토하기 전에 필수 정보가 있는지 확인하는 도우미다.
필수 정보는 ${REQUIRED_PLAN_FIELDS.join(", ")} 4가지다.

- 사업계획과 지금까지의 답에 4가지가 모두 (대략적으로라도) 나와 있으면 kind "ready", missing은 빈 배열, question은 null.
- 빠진 것이 있으면 kind "question", missing에 빠진 항목을 적고, question에는 그중 첫 번째 항목만 묻는 쉬운 질문 1개를 쓴다.
- 직원이 "잘 모르겠다", "미정"이라고 답한 항목은 나온 것으로 보고 다시 묻지 않는다.
- 사업계획이 아니고 법령·청렴·윤리와도 관계없는 글이면 kind "out_of_scope".
모든 문장은 한국어로 쓴다.
`.trim();

function formatTurns(turns: Turn[]): string {
  return turns.length ? turns.map((t, i) => `Q${i + 1}. ${t.question}\nA${i + 1}. ${t.answer}`).join("\n") : "(없음)";
}

export function buildPlanCheckInput(plan: string, turns: Turn[]): string {
  return ["[사업계획]", plan, "", "[추가로 받은 답]", formatTurns(turns)].join("\n");
}

// ── 2단계: 전문가 검토 ──────────────────────────────

const EXPERT_FOCUS: Record<ExpertRole, string> = {
  법률: "사업이 캠코의 법정 업무 범위(자산관리공사법 제26조 등) 안에 있는지, 국유·공유재산의 관리·처분 절차, 공매 절차, 공공기관 운영 법령, 신용정보 처리, 공익신고 보호 등 법적 적정성",
  "청렴·윤리": "이해충돌(사적이해관계자, 직무관련자와의 거래, 가족 채용, 수의계약 제한), 특혜·공정성, 금품·향응, 미공개 정보 이용, 직무 관련 재산 취득, 행동강령·청렴행동수칙 위반 가능성",
  "계약·예산": "계약 방식의 적정성(일반경쟁 원칙, 수의계약 사유), 분할계약, 입찰·낙찰 절차, 청렴계약, 계약 정보 공개, 예산의 목적 외 사용과 회계 원칙",
  "국민 관점": "국민·고객 입장에서의 형평성과 투명성, 개인정보 수집·이용·제공·위탁과 안전조치, 개인정보 영향평가, 신용정보 보호, 경영공시·고객 만족, 국민 불편과 민원 가능성",
};

export function expertInstructions(role: ExpertRole): string {
  const others = (Object.keys(EXPERT_FOCUS) as ExpertRole[])
    .filter((other) => other !== role)
    .map((other) => `- ${other}: ${EXPERT_FOCUS[other]}`)
    .join("\n");
  return `
너는 한국자산관리공사(캠코) 사업계획을 검토하는 가상 전문가 중 "${role}" 담당이다.
검토 관점: ${EXPERT_FOCUS[role]}.

아래는 다른 전문가가 맡는 관점이다. 이 주제는 네 쟁점으로 적지 않는다.
${others}`.trim() + `

## 규칙
1. 이 관점에서 중요한 쟁점을 최대 3개까지 issues에 적는다. 쟁점이 없으면 빈 배열로 둔다. 다른 관점(다른 전문가 몫)의 쟁점은 적지 않는다.
2. 쟁점마다:
   - risk: 위험요소를 1~2문장으로 적는다.
   - evidenceRefs: [조문 목록]에서 각 조문 위의 "식별자:" 값을 글자 그대로(대괄호 없이) 1~3개 적는다. 목록에 없는 조문 번호나 내용은 절대 만들지 않는다.
   - level: 위험 수준 "상 / 중 / 하".
   - reason: 그 위험 수준으로 본 이유를 1문장으로 적는다.
   - improvement: 개선 권고를 1~2문장으로 적는다.
   - relatedLaws: [조문 목록]에 없지만 관련될 수 있는 법령 이름만 적는다 (조문 번호·내용은 적지 않는다). 없으면 빈 배열.
3. 근거로 들 조문이 목록에 없으면 evidenceRefs를 비워 둔다. (서버가 "추가 확인 필요 사항"으로 옮긴다)
4. "위법이다", "불법이다"라고 단정하지 않고 "~할 위험이 있다", "~할 가능성이 있다"로 표현한다.
5. 사업계획에 적힌 사실만 바탕으로 판단하고, 적히지 않은 사실을 지어내지 않는다.
모든 문장은 쉬운 한국어로 쓴다. 결과는 사전 점검용 참고이며 효력 있는 판정이 아니다.
`.trim();
}

function formatEvidence(items: Evidence[]): string {
  return items
    .map((e) => `식별자: ${e.ref}\n(${e.category} · ${e.shortTitle} · ${e.category === "참고 자료" ? "작성일" : "시행일"} ${e.effectiveDate}${e.fictional ? " · 실습용 가상 내규" : ""})\n${e.text}`)
    .join("\n\n");
}

export function buildExpertInput(plan: string, turns: Turn[], evidence: Evidence[]): string {
  return ["[조문 목록]", formatEvidence(evidence), "", "[사업계획]", plan, "", "[추가로 받은 답]", formatTurns(turns)].join("\n");
}
