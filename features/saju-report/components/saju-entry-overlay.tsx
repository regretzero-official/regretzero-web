"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { getSajuCharacter } from "@/features/saju-chat/characters";
import {
  getEntryContent,
  getNextEntryBeat,
  SAJU_ENTRY_BEAT_ORDER,
  type SajuEntryBeatId,
} from "@/features/saju-report/entry-experience";
import {
  clearSajuEntrySeen,
  hasSeenSajuEntry,
  markSajuEntrySeen,
} from "@/features/saju-report/entry-seen";
import type { SajuLandingSlug } from "@/features/saju-report/product-landings";
import { getLandingBySlug } from "@/features/saju-report/product-landings";
import { getSajuProduct } from "@/features/saju-report/products";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function readForceEntryReplay() {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("entry") === "1" || params.get("replay") === "1";
  } catch {
    return false;
  }
}

function BeatDots({ beat }: { beat: SajuEntryBeatId }) {
  const idx = SAJU_ENTRY_BEAT_ORDER.indexOf(beat);
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {SAJU_ENTRY_BEAT_ORDER.map((id, i) => (
        <span
          key={id}
          className={`h-1.5 rounded-full transition-all ${
            i === idx ? "w-5 bg-[#FF7A99]" : i < idx ? "w-1.5 bg-white/45" : "w-1.5 bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

export function SajuEntryOverlay({
  slug,
  onDismiss,
}: {
  slug: SajuLandingSlug;
  onDismiss: () => void;
}) {
  const landing = getLandingBySlug(slug);
  const product = landing ? getSajuProduct(landing.productId) : null;
  const character = product ? getSajuCharacter(product.characterId) : null;
  const entry = getEntryContent(slug);
  const reducedMotion = usePrefersReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const [beat, setBeat] = useState<SajuEntryBeatId>("shrine");
  const [soundOn, setSoundOn] = useState(false);

  const finish = useCallback(() => {
    markSajuEntrySeen(slug);
    onDismiss();
  }, [onDismiss, slug]);

  const advance = useCallback(() => {
    const next = getNextEntryBeat(beat);
    if (!next) {
      finish();
      return;
    }
    setBeat(next);
  }, [beat, finish]);

  if (!product || !character || !entry) return null;

  const anim = !reducedMotion;

  return (
    <div
      className="saju-entry-overlay fixed inset-0 z-[80] flex items-end justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.characterName} 입장 연출`}
      data-beat={beat}
    >
      <div className="relative h-full w-full max-w-[480px] overflow-hidden">
        <Image
          alt={product.characterName}
          className={`object-cover object-top ${anim ? "saju-entry-portrait" : ""} ${
            beat === "shrine" ? "brightness-[0.72]" : ""
          }`}
          fill
          priority
          sizes="(max-width:480px) 100vw, 480px"
          src={character.portraitSrc}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
        {beat === "shrine" ? (
          <div className="pointer-events-none absolute inset-0 saju-shrine-veil" aria-hidden />
        ) : null}

        <div className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-10">
          <BeatDots beat={beat} />
        </div>

        <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundOn((v) => !v)}
            className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white/75 backdrop-blur transition hover:bg-black/60"
            aria-pressed={soundOn}
          >
            {soundOn ? entry.soundOnLabel : entry.soundEnableLabel}
          </button>
          <button
            type="button"
            onClick={finish}
            className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur transition hover:bg-black/60"
          >
            {entry.skipLabel}
          </button>
        </div>

        <div
          className={`absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-10 ${
            anim ? "saju-entry-panel-in" : "saju-entry-panel-ready"
          }`}
          key={beat}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
              style={{ background: product.accent }}
            >
              {product.characterName}
              {character.roleLabel ? ` · ${character.roleLabel}` : ""}
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-[#9A9098]">
              {beat === "shrine"
                ? "입장"
                : beat === "hook"
                  ? "점사"
                  : beat === "selfId"
                    ? "마음"
                    : "연"}
            </span>
          </div>

          {beat === "shrine" ? (
            <>
              <p className="text-[0.8rem] font-semibold tracking-[0.06em] text-[#FF7A99]">
                {entry.shrineTitle}
              </p>
              <p className="mt-2 text-[1.2rem] font-semibold leading-snug tracking-[-0.03em] text-[#F8F4F6]">
                {entry.shrineLine}
              </p>
              <button
                type="button"
                onClick={advance}
                className="saju-cta mt-6 flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold"
              >
                들어가기
              </button>
            </>
          ) : null}

          {beat === "hook" ? (
            <>
              <div className="space-y-1.5">
                {entry.lines.map((line) => (
                  <p
                    key={line}
                    className="text-[1.15rem] font-semibold leading-snug tracking-[-0.03em] text-[#F8F4F6]"
                  >
                    {line}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={advance}
                className="saju-cta mt-6 flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold"
              >
                {entry.nextLabel}
              </button>
            </>
          ) : null}

          {beat === "selfId" ? (
            <>
              <p className="text-[1.15rem] font-semibold leading-snug tracking-[-0.03em] text-[#F8F4F6]">
                {entry.selfIdPrompt}
              </p>
              <p className="mt-2 text-[11px] font-semibold tracking-wide text-[#9A9098]">
                골라도 되고, 건너뛰어도 돼요
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.concernChips.map((chip) => {
                  const active = selected === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setSelected(chip)}
                      className={`rounded-full border px-3.5 py-2 text-left text-[13px] font-semibold transition ${
                        active
                          ? "border-transparent text-white"
                          : "border-white/15 bg-white/5 text-[#D8D0D4] hover:bg-white/10"
                      }`}
                      style={
                        active
                          ? {
                              background: product.accent,
                              boxShadow: `0 8px 24px ${product.accent}44`,
                            }
                          : undefined
                      }
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={advance}
                className="saju-cta mt-5 flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold"
              >
                {selected ? entry.nextLabel : `${entry.nextLabel} · 바로`}
              </button>
            </>
          ) : null}

          {beat === "invite" ? (
            <>
              <p className="text-[0.8rem] font-semibold tracking-[0.06em] text-[#FF7A99]">
                {entry.inviteTitle}
              </p>
              <p className="mt-2 text-[1.2rem] font-semibold leading-snug tracking-[-0.03em] text-[#F8F4F6]">
                {entry.inviteLine}
              </p>
              <button
                type="button"
                onClick={finish}
                className="saju-cta mt-6 flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold"
              >
                {entry.meetLabel}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Client gate: shows cinematic entry on first visit (or ?entry=1), then children. */
export function SajuEntryGate({
  slug,
  children,
}: {
  slug: SajuLandingSlug;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [showEntry, setShowEntry] = useState(false);

  useEffect(() => {
    const force = readForceEntryReplay();
    if (force) clearSajuEntrySeen(slug);
    const show = force || !hasSeenSajuEntry(slug);
    const t = window.setTimeout(() => {
      setShowEntry(show);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, [slug]);

  const dismiss = useCallback(() => {
    markSajuEntrySeen(slug);
    setShowEntry(false);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("entry") || url.searchParams.has("replay")) {
        url.searchParams.delete("entry");
        url.searchParams.delete("replay");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    } catch {
      /* ignore */
    }
  }, [slug]);

  if (!ready) {
    return (
      <div className="saju-shell min-h-dvh bg-[#08090d]" aria-busy="true" aria-label="불러오는 중" />
    );
  }

  return (
    <>
      {showEntry ? <SajuEntryOverlay slug={slug} onDismiss={dismiss} /> : null}
      <div
        className={showEntry ? "pointer-events-none max-h-dvh overflow-hidden" : undefined}
        aria-hidden={showEntry || undefined}
      >
        {children}
      </div>
    </>
  );
}

export function SajuEntryReplayLink({
  slug,
  className,
}: {
  slug: SajuLandingSlug;
  className?: string;
}) {
  return (
    <a href={`?entry=1`} className={className} onClick={() => clearSajuEntrySeen(slug)}>
      입장 다시 보기
    </a>
  );
}
