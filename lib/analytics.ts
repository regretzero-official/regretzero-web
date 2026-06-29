"use client";

export type RegretzeroAnalyticsEvent =
  | "begin_checkout"
  | "blocked_custom_date_free"
  | "blocked_crisis_premium"
  | "click_ad_supported_feature"
  | "click_pro_cta"
  | "click_critical_moment"
  | "change_chart_resolution"
  | "change_race_speed"
  | "click_hold_reason_cta"
  | "complete_crisis_detail"
  | "decision_event_choice"
  | "decision_event_shown"
  | "finish_shareholder_mode"
  | "input_custom_date"
  | "open_custom_date"
  | "open_holding_difficulty"
  | "open_pro_date_picker"
  | "open_start_point_picker"
  | "open_crisis_preview"
  | "progress_shareholder_month"
  | "purchase"
  | "save_asset_combo"
  | "save_result"
  | "save_scenario"
  | "select_reflection_response"
  | "select_pro_preset_date"
  | "start_comparison"
  | "start_free_race"
  | "start_race_from_selected_date"
  | "start_shareholder_mode"
  | "jump_to_chart_date"
  | "view_crisis_detail"
  | "view_crisis_moments_list"
  | "view_home"
  | "view_hold_reason_teaser"
  | "view_result";

export type RegretzeroAnalyticsPayload = Record<
  string,
  boolean | number | string | null | undefined
>;

declare global {
  interface Window {
    __rzAnalyticsQueue?: Array<Record<string, unknown>>;
    dataLayer?: Array<Record<string, unknown>>;
    posthog?: {
      capture?: (eventName: string, payload?: Record<string, unknown>) => void;
    };
  }
}

export function trackAnalyticsEvent(
  eventName: RegretzeroAnalyticsEvent,
  payload: RegretzeroAnalyticsPayload = {},
) {
  if (typeof window === "undefined") {
    return;
  }

  const eventPayload = {
    ...payload,
    event: eventName,
    eventName,
    timestamp: new Date().toISOString(),
  };

  window.dataLayer?.push(eventPayload);
  window.posthog?.capture?.(eventName, payload);

  window.__rzAnalyticsQueue = window.__rzAnalyticsQueue ?? [];
  window.__rzAnalyticsQueue.push(eventPayload);

  if (process.env.NODE_ENV !== "production") {
    console.info("[regretzero:event]", eventPayload);
  }
}
