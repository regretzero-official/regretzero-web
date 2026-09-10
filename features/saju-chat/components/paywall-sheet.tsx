"use client";

import Image from "next/image";

import type { SajuCharacter, SajuConclusion } from "@/features/saju-chat/types";

type PaywallSheetProps = {
  character: SajuCharacter;
  preview: SajuConclusion;
  onClose: () => void;
  onUnlock: () => void;
};

export function PaywallSheet({ character, preview, onClose, onUnlock }: PaywallSheetProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        aria-label="닫기"
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-md"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-10 mx-auto w-full max-w-[440px] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6 sm:pb-6">
        <div
          className="overflow-hidden rounded-[28px] border border-white/10 bg-[#12151C]/95 shadow-[0_28px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          style={{ boxShadow: `0 28px 90px rgba(0,0,0,0.65), 0 0 60px ${character.accent}22` }}
        >
          <div className="relative h-36 w-full overflow-hidden">
            <Image
              alt=""
              className="object-cover object-top"
              fill
              sizes="440px"
              src={character.portraitSrc}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12151C] via-[#12151C]/55 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)]" />
          </div>

          <div className="relative -mt-10 px-5 pb-4">
            <div className="flex items-end gap-3">
              <div
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#12151C] shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
                style={{ boxShadow: `0 0 0 2px ${character.accent}55` }}
              >
                <Image
                  alt={character.name}
                  className="object-cover object-top"
                  fill
                  sizes="64px"
                  src={character.portraitSrc}
                />
              </div>
              <div className="min-w-0 pb-0.5">
                <div
                  className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
                  style={{ background: character.accent }}
                >
                  결정적 결론
                </div>
                <h2 className="mt-2 text-[1.28rem] font-bold leading-tight tracking-[-0.04em] text-[#F4F0F2]">
                  {character.name}의 통찰 잠금
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#9A9098]">
              대화 속에서 읽힌 재회운 · 관계 흐름 · 오늘 조언을 한눈에 정리해 드려요.
            </p>
          </div>

          <div className="relative mx-4 mb-4 overflow-hidden rounded-[20px] border border-white/10 bg-[#09090B] px-4 py-4">
            <div className="space-y-3 blur-[6px] select-none" aria-hidden>
              <div>
                <div className="text-xs font-semibold text-[#6B6570]">재회운</div>
                <p className="mt-1 text-sm leading-6 text-[#D8D0D4]">{preview.reunionLuck}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-[#6B6570]">관계 흐름</div>
                <p className="mt-1 text-sm leading-6 text-[#D8D0D4]">{preview.relationshipFlow}</p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-[#09090B]/70 to-[#09090B]">
              <div className="rounded-full border border-white/15 bg-[#12151C]/95 px-4 py-2 text-sm font-semibold text-[#FF7A99] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                미리보기 잠금
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-[16px] border border-white/10 bg-[#09090B] px-4 py-3 text-xs leading-5 text-[#9A9098]">
              엔터테인먼트용 · 실제 예언이 아닙니다
            </div>
            <button
              className="saju-cta mt-4 flex min-h-14 w-full items-center justify-center rounded-full px-5 text-base font-semibold transition active:scale-[0.99]"
              onClick={onUnlock}
              type="button"
            >
              데모로 잠금 해제 (₩4,900)
            </button>
            <button
              className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-[#9A9098] transition hover:bg-white/5"
              onClick={onClose}
              type="button"
            >
              조금 더 대화하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
