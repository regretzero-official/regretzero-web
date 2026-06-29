import type { ReactNode } from "react";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { AppMenu } from "@/components/app-menu";

interface InfoSection {
  body: string;
  eyebrow: string;
  id?: string;
  title: string;
}

interface InfoSummaryCard {
  body: string;
  title: string;
}

interface InfoStep {
  body: string;
  title: string;
}

interface InfoGlossaryItem {
  description: string;
  example?: string;
  id?: string;
  term: string;
}

interface InfoFaqItem {
  answer: string;
  question: string;
}

interface InfoNotice {
  body: string;
  title: string;
}

interface InfoClosingCta {
  body: string;
  href: string;
  label: string;
  points?: string[];
  secondaryHref?: string;
  secondaryLabel?: string;
  title: string;
}

interface InfoPageProps {
  closingCta?: InfoClosingCta;
  description: string;
  eyebrow: string;
  faq?: InfoFaqItem[];
  footerExtra?: ReactNode;
  glossary?: InfoGlossaryItem[];
  heroCtaLabel?: string;
  notice?: InfoNotice;
  sectionEyebrow?: string;
  sectionSubtitle?: string;
  sectionTitle?: string;
  sections?: InfoSection[];
  sideSummary?: string[];
  summaryCards?: InfoSummaryCard[];
  steps?: InfoStep[];
  title: string;
}

