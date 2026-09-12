import Image from "next/image";

import type { SajuCharacter, SajuConclusion } from "@/features/saju-chat/types";

export function ConclusionCard({
  character,
  conclusion,
  onBackToChat,
  onRestart,
}: {
  character: SajuCharacter;
  conclusion: SajuConclusion;
  onBackToChat: () => void;
  onRestart: () => void;
}) {
  const sections = [
    { label: "재회운", body: conclusion.reunionLuck },
    { label: "관계 흐름", body: conclusion.relationshipFlow },
    { label: "오늘 조언", body: conclusion.todayAdvice },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="relative mb-5 overflow-hidden rounded-[24px] border border-white/10">
        <div className="relative h-28 w-full">
          <Image
            alt=""
            className="object-cover object-top"
            fill
            sizes="460px"
            src={character.portraitSrc}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/50 to-transparent" />
        </div>
        <div className="relative -mt-8 flex items-end gap-3 px-4 pb-4">
          <div
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-[#12151C]"
            style={{ boxShadow: `0 0 0 2px ${character.accent}66` }}
          >
            <Image
              alt={character.name}
              className="object-cover object-top"
              fill
              sizes="56px"
              src={character.portraitSrc}
            />
          </div>
          <div className="min-w-0 pb-0.5">
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: character.accent }}
            >
              결정적 결론
            </div>
            <h1 className="text-lg font-bold tracking-[-0.03em] text-[#F4F0F2]">
              {character.name}의 통찰
            </h1>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <section key={section.label} className="saju-card rounded-[22px] px-4 py-4">
            <div className="text-xs font-semibold" style={{ color: character.accent }}>
              {section.label}
            </div>
            <p className="mt-2 text-[0.95rem] leading-7 text-[#D8D0D4]">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-4 rounded-[16px] border border-white/10 bg-[#09090B] px-4 py-3 text-xs leading-5 text-[#9A9098]">
        참고용이에요. 절대 결과가 아니에요. 중요한 결정은 본인 판단과, 필요할 땐 전문가 상담을 우선해 주세요.
      </p>

      <div className="mt-auto grid gap-2 pt-6">
        <button
          className="saju-cta min-h-12 rounded-full px-5 text-sm font-semibold"
          onClick={onBackToChat}
          type="button"
        >
          대화로 돌아가기
        </button>
        <button
          className="min-h-11 rounded-full border border-white/10 bg-transparent px-5 text-sm font-semibold text-[#9A9098] transition hover:bg-white/5"
          onClick={onRestart}
          type="button"
        >
          다른 캐릭터 선택
        </button>
      </div>
    </div>
  );
}
