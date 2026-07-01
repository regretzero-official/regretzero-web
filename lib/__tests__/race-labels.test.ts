import { describe, expect, it } from "vitest";

import { getRaceDisplayLabel } from "@/lib/race-labels";

describe("getRaceDisplayLabel", () => {
  it("prefers an explicit short label when provided", () => {
    expect(
      getRaceDisplayLabel({
        label: "예금(연 3.04% 가정)",
        marketTicker: undefined,
        shortLabel: "예금",
      }),
    ).toBe("예금");
  });

  it("keeps short labels as-is", () => {
    expect(
      getRaceDisplayLabel({
        label: "삼성전자",
        marketTicker: "005930.KS",
        shortLabel: undefined,
      }),
    ).toBe("삼성전자");
  });

  it("falls back to ticker for long labels when available", () => {
    expect(
      getRaceDisplayLabel({
        label: "Berkshire Hathaway",
        marketTicker: "BRK-B",
        shortLabel: undefined,
      }),
    ).toBe("BRK-B");
  });
});
