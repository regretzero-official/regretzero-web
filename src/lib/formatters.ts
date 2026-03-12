const KRW = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatCompactKrw(value: number) {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(abs >= 1_000_000_000 ? 0 : 1)}억 원`;
  if (abs >= 10_000) return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만 원`;
  return KRW.format(value);
}

export function formatKrw(value: number) {
  return KRW.format(value);
}

export function formatUsd(value: number) {
  return USD.format(value);
}

export function formatKrwMainUsdSub(krwValue?: number | null, usdValue?: number | null) {
  const krw = typeof krwValue === "number" && Number.isFinite(krwValue) ? formatKrw(krwValue) : "-";
  const usd = typeof usdValue === "number" && Number.isFinite(usdValue) ? formatUsd(usdValue) : "-";
  return `${krw} (${usd})`;
}

