"use client";

import { useState } from "react";

type Props = {
  shareUrl: string;
};

export default function ShareButton({ shareUrl }: Props) {
  const [label, setLabel] = useState("링크 복사");

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          const target = new URL(shareUrl, window.location.origin).toString();

          if (navigator.share) {
            await navigator.share({ url: target });
            setLabel("공유 완료");
          } else {
            await navigator.clipboard.writeText(target);
            setLabel("복사 완료");
          }
        } catch {
          setLabel("다시 시도");
        }

        window.setTimeout(() => {
          setLabel("링크 복사");
        }, 1800);
      }}
      className="rounded-full border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12"
    >
      {label}
    </button>
  );
}
