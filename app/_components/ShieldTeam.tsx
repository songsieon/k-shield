import Mascot from "./Mascot";

// 마스코트 3종이 큰 방패를 함께 들고 서 있는 장식 그림 (K-SHIELD의 뜻을 그림으로). 비장하게 보이도록 움직이지 않는다.
// 방패는 가운데에 세우고, 강아지·초록 토끼는 양옆에서 가장자리를 잡고, 하얀 토끼는 위에서 방패 윗부분을 잡는다.
const HAND = "absolute z-30 h-4 w-4 rounded-full border-2 border-white/90 shadow-md sm:h-6 sm:w-6";

export default function ShieldTeam() {
  return (
    <div className="relative h-44 w-48 shrink-0 print:hidden sm:h-64 sm:w-80" aria-hidden="true">
      <span className="absolute inset-x-6 bottom-0 top-6 rounded-full bg-white/15 blur-xl" />
      <Mascot name="bunny" size={144} className="absolute left-1/2 top-0 z-10 h-[56%] w-[56%] -translate-x-1/2 object-contain drop-shadow-lg" />
      <Mascot name="dog" size={112} className="absolute bottom-[6%] left-0 z-10 h-[44%] w-[38%] object-contain drop-shadow-lg" />
      <Mascot name="green" size={112} className="absolute bottom-[6%] right-0 z-10 h-[44%] w-[38%] object-contain drop-shadow-lg" />

      <svg viewBox="0 0 120 150" preserveAspectRatio="none" className="absolute bottom-0 left-[27%] top-[38%] z-20 h-[62%] w-[46%] drop-shadow-xl">
        <defs>
          <linearGradient id="shield-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2352c4" />
            <stop offset="1" stopColor="#091f5f" />
          </linearGradient>
        </defs>
        <path d="M60 3 Q88 12 114 12 V72 C114 112 88 136 60 148 C32 136 6 112 6 72 V12 Q32 12 60 3 Z" fill="#ff0050" />
        <path d="M60 11 Q84 19 106 19 V72 C106 106 84 128 60 139 C36 128 14 106 14 72 V19 Q36 19 60 11 Z" fill="url(#shield-blue)" />
        <path d="M60 11 V139 M14 62 H106" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2" />
        <circle cx="60" cy="62" r="22" fill="#ffffff" fillOpacity="0.14" />
        <path d="M47 62 L56 71 L74 50" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <span className={`${HAND} left-[41%] top-[40%] bg-[#fdfdfd]`} />
      <span className={`${HAND} left-[54%] top-[40%] bg-[#fdfdfd]`} />
      <span className={`${HAND} left-[24%] top-[62%] bg-[#efdcb8]`} />
      <span className={`${HAND} right-[24%] top-[62%] bg-[#a6d124]`} />
    </div>
  );
}
