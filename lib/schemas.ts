// Design Ref: §6, §7 — 요청 모양(화면 → 서버)과 AI 답 모양(OpenAI → 서버)을 Zod로 정한다.
// OpenAI 구조화 답은 모든 칸이 있어야 하므로, 없을 수 있는 칸은 nullable로 둔다.
import { z } from "zod";

import { MAX_INPUT_LENGTH, MAX_QUESTIONS, REQUIRED_PLAN_FIELDS } from "./messages";

// ── 요청 ─────────────────────────────────────────────

const turnSchema = z.object({
  question: z.string().max(1000),
  answer: z.string().trim().min(1).max(1000),
});

export const integrityRequestSchema = z.object({
  situation: z.string().trim().min(1).max(MAX_INPUT_LENGTH),
  turns: z.array(turnSchema).max(MAX_QUESTIONS).default([]),
});

export type IntegrityRequest = z.infer<typeof integrityRequestSchema>;

// ── 청렴 콕! AI 답 ───────────────────────────────────

export const integrityAiSchema = z.object({
  kind: z.enum(["question", "result", "out_of_scope"]),
  question: z.string().nullable(),
  result: z
    .object({
      verdict: z.enum(["문제없음", "위반 가능성 있음", "위반 소지 높음", "확인 필요"]),
      summary: z.string(),
      exception: z
        .object({
          clause: z.string(),
          requirements: z.array(
            z.object({
              item: z.string(),
              status: z.enum(["충족", "불충족", "확인 필요"]),
              reason: z.string(),
            })
          ),
        })
        .nullable(),
      amounts: z.array(
        z.object({
          label: z.string(),
          given: z.number(),
          limit: z.number(),
          summed: z.boolean(),
        })
      ),
      actions: z.array(
        z.object({
          kind: z.enum(["법령 조치", "사내 절차", "시스템 경로"]),
          text: z.string(),
          deadline: z.string().nullable(),
          pathStatus: z.enum(["확정", "예시"]).nullable(),
        })
      ),
      toCheck: z.array(z.string()),
      conflict: z.boolean(),
      evidenceRefs: z.array(z.string()),
      referenceRefs: z.array(z.string()),
    })
    .nullable(),
});

export type IntegrityAiAnswer = z.infer<typeof integrityAiSchema>;

// ── 사업 리스크 콕! ──────────────────────────────────

export const businessRiskRequestSchema = z.object({
  plan: z.string().trim().min(1).max(MAX_INPUT_LENGTH),
  turns: z.array(turnSchema).max(REQUIRED_PLAN_FIELDS.length).default([]),
});

export type BusinessRiskRequest = z.infer<typeof businessRiskRequestSchema>;

/** 1단계: 필수 정보가 다 있는지 */
export const planCheckAiSchema = z.object({
  kind: z.enum(["question", "ready", "out_of_scope"]),
  missing: z.array(z.enum(REQUIRED_PLAN_FIELDS)),
  question: z.string().nullable(),
});

/** 2단계: 전문가 한 명의 검토 */
export const expertReviewAiSchema = z.object({
  issues: z.array(
    z.object({
      risk: z.string(),
      evidenceRefs: z.array(z.string()),
      level: z.enum(["상", "중", "하"]),
      reason: z.string(),
      improvement: z.string(),
      relatedLaws: z.array(z.string()),
    })
  ),
});

export type ExpertReviewAiAnswer = z.infer<typeof expertReviewAiSchema>;
