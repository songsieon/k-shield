import { getAllDocuments } from "@/lib/documents";

import BusinessRiskCheck from "./_components/BusinessRiskCheck";
import IntegrityCheck from "./_components/IntegrityCheck";
import Mascot from "./_components/Mascot";
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
      <header className="hero-card flex items-center gap-3 rounded-2xl border border-border p-4 sm:gap-5 sm:p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="text-2xl font-bold">K-SHIELD</h1>
        <p className="text-sm font-medium tracking-wide text-muted">
          <b className="text-accent">K</b>AMCO <b className="text-accent">S</b>mart <b className="text-accent">H</b>elp for <b className="text-accent">I</b>ntegrity,{" "}
          <b className="text-accent">E</b>thics, <b className="text-accent">L</b>aw &amp; <b className="text-accent">D</b>ecisions
        </p>
        <p className="text-muted">부패방지 법령·내규 준수 여부와 사업 수행의 법령 위반 및 윤리적 리스크를 간편하게, 미리 점검하세요.</p>
      </div>
        <div className="flex shrink-0 items-end -space-x-3 print:hidden" aria-hidden="true">
          <Mascot name="dog" size={64} className="mascot-bob h-12 w-12 sm:h-16 sm:w-16" />
          <Mascot name="bunny" size={72} className="mascot-bob mascot-delay-1 z-10 h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem]" />
          <Mascot name="green" size={64} className="mascot-bob mascot-delay-2 h-12 w-12 sm:h-16 sm:w-16" />
        </div>
      </header>

      <NoticeBar />

      <main>
        <MainTabs integrity={<IntegrityCheck />} businessRisk={<BusinessRiskCheck />} />
      </main>

      <footer className="mt-auto border-t border-border pt-4 text-xs text-muted">
        근거 데이터 기준일 {getDataDate()} · 일부 내규는 실습용 가상 문서입니다.
      </footer>
    </div>
  );
}
