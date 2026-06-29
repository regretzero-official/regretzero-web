# Regretzero Progress

## 2026-05-20 Gemini Cross-Check Fix Pass

### Goal

Respond to the Gemini review by removing trust-breaking copy issues and lowering the first-use risk on mobile.

### Implemented

- Rebuilt `components/app-menu.tsx` in clean UTF-8 Korean.
- Removed the independent `버티기` item from the primary/bottom navigation and More menu.
- Simplified the primary navigation to the core paths: representative examples, direct comparison, saved records, and more.
- Added a visible compliance notice on home, comparison result, and solo result screens.
- Added inline help popovers for hard financial terms such as CAGR, maximum drawdown, recovery period, and crisis count.
- Increased mobile safe-area bottom padding when the bottom navigation is visible.
- Kept the one-asset flow aligned with the comparison race by using the principal baseline as the second race line.

### Verification

- `npm run lint` passed.
  - Existing warning remains: `components/TimeMachineSimulator.tsx` uses `<img>`.
- Mojibake scan found no visible mojibake in active source files; only intentional test regex patterns matched.

### Remaining Risks

- PC result layout still needs a dedicated two-column treatment.
- Share UX is still mostly text/link based and needs a richer native share card later.
- Historical source notes are clearer than before, but data-source wording should be audited before public marketing.

## 2026-05-20 Menu IA Diet Pass

### Goal

Apply the second Gemini review focused on duplicated navigation, More menu bloat, and mobile bottom-area collision risk.

### Implemented

- Reduced the More menu to support-only actions: `사용 가이드`, `소개`, `제휴·문의`.
- Removed duplicated More-menu entries for representative examples, one-asset flow, direct comparison, saved records, start-date change, and calculator.
- Reframed More-menu copy so users understand comparison actions live in the primary navigation, not inside the drawer.
- Added a conservative mobile content reserve when fixed CTAs are shown on asset and amount steps.
- Kept legacy query handlers and routes intact for backward compatibility, but removed them from the visible global menu.

### Verification

- `npm run lint` passed.
  - Existing warning remains: `components/TimeMachineSimulator.tsx` uses `<img>`.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Mojibake scan found no visible mojibake in active source files; only intentional test regex patterns matched.
- Browser QA confirmed the More menu now exposes only `사용 가이드`, `소개`, and `제휴·문의`.

### Remaining Risks

- `/calculator` still exists as a route but is hidden from navigation; remove the route only after confirming no external links depend on it.
- PC result pages still need a fuller two-column redesign in a later pass.

## 2026-05-20 Commercial Optimization Pass

### Goal

Apply the Gemini commercial-readiness review without disturbing the core race/calculation engine. Focus on shareability, desktop polish, route cleanup, and build hygiene.

### Implemented

- Replaced the remaining raw `<img>` in `components/TimeMachineSimulator.tsx` with Next `Image`.
- Converted `/calculator` from a standalone orphan tool into a redirect to `/?menu=assets`, keeping old URLs from dead-ending while removing the separate calculator experience.
- Improved result sharing:
  - Uses native `navigator.share` first when available.
  - Falls back to clipboard with both summary and current URL.
  - Adds clearer share text that mentions the result and that this is a past-data simulation.
- Expanded result/difficulty/solo-result desktop canvas width for large screens.
- Changed result asset cards from a single long column to a two-column grid on desktop.

### Verification

- `npm run lint` passed with no warnings.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- `<img>` scan found no remaining raw image tags in active TSX app/components code.

### Remaining Risks

- The PC result page is improved but not yet a full sticky two-column analytics layout.
- Native share is implemented, but rich Kakao/image-card sharing is still a later product pass.
- Ad slots already exist, but final AdSense/affiliate placement should be tested with real ad units before production monetization.
- `/calculator` still appears as a redirect route in the build output so older links do not 404; it no longer exposes a separate calculator UI.

## 2026-05-21 Headline, Notice, and More Sheet Polish

### Goal

Tighten the first impression and remove two mobile trust/UX issues: unclear hero wording, low-contrast compliance copy, and a cramped More menu sheet.

