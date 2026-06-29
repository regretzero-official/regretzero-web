"use client";

import { useEffect } from "react";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  className?: string;
  label?: string;
  placement: string;
  slot?: string;
}

export function AdSlot({
  className = "",
  label = "광고",
  placement,
  slot,
}: AdSlotProps) {
  const isConfigured = Boolean(ADSENSE_CLIENT_ID && slot);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // Ad blockers or delayed AdSense loading should not break the product flow.
    }
  }, [isConfigured]);

  if (!isConfigured) {
    if (process.env.NODE_ENV === "production") {
      return null;
    }

    return (
      <aside
        aria-label={`${label} 준비 영역`}
        className={`rounded-[24px] border border-dashed border-[var(--rz-border)] bg-white/[0.025] px-4 py-5 text-center text-xs leading-5 text-[var(--rz-text-muted)] ${className}`}
        data-ad-placement={placement}
      >
        광고 영역 준비 중
      </aside>
    );
  }

  return (
    <aside
      aria-label={label}
      className={`overflow-hidden rounded-[24px] border border-[var(--rz-border)] bg-white/[0.025] px-2 py-3 ${className}`}
      data-ad-placement={placement}
    >
      <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--rz-text-muted)]">
        AD
      </div>
      <ins
        className="adsbygoogle block"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-format="auto"
        data-ad-slot={slot}
        data-full-width-responsive="true"
        style={{ display: "block" }}
      />
    </aside>
  );
}
