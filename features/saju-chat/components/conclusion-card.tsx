import type { SajuCharacter, SajuConclusion } from "@/features/saju-chat/types";
import { CharacterAvatar } from "./character-avatar";

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
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="flex items-center gap-3">
        <CharacterAvatar character={character} size="sm" />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: character.accent }}>
            결정적 결론
          </div>
          <h1 className="text-lg font-bold tracking-[-0.03em] text-[#2A1A22]">{character.name}의 통찰</h1>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {sections.map((section) => (
          <section
            key={section.label}
            className="rounded-[22px] border border-[#F0E4E8] bg-white/90 px-4 py-4 shadow-[0_10px_30px_rgba(80,40,60,0.06)]"
          >
            <div className="text-xs font-semibold" style={{ color: character.accent }}>
              {section.label}
            </div>
            <p className="mt-2 text-[0.95rem] leading-7 text-[#3A2A32]">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-4 rounded-[16px] border border-[#F0E4E8] bg-[#FFF9F6] px-4 py-3 text-xs leading-5 text-[#8A6A76]">
        본 결과는 오락용 AI 캐릭터 대화입니다. 실제 사주·예언·심리 진단이 아니며, 인생·연애의 중요 결정은 본인의
        판단과 전문가 상담을 우선하세요.
      </p>

      <div className="mt-auto grid gap-2 pt-6">
        <button
          className="min-h-12 rounded-full px-5 text-sm font-semibold text-white"
          style={{ background: character.accent }}
          onClick={onBackToChat}
          type="button"
        >
          대화로 돌아가기
        </button>
        <button
          className="min-h-11 rounded-full border border-[#E8D5DC] bg-white px-5 text-sm font-semibold text-[#6E5560]"
          onClick={onRestart}
          type="button"
        >
          다른 캐릭터 선택
        </button>
      </div>
    </div>
  );
}
