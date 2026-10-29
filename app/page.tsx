import Image from "next/image";

import { getAllDocuments } from "@/lib/documents";

import BusinessRiskCheck from "./_components/BusinessRiskCheck";
import IntegrityCheck from "./_components/IntegrityCheck";
import MainTabs from "./_components/MainTabs";
import NoticeBar from "./_components/NoticeBar";
import ShieldTeam from "./_components/ShieldTeam";

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
          <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-3">
            <span className="rounded-xl bg-white px-2.5 py-1.5 shadow-md">
              <Image src="/kamco-logo.png" alt="캠코 한국자산관리공사 로고" width={340} height={300} className="h-12 w-auto sm:h-16" priority />
            </span>
            <h1 className="whitespace-nowrap text-3xl font-extrabold tracking-tight sm:text-4xl">K-SHIELD</h1>
          </div>
          <ShieldTeam />
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
