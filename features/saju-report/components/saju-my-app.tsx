"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { SAJU_CHARACTERS } from "@/features/saju-chat/characters";
import type { SajuReportPayload } from "@/features/saju-report/types";
import {
  formatReadingDate,
  readSavedSajuReadings,
  type SavedSajuReading,
} from "@/features/saju-report/my-readings";

import { ReportMarkdown } from "./report-markdown";
import { SAJU_BOTTOM_NAV_PAD, SajuBottomNav } from "./saju-bottom-nav";

function ReportReader({
  report,
  onBack,
}: {
  report: SajuReportPayload;
  onBack: () => void;
}) {
  const character = SAJU_CHARACTERS.find((c) => c.id === report.characterId);
  return (
    <div className={SAJU_BOTTOM_NAV_PAD}>
      <div className="px-5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-[#9A9098] hover:text-[#FF7A99]"
        >
          ← 내 사주 목록
        </button>
        <div className="mt-4 flex items-center gap-3">
          {character ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/15">
              <Image
                alt={character.name}
                className="object-cover object-top"
                fill
                sizes="56px"
                src={character.portraitSrc}
              />
            </div>
          ) : null}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF7A99]">
              SAVED · {report.characterName}
            </div>
            <h1 className="text-xl font-bold tracking-[-0.04em] text-[#F8F4F6]">{report.title}</h1>
          </div>
        </div>
        <div className="mt-3 rounded-[16px] border border-[#E8336D]/30 bg-[#E8336D]/10 px-3 py-2 text-sm leading-6 text-[#FF7A99]">
          <ReportMarkdown body={report.oneLiner} />
        </div>
        <p className="mt-2 text-center text-[11px] text-[#6E666C]">참고용이에요. 절대 결과가 아니에요.</p>
        <nav
          aria-label="리포트 목차"
          className="mt-4 saju-card rounded-[18px] px-4 py-3"
        >
          <div className="text-xs font-bold tracking-[0.04em] text-[#FF7A99]">목차</div>
          <ol className="mt-2 space-y-1.5">
            {report.sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#section-${section.id}`}
                  className="flex gap-2 text-[12px] leading-5 text-[#B8AEB4] hover:text-[#FF7A99]"
                >
                  <span className="shrink-0 font-semibold text-[#6E666C]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="line-clamp-1">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="mt-5 space-y-4 px-5">
        {report.sections.map((section) => (
          <article
            key={section.id}
            id={`section-${section.id}`}
            className="saju-card scroll-mt-24 rounded-[20px] px-4 py-4"
          >
            <h2 className="text-base font-bold tracking-[-0.03em] text-[#F4F0F2]">
              {section.title}
            </h2>
            <div className="mt-3">
              <ReportMarkdown body={section.body} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SajuMyApp() {
  const [readings, setReadings] = useState<SavedSajuReading[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [openReport, setOpenReport] = useState<SajuReportPayload | null>(null);

  useEffect(() => {
    setReadings(readSavedSajuReadings());
    setHydrated(true);
  }, []);

  const refresh = useCallback(() => {
    setReadings(readSavedSajuReadings());
  }, []);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <div className="saju-shell">
      <div className="saju-app mx-auto flex min-h-dvh w-full max-w-[480px] flex-col border-x border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.55)]">
        <header className="saju-header sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/saju" className="text-xs font-semibold text-[#9A9098]">
            ← 허브
          </Link>
          <div className="text-sm font-bold tracking-[-0.03em] text-[#F4F0F2]">내 사주</div>
          <Link
            href="/saju/faq"
            className="text-[11px] font-semibold text-[#FF7A99] underline-offset-2 hover:underline"
          >
            FAQ
          </Link>
        </header>

        <main className="flex-1">
          {openReport ? (
            <ReportReader report={openReport} onBack={() => setOpenReport(null)} />
          ) : (
            <div className={`px-5 pt-6 ${SAJU_BOTTOM_NAV_PAD}`}>
              <p className="text-[0.75rem] font-semibold tracking-[0.08em] text-[#FF7A99]">
                MY READINGS
              </p>
              <h1 className="mt-2 text-[1.65rem] font-black leading-[1.25] tracking-[-0.045em] text-[#F8F4F6]">
                잠금 해제한
                <br />
                리포트
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#9A9098]">
                이 기기에 저장된 전체 리포트예요. 잠금 해제 시 자동으로 남겨 둡니다.
              </p>

              {!hydrated ? (
                <div className="mt-8 text-sm text-[#9A9098]">불러오는 중…</div>
              ) : readings.length === 0 ? (
                <div className="mt-8 saju-card-elevated rounded-[22px] px-5 py-8 text-center">
                  <div className="text-base font-bold text-[#F4F0F2]">아직 저장된 사주가 없어요</div>
                  <p className="mt-2 text-sm leading-6 text-[#9A9098]">
                    허브에서 미리보기를 보고 잠금 해제하면 여기에 쌓여요.
                  </p>
                  <Link
                    href="/saju#products"
                    className="saju-cta mt-5 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold"
                  >
                    사주 고르러 가기
                  </Link>
                </div>
              ) : (
                <ul className="mt-6 space-y-3">
                  {readings.map((r) => {
                    const character = SAJU_CHARACTERS.find((c) => c.id === r.characterId);
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => setOpenReport(r.report)}
                          className="saju-card flex w-full gap-3 rounded-[20px] p-3.5 text-left transition active:scale-[0.99]"
                        >
                          {character ? (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-white/10">
                              <Image
                                alt={r.characterName}
                                className="object-cover object-top"
                                fill
                                sizes="64px"
                                src={character.portraitSrc}
                              />
                            </div>
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-[#FF7A99]">
                                {r.characterName}
                              </span>
                              <span className="text-[10px] text-[#6E666C]">
                                {formatReadingDate(r.unlockedAt)}
                              </span>
                            </div>
                            <div className="mt-0.5 line-clamp-1 text-sm font-bold text-[#F4F0F2]">
                              {r.title}
                            </div>
                            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#9A9098]">
                              {r.oneLiner.replace(/\*\*/g, "")}
                            </p>
                            <span className="mt-2 inline-flex text-[11px] font-semibold text-[#FF7A99]">
                              다시 열기 →
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </main>

        <SajuBottomNav />
      </div>
    </div>
  );
}
