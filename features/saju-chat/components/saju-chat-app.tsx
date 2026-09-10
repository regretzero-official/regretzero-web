"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SAJU_CHARACTERS, getSajuCharacter } from "@/features/saju-chat/characters";
import { buildConclusionFallback } from "@/features/saju-chat/fallback";
import type {
  SajuCharacter,
  SajuCharacterId,
  SajuChatMessage,
  SajuConclusion,
  SajuFlowStep,
} from "@/features/saju-chat/types";
import { readSajuUnlockState, unlockSajuDemo } from "@/features/saju-chat/unlock";

import { CharacterAvatar } from "./character-avatar";
import { ConclusionCard } from "./conclusion-card";
import { PaywallSheet } from "./paywall-sheet";

const FREE_MESSAGE_THRESHOLD = 5;
const QUICK_PROMPTS = [
  "이별 후에 너무 힘들어요",
  "재회할 수 있을까요?",
  "그 사람이 나를 아직도 생각할까요?",
  "오늘은 어떤 마음으로 지내야 할까요?",
];

const READING_PRODUCTS = [
  {
    id: "reunion",
    label: "재회운",
    title: "다시 만날 기운이\n남아 있을까",
    hint: "이별 이후의 흐름을 읽어드려요",
    accent: "#E8336D",
  },
  {
    id: "inner",
    label: "속마음",
    title: "그 사람의\n진짜 속마음은",
    hint: "말하지 못한 감정을 풀어봐요",
    accent: "#FF7A99",
  },
  {
    id: "breakup",
    label: "이별 결정",
    title: "헤어짐의 이유,\n그리고 다음",
    hint: "흔들리는 마음을 정리해 드려요",
    accent: "#5EEAD4",
  },
  {
    id: "tonight",
    label: "오늘 밤",
    title: "지금 이 순간의\n연애 기운",
    hint: "짧은 위로와 오늘의 조언",
    accent: "#FF7A99",
  },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function openingMessage(character: SajuCharacter): SajuChatMessage {
  const openings: Record<SajuCharacterId, string> = {
    "lee-doryeong":
      "어서 오세요. 오늘 밤 마음이 조금 차가운가요? 괜찮아요—천천히 말해 주세요. 제가 다정하게 들어드릴게요.",
    "han-siwoo":
      "왔구나. 기운이 흐트러진 게 보여. 괜찮아, 숨부터 고르고—무슨 일인지 말해봐.",
    "kang-seon":
      "여기까지 온 너, 벌써 멋있어. 무슨 얘기든 해봐. 내가 진지하게—그리고 조금은 다정하게 들어줄게.",
  };

  return {
    id: createId(),
    role: "assistant",
    content: openings[character.id],
    createdAt: new Date().toISOString(),
  };
}

export function SajuChatApp() {
  const [step, setStep] = useState<SajuFlowStep>("landing");
  const [characterId, setCharacterId] = useState<SajuCharacterId | null>(null);
  const [messages, setMessages] = useState<SajuChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [conclusion, setConclusion] = useState<SajuConclusion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const character = characterId ? getSajuCharacter(characterId) : null;
  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages],
  );
  const canOfferConclusion = userMessageCount >= FREE_MESSAGE_THRESHOLD - 1;

  useEffect(() => {
    const state = readSajuUnlockState();
    if (state.unlocked) setUnlocked(true);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, step, sending]);

  const startWithCharacter = useCallback((id: SajuCharacterId) => {
    const next = getSajuCharacter(id);
    if (!next) return;
    setCharacterId(id);
    setMessages([openingMessage(next)]);
    setConclusion(null);
    setError(null);
    setShowPaywall(false);
    setStep("chat");
  }, []);

  async function requestReply(userText: string, history: SajuChatMessage[]) {
    const response = await fetch("/api/saju/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        userMessage: userText,
      }),
    });

    if (!response.ok) {
      throw new Error("reply_failed");
    }

    const data = (await response.json()) as { reply?: string };
    if (!data.reply) throw new Error("empty_reply");
    return data.reply;
  }

  async function handleSend(raw?: string) {
    if (!characterId || sending) return;
    const text = (raw ?? input).trim();
    if (!text) return;

    setError(null);
    setInput("");
    const userMsg: SajuChatMessage = {
      id: createId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setSending(true);

    try {
      const reply = await requestReply(text, messages);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setError("잠시 연결이 불안정해요. 다시 보내볼까요?");
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content:
            "신호가 잠깐 흔들렸네요. 괜찮아요—당신의 말은 들었어요. 조금만 더 천천히 이어서 말해줄래요?",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function buildLocalConclusion(): SajuConclusion {
    if (!characterId) {
      return {
        reunionLuck: "",
        relationshipFlow: "",
        todayAdvice: "",
        previewBlur: "",
      };
    }
    return buildConclusionFallback(
      characterId,
      messages.map((m) => ({ role: m.role, content: m.content })),
    );
  }

  async function openConclusionFlow() {
    if (!characterId) return;
    const preview = buildLocalConclusion();
    setConclusion(preview);

    if (unlocked) {
      setStep("conclusion");
      setShowPaywall(false);
      return;
    }

    setShowPaywall(true);
  }

  function handleUnlock() {
    if (!characterId) return;
    unlockSajuDemo(characterId);
    setUnlocked(true);
    setShowPaywall(false);
    setConclusion((prev) => prev ?? buildLocalConclusion());
    setStep("conclusion");
  }

  function restart() {
    setStep("select");
    setCharacterId(null);
    setMessages([]);
    setConclusion(null);
    setShowPaywall(false);
    setError(null);
  }

  if (step === "landing") {
    return (
      <div className="saju-shell relative min-h-dvh overflow-hidden">
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
          <header className="saju-header sticky top-0 z-20 flex items-center justify-between px-5 py-3">
            <Link
              className="text-sm font-semibold text-[#9A9098] transition hover:text-[#FF7A99]"
              href="/"
            >
              ← Regretzero
            </Link>
            <span className="saju-pill rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em]">
              NIGHT SAJU
            </span>
          </header>

          <div className="flex flex-1 flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FF7A99]">
              Dark Romance · AI Character
            </p>
            <h1 className="mt-3 text-[2.05rem] font-bold leading-[1.2] tracking-[-0.05em] text-[#F4F0F2]">
              오늘 밤,
              <br />
              마음이 묻는 운명
            </h1>
            <p className="mt-4 text-[0.98rem] leading-7 text-[#9A9098]">
              재회운 · 속마음 · 이별의 이유를 캐릭터와 나누는
              <br />
              밤의 사주 감성 채팅. 결론은 더 깊이 열어드려요.
            </p>

            <section className="mt-8">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-sm font-bold tracking-[-0.02em] text-[#F4F0F2]">오늘의 리딩</h2>
                <span className="text-[11px] font-medium text-[#5EEAD4]">Entertainment</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {READING_PRODUCTS.map((product) => (
                  <button
                    key={product.id}
                    className="saju-product-card flex min-h-[148px] flex-col rounded-[20px] p-4 text-left transition active:scale-[0.98]"
                    onClick={() => setStep("select")}
                    type="button"
                  >
                    <span
                      className="inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide"
                      style={{
                        background: `${product.accent}22`,
                        color: product.accent,
                      }}
                    >
                      {product.label}
                    </span>
                    <span className="mt-3 whitespace-pre-line text-[0.95rem] font-bold leading-snug tracking-[-0.03em] text-[#F4F0F2]">
                      {product.title}
                    </span>
                    <span className="mt-auto pt-3 text-[11px] leading-4 text-[#6B6570]">
                      {product.hint}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="text-sm font-bold tracking-[-0.02em] text-[#F4F0F2]">도령 캐릭터</h2>
                <button
                  className="text-[11px] font-semibold text-[#FF7A99]"
                  onClick={() => setStep("select")}
                  type="button"
                >
                  전체 보기
                </button>
              </div>
              <div className="saju-scroll-x -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                {SAJU_CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    className="saju-char-card flex w-[72%] max-w-[260px] shrink-0 flex-col rounded-[24px] p-4 text-left transition active:scale-[0.98]"
                    onClick={() => startWithCharacter(c.id)}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <CharacterAvatar character={c} size="lg" />
                      <div className="min-w-0">
                        <div className="text-lg font-bold tracking-[-0.03em] text-[#F4F0F2]">
                          {c.name}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-[#9A9098]">{c.tagline}</div>
                      </div>
                    </div>
                    <span
                      className="mt-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: c.accentSoft, color: c.accent }}
                    >
                      {c.vibe}
                    </span>
                    <span className="mt-4 text-xs font-semibold text-[#FF7A99]">대화 시작 →</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="mt-auto space-y-3 pt-10">
              <div className="rounded-[16px] border border-white/10 bg-[#09090B]/90 px-4 py-3 text-xs leading-5 text-[#9A9098]">
                엔터테인먼트용입니다. 실제 예언·점술·심리 진단이 아니며, 중요한 결정은 스스로의 판단을
                우선하세요.
              </div>
              <button
                className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full px-5 text-base font-semibold transition active:scale-[0.99]"
                onClick={() => setStep("select")}
                type="button"
              >
                캐릭터 만나기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className="saju-shell min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+12px)]">
          <button
            className="self-start text-sm font-semibold text-[#9A9098] transition hover:text-[#FF7A99]"
            onClick={() => setStep("landing")}
            type="button"
          >
            ← 소개로
          </button>
          <h1 className="mt-5 text-[1.75rem] font-bold leading-tight tracking-[-0.04em] text-[#F4F0F2]">
            오늘 밤, 누구의 목소리를
            <br />
            듣고 싶나요?
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#9A9098]">
            세 명의 캐릭터가 각자의 결로 마음을 받아줍니다.
          </p>

          <div className="mt-6 space-y-3">
            {SAJU_CHARACTERS.map((c) => (
              <button
                key={c.id}
                className="saju-char-card flex w-full items-start gap-4 rounded-[24px] px-4 py-4 text-left transition active:scale-[0.99]"
                onClick={() => startWithCharacter(c.id)}
                type="button"
              >
                <CharacterAvatar character={c} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold tracking-[-0.03em] text-[#F4F0F2]">
                    {c.name}
                  </span>
                  <span className="mt-1 block text-sm text-[#9A9098]">{c.tagline}</span>
                  <span
                    className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: c.accentSoft, color: c.accent }}
                  >
                    {c.vibe}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "conclusion" && character && conclusion) {
    return (
      <div className="saju-shell min-h-dvh">
        <ConclusionCard
          character={character}
          conclusion={conclusion}
          onBackToChat={() => setStep("chat")}
          onRestart={restart}
        />
      </div>
    );
  }

  if (!character) {
    return null;
  }

  return (
    <div className="saju-shell relative flex min-h-dvh flex-col">
      <header className="saju-header sticky top-0 z-20 mx-auto flex w-full max-w-[480px] items-center gap-3 px-4 py-3">
        <button
          aria-label="캐릭터 다시 선택"
          className="text-sm font-semibold text-[#9A9098]"
          onClick={restart}
          type="button"
        >
          ←
        </button>
        <CharacterAvatar character={character} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold tracking-[-0.03em] text-[#F4F0F2]">{character.name}</div>
          <div className="truncate text-xs text-[#9A9098]">{character.tagline}</div>
        </div>
        <button
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: "#E8336D" }}
          onClick={() => void openConclusionFlow()}
          type="button"
        >
          결론
        </button>
      </header>

      <div
        ref={listRef}
        className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => {
          const mine = message.role === "user";
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              {!mine ? (
                <div className="mr-2 mt-1">
                  <CharacterAvatar character={character} size="sm" />
                </div>
              ) : null}
              <div
                className={`max-w-[78%] rounded-[22px] px-4 py-3 text-[0.95rem] leading-7 shadow-[0_8px_24px_rgba(0,0,0,0.25)] ${
                  mine ? "rounded-br-md text-white" : "saju-bubble-assistant rounded-bl-md"
                }`}
                style={mine ? { background: character.accent } : undefined}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        {sending ? (
          <div className="flex items-center gap-2 text-sm text-[#9A9098]">
            <CharacterAvatar character={character} size="sm" />
            <span className="animate-pulse">{character.name}이(가) 답하는 중…</span>
          </div>
        ) : null}
      </div>

      {canOfferConclusion ? (
        <div className="mx-auto w-full max-w-[480px] px-4">
          <button
            className="mb-2 flex min-h-11 w-full items-center justify-center rounded-full border border-[#E8336D]/40 bg-[#E8336D]/12 text-sm font-semibold text-[#FF7A99] transition hover:bg-[#E8336D]/2"
            onClick={() => void openConclusionFlow()}
            type="button"
          >
            결정적 결론 보기
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="mx-auto w-full max-w-[480px] px-4 pb-1 text-center text-xs text-[#FF7A99]">
          {error}
        </div>
      ) : null}

      <div className="saju-footer mx-auto w-full max-w-[480px] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {userMessageCount === 0 ? (
          <div className="saju-scroll-x mb-3 flex gap-2 overflow-x-auto pb-1">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                className="shrink-0 rounded-full border border-white/10 bg-[#09090B] px-3 py-2 text-xs font-medium text-[#9A9098] transition hover:border-[#E8336D]/35 hover:text-[#FF7A99]"
                onClick={() => void handleSend(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <textarea
            className="saju-input max-h-28 min-h-12 flex-1 resize-none rounded-[18px] px-4 py-3 text-sm leading-6"
            placeholder="마음을 남겨보세요…"
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            className="saju-cta flex h-12 w-12 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            disabled={sending || !input.trim()}
            type="submit"
          >
            ↑
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] leading-4 text-[#6B6570]">
          오락용 AI 채팅 · 실제 예언이 아닙니다
        </p>
      </div>

      {showPaywall && conclusion ? (
        <PaywallSheet
          character={character}
          preview={conclusion}
          onClose={() => setShowPaywall(false)}
          onUnlock={handleUnlock}
        />
      ) : null}
    </div>
  );
}
