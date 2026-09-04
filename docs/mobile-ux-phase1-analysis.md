# RegretZero Mobile UX Phase 1 Analysis
Date: 2026-09-04 KST
Repo: C:/Users/Kyu/RegretZero/regretzero-web
Remote: github.com/regretzero-official/regretzero-web
Branch: codex/longterm-pain-dashboard

## Stack
- Next.js 16 React 19 TypeScript Tailwind 4
- Framer Motion Recharts lucide-react

## Architecture
- FlowStep intro assets amount race result solo saved
- SoloFlowStep pick amount race result
- Calc lib/race-engine.ts data lib/market-data.ts

## Keep
- race-engine market data deposit FX monthly DCA
- RaceChart solo vs deposit share OG

## Improve
- Home beginner copy and 6 primary assets
- Amount presets 100man 500man 1000man
- Style one-shot vs monthly small
- Friendly Korean CTAs

## Remove-or-simplify first-run
- Finance metric chips on home
- Rival compare as equal primary

## New
- Primary strip VOO Samsung QQQ Tesla Gold BTC
- Solo style and confirm steps

## Deferred
- Crash sell-and-exit
- Full desktop polish


## Phase 2 started (this session)
- Updated amount presets to 100/500/1000 manwon; DEFAULT_AMOUNT=1m
- Redesigned intro beginner home with 6 primary assets
- Solo flow: amount -> style -> confirm -> race -> result
- Monthly style bridges to compare race (asset + deposit)
- Softened Korean CTAs (dallyeobogi / try again / compare)
- Deferred: crash sell-exit, full desktop parity, jargon-deep result trim
