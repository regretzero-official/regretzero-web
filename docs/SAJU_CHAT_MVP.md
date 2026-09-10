# Saju Character Chat MVP (`/saju`)

Korean freemium AI character chat for love / breakup / reunion with light saju framing.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/saju](http://localhost:3000/saju).

## Optional OpenAI-compatible API

If `OPENAI_API_KEY` is set, `/api/saju/chat` uses an OpenAI-compatible Chat Completions endpoint.
Otherwise a solid Korean template/heuristic fallback is used (no network call).

| Env | Required | Default | Notes |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | no | — | Enables live model replies |
| `OPENAI_BASE_URL` | no | `https://api.openai.com/v1` | Compatible gateways OK |
| `OPENAI_MODEL` | no | `gpt-4o-mini` | Model id for chat completions |

Do **not** commit secrets. Use `.env.local` locally / host env in production.

## Demo paywall

Button **데모로 잠금 해제 (₩4,900)** writes `localStorage` key `rz-saju-demo-unlock` for the browser session/device. No real payment yet.

## Disclaimer

UI copy states this is entertainment only — not real prophecy, fortune-telling, or clinical advice.
