# Regretzero Menu Strategy

## Why This Exists

The left menu should not be a drawer full of features. It should answer one question:

> "What can I do next in Regretzero?"

External UX references used for this pass:

- Nielsen Norman Group menu checklist: make navigation visible on larger screens, use clear familiar labels, show current location, and place frequent commands where they require less effort.
- Baymard category navigation research: category hubs should help users orient themselves before browsing, use plain customer language, and keep curated items secondary to the main navigation task.

## Current Menu Diagnosis

The current structure is directionally right, but the definition of each menu item needs to be stricter.

- Good: grouped sections reduce the feeling of a random feature list.
- Good: `많이 찾는 10년 비교` and `전체 자산 보기` map to real user intent.
- Risk: `저장한 기록`, `시작 시점 바꾸기`, and `금액 계산기` feel like product promises. If they are underbuilt, users perceive the service as unfinished.
- Risk: `10년 투자의 어려움` should not be just a result-dependent empty state. It needs to become a guided experience about drawdown, recovery, and waiting.

## Proposed Menu Definition

### 1. 빠른 시작

Purpose: help a first-time user start a meaningful comparison in under 10 seconds.

- `홈`
  - Definition: return to the initial guided start state.
  - UX role: reset and restart.
  - Keep.
- `많이 찾는 10년 비교`
  - Definition: curated comparison presets by theme.
  - UX role: low-friction entry for users who do not know what to choose.
  - Keep and strengthen.
- `전체 자산 보기`
  - Definition: searchable asset browser with category filters.
  - UX role: power path for users with a specific asset in mind.
  - Keep and treat as a core feature.

### 2. 내 테스트

Purpose: help users continue or adjust their own simulations.

- `저장한 기록`
  - Definition: local saved comparisons and scenarios.
  - UX role: repeat visits and retention.
  - Keep only if saved results are clearly useful. Otherwise rename to `최근 본 비교`.
- `시작 시점 바꾸기`
  - Definition: rerun the current result from another past date.
  - UX role: advanced exploration after a result exists.
  - Keep, but hide or explain when no result exists.
- `금액 계산기`
  - Definition: compare lump-sum vs monthly contribution assumptions before the race.
  - UX role: beginner planning tool.
  - Keep only if it has a clear bridge back into the main flow.

### 3. 이해하기

Purpose: explain why the result was hard to hold, not just how much it returned.

- `10년 투자의 어려움`
  - Definition: a guided drawdown/recovery/waiting explainer.
  - UX role: Regretzero's emotional and educational moat.
  - Keep, but upgrade into a standalone guided state.
- `사용 가이드`
  - Definition: how to use the service and what terms mean.
  - UX role: reduce beginner confusion.
  - Keep.
- `소개`
  - Definition: why Regretzero exists, data limits, and contact.
  - UX role: trust and brand.
  - Keep.

## Recommended Menu Roadmap

### Keep Now

- 홈
- 많이 찾는 10년 비교
- 전체 자산 보기
- 10년 투자의 어려움
- 사용 가이드
- 소개

### Keep But Improve Before Promoting

- 저장한 기록
- 시작 시점 바꾸기
- 금액 계산기

### Add Later Only If Implemented Well

- `최근 본 비교`: localStorage-based recent comparisons.
- `공유한 결과`: links copied/shared by the user.
- `오늘의 인기 비교`: daily rotating presets, separate from the full preset browser.
- `내 투자 방식`: lump-sum/monthly preference defaults.

### Avoid For Now

- Generic `설정`.
- `프리미엄` or `Pro`.
- Too many market-news style pages.
- Any menu item that opens an empty or placeholder screen.

## Label Rules

- Use user language, not internal language.
- A menu label should predict the destination.
- If a feature needs a result first, say so in the destination screen.
- Do not use two labels for the same thing.
- The first two menu items should always start action, not explanation.

## Suggested Next Menu Structure

```text
빠른 시작
- 홈
- 많이 찾는 10년 비교
- 전체 자산 보기

내 비교
- 최근 본 비교
- 저장한 기록
- 시작 시점 바꾸기

배우기
- 10년 투자의 어려움
- 사용 가이드
- 소개
```

## Success Criteria

- First-time users can explain each menu item before tapping it.
- Users do not hit placeholder-like states.
- `많이 찾는 10년 비교` and `전체 자산 보기` together cover both beginner and specific-search intent.
- `10년 투자의 어려움` feels like a real feature, not a guide link.
