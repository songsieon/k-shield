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
      <header className="hero-card relative flex flex-col gap-3 overflow-hidden rounded-3xl p-5 pb-6 text-white shadow-lg sm:p-7 sm:pb-8">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">K-SHIELD</h1>
          </div>
          <div className="relative flex shrink-0 items-end -space-x-5 pr-1 print:hidden sm:-space-x-7" aria-hidden="true">
            <span className="absolute inset-x-2 bottom-0 top-3 rounded-full bg-white/15 blur-xl" />
            <Mascot name="dog" size={96} className="mascot-bob relative -rotate-6 h-14 w-14 drop-shadow-lg sm:h-24 sm:w-24" />
            <Mascot name="bunny" size={112} className="mascot-bob mascot-delay-1 relative z-10 h-[4.5rem] w-[4.5rem] drop-shadow-lg sm:h-32 sm:w-32" />
            <Mascot name="green" size={96} className="mascot-bob mascot-delay-2 relative rotate-6 h-14 w-14 drop-shadow-lg sm:h-24 sm:w-24" />
          </div>
        </div>
        <p className="whitespace-nowrap text-[clamp(0.6rem,2.9vw,1rem)] font-semibold tracking-wide text-white">
          <b className="text-hero-key">K</b>AMCO <b className="text-hero-key">S</b>mart <b className="text-hero-key">H</b>elp for <b className="text-hero-key">I</b>ntegrity, <b className="text-hero-key">E</b>thics, <b className="text-hero-key">L</b>aw &amp; <b className="text-hero-key">D</b>ecisions
        </p>
        <p className="border-t border-white/20 pt-3 text-sm leading-6 text-white/90 sm:text-base">부패방지 법령·내규 준수 여부와 사업 수행의 법령 위반 및 윤리적 리스크를 간편하게, 미리 점검하세요.</p>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-brand-red" aria-hidden="true" />
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
