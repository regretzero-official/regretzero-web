import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readSavedFutureScenarios,
  readSavedPrinciples,
  saveFutureScenario,
  savePrinciple,
} from "@/lib/time-machine-storage";

function createLocalStorageMock() {
  const values = new Map<string, string>();

  return {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("time-machine-storage principles", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and reads principle cards from localStorage", () => {
    vi.stubGlobal("window", {
      localStorage: createLocalStorageMock(),
    });

    const saved = savePrinciple({
      assetIds: ["qqq", "deposit"],
      drawdownTolerance: "-30%",
      focus: "endurance",
      investmentMode: "lump-sum",
      reviewCycle: "1년",
      summary: "QQQ 기준 · -31.0% 하락 · 1년 점검",
    });
    const principles = readSavedPrinciples();

    expect(saved.id).toMatch(/^principle-/);
    expect(principles).toHaveLength(1);
    expect(principles[0]).toMatchObject({
      assetIds: ["qqq", "deposit"],
      focus: "endurance",
      summary: "QQQ 기준 · -31.0% 하락 · 1년 점검",
    });
  });

  it("saves and reads future scenarios from localStorage", () => {
    vi.stubGlobal("window", {
      localStorage: createLocalStorageMock(),
    });

    const saved = saveFutureScenario({
      assetIds: ["qqq", "deposit"],
      initialKrw: 10_000_000,
      monthlyKrw: 300_000,
      resultsSummary: ["보수 약 5,100만원", "기준 약 6,200만원", "낙관 약 7,700만원"],
      years: 10,
    });
    const scenarios = readSavedFutureScenarios();

    expect(saved.id).toMatch(/^future-/);
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0]).toMatchObject({
      assetIds: ["qqq", "deposit"],
      initialKrw: 10_000_000,
      monthlyKrw: 300_000,
      years: 10,
    });
  });
});
