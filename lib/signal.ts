// 신호등 표시 규칙: 내부 판정(청렴 신호등 4단계, 사업리스크 신호등 상/중/하)은 그대로 두고, 화면에는 신호 3색으로 함께 보여 준다.
// 화면과 서버 어디서나 쓸 수 있도록 서버 전용 모듈을 쓰지 않는다.
import type { RiskLevel, RiskReport, Verdict } from "./types";

export type Signal = "green" | "yellow" | "red";

export const SIGNAL_NAME: Record<Signal, string> = {
  green: "초록",
  yellow: "노랑",
  red: "빨강",
};

export const SIGNAL_EMOJI: Record<Signal, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
};

/** 청렴 신호등: 문제없음=초록, 위반 가능성 있음·확인 필요=노랑(문구로 구분), 위반 소지 높음=빨강 */
export function verdictSignal(verdict: Verdict): Signal {
  if (verdict === "문제없음") return "green";
  if (verdict === "위반 소지 높음") return "red";
  return "yellow";
}

/** 사업리스크 신호등 쟁점별: 상=빨강, 중=노랑, 하=초록 */
export function levelSignal(level: RiskLevel): Signal {
  if (level === "상") return "red";
  if (level === "중") return "yellow";
  return "green";
}

export interface OverallSignal {
  signal: Signal;
  text: string;
}

/**
 * 사업리스크 신호등 종합: 상이 1개 이상이면 빨강, 중이 있으면 노랑, 모두 하이면 초록.
 * 근거가 있는 쟁점이 하나도 없으면 판단한 것이 없으므로 초록으로 보이지 않게 노랑으로 한다.
 */
export function overallRiskSignal(report: RiskReport): OverallSignal {
  const levels = report.experts.flatMap((expert) => expert.issues.map((issue) => issue.level));
  const count = (level: RiskLevel) => levels.filter((l) => l === level).length;
  if (count("상") > 0) return { signal: "red", text: `위험 수준 '상' 쟁점이 ${count("상")}개 있습니다` };
  if (count("중") > 0) return { signal: "yellow", text: `'상'은 없고 '중' 쟁점이 ${count("중")}개 있습니다` };
  if (levels.length === 0) return { signal: "yellow", text: "근거와 함께 제시할 쟁점이 없어 추가 확인이 필요합니다" };
  return { signal: "green", text: "모든 쟁점이 '하'입니다" };
}
