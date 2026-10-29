import { SIGNAL_NAME, type Signal } from "@/lib/signal";

// 신호등 그림: 빨강·노랑·초록 3개 등 중 지금 신호만 밝게 보여 준다.
// 색을 구분하기 어려운 사람도 알 수 있게 켜진 등의 위치(빨강=왼쪽, 노랑=가운데, 초록=오른쪽)와 글자 이름을 함께 쓴다.

const ORDER: Signal[] = ["red", "yellow", "green"];

const LAMP: Record<Signal, string> = {
  red: "bg-signal-red",
  yellow: "bg-signal-yellow",
  green: "bg-signal-green",
};

export default function SignalLight({ signal, size = "md" }: { signal: Signal; size?: "sm" | "md" }) {
  const lamp = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span
      role="img"
      aria-label={`신호등: ${SIGNAL_NAME[signal]}`}
      className="signal-lamp inline-flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-1.5"
    >
      {ORDER.map((s) => (
        <span
          key={s}
          className={`${lamp} rounded-full ${LAMP[s]} ${s === signal ? "ring-2 ring-white/70" : "opacity-20"}`}
        />
      ))}
    </span>
  );
}
