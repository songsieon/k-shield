// Design Ref: §5.1 — 청렴 콕! 처리 순서: 근거 검색 → AI → 답 점검 → 근거 검증·원문 붙이기
import "server-only";

import { askStructured } from "./ai";
import { MAX_QUESTIONS, MESSAGES } from "./messages";
import { buildIntegrityInput, INTEGRITY_INSTRUCTIONS } from "./prompts/integrity";
import { integrityAiSchema, type IntegrityAiAnswer, type IntegrityRequest } from "./schemas";
import { resolveRefs, searchEvidence } from "./search";
import { INTEGRITY_ALWAYS, pickTopics } from "./topics";
import type { FollowUpAction, IntegrityResponse, IntegrityResult } from "./types";
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
  const answer = await askStructured({
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

  if (answer.kind === "out_of_scope") return { kind: "out_of_scope", message: MESSAGES.outOfScope };

  if (answer.kind === "question" && !mustDecide && answer.question?.trim()) {
    return { kind: "question", question: answer.question.trim(), asked: turns.length + 1, max: MAX_QUESTIONS };
  }

  return { kind: "result", result: checkResult(answer, allowed) };
}

/** Plan SC 2·3: AI 결과를 점검해 형식이 어긋나거나 근거가 없으면 낮춘다. */
function checkResult(answer: IntegrityAiAnswer, allowed: string[]): IntegrityResult {
  const ai = answer.result;
  if (!ai) return noEvidenceResult();

  // ⑦⑧ 근거 검증 + 원문 붙이기
  const { evidence, dropped } = verifyRefs(ai.evidenceRefs, allowed, 3);
  const { references, dropped: droppedRefs } = verifyRefs(ai.referenceRefs, allowed, 0);
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

  // 예외 요건이 하나라도 충족되지 않았는데 "문제없음"이면 단정하지 않고 "확인 필요"로 낮춘다
  let verdict = ai.verdict;
  if (verdict === "문제없음" && requirements.some((r) => r.status !== "충족")) {
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