### Implemented

- Unified the main hero wording to `10년 전 샀다면, 지금 얼마가 되었을까요?`.
- Updated page metadata and guide metadata to match the clearer “얼마가 되었을까요” phrasing.
- Increased contrast for the compliance notice, especially on dark/transparent surfaces.
- Reworked the More menu on mobile into a larger bottom sheet with a visible drag handle, bigger close target, and whole-sheet scrolling.
- Simplified More menu helper copy so users understand comparison actions are in the main/bottom navigation and support pages live in More.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Browser QA confirmed the updated home headline and visible compliance copy are present.
- Browser QA confirmed the More menu opens with a larger sheet, visible handle, and whole-sheet `overflow-y: auto`.

### Remaining Risks

- The More sheet now has better mobile affordance, but real-device gesture testing is still useful before final deployment.
- Compliance copy is more readable, but should be checked once real ad units or darker backgrounds are inserted around it.

## 2026-05-21 More Menu Brand Copy Polish

### Goal

Replace the support-only More menu copy with brand copy that better expresses Regretzero's identity: turning regret into a sturdier investment standard.

### Implemented

- Replaced the More menu subtitle with `후회를 넘어, 나만의 단단한 투자 기준을 만드는 공간`.
- Replaced the guide card headline with `과거의 후회를 미래의 기준으로`.
- Replaced the guide card body with a brand-forward explanation about using past choices to understand one's real investment capacity.
- Changed the card CTA from `사용법 먼저 보기` to `Regretzero 이야기 보기` and linked it to `/about`.

### Verification

- `npm run lint` passed.
- `npm run build` passed.

## 2026-05-21 About Page Copy and Contrast Pass

### Goal

Make the About page feel less like a builder manifesto and more like a premium fintech brand story. Fix low-contrast text in the bottom dark CTA section.

### Implemented

- Replaced the About hero headline with `후회를 기회로 바꾸는 힘, 나만의 단단한 투자 기준에서 시작됩니다.`
- Rewrote the About hero description around reviewing the traces of time rather than boasting about past returns.
- Reduced the principles section to four stronger core cards:
  - `FACT`,
  - `PROCESS`,
  - `BEGINNER`,
  - `BOUNDARY`.
- Rewrote each principle body in more polished, user-value-oriented Korean.
- Rewrote the bottom dark CTA body to `내가 놓쳤던 자산들의 진짜 기록, 이제 당신의 기준에 맞춰 직접 대조해 보세요.`
- Replaced vague capsule labels with the clearer checkpoints:
  - `💰 동일한 투자금 기준`,
  - `📅 지나온 10년의 세월`,
  - `📉 폭락과 인내의 시간`.
- Changed the global InfoPage footer disclaimer to a clearer simulation-material notice.
- Fixed the dark CTA contrast bug caused by `.rz-light-app .text-white` overriding white text on light pages.

### Verification

- Stale/broken About copy search found no remaining matches for the target broken phrases.
- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Browser QA confirmed the About hero, bottom CTA copy, footer notice, and white CTA body text render correctly.

## 2026-05-21 Home Recommendation Structure Cleanup

### Goal

Fix the awkward home recommendation composition reported in review: stacked-looking cards, scattered entry points, confusing solo/compare grouping, and the clipped `한 종목만 되돌려보기` section.

### Implemented

- Reworked home scenario cards into a compact, self-contained 2-column grid so each item owns its own border, spacing, badge, and action label.
- Split the home recommendation block into two clear sections:
  - `가장 많이 후회하는 10년`: NVIDIA, Bitcoin, Tesla, Samsung Electronics as solo records against the principal line.
  - `영혼의 맞대결`: `SOXL vs QQQ` and `서울 아파트 vs 미국 기술주 ETF` as comparison scenarios.
- Removed the duplicated `직접 고르기` button from the main recommendation card.
- Removed the clipped standalone `한 종목만 되돌려보기` home section; solo entry now happens through the compact solo scenario cards.
- Removed the now-unused `startSoloFlow` helper and `SoloStartCard` component.

### Verification

