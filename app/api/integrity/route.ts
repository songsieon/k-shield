// Design Ref: §7.1 — 청렴 신호등 API. 서버는 요청 내용을 저장하지 않는다.
import { failureResponse, readRequest } from "@/lib/apiResponse";
import { runIntegrity } from "@/lib/integrity";
import { integrityRequestSchema } from "@/lib/schemas";

// AI 호출(최대 90초, 재시도 포함)이 끝날 때까지 기다린다
export const maxDuration = 300;

export async function POST(request: Request) {
  const input = await readRequest(request, integrityRequestSchema);
  if (input instanceof Response) return input;

  try {
    return Response.json(await runIntegrity(input));
  } catch (error) {
    return failureResponse(error);
  }
}
