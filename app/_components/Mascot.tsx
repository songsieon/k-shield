import Image from "next/image";

// 캠코 마스코트 3종: 베이지 강아지, 하얀 토끼, 초록 토끼. 장식용이므로 스크린리더는 건너뛴다.
const MASCOTS = {
  dog: "/mascots/dog.webp",
  bunny: "/mascots/bunny.webp",
  green: "/mascots/green.webp",
} as const;

export type MascotName = keyof typeof MASCOTS;

export default function Mascot({ name, size, className = "" }: { name: MascotName; size: number; className?: string }) {
  return <Image src={MASCOTS[name]} alt="" width={size} height={size} className={`select-none ${className}`} aria-hidden="true" />;
}