export function InfoPage({
  closingCta,
  description,
  eyebrow,
  faq = [],
  footerExtra,
  glossary = [],
  heroCtaLabel = "비교 시작하기",
  notice,
  sectionEyebrow = "READ THE RESULT",
  sectionSubtitle = "마지막 숫자만 보지 않고, 그 숫자까지 지나온 시간을 함께 읽습니다.",
  sectionTitle = "결과를 읽는 법",
  sections = [],
  sideSummary = [],
  summaryCards = [],
  steps = [],
  title,
}: InfoPageProps) {
  return (
    <main className="rz-light-app min-h-dvh bg-transparent px-5 py-5 text-slate-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <AppMenu variant="light" />
            <Link
              className="text-base font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]"
              href="/"
            >
              Regretzero
            </Link>
          </div>
          <Link
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--rz-border)] bg-white/80 px-4 text-sm font-semibold text-[var(--rz-text-primary)] shadow-[var(--rz-shadow-card)] transition hover:bg-white"
            href="/"
          >
            비교 시작
          </Link>
        </header>

        <section className="grid flex-1 gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:py-12">
          <div className="min-w-0 space-y-5">
            <section className="surface-card overflow-hidden rounded-[34px] px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rz-text-muted)]">
                {eyebrow}
              </div>
              <h1 className="mt-4 max-w-[14ch] whitespace-pre-line text-[2.85rem] font-semibold leading-[0.98] tracking-[-0.075em] text-[var(--rz-text-primary)] sm:text-[4.4rem]">
                {title}
              </h1>
              <p className="mt-5 max-w-[40rem] whitespace-pre-line text-base leading-8 text-[var(--rz-text-secondary)] sm:text-lg">
                {description}
              </p>
              <Link
                className="btn-accent mt-8 inline-flex min-h-14 items-center justify-center rounded-full px-6 text-base font-semibold tracking-[-0.02em] transition"
                href="/"
              >
                {heroCtaLabel}
              </Link>
            </section>

            {summaryCards.length > 0 ? (
              <section className="grid gap-3 sm:grid-cols-3">
                {summaryCards.map((card) => (
                  <article
                    className="rounded-[26px] border border-[var(--rz-border)] bg-white/76 px-5 py-5 shadow-[var(--rz-shadow-card)]"
                    key={card.title}
                  >
                    <h2 className="text-base font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
                      {card.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--rz-text-secondary)]">
                      {card.body}
                    </p>
                  </article>
                ))}
              </section>
            ) : null}

            {notice ? (
              <section className="rounded-[28px] border border-[var(--rz-border)] bg-white/70 px-5 py-5 shadow-[var(--rz-shadow-card)] sm:px-6">
                <h2 className="text-lg font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
                  {notice.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--rz-text-secondary)]">
                  {notice.body}
                </p>
              </section>
            ) : null}

            <AdSlot
              className="min-h-[96px]"
              label="안내 페이지 광고"
              placement="info-inline"
              slot={process.env.NEXT_PUBLIC_ADSENSE_INFO_SLOT}
            />

            {steps.length > 0 ? (
              <InfoBlock
                eyebrow="HOW TO USE"
                subtitle="처음이라면 이 순서대로 시작해보세요."
                title="쓰는 법"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {steps.map((step, index) => (
                    <article
                      className="rounded-[24px] border border-[var(--rz-border)] bg-white/80 px-5 py-5"
                      key={step.title}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--rz-accent-soft)] text-sm font-bold text-[var(--rz-accent)]">
                        {index + 1}
                      </div>
                      <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--rz-text-secondary)]">
                        {step.body}
                      </p>
                    </article>
                  ))}
                </div>
              </InfoBlock>
            ) : null}

            {sections.length > 0 ? (
              <InfoBlock
                eyebrow={sectionEyebrow}
                subtitle={sectionSubtitle}
                title={sectionTitle}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {sections.map((section) => (
                    <article
                      id={section.id}
                      className="rounded-[24px] border border-[var(--rz-border)] bg-white/80 px-5 py-5"
                      key={`${section.eyebrow}-${section.title}`}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--rz-text-muted)]">
                        {section.eyebrow}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
                        {section.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--rz-text-secondary)]">
                        {section.body}
                      </p>
                    </article>
                  ))}
                </div>
              </InfoBlock>
            ) : null}

            {glossary.length > 0 ? (
              <InfoBlock
                eyebrow="BEGINNER WORDS"
                subtitle="처음 보는 용어는 필요한 만큼만 쉽게 풀었습니다."
                title="초보자를 위한 용어"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {glossary.map((item) => (
                    <article
                      className="scroll-mt-24 rounded-[24px] border border-[var(--rz-border)] bg-white/80 px-5 py-5"
                      id={item.id}
                      key={item.term}
                    >
                      <h3 className="text-lg font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
                        {item.term}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--rz-text-secondary)]">
                        {item.description}
                      </p>
                      {item.example ? (
                        <p className="mt-3 rounded-2xl bg-[var(--rz-accent-soft)] px-4 py-3 text-sm leading-6 text-[var(--rz-accent)]">
                          {item.example}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </InfoBlock>
            ) : null}

            {faq.length > 0 ? (
              <InfoBlock
                eyebrow="FAQ"
                subtitle="헷갈리기 쉬운 질문부터 정리했습니다."
                title="자주 묻는 질문"
              >
                <div className="grid gap-3">
                  {faq.map((item) => (
                    <article
                      className="rounded-[24px] border border-[var(--rz-border)] bg-white/80 px-5 py-5"
                      key={item.question}
                    >
                      <h3 className="text-lg font-semibold tracking-[-0.04em] text-[var(--rz-text-primary)]">
                        {item.question}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--rz-text-secondary)]">
                        {item.answer}
                      </p>
                    </article>
                  ))}
                </div>
              </InfoBlock>
            ) : null}

            {closingCta ? (
              <section className="overflow-hidden rounded-[32px] bg-[#0f172a] px-6 py-7 text-[#ffffff] shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:px-8">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
                  <div>
                    <div className="inline-flex rounded-full border border-white/12 bg-white/[0.1] px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-100">
                      다음 단계
                    </div>
                    <h2 className="mt-4 whitespace-pre-line text-2xl font-semibold tracking-[-0.06em] text-[#ffffff] sm:text-3xl">
                      {closingCta.title}
                    </h2>
                    <p className="mt-3 max-w-[38rem] text-sm leading-7 text-[#ffffff]">
                      {closingCta.body}
                    </p>
                    {closingCta.points && closingCta.points.length > 0 ? (
                      <div className="mt-5 grid gap-2 sm:grid-cols-3">
                        {closingCta.points.map((point) => (
                          <div
                            className="rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-3 text-xs font-semibold leading-5 text-slate-200"
                            key={point}
                          >
                            {point}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Link
                      className="inline-flex min-h-[3.25rem] items-center justify-center rounded-xl bg-[#ffffff] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_44px_rgba(0,0,0,0.18)] transition hover:bg-slate-100"
                      href={closingCta.href}
                    >
                      {closingCta.label}
                    </Link>
                    {closingCta.secondaryHref && closingCta.secondaryLabel ? (
                      <Link
                        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-600 bg-transparent px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                        href={closingCta.secondaryHref}
                      >
                        {closingCta.secondaryLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          {sideSummary.length > 0 ? (
            <aside className="hidden lg:block">
              <div className="sticky top-6 rounded-[30px] border border-[var(--rz-border)] bg-white/72 p-5 shadow-[var(--rz-shadow-card)] backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--rz-text-muted)]">
                  한눈에 보기
                </div>
                <div className="mt-4 grid gap-3">
                  {sideSummary.map((item, index) => (
                    <div
                      className="flex gap-3 rounded-2xl bg-[rgba(15,23,42,0.04)] px-4 py-4 text-sm leading-6 text-[var(--rz-text-secondary)]"
                      key={item}
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.88)] text-xs font-bold text-[var(--rz-accent)]">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--rz-accent)] px-4 text-sm font-semibold text-white transition hover:brightness-95"
                  href="/"
                >
                  홈에서 비교 시작
                </Link>
              </div>
            </aside>
          ) : null}
        </section>

        <footer className="pb-2 text-xs leading-6 text-[var(--rz-text-muted)]">
          {footerExtra ? (
            <div className="mb-4 rounded-[24px] border border-[var(--rz-border)] bg-white/72 px-5 py-4 text-sm leading-7 text-[var(--rz-text-secondary)] shadow-[var(--rz-shadow-card)]">
              {footerExtra}
            </div>
          ) : null}
          ※ 본 서비스는 자산을 추천하는 곳이 아닙니다. 과거의 시간을 통해 미래의 리스크를 더 쉽게 이해하기 위한 시뮬레이션 자료입니다.
        </footer>
      </div>
    </main>
  );
}

function InfoBlock({
  children,
  eyebrow,
  subtitle,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="surface-card rounded-[32px] px-5 py-6 sm:px-6 sm:py-7">
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--rz-text-muted)]">
          {eyebrow}
        </div>
        <h2 className="mt-2 whitespace-pre-line text-2xl font-semibold tracking-[-0.06em] text-[var(--rz-text-primary)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--rz-text-secondary)]">
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  );
}
