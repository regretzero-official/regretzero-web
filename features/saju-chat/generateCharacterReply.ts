import { getSajuCharacter } from "./characters";
import { buildConclusionFallback, fallbackReply } from "./fallback";
import type { SajuCharacterId, SajuChatMessage } from "./types";

export { buildConclusionFallback, fallbackReply } from "./fallback";

export type GenerateReplyInput = {
  characterId: SajuCharacterId;
  messages: Pick<SajuChatMessage, "role" | "content">[];
  userMessage: string;
};

export type GenerateReplyResult = {
  reply: string;
  source: "openai" | "fallback";
};

export async function generateCharacterReply(
  input: GenerateReplyInput,
  options?: { apiKey?: string; baseUrl?: string; model?: string },
): Promise<GenerateReplyResult> {
  const character = getSajuCharacter(input.characterId);
  if (!character) {
    return { reply: "잠시 연결이 불안정해요. 다시 한번만 말해줄래요?", source: "fallback" };
  }

  const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
  const baseUrl = (options?.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = options?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return { reply: fallbackReply(input.characterId, input.userMessage), source: "fallback" };
  }

  try {
    const history = input.messages.slice(-8).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 280,
        messages: [
          { role: "system", content: character.systemPrompt },
          ...history,
          { role: "user", content: input.userMessage },
        ],
      }),
    });

    if (!response.ok) {
      return { reply: fallbackReply(input.characterId, input.userMessage), source: "fallback" };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { reply: fallbackReply(input.characterId, input.userMessage), source: "fallback" };
    }

    return { reply: content, source: "openai" };
  } catch {
    return { reply: fallbackReply(input.characterId, input.userMessage), source: "fallback" };
  }
}
