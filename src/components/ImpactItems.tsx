"use client";

import { motion } from "framer-motion";

export const OPPORTUNITY_ITEMS = [
    { name: "스타벅스 아메리카노", price: 5_000 },
    { name: "BBQ 황금올리브 치킨", price: 25_000 },
    { name: "하이엔드 오마카세 2인", price: 300_000 },
    { name: "에어팟 프로 2세대", price: 350_000 },
    { name: "아이패드 프로 13인치", price: 1_200_000 },
    { name: "맥북 프로 16인치 M3 Max", price: 6_000_000 },
    { name: "샤넬 클래식 플랩백", price: 15_000_000 },
    { name: "롤렉스 서브마리너", price: 20_000_000 },
    { name: "테슬라 모델 3 롱레인지", price: 60_000_000 },
    { name: "테슬라 모델 Y 퍼포먼스", price: 72_000_000 },
    { name: "포르쉐 911 카레라 S", price: 200_000_000 },
    { name: "페라리 로마", price: 350_000_000 },
    { name: "서울 소형 아파트", price: 800_000_000 },
    { name: "서울 마포구 국평 아파트", price: 1_500_000_000 },
    { name: "강남구 신축 국평 아파트", price: 3_000_000_000 },
    { name: "한강뷰 펜트하우스", price: 7_000_000_000 },
    { name: "한남더힐 100평", price: 12_000_000_000 },
    { name: "로또 1등 당첨 최고액", price: 40_000_000_000 },
    { name: "오징어 게임 상금", price: 45_600_000_000 },
];

const KRW = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
});

const PLAIN = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

export default function ImpactItems({ currentAsset }: { currentAsset: number }) {
    return (
        <div className="flex flex-col gap-3">
            {OPPORTUNITY_ITEMS.map((item) => {
                const isUnlocked = currentAsset >= item.price;
                const count = isUnlocked ? Math.floor(currentAsset / item.price) : 0;

                return (
                    <motion.div
                        key={item.name}
                        initial={false}
                        animate={{
                            borderColor: isUnlocked ? "#FF2A2A" : "#111111",
                            backgroundColor: isUnlocked ? "rgba(255,42,42,0.12)" : "#050505",
                            boxShadow: isUnlocked
                                ? "0 0 24px rgba(255,42,42,0.3), inset 0 0 12px rgba(255,42,42,0.15)"
                                : "0 0 0 rgba(0,0,0,0)",
                            scale: isUnlocked ? 1.02 : 1.0,
                        }}
                        transition={{ type: "spring", stiffness: 250, damping: 20 }}
                        className="flex w-full items-center justify-between rounded-2xl border p-4 transition-colors duration-300"
                    >
                        <div>
                            <h4
                                className={`text-lg font-black tracking-tight ${isUnlocked ? "text-white" : "text-zinc-600"
                                    }`}
                            >
                                {item.name}
                            </h4>
                            <p className="mt-1 font-mono text-xs text-zinc-500">
                                {KRW.format(item.price)}
                            </p>
                        </div>

                        <div className="text-right">
                            {isUnlocked ? (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", bounce: 0.5 }}
                                    className="font-mono text-2xl font-black text-[#FF2A2A] drop-shadow-[0_0_8px_rgba(255,42,42,0.8)]"
                                >
                                    {PLAIN.format(count)}
                                    <span className="ml-1 text-sm font-bold text-zinc-300">개</span>
                                </motion.div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-zinc-700">
                                    <LockIcon className="h-3.5 w-3.5" /> LOCKED
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    );
}
