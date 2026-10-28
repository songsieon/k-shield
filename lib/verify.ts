// Design Ref: §5.1 ⑦⑧ — AI가 든 근거를 데이터와 대조한다. 원문은 AI가 아니라 데이터에서 붙인다.
import "server-only";

import { getEvidence } from "./documents";
import type { Evidence } from "./types";

export interface VerifiedEvidence {
  /** 공식 근거 (최대 maxOfficial개) */
  evidence: Evidence[];
  /** 참고 자료 */
  references: Evidence[];
  /** 데이터에 없거나 AI에 주지 않은 근거 (버린 것) */
  dropped: string[];
}

/**
 * @param refs AI가 근거로 든 조문 식별자
 * @param allowed 이번 요청에서 AI에 준 조문 식별자 (이 밖의 근거는 지어낸 것으로 본다)
 */
export function verifyRefs(refs: string[], allowed: Iterable<string>, maxOfficial = 3): VerifiedEvidence {
  const allowedSet = new Set(allowed);
  const evidence: Evidence[] = [];
  const references: Evidence[] = [];
  const dropped: string[] = [];

  for (const ref of [...new Set(refs)]) {
    const found = allowedSet.has(ref) ? getEvidence(ref) : undefined;
    if (!found) {
      dropped.push(ref);
    } else if (found.category === "공식 근거") {
      if (evidence.length < maxOfficial) evidence.push(found);
    } else {
      references.push(found);
    }
  }
  return { evidence, references, dropped };
}