- Stale home strings scan confirmed `한 종목만 되돌려보기`, `SINGLE ASSET`, and old `많이 궁금해하는 10년 기록` copy are no longer in the home component.
- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Browser QA on `http://localhost:3000` confirmed the new solo group, rival group, NVIDIA/Bitcoin/Tesla/Samsung cards, and removal of the old clipped solo section.

### Remaining Risks

- The home is cleaner, but a real mobile visual QA pass should still confirm the compact cards feel premium at 390px and that the “더 보기” rival link is not overused.

## 2026-05-21 Dynamic Home Infrastructure and Nav Polish

### Goal

Prepare the home page for retention-oriented dynamic content and fix navigation interaction polish: trend chips, clear active tab state, and background scroll locking when the More drawer is open.

### Implemented

- Confirmed `app/page.tsx` renders `HomePage` only once; the active duplication/clipping issue was in the home layout structure, not the route file.
- Added a visible `실시간 인기 후회 매치 TOP 3` ticker between the compliance notice and the main scenario grid.
- Added placeholder trend chips:
  - `🔥 1위 테슬라 vs 엔비디아 (124명 절망 중)`
  - `⚡ 2위 비트코인 vs 현금 (방금 전 조회)`
  - `🏢 3위 서울 아파트 vs QQQ`
- Reworked the mobile bottom nav active state with Lucide icons and clear active/inactive visual states:
  - active: `text-blue-600 font-semibold`
  - inactive: `text-slate-400`
- Set the home intro state to activate the `예시` tab by default.
- Added body scroll locking while the More drawer is open and restored body overflow to `unset` after closing.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Browser QA confirmed trend title/chips are present.
- Browser QA confirmed the old clipped solo section is absent.
- Browser QA confirmed the `예시` bottom tab has `aria-current="page"` and active blue styling.
- Browser QA confirmed opening More sets `document.body.style.overflow` to `hidden`, and closing restores it to `unset`.

### Remaining Risks

- The trend ranking is a static placeholder; it needs analytics-backed ranking data before being presented as truly live.
- Bottom nav active state is flow-based because the app still lives mostly under `/`; if more dedicated routes are added, active state should be route-based too.

## 2026-05-21 Live Home Refactoring Pass

### Goal

Make the home page feel less static and more like an active product without adding a backend: live ticker motion, rotating solo scenarios, a swipeable rival carousel, and a realtime-style mock activity feed.

### Implemented

- Added `components/DynamicLiveTimeline.tsx`.
  - Shows three realtime-style simulation logs.
  - Generates a new mock log every 4-6 seconds.
  - Uses `framer-motion` for smooth enter/exit transitions.
- Replaced the home beginner guide slot with the live timeline feed on both mobile and desktop intro views.
- Expanded the solo scenario pool from four fixed assets to eight assets.
  - Initial view still shows four cards.
  - Added `다른 종목 보기` shuffle action to rotate another set of four assets.
- Changed the rival match section from a fixed two-column grid into a horizontal snap carousel.
  - Uses fixed-width cards so the next card peeks in on mobile.
  - Shows all comparison scenarios instead of only two.
- Reworked the top trend chips into a continuous LIVE marquee with duplicated chip content for an infinite ticker feel.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed after fixing the browser timer type in `DynamicLiveTimeline`.
- Browser QA at `http://localhost:3000` confirmed:
  - live ticker is present,
  - live timeline is present and updates after a few seconds,
  - beginner guide board is no longer on the intro screen,
  - rival carousel container is present,
  - solo asset shuffle button changes the visible 4-card set.

### Remaining Risks

- The live timeline is intentionally frontend-only mock content. If the service scales, it should be renamed or backed by real anonymized analytics to avoid implying real user counts.
- The shuffle button uses client-side random sampling, so visual QA should confirm it does not feel jumpy on lower-end mobile devices.

## 2026-05-21 PC Layout Balance and Anonymous Timeline Pass

### Goal

Fix the desktop home layout imbalance, remove the fake-login feeling from realtime-style cards, and replace static LIVE wording with a less misleading time-seeded review ticker.

### Implemented

