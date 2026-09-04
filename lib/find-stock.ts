import {
  assetCatalog,
  assetOrder,
  type AssetOption,
  type ComparisonAssetId,
} from "@/lib/home-content";

export const FIND_SEARCH_RESULT_LIMIT = 40;
export const FIND_SEARCH_RESULT_HARD_CAP = 50;

export type FindCuratedAsset = {
  hint: string;
  id: ComparisonAssetId;
  label: string;
};

/**
 * Empty-query curated list for 종목 찾기.
 * Keep human one-line hints; warm precise Korean tone.
 */
export const FIND_CURATED_ASSETS: FindCuratedAsset[] = [
  // ETFs
  { id: "qqq", label: "QQQ", hint: "미국 기술 기업을 묶어 담은 ETF" },
  { id: "qld", label: "QLD", hint: "나스닥100을 2배로 따라가는 ETF" },
  { id: "tqqq", label: "TQQQ", hint: "나스닥100을 3배로 따라가는 ETF" },
  { id: "spy", label: "SPY", hint: "미국 S&P500을 대표하는 ETF" },
  { id: "voo", label: "VOO", hint: "S&P500을 낮은 비용으로 담는 ETF" },
  { id: "soxx", label: "SOXX", hint: "미국 반도체를 모은 ETF" },
  { id: "soxl", label: "SOXL", hint: "미국 반도체를 3배로 따라가는 ETF" },
  { id: "smh", label: "SMH", hint: "반도체 대장주를 담은 ETF" },
  { id: "iwm", label: "IWM", hint: "미국 소형주를 담은 ETF" },
  // US stocks
  { id: "nvda", label: "NVIDIA", hint: "AI와 함께 이름이 커진 반도체" },
  { id: "aapl", label: "Apple", hint: "아이폰으로 익숙한 미국 기업" },
  { id: "msft", label: "Microsoft", hint: "소프트웨어와 클라우드의 큰 축" },
  { id: "googl", label: "Alphabet", hint: "검색과 유튜브의 알파벳" },
  { id: "amzn", label: "Amazon", hint: "쇼핑과 클라우드를 함께 키운 기업" },
  { id: "meta", label: "Meta", hint: "페이스북·인스타그램을 만든 기업" },
  { id: "tsla", label: "테슬라", hint: "많이 오르고, 많이 흔들리던 이름" },
  { id: "avgo", label: "Broadcom", hint: "반도체·소프트웨어를 함께 품은 기업" },
  { id: "brkb", label: "Berkshire", hint: "워런 버핏의 투자 회사" },
  // KR
  { id: "005930", label: "삼성전자", hint: "한국에서 가장 익숙한 이름" },
  { id: "000660", label: "SK하이닉스", hint: "메모리 반도체 대표 기업" },
  { id: "005380", label: "현대차", hint: "한국을 대표하는 자동차" },
  { id: "035420", label: "NAVER", hint: "검색과 플랫폼으로 익숙한 이름" },
  { id: "035720", label: "카카오", hint: "메신저로 시작된 플랫폼" },
  { id: "068270", label: "셀트리온", hint: "바이오시밀러로 알려진 기업" },
  { id: "000270", label: "기아", hint: "현대차 그룹의 또 다른 자동차" },
  // RE proxies
  { id: "seoul_apt", label: "서울 아파트", hint: "서울 평균 흐름을 보는 비교값" },
  { id: "gangnam_gu_apt", label: "강남 아파트", hint: "강남 평균 흐름을 보는 비교값" },
  // Metals
  { id: "gold", label: "금", hint: "흔들릴 때 자주 떠올리는 안전자산" },
  { id: "silver", label: "은", hint: "금보다 더 크게 흔들리는 귀금속" },
  // Crypto
  { id: "btc", label: "비트코인", hint: "디지털 자산의 상징" },
  { id: "eth", label: "이더리움", hint: "스마트계약으로 알려진 코인" },
  { id: "sol", label: "솔라나", hint: "빠른 전송으로 알려진 코인" },
  { id: "xrp", label: "XRP", hint: "송금 네트워크로 알려진 코인" },
];

