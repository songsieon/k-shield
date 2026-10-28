import { getAllDocuments, getEvidence } from "@/lib/documents";
import type { Evidence } from "@/lib/types";

import EvidenceList from "./_components/EvidenceList";
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

// TODO(PLAN 16·21): 기능 화면을 만들면 아래 준비 중 패널과 예시 근거를 지운다.
function ComingSoon({ name, sample }: { name: string; sample: Evidence[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-card p-6">
      <p className="text-sm text-muted">{name} 화면은 다음 단계에서 만듭니다. 아래는 원문 보기 창 확인용 예시 근거입니다.</p>
      <EvidenceList items={sample} title="예시 근거" />
    </div>
  );
}

export default function Home() {
  const sample = [
    "law-cheongtak#제8조(금품등의 수수 금지)",
    "rule-solicitation-report#제4조(수수 금지 금품등의 신고)",
    "ref-report-channels#3. 수수 금지 금품등(선물·모바일 상품권 포함)을 받은 경우",
  ]
    .map((ref) => getEvidence(ref))
    .filter((e): e is Evidence => Boolean(e));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">캠코 준법 콕</h1>
        <p className="text-muted">청렴·윤리 리스크를 법령·내규 근거로 미리 점검하세요</p>
      </header>

      <NoticeBar />

      <main>
        <MainTabs
          integrity={<ComingSoon name="청렴 콕!" sample={sample} />}
          businessRisk={<ComingSoon name="사업 리스크 콕!" sample={sample.slice(0, 1)} />}
        />
      </main>

      <footer className="mt-auto border-t border-border pt-4 text-xs text-muted">
        근거 데이터 기준일 {getDataDate()} · 일부 내규는 실습용 가상 문서입니다
      </footer>
    </div>
  );
}
