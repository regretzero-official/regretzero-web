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
      className={`relative flex shrink-0 items-center justify-center rounded-full border border-white/15 shadow-[0_8px_28px_rgba(0,0,0,0.45)] ${dim}`}
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
