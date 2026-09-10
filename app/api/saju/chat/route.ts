import { NextRequest, NextResponse } from "next/server";

import { getSajuCharacter } from "@/features/saju-chat/characters";
import { buildConclusionFallback } from "@/features/saju-chat/fallback";
import { generateCharacterReply } from "@/features/saju-chat/generateCharacterReply";
import type { SajuCharacterId, SajuChatMessage } from "@/features/saju-chat/types";

export const runtime = "nodejs";

const VALID_IDS: SajuCharacterId[] = ["lee-doryeong", "han-siwoo", "kang-seon"];

function isCharacterId(value: unknown): value is SajuCharacterId {
  return typeof value === "string" && (VALID_IDS as string[]).includes(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      characterId?: unknown;
      messages?: unknown;
      userMessage?: unknown;
      mode?: unknown;
    };

    if (!isCharacterId(body.characterId)) {
      return NextResponse.json({ error: "Invalid characterId." }, { status: 400 });
    }

    if (!getSajuCharacter(body.characterId)) {
      return NextResponse.json({ error: "Character not found." }, { status: 404 });
    }

    const messages = Array.isArray(body.messages)
      ? (body.messages as SajuChatMessage[])
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim().length > 0,
          )
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }))
      : [];

    if (body.mode === "conclusion") {
      const conclusion = buildConclusionFallback(body.characterId, messages);
      return NextResponse.json({ conclusion, source: "fallback" });
    }

    const userMessage =
      typeof body.userMessage === "string" ? body.userMessage.trim().slice(0, 1200) : "";

    if (!userMessage) {
      return NextResponse.json({ error: "userMessage is required." }, { status: 400 });
    }

    const result = await generateCharacterReply({
      characterId: body.characterId,
      messages,
      userMessage,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