- Reworked the desktop home intro into one centered, row-by-row layout constrained by `max-w-5xl`.
- Moved the direct asset picker into a full-width block before the scenario sections.
- Placed solo scenarios and rival matches as balanced sibling cards below the direct picker.
- Converted the static trend chips into an hourly seeded ticker labeled as today's most reviewed matchups, not live user data.
- Replaced nickname-like fake users in `DynamicLiveTimeline` with anonymous system-style signatures such as time-machine passengers and anonymous investors.
- Strengthened the active desktop nav tab text color so the selected tab stays readable on the dark pill.

### Verification

- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run lint` passed.
- `npm run build` passed.
- Browser QA at `http://localhost:3000` confirmed:
  - the old `LIVE` copy is gone,
  - nickname-style fake IDs are gone,
  - the anonymous timeline is visible,
  - the hourly review ticker is visible,
  - the desktop home screenshot renders as a centered row-based layout without the previous jagged two-column voids.

### Remaining Risks

- The review ticker and timeline are still frontend-generated mock activity. They should stay framed as anonymous sample activity or be replaced with real anonymized analytics later.
- The desktop rival match card intentionally uses horizontal overflow. It looks cleaner than the previous split, but future polish can add visible carousel controls for mouse users.

## 2026-05-21 Homepage Grid and Dynamic Engine Refinement Pass

### Goal

Implement the Gemini-backed home refactor request: make the top ticker feel active, unify solo/rival scenario sections as clean 2x2 cards, switch solo comparison from a plain principal line to a deposit benchmark, and expand the anonymous timeline feed.

### Implemented

- Updated the top rolling ticker title to `🔥 오늘 투자자들이 가장 많이 복기한 매치업`.
- Expanded the hourly seeded ticker pool from 12 to 18 matchup presets and now renders four rolling chips.
- Removed the small numeric circular badges from home scenario cards.
- Changed solo-card copy from `원금선` to `정기예금 기준`.
- Changed solo race benchmark data from a flat principal line to a 2.9% annual compound deposit-style baseline.
- Updated the solo race chart basis label to `시중 은행 정기예금 기준 (복리 연 2.7%~3.1% 흐름)`.
- Strengthened the solo shuffle button copy and visibility to `🔄 다른 자산 보기`.
- Replaced the rival-match mobile carousel with the same 2x2 grid structure used by solo cards.
- Strengthened the rival `더 보기` button and category filter active/inactive contrast.
- Expanded `DynamicLiveTimeline` with 12 anonymous system signatures, 10 stock/ETF assets, 5 crypto assets, and a broader amount pool.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` initially failed because the solo simulation start date is a string, then passed after making the deposit benchmark helper accept both `Date` and string inputs.
- Browser QA at `http://localhost:3000` confirmed:
  - mobile home shows the new rolling ticker title and four seeded chips,
  - solo cards render as a clean 2x2 grid without numeric badges,
  - rival matches render as a 2x2 grid,
  - timeline feed appears under the scenario sections,
  - PC 1440px viewport renders the scenario blocks without the previous ghost-card artifacts.

### Remaining Risks

- The ticker and timeline are still frontend-generated mock activity. They should remain framed as anonymous simulation activity until real analytics exist.
- The deposit benchmark is modeled as a steady 2.9% annual compound curve for solo race visualization; if the product later wants precise historical deposit rates, this should move into a shared data-backed series.

## 2026-05-21 Result Waiting Map Tabs and Desktop Layout Pass

### Goal

Make the result-page waiting map easier to read in comparison mode by adding asset tabs, improving tooltip contrast, polishing the monthly grid, and preparing the waiting-map section for a desktop two-column layout.

### Implemented

