"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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

const READING_PILLS = [
  { id: "reunion", label: "재회운", accent: "#E8336D" },
  { id: "inner", label: "속마음", accent: "#FF7A99" },
  { id: "breakup", label: "이별 결정", accent: "#5EEAD4" },
  { id: "tonight", label: "오늘 밤", accent: "#FF7A99" },
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

function PortraitHeroCard({
  character,
  onSelect,
  variant = "carousel",
  featured = false,
}: {
  character: SajuCharacter;
  onSelect: () => void;
  variant?: "carousel" | "select";
  featured?: boolean;
}) {
  const isSelect = variant === "select";
  const isFeatured = isSelect && featured;

  return (
    <button
      className={`saju-portrait-card group relative shrink-0 overflow-hidden text-left transition active:scale-[0.985] ${
        isSelect
          ? isFeatured
            ? "aspect-[4/5] w-full snap-start rounded-[26px]"
            : "aspect-[3/4] w-full snap-start rounded-[22px]"
          : "saju-carousel-card aspect-[3/4] snap-start rounded-[26px]"
      }`}
      onClick={onSelect}
      style={{
        boxShadow: `0 22px 56px rgba(0,0,0,0.55), 0 12px 36px ${character.accent}28`,
      }}
      type="button"
    >
      <Image
        alt={character.name}
        className="object-cover object-top transition duration-700 ease-out group-hover:scale-[1.04]"
        fill
        sizes={
          isSelect
            ? isFeatured
              ? "(max-width:480px) 92vw, 440px"
              : "(max-width:480px) 45vw, 210px"
            : "(max-width:480px) 78vw, 320px"
        }
        src={character.portraitSrc}
        priority={!isSelect || isFeatured}
      />

      {/* cinematic overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.55)_100%)]" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
        style={{
          background: `linear-gradient(180deg, ${character.accent}33 0%, transparent 100%)`,
        }}
      />

      <div className={`absolute inset-x-0 bottom-0 ${isSelect && !isFeatured ? "p-3.5" : "p-4"}`}>
        {!isSelect ? (
          <span
            className="mb-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em] text-white"
            style={{ background: character.accent }}
          >
            {character.vibe.split("·")[0]?.trim() || "Night"}
          </span>
        ) : null}

        <div
          className={`font-bold tracking-[-0.04em] text-[#F8F4F6] drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)] ${
            isSelect && !isFeatured ? "text-[1.05rem] leading-tight" : "text-[1.35rem] leading-tight"
          }`}
        >
          {character.name}
        </div>
        <div
          className={`mt-1 text-[#D8D0D4]/90 ${
            isSelect && !isFeatured ? "line-clamp-2 text-[11px] leading-4" : "line-clamp-2 text-xs leading-5"
          }`}
        >
          {character.tagline}
        </div>

        {!isSelect ? (
          <span className="mt-3.5 inline-flex items-center rounded-full bg-[#E8336D] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_28px_rgba(232,51,109,0.5)]">
            대화 시작
          </span>
        ) : (
          <span
            className={`mt-2.5 inline-flex items-center gap-1 font-semibold ${
              isFeatured ? "text-sm" : "text-[11px]"
            }`}
            style={{ color: character.accent }}
          >
            탭하여 대화
            <span aria-hidden>→</span>
          </span>
        )}
      </div>
    </button>
  );
}

function MobileShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto flex w-full max-w-[460px] flex-col ${className}`}>{children}</div>
  );
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
    setMessages((prev) => [...prev, userMsg]);
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
      <div className="saju-shell relative min-h-dvh">
        <MobileShell className="relative min-h-dvh">
          <header className="saju-header sticky top-0 z-20 flex items-center justify-between px-5 py-3">
            <Link
              className="text-sm font-semibold text-[#9A9098] transition hover:text-[#FF7A99]"
              href="/saju"
            >
              ← 사주 리포트
            </Link>
            <span className="saju-pill rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em]">
              대화 베타
            </span>
          </header>

          <div className="flex flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3">
            <div className="px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FF7A99]">
                Dark Romance
              </p>
              <h1 className="mt-2 text-[1.8rem] font-bold leading-[1.18] tracking-[-0.05em] text-[#F4F0F2]">
                오늘 밤, 누구의
                <br />
                목소리를 들을까요
              </h1>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 px-5">
              {READING_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  className="rounded-full border border-white/10 bg-[#09090B]/80 px-3 py-1.5 text-[11px] font-semibold transition active:scale-[0.97]"
                  onClick={() => setStep("select")}
                  style={{ color: pill.accent }}
                  type="button"
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <section className="relative mt-5">
              <div className="saju-scroll-x saju-carousel flex gap-3 overflow-x-auto px-5 pb-4 pt-1">
                {SAJU_CHARACTERS.map((c) => (
                  <PortraitHeroCard
                    key={c.id}
                    character={c}
                    onSelect={() => startWithCharacter(c.id)}
                    variant="carousel"
                  />
                ))}
                {/* end spacer so last card can snap fully into view */}
                <div aria-hidden className="w-2 shrink-0 snap-end" />
              </div>
            </section>

            <div className="mt-auto space-y-3 px-5 pt-5">
              <p className="text-center text-[10px] leading-4 text-[#6B6570]">
                엔터테인먼트용 · 실제 예언이 아닙니다
              </p>
              <button
                className="saju-cta flex min-h-14 w-full items-center justify-center rounded-full px-5 text-base font-semibold transition active:scale-[0.99]"
                onClick={() => setStep("select")}
                type="button"
              >
                캐릭터 만나기
              </button>
            </div>
          </div>
        </MobileShell>
      </div>
    );
  }

  if (step === "select") {
    const [featured, ...rest] = SAJU_CHARACTERS;

    return (
      <div className="saju-shell min-h-dvh">
        <MobileShell className="min-h-dvh px-4 pb-[calc(env(safe-area-inset-bottom)+36px)] pt-[calc(env(safe-area-inset-top)+12px)]">
          <button
            className="self-start text-sm font-semibold text-[#9A9098] transition hover:text-[#FF7A99]"
            onClick={() => setStep("landing")}
            type="button"
          >
            ← 소개로
          </button>
          <h1 className="mt-4 text-[1.55rem] font-bold leading-tight tracking-[-0.04em] text-[#F4F0F2]">
            캐릭터 선택
          </h1>
          <p className="mt-1.5 text-sm leading-5 text-[#9A9098]">
            세 명의 목소리가 각자의 결로 마음을 받아줍니다.
          </p>

          <div className="mt-5 flex flex-col gap-3.5">
            {featured ? (
              <PortraitHeroCard
                character={featured}
                featured
                onSelect={() => startWithCharacter(featured.id)}
                variant="select"
              />
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              {rest.map((c) => (
                <PortraitHeroCard
                  key={c.id}
                  character={c}
                  onSelect={() => startWithCharacter(c.id)}
                  variant="select"
                />
              ))}
            </div>
          </div>
        </MobileShell>
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
      <MobileShell className="sticky top-0 z-20">
        <header className="saju-header flex items-center gap-3 px-4 py-3">
          <button
            aria-label="캐릭터 다시 선택"
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-[#9A9098] transition hover:bg-white/5 hover:text-[#FF7A99]"
            onClick={restart}
            type="button"
          >
            ←
          </button>
          <div className="relative">
            <CharacterAvatar character={character} size="sm" />
            <span
              className="pointer-events-none absolute -inset-0.5 -z-10 rounded-full opacity-70 blur-[6px]"
              style={{ background: character.accent }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.95rem] font-bold tracking-[-0.03em] text-[#F4F0F2]">
              {character.name}
            </div>
            <div className="truncate text-[11px] text-[#9A9098]">{character.tagline}</div>
          </div>
          <button
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(232,51,109,0.35)]"
            style={{ background: "#E8336D" }}
            onClick={() => void openConclusionFlow()}
            type="button"
          >
            결론
          </button>
        </header>
      </MobileShell>

      <MobileShell className="flex min-h-0 flex-1 flex-col">
        <div
          ref={listRef}
          className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4"
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
                  className={`max-w-[78%] px-4 py-3 text-[0.95rem] leading-7 ${
                    mine
                      ? "rounded-[22px] rounded-br-md text-white shadow-[0_10px_28px_rgba(232,51,109,0.28)]"
                      : "saju-bubble-assistant rounded-[22px] rounded-bl-md shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
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
          <div className="px-4">
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
          <div className="px-4 pb-1 text-center text-xs text-[#FF7A99]">{error}</div>
        ) : null}

        <div className="saju-footer px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)]">
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
            className="flex items-end gap-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <textarea
              className="saju-input max-h-28 min-h-12 flex-1 resize-none rounded-[20px] px-4 py-3 text-sm leading-6"
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
              className="saju-cta flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg disabled:opacity-40"
              disabled={sending || !input.trim()}
              type="submit"
            >
              ↑
            </button>
          </form>
          <p className="mt-2.5 text-center text-[10px] leading-4 text-[#6B6570]">
            오락용 AI 채팅 · 실제 예언이 아닙니다
          </p>
        </div>
      </MobileShell>

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
