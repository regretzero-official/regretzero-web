"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { getSajuCharacter } from "@/features/saju-chat/characters";
import type { SajuCharacterId } from "@/features/saju-chat/types";
import {
  getLoadingCounselorLine,
  LOADING_SKIP_HINT_MS,
  LOADING_STAGE_MS,
  SAJU_LOADING_STAGES,
} from "@/features/saju-report/loading-theater";
import { useTheaterAmbient } from "@/features/saju-report/hooks/use-theater-ambient";

type SajuLoadingTheaterProps = {
  characterId: SajuCharacterId;
  accent?: string;
  /** When true, fetch finished — dismiss on next tick if skipped or stages done */
  ready: boolean;
  onComplete: () => void;
};

export function SajuLoadingTheater({
  characterId,
  accent = "#E8336D",
  ready,
  onComplete,
}: SajuLoadingTheaterProps) {
  const character = getSajuCharacter(characterId);
  const line = useMemo(
    () => getLoadingCounselorLine(characterId, character?.name),
    [characterId, character?.name],
  );
  const [stageIndex, setStageIndex] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [hintSkip, setHintSkip] = useState(false);
  const theaterActive = !skipped;
  const { soundOn, needsGesture, toggleSound, mute } = useTheaterAmbient(theaterActive);

  useEffect(() => {
    const hint = window.setTimeout(() => setHintSkip(true), LOADING_SKIP_HINT_MS);
    return () => window.clearTimeout(hint);
  }, []);

  useEffect(() => {
    if (skipped) return;
    if (stageIndex >= SAJU_LOADING_STAGES.length - 1) return;
    const t = window.setTimeout(() => {
      setStageIndex((i) => Math.min(i + 1, SAJU_LOADING_STAGES.length - 1));
    }, LOADING_STAGE_MS);
    return () => window.clearTimeout(t);
  }, [stageIndex, skipped]);

  useEffect(() => {
    if (!ready) return;
    const stagesDone = skipped || stageIndex >= SAJU_LOADING_STAGES.length - 1;
    if (!stagesDone && !skipped) {
      // Wait a beat after ready so last stage can land, unless already on last
      const t = window.setTimeout(() => {
        if (stageIndex >= SAJU_LOADING_STAGES.length - 2) onComplete();
      }, 700);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(onComplete, skipped ? 80 : 420);
    return () => window.clearTimeout(t);
  }, [ready, skipped, stageIndex, onComplete]);

  const progress =
    ((Math.min(stageIndex, SAJU_LOADING_STAGES.length - 1) + 1) /
      SAJU_LOADING_STAGES.length) *
    100;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-busy={!ready}
      aria-label="점사 준비 중"
    >
      <div className="relative h-full w-full max-w-[480px] overflow-hidden">
        {character ? (
          <Image
            alt={character.name}
            className="object-cover object-top saju-entry-portrait opacity-90"
            fill
            priority
            sizes="(max-width:480px) 100vw, 480px"
            src={character.portraitSrc}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.6)_100%)]" />

        <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex items-center gap-2">
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleSound()}
                className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white/75 backdrop-blur transition hover:bg-black/60"
                aria-pressed={soundOn}
                title={needsGesture ? "사운드를 들으려면 터치하세요" : undefined}
              >
                사운드 {soundOn ? "켜짐" : "꺼짐"}
              </button>
              <button
                type="button"
                onClick={() => {
                  mute();
                  setSkipped(true);
                }}
                className={`rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold backdrop-blur transition hover:bg-black/60 ${
                  hintSkip ? "text-white" : "text-white/70"
                }`}
              >
                건너뛰기
              </button>
            </div>
            {!soundOn ? (
              <p className="max-w-[220px] rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-right text-[10px] font-semibold leading-snug text-white/65 backdrop-blur">
                사운드를 들으려면 터치하세요
              </p>
            ) : null}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-12">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
              style={{ background: accent }}
            >
              {character?.name ?? "상담사"}
              {character?.roleLabel ? ` · ${character.roleLabel}` : ""}
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-[#9A9098]">
              점사 준비
            </span>
          </div>

          <p className="text-[1.15rem] font-semibold leading-snug tracking-[-0.03em] text-[#F8F4F6]">
            {line}
          </p>

          <div className="mt-6 space-y-2.5">
            {SAJU_LOADING_STAGES.map((label, i) => {
              const active = i === stageIndex;
              const done = i < stageIndex || skipped;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-2.5 text-sm transition ${
                    active
                      ? "font-semibold text-[#F8F4F6]"
                      : done
                        ? "text-[#B8AEB4]"
                        : "text-[#6E666C]"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      active
                        ? "text-white"
                        : done
                          ? "bg-white/15 text-[#D8D0D4]"
                          : "bg-white/5 text-[#6E666C]"
                    }`}
                    style={active ? { background: accent } : undefined}
                  >
                    {done && !active ? "✓" : String(i + 1)}
                  </span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${skipped ? 100 : Math.max(12, progress)}%`,
                background: `linear-gradient(90deg, ${accent}, #FF7A99)`,
              }}
            />
          </div>
          <p className="mt-2.5 text-center text-[11px] text-[#9A9098]">
            {ready
              ? skipped
                ? "결과를 여는 중…"
                : "거의 다 됐어요"
              : hintSkip
                ? "기다려도 되고, 건너뛰어도 돼요"
                : "원국을 조용히 읽고 있어요"}
          </p>
        </div>
      </div>
    </div>
  );
}
