import type { SajuCharacter } from "@/features/saju-chat/types";

export function CharacterAvatar({
  character,
  size = "md",
}: {
  character: SajuCharacter;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-20 w-20 text-3xl" : size === "sm" ? "h-10 w-10 text-base" : "h-14 w-14 text-xl";

  return (
    <div
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center rounded-full border border-white/70 shadow-[0_8px_24px_rgba(80,40,60,0.12)] ${dim}`}
      style={{
        background: `linear-gradient(145deg, ${character.accentSoft}, #fff8f4 55%, ${character.accent}33)`,
        color: character.accent,
      }}
    >
      <span className="font-semibold tracking-[-0.04em]">{character.avatarInitial}</span>
      <span className="absolute -bottom-1 -right-1 text-[0.95rem] drop-shadow-sm">{character.avatarEmoji}</span>
    </div>
  );
}
