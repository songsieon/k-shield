"use client";

import { useEffect, useRef } from "react";

import type { Evidence } from "@/lib/types";

// Design Ref: §8.4 — 근거 원문 보기 창. 원문은 서버가 데이터에서 꺼낸 그대로 보여 주고 고치지 않는다.

interface EvidenceModalProps {
  evidence: Evidence;
  onClose: () => void;
}

export default function EvidenceModal({ evidence, onClose }: EvidenceModalProps) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-2">
            <h2 id="evidence-title" className="text-lg font-semibold">
              {evidence.docTitle}
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-full border border-border px-2 py-0.5">{evidence.category}</span>
              <span className="rounded-full border border-border px-2 py-0.5">{evidence.type}</span>
              {evidence.fictional && (
                <span className="rounded-full bg-verdict-caution px-2 py-0.5 font-semibold text-white">실습용 가상 문서</span>
              )}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm text-muted">
              <dt>위치</dt>
              <dd className="text-foreground">{evidence.location}</dd>
              <dt>{evidence.category === "참고 자료" ? "작성일" : "시행일"}</dt>
              <dd className="text-foreground">{evidence.effectiveDate}</dd>
            </dl>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent"
          >
            닫기
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-wrap leading-7">{evidence.text}</p>
        </div>
        <footer className="border-t border-border px-5 py-3 text-xs text-muted">출처: {evidence.source}</footer>
      </div>
    </div>
  );
}
