// Design Ref: §10.2 — 개인정보 형식 검사. 화면(보내기 전)과 서버(받은 뒤)에서 같은 함수를 쓴다.

export type PrivacyKind = "주민등록번호" | "전화번호" | "계좌번호";

const PATTERNS: { kind: PrivacyKind; regex: RegExp }[] = [
  // 생년월일 6자리 + 성별·외국인 구분 숫자(1~8)로 시작하는 7자리
  { kind: "주민등록번호", regex: /(?<!\d)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\s?[-–]?\s?[1-8]\d{6}(?!\d)/ },
  // 휴대전화: 010-1234-5678, 010 1234 5678, 01012345678
  { kind: "전화번호", regex: /(?<!\d)01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}(?!\d)/ },
  // 일반전화: 02-123-4567, 051-1234-5678 (구분 기호가 있을 때만)
  { kind: "전화번호", regex: /(?<!\d)0\d{1,2}[-.)\s]\d{3,4}[-.\s]\d{4}(?!\d)/ },
];

// 계좌번호: 숫자 묶음 3~4개를 하이픈으로 이은 것 중 숫자가 10~16자리인 것 (날짜 2026-10-28 등은 제외)
const ACCOUNT_REGEX = /(?<![\d-])\d{2,6}(?:-\d{2,8}){2,3}(?![\d-])/g;

/** 입력에서 찾은 개인정보 종류 목록 (없으면 빈 배열) */
export function findPrivacy(text: string): PrivacyKind[] {
  const found = new Set<PrivacyKind>();
  for (const { kind, regex } of PATTERNS) {
    if (regex.test(text)) found.add(kind);
  }
  for (const match of text.matchAll(ACCOUNT_REGEX)) {
    const digits = match[0].replace(/-/g, "").length;
    // 전화번호·주민등록번호 모양이면 계좌번호로 다시 세지 않는다
    const isOther = PATTERNS.some(({ regex }) => regex.test(match[0]));
    if (digits >= 10 && digits <= 16 && !isOther) found.add("계좌번호");
  }
  return [...found];
}

export function hasPrivacy(...texts: string[]): boolean {
  return texts.some((text) => findPrivacy(text).length > 0);
}
