// 점검 중임을 알리는 방패 모양 로딩 화면. 화면 가운데에 떠서 점검하기를 누른 뒤 기다리는 동안 보인다.
// 움직임은 globals.css의 shield-* 애니메이션이며, 움직임 줄이기 설정을 켠 사용자에게는 멈춘다.
export default function ShieldLoader({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm print:hidden">
      <div role="status" aria-live="polite" className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-card px-6 py-7 text-center shadow-2xl">
        <div className="relative h-28 w-28">
          <span className="shield-ring absolute inset-0 rounded-full" aria-hidden="true" />
          <svg viewBox="0 0 120 150" className="shield-pulse absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] drop-shadow-lg" aria-hidden="true">
            <defs>
              <linearGradient id="loader-blue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2352c4" />
                <stop offset="1" stopColor="#091f5f" />
              </linearGradient>
            </defs>
            <path d="M60 3 Q88 12 114 12 V72 C114 112 88 136 60 148 C32 136 6 112 6 72 V12 Q32 12 60 3 Z" fill="#ff0050" />
            <path d="M60 11 Q84 19 106 19 V72 C106 106 84 128 60 139 C36 128 14 106 14 72 V19 Q36 19 60 11 Z" fill="url(#loader-blue)" />
            <path className="shield-check" d="M40 74 L55 89 L82 54" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-base font-bold">{message}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
        <span className="shield-dots flex gap-1.5" aria-hidden="true">
          <i /> <i /> <i />
        </span>
      </div>
    </div>
  );
}
