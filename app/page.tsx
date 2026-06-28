import Link from "next/link";

import AssetRaceReplay from "@/src/components/AssetRaceReplay";
import ShareButton from "@/src/components/ShareButton";
import {
  ALL_PERIODS,
  ASSET_UNIVERSE,
  FEATURED_RACES,
  findAsset,
  type PeriodKey,
} from "@/src/lib/assets";
import {
  formatCurrency,
  formatPercent,
  getSimulation,
} from "@/src/lib/simulator";

type SearchValue = string | string[] | undefined;

type HomeQuery = {
  symbol?: string;
  period?: string;
  amount?: string;
};

const DEFAULT_SYMBOL = "NVDA";
const DEFAULT_PERIOD: PeriodKey = "10y";
const DEFAULT_AMOUNT = 10000;

function readString(value: SearchValue) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeQuery(raw: HomeQuery) {
  const symbol = (raw.symbol ?? DEFAULT_SYMBOL).toUpperCase().trim();
  const period = ALL_PERIODS.some(({ key }) => key === raw.period)
    ? (raw.period as PeriodKey)
    : DEFAULT_PERIOD;
  const amount = Number(raw.amount);

  return {
    symbol: symbol || DEFAULT_SYMBOL,
    period,
    amount:
      Number.isFinite(amount) && amount > 0
        ? Math.min(amount, 100000000)
        : DEFAULT_AMOUNT,
  };
}

function getShareUrl({
  symbol,
  period,
  amount,
}: {
  symbol: string;
  period: PeriodKey;
  amount: number;
}) {
  const params = new URLSearchParams({
    symbol,
    period,
    amount: String(Math.round(amount)),
  });

  return `/?${params.toString()}`;
}

function getHeadline(assetName: string, goldGap: number) {
  if (goldGap >= 1.5) {
    return `${assetName}, 금을 배경으로 만들다`;
  }

  if (goldGap >= 0.25) {
    return `${assetName}, 금보다 멀리 달리다`;
  }

  if (goldGap >= -0.1) {
    return `${assetName}, 금과 거의 비슷했다`;
  }

  return `${assetName}, 이번 판은 금이 이겼다`;
}

function getVerdict(assetSymbol: string, assetName: string, goldGap: number) {
  const bySymbol: Record<string, string> = {
    NVDA: "결과는 전설인데, 그 시간을 실제로 버텼을 사람은 많지 않습니다.",
    AAPL: "익숙해서 넘긴 종목이 제일 오래 뒤끝을 남기는 경우가 많습니다.",
    MSFT: "재미없어 보여서 지나쳤다면, 시간이 가장 비싸게 청구한 케이스입니다.",
    SPY: "심심하다고 무시했던 선택이 의외로 가장 현실적인 답이었을 수 있습니다.",
    GLD: "이번에는 금이 기준이 아니라 결과 그 자체였습니다.",
  };

  if (bySymbol[assetSymbol]) {
    return bySymbol[assetSymbol];
  }

  if (goldGap >= 0) {
    return `${assetName} 쪽이 더 멀리 갔지만, 중간에 버티는 일은 별개의 문제였습니다.`;
  }

  return `${assetName}를 안 샀다고 다 손해는 아니었습니다. 이번 구간은 금이 더 나았습니다.`;
}

function getLeadCopy(assetName: string, startDate: string) {
  return `${startDate}에 ${assetName}와 금을 같은 돈으로 출발시킨 결과입니다.`;
}

function getNextIdeas(symbol: string) {
  if (symbol === "NVDA") return ["AAPL", "MSFT", "SPY"];
  if (symbol === "AAPL") return ["NVDA", "SPY", "GLD"];
  if (symbol === "SPY") return ["NVDA", "AAPL", "GLD"];
  return ["NVDA", "AAPL", "SPY"];
}

