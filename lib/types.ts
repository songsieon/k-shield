// Design Ref: §6 — 앱 전체가 함께 쓰는 데이터 모양

/** 문서 구분: 판단 근거로 쓰는 공식 근거와, 배경·경로 안내에만 쓰는 참고 자료 */
export type Category = "공식 근거" | "참고 자료";

/** 조문 하나 (data/documents/*.json의 articles 항목) */
export interface Article {
  location: string;
  text: string;
}

/** 근거 문서 하나 (data/documents/*.json 형식 그대로) */
export interface LawDocument {
  id: string;
  title: string;
  shortTitle: string;
  category: Category;
  type: string;
  effectiveDate: string;
  version: string;
  source: string;
  fictional: boolean;
  note?: string;
  articles: Article[];
}

/** 화면에 보여 줄 근거 하나. 원문(text)은 항상 서버가 데이터에서 직접 붙인다. */
export interface Evidence {
  ref: string; // "문서 id#조문 위치"
  docId: string;
  docTitle: string;
  shortTitle: string;
  category: Category;
  type: string;
  effectiveDate: string;
  location: string;
  text: string;
  source: string;
  fictional: boolean;
}

/** 직원과 주고받은 질문 하나와 그 답 */
export interface Turn {
  question: string;
  answer: string;
}

// ── 청렴 신호등 ─────────────────────────────────────────

export type Verdict = "문제없음" | "위반 가능성 있음" | "위반 소지 높음" | "확인 필요";

export type RequirementStatus = "충족" | "불충족" | "확인 필요";

export interface ExceptionCheck {
  clause: string; // 예: "청탁금지법 제8조제3항제2호"
  requirements: { item: string; status: RequirementStatus; reason: string }[];
}

export interface AmountCheck {
  label: string;
  given: number; // 원
  limit: number; // 원
  summed: boolean; // 여러 번 받은 것을 합산했는지
}

export type ActionKind = "법령 조치" | "사내 절차" | "시스템 경로";

export interface FollowUpAction {
  kind: ActionKind;
  text: string;
  deadline?: string;
  pathStatus?: "확정" | "예시";
}

export interface IntegrityResult {
  verdict: Verdict;
  summary: string;
  exception?: ExceptionCheck;
  amounts: AmountCheck[];
  actions: FollowUpAction[];
  toCheck: string[];
  conflict: boolean;
  evidence: Evidence[]; // 공식 근거 1~3개
  references: Evidence[]; // 참고 자료
}

export type IntegrityResponse =
  | { kind: "question"; question: string; asked: number; max: number }
  | { kind: "result"; result: IntegrityResult }
  | { kind: "out_of_scope"; message: string };

// ── 사업리스크 신호등 ──────────────────────────────────

export type RiskLevel = "상" | "중" | "하";

export type ExpertRole = "법률" | "청렴·윤리" | "계약·예산" | "국민 관점";

export interface RiskIssue {
  risk: string;
  evidence: Evidence[];
  level: RiskLevel;
  reason: string;
  improvement: string;
}

export interface RiskReport {
  experts: { role: ExpertRole; issues: RiskIssue[] }[];
  followUps: { item: string; relatedLaws: string[] }[];
}

export type BusinessRiskResponse =
  | { kind: "question"; question: string; missing: string[] }
  | { kind: "report"; report: RiskReport }
  | { kind: "out_of_scope"; message: string };

// ── 오류 ─────────────────────────────────────────────

export type ErrorCode = "PRIVACY" | "INVALID_INPUT" | "AI_ERROR";

export interface ErrorBody {
  error: { code: ErrorCode; message: string };
}
