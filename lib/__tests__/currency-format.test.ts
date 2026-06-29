import { describe, expect, it } from "vitest";

import {
  floorKrwToManUnit,
  formatAmountInput,
  formatAxisCurrency,
  formatKrwCompact,
  formatManUnitAmountInput,
  parseAmountInput,
  parseManUnitAmountInput,
} from "@/lib/race-engine";

describe("currency display", () => {
  it("drops values below 10,000 KRW in compact labels", () => {
    expect(formatKrwCompact(12_345)).toBe("1만원");
    expect(formatKrwCompact(19_999)).toBe("1만원");
    expect(formatKrwCompact(123_456_789)).toBe("1억 2,345만원");
  });

  it("does not expose won-level labels for small positive values", () => {
    expect(formatKrwCompact(9_999)).toBe("1만원 미만");
    expect(formatKrwCompact(0)).toBe("0만원");
  });

  it("drops sub-10,000 KRW units in chart axes", () => {
    expect(formatAxisCurrency(19_999)).toBe("1만");
    expect(formatAxisCurrency(9_999)).toBe("1만 미만");
  });

  it("keeps raw KRW parsing usable for intermediate typing", () => {
    expect(parseAmountInput("12,345")).toBe(12_345);
    expect(parseAmountInput("9,999")).toBe(9_999);
    expect(formatAmountInput("12,345")).toBe("12,345");
    expect(floorKrwToManUnit(12_345)).toBe(10_000);
  });

  it("supports direct inputs in 10,000 KRW units", () => {
    expect(parseManUnitAmountInput("5,000")).toBe(50_000_000);
    expect(parseManUnitAmountInput("30")).toBe(300_000);
    expect(formatManUnitAmountInput(50_000_000)).toBe("5,000");
  });
});
