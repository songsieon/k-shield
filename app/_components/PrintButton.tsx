"use client";

// nice 기능: 보고서 PDF 저장. 브라우저 인쇄 창을 열어 "PDF로 저장"을 고르게 한다 (추가 도구 없음).
export default function PrintButton() {
  return (
    <div className="flex flex-col items-end gap-1 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg border border-accent px-3 py-1.5 text-sm text-accent hover:bg-accent hover:text-accent-foreground"
      >
        PDF로 저장
      </button>
      <span className="text-xs text-muted">인쇄 창에서 대상을 &quot;PDF로 저장&quot;으로 고르세요</span>
    </div>
  );
}
