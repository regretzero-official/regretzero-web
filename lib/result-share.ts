export interface ResultShareRow {
  finalValueLabel: string;
  label: string;
  maxDrawdownLabel: string;
  recoveryLabel: string;
  totalReturnLabel: string;
}

export function buildSoloReplayAssetIds(assetId: string) {
  return [assetId, assetId === "deposit" ? "usd" : "deposit"];
}

export function buildResultShareText({
  dateRangeLabel,
  headline,
  rows,
}: {
  dateRangeLabel: string;
  headline: string;
  rows: ResultShareRow[];
}) {
  const visibleRows = rows.slice(0, 2);
  const rowText = visibleRows
    .map((row, index) => {
      const rank = visibleRows.length > 1 ? `${index + 1}. ` : "";

      return [
        `${rank}${row.label}`,
        `최종 ${row.finalValueLabel} · 총수익률 ${row.totalReturnLabel}`,
        `최대 낙폭 ${row.maxDrawdownLabel} · 회복 ${row.recoveryLabel}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    headline,
    dateRangeLabel,
    "",
    rowText,
    "",
    "결과만 보면 쉬워 보여도, 중간의 하락을 버틸 수 있었을까요?",
    "같은 조건으로 내 종목도 직접 돌려보세요.",
    "",
    "투자 권유가 아닌 과거 데이터 시뮬레이션입니다.",
  ]
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1] !== ""))
    .join("\n");
}

export function buildResultShareUrl({
  assetIds,
  assetLabel,
  baseUrl,
  drawdownLabel,
  endDate,
  finalValueLabel,
  gapLabel,
  inputKrw,
  investmentMode,
  investedLabel,
  recoveryLabel,
  startDate,
  totalReturnLabel,
  waitingMonths,
}: {
  assetIds: string[];
  assetLabel: string;
  baseUrl: string;
  drawdownLabel: string;
  endDate: string;
  finalValueLabel: string;
  gapLabel: string;
  inputKrw: number;
  investmentMode: "lump-sum" | "monthly";
  investedLabel: string;
  recoveryLabel: string;
  startDate: string;
  totalReturnLabel: string;
  waitingMonths: number;
}) {
  const url = new URL("/", baseUrl);

  url.searchParams.set("shared", "1");
  url.searchParams.set("assets", assetIds.slice(0, 2).join(","));
  url.searchParams.set("mode", investmentMode);
  url.searchParams.set("input", `${Math.max(0, Math.round(inputKrw))}`);
  url.searchParams.set("start", startDate);
  url.searchParams.set("end", endDate);
  url.searchParams.set("ogAsset", assetLabel);
  url.searchParams.set("ogAmount", investedLabel);
  url.searchParams.set("ogFinal", finalValueLabel);
  url.searchParams.set("ogGap", gapLabel);
  url.searchParams.set("ogWait", `${Math.max(0, Math.round(waitingMonths))}`);
  url.searchParams.set("ogReturn", totalReturnLabel);
  url.searchParams.set("ogDrawdown", drawdownLabel);
  url.searchParams.set("ogRecovery", recoveryLabel);
  url.searchParams.set("utm_source", "share");
  url.searchParams.set("utm_medium", "result_card");
  url.searchParams.set("utm_campaign", "shared_result");

  return url.toString();
}
