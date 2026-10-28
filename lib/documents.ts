// Design Ref: §5.3 — 근거 문서는 data/documents/*.json을 서버에서 한 번만 읽어 메모리에 둔다.
import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { Evidence, LawDocument } from "./types";

const DOCUMENTS_DIR = path.join(process.cwd(), "data", "documents");

let cache: LawDocument[] | null = null;

/** 모든 근거 문서 (파일 이름 순) */
export function getAllDocuments(): LawDocument[] {
  if (!cache) {
    cache = fs
      .readdirSync(DOCUMENTS_DIR)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => JSON.parse(fs.readFileSync(path.join(DOCUMENTS_DIR, file), "utf8")) as LawDocument);
  }
  return cache;
}

export function getDocument(docId: string): LawDocument | undefined {
  return getAllDocuments().find((doc) => doc.id === docId);
}

/** 조문을 가리키는 식별자: "문서 id#조문 위치" */
export function makeRef(docId: string, location: string): string {
  return `${docId}#${location}`;
}

/** 식별자로 근거를 꺼낸다. 데이터에 없으면 undefined (지어낸 근거를 걸러 내는 데 쓴다). */
export function getEvidence(ref: string): Evidence | undefined {
  const cut = ref.indexOf("#");
  if (cut < 0) return undefined;
  const doc = getDocument(ref.slice(0, cut));
  const article = doc?.articles.find((a) => a.location === ref.slice(cut + 1));
  if (!doc || !article) return undefined;
  return {
    ref,
    docId: doc.id,
    docTitle: doc.title,
    shortTitle: doc.shortTitle,
    category: doc.category,
    type: doc.type,
    effectiveDate: doc.effectiveDate,
    location: article.location,
    text: article.text,
    source: doc.source,
    fictional: doc.fictional,
  };
}

/**
 * 조문 번호 앞부분으로 조문을 찾는다.
 * "제8조"는 "제8조(금품등의 수수 금지)"와 맞고 "제8조의2(...)"와는 맞지 않는다.
 * "[별표 1]", "3." 처럼 괄호가 없는 위치는 앞부분이 같으면 맞는 것으로 본다.
 */
export function findRefs(docId: string, prefix: string): string[] {
  const doc = getDocument(docId);
  if (!doc) return [];
  const isArticleNo = /^제\d+조(의\d+)?$/.test(prefix);
  return doc.articles
    .filter((a) => (isArticleNo ? a.location === prefix || a.location.startsWith(prefix + "(") : a.location.startsWith(prefix)))
    .map((a) => makeRef(doc.id, a.location));
}
