// Design Ref: §7.3 — 두 API가 같은 모양의 오류 응답을 쓰도록 모은다.
import "server-only";

import type { z } from "zod";

import { AiError } from "./ai";
import { MESSAGES } from "./messages";
import { hasPrivacy } from "./privacy";
import type { ErrorBody, ErrorCode } from "./types";

export function errorResponse(code: ErrorCode, status: number, message: string): Response {
  const body: ErrorBody = { error: { code, message } };
  return Response.json(body, { status });
}

/**
 * 요청 본문을 읽어 모양을 확인하고 개인정보를 다시 검사한다.
 * 문제가 있으면 오류 응답을, 없으면 확인된 요청을 돌려준다.
 */
export async function readRequest<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T> | Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("INVALID_INPUT", 400, MESSAGES.emptyInput);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((issue) => issue.code === "too_big");
    return errorResponse("INVALID_INPUT", 400, tooLong ? MESSAGES.tooLongInput : MESSAGES.emptyInput);
  }
  // 받은 글 전체(상황·질문·답)에서 개인정보를 한 번 더 찾는다
  if (hasPrivacy(JSON.stringify(parsed.data))) {
    return errorResponse("PRIVACY", 400, MESSAGES.privacyDetected);
  }
  return parsed.data;
}

/** 처리 중 오류를 응답으로 바꾼다. 입력 내용은 로그에 남기지 않는다. */
export function failureResponse(error: unknown): Response {
  const reason = error instanceof AiError ? error.message : error instanceof Error ? error.name : "unknown";
  console.error(`[준법 콕] 처리 실패: ${reason}`);
  return errorResponse("AI_ERROR", 502, MESSAGES.aiError);
}
