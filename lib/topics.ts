// Design Ref: §9 — 상황 유형별로 "꼭 함께 볼 조문"을 정해 두고, 입력에 나온 낱말로 유형을 고른다.
// 조문은 [문서 id, 조문 번호 앞부분]으로 적는다. 앞부분 규칙은 lib/documents.ts의 findRefs를 따른다.

export type RefSpec = [docId: string, prefix: string];

export interface Topic {
  id: string;
  label: string;
  keywords: string[];
  refs: RefSpec[];
}

/** 반부패·청렴 Check 상황 유형 */
export const INTEGRITY_TOPICS: Topic[] = [
  {
    id: "gift",
    label: "선물·금품·식사",
    keywords: ["선물", "금품", "상품권", "기프티콘", "카카오톡", "모바일", "식사", "밥", "음식", "저녁", "점심", "회식", "술", "커피", "접대", "향응", "골프", "경조사", "축의", "조의", "화환", "명절", "현금", "돈", "받았", "보냈", "보내", "줬", "주었", "세트", "홍삼", "과일", "꽃"],
    refs: [
      ["law-cheongtak", "제2조"], ["law-cheongtak", "제8조"], ["law-cheongtak", "제9조"], ["law-cheongtak", "제22조"], ["law-cheongtak", "제23조"],
      ["law-cheongtak-decree", "제17조"], ["law-cheongtak-decree", "제18조"], ["law-cheongtak-decree", "[별표 1]"],
      ["rule-code-of-conduct", "제27조"], ["rule-code-of-conduct", "제50조"], ["rule-code-of-conduct", "[별표 1]"],
      ["rule-solicitation-report", "제4조"], ["rule-solicitation-report", "제5조"],
      ["ref-report-channels", "3."],
    ],
  },
  {
    id: "lecture",
    label: "외부강의·기고",
    keywords: ["강의", "강연", "기고", "세미나", "발표", "토론", "사례금", "원고료", "출강", "강사"],
    refs: [
      ["law-cheongtak", "제10조"],
      ["law-cheongtak-decree", "제25조"], ["law-cheongtak-decree", "제26조"], ["law-cheongtak-decree", "제27조"], ["law-cheongtak-decree", "[별표 2]"],
      ["rule-code-of-conduct", "제35조의2"], ["rule-code-of-conduct", "제35조의3"], ["rule-code-of-conduct", "[별표 2]"],
      ["ref-report-channels", "4."],
    ],
  },
  {
    id: "outside",
    label: "직무 관련 외부활동",
    keywords: ["외부활동", "겸직", "자문", "위원", "이사", "취임", "대리", "부업", "컨설팅"],
    refs: [
      ["law-conflict", "제10조"],
      ["rule-conflict-of-interest", "제6조"],
      ["ref-report-channels", "5."],
    ],
  },
  {
    id: "realEstate",
    label: "부동산",
    keywords: ["부동산", "토지", "땅", "아파트", "주택", "건물", "매수", "매입", "분양", "경매", "공매", "청약", "상가"],
    refs: [
      ["law-conflict", "제6조"], ["law-conflict", "제14조"], ["law-conflict-decree", "제9조"],
      ["rule-code-of-conduct", "제24조"], ["rule-code-of-conduct", "제25조"],
      ["rule-real-estate", "제2조"], ["rule-real-estate", "제3조"], ["rule-real-estate", "제4조"], ["rule-real-estate", "제5조"], ["rule-real-estate", "제7조"],
      ["rule-conflict-of-interest", "제4조"],
      ["law-state-property", "제20조"], ["law-tax-collection", "제80조"],
      ["ref-report-channels", "7."],
    ],
  },
  {
    id: "stock",
    label: "주식·미공개 정보",
    keywords: ["주식", "증권", "투자", "미공개", "내부정보", "코인", "채권"],
    refs: [
      ["law-conflict", "제14조"],
      ["rule-code-of-conduct", "제24조"],
      ["rule-conflict-of-interest", "제10조"],
      ["rule-integrity-guidelines", "【별표 5】"], ["rule-integrity-guidelines", "【별표 6】"],
    ],
  },
  {
    id: "privateInterest",
    label: "사적 이해관계",
    keywords: ["가족", "배우자", "아내", "남편", "부모", "아버지", "어머니", "아들", "딸", "자녀", "친척", "친구", "지인", "동창", "동기", "사적", "이해관계", "회피", "채용", "수의계약", "거래하", "거래했", "빌려", "빌리", "빌린", "대여", "꾸"],
    refs: [
      ["law-conflict", "제2조"], ["law-conflict", "제5조"], ["law-conflict", "제7조"], ["law-conflict", "제9조"], ["law-conflict", "제11조"], ["law-conflict", "제12조"],
      ["law-conflict-decree", "제3조"], ["law-conflict-decree", "제4조"],
      ["rule-conflict-of-interest", "제3조"], ["rule-conflict-of-interest", "제5조"], ["rule-conflict-of-interest", "제7조"], ["rule-conflict-of-interest", "제8조"],
      ["ref-report-channels", "6."], ["ref-report-channels", "7."],
    ],
  },
  {
    id: "retiree",
    label: "퇴직자 접촉",
    keywords: ["퇴직", "전관", "선배", "OB", "여행"],
    refs: [
      ["law-conflict", "제15조"], ["law-conflict-decree", "제15조"],
      ["rule-conflict-of-interest", "제9조"],
      ["rule-code-of-conduct", "제38조의3"],
      ["ref-report-channels", "8."],
    ],
  },
  {
    id: "solicitation",
    label: "부정청탁·부당한 요구",
    keywords: ["청탁", "부탁", "압력", "봐달", "선처", "인사", "승진", "특혜", "지시", "요구"],
    refs: [
      ["law-cheongtak", "제5조"], ["law-cheongtak", "제6조"], ["law-cheongtak", "제7조"],
      ["rule-code-of-conduct", "제15조"], ["rule-code-of-conduct", "제17조"], ["rule-code-of-conduct", "제20조"], ["rule-code-of-conduct", "제23조"], ["rule-code-of-conduct", "제37조의2"],
      ["rule-solicitation-report", "제3조"],
      ["ref-report-channels", "2."],
    ],
  },
  {
    id: "report",
    label: "부패행위 신고",
    keywords: ["신고", "제보", "부패", "비리", "고발", "위반행위", "공익", "목격", "봤어", "보았", "동료가", "상급자가", "팀장이"],
    refs: [
      ["law-anticorruption", "제55조"], ["law-anticorruption", "제56조"], ["law-anticorruption", "제62조"], ["law-anticorruption", "제64조"],
      ["law-cheongtak", "제13조"], ["law-conflict", "제18조"],
      ["rule-code-of-conduct", "제45조"], ["rule-code-of-conduct", "제46조"], ["rule-code-of-conduct", "제48조"],
      ["law-whistleblower", "제6조"], ["law-whistleblower", "제15조"],
      ["rule-corruption-report", "제3조"], ["rule-corruption-report", "제4조"],
      ["ref-report-channels", "9."],
    ],
  },
];

