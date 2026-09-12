"use client";

import Image from "next/image";
import { useState } from "react";

import { SAJU_CHARACTERS } from "@/features/saju-chat/characters";
import type { SajuCharacterId } from "@/features/saju-chat/types";
import { SAJU_REPORT_PRICE } from "@/features/saju-report/products";
import type { SajuProduct } from "@/features/saju-report/types";

const PAY_METHODS = [
  { id: "card", label: "카드" },
  { id: "kakao", label: "카카오페이" },
  { id: "toss", label: "토스" },
] as const;

type PayMethodId = (typeof PAY_METHODS)[number]["id"];

type CheckoutSheetProps = {
  product: SajuProduct;
  characterId?: SajuCharacterId | null;
  unlocking: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sectionCount?: number;
};

function TestPayBadge() {
  return (
    <div
      className="rounded-[14px] border border-[#F0A05A]/45 bg-[#F0A05A]/15 px-3 py-2.5 text-center text-[12px] font-bold tracking-[-0.01em] text-[#F0A05A]"
      role="status"
    >
      지금은 실제 청구 없이 전체 결과를 열어볼 수 있어요
    </div>
  );
}

export function CheckoutSheet({
  product,
  characterId,
  unlocking,
  onClose,
  onConfirm,
  sectionCount,
}: CheckoutSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [method, setMethod] = useState<PayMethodId>("card");
  const resolvedId = characterId ?? product.characterId;
  const character = SAJU_CHARACTERS.find((c) => c.id === resolvedId);
  const characterName = character?.name ?? product.characterName;
  const priceLabel = `₩${SAJU_REPORT_PRICE.toLocaleString("ko-KR")}`;
  const sectionsN = sectionCount ?? product.sections.length;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        aria-label="닫기"
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-md"
        onClick={onClose}
        type="button"
        disabled={unlocking}
      />
      <div className="relative z-10 mx-auto w-full max-w-[440px] px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6 sm:pb-6">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#12151C]/97 shadow-[0_28px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-3.5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF7A99]">
                결제 · {step}/3
              </div>
              <h2 className="mt-0.5 text-base font-bold tracking-[-0.03em] text-[#F4F0F2]">
                {step === 1 ? "주문 확인" : step === 2 ? "결제 수단" : "잠금 해제 확인"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={unlocking}
              className="rounded-full px-2 py-1 text-sm font-semibold text-[#9A9098] hover:text-[#FF7A99] disabled:opacity-40"
            >
              닫기
            </button>
          </div>

          <div className="space-y-3 px-5 py-4">
            <TestPayBadge />

            {step === 1 ? (
              <div className="space-y-4">
                <div className="flex gap-3 rounded-[18px] border border-white/10 bg-[#09090B] p-3.5">
                  {character ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-white/10">
                      <Image
                        alt={character.name}
                        className="object-cover object-top"
                        fill
                        sizes="64px"
                        src={character.portraitSrc}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-[#FF7A99]">
                      {characterName}
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-[#F4F0F2]">{product.title}</div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#9A9098]">
                      {product.painPoint}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="text-sm text-[#9A9098]">결제 금액</span>
                  <span className="text-lg font-black tracking-[-0.03em] text-[#F8F4F6]">
                    {priceLabel}
                  </span>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-[#9A9098]">
                  결제 수단을 골라 주세요. 지금은 실제 청구 없이 진행돼요.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PAY_METHODS.map((m) => {
                    const selected = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={`min-h-12 rounded-[14px] text-sm font-semibold transition ${
                          selected
                            ? "bg-[#E8336D] text-white shadow-[0_8px_24px_rgba(232,51,109,0.35)]"
                            : "border border-white/10 bg-white/5 text-[#B8AEB4]"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-[14px] border border-white/10 bg-[#09090B] px-3 py-2.5 text-[11px] leading-5 text-[#9A9098]">
                  선택:{" "}
                  <strong className="text-[#D8D0D4]">
                    {PAY_METHODS.find((m) => m.id === method)?.label}
                  </strong>
                  · {product.title} · {priceLabel}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                <div className="saju-card-elevated rounded-[18px] px-4 py-4 text-sm leading-6 text-[#D8D0D4]">
                  <div className="font-semibold text-[#F4F0F2]">잠금 해제 요약</div>
                  <ul className="mt-2 space-y-1 text-[13px] text-[#B8AEB4]">
                    <li>· 상품: {product.title}</li>
                    <li>· 캐릭터: {characterName}</li>
                    <li>· 금액: {priceLabel}</li>
                    <li>
                      · 수단: {PAY_METHODS.find((m) => m.id === method)?.label}
                    </li>
                    <li>· 섹션 {sectionsN}개 · 긴 해석</li>
                  </ul>
                </div>
                <p className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-[#9A9098]">
                  <strong className="text-[#D8D0D4]">참고용이에요.</strong> 절대 결과가 아니에요.
                </p>
                <p className="text-[11px] leading-5 text-[#9A9098]">
                  확인하면 이 기기 localStorage에 잠금이 풀리고,{" "}
                  <strong className="text-[#D8D0D4]">내 사주</strong>에 저장됩니다.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 border-t border-white/8 px-5 py-4">
            {step > 1 ? (
              <button
                type="button"
                disabled={unlocking}
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="min-h-12 flex-1 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-[#B8AEB4] disabled:opacity-40"
              >
                이전
              </button>
            ) : (
              <button
                type="button"
                disabled={unlocking}
                onClick={onClose}
                className="min-h-12 flex-1 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-[#B8AEB4] disabled:opacity-40"
              >
                취소
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                className="saju-cta min-h-12 flex-[1.4] rounded-full text-sm font-semibold"
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                disabled={unlocking}
                onClick={onConfirm}
                className="saju-cta min-h-12 flex-[1.4] rounded-full text-sm font-semibold disabled:opacity-50"
              >
                {unlocking ? "리포트 생성 중…" : "잠금 해제하기"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
