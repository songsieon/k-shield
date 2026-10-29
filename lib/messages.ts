// Design Ref: §7.3, PRD 5장 정해진 안내 문구 — 화면과 서버가 같은 문구를 쓰도록 한곳에 모은다.

export const MESSAGES = {
  waiting: "검토 중입니다…",
  aiError: "잠시 후 다시 시도해 주세요",
  outOfScope: "K-SHIELD는 법령·청렴·윤리 점검만 도와드립니다.",
  noEvidence: "근거를 찾지 못했습니다. 청렴·윤리 담당 부서에 확인하세요",
  conflict: "서로 다르게 정해져 있으니 담당 부서에 확인하세요",
  privacyDetected: "개인정보가 포함돼 있어요",
  privacyNotice: "개인정보를 입력하지 마세요. 상대방은 'A업체 담당자'처럼 적어 주세요",
  businessPrivacyNotice: "개인정보와 대외비 내용은 빼고 입력해 주세요",
  externalAiNotice: "입력한 내용은 답변을 만들기 위해 외부 AI 서비스로 전송됩니다",
  referenceOnly: "결과는 사전 점검을 위한 참고용으로만 활용하여 주시기 바랍니다.",
  emptyInput: "내용을 입력해 주세요",
  tooLongInput: "입력이 너무 깁니다. 5,000자 이내로 줄여 주세요",
} as const;

/** 한 번에 받을 수 있는 입력 길이 (과도한 요청 방지) */
export const MAX_INPUT_LENGTH = 5000;

/** 반부패·청렴 Check 추가 질문 최대 개수 (PRD 5장 규칙 2) */
export const MAX_QUESTIONS = 10;

/** 사업리스크 Check 필수 정보 4가지 (PRD 5장 must ② 규칙 1) — 하나씩 물으므로 질문도 최대 4개 */
export const REQUIRED_PLAN_FIELDS = ["사업 목적", "대상", "예산", "계약 방식"] as const;
