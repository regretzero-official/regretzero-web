# RegretZero Handoff

## Current project path

- Repo: [C:\Users\Kyu\RegretZero\regretzero-web](C:\Users\Kyu\RegretZero\regretzero-web)

## What happened

The project has strong underlying engines but the product face became messy.
Main issues:
- landing tone feels fake / phishing-like
- copy is inconsistent
- too many sections are stacked together
- `버티기 코치` and `미래 전략` feel disconnected
- some files still contain mojibake / broken Korean

## Current strategic decision

Do not keep patching the current experience section by section.

The correct direction is:
- keep the data engines
- rebuild the presentation
- unify decision tools into one product flow

## Important product direction

The next version should treat:
- `버티기 코치`
- `미래 전략`

as one integrated product:
- `내 투자 플랜`

Suggested flow:
1. 지금 내 상태
2. 오늘의 행동
3. 90일 플랜
4. 10년 플랜

## Files that matter most

### Core engines worth keeping
- [C:\Users\Kyu\RegretZero\regretzero-web\src\lib\holdCoach.ts](C:\Users\Kyu\RegretZero\regretzero-web\src\lib\holdCoach.ts)
- [C:\Users\Kyu\RegretZero\regretzero-web\src\lib\futureScenarios.ts](C:\Users\Kyu\RegretZero\regretzero-web\src\lib\futureScenarios.ts)

### Main UI files that need product-level cleanup
- [C:\Users\Kyu\RegretZero\regretzero-web\app\page.tsx](C:\Users\Kyu\RegretZero\regretzero-web\app\page.tsx)
- [C:\Users\Kyu\RegretZero\regretzero-web\src\components\HoldCoachPanel.tsx](C:\Users\Kyu\RegretZero\regretzero-web\src\components\HoldCoachPanel.tsx)
- [C:\Users\Kyu\RegretZero\regretzero-web\src\components\FutureScenarioChart.tsx](C:\Users\Kyu\RegretZero\regretzero-web\src\components\FutureScenarioChart.tsx)
- [C:\Users\Kyu\RegretZero\regretzero-web\src\components\LandingComicPanels.tsx](C:\Users\Kyu\RegretZero\regretzero-web\src\components\LandingComicPanels.tsx)

## Current known problems

### 1. Landing
- too much text
- bad tone
- visual clutter
- hero structure is not premium enough

### 2. Hold coach
- current concept is useful, but presentation still feels noisy
- trust is damaged by broken strings and too many micro-sections
- should feel like a decision console, not an AI demo

### 3. Future strategy
- engine exists, but presentation is weak
- should not feel like prediction
- should feel like an execution plan
- many labels in scenario files are broken

## Latest desired direction from the user

User wants:
- a premium paid-site feel
- bright and simple landing
- less text
- less fake marketing tone
- cleaner alignment
- better trust
- a bigger product innovation for the investment tools

User explicitly wants:
- `버티기 코치 + 미래 전략` to become one integrated decision system
- context-safe handoff files so a new chat can continue without losing direction

## Recommended next step in a new chat

Start from this exact instruction:

`PROJECT_NOTES.md and HANDOFF.md are the source of truth. Rebuild the post-race experience into one integrated "내 투자 플랜" flow using existing engines in holdCoach.ts and futureScenarios.ts. Prioritize trust, clean Korean, and a single coherent decision flow over adding more features.`

Then execute in this order:
1. Clean `FutureScenarioChart.tsx`
2. Clean `futureScenarios.ts` labels and action-plan copy
3. Rebuild `HoldCoachPanel.tsx` as `지금 / 90일 / 10년`
4. Replace fragmented sections in `app/page.tsx` with one integrated plan section
5. Build and deploy

## Notes for continuity

- Do not trust old marketing copy
- Do not add more explanatory cards above the fold
- If something feels like a demo widget, remove or demote it
- Prefer rewriting broken UI files over incremental patching
- The engines are more reliable than the current presentation

