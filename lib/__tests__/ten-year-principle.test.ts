import { describe, expect, it } from "vitest";

import { buildTenYearPrincipleCard } from "@/lib/ten-year-principle";

describe("buildTenYearPrincipleCard", () => {
  it("uses calm and durable language for shallow drawdowns", () => {
    const card = buildTenYearPrincipleCard({
      assetLabel: "예금",
      difficultyLabel: "쉬움",
      drawdownTolerance: "-20%",
      focus: "endurance",
      investmentMode: "lump-sum",
      maxDrawdownPct: -3.2,
      recovered: true,
      recoveryMonths: 1,
      reviewCycle: "1년",
    });

    expect(card.headline).toContain("오래 지킬 수 있는 기준");
    expect(card.insightLines.join(" ")).toContain("3.2% 하락");
    expect(card.insightLines.join(" ")).toContain("꾸준한 기준");
    expect(card.insightLines.join(" ")).not.toContain("분류");
  });

  it("turns severe drawdowns into a lesson about endurance", () => {
    const card = buildTenYearPrincipleCard({
      assetLabel: "NVIDIA",
      difficultyLabel: "매우 어려움",
      drawdownTolerance: "-50%",
      focus: "endurance",
      investmentMode: "lump-sum",
      maxDrawdownPct: -55.3,
      recovered: true,
      recoveryMonths: 8,
      reviewCycle: "1년",
    });

    const text = [...card.insightLines, ...card.promiseLines].join(" ");

    expect(card.headline).toContain("버틴 시간");
    expect(text).toContain("55.3% 하락");
    expect(text).toContain("체력의 문제");
    expect(text).toContain("처음 세운 이유");
    expect(text).not.toContain("매우 어려움으로 분류");
  });

  it("reflects unrecovered assets without sounding like a report", () => {
    const card = buildTenYearPrincipleCard({
      assetLabel: "테마 ETF",
      difficultyLabel: "아주 어려움",
      drawdownTolerance: "-30%",
      focus: "endurance",
      investmentMode: "lump-sum",
      maxDrawdownPct: -41.8,
      recovered: false,
      recoveryMonths: null,
      reviewCycle: "3개월",
    });

    expect(card.insightLines.join(" ")).toContain("아직 이전 고점을 되찾지 못했습니다");
    expect(card.insightLines.join(" ")).toContain("낙관보다 기준");
  });

  it("prioritizes monthly wording for monthly contribution mode", () => {
    const card = buildTenYearPrincipleCard({
      assetLabel: "S&P500 ETF",
      difficultyLabel: "보통",
      drawdownTolerance: "-30%",
      focus: "endurance",
      investmentMode: "monthly",
      maxDrawdownPct: -22.1,
      recovered: true,
      recoveryMonths: 7,
      reviewCycle: "1년",
    });

    expect(card.headline).toContain("예측보다 반복");
    expect(card.promiseLines.join(" ")).toContain("반복할 수 있는 금액");
  });

  it("uses risk-boundary wording when drawdown control is selected", () => {
    const card = buildTenYearPrincipleCard({
      assetLabel: "QQQ",
      difficultyLabel: "어려움",
      drawdownTolerance: "-30%",
      focus: "drawdown",
      investmentMode: "lump-sum",
      maxDrawdownPct: -33.4,
      recovered: true,
      recoveryMonths: 11,
      reviewCycle: "6개월",
    });

    expect(card.headline).toContain("감당할 수 없는 하락");
    expect(card.promiseLines.join(" ")).toContain("-30%");
    expect(card.insightLines.join(" ")).toContain("어디까지 흔들려도 괜찮은지");
  });
});
