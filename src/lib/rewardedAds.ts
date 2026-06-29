declare global {
  interface Window {
    googletag?: any;
  }
}

type RewardedResult =
  | { status: "granted"; mode: "live" | "test" }
  | { status: "closed" }
  | { status: "unavailable" }
  | { status: "error"; message?: string }
  | { status: "demo" };

const GPT_SRC = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
const DEFAULT_TEST_AD_UNIT = "/21775744923/example/rewarded";

let scriptPromise: Promise<void> | null = null;
let servicesEnabled = false;

function loadGptScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window unavailable"));
  }

  if (window.googletag?.apiReady) {
    return Promise.resolve();
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GPT_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("gpt load failed")), { once: true });
      return;
    }

    window.googletag = window.googletag || { cmd: [] };
    const script = document.createElement("script");
    script.async = true;
    script.src = GPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gpt load failed"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function showRewardedAd(adUnitPath?: string): Promise<RewardedResult> {
  if (typeof window === "undefined") {
    return { status: "unavailable" };
  }

  const effectiveAdUnit = adUnitPath || process.env.NEXT_PUBLIC_GAM_REWARDED_AD_UNIT || DEFAULT_TEST_AD_UNIT;
  const isTestMode = !adUnitPath && !process.env.NEXT_PUBLIC_GAM_REWARDED_AD_UNIT;

  try {
    await loadGptScript();
  } catch {
    if (isTestMode) {
      await wait(1500);
      return { status: "demo" };
    }
    return { status: "error", message: "광고 스크립트를 불러오지 못했습니다." };
  }

  const googletag = window.googletag;
  if (!googletag) {
    if (isTestMode) {
      await wait(1500);
      return { status: "demo" };
    }
    return { status: "unavailable" };
  }

  return new Promise<RewardedResult>((resolve) => {
    googletag.cmd.push(() => {
      const pubads = googletag.pubads();
      const slot = googletag.defineOutOfPageSlot(
        effectiveAdUnit,
        googletag.enums?.OutOfPageFormat?.REWARDED ?? "rewarded",
      );

      if (!slot) {
        if (isTestMode) {
          wait(1500).then(() => resolve({ status: "demo" }));
        } else {
          resolve({ status: "unavailable" });
        }
        return;
      }

      let granted = false;
      let settled = false;

      const settle = (result: RewardedResult) => {
        if (settled) return;
        settled = true;
        try {
          pubads.removeEventListener("rewardedSlotReady", onReady);
          pubads.removeEventListener("rewardedSlotGranted", onGranted);
          pubads.removeEventListener("rewardedSlotClosed", onClosed);
          pubads.removeEventListener("slotRenderEnded", onRenderEnded);
          googletag.destroySlots([slot]);
        } catch {}
        resolve(result);
      };

      const onReady = (event: any) => {
        if (event.slot === slot) {
          try {
            event.makeRewardedVisible();
          } catch {
            settle(isTestMode ? { status: "demo" } : { status: "error", message: "광고 표시 중 오류가 발생했습니다." });
          }
        }
      };

      const onGranted = (event: any) => {
        if (event.slot === slot) {
          granted = true;
        }
      };

      const onClosed = (event: any) => {
        if (event.slot === slot) {
          settle(granted ? { status: "granted", mode: isTestMode ? "test" : "live" } : { status: "closed" });
        }
      };

      const onRenderEnded = (event: any) => {
        if (event.slot === slot && event.isEmpty) {
          settle(isTestMode ? { status: "demo" } : { status: "unavailable" });
        }
      };

      pubads.addEventListener("rewardedSlotReady", onReady);
      pubads.addEventListener("rewardedSlotGranted", onGranted);
      pubads.addEventListener("rewardedSlotClosed", onClosed);
      pubads.addEventListener("slotRenderEnded", onRenderEnded);

      slot.addService(pubads);

      if (!servicesEnabled) {
        googletag.enableServices();
        servicesEnabled = true;
      }

      googletag.display(slot);

      window.setTimeout(() => {
        if (!settled) {
          settle(isTestMode ? { status: "demo" } : { status: "unavailable" });
        }
      }, 15000);
    });
  });
}

