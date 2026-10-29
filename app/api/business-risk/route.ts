// Design Ref: §7.2 — 사업리스크 신호등 API. 서버는 요청 내용을 저장하지 않는다.
import { failureResponse, readRequest } from "@/lib/apiResponse";
import { runBusinessRisk } from "@/lib/businessRisk";
import { businessRiskRequestSchema } from "@/lib/schemas";

// 전문가 4명 검토(동시 호출)가 끝날 때까지 기다린다 (목표 3분 이내)
export const maxDuration = 300;

export async function POST(request: Request) {
  const input = await readRequest(request, businessRiskRequestSchema);
  if (input instanceof Response) return input;

  try {
    return Response.json(await runBusinessRisk(input));
  } catch (error) {
    return failureResponse(error);
  }
}
