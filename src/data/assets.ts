import assetData from "./gemini_global_quality_assets.json";

export type AssetGroup = "주식" | "ETF" | "가상자산" | "원자재/기타";

export type Asset = {
    ticker: string;
    name: string;
    group: AssetGroup;
    price10yUsd: number;
    currentUsd: number;
    oneLiner: string;
};

export type ChartPoint = {
    month: number;
    year: number; // e.g. 2016.0 ... 2026.0 ... 2045.0
    bank: number;
    asset: number;
    isFuture: boolean;
    isConvictionPoint?: boolean;
    convictionMessage?: string;
};

export const KRW_INITIAL = 10_000_000;
export const START_YEAR = 2016;
export const CURRENT_YEAR = 2026;
export const FUTURE_END_YEAR = 2045;

export const MONTHS_REGRET = (CURRENT_YEAR - START_YEAR) * 12; // 120
export const MONTHS_FUTURE = (FUTURE_END_YEAR - CURRENT_YEAR) * 12; // 228
export const TOTAL_MONTHS = MONTHS_REGRET + MONTHS_FUTURE;
export const AVG_BANK_RATE = 0.02; // v3.0 Update: 2% Bank Rate
export const RACE_DURATION_MS = 30_000;

export const CATEGORIES: { label: string; value: AssetGroup | "ALL" }[] = [
    { label: "전체", value: "ALL" },
    { label: "주식", value: "주식" },
    { label: "ETF", value: "ETF" },
    { label: "가상자산", value: "가상자산" },
    { label: "원자재/기타", value: "원자재/기타" },
];

export const TOP_TICKERS = ["AAPL", "BTC", "NVDA", "삼성전자", "SPY", "GLD", "TSLA"] as const;

