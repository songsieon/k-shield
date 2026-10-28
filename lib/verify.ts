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
 * 식별자를 비교용 열쇠로 줄인다: "문서 id#조문 번호" ("제8조(…)" → "8조", "[별표 1] …" → "별표1").
 * AI가 "제"를 빠뜨리거나 제목을 조금 다르게 적어도 같은 조문으로 알아보기 위한 것이다.
 */
function keyOf(ref: string): string {
  const cut = ref.indexOf("#");
  if (cut < 0) return ref.replace(/\s+/g, "");
  const docId = ref.slice(0, cut).trim();
  const location = ref.slice(cut + 1).replace(/\s+/g, "");
  const article = location.match(/^제?(\d+조(?:의\d+)?)/);
  if (article) return `${docId}#${article[1]}`;
  const table = location.match(/^[[【]?(별표\d+(?:의\d+)?)/);
  if (table) return `${docId}#${table[1]}`;
  const item = location.match(/^(\d+)\./);
  if (item) return `${docId}#${item[1]}.`;
  return `${docId}#${location}`;
}

/**
 * @param refs AI가 근거로 든 조문 식별자
 * @param allowed 이번 요청에서 AI에 준 조문 식별자 (이 밖의 근거는 지어낸 것으로 본다)
 */
export function verifyRefs(refs: string[], allowed: Iterable<string>, maxOfficial = 3): VerifiedEvidence {
  const allowedList = [...allowed];
  const allowedSet = new Set(allowedList);
  const byKey = new Map(allowedList.map((ref) => [keyOf(ref), ref]));
  const evidence: Evidence[] = [];
  const references: Evidence[] = [];
  const dropped: string[] = [];
  const seen = new Set<string>();

  for (const raw of refs) {
    // AI가 식별자를 대괄호·따옴표로 감싸 적는 경우가 있어 벗겨 낸다
    const cleaned = raw.trim().replace(/^[["'`\s]+|[\]"'`\s]+$/g, "");
    const ref = allowedSet.has(cleaned) ? cleaned : byKey.get(keyOf(cleaned));
    const found = ref ? getEvidence(ref) : undefined;
    if (!found) {
      dropped.push(raw);
      continue;
    }
    if (seen.has(found.ref)) continue;
    seen.add(found.ref);
    if (found.category === "공식 근거") {
      if (evidence.length < maxOfficial) evidence.push(found);
    } else {
      references.push(found);
    }
  }
  return { evidence, references, dropped };
}
