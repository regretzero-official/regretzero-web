"use client";

import type { SajuCharacter, SajuConclusion } from "@/features/saju-chat/types";

type PaywallSheetProps = {
  character: SajuCharacter;
  preview: SajuConclusion;
  onClose: () => void;
  onUnlock: () => void;
};

export function PaywallSheet({ character, preview, onClose, onUnlock }: PaywallSheetProps) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#2a1520]/55 backdrop-blur-sm sm:items-center">
      <button aria-label="닫기" className="absolute inset-0 cursor-default" onClick={onClose} type="button" />
      <div className="relative z-10 mx-auto w-full max-w-[440px] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6 sm:pb-6">
        <div
          className="overflow-hidden rounded-[28px] border border-white/70 bg-[#FFF9F6] shadow-[0_24px_80px_rgba(60,20,40,0.28)]"
          style={{ boxShadow: `0 24px 80px ${character.accent}33` }}
        >
          <div
            className="px-5 pb-4 pt-5"
            style={{ background: `linear-gradient(180deg, ${character.accentSoft}, transparent)` }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: character.accent }}>
              결정적 결론
            </div>
            <h2 className="mt-2 text-[1.45rem] font-bold tracking-[-0.04em] text-[#2A1A22]">
              {character.name}의 깊은 통찰이
              <br />
              잠겨 있어요
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6E5560]">
              대화 속에서 읽힌 재회운 · 관계 흐름 · 오늘 조언을 한눈에 정리해 드려요.
            </p>
          </div>

          <div className="relative mx-4 mb-4 overflow-hidden rounded-[20px] border border-[#F0E4E8] bg-white px-4 py-4">
            <div className="space-y-3 blur-[6px] select-none" aria-hidden>
              <div>
                <div className="text-xs font-semibold text-[#9A7A86]">재회운</div>
                <p className="mt-1 text-sm leading-6 text-[#3A2A32]">{preview.reunionLuck}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-[#9A7A86]">관계 흐름</div>
                <p className="mt-1 text-sm leading-6 text-[#3A2A32]">{preview.relationshipFlow}</p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/20 via-[#FFF9F6]/75 to-[#FFF9F6]">
              <div className="rounded-full border border-[#E8D5DC] bg-white/90 px-4 py-2 text-sm font-semibold text-[#5A3A48] shadow-sm">
                미리보기 잠금
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-[16px] border border-[#F0E4E8] bg-[#FFFCFB] px-4 py-3 text-xs leading-5 text-[#8A6A76]">
              엔터테인먼트용 콘텐츠입니다. 실제 예언·점술이 아니며, 중요한 결정은 스스로의 판단이 우선입니다.
            </div>
            <button
              className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full px-5 text-base font-semibold text-white transition active:scale-[0.99]"
              style={{ background: character.accent }}
              onClick={onUnlock}
              type="button"
            >
              데모로 잠금 해제 (₩4,900)
            </button>
            <button
              className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-[#8A6A76] transition hover:bg-[#FFF0F3]"
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
