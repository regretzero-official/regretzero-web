import { describe, expect, it } from "vitest";

import {
  BEAR_MARKET_PAIN_COPY,
  BRAND_SLOGANS,
  fillRegretCopyTemplate,
  REGRET_COPY_TONE,
  USER_DIAGNOSIS_COPY,
} from "@/lib/regret-copy";

describe("regret copy", () => {
  it("keeps ATH and principal-loss language separated", () => {
    expect(BEAR_MARKET_PAIN_COPY.metrics.underATHPercent).toContain("전고점");
    expect(BEAR_MARKET_PAIN_COPY.metrics.underATHPercent).not.toContain("본전");
    expect(BEAR_MARKET_PAIN_COPY.metrics.underATHPercent).not.toContain("원금");
    expect(BEAR_MARKET_PAIN_COPY.metrics.underPrincipal).toContain("원금");
  });

  it("does not use unsupported fake statistics in critical diagnosis copy", () => {
    const copy = [
      REGRET_COPY_TONE.rules.join(" "),
      USER_DIAGNOSIS_COPY.question,
      ...Object.values(USER_DIAGNOSIS_COPY.feedback),
      ...Object.values(USER_DIAGNOSIS_COPY.options),
    ].join(" ");

    expect(copy).not.toContain("10명 중");
    expect(copy).not.toContain("대부분의 투자자");
  });

  it("uses the service's direct long-term investing tone", () => {
    expect(BRAND_SLOGANS.primary).toBe("수익률보다 어려운 건, 그 시간을 견디는 일입니다.");
    expect(BRAND_SLOGANS.sellLowSellHigh).toContain("떨어질 때는 무서워서 팔고");
    expect(BRAND_SLOGANS.sellLowSellHigh).toContain("오를 때는 아까워서 팝니다");
  });

  it("fills known placeholders and leaves unknown placeholders untouched", () => {
    expect(
      fillRegretCopyTemplate("최종 금액과 {penaltyAmount} 차이, {unknown}", {
        penaltyAmount: "7억 원",
      }),
    ).toBe("최종 금액과 7억 원 차이, {unknown}");
  });
});