/** 반부패·청렴 Check에서 상황과 관계없이 항상 함께 주는 조문 (직무관련자 정의, 업무 소개, 상담 경로) */
export const INTEGRITY_ALWAYS: RefSpec[] = [
  ["rule-code-of-conduct", "제2조"],
  ["rule-code-of-conduct", "제44조"],
  ["ref-kamco-business", "10."],
  ["ref-report-channels", "1."],
  ["ref-report-channels", "10."],
];

/** 사업리스크 Check 전문가별 검색 범위와 꼭 볼 조문 */
export interface ExpertScope {
  role: "법률" | "청렴·윤리" | "계약·예산" | "국민 관점";
  docIds: string[];
  refs: RefSpec[];
}

export const EXPERT_SCOPES: ExpertScope[] = [
  {
    role: "법률",
    docIds: ["law-kamco", "law-kamco-decree", "law-state-property", "law-state-property-decree", "law-public-property", "law-tax-collection", "law-public-institutions", "law-credit-info", "law-whistleblower", "ref-kamco-business"],
    refs: [["law-kamco", "제26조"], ["law-state-property", "제3조"], ["law-state-property", "제20조"], ["law-public-institutions", "제15조"]],
  },
  {
    role: "청렴·윤리",
    docIds: ["law-cheongtak", "law-cheongtak-decree", "law-conflict", "law-conflict-decree", "law-anticorruption", "rule-code-of-conduct", "rule-integrity-guidelines", "rule-conflict-of-interest", "rule-real-estate"],
    refs: [["law-conflict", "제5조"], ["law-conflict", "제12조"], ["law-conflict", "제14조"], ["rule-code-of-conduct", "제17조"], ["rule-code-of-conduct", "제30조"]],
  },
  {
    role: "계약·예산",
    docIds: ["law-public-contract-rule", "law-state-contract", "law-state-contract-decree", "law-public-institutions"],
    refs: [
      ["law-public-contract-rule", "제5조"], ["law-public-contract-rule", "제6조"], ["law-public-contract-rule", "제8조"], ["law-public-contract-rule", "제8조의2"],
      ["law-state-contract", "제5조의2"], ["law-state-contract", "제7조"], ["law-state-contract-decree", "제26조"], ["law-state-contract-decree", "제68조"],
    ],
  },
  {
    role: "국민 관점",
    docIds: ["law-privacy", "law-privacy-decree", "law-credit-info", "law-whistleblower", "law-public-institutions"],
    refs: [["law-privacy", "제15조"], ["law-privacy", "제17조"], ["law-privacy", "제26조"], ["law-privacy", "제33조"], ["law-public-institutions", "제11조"], ["law-public-institutions", "제13조"]],
  },
];

/** 입력 낱말로 고른 반부패·청렴 Check 상황 유형 */
export function pickTopics(text: string): Topic[] {
  return INTEGRITY_TOPICS.filter((topic) => topic.keywords.some((word) => text.includes(word)));
}
