"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import type { SajuCharacter } from "@/features/saju-chat/types";
import { hubDeepLink } from "@/features/saju-report/product-landings";
import type { SajuProduct } from "@/features/saju-report/types";

import { CounselorSwitcher } from "./counselor-switcher";

type LandingCounselorChromeProps = {
  product: SajuProduct;
  counselors: SajuCharacter[];
  heroHook: string;
  heroSub: string;
  ctaLabel: string;
  freeScopeLine: string;
  children: ReactNode;
  footerExtra?: ReactNode;
};

export function LandingCounselorChrome({
  product,
  counselors,
  heroHook,
  heroSub,
  ctaLabel,
  freeScopeLine,
  children,
  footerExtra,
}: LandingCounselorChromeProps) {
  const [characterId, setCharacterId] = useState(product.characterId);
  const character = useMemo(
    () => counselors.find((c) => c.id === characterId) ?? counselors[0],
    [counselors, characterId],
  );
  const startHref = hubDeepLink(product.id, characterId);
  const narratorName = character?.name ?? product.characterName;

  return (
    <>
      <section className="px-5 pt-5">
        <div className="overflow-hidden rounded-[24px] border border-white/10">
          <div className="relative aspect-[4/5] w-full sm:aspect-[5/6]">
            {character ? (
              <Image
                alt={character.name}
                className="object-cover object-top"
                fill
                priority
                sizes="(max-width:480px) 100vw, 480px"
                src={character.portraitSrc}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#12151C] via-[#12151C]/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
                style={{ background: product.accent }}
              >
                {product.badge} · {narratorName}
                {character?.roleLabel ? ` · ${character.roleLabel}` : ""}
              </span>
              <p className="mt-3 text-[0.8rem] font-semibold tracking-[0.04em] text-[#FF7A99]">
                {product.title}
              </p>
              <h1 className="mt-2 text-[1.55rem] font-black leading-[1.25] tracking-[-0.045em] text-[#F8F4F6]">
                {heroHook}
              </h1>
              <p className="mt-2.5 text-sm leading-6 text-[#D8D0D4]">{heroSub}</p>
              <div className="mt-4 rounded-[16px] border border-white/10 bg-black/35 p-3 backdrop-blur-sm">
                <CounselorSwitcher
                  counselors={counselors}
                  selectedId={characterId}
                  onSelect={(id) => setCharacterId(id as typeof characterId)}
                  label="누가 읽어줄까요"
                />
              </div>
              <Link
                href={startHref}
                className="saju-cta mt-4 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
              >
                {ctaLabel} →
              </Link>
              <p className="mt-2 text-[11px] leading-5 text-[#B8AEB4]/90">{freeScopeLine}</p>
            </div>
          </div>
        </div>
        {footerExtra}
      </section>

      {/* Clone children with narrator name injected via data attribute for deliverables line */}
      <div className="space-y-10" data-narrator={narratorName}>{children}</div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+64px)] left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-4 pb-2">
        <p className="mb-1.5 text-center text-[10px] leading-4 text-[#9A9098]">{freeScopeLine}</p>
        <Link
          href={startHref}
          className="saju-cta flex min-h-12 w-full items-center justify-center rounded-full text-sm font-semibold"
        >
          {ctaLabel}
        </Link>
      </div>
    </>
  );
}
