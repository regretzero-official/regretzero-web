const ASSET_COLOR_MAP: Record<string, string> = {
  seoul_apt: "#A78BFA",
  gangnam_gu_apt: "#F59E8B",
  deposit: "#8E97A4",
  gold: "#D7AE58",
  usd: "#7FB2FF",
  qqq: "#4CD4C3",
  voo: "#5DA7FF",
  vti: "#7AB8FF",
  vt: "#7E93FF",
  vxus: "#4DB4D4",
  iwm: "#8ACA5A",
  gld: "#CFA04A",
  vnq: "#63C7B1",
  soxx: "#4EE7C3",
  nvda: "#43D17F",
  tsla: "#FF7A61",
  aapl: "#C6CED8",
  msft: "#6CB6FF",
  amzn: "#F0B14A",
  googl: "#8BA7FF",
  meta: "#5EC8F6",
  brkb: "#CDAA63",
  jpm: "#698FD8",
  jnj: "#94C2FF",
  v: "#7F9CFF",
  ma: "#FF8758",
  cost: "#62D4C9",
  pg: "#9FD08B",
  ko: "#FF6178",
  xom: "#96A1D8",
  avgo: "#57D89F",
  amd: "#41C97B",
  "005930": "#73BFFF",
  "000660": "#FF7792",
  "005380": "#52C4BC",
  "000270": "#FF966F",
  "035420": "#53D48C",
  "035720": "#F0C24F",
  "068270": "#8FD2FF",
  "207940": "#B19CFF",
  "005490": "#7699FF",
  "105560": "#7FC3B7",
  "055550": "#5CB8FF",
  "033780": "#7CB56C",
  "012450": "#8DAAFF",
  "034020": "#7FD2FF",
  "028260": "#B7C2D8",
  "003550": "#C1A6FF",
  "069500": "#6EBEFF",
  "360750": "#5D95FF",
  btc: "#F5B95A",
  eth: "#8FA2FF",
};

export const COMPARISON_SLOT_COLORS = [
  "#5DA7FF",
  "#43D17F",
  "#F0B14A",
] as const;

const FALLBACK_PALETTE = [
  "#5DA7FF",
  "#43D17F",
  "#FF7A61",
  "#D7AE58",
  "#8FA2FF",
  "#5EC8F6",
  "#CDAA63",
  "#FF6178",
  "#62D4C9",
  "#B19CFF",
];

function hashKey(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized
        .split("")
        .map((character) => `${character}${character}`)
        .join("")
    : normalized;

  const parsed = Number.parseInt(value, 16);

  return {
    blue: parsed & 255,
    green: (parsed >> 8) & 255,
    red: (parsed >> 16) & 255,
  };
}

export function getAssetColor(assetKey: string) {
  return ASSET_COLOR_MAP[assetKey] ?? FALLBACK_PALETTE[hashKey(assetKey) % FALLBACK_PALETTE.length]!;
}

export function getComparisonSlotColor(slotIndex: number) {
  const normalizedIndex =
    ((Math.trunc(slotIndex) % COMPARISON_SLOT_COLORS.length) + COMPARISON_SLOT_COLORS.length) %
    COMPARISON_SLOT_COLORS.length;

  return COMPARISON_SLOT_COLORS[normalizedIndex]!;
}

export function getAssetGlow(assetKey: string, alpha = 0.18) {
  const { blue, green, red } = hexToRgb(getAssetColor(assetKey));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getComparisonSlotGlow(slotIndex: number, alpha = 0.18) {
  const { blue, green, red } = hexToRgb(getComparisonSlotColor(slotIndex));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
