import type { ComparisonAssetId } from "@/lib/home-content";

export interface IntroPresetTopic {
  assetIds: [ComparisonAssetId, ComparisonAssetId, ComparisonAssetId];
  description: string;
  id: string;
  isFixed?: boolean;
  label: string;
  rotationGroup: "daily";
}

const SEOUL_TIMEZONE = "Asia/Seoul";

export const introPresetTopics: IntroPresetTopic[] = [
  {
    assetIds: ["gold", "voo", "qqq"],
    description: "안전자산과 미국 대표 자산을 함께 비교",
    id: "steady-vs-growth",
    isFixed: true,
    label: "안정 vs 성장",
    rotationGroup: "daily",
  },
  {
    assetIds: ["005930", "000660", "aapl"],
    description: "한국 반도체와 미국 대표 기업을 비교",
    id: "korea-vs-us",
    label: "한국 vs 미국",
    rotationGroup: "daily",
  },
  {
    assetIds: ["qqq", "nvda", "tsla"],
    description: "기술 ETF와 대표 성장주를 함께 비교",
    id: "tech-focus",
    label: "기술주 집중",
    rotationGroup: "daily",
  },
  {
    assetIds: ["voo", "aapl", "msft"],
    description: "미국 ETF와 초대형 기술주를 비교",
    id: "us-bluechips",
    label: "미국 대표 자산",
    rotationGroup: "daily",
  },
  {
    assetIds: ["nvda", "avgo", "amd"],
    description: "AI 반도체 대표주 3종을 비교",
    id: "ai-leaders",
    label: "AI 대표주",
    rotationGroup: "daily",
  },
];

export function getDefaultIntroPresets() {
  const fixedPreset = introPresetTopics.find((preset) => preset.isFixed);
  const rotatingPresets = introPresetTopics.filter((preset) => !preset.isFixed).slice(0, 2);

  return [...(fixedPreset ? [fixedPreset] : []), ...rotatingPresets];
}

function getSeoulDateKey(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: SEOUL_TIMEZONE,
    year: "numeric",
  });

  return formatter.format(date);
}

function getSeedFromKey(key: string) {
  return [...key].reduce((seed, character) => seed + character.charCodeAt(0), 0);
}

export function getRotatingIntroPresets(date = new Date()) {
  const fixedPresets = introPresetTopics.filter((preset) => preset.isFixed);
  const rotatingPresets = introPresetTopics.filter((preset) => !preset.isFixed);

  if (rotatingPresets.length <= 2) {
    return [...fixedPresets, ...rotatingPresets];
  }

  const seed = getSeedFromKey(getSeoulDateKey(date));
  const firstIndex = seed % rotatingPresets.length;
  const secondIndex = (firstIndex + 2) % rotatingPresets.length;

  return [fixedPresets[0], rotatingPresets[firstIndex], rotatingPresets[secondIndex]].filter(
    Boolean,
  ) as IntroPresetTopic[];
}