export default async function Home(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const query = normalizeQuery({
    symbol: readString(searchParams.symbol),
    period: readString(searchParams.period),
    amount: readString(searchParams.amount),
  });

  const selectedAsset = findAsset(query.symbol);
  const shareUrl = getShareUrl(query);

  const [simulation, goldComparison, marketComparison] = selectedAsset
    ? await Promise.all([
        getSimulation({
          symbol: selectedAsset.symbol,
          period: query.period,
          amount: query.amount,
        }),
        getSimulation({
          symbol: selectedAsset.symbol,
          period: query.period,
          amount: query.amount,
          benchmarkSymbol: "GLD",
        }),
        getSimulation({
          symbol: selectedAsset.symbol,
          period: query.period,
          amount: query.amount,
          benchmarkSymbol: "SPY",
        }),
      ])
    : [null, null, null];

  const isSuccess =
    simulation?.status === "success" &&
    goldComparison?.status === "success" &&
    marketComparison?.status === "success";

  const goldGap = isSuccess ? goldComparison.relativePerformance : null;
  const marketGap = isSuccess ? marketComparison.relativePerformance : null;
  const heroAsset = selectedAsset ?? findAsset(DEFAULT_SYMBOL);
  const heroTitle =
    isSuccess && selectedAsset && goldGap !== null
      ? getHeadline(selectedAsset.shortName, goldGap)
      : "금보다 멀리 갔나";
  const heroBody =
    isSuccess && selectedAsset && goldGap !== null
      ? getVerdict(selectedAsset.symbol, selectedAsset.shortName, goldGap)
      : "못 산 종목이 진짜 아쉬운 선택이었는지, 금과 붙이면 생각보다 빨리 드러납니다.";
  const nextIdeas = selectedAsset
    ? getNextIdeas(selectedAsset.symbol)
    : ["AAPL", "MSFT", "SPY"];

  return (
    <main className="page-shell">
      <div className="page-bg" />

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <section className="hero-grid">
          <div className="hero-copy">
            <div className="hero-badge">regretzero</div>
            <p className="hero-kicker">먼저 보고, 그다음 계산합니다.</p>
            <h1 className="hero-title">그때 안 산 대가</h1>
            <p className="hero-subtitle">금이랑 붙이면 바로 보입니다.</p>

            <div className="hero-verdict">
              <p className="hero-verdict-label">지금 보고 있는 판정</p>
              <h2 className="hero-verdict-title">{heroTitle}</h2>
              <p className="hero-verdict-body">{heroBody}</p>
            </div>

            <div className="hero-actions">
              <Link
                href={getShareUrl({
                  symbol: DEFAULT_SYMBOL,
                  period: query.period,
                  amount: query.amount,
                })}
                className="hero-primary"
              >
                대표 레이스 보기
              </Link>
              <a href="#direct-compare" className="hero-secondary">
                내 종목 찾아보기
              </a>
            </div>

            <div className="hero-search-prompt">
              <span>이미 궁금한 종목이 있나요?</span>
              <a href="#direct-compare">전체 자산에서 바로 검색</a>
            </div>
          </div>

          <div className="hero-stage">
            <div className="stage-card">
              <div className="stage-topline">
                <div>
                  <p className="stage-label">대표 레이스</p>
                  <p className="stage-caption">
                    {heroAsset ? `${heroAsset.shortName} vs 금` : "엔비디아 vs 금"}
                  </p>
                </div>
                {isSuccess ? <ShareButton shareUrl={shareUrl} /> : null}
              </div>

              {isSuccess && selectedAsset && goldGap !== null ? (
                <>
                  <div className="stage-intro">
                    <p>{getLeadCopy(selectedAsset.shortName, simulation.startDate)}</p>
                    <p>
                      지금 가치는{" "}
                      <strong>{formatCurrency(simulation.currentValue)}</strong>,
                      금 대비 성과는{" "}
                      <strong>{formatPercent(goldGap)}</strong>입니다.
                    </p>
                  </div>

                  <AssetRaceReplay
                    key={`${query.symbol}-${simulation.startDate}-${query.amount}`}
                    symbol={query.symbol}
                    amount={query.amount}
                    startDate={simulation.startDate}
                    assetLabel={selectedAsset.shortName}
                  />
                </>
              ) : (
                <div className="stage-empty">
                  <div className="stage-empty-card">
                    <p className="stage-label">지금 가장 많이 눌리는 장면</p>
                    <h3>엔비디아 vs 금</h3>
                    <p>
                      뜬구름 설명보다, 한 번 보는 게 빠른 비교입니다. 가장
                      극적인 장면부터 여세요.
                    </p>
                    <Link
                      href={getShareUrl({
                        symbol: DEFAULT_SYMBOL,
                        period: query.period,
                        amount: query.amount,
                      })}
                      className="hero-primary"
                    >
                      바로 보기
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="editorial-strip">
          <div className="strip-header">
            <div>
              <p className="section-kicker">편집 추천</p>
              <h2 className="section-title">처음엔 이 셋이면 충분합니다.</h2>
            </div>
            <div className="strip-actions">
            <p className="section-note">클릭하면 바로 금과 같은 돈으로 붙습니다.</p>
              <a href="#direct-compare" className="section-action">
                전체 자산 보기
              </a>
            </div>
          </div>

          <div className="featured-grid">
            {FEATURED_RACES.map((item) => {
              const asset = findAsset(item.symbol);
              if (!asset) {
                return null;
              }

              return (
                <Link
                  key={item.symbol}
                  href={getShareUrl({
                    symbol: item.symbol,
                    period: query.period,
                    amount: query.amount,
                  })}
                  className="featured-card"
                >
                  <p className="featured-kicker">{item.kicker}</p>
                  <div className="featured-headline">
                    <h3>{asset.shortName}</h3>
                    <span>{item.feeling}</span>
                  </div>
                  <p className="featured-hook">{item.hook}</p>
                  <p className="featured-link">이 레이스 열기</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="content-grid">
          <section className="result-panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">핵심 숫자</p>
                <h2 className="section-title">결론은 짧게 봅니다.</h2>
              </div>
            </div>

            {isSuccess && selectedAsset && goldGap !== null && marketGap !== null ? (
              <div className="metrics-wrap">
                <div className="metrics-grid">
                  <MetricCard
                    label="지금 얼마"
                    value={formatCurrency(simulation.currentValue)}
                    detail={`${formatCurrency(query.amount)}에서 시작`}
                    tone="light"
                  />
                  <MetricCard
                    label="금 대비"
                    value={formatPercent(goldGap)}
                    detail={goldGap >= 0 ? "금보다 더 멀리 갔습니다." : "이번엔 금이 더 강했습니다."}
                    tone={goldGap >= 0 ? "green" : "red"}
                  />
                  <MetricCard
                    label="최대 낙폭"
                    value={formatPercent(simulation.maxDrawdown)}
                    detail="중간에 가장 깊게 흔들린 순간"
                    tone="red"
                  />
                </div>

                <div className="detail-grid">
                  <DataRow label="같이 본 시장 평균" value={formatPercent(marketGap)} />
                  <DataRow label="매수 기준일" value={simulation.startDate} />
                  <DataRow label="매수 가격" value={formatCurrency(simulation.startPrice)} />
                  <DataRow label="현재 가격" value={formatCurrency(simulation.currentPrice)} />
                </div>
              </div>
            ) : (
              <div className="result-empty">
                <h3>
                  {selectedAsset
                    ? "아직 이 레이스는 준비되지 않았습니다."
                    : "이 종목은 아직 무대에 올리지 않았습니다."}
                </h3>
                <p>
                  {selectedAsset && simulation?.status === "error"
                    ? simulation.message
                    : "현재는 미국 대형주와 대표 ETF 중심으로 먼저 보여주고 있습니다. 위 추천 레이스에서 시작하면 가장 자연스럽습니다."}
                </p>
              </div>
            )}
          </section>

          <section id="direct-compare" className="compare-panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">직접 비교</p>
                <h2 className="section-title">내 종목도 바로 붙여봅니다.</h2>
              </div>
            </div>

            <form className="compare-form" action="/" method="get">
              <label className="field">
                <span>종목 또는 ETF</span>
                <input
                  name="symbol"
                  list="asset-universe"
                  defaultValue={query.symbol}
                  placeholder="예: NVDA, AAPL, SPY, GLD"
                />
                <datalist id="asset-universe">
                  {ASSET_UNIVERSE.map((asset) => (
                    <option
                      key={asset.symbol}
                      value={asset.symbol}
                    >{`${asset.symbol} · ${asset.shortName}`}</option>
                  ))}
                </datalist>
              </label>

              <div className="form-split">
                <label className="field">
                  <span>시작 시점</span>
                  <select name="period" defaultValue={query.period}>
                    {ALL_PERIODS.map((period) => (
                      <option key={period.key} value={period.key}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>시작 금액 (USD)</span>
                  <input
                    name="amount"
                    type="number"
                    min="100"
                    step="100"
                    defaultValue={Math.round(query.amount)}
                  />
                </label>
              </div>

              <button type="submit" className="submit-button">
                금과 바로 비교하기
              </button>
            </form>
          </section>
        </section>

        <section className="next-strip">
            <div className="strip-header">
              <div>
                <p className="section-kicker">다음 클릭</p>
                <h2 className="section-title">이제 다른 판도 봐야 합니다.</h2>
              </div>
          </div>

          <div className="next-grid">
            {nextIdeas.map((symbol) => {
              const asset = findAsset(symbol);
              if (!asset) {
                return null;
              }

              return (
                <Link
                  key={symbol}
                  href={getShareUrl({
                    symbol,
                    period: query.period,
                    amount: query.amount,
                  })}
                  className="next-card"
                >
                  <div className="next-card-top">
                    <h3>{asset.shortName}</h3>
                    <span>{asset.symbol}</span>
                  </div>
                  <p>{asset.description}</p>
                  <strong>이 자산도 금과 붙여보기</strong>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <nav className="bottom-quick-nav" aria-label="빠른 이동">
        <a href="#" className="bottom-quick-link">
          <span>홈</span>
        </a>
        <a href="#direct-compare" className="bottom-quick-link is-primary">
          <span>자산찾기</span>
        </a>
        <a href="#direct-compare" className="bottom-quick-link">
          <span>전체보기</span>
        </a>
      </nav>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "light" | "green" | "red";
}) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </article>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-row">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
