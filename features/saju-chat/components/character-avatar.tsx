"use client";

import Image from "next/image";
import { useState } from "react";

import type { SajuCharacter } from "@/features/saju-chat/types";

const SIZE_MAP = {
  sm: { box: "h-10 w-10 text-base", px: 40 },
  md: { box: "h-14 w-14 text-xl", px: 56 },
  lg: { box: "h-20 w-20 text-3xl", px: 80 },
} as const;

export function CharacterAvatar({
  character,
  size = "md",
  className = "",
}: {
  character: SajuCharacter;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const dim = SIZE_MAP[size];

  if (!failed && character.portraitSrc) {
    return (
      <div
        aria-hidden
        className={`relative shrink-0 overflow-hidden rounded-full border border-white/15 shadow-[0_8px_28px_rgba(0,0,0,0.45)] ${dim.box} ${className}`}
      >
        <Image
          alt=""
          className="object-cover object-top"
          height={dim.px}
          src={character.portraitSrc}
          width={dim.px}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center rounded-full border border-white/15 shadow-[0_8px_28px_rgba(0,0,0,0.45)] ${dim.box} ${className}`}
      style={{
        background: `linear-gradient(145deg, ${character.accentSoft}, #12151c 52%, ${character.accent}40)`,
        color: character.accent,
      }}
    >
      <span className="font-semibold tracking-[-0.04em]">{character.avatarInitial}</span>
      <span className="absolute -bottom-1 -right-1 text-[0.95rem] drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
        {character.avatarEmoji}
      </span>
    </div>
  );
}
