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

Hub cards link to these landings first. Sticky CTA on a landing deep-links into the hub form via `/saju?product=<id>` (e.g. `reunion-luck`).

## Flow

1. Hub: 2-col product cards, character portraits, **예시 후기(데모)**, sticky CTA
2. Birth / concern form
3. Free blurred preview
4. Demo unlock **₩9,900** → full long Korean report (`localStorage`: `rz-saju-report-demo-unlock`)
5. Secondary: `/saju/chat` — 캐릭터와 대화(베타)

## Products (MVP)

| Product | Character |
| --- | --- |
| 재회운 사주 | 백련 (무당) |
| 상대 속마음 사주 | 서나리 (점쟁이) |
| 이별 결정 사주 | 차유리 (깍쟁이) |
| 재회 행동 전략 | 한보라 (아이돌) |

## Report generation

`POST /api/saju/report` with `{ productId, form, previewOnly? }`.

- If `OPENAI_API_KEY` or `GEMINI_API_KEY` is set → template + LLM long report
- Else → rich Korean template filled from form inputs

Do **not** commit secrets. Use `.env.local` locally.

## Disclaimer

UI states entertainment only — not real prophecy. Demo reviews are clearly labeled **예시 후기(데모)**.
