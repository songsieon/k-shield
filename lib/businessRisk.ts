// Design Ref: §5.2 — 사업리스크 Check 처리 순서: 필수 정보 확인 → 전문가 4명 동시 검토 → 보고서 점검
import "server-only";

import { askStructured } from "./ai";
import { getAllDocuments } from "./documents";
import { MESSAGES, REQUIRED_PLAN_FIELDS } from "./messages";
import { buildExpertInput, buildPlanCheckInput, expertInstructions, PLAN_CHECK_INSTRUCTIONS } from "./prompts/businessRisk";
import { expertReviewAiSchema, planCheckAiSchema, type BusinessRiskRequest } from "./schemas";
import { resolveRefs, searchEvidence } from "./search";
import { EXPERT_SCOPES, type ExpertScope } from "./topics";
import type { BusinessRiskResponse, RiskIssue, RiskReport } from "./types";
import { verifyRefs } from "./verify";

/** 쟁점은 전문가마다 최대 3개 (PRD 규칙 2) */
const MAX_ISSUES = 3;

export async function runBusinessRisk({ plan, turns }: BusinessRiskRequest): Promise<BusinessRiskResponse> {
  // ③ 필수 정보 확인 (4가지를 다 물었으면 건너뛴다)
  if (turns.length < REQUIRED_PLAN_FIELDS.length) {
    const check = await askStructured({
      instructions: PLAN_CHECK_INSTRUCTIONS,
      input: buildPlanCheckInput(plan, turns),
      schema: planCheckAiSchema,
      name: "plan_check",
    });
    if (check.kind === "out_of_scope") return { kind: "out_of_scope", message: MESSAGES.outOfScope };
    if (check.kind === "question" && check.question?.trim() && check.missing.length) {
      return { kind: "question", question: check.question.trim(), missing: check.missing };
    }
  }

  // ④⑤ 전문가 4명이 동시에 검토
  const query = [plan, ...turns.map((t) => t.answer)].join("\n");
  const reviews = await Promise.all(EXPERT_SCOPES.map((scope) => reviewAsExpert(scope, plan, turns, query)));

  // ⑦ 근거 없는 쟁점과 관련 가능 법령은 "추가 확인 필요 사항"으로 모은다
  const report: RiskReport = { experts: [], followUps: [] };
  for (const { role, issues, followUps } of reviews) {
    report.experts.push({ role, issues });
    report.followUps.push(...followUps);
  }
  return { kind: "report", report };
}

async function reviewAsExpert(scope: ExpertScope, plan: string, turns: BusinessRiskRequest["turns"], query: string) {
  const { official, references } = searchEvidence({
    query,
    required: resolveRefs(scope.refs),
    docIds: scope.docIds,
    maxOfficial: 15,
    maxReference: 3,
  });
  // 근거로 인정하는 것은 공식 근거뿐이다. 참고 자료(캠코 업무 소개 등)는 배경으로만 함께 준다.
  const allowed = official.map((e) => e.ref);

  const answer = await askStructured({
    instructions: expertInstructions(scope.role),
    input: buildExpertInput(plan, turns, [...official, ...references]),
    schema: expertReviewAiSchema,
    name: "expert_review",
  });

  const issues: RiskIssue[] = [];
  const followUps: RiskReport["followUps"] = [];
  for (const issue of answer.issues.slice(0, MAX_ISSUES)) {
    const { evidence, dropped } = verifyRefs(issue.evidenceRefs, allowed, 3);
    if (dropped.length) console.warn(`[K-SHIELD] 데이터에 없는 근거 제외(${scope.role}): ${dropped.join(" | ")}`);
    const relatedLaws = outsideLaws(issue.relatedLaws);
    const headline = firstSentence(issue.risk);
    if (evidence.length === 0) {
      // 근거가 없으면 판단하지 않고 확인할 일로 넘긴다
      followUps.push({ item: `[${scope.role}] ${headline} (앱의 근거 문서에서 근거 조문을 찾지 못함)`, relatedLaws });
      continue;
    }
    issues.push({
      risk: issue.risk.trim(),
      evidence,
      level: issue.level,
      reason: issue.reason.trim(),
      improvement: issue.improvement.trim(),
    });
    if (relatedLaws.length) {
      followUps.push({ item: `[${scope.role}] ${headline} — 관련 가능 법령도 함께 확인하세요`, relatedLaws });
    }
  }
  return { role: scope.role, issues, followUps };
}

function firstSentence(text: string): string {
  return (text.trim().match(/^[^.!?。]+[.!?。]?/)?.[0] ?? text).trim();
}

/** 관련 가능 법령 중 앱 데이터에 이미 있는 법령은 빼고, 이름만 남긴다 (PRD 규칙 8) */
function outsideLaws(names: string[]): string[] {
  const normalize = (s: string) => s.replace(/[\s「」『』ㆍ·]/g, "");
  const known = getAllDocuments().flatMap((doc) => [normalize(doc.title), normalize(doc.shortTitle)]);
  const result = names
    .map((name) => name.replace(/제\d+조.*$/, "").trim())
    .filter((name) => name && !known.includes(normalize(name)));
  return [...new Set(result)];
}
