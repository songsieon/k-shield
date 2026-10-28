"use client";

import { useState, type ReactNode } from "react";

// Design Ref: §8.1 — 탭 2개. 탭을 바꿔도 입력·대화가 사라지지 않도록 두 패널을 모두 그려 두고 숨기기만 한다.

const TABS = [
  { id: "integrity", label: "청렴 콕!", description: "내 행동이 기준에 맞는지 점검" },
  { id: "business-risk", label: "사업 리스크 콕!", description: "사업계획의 법령·청렴 리스크 검토" },
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
      <div role="tablist" aria-label="기능 선택" className="grid grid-cols-2 gap-2">
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
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-accent"
              }`}
            >
              <span className="block text-base font-semibold">{tab.label}</span>
              <span className={`block text-xs ${selected ? "opacity-90" : "text-muted"}`}>{tab.description}</span>
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