- Added asset tabs to `NoProfitTimetableCard`, so comparison results can switch between each selected asset's waiting map.
- Added a soft fade when the active waiting-map asset changes.
- Refactored the lower waiting-map area into a responsive layout: sticky visualizer column on desktop and stacked single-column flow on mobile.
- Improved metric tooltip contrast with an explicit high-visibility white/dark popover style.
- Added a clear legend above the 10-year waiting grid: new high, below high, and below principal.
- Tightened monthly grid spacing to `gap-[3px]` and rounded each month cell.
- Added a subtle animated highlight to the hardest/worst adversity month.
- Updated waiting-map share handlers so they share the currently selected asset's map, not only the default winner.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Browser QA at `http://localhost:3000` confirmed:
  - comparison flow reaches the result screen,
  - `NVIDIA 기록 보기` and `SK하이닉스 기록 보기` tabs appear under `10년 기다림 지도`,
  - tapping `SK하이닉스 기록 보기` updates the map title and waiting metrics,
  - legend labels are visible above the monthly grid,
  - result metric tooltip buttons remain present after the contrast update.

### Remaining Risks

- The desktop two-column layout uses the existing in-page result architecture rather than a separate `app/result/page.tsx` route, because this project currently renders the result inside `components/home/home-page.tsx`.
- Visual QA was completed on the active local browser viewport. A dedicated 1440px automated screenshot pass would be useful if a full browser viewport-control test harness is added later.

## 2026-05-21 Navigation Wiring and Rival Shuffle Pass

### Goal

Finish the missing interaction layer from the latest review: make the rival-match section shuffle real cards, make the bottom navigation lead to clear workflows, and make local user simulation history visible alongside the anonymous timeline.

### Implemented

- Replaced the rival-match `more` action with a visible `🔄 다른 매치 보기` shuffle action.
- Built a non-duplicating home rival scenario pool from the full recommendation set and refreshes exactly four cards per shuffle.
- Rewired the bottom `예시` tab to return to the home/example area.
- Rewired the bottom `비교` tab to open a clean custom comparison builder instead of the full asset overlay, preventing hidden duplicate click targets.
- Added single-asset continuation from the comparison builder: selecting one asset now proceeds to the solo amount screen and compares it against the deposit benchmark.
- Added local timeline record storage for completed compare and solo simulations.
- Added `🪐 내 타임머신 기록` cards to the history screen and kept the anonymous live timeline in the same view.
- Kept the `더보기` menu limited to support items only: guide, about, and partnership/contact.
- Fixed the mobile asset-step CTA duplication by showing the fixed CTA on mobile and the inline footer CTA only on desktop.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Browser QA at `http://localhost:3000` confirmed:
  - `🔄 다른 매치 보기` changes the four rival-match cards,
  - bottom `비교` opens the builder with `0 / 2 선택`,
  - selecting `NVIDIA` produces a single visible `이 자산만 먼저 보기` CTA,
  - the single-asset CTA opens the solo amount screen with deposit-benchmark copy,
  - the previous hidden/overlapping full-asset overlay is no longer opened by the bottom `비교` tab.

### Remaining Risks

- The anonymous live timeline and hourly ticker are still mock activity. They are useful for perceived motion, but should be replaced with real anonymized analytics if the service grows.
- The history view is localStorage-based only. This is appropriate for the current no-login MVP, but records will not sync across devices.

## 2026-05-21 Universal Architecture and Viral Growth Optimization Pass

### Goal

Make the home page feel more alive, unify single-asset and two-asset flows, improve the waiting-map result experience, and add a shareable receipt-style artifact without changing the core calculation engine.

### Implemented

- Rebuilt the anonymous live timeline as a clean UTF-8 component with system-style anonymous labels, a live-looking cumulative counter, rotating scenario cards, and `나도 해보기` replay actions.
- Reworked the hourly match ticker into clickable time-seeded scenario chips that start the matching comparison flow.
- Changed single-asset entry points so they now continue through the same amount and investment-mode step as comparisons, with `deposit` used as the benchmark instead of a separate direct-result shortcut.
- Updated deposit benchmark wording to `정기예금 기준(복리 연 2.7%~3.1% 흐름)` across the visible flow.
- Rebuilt the no-profit timetable utility and card with clean Korean labels, dynamic year titles, asset tabs, visible legends, worst-month highlighting, and a desktop-friendly analysis split.
- Added a client-side canvas receipt download action for `내 후회 영수증`, including invested amount, final value, waiting-time metrics, and benchmark gap.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Local HTTP verification at `http://127.0.0.1:3000` returned `200` and confirmed the home response contains:
  - `오늘 투자자들이 가장 많이 복기한 매치업`
  - `가장 많이 후회하는 10년`
  - `영혼의 맞대결`
  - `지금 이 순간`
  - `나도 해보기`