// Hash function for PRNG
function hash(value: string): number {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
        h ^= value.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function seededRandom(seed: number): () => number {
    let x = seed || 123456789;
    return () => {
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        return ((x >>> 0) % 1_000_000) / 1_000_000;
    };
}

export function buildAsset(item: any): Asset {
    const ticker = item.Ticker;
    const name = item.Name;
    const jsonCategory = item.Category;
    const oneLiner = item["One-liner"];
    const r = seededRandom(hash(`${ticker}-asset`));

    let group: AssetGroup = "원자재/기타";
    if (jsonCategory === "Stock") group = "주식";
    else if (jsonCategory === "Crypto") group = "가상자산";
    else if (jsonCategory === "ETF") group = "ETF";

    // Replicate previous PRNG bounding box approach by group
    const isCrypto = group === "가상자산";
    const isKrStock = ticker.includes(".KS") || ticker === "삼성전자";

    // Default config
    let sMin = 10, sMax = 500;
    let gMin = 1.0, gMax = 5.0;

    if (isCrypto) {
        sMin = 0.03; sMax = 600;
        gMin = 5.0; gMax = 120.0;
    } else if (group === "ETF") {
        sMin = 50; sMax = 300;
        gMin = 1.5; gMax = 4.0;
    } else if (isKrStock) {
        sMin = 5000; sMax = 100000;
        gMin = 0.8; gMax = 3.5;
    } else if (group === "주식") {
        sMin = 15; sMax = 600;
        gMin = 1.2; gMax = 25.0; // wider range for US stock
    }

    if (ticker === "BTC") { gMin = 80; gMax = 130; }
    if (ticker === "NVDA") { gMin = 100; gMax = 180; }
    if (ticker === "TSLA") { gMin = 15; gMax = 30; }
    if (ticker === "005930.KS" || ticker === "삼성전자") { gMin = 1.5; gMax = 2.2; }

    const price10yUsd = Number((sMin + (sMax - sMin) * r()).toFixed(2));
    const currentUsd = Number((price10yUsd * (gMin + (gMax - gMin) * r())).toFixed(2));

    return { ticker, name, group, price10yUsd, currentUsd, oneLiner };
}

export const ASSETS: Asset[] = assetData.map((item) => buildAsset(item));

export const DEFAULT_ASSET = ASSETS.find((a) => a.ticker === "NVDA" || a.ticker === "AAPL") ?? ASSETS[0];

export function generateTimeSeries(asset: Asset, mode: "REGRET" | "SINGULARITY"): ChartPoint[] {
    const rng = seededRandom(hash(`${asset.ticker}-${mode}-v3`));
    const targetMultiplier = Math.max(asset.currentUsd / asset.price10yUsd, 0.1);

    let volatility = 0.10;
    if (asset.group === "가상자산") volatility = 0.25;
    if (asset.group === "ETF") volatility = 0.05;
    if (asset.group === "원자재/기타") volatility = 0.08;

    if (asset.ticker === "BTC" || asset.ticker === "ETH") volatility = 0.35;
    if (asset.ticker === "NVDA" || asset.ticker === "TSLA") volatility = 0.20;

    // 1. REGRET PHASE (2016-2026) -> Random Walk with known drift
    const shocksRegret = Array.from({ length: MONTHS_REGRET }, () => {
        const u1 = rng();
        const u2 = rng();
        const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * volatility;
    });

    const shockSum = shocksRegret.reduce((acc, curr) => acc + curr, 0);
    const drift = (Math.log(targetMultiplier) - shockSum) / MONTHS_REGRET;

    const points: ChartPoint[] = [
        { month: 0, year: START_YEAR, bank: KRW_INITIAL, asset: KRW_INITIAL, isFuture: false }
    ];

    let runningMax = KRW_INITIAL;
    let inDrawdown = false;

    for (let month = 1; month <= MONTHS_REGRET; month++) {
        const prev = points[month - 1];
        const step = Math.exp(drift + shocksRegret[month - 1]);
        const newAssetBase = Math.max(0, prev.asset * step);

        let isConvictionPoint = false;
        let convictionMessage;

        if (newAssetBase > runningMax) {
            runningMax = newAssetBase;
            inDrawdown = false;
        } else if (!inDrawdown && newAssetBase <= runningMax * 0.85) {
            // Drop of 15% or more detected 
            inDrawdown = true;
            isConvictionPoint = true;
            convictionMessage = month % 2 === 0
                ? "시장의 공포는 위대한 자산을 소유할 수 있는 유일한 기회입니다."
                : "가격을 보지 말고 기업의 펀더멘털을 보십시오. 이 구간이 부의 변곡점입니다.";
        }

        points.push({
            month,
            year: START_YEAR + month / 12,
            bank: KRW_INITIAL * Math.pow(1 + AVG_BANK_RATE / 12, month),
            asset: newAssetBase,
            isFuture: false,
            isConvictionPoint,
            convictionMessage
        });
    }

    // 2. SINGULARITY PHASE (2026-2045) -> Exponential Growth V = V0 * e^(rt) + higher variance
    if (mode === "SINGULARITY") {
        // Determine realistic futuristic growth rate based on asset class
        let annualGrowthRate = 0.05; // default 5%
        if (asset.group === "가상자산") annualGrowthRate = 0.40; // 40%
        else if (asset.ticker === "TSLA" || asset.ticker === "NVDA" || asset.ticker === "MSFT" || asset.ticker === "AAPL" || asset.ticker === "GOOGL") annualGrowthRate = 0.25; // 25% AI boom
        else if (asset.group === "주식") annualGrowthRate = 0.12;
        else if (asset.group === "ETF") annualGrowthRate = 0.08;
        else if (asset.group === "원자재/기타") annualGrowthRate = 0.06;

        const monthlyGrowthRate = annualGrowthRate / 12;
        // Increasing volatility over time in singularity
        const singularityVolatility = volatility * 1.5;

        for (let month = 1; month <= MONTHS_FUTURE; month++) {
            const prev = points[MONTHS_REGRET + month - 1];
            const u1 = rng();
            const u2 = rng();
            const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);

            const exponentialStep = Math.exp(monthlyGrowthRate + (z0 * singularityVolatility));
            const newAssetBase = Math.max(0, prev.asset * exponentialStep);

            let isConvictionPoint = false;
            let convictionMessage;

            if (newAssetBase > runningMax) {
                runningMax = newAssetBase;
                inDrawdown = false;
            } else if (!inDrawdown && newAssetBase <= runningMax * 0.85) {
                inDrawdown = true;
                isConvictionPoint = true;
                convictionMessage = "기술적 특이점을 향한 혁신에는 거대한 변동성이 따릅니다. 인내하십시오.";
            }

            points.push({
                month: MONTHS_REGRET + month,
                year: CURRENT_YEAR + month / 12,
                bank: prev.bank * (1 + AVG_BANK_RATE / 12),
                asset: newAssetBase,
                isFuture: true,
                isConvictionPoint,
                convictionMessage
            });
        }
    }

    return points;
}
