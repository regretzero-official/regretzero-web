"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, ChevronDown, ChevronUp, History, Sparkles, Target } from "lucide-react";
import type {
  BehaviorScenario,
  BuyCapacity,
  HoldCoachAnalysis,
  HoldCoachRules,
  RiskProfile,
  RuleSuggestionResult,
} from "../lib/holdCoach";

type Props = {
  assetName: string;
  assetCurrency: "KRW" | "USD";
  compactHeader?: boolean;
  currentPriceText: string;
  avgPriceLabel: string;
  avgPriceHelp: string;
  fxRateText: string | null;
  holdingsQtyInput: string;
  avgPriceInput: string;
  addBuyInput: string;
  rules: HoldCoachRules;
  analysis: HoldCoachAnalysis | null;
  aiSuggestion: RuleSuggestionResult | null;
  aiRiskProfile: RiskProfile;
  aiBuyCapacity: BuyCapacity;
  onHoldingsQtyChange: (value: string) => void;
  onAvgPriceChange: (value: string) => void;
  onAddBuyChange: (value: string) => void;
  onRuleChange: (key: keyof HoldCoachRules, value: string) => void;
  onOpenAiSuggestion: () => void;
  onApplyAiSuggestion: () => void;
  onRiskProfileChange: (value: RiskProfile) => void;
  onBuyCapacityChange: (value: BuyCapacity) => void;
  formatCompactKrw: (value: number) => string;
  formatAssetPrice: (value: number) => string;
};

function getScenarioTitle(action: BehaviorScenario["action"]) {
  if (action === "매도") return "지금 팔면";
  if (action === "보유") return "그대로 버티면";
  return "추가 매수하면";
}

function getScenarioBadge(action: BehaviorScenario["action"]) {
  if (action === "매도") return "현금 대기";
  if (action === "보유") return "보유 유지";
  return "수량 확대";
}

function formatRecoveryText(recovery: BehaviorScenario["recoveryMonths"]) {
  if (!recovery) return "회복 사례 부족";
  return `${Math.round(recovery.low)}~${Math.round(recovery.high)}개월`;
}

function formatValueRange(
  value: BehaviorScenario["valueAt6m"],
  formatCompactKrw: (value: number) => string,
) {
  return `${formatCompactKrw(value.low)} ~ ${formatCompactKrw(value.high)}`;
}

function pickScenarioLead(scenarios: BehaviorScenario[]) {
  if (!scenarios.length) return null;
  const sell = scenarios.find((scenario) => scenario.action === "매도");
  const hold = scenarios.find((scenario) => scenario.action === "보유");
  const buy = scenarios.find((scenario) => scenario.action === "분할매수");
  if (!sell || !hold || !buy) return null;

  if (buy.valueAt12m.median >= hold.valueAt12m.median && buy.valueAt12m.median >= sell.valueAt12m.median) {
    return {
      action: buy.action,
      title: "오늘의 추천 행동: 분할매수",
      reason: "지금은 평단을 낮추는 효과가 커서, 과거 비슷한 구간에서도 분할매수가 더 유리했던 경우가 많았습니다.",
    };
  }

  if (hold.valueAt12m.median >= sell.valueAt12m.median) {
    return {
      action: hold.action,
      title: "오늘의 추천 행동: 보유",
      reason: "지금은 추가 자금을 급하게 넣기보다 기존 규칙을 지키며 버티는 쪽이 더 안정적인 구간으로 읽힙니다.",
    };
  }

  return {
    action: sell.action,
    title: "오늘의 추천 행동: 관찰",
    reason: "현재는 현금 비중을 남기고 흐름을 지켜보는 편이 더 나았던 구간과 비슷합니다.",
  };
}

function SegmentButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-full px-4 text-sm font-black transition ${
        active ? "bg-[#163b74] text-white shadow-[0_10px_24px_rgba(22,59,116,0.25)]" : "bg-white text-[#5d574a] hover:bg-[#f3efe7]"
      }`}
    >
      {label}
    </button>
  );
}

export default function HoldCoachPanel({
  assetName,
  compactHeader,
  currentPriceText,
  avgPriceLabel,
  avgPriceHelp,
  fxRateText,
  holdingsQtyInput,
  avgPriceInput,
  addBuyInput,
  rules,
  analysis,
  aiSuggestion,
  aiRiskProfile,
  aiBuyCapacity,
  onHoldingsQtyChange,
  onAvgPriceChange,
  onAddBuyChange,
  onRuleChange,
  onOpenAiSuggestion,
  onApplyAiSuggestion,
  onRiskProfileChange,
  onBuyCapacityChange,
  formatCompactKrw,
  formatAssetPrice,
}: Props) {
  const [isConclusionOpen, setIsConclusionOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showScenarioDetails, setShowScenarioDetails] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    setShowScenarioDetails(false);
  }, [analysis?.scenarios.length]);

  const scenarioLead = useMemo(() => pickScenarioLead(analysis?.scenarios ?? []), [analysis?.scenarios]);
  const conclusionLabel = analysis?.insights?.monthlyCheckLabel ?? "지금 상태를 계산 중입니다";
  const conclusionBody = analysis?.insights?.monthlyCheckBody ?? "입력한 수량과 평단을 기준으로 오늘의 행동을 정리합니다.";
  const historyCount = analysis?.scenarios[0]?.matchedSampleCount ?? 0;

  return (
    <section className="space-y-4 text-left text-[#111111]">
      <div className="rounded-[26px] border border-black/8 bg-[#fcfaf5] p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8a7a56]">장기투자 결정 코치</p>
            {!compactHeader ? <h3 className="mt-2 text-[1.85rem] font-black tracking-[-0.04em]">{assetName} 투자 플랜</h3> : null}
            <p className="mt-2 text-sm leading-6 text-[#5d574a]">수량, 평단, 추가 자금만 넣으면 오늘 판단부터 다음 계획까지 한 번에 정리합니다.</p>
            {fxRateText ? <p className="mt-2 text-xs font-bold text-[#7a705c]">{fxRateText}</p> : null}
          </div>
          <div className="rounded-full border border-black/8 bg-white px-3 py-2 text-xs font-black text-[#163b74]">현재가 {currentPriceText}</div>
        </div>
      </div>

      <div className="rounded-[26px] border border-black/8 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2 text-[#111111]">
          <Calculator size={18} strokeWidth={2.4} />
          <h4 className="text-base font-black">1단계 입력</h4>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-black text-[#5d574a]">보유 수량</span>
            <input
              value={holdingsQtyInput}
              onChange={(event) => onHoldingsQtyChange(event.target.value)}
              inputMode="decimal"
              className="h-12 w-full rounded-[18px] border border-black/10 bg-[#fcfaf5] px-4 text-base font-black outline-none transition focus:border-[#163b74]/40"
              placeholder="10"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-black text-[#5d574a]">{avgPriceLabel}</span>
            <input
              value={avgPriceInput}
              onChange={(event) => onAvgPriceChange(event.target.value)}
              inputMode="decimal"
              className="h-12 w-full rounded-[18px] border border-black/10 bg-[#fcfaf5] px-4 text-base font-black outline-none transition focus:border-[#163b74]/40"
              placeholder="0"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-black text-[#5d574a]">추가 매수 가능 금액 (KRW)</span>
            <input
              value={addBuyInput}
              onChange={(event) => onAddBuyChange(event.target.value)}
              inputMode="numeric"
              className="h-12 w-full rounded-[18px] border border-black/10 bg-[#fcfaf5] px-4 text-base font-black outline-none transition focus:border-[#163b74]/40"
              placeholder="3,000,000"
            />
          </label>
        </div>
        <p className="mt-3 text-xs leading-6 text-[#7a705c]">{avgPriceHelp}</p>
      </div>

      <div className="rounded-[26px] border border-black/8 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2 text-[#111111]">
          <Target size={18} strokeWidth={2.4} />
          <h4 className="text-base font-black">2단계 즉시 계산</h4>
        </div>
        <p className="mt-2 text-xs leading-6 text-[#7a705c]">이 값은 입력한 수량, 평균단가, 추가 매수 금액만으로 바로 계산됩니다.</p>

        <div className="mt-4 rounded-[22px] border border-[#163b74]/10 bg-[linear-gradient(180deg,#fffdf8_0%,#f4efe4_100%)] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a7a56]">추가 매수 후 평균단가</p>
          <p className="mt-3 text-[2.05rem] font-black tracking-[-0.05em] text-[#111111]">
            {analysis ? formatAssetPrice(analysis.core.nextAvgPrice) : "-"}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-black/8 bg-[#fcfaf5] p-4">
            <p className="text-xs font-black text-[#8a7a56]">총 보유 수량</p>
            <p className="mt-2 text-xl font-black tracking-[-0.04em]">{analysis ? analysis.core.nextQty.toFixed(4) : "-"}</p>
          </div>
          <div className="rounded-[18px] border border-black/8 bg-[#fcfaf5] p-4">
            <p className="text-xs font-black text-[#8a7a56]">현재 보유 평가금액</p>
            <p className="mt-2 text-xl font-black tracking-[-0.04em]">{analysis ? formatCompactKrw(analysis.core.currentHoldingValue) : "-"}</p>
          </div>
          <div className="rounded-[18px] border border-black/8 bg-[#fcfaf5] p-4">
            <p className="text-xs font-black text-[#8a7a56]">총 투입 가능 금액</p>
            <p className="mt-2 text-xl font-black tracking-[-0.04em]">{analysis ? formatCompactKrw(analysis.core.totalDeployableKrw) : "-"}</p>
          </div>
          <div className="rounded-[18px] border border-black/8 bg-[#fcfaf5] p-4">
            <p className="text-xs font-black text-[#8a7a56]">평균단가 대비 위치</p>
            <p className="mt-2 text-xl font-black tracking-[-0.04em]">{analysis ? `${analysis.core.currentVsAvgPct.toFixed(1)}%` : "-"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-black/8 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
        <button
          type="button"
          onClick={() => setIsConclusionOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a7a56]">3단계 오늘의 결론</p>
            <p className="mt-2 text-lg font-black tracking-[-0.03em] text-[#111111]">{conclusionLabel}</p>
          </div>
          {isConclusionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isConclusionOpen ? (
          <div className="border-t border-black/6 px-5 pb-5 pt-4">
            <div className="rounded-[20px] border border-[#163b74]/10 bg-[#eef4ff] p-4">
              <p className="text-base font-black text-[#163b74]">{conclusionLabel}</p>
              <p className="mt-2 text-sm leading-7 text-[#364152]">{conclusionBody}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] bg-white/80 p-3">
                  <p className="text-xs font-black text-[#7a705c]">현재 낙폭</p>
                  <p className="mt-1 text-lg font-black text-[#111111]">{analysis ? `${analysis.core.currentDrawdownPct.toFixed(1)}%` : "-"}</p>
                </div>
                <div className="rounded-[16px] bg-white/80 p-3">
                  <p className="text-xs font-black text-[#7a705c]">규칙 상태</p>
                  <p className="mt-1 text-sm font-black text-[#111111]">{analysis?.insights?.ruleStatus ?? "데이터를 계산 중입니다."}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-black/8 bg-[#fcfaf5] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[#111111]">
                  <Sparkles size={16} strokeWidth={2.4} />
                  <p className="text-sm font-black">내 규칙 초안 받기</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiPanel((current) => !current)}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-black text-[#5d574a]"
                >
                  {showAiPanel ? "접기" : "열기"}
                </button>
              </div>

              {showAiPanel ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-black text-[#7a705c]">성향</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <SegmentButton active={aiRiskProfile === "conservative"} label="보수형" onClick={() => onRiskProfileChange("conservative")} />
                        <SegmentButton active={aiRiskProfile === "balanced"} label="균형형" onClick={() => onRiskProfileChange("balanced")} />
                        <SegmentButton active={aiRiskProfile === "aggressive"} label="공격형" onClick={() => onRiskProfileChange("aggressive")} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#7a705c]">추가 매수 여력</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <SegmentButton active={aiBuyCapacity === "low"} label="낮음" onClick={() => onBuyCapacityChange("low")} />
                        <SegmentButton active={aiBuyCapacity === "medium"} label="보통" onClick={() => onBuyCapacityChange("medium")} />
                        <SegmentButton active={aiBuyCapacity === "high"} label="높음" onClick={() => onBuyCapacityChange("high")} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenAiSuggestion}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#163b74] px-5 text-sm font-black text-white transition hover:bg-[#0f2a53]"
                  >
                    내 규칙 초안 받기
                  </button>

                  {aiSuggestion ? (
                    <div className="rounded-[18px] border border-[#163b74]/10 bg-white p-4">
                      <p className="text-base font-black text-[#111111]">{aiSuggestion.title}</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5d574a]">
                        {aiSuggestion.reasons.map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                      <div className="mt-4 grid gap-2 sm:grid-cols-4">
                        <div className="rounded-[16px] bg-[#fcfaf5] p-3 text-center text-sm font-black text-[#111111]">점검 {Math.abs(aiSuggestion.rules.reviewPct)}%</div>
                        <div className="rounded-[16px] bg-[#fcfaf5] p-3 text-center text-sm font-black text-[#111111]">1차 {Math.abs(aiSuggestion.rules.buy1Pct)}%</div>
                        <div className="rounded-[16px] bg-[#fcfaf5] p-3 text-center text-sm font-black text-[#111111]">2차 {Math.abs(aiSuggestion.rules.buy2Pct)}%</div>
                        <div className="rounded-[16px] bg-[#fcfaf5] p-3 text-center text-sm font-black text-[#111111]">최종 {Math.abs(aiSuggestion.rules.finalPct)}%</div>
                      </div>
                      <button
                        type="button"
                        onClick={onApplyAiSuggestion}
                        className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-[#163b74]/16 bg-[#eef4ff] px-5 text-sm font-black text-[#163b74] transition hover:bg-[#deebff]"
                      >
                        이 초안을 내 규칙에 적용하기
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <label className="space-y-2">
                  <span className="text-xs font-black text-[#7a705c]">점검</span>
                  <input value={Math.abs(rules.reviewPct)} onChange={(event) => onRuleChange("reviewPct", event.target.value)} className="h-11 w-full rounded-[16px] border border-black/10 bg-white px-3 text-sm font-black outline-none" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black text-[#7a705c]">1차</span>
                  <input value={Math.abs(rules.buy1Pct)} onChange={(event) => onRuleChange("buy1Pct", event.target.value)} className="h-11 w-full rounded-[16px] border border-black/10 bg-white px-3 text-sm font-black outline-none" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black text-[#7a705c]">2차</span>
                  <input value={Math.abs(rules.buy2Pct)} onChange={(event) => onRuleChange("buy2Pct", event.target.value)} className="h-11 w-full rounded-[16px] border border-black/10 bg-white px-3 text-sm font-black outline-none" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black text-[#7a705c]">최종</span>
                  <input value={Math.abs(rules.finalPct)} onChange={(event) => onRuleChange("finalPct", event.target.value)} className="h-11 w-full rounded-[16px] border border-black/10 bg-white px-3 text-sm font-black outline-none" />
                </label>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[26px] border border-black/8 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
        <button
          type="button"
          onClick={() => setIsHistoryOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <History size={18} strokeWidth={2.4} />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a7a56]">4단계 과거 참고</p>
              <p className="mt-2 text-lg font-black tracking-[-0.03em] text-[#111111]">지금 팔까, 버틸까, 더 살까</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-[#7a705c]">과거 유사 구간 {historyCount}개</p>
            {isHistoryOpen ? <ChevronUp size={18} className="ml-auto mt-2" /> : <ChevronDown size={18} className="ml-auto mt-2" />}
          </div>
        </button>

        {isHistoryOpen ? (
          <div className="border-t border-black/6 px-5 pb-5 pt-4">
            <p className="text-sm leading-7 text-[#5d574a]">미래를 맞히는 기능이 아니라, 지금과 비슷한 하락 구간이 과거에 어떻게 흘렀는지 참고하는 도구입니다.</p>

            {scenarioLead ? (
              <div className="mt-4 rounded-[20px] border border-[#163b74]/10 bg-[#eef4ff] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#163b74]">오늘의 추천 행동</p>
                <p className="mt-2 text-lg font-black text-[#111111]">{scenarioLead.title}</p>
                <p className="mt-2 text-sm leading-7 text-[#364152]">{scenarioLead.reason}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] border border-black/8 bg-[#fcfaf5] p-4 text-sm font-bold text-[#5d574a]">
                유사한 과거 구간이 충분하지 않아 행동 비교는 간단 참고용으로만 보여드립니다.
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowScenarioDetails((current) => !current)}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-black text-[#163b74] transition hover:border-[#163b74]/30 hover:bg-[#eef4ff]"
            >
              {showScenarioDetails ? "세 선택지 접기" : "세 선택지 자세히 비교"}
            </button>

            {showScenarioDetails ? (
              <div className="mt-4 space-y-3">
                {(analysis?.scenarios ?? []).map((scenario) => (
                  <div key={scenario.action} className="rounded-[20px] border border-black/8 bg-[#fcfaf5] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black tracking-[-0.03em] text-[#111111]">{getScenarioTitle(scenario.action)}</p>
                        <p className="mt-1 text-sm font-bold text-[#6b6457]">{scenario.subtitle}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#163b74]">{getScenarioBadge(scenario.action)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#5d574a]">{scenario.decisionSummary}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[16px] bg-white p-3">
                        <p className="text-xs font-black text-[#8a7a56]">6개월 후 범위</p>
                        <p className="mt-1 text-sm font-black text-[#111111]">{formatValueRange(scenario.valueAt6m, formatCompactKrw)}</p>
                      </div>
                      <div className="rounded-[16px] bg-white p-3">
                        <p className="text-xs font-black text-[#8a7a56]">1년 후 중앙값</p>
                        <p className="mt-1 text-sm font-black text-[#111111]">{formatCompactKrw(scenario.valueAt12m.median)}</p>
                      </div>
                      <div className="rounded-[16px] bg-white p-3">
                        <p className="text-xs font-black text-[#8a7a56]">과거 회복 기간</p>
                        <p className="mt-1 text-sm font-black text-[#111111]">{formatRecoveryText(scenario.recoveryMonths)}</p>
                      </div>
                      <div className="rounded-[16px] bg-white p-3">
                        <p className="text-xs font-black text-[#8a7a56]">대기 현금</p>
                        <p className="mt-1 text-sm font-black text-[#111111]">{formatCompactKrw(scenario.cashReserveKrw)}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[16px] bg-white p-3">
                        <p className="text-xs font-black text-[#8a7a56]">평균단가</p>
                        <p className="mt-1 text-sm font-black text-[#111111]">{scenario.nextAvgPrice > 0 ? formatAssetPrice(scenario.nextAvgPrice) : "현금 보유"}</p>
                      </div>
                      <div className="rounded-[16px] bg-white p-3">
                        <p className="text-xs font-black text-[#8a7a56]">총 보유 수량</p>
                        <p className="mt-1 text-sm font-black text-[#111111]">{scenario.nextQty.toFixed(4)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
