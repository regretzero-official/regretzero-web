# Saju Report Hub (`/saju`)

Foxbunny-**style** (not a clone) product hub + paid long-report flow for love / breakup / reunion with light saju framing. Uses Regretzero characters: 이도령, 한시우, 강세온.

## Flow

1. Hub: 2-col product cards, character portraits, **예시 후기(데모)**, sticky CTA
2. Birth / concern form
3. Free blurred preview
4. Demo unlock **₩9,900** → full long Korean report (`localStorage`: `rz-saju-report-demo-unlock`)
5. Secondary: `/saju/chat` — 도령과 대화(베타)

## Products (MVP)

| Product | Character |
| --- | --- |
| 재회운 사주 | 한시우 |
| 상대 속마음 사주 | 이도령 |
| 이별 결정 사주 | 강세온 |
| 재회 행동 전략 | 한시우 |

## Report generation

`POST /api/saju/report` with `{ productId, form, previewOnly? }`.

- If `OPENAI_API_KEY` or `GEMINI_API_KEY` is set → template + LLM long report
- Else → rich Korean template filled from form inputs

Do **not** commit secrets. Use `.env.local` locally.

## Disclaimer

UI states entertainment only — not real prophecy. Demo reviews are clearly labeled **예시 후기(데모)**.
