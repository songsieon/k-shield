// Design Ref: §2.2, §10.1 — OpenAI 호출. 키는 서버에서만 읽고, 답은 Zod 모양으로 받는다.
import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";

/** 모델 이름은 .env의 OPENAI_MODEL로 바꿀 수 있다. */
const DEFAULT_MODEL = "gpt-5.5";

/** AI 호출 하나의 시간 제한 */
const TIMEOUT_MS = 90_000;

/** AI 호출 실패 (화면에는 "잠시 후 다시 시도해 주세요"만 보여 준다) */
export class AiError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "AiError";
  }
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new AiError("OPENAI_API_KEY가 설정되지 않았습니다");
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: TIMEOUT_MS, maxRetries: 1 });
  return client;
}

export interface AskOptions<T extends z.ZodType> {
  /** 지시문 (역할·규칙) */
  instructions: string;
  /** 이번 요청 내용 (근거 조문 목록, 직원 입력 등) */
  input: string;
  /** 받을 답의 모양 */
  schema: T;
  /** 모양 이름 (영문·숫자·밑줄) */
  name: string;
}

/**
 * AI에게 묻고 정해진 모양의 답을 받는다.
 * 모양이 어긋나면 한 번 다시 묻고, 그래도 어긋나거나 호출이 실패하면 AiError를 던진다.
 */
export async function askStructured<T extends z.ZodType>({ instructions, input, schema, name }: AskOptions<T>): Promise<z.infer<T>> {
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  let lastReason = "알 수 없는 오류";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await getClient().responses.parse({
        model,
        instructions,
        input,
        text: { format: zodTextFormat(schema, name) },
      });
      const parsed = schema.safeParse(response.output_parsed);
      if (parsed.success) return parsed.data;
      lastReason = "AI 답이 정해진 모양과 다릅니다";
    } catch (error) {
      if (error instanceof AiError) throw error;
      lastReason = error instanceof Error ? error.message : String(error);
    }
  }
  throw new AiError(lastReason);
}
