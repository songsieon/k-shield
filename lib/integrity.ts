// Design Ref: §5.1 — 청렴 콕! 처리 순서: 근거 검색 → AI → 답 점검 → 근거 검증·원문 붙이기
import "server-only";

import { askStructured } from "./ai";
import { MAX_QUESTIONS, MESSAGES } from "./messages";
import {
  buildIntegrityInput,
  buildIntegrityReviewInput,
  INTEGRITY_INSTRUCTIONS,
  INTEGRITY_REVIEW_INSTRUCTIONS,
} from "./prompts/integrity";
import { integrityAiSchema, integrityReviewAiSchema, type IntegrityAiAnswer, type IntegrityRequest } from "./schemas";
import { resolveRefs, searchEvidence } from "./search";
import { INTEGRITY_ALWAYS, pickTopics } from "./topics";
import type { Evidence, FollowUpAction, IntegrityResponse, IntegrityResult } from "./types";
import { verifyRefs } from "./verify";

/** 신고·시스템 경로 안내 자료 (시스템 경로는 이 자료가 근거로 남았을 때만 보여 준다) */
const CHANNELS_DOC = "ref-report-channels";

/** 사용자가 확인해 준 경로 단계 (ref-report-channels의 [확정] 항목). 이 밖의 단계가 섞이면 [예시]로 본다. */
const CONFIRMED_PATH_STEPS = ["K-Wings", "K-Wings 메인 화면", "메인 화면", "클린신고센터", "K-Hopes"];