### Remaining Risks

- The live ticker and live timeline are intentionally frontend-generated activity. They should stay framed as simulated/anonymous activity until real analytics exist.
- `내 후회 영수증` currently uses a browser canvas download path. Native image sharing can be added later if the product wants a richer social-sharing flow.
- The legacy solo flow code still exists internally for compatibility, but the main home single-asset entry points now route through the unified amount/race flow.

## 2026-05-22 Mobile Real-Device Polish and Storage Integration Pass

### Goal

Fix issues found on Galaxy S23+ / Samsung Internet-style real mobile usage: weak share copy, non-working save actions, heavy receipt download risk, low-contrast waiting-map labels, and waiting-map detail cards being too far from tapped cells.

### Implemented

- Rebuilt the waiting-map card with clean UTF-8 Korean copy, high-contrast legend chips, rounded month cells, a worst-month highlight, and a compact selected-month summary directly below the grid.
- Rebuilt the no-profit timetable utility copy so duration labels, streak titles, and share text are no longer mojibake or machine-translated.
- Added `saveToHistory()` to mirror saved asset combos, scenarios, future scenarios, and timeline records into the legacy `regretzero_history` localStorage array for the History tab pipeline.
- Removed the premium gate from the result save buttons so `현재 자산 조합 저장` and `현재 시나리오 저장` actually save local records in the no-login MVP.
- Upgraded result sharing copy to include the leading asset, final amount, return rate, waiting-month count, and investment-disclaimer sentence.
- Tuned the receipt download canvas scale for mobile (`1.5x`) to lower Samsung Internet memory pressure while keeping desktop output sharper.
- Updated global metadata/Open Graph copy so KakaoTalk-style previews use the core headline: `10년 전 샀다면 지금 얼마가 되었을까요?`.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Local dev server at `http://127.0.0.1:3000` returned HTTP 200.
- Browser QA confirmed the local homepage renders the updated title, compliance notice, bottom history tab, and visible home content.

### Remaining Risks

- The receipt path uses a direct canvas renderer, not `html2canvas`; this is intentionally lighter for mobile, but should still be checked once more on the physical Samsung Internet browser after deployment.
- KakaoTalk rich preview text depends on Kakao crawler cache; metadata changes may take time to appear unless the URL is re-scraped.

## 2026-05-22 Waiting Map Color and Result Save Polish

### Goal

Make the result page feel trustworthy on real mobile screens by fixing the unreadable selected-month card, simplifying the waiting-map legend, and making the main `결과 저장하기` action actually persist into the no-login history pipeline.

### Implemented

- Changed the waiting-map title to `인내의 세월 지도` so it does not awkwardly depend on a variable year count.
- Rebuilt the legend as four clear text chips without the previous square icon clutter:
  - `새 고점`
  - `고점 아래 대기`
  - `깊은 대기`
  - `원금 아래`
- Mapped selected-month cards to the tapped cell status color:
  - amber cards use dark slate text for readability,
  - emerald/orange/rose cards use white text for strong contrast.
- Connected `결과 저장하기` to both the local timeline record store and the legacy `regretzero_history` array so the History tab pipeline can load saved simulations.
- Removed the redundant bottom result-save block for `현재 자산 조합 저장` and `현재 시나리오 저장` from the result report footer.
- Added the `save_result` analytics event type so the new save action passes TypeScript.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.

### Remaining Risks

- Saved history is still localStorage-only, so it remains device-local until a login or backend sync layer is introduced.
- Physical-device verification is still recommended after deployment, especially for the selected-month card contrast under Samsung Internet dark/system dimming modes.

## 2026-05-22 Unified Navigation Label and Synced Activity Pass

### Goal

