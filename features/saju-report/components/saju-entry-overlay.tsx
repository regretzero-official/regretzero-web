"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { getSajuCharacter } from "@/features/saju-chat/characters";
import { getEntryContent } from "@/features/saju-report/entry-experience";
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

function useForceEntryReplay() {
  const [force, setForce] = useState(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("entry") === "1" || params.get("replay") === "1") {
        setForce(true);
      }
    } catch {
      /* ignore */
    }
  }, []);
  return force;
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
  const [phase, setPhase] = useState<"idle" | "ready">("idle");

  useEffect(() => {
    if (reducedMotion) {
      setPhase("ready");
      return;
    }
    const t = window.setTimeout(() => setPhase("ready"), 480);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  const finish = useCallback(() => {
    markSajuEntrySeen(slug);
    onDismiss();
  }, [onDismiss, slug]);

  if (!product || !character || !entry) return null;

  const anim = !reducedMotion;

  return (
    <div
      className="saju-entry-overlay fixed inset-0 z-[80] flex items-end justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.characterName} 입장`}
    >
      <div className="relative h-full w-full max-w-[480px] overflow-hidden">
        <Image
          alt={product.characterName}
          className={`object-cover object-top ${anim ? "saju-entry-portrait" : ""}`}
          fill
          priority
          sizes="(max-width:480px) 100vw, 480px"
          src={character.portraitSrc}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

        <button
          type="button"
          onClick={finish}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur transition hover:bg-black/60"
        >
          {entry.skipLabel}
        </button>

        <div
          className={`absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-10 ${
            anim ? "saju-entry-panel" : ""
          } ${phase === "ready" || reducedMotion ? "saju-entry-panel-ready" : ""}`}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
              style={{ background: product.accent }}
            >
              {product.characterName}
              {character.roleLabel ? ` · ${character.roleLabel}` : ""}
            </span>
          </div>

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

          <p className="mt-5 text-[11px] font-semibold tracking-wide text-[#9A9098]">
            지금 마음에 가까운 걸 골라보세요
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
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
                      ? { background: product.accent, boxShadow: `0 8px 24px ${product.accent}44` }
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
            disabled={!selected}
            onClick={finish}
            className="saju-cta mt-5 flex min-h-14 w-full items-center justify-center rounded-full text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {entry.meetLabel}
          </button>
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
  const forceReplay = useForceEntryReplay();
  const [ready, setReady] = useState(false);
  const [showEntry, setShowEntry] = useState(false);

  useEffect(() => {
    if (forceReplay) {
      clearSajuEntrySeen(slug);
      setShowEntry(true);
      setReady(true);
      return;
    }
    setShowEntry(!hasSeenSajuEntry(slug));
    setReady(true);
  }, [forceReplay, slug]);

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
