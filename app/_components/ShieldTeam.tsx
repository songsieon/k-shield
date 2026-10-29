import Mascot from "./Mascot";

// 마스코트 3종이 큰 방패를 함께 들고 서 있는 장식 그림 (K-SHIELD의 뜻을 그림으로). 비장하게 보이도록 움직이지 않는다.
export default function ShieldTeam() {
  return (
    <div className="relative h-32 w-44 shrink-0 print:hidden sm:h-48 sm:w-72" aria-hidden="true">
      <span className="absolute inset-x-4 bottom-2 top-4 rounded-full bg-white/15 blur-xl" />
      <Mascot name="dog" size={112} className="absolute bottom-[18%] left-0 z-10 h-16 w-16 drop-shadow-lg sm:h-28 sm:w-28" />
      <Mascot name="green" size={112} className="absolute bottom-[18%] right-0 z-10 h-16 w-16 drop-shadow-lg sm:h-28 sm:w-28" />
      <Mascot name="bunny" size={144} className="absolute bottom-[22%] left-1/2 z-10 h-24 w-24 -translate-x-1/2 drop-shadow-lg sm:h-40 sm:w-40" />
      <svg viewBox="0 0 200 120" className="absolute inset-x-1 bottom-0 z-20 h-[36%] w-[calc(100%-0.5rem)] drop-shadow-xl" preserveAspectRatio="none">
        <defs>
          <linearGradient id="shield-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b46b0" />
            <stop offset="1" stopColor="#091f5f" />
          </linearGradient>
        </defs>
        <path d="M8 8 H192 V52 C192 86 150 108 100 118 C50 108 8 86 8 52 Z" fill="url(#shield-fill)" stroke="#ff0050" strokeWidth="5" strokeLinejoin="round" />
        <path d="M18 16 H182 V50 C182 78 146 97 100 106 C54 97 18 78 18 50 Z" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M78 54 L95 71 L125 38" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