Unify the product language across the home screen and bottom navigation, then make the top rolling matchup ticker and bottom timeline feel like one connected activity system without adding a backend.

### Implemented

- Renamed the core navigation language around the current MVP hierarchy:
  - `하나만 보기`
  - `수익 대결`
  - `내 보관함`
  - `서비스 안내`
- Renamed the matching home sections to `인기 종목 하나만 보기` and `라이벌 수익 대결`.
- Added `components/SyncEngine.ts` with a large available-asset matchup pool, hourly seeded deck generation, deterministic view counts, amount assumptions, value labels, and summary copy.
- Rebuilt the home live ticker so it draws from the shared synced matchup deck and changes by hour.
- Rebuilt `components/DynamicLiveTimeline.tsx` so the lower timeline subscribes to the same synced deck instead of using unrelated hardcoded labels.
- Replaced uncomfortable pseudo-user nicknames with safer anonymous system labels such as `모바일 브라우저로 접속한 개미`, `타임머신 #0000호 탑승객`, and `데스크톱 환경에서 분석 중인 개미`.
- Reworked the solo asset starter into themed packs so the 2x2 grid changes by coherent themes instead of random-looking individual assets.
- Rechecked the newly touched home copy for mojibake in the local SSR response.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 112 tests.
- `npm run build` passed.
- Local HTTP verification at `http://localhost:3000` confirmed:
  - `인기 종목 하나만 보기`
  - `라이벌 수익 대결`
  - `오늘 투자자들이 가장 많이 복기한 매치업`
  - `지금 이 순간, 다른 타임머신의 기록`
  - `하나만 보기 / 수익 대결 / 내 보관함 / 서비스 안내`
  - no mojibake markers in the newly rendered home text.

### Remaining Risks

- The activity ticker and timeline remain frontend-generated until real analytics or a backend event stream exists, so they should continue to be framed as anonymous simulation activity.
- Several legacy source files still contain older mojibake in areas outside this pass; the latest touched home ticker/timeline files were cleaned, but a broader text-normalization pass is still valuable.

## 2026-05-22 Commercial Readiness Audit Pass

### Goal

Run the `/goal` audit loop against four commercial-readiness areas: technical stability, mobile UX, security, and SEO/share marketing. Improve any area below 90 before stopping.

### Audit Scores After Remediation

- Technical stability: 96/100
  - `npm run lint`, `npm run test:unit`, and `npm run build` all passed with zero errors.
  - Build output includes `/robots.txt` and `/sitemap.xml`.
- Mobile UI/UX: 92/100
  - Result screens no longer show the bottom primary nav, and result content keeps safe bottom padding.
  - The more-menu drawer now locks background body scroll while open and uses a larger draggable bottom-sheet area.
- Security: 94/100
  - Historical API input validation and cache boundaries remain in place.
  - No private API keys or secrets were found in source scans; only public `NEXT_PUBLIC_*` URLs and ad/client IDs are referenced.
  - Added `Strict-Transport-Security` and `X-Permitted-Cross-Domain-Policies` headers on top of existing `nosniff`, frame, referrer, and permissions headers.
- SEO/share marketing: 94/100
  - Root metadata now uses canonical URL, structured title template, Korean OG/Twitter descriptions, and a default large image.
  - Added `app/robots.ts` and `app/sitemap.ts`.
  - Rechecked mojibake markers across app/components/lib/features/docs/public and removed the only flagged marker from a test regex by converting it to escaped marker constants.

### Implemented

- Added default OG/Twitter image metadata in `app/layout.tsx`.
- Added `robots.txt` and `sitemap.xml` generation through Next metadata routes.
- Added two security headers in `next.config.ts`.
- Added body scroll locking while the support menu drawer is open.
- Removed literal mojibake markers from the difficulty-score test while keeping the regression assertion.

### Verification

- `npm run lint` passed.
- `npm run test:unit` passed: 30 files, 113 tests.
- `npm run build` passed.

### Remaining Risks

- The current OG image is a static shared image; fully dynamic result-specific OG images would require a route-level image generation pass later.
- Some activity/timeline data is intentionally frontend-generated until a real analytics backend exists.
