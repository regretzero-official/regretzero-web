import {
  assetCatalog,
  type ComparisonAssetId,
} from "@/lib/home-content";

export interface ComparisonPreset {
  assetIds: ComparisonAssetId[];
  category: string;
  id: string;
  isFeatured?: boolean;
  title: string;
}

export const comparisonPresetLibrary: ComparisonPreset[] = [
  {
    assetIds: ["seoul_apt", "deposit"],
    category: "부동산 비교",
    id: "seoul-vs-deposit",
    isFeatured: true,
    title: "서울 아파트 vs 예금",
  },
  {
    assetIds: ["seoul_apt", "qqq"],
    category: "부동산 비교",
    id: "seoul-vs-qqq",
    isFeatured: true,
    title: "서울 아파트 vs QQQ",
  },
  {
    assetIds: ["seoul_apt", "tsla"],
    category: "부동산 비교",
    id: "seoul-vs-tesla",
    isFeatured: true,
    title: "서울 아파트 vs Tesla",
  },
  {
    assetIds: ["seoul_apt", "gold"],
    category: "부동산 비교",
    id: "seoul-vs-gold",
    isFeatured: true,
    title: "서울 아파트 vs 금",
  },
  {
    assetIds: ["seoul_apt", "005930", "qqq"],
    category: "부동산 비교",
    id: "seoul-vs-samsung-vs-qqq",
    isFeatured: true,
    title: "서울 아파트 vs 삼성전자 vs QQQ",
  },
  {
    assetIds: ["gangnam_gu_apt", "seoul_apt"],
    category: "부동산 비교",
    id: "gangnam-gu-vs-seoul",
    isFeatured: true,
    title: "강남구 아파트 vs 서울 아파트",
  },
  {
    assetIds: ["deposit", "qqq"],
    category: "기준 자산 비교",
    id: "deposit-vs-qqq",
    isFeatured: true,
    title: "예금 vs QQQ",
  },
  {
    assetIds: ["gold", "btc"],
    category: "안전 vs 성장",
    id: "gold-vs-btc",
    isFeatured: true,
    title: "금 vs 비트코인",
  },
  {
    assetIds: ["tsla", "qqq", "deposit"],
    category: "바로 시작하는 3자산",
    id: "tesla-vs-qqq-vs-deposit",
    isFeatured: true,
    title: "Tesla vs QQQ vs 예금",
  },
  {
    assetIds: ["gangnam_gu_apt", "qqq"],
    category: "부동산 비교",
    id: "gangnam-gu-vs-qqq",
    title: "강남구 아파트 vs QQQ",
  },
  {
    assetIds: ["deposit", "voo"],
    category: "기준 자산 비교",
    id: "deposit-vs-voo",
    title: "예금 vs VOO",
  },
  {
    assetIds: ["deposit", "nvda"],
    category: "기준 자산 비교",
    id: "deposit-vs-nvda",
    title: "예금 vs NVIDIA",
  },
  {
    assetIds: ["deposit", "btc"],
    category: "기준 자산 비교",
    id: "deposit-vs-btc",
    title: "예금 vs 비트코인",
  },
  {
    assetIds: ["005930", "nvda"],
    category: "한국 투자자 공감 비교",
    id: "samsung-vs-nvidia",
    title: "삼성전자 vs NVIDIA",
  },
  {
    assetIds: ["005930", "qqq"],
    category: "한국 투자자 공감 비교",
    id: "samsung-vs-qqq",
    title: "삼성전자 vs QQQ",
  },
  {
    assetIds: ["000660", "nvda"],
    category: "한국 투자자 공감 비교",
    id: "hynix-vs-nvidia",
    title: "SK하이닉스 vs NVIDIA",
  },
  {
    assetIds: ["voo", "qqq"],
    category: "안전 vs 성장",
    id: "voo-vs-qqq",
    title: "VOO vs QQQ",
  },
  {
    assetIds: ["gold", "tsla"],
    category: "안전 vs 성장",
    id: "gold-vs-tesla",
    title: "금 vs Tesla",
  },
  {
    assetIds: ["tsla", "nvda"],
    category: "AI 시대 감각",
    id: "tesla-vs-nvidia",
    title: "Tesla vs NVIDIA",
  },
  {
    assetIds: ["aapl", "nvda"],
    category: "AI 시대 감각",
    id: "apple-vs-nvidia",
    title: "Apple vs NVIDIA",
  },
  {
    assetIds: ["tsla", "voo"],
    category: "버티기 테스트",
    id: "tesla-vs-voo",
    title: "Tesla vs VOO",
  },
  {
    assetIds: ["btc", "gold", "deposit"],
    category: "버티기 테스트",
    id: "btc-vs-gold-vs-deposit",
    title: "비트코인 vs 금 vs 예금",
  },
];

export const featuredHomePresets = comparisonPresetLibrary.filter((preset) => preset.isFeatured);

export const comparisonPresetGroups = Array.from(
  comparisonPresetLibrary.reduce((groups, preset) => {
    const currentGroup = groups.get(preset.category) ?? [];
    currentGroup.push(preset);
    groups.set(preset.category, currentGroup);
    return groups;
  }, new Map<string, ComparisonPreset[]>()),
).map(([category, presets]) => ({
  category,
  presets,
}));

export function getPresetAssetPairLabel(
  preset: Pick<ComparisonPreset, "assetIds">,
) {
  return preset.assetIds
    .map((assetId) => assetCatalog[assetId].shortLabel ?? assetCatalog[assetId].label)
    .join(" vs ");
}
