"use client";

import { useState } from "react";

import type { Evidence } from "@/lib/types";

import EvidenceModal from "./EvidenceModal";

// Design Ref: §8.2 — 근거 목록. 문서명·위치·시행일과 [원문 보기] 버튼을 보여 준다.

interface EvidenceListProps {
  items: Evidence[];
  title?: string;
}

export default function EvidenceList({ items, title = "근거" }: EvidenceListProps) {
  const [opened, setOpened] = useState<Evidence | null>(null);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {title && <h3 className="text-sm font-semibold text-muted">{title}</h3>}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.ref}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
          >
            <div className="flex min-w-0 flex-col">
              <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                {item.shortTitle} {item.location}
                {item.category === "참고 자료" && (
                  <span className="rounded-full border border-border px-1.5 text-xs font-normal text-muted">참고 자료</span>
                )}
                {item.fictional && (
                  <span className="rounded-full bg-verdict-caution px-1.5 text-xs font-normal text-white">가상</span>
                )}
              </span>
              <span className="text-xs text-muted">
                {item.category === "참고 자료" ? "작성일" : "시행일"} {item.effectiveDate}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpened(item)}
              className="shrink-0 rounded-md border border-accent px-3 py-1 text-sm text-accent hover:bg-accent hover:text-accent-foreground"
            >
              원문 보기
            </button>
          </li>
        ))}
      </ul>
      {opened && <EvidenceModal evidence={opened} onClose={() => setOpened(null)} />}
    </div>
  );
}
