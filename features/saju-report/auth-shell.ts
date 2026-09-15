/**
 * Google auth shell for /saju — stub until OAuth secrets exist.
 *
 * TODO(env): wire real Google OAuth when available:
 *   - GOOGLE_CLIENT_ID
 *   - GOOGLE_CLIENT_SECRET
 *   - NEXTAUTH_SECRET / Auth.js (or equivalent)
 * Until then, preview builds stay green via localStorage stub.
 */

export const SAJU_AUTH_SHELL_KEY = "rz-saju-auth-shell";

/** Clear env TODO so Vercel preview builds without Google secrets. */
export const GOOGLE_OAUTH_ENV_TODO =
  "TODO: set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (+ auth secret) to replace localStorage stub";

export type SajuAuthShellUser = {
  email: string;
  name: string;
  picture?: string;
  /** Always true while OAuth is stubbed */
  stub: true;
  signedInAt: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readSajuAuthShell(): SajuAuthShellUser | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(SAJU_AUTH_SHELL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SajuAuthShellUser;
    if (!parsed?.email || !parsed?.stub) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Stub 「저장하려면 구글」 — no real OAuth. */
export function stubGoogleSignIn(opts?: {
  email?: string;
  name?: string;
}): SajuAuthShellUser {
  const user: SajuAuthShellUser = {
    email: opts?.email ?? "demo@regretzero.app",
    name: opts?.name ?? "데모 사용자",
    stub: true,
    signedInAt: new Date().toISOString(),
  };
  if (canUseStorage()) {
    localStorage.setItem(SAJU_AUTH_SHELL_KEY, JSON.stringify(user));
  }
  return user;
}

export function clearSajuAuthShell() {
  if (!canUseStorage()) return;
  localStorage.removeItem(SAJU_AUTH_SHELL_KEY);
}

export function isGoogleOAuthConfigured(): boolean {
  // Client-visible flag only — never put secrets here.
  // Real OAuth stays off until NEXT_PUBLIC_SAJU_GOOGLE_AUTH=1 is set after secrets land.
  return process.env.NEXT_PUBLIC_SAJU_GOOGLE_AUTH === "1";
}