const PREFERRED_SHARE_RE = /(우$|우B$|우C$|1우|2우|3우|preferred|pref\.?$)/i;
const SPAC_RE = /\b(spac|acquisition corp|acquisition company)\b/i;

export function normalizeFindQuery(query: string) {
  return query
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[\s._/\-()]+/g, "");
}

function collectSearchFields(asset: AssetOption) {
  return [
    asset.id,
    asset.label,
    asset.shortLabel,
    asset.marketTicker,
    asset.exchange,
    asset.description,
    asset.selectedSummary,
    ...asset.searchTerms,
  ]
    .filter(Boolean)
    .map((value) => normalizeFindQuery(String(value)));
}

export function shouldExcludeFromFind(asset: AssetOption) {
  const label = `${asset.label} ${asset.shortLabel ?? ""} ${asset.marketTicker ?? ""}`;
  if (PREFERRED_SHARE_RE.test(label)) {
    return true;
  }
  if (SPAC_RE.test(label)) {
    return true;
  }
  return false;
}

/**
 * Higher score = better match.
 * Prefix / exact ticker beats loose substring.
 */
export function scoreFindAssetMatch(asset: AssetOption, rawQuery: string) {
  const query = normalizeFindQuery(rawQuery);
  if (!query) {
    return 0;
  }

  const fields = collectSearchFields(asset);
  let best = 0;

  for (const field of fields) {
    if (!field) {
      continue;
    }
    if (field === query) {
      best = Math.max(best, 100);
      continue;
    }
    if (field.startsWith(query)) {
      best = Math.max(best, 80 - Math.min(20, field.length - query.length));
      continue;
    }
    if (field.includes(query)) {
      best = Math.max(best, 50 - Math.min(20, field.indexOf(query)));
    }
  }

  // Prefer available assets slightly.
  if (best > 0 && asset.isAvailable) {
    best += 5;
  }

  // Prefer market-cap ranked names slightly.
  if (best > 0 && typeof asset.marketCapRank === "number") {
    best += Math.max(0, 8 - Math.floor(asset.marketCapRank / 20));
  }

  return best;
}

export function assetMatchesFindQuery(asset: AssetOption, rawQuery: string) {
  return scoreFindAssetMatch(asset, rawQuery) > 0;
}

export function getFindCuratedRows() {
  return FIND_CURATED_ASSETS.filter((row) => Boolean(assetCatalog[row.id])).map((row) => {
    const asset = assetCatalog[row.id];
    return {
      ...row,
      isAvailable: asset.isAvailable,
      noDataLabel: asset.isAvailable ? null : "아직 과거 데이터가 부족해요",
    };
  });
}

export function searchFindAssetIds(
  rawQuery: string,
  options?: {
    hardCap?: number;
    limit?: number;
  },
) {
  const query = normalizeFindQuery(rawQuery);
  if (!query) {
    return [] as ComparisonAssetId[];
  }

  const limit = options?.limit ?? FIND_SEARCH_RESULT_LIMIT;
  const hardCap = options?.hardCap ?? FIND_SEARCH_RESULT_HARD_CAP;

  const scored = assetOrder
    .map((assetId) => {
      const asset = assetCatalog[assetId];
      if (!asset || shouldExcludeFromFind(asset)) {
        return null;
      }
      const score = scoreFindAssetMatch(asset, query);
      if (score <= 0) {
        return null;
      }
      return { assetId, score, rank: asset.marketCapRank ?? Number.MAX_SAFE_INTEGER };
    })
    .filter(Boolean) as Array<{ assetId: ComparisonAssetId; score: number; rank: number }>;

  scored.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.rank - right.rank;
  });

  return scored.slice(0, Math.min(limit, hardCap)).map((entry) => entry.assetId);
}

export const FIND_CURATED_COUNT = FIND_CURATED_ASSETS.length;
