import type { PartnerChart, SajuChart } from "./types";

/** Compact one-line 원국 for chips / titles */
export function formatChartChip(chart: SajuChart): string {
  const h = chart.pillars.hour?.korean ?? "시주미상";
  return `${chart.pillars.year.korean} · ${chart.pillars.month.korean} · ${chart.pillars.day.korean} · ${h} · 일간 ${chart.dayMaster}`;
}

/** Partner chart Korean blurb */
export function formatPartnerChartMarkdown(pc: PartnerChart): string {
  const lines: string[] = [];
  lines.push(`## 상대 원국(만세력)`);
  if (pc.detailLevel === "year-only") {
    lines.push(`- 출생연도 ${pc.solar.year} (월일 미상 → 연주만)`);
    lines.push(`- 연주: ${pc.pillars.year.korean}(${pc.pillars.year.hanja})`);
    lines.push(`- 요약: ${pc.summaryLine}`);
    return lines.join("\n");
  }
  const m = pc.solar.month ?? 0;
  const d = pc.solar.day ?? 0;
  lines.push(
    `- 양력 ${pc.solar.year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` +
      (pc.birthClock
        ? ` ${String(pc.birthClock.hour).padStart(2, "0")}:${String(pc.birthClock.minute).padStart(2, "0")}`
        : " (시간 미상 → 시주 제외)"),
  );
  lines.push(
    `- 네 기둥: 년 ${pc.pillars.year.korean}(${pc.pillars.year.hanja}) / 월 ${pc.pillars.month?.korean ?? "?"}(${pc.pillars.month?.hanja ?? "?"}) / 일 ${pc.pillars.day?.korean ?? "?"}(${pc.pillars.day?.hanja ?? "?"}) / 시 ${pc.pillars.hour ? `${pc.pillars.hour.korean}(${pc.pillars.hour.hanja})` : "미상"}`,
  );
  if (pc.dayMaster) {
    lines.push(
      `- 일간(日干): **${pc.dayMaster}** (${pc.dayMasterYinYang ?? ""}${pc.dayMasterElement ?? ""})`,
    );
  }
  lines.push(`- 요약: ${pc.summaryLine}`);
  return lines.join("\n");
}

/** Markdown/plain Korean blurb for report injection & LLM prompts */
export function formatChartMarkdown(chart: SajuChart): string {
  const lines: string[] = [];
  lines.push(`## 원국(만세력)`);
  lines.push(
    `- 양력 ${chart.solar.year}-${String(chart.solar.month).padStart(2, "0")}-${String(chart.solar.day).padStart(2, "0")}` +
      (chart.birthClock
        ? ` ${String(chart.birthClock.hour).padStart(2, "0")}:${String(chart.birthClock.minute).padStart(2, "0")}`
        : " (시간 미상 → 시주 제외)"),
  );
  lines.push(
    `- 네 기둥: 년 ${chart.pillars.year.korean}(${chart.pillars.year.hanja}) / 월 ${chart.pillars.month.korean}(${chart.pillars.month.hanja}) / 일 ${chart.pillars.day.korean}(${chart.pillars.day.hanja}) / 시 ${chart.pillars.hour ? `${chart.pillars.hour.korean}(${chart.pillars.hour.hanja})` : "미상"}`,
  );
  lines.push(
    `- 일간(日干): **${chart.dayMaster}** (${chart.dayMasterYinYang}${chart.dayMasterElement})`,
  );
  lines.push(
    `- 십성: 년 ${chart.tenGods.year.stem}/${chart.tenGods.year.branch}, 월 ${chart.tenGods.month.stem}/${chart.tenGods.month.branch}, 일 일간/${chart.tenGods.day.branch}` +
      (chart.tenGods.hour
        ? `, 시 ${chart.tenGods.hour.stem}/${chart.tenGods.hour.branch}`
        : ", 시 (미상)"),
  );
  lines.push(`- 공망: ${chart.voidBranches.length ? chart.voidBranches.join("·") : "없음"}`);
  lines.push(
    `- 세운(올해 연주): ${chart.currentYearPillar.korean}(${chart.currentYearPillar.hanja})`,
  );
  if (chart.luckPillars) {
    const sample = chart.luckPillars.pillars
      .slice(0, 4)
      .map((p) => `${p.age}세 ${p.korean}`)
      .join(", ");
    lines.push(
      `- 대운: ${chart.luckPillars.forward ? "순행" : "역행"}, 시작 ${chart.luckPillars.startAge}세 · ${sample}`,
    );
  } else {
    lines.push(`- 대운: (성별 미지정·기타 → 생략)`);
  }
  if (chart.partnerChart) {
    lines.push("");
    lines.push(formatPartnerChartMarkdown(chart.partnerChart));
  } else if (chart.partnerYearPillar) {
    lines.push(
      `- 상대 연주: ${chart.partnerYearPillar.korean}(${chart.partnerYearPillar.hanja})`,
    );
  }
  lines.push(`- 요약: ${chart.summaryLine}`);
  return lines.join("\n");
}

export function formatChartPlain(chart: SajuChart): string {
  return formatChartMarkdown(chart).replace(/^#+\s+/gm, "").replace(/\*\*/g, "");
}
