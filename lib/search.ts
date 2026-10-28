// Design Ref: §9 — 키워드 근거 검색. 상황 유형별 필수 조문 + 낱말 점수가 높은 조문을 합친다.
import "server-only";

import { findRefs, getAllDocuments, getEvidence, makeRef } from "./documents";
import type { RefSpec } from "./topics";
import type { Evidence } from "./types";

// 조사·어미에서 자주 생겨 점수만 흐리는 두 글자 조각
const STOP_BIGRAMS = new Set(["하는", "하고", "있는", "있다", "니다", "습니", "에서", "으로", "에게", "했는", "했어", "어요", "아요", "해요", "인가", "나요", "는데", "그리", "그런", "이런", "저는", "제가", "우리", "것을", "것이", "하여", "한다", "된다", "또는", "및", "등을", "등의"]);

/** 한글·영문·숫자 두 글자 조각 집합 (조사가 붙어도 낱말이 걸리도록) */
function bigrams(text: string): Set<string> {
  const result = new Set<string>();
  for (const word of text.toLowerCase().split(/[^0-9a-z가-힣]+/)) {
    for (let i = 0; i + 2 <= word.length; i++) {
      const gram = word.slice(i, i + 2);
      if (!STOP_BIGRAMS.has(gram)) result.add(gram);
    }
  }
  return result;
}

interface IndexedArticle {
  ref: string;
  docId: string;
  official: boolean;
  title: Set<string>;
  body: Set<string>;
}

let index: IndexedArticle[] | null = null;

function getIndex(): IndexedArticle[] {
  if (!index) {
    index = getAllDocuments().flatMap((doc) =>
      doc.articles.map((article) => ({
        ref: makeRef(doc.id, article.location),
        docId: doc.id,
        official: doc.category === "공식 근거",
        title: bigrams(article.location + " " + doc.shortTitle),
        body: bigrams(article.text),
      }))
    );
  }
  return index;
}

/** [문서 id, 조문 번호 앞부분] 목록을 실제 조문 식별자로 바꾼다 (없는 것은 빠진다). */
export function resolveRefs(specs: RefSpec[]): string[] {
  return [...new Set(specs.flatMap(([docId, prefix]) => findRefs(docId, prefix)))];
}

export interface SearchOptions {
  query: string;
  /** 꼭 넣을 조문 (상황 유형·전문가별 필수 조문) */
  required?: string[];
  /** 검색할 문서 범위 (없으면 전체) */
  docIds?: string[];
  maxOfficial?: number;
  maxReference?: number;
}

export interface SearchResult {
  official: Evidence[];
  references: Evidence[];
}

/** 입력과 관련된 조문을 공식 근거와 참고 자료로 나눠 돌려준다. */
export function searchEvidence({ query, required = [], docIds, maxOfficial = 15, maxReference = 5 }: SearchOptions): SearchResult {
  const grams = bigrams(query);
  const scored = getIndex()
    .filter((a) => !docIds || docIds.includes(a.docId))
    .map((a) => {
      let score = 0;
      for (const gram of grams) {
        if (a.title.has(gram)) score += 3;
        else if (a.body.has(gram)) score += 1;
      }
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score);

  const pick = (official: boolean, max: number): Evidence[] => {
    const refs = [
      ...required.filter((ref) => getEvidence(ref)?.category === (official ? "공식 근거" : "참고 자료")),
      ...scored.filter((x) => x.a.official === official).map((x) => x.a.ref),
    ];
    // 필수 조문이 max보다 많으면 필수 조문은 모두 넣는다
    const limit = Math.max(max, required.length);
    return [...new Set(refs)]
      .slice(0, limit)
      .map((ref) => getEvidence(ref))
      .filter((e): e is Evidence => Boolean(e));
  };

  return { official: pick(true, maxOfficial), references: pick(false, maxReference) };
}