function pathStatusOf(text: string): "확정" | "예시" {
  const steps = text.split(/→|>/).map((step) => step.replace(/[[\]'"]/g, "").trim()).filter(Boolean);
  return steps.length > 0 && steps.every((step) => CONFIRMED_PATH_STEPS.includes(step)) ? "확정" : "예시";
}

/** 문장을 최대 n개까지만 남긴다 (PRD: 답변 본문 5문장 이내) */
function limitSentences(text: string, max: number): string {
  const sentences = text.trim().match(/[^.!?。]+[.!?。]?/g) ?? [text];
  return sentences.slice(0, max).join("").trim();
}

export async function runIntegrity({ situation, turns }: IntegrityRequest): Promise<IntegrityResponse> {
  // ④ 근거 검색: 상황 유형별 필수 조문 + 낱말 점수
  const query = [situation, ...turns.map((t) => t.answer)].join("\n");
  const topics = pickTopics(query);
  const required = resolveRefs([...topics.flatMap((t) => t.refs), ...INTEGRITY_ALWAYS]);
  const { official, references } = searchEvidence({ query, required, maxOfficial: 15, maxReference: 5 });
  const allowed = [...official, ...references].map((e) => e.ref);

  // ⑤⑥ AI 호출 (질문이 10개 찼으면 판단을 요구)
  const mustDecide = turns.length >= MAX_QUESTIONS;
  const ask = () =>
    askStructured({
      instructions: INTEGRITY_INSTRUCTIONS,
      input: buildIntegrityInput({
        situation,
        turns,
        official,
        references,
        mustDecide,
        topicHints: topics.map((t) => ({ label: t.label, refs: resolveRefs(t.refs).filter((ref) => !ref.startsWith("ref-")) })),
      }),
      schema: integrityAiSchema,
      name: "integrity_answer",
    });
  let answer = await ask();

  if (answer.kind === "out_of_scope") return { kind: "out_of_scope", message: MESSAGES.outOfScope };

  if (answer.kind === "question" && !mustDecide && answer.question?.trim()) {
    return { kind: "question", question: answer.question.trim(), asked: turns.length + 1, max: MAX_QUESTIONS };
  }

  // 질문을 10개 다 했는데도 AI가 또 질문하면 한 번 더 판단을 요구하고, 그래도 없으면 "확인 필요"로 끝낸다
  if (mustDecide && !answer.result) answer = await ask();
  if (mustDecide && !answer.result) return { kind: "result", result: insufficientFactsResult() };

  const result = checkResult(answer, allowed);
  if (result.verdict === "문제없음") await reviewNoProblem(result, { situation, turns, official });
  return { kind: "result", result };
}

/**
 * Plan SC 9(위험한 오판 0건): "문제없음"은 한 번 더 검토한다.
 * 금지·신고 대상에 해당할 여지가 있다고 보면 결과를 낮추고 이유를 요약과 확인할 것에 남긴다.
 */
async function reviewNoProblem(
  result: IntegrityResult,
  { situation, turns, official }: { situation: string; turns: IntegrityRequest["turns"]; official: Evidence[] }
): Promise<void> {
  try {
    const review = await askStructured({
      instructions: INTEGRITY_REVIEW_INSTRUCTIONS,
      input: buildIntegrityReviewInput({ situation, turns, summary: result.summary, evidence: official }),
      schema: integrityReviewAiSchema,
      name: "integrity_review",
    });
    if (review.keep) return;
    result.verdict = review.verdict ?? "확인 필요";
    result.summary = limitSentences(review.reason, 5);
    result.toCheck.unshift("다시 검토한 결과 위 이유로 문제없다고 단정할 수 없습니다. 청렴·윤리 담당 부서에 확인하세요");
  } catch {
    // 재검토를 못 했으면 단정하지 않는다
    result.verdict = "확인 필요";
    result.toCheck.unshift("결과를 다시 검토하지 못했습니다. 청렴·윤리 담당 부서에 확인하세요");
  }
}

/** Plan SC 2·3: AI 결과를 점검해 형식이 어긋나거나 근거가 없으면 낮춘다. */
function checkResult(answer: IntegrityAiAnswer, allowed: string[]): IntegrityResult {
  const ai = answer.result;
  if (!ai) return noEvidenceResult();

  // ⑦⑧ 근거 검증 + 원문 붙이기
  const { evidence, references: misplaced, dropped } = verifyRefs(ai.evidenceRefs, allowed, 3);
  const { references: listed, dropped: droppedRefs } = verifyRefs(ai.referenceRefs, allowed, 0);
  // AI가 참고 자료를 공식 근거 칸에 적었어도 버리지 않고 참고 자료로 모은다
  const references = [...listed, ...misplaced.filter((m) => !listed.some((l) => l.ref === m.ref))];
  // 버린 근거 식별자만 남긴다 (직원 입력 내용은 로그에 남기지 않는다)
  if (dropped.length || droppedRefs.length) console.warn(`[준법 콕] 데이터에 없는 근거 제외: ${[...dropped, ...droppedRefs].join(" | ")}`);
  if (evidence.length === 0) return noEvidenceResult();

  const hasChannels = references.some((r) => r.docId === CHANNELS_DOC);
  const toCheck = ai.toCheck.map((t) => t.trim()).filter(Boolean);

  const actions: FollowUpAction[] = [];
  for (const action of ai.actions) {
    const text = action.text.replace(/\s*\[(확정|예시)\]\s*/g, " ").trim();
    if (!text) continue;
    if (action.kind === "시스템 경로") {
      // 경로 안내 자료가 근거로 남지 않았으면 경로를 지어낸 것일 수 있으므로 빼고 확인을 안내한다
      if (!hasChannels) continue;
      actions.push({ kind: action.kind, text, deadline: action.deadline ?? undefined, pathStatus: pathStatusOf(text) });
    } else {
      actions.push({ kind: action.kind, text, deadline: action.deadline ?? undefined });
    }
  }
  if (!hasChannels && ai.actions.some((a) => a.kind === "시스템 경로")) {
    toCheck.push("사내 시스템 처리 경로는 청렴·윤리 담당 부서에 확인하세요");
  }

  const requirements = ai.exception?.requirements.filter((r) => r.item.trim()) ?? [];
  const amounts = ai.amounts.filter((a) => Number.isFinite(a.given) && Number.isFinite(a.limit) && a.given > 0 && a.limit > 0);

  // Plan SC 9(위험한 오판 0건): AI가 "문제없음"이라고 해도 서버가 아래 경우에는 낮춘다
  let verdict = ai.verdict;
  if (verdict === "문제없음" && amounts.some((a) => a.given > a.limit)) {
    // 받은(받을) 금액이 기준을 넘으면 문제없음이 될 수 없다
    verdict = "위반 가능성 있음";
    toCheck.push("받은(받을) 금액이 기준을 넘습니다. 초과분은 받지 않거나 반환하고 신고 여부를 확인하세요");
  } else if (verdict === "문제없음" && requirements.some((r) => r.status !== "충족")) {
    // 예외 요건이 하나라도 충족되지 않았으면 단정하지 않는다
    verdict = "확인 필요";
    if (!toCheck.length) toCheck.push("예외사유의 요건 중 확인되지 않은 것이 있습니다. 청렴·윤리 담당 부서에 확인하세요");
  }

  return {
    verdict,
    summary: limitSentences(ai.summary, 5),
    exception: ai.exception && requirements.length ? { clause: ai.exception.clause, requirements } : undefined,
    amounts,
    actions,
    toCheck,
    conflict: ai.conflict && evidence.length >= 2,
    evidence,
    references,
  };
}

/** PRD 규칙 7: 근거가 없으면 판단을 지어내지 않는다. */
function noEvidenceResult(): IntegrityResult {
  return {
    verdict: "확인 필요",
    summary: MESSAGES.noEvidence,
    amounts: [],
    actions: [],
    toCheck: [],
    conflict: false,
    evidence: [],
    references: [],
  };
}

/** 질문을 10개 다 했는데도 판단하지 못한 경우 (설계 §10.1) */
function insufficientFactsResult(): IntegrityResult {
  return {
    ...noEvidenceResult(),
    summary: "질문을 모두 했지만 판단에 필요한 사실을 확인하지 못했습니다.",
    toCheck: ["상황을 더 구체적으로 적어 다시 점검하거나, 청렴·윤리 담당 부서에 확인하세요"],
  };
}
