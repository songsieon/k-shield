"use client";

import { useState, type ReactNode } from "react";

import Mascot, { type MascotName } from "./Mascot";

// Design Ref: §8.1 — 탭 2개. 탭을 바꿔도 입력·대화가 사라지지 않도록 두 패널을 모두 그려 두고 숨기기만 한다.

const TABS = [
  { id: "integrity", label: "반부패·청렴 Check", description: "내 행동이 기준에 맞는지 점검", mascot: "bunny" as MascotName },
  { id: "business-risk", label: "사업리스크 Check", description: "사업계획의 법령·청렴 리스크 검토", mascot: "dog" as MascotName },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface MainTabsProps {
  integrity: ReactNode;
  businessRisk: ReactNode;
}

export default function MainTabs({ integrity, businessRisk }: MainTabsProps) {
  const [active, setActive] = useState<TabId>("integrity");
  const panels: Record<TabId, ReactNode> = { integrity, "business-risk": businessRisk };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-muted print:hidden">무엇을 점검할까요?</p>
      <div role="tablist" aria-label="기능 선택" className="grid grid-cols-2 gap-3 print:hidden">
        {TABS.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                selected
                  ? "border-brand-red bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-accent"
              }`}
            >
              <span className="min-w-0">
                <span className="block text-base font-bold">{tab.label}</span>
                <span className={`block text-xs ${selected ? "opacity-90" : "text-muted"}`}>{tab.description}</span>
              </span>
              <Mascot name={tab.mascot} size={56} className="h-10 w-10 shrink-0 sm:h-14 sm:w-14" />
            </button>
          );
        })}
      </div>

      {TABS.map((tab) => (
        <section
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
        >
          {panels[tab.id]}
        </section>
      ))}
    </div>
  );
}
