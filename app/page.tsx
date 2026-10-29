import { getAllDocuments } from "@/lib/documents";

import BusinessRiskCheck from "./_components/BusinessRiskCheck";
import IntegrityCheck from "./_components/IntegrityCheck";
import MainTabs from "./_components/MainTabs";
import NoticeBar from "./_components/NoticeBar";

// Design Ref: §8.1 — 화면 1개: 제목 → 안내 띠 → 탭 2개 → 하단 기준일

/** 근거 데이터 기준일: 문서 중 가장 최근 시행일·작성일 */
function getDataDate(): string {
  return getAllDocuments()
    .map((doc) => doc.effectiveDate)
    .sort()
    .at(-1) ?? "";
}

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">캠코 준법 신호등</h1>
        <p className="text-muted">청렴·윤리 리스크를 법령·내규 근거로 미리 점검하세요</p>
      </header>

      <NoticeBar />

      <main>
        <MainTabs integrity={<IntegrityCheck />} businessRisk={<BusinessRiskCheck />} />
      </main>

      <footer className="mt-auto border-t border-border pt-4 text-xs text-muted">
        근거 데이터 기준일 {getDataDate()} · 일부 내규는 실습용 가상 문서입니다
      </footer>
    </div>
  );
}
