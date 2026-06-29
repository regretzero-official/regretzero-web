# Regretzero Zero-Base Product Brief

## Product Core

Regretzero shows how the same money ends differently depending on where it stayed for 10 years.

This is not an investing dashboard, calculator, or advice product. The main experience is a chart race that makes the gap feel obvious before the user has to read numbers.

## Phase 1 Flow

1. Home
2. Two-asset comparison race
3. Result summary
4. Solo deep-view entry

Everything outside this flow should stay hidden or secondary until the main experience feels strong.

## Success Criteria

- The first screen is understandable within 3 seconds.
- Home starts from one strong recommended comparison, not a menu of many features.
- The race screen is chart-led and has very little explanatory copy.
- The result screen shows the conclusion before supporting numbers.
- The user can move from result into one lightweight solo asset view.

## Keep

- Historical data loading and market bundle utilities
- `race-engine` calculation logic
- Existing asset catalog and availability rules
- Race chart utilities that already handle common data shape
- Pain-of-holding utilities when they support a short result summary

## Redesign

- Home information architecture
- Race screen copy and hierarchy
- Result summary structure
- CTA order and wording
- Design tokens for the main comparison flow
- Centralized copy source for surfaced screens

## Hide Or Defer

- Hidden-money finder
- Future wealth simulator
- Premium upsell surfaces
- Three-way comparison as a main path
- Experimental routes that compete with the chart race

## Copy System

Create a central copy source for the surfaced comparison flow, such as `features/comparison/copy.ts`, before rewriting screens.

Copy rules:

- Korean first, codes second.
- Short, natural, emotionally clear.
- Avoid finance-document tone.
- Avoid translated phrases.
- Avoid feature descriptions as hero copy.
- Avoid repeated phrases like "확인해보세요", "집중해서 보세요", "비교할 수 있습니다", and "기준으로 보여줍니다".
- Say the emotional conclusion first, then supporting details.

## Screen Direction

Home:

- Lead with one recommended comparison.
- Make the start action obvious.
- Move broader asset selection below the first decision.

Race:

- Keep copy minimal.
- Show the two assets, date range, current values, and chart motion.
- Let the widening gap carry the experience.

Result:

- First viewport should answer: which choice won, by how much, and what the same money became.
- Keep detailed metrics collapsed or below the main result.
- Use one primary CTA and one secondary CTA.

Solo:

- Keep it lightweight.
- Show one asset chart, final value, worst drop, recovery, and a clear way back.

## Initial Build Sequence

1. Centralize copy for the main comparison flow.
2. Rebuild home first viewport around one recommended comparison.
3. Simplify race screen copy and status UI.
4. Rebuild result top section as a conclusion-first screen.
5. Add a light solo asset entry from result.
6. Run unit tests, lint, and mobile/desktop visual checks.

## Acceptance Checks

- Home has one dominant start path.
- Main comparison uses exactly two assets.
- Result shows conclusion before any dense metric grid.
- Chart race remains the product's strongest moment.
- Legacy or experimental flows do not appear as primary navigation.
