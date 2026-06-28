"use client";

import Image from "next/image";

type Panel = {
  title: string;
  mood: string;
  bubble: string;
  accent: "neutral" | "blue" | "gold";
  scene: "past" | "future" | "now";
  subline: string;
};

type Props = {
  panels?: readonly Panel[];
};

export default function LandingComicPanels(_: Props) {
  return (
    <section className="space-y-3 text-left">
      <div className="overflow-hidden rounded-[28px] border border-black/8 bg-white/92 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-4">
        <div className="overflow-hidden rounded-[22px] border border-black/6 bg-[#f7f2e8]">
          <Image
            src="/landing-webtoon.png"
            alt="RegretZero 소개 웹툰"
            width={1200}
            height={1800}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
