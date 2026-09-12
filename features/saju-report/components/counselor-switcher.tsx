"use client";

import Image from "next/image";

import type { SajuCharacter } from "@/features/saju-chat/types";

type CounselorSwitcherProps = {
  counselors: SajuCharacter[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Compact row for form header vs larger landing hero */
  size?: "sm" | "md";
  label?: string;
};

export function CounselorSwitcher({
  counselors,
  selectedId,
  onSelect,
  size = "md",
  label = "상담사 선택",
}: CounselorSwitcherProps) {
  if (counselors.length <= 1) return null;

  const selected = counselors.find((c) => c.id === selectedId) ?? counselors[0];
  const portrait = size === "sm" ? "h-14 w-14" : "h-[72px] w-[72px]";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wide text-[#9A9098]">{label}</span>
        {selected ? (
          <span className="truncate text-[11px] font-semibold text-[#FF7A99]">
            {selected.name}
            {selected.roleLabel ? ` · ${selected.roleLabel}` : ""}
          </span>
        ) : null}
      </div>
      <div className="flex gap-2.5 overflow-x-auto saju-scroll-x pb-0.5">
        {counselors.map((c) => {
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              aria-pressed={active}
              className={`relative shrink-0 overflow-hidden rounded-[16px] border-2 transition active:scale-[0.97] ${portrait} ${
                active
                  ? "border-[#E8336D] shadow-[0_0_0_2px_rgba(232,51,109,0.35)]"
                  : "border-white/10 opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                alt={c.name}
                className="object-cover object-top"
                fill
                sizes="72px"
                src={c.portraitSrc}
              />
            </button>
          );
        })}
      </div>
      {selected?.hook ? (
        <p className="line-clamp-2 text-[12px] leading-5 text-[#D8D0D4]">
          「{selected.hook}」
        </p>
      ) : null}
    </div>
  );
}
