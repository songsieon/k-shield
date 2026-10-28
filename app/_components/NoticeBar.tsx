import { MESSAGES } from "@/lib/messages";

// Design Ref: §8.1 — 화면 맨 위 안내 띠 (개인정보·외부 AI 전송·참고용)
export default function NoticeBar() {
  return (
    <aside
      aria-label="이용 안내"
      className="rounded-lg border border-border bg-notice px-4 py-3 text-sm text-notice-foreground"
    >
      <ul className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4">
        <li>⚠️ {MESSAGES.privacyNotice}</li>
        <li>🔁 {MESSAGES.externalAiNotice}</li>
        <li>ℹ️ {MESSAGES.referenceOnly}</li>
      </ul>
    </aside>
  );
}
