# Saju Report Hub (`/saju`)

Foxbunny-**style** (not a clone) product hub + paid long-report flow for love / breakup / reunion with light saju framing. Uses Regretzero characters: 서나리(점쟁이), 백련(무당), 차유리(깍쟁이), 한보라(아이돌), plus male trio 이도령 · 한시우 · 강세온.

Core female-guide line: **여자의 마음은 여자가 잘 알지.**

## Per-product landings

| Route | Product | Character |
| --- | --- | --- |
| `/saju/reunion` | 재회운 | 백련 |
| `/saju/heart` | 속마음 | 서나리 |
| `/saju/breakup` | 이별 결정 | 차유리 |
| `/saju/strategy` | 재회 행동 전략 | 한보라 |
| `/saju/faq` | 공통 FAQ | — |
| `/saju/my` | 내 사주 (저장된 리포트) | — |

Hub cards link to these landings first. Sticky CTA on a landing deep-links into the hub form via `/saju?product=<id>` (e.g. `reunion-luck`).

First visit to a product landing shows an optional cinematic **입장 연출** (character portrait + voice line + concern chips). Seen state is stored in `localStorage` (`rz-saju-entry-seen`). Replay with `?entry=1`. `prefers-reduced-motion` shows a static overlay (no ken-burns / slide).

## Flow

1. Hub: discovery shelves (horizontal product carousels + related grouping) · 2-col all grid · character portraits · **예시 후기(데모)** · sticky CTA (“무료로 시작하기”)
2. Product landing: multi-beat **입장 연출** (사당 → 훅 → 마음 고르기 → 연 알려주세요) · optional sound stub · skip always · sticky CTA with honest “지금 미리보기 가능” (no fake participation counts)
3. Birth / concern form (multi-step; 출생시간 모름)
4. Loading theater → free 1-section preview + sticky unlock
5. Checkout sheet (요약 → 카드/카카오페이/토스 UI → 확인) · demo pay · unlock celebration (“잠금이 열렸어요”) → full report (`rz-saju-report-demo-unlock` + `rz-saju-my-readings`)
6. Full report end: retention cards → 내 사주함 · 다른 상품 · 허브
7. Bottom nav on `/saju*`: 홈 · 상품 · 내 사주 · FAQ · 문의
8. Secondary: `/saju/chat` — 캐릭터와 대화(베타)

## Products (MVP)

| Product | Default | Alternates |
| --- | --- | --- |
| 재회운 사주 | 백련 (무당) | 이도령 (귀공자) |
| 상대 속마음 사주 | 서나리 (점쟁이) | 이도령 · 강세온 |
| 이별 결정 사주 | 차유리 (깍쟁이) | 강세온 (남친감) |
| 재회 행동 전략 | 한보라 (아이돌) | 한시우 (밤 가이드) |

Counselor choice: product landings + form show a portrait switcher. Deep-link `/saju?product=<id>&character=<id>`. Selected `characterId` is sent to report generation.

## Report generation

`POST /api/saju/report` with `{ productId, form, previewOnly?, characterId? }`.

- If `OPENAI_API_KEY` or `GEMINI_API_KEY` is set → template + LLM long report
- Else → rich Korean template filled from form inputs

Do **not** commit secrets. Use `.env.local` locally.

## Trust UX

- Compact trust strip on hub + product landings: 엔터테인먼트 · 미리보기 무료 · 본문 유료/데모 · FAQ
- Preview paywall lists locked sections with lock icons + “약 N개 섹션 · 긴 해석”
- Demo reviews: dates, masked ids, saju-element chips; labeled **예시 후기(데모)**
- Footer business block on `/saju` and FAQ: Regretzero 사주 · placeholder contact · FAQ anchors for privacy/refund/terms

## Disclaimer

UI states entertainment only — not real prophecy. Demo reviews are clearly labeled **예시 후기(데모)**.

## Report depth

Unlocked Korean templates aim ~6k–10k characters with richer sections (원국/일간, 십성·합충, 대운·세운, 멘트/금지, 전략 3단계, 함정, 캐릭터 마지막 한마디, 엔터 고지). Character voice follows `characterId`. LLM path (OPENAI/GEMINI) targets the same depth.
