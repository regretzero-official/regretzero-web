/** Pure field-level validators for the Foxbunny birth form. */

export const MONTHS_MIN = 0;
export const MONTHS_MAX = 120;

export function daysInMonth(year: number, month: number) {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

export function parseMonthsApart(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isInteger(n)) return null;
  if (n < MONTHS_MIN || n > MONTHS_MAX) return null;
  return n;
}

/** Short CTA reason — 이별 개월 0–120 */
export function monthsApartReason(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "이별 개월 0–120";
  if (!/^\d+$/.test(t)) return "이별 개월 0–120";
  const n = Number(t);
  if (n < MONTHS_MIN || n > MONTHS_MAX) return "이별 개월 0–120";
  return null;
}

/** Inline helper under the months field */
export function monthsApartFieldError(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return "숫자만 적어 주세요";
  const n = Number(t);
  if (n < MONTHS_MIN || n > MONTHS_MAX) {
    return `${MONTHS_MIN}~${MONTHS_MAX}개월 사이로 적어 주세요`;
  }
  return null;
}

export function genderReason(gender: string): string | null {
  if (gender === "여성" || gender === "남성" || gender === "기타") return null;
  return "성별 미선택";
}

export function solarDateComplete(
  year: string,
  month: string,
  day: string,
): boolean {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (!Number.isFinite(y) || y < 1940 || y > new Date().getFullYear()) return false;
  if (!Number.isFinite(m) || m < 1 || m > 12) return false;
  const maxD = daysInMonth(y, m);
  if (!Number.isFinite(d) || d < 1 || d > maxD) return false;
  return true;
}

/** Short CTA reason — 날짜 불완전 */
export function solarDateReason(
  year: string,
  month: string,
  day: string,
): string | null {
  return solarDateComplete(year, month, day) ? null : "날짜 불완전";
}

/**
 * Birth time is optional (empty / 모름 OK).
 * When filled with digits, require HH:MM; Korean phrases that parse as a time are OK.
 */
export function birthTimeReason(raw: string): string | null {
  const t = raw.trim();
  if (!t || t === "모름") return null;

  if (/[가-힣]/.test(t)) {
    // Allow common Korean phrases; incomplete/garbage Hangul still flagged
    if (
      /(\d{1,2})\s*시/.test(t) ||
      /정오|자정|미상|몰라/.test(t)
    ) {
      return null;
    }
    return "시간 HH:MM 형식";
  }

  if (!/^\d{1,2}:\d{2}$/.test(t)) return "시간 HH:MM 형식";
  const [hs, ms] = t.split(":");
  const h = Number(hs);
  const m = Number(ms);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return "시간 HH:MM 형식";
  if (h < 0 || h > 23 || m < 0 || m > 59) return "시간 HH:MM 형식";
  return null;
}

export function concernReason(concern: string): string | null {
  return concern.trim().length > 0 ? null : "궁금한 것을 적어 주세요";
}
