"use client";

import { useCallback, useEffect, useState } from "react";

import {
  GOOGLE_OAUTH_ENV_TODO,
  clearSajuAuthShell,
  isGoogleOAuthConfigured,
  readSajuAuthShell,
  stubGoogleSignIn,
  type SajuAuthShellUser,
} from "@/features/saju-report/auth-shell";

type Props = {
  /** Compact row under preview / save prompts */
  className?: string;
  onSignedIn?: (user: SajuAuthShellUser) => void;
  /** Soft hint shown above the button */
  hint?: string;
};

/**
 * 「저장하려면 구글」 — only after free preview / on save.
 * Never mounts on hub or form. Stub uses localStorage until OAuth secrets exist.
 */
export function GoogleSaveButton({
  className = "",
  onSignedIn,
  hint = "미리보기는 로그인 없이 볼 수 있어요. 저장할 때만 구글이 필요해요.",
}: Props) {
  const [user, setUser] = useState<SajuAuthShellUser | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUser(readSajuAuthShell());
  }, []);

  const handleSignIn = useCallback(() => {
    setBusy(true);
    try {
      if (isGoogleOAuthConfigured()) {
        // Real OAuth not wired yet — fall through to stub so preview never 500s.
        // eslint-disable-next-line no-console
        console.info("[saju-auth]", GOOGLE_OAUTH_ENV_TODO);
      }
      const next = stubGoogleSignIn();
      setUser(next);
      onSignedIn?.(next);
    } finally {
      setBusy(false);
    }
  }, [onSignedIn]);

  const handleSignOut = useCallback(() => {
    clearSajuAuthShell();
    setUser(null);
  }, []);

  if (user) {
    return (
      <div
        className={`rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF7A99]">
              저장됨 · 스텁
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-[#F4F0F2]">
              {user.name}
            </div>
            <div className="truncate text-[11px] text-[#9A9098]">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-[#B8AEB4]"
          >
            로그아웃
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[#6E666C]">{GOOGLE_OAUTH_ENV_TODO}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {hint ? (
        <p className="mb-2 text-center text-[11px] leading-5 text-[#9A9098]">{hint}</p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={handleSignIn}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white px-4 text-sm font-semibold text-[#1a1a1a] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition active:scale-[0.99] disabled:opacity-50"
      >
        <GoogleGlyph />
        {busy ? "연결 중…" : "저장하려면 구글"}
      </button>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 36.9 44 32 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
