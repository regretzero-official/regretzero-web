#!/usr/bin/env node
/**
 * Generate ElevenLabs TTS mp3s for saju theater character lines.
 *
 * Requires: ELEVENLABS_API_KEY in env (never commit the key).
 * Usage: node scripts/generate-saju-theater-voices.mjs
 * Optional: --dry-run  (list jobs only)
 * Optional: --character=baek-ryeon  (filter)
 * Optional: --force  (regenerate even if file exists)
 */
import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_BASE = join(ROOT, "public/saju/audio/voice");
const API = "https://api.elevenlabs.io/v1";
const MODEL = "eleven_multilingual_v2";

/** Box agents may inject card.ELEVENLABS_API_KEY separately from process.env. */
const BOX_SECRET_CANDIDATES = [
  "/home/box/sand-data/box-secrets.json",
  "/home/box/agent-data/box-secrets.json",
];

function keyFingerprint(key) {
  return createHash("sha256").update(key).digest("hex").slice(0, 12);
}

async function loadCardSecretKeys() {
  /** @type {{ source: string, key: string }[]} */
  const out = [];
  for (const p of BOX_SECRET_CANDIDATES) {
    try {
      const j = JSON.parse(await readFile(p, "utf8"));
      const key = j?.card?.ELEVENLABS_API_KEY;
      if (typeof key === "string" && key.length > 0) {
        out.push({ source: `card@${p}`, key });
      }
    } catch {
      // ignore missing / unreadable
    }
  }
  return out;
}

/**
 * Resolve a usable API key without printing it.
 * Env may hold a stale key while box card secrets hold the TTS-scoped one.
 */
async function resolveApiKey() {
  /** @type {{ source: string, key: string }[]} */
  const candidates = [];
  if (process.env.ELEVENLABS_API_KEY) {
    candidates.push({ source: "env", key: process.env.ELEVENLABS_API_KEY });
  }
  for (const c of await loadCardSecretKeys()) {
    if (!candidates.some((x) => x.key === c.key)) candidates.push(c);
  }
  if (!candidates.length) return null;

  const probeVoice = "pFZP5JQG7iQjIQuC4Bku";
  for (const c of candidates) {
    try {
      const res = await fetch(`${API}/text-to-speech/${probeVoice}`, {
        method: "POST",
        headers: {
          "xi-api-key": c.key,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: ".",
          model_id: MODEL,
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        }),
      });
      if (res.ok) {
        console.log(
          `API key OK (source=${c.source}, sha12=${keyFingerprint(c.key)}, tts probe ok)`,
        );
        return c.key;
      }
      const body = await res.text();
      const missing = body.includes("missing_permissions");
      console.warn(
        `API key rejected (source=${c.source}, sha12=${keyFingerprint(c.key)}, status=${res.status}${missing ? ", missing_permissions" : ""})`,
      );
    } catch (err) {
      console.warn(
        `API key probe error (source=${c.source}, sha12=${keyFingerprint(c.key)}): ${err.message}`,
      );
    }
  }
  return null;
}

/** Stock voice casting — verify via ElevenLabs dashboard / samples */
export const ELEVENLABS_VOICE_CAST = {
  "baek-ryeon": {
    name: "Lily",
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    note: "deep firm / mystical female",
    stability: 0.72,
    similarity_boost: 0.78,
    style: 0.12,
  },
  "seo-nari": {
    name: "Sarah",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    note: "warm soft female",
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.32,
  },
  "cha-yuri": {
    name: "Laura",
    voiceId: "FGY2WhTYpPnrIDTdsKH5",
    note: "dry sharp female",
    stability: 0.55,
    similarity_boost: 0.8,
    style: 0.22,
  },
  "han-bora": {
    name: "Jessica",
    voiceId: "cgSgspJ2msm6clMCkdW9",
    note: "bright young female (more expressive)",
    stability: 0.32,
    similarity_boost: 0.7,
    style: 0.55,
  },
  "lee-doryeong": {
    name: "George",
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    note: "soft polite male",
    stability: 0.62,
    similarity_boost: 0.75,
    style: 0.18,
  },
  "han-siwoo": {
    name: "Callum",
    voiceId: "N2lVS1w4EtoT3dr4eOWO",
    note: "cool male",
    stability: 0.55,
    similarity_boost: 0.75,
    style: 0.28,
  },
  "kang-seon": {
    name: "Brian",
    voiceId: "nPczCjzI2devNBz1zQrb",
    note: "warm male",
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.35,
  },
};

/** Entry lines keyed by landing slug → default product character */
const ENTRY_BY_SLUG = {
  reunion: {
    characterId: "baek-ryeon",
    shrine: "촛불이 흔들려. 조용히, 그 사람 쪽 기운부터 받아줄게.",
    hook: [
      "잠깐. 기운이 보여—아직 그쪽 인연이 완전히 끊긴 건 아니야.",
      "다만 지금 흔들면 더 엉킨다. 성급한 연락은 독이야.",
      "오늘은 흔들리지 않게, 타이밍부터 분명히 짚어줄게.",
    ],
    invite: "출생과 고민을 적으면 미리보기부터 열어드릴게요.",
  },
  heart: {
    characterId: "seo-nari",
    shrine: "불이 낮아졌어. 그 사람 잔향부터 천천히 만져볼게.",
    hook: [
      "느낌이 왔어. 그 사람 때문에 또 잠 못 잤지?",
      "읽씹·거리감—그 잔향, 끝이 아닐 수도 있어.",
      "오늘은 추측 말고 속마음부터 풀어줄게. 언니 말 들어봐.",
    ],
    invite: "이름·출생·고민만 적어도 속마음 미리보기를 열어요.",
  },
  breakup: {
    characterId: "cha-yuri",
    shrine: "감정은 나중에. 지금은 선부터 그어줄게.",
    hook: [
      "또 그 사람 때문에 머리 복잡하지. 멈춰.",
      "팩트부터 말할게. 지금은 더 잘해주기 시즌이 아니야.",
      "자존을 깎아가며 붙잡지 마. 너는 더 아껴도 돼.",
    ],
    invite: "상황을 짧게 적으면 결정 체크부터 미리 보여드려요.",
  },
  strategy: {
    characterId: "han-bora",
    shrine: "조명 낮추고, 첫 문장부터 같이 골라보자.",
    hook: [
      "헐, 첫 톡 때문에 또 손가락만 떠봤지?",
      "괜찮아. 일단 네 마음부터—초조한 문장은 보내지 마.",
      "해도 되는 말·하면 안 되는 말부터 같이 골라보자.",
    ],
    invite: "출생과 상황을 적으면 행동 가이드 미리보기를 열어요.",
  },
};

/** Alternate counselors who may speak the same product entry lines */
const SLUG_COUNSELORS = {
  reunion: ["baek-ryeon", "lee-doryeong"],
  heart: ["seo-nari", "lee-doryeong", "kang-seon"],
  breakup: ["cha-yuri", "kang-seon"],
  strategy: ["han-bora", "han-siwoo"],
};

const LOADING_LINES = {
  "seo-nari": "느낌이 왔어. 잠깐만—원국부터 풀어볼게.",
  "baek-ryeon": "기운이 보여. 지금은 흔들지 마. 내가 먼저 짚을게.",
  "cha-yuri": "또 그 사람이지? 팩트부터 짧게 정리할게.",
  "han-bora": "헐, 긴장하지 마. 일단 네 마음부터 같이 보자.",
  "lee-doryeong": "다치지 않게, 곁에서 천천히 읽어드릴게요.",
  "han-siwoo": "급할수록 한 박자. 氣부터 읽어볼게.",
  "kang-seon": "괜찮아. 같이 정리하자. 조금만 기다려.",
};

function parseArgs(argv) {
  const opts = { dryRun: false, force: false, character: null };
  for (const a of argv) {
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force") opts.force = true;
    else if (a.startsWith("--character=")) opts.character = a.slice("--character=".length);
  }
  return opts;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function buildJobs(characterFilter) {
  /** @type {{ characterId: string, beat: string, text: string, outRel: string }[]} */
  const jobs = [];

  for (const [slug, entry] of Object.entries(ENTRY_BY_SLUG)) {
    const counselors = SLUG_COUNSELORS[slug] || [entry.characterId];
    for (const characterId of counselors) {
      if (characterFilter && characterId !== characterFilter) continue;
      const pieces = [
        { beat: "shrine", text: entry.shrine },
        ...entry.hook.map((text, i) => ({ beat: `hook-${i}`, text })),
        { beat: "invite", text: entry.invite },
      ];
      for (const p of pieces) {
        jobs.push({
          characterId,
          beat: p.beat,
          text: p.text,
          outRel: `${characterId}/${slug}/${p.beat}.mp3`,
        });
      }
    }
  }

  for (const [characterId, text] of Object.entries(LOADING_LINES)) {
    if (characterFilter && characterId !== characterFilter) continue;
    jobs.push({
      characterId,
      beat: "loading",
      text,
      outRel: `${characterId}/loading.mp3`,
    });
  }

  return jobs;
}

async function listVoices(apiKey) {
  const res = await fetch(`${API}/voices`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`voices_read failed (${res.status}): ${body.slice(0, 240)}`);
  }
  const data = await res.json();
  return data.voices || [];
}

async function tts(apiKey, voiceId, text, settings) {
  const res = await fetch(`${API}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TTS failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    console.error(
      "FAIL: No usable ELEVENLABS_API_KEY (env + card secrets probed).\n" +
        "Need a key with text_to_speech scope. Re-provide via secret-request / env, then:\n" +
        "  node scripts/generate-saju-theater-voices.mjs",
    );
    process.exit(1);
  }

  const jobs = buildJobs(opts.character);
  console.log(`Jobs: ${jobs.length} (model=${MODEL})`);
  console.log("Voice cast:");
  for (const [id, cast] of Object.entries(ELEVENLABS_VOICE_CAST)) {
    console.log(`  ${id} → ${cast.name} (${cast.voiceId}) — ${cast.note}`);
  }

  if (opts.dryRun) {
    for (const j of jobs) {
      console.log(`  [dry] ${j.outRel} ← ${j.text.slice(0, 40)}…`);
    }
    return;
  }

  // Best-effort voice list (cast uses known stock IDs if list fails)
  try {
    const voices = await listVoices(apiKey);
    const byName = new Map(voices.map((v) => [String(v.name).toLowerCase(), v]));
    for (const [id, cast] of Object.entries(ELEVENLABS_VOICE_CAST)) {
      const hit = byName.get(cast.name.toLowerCase());
      if (hit && hit.voice_id !== cast.voiceId) {
        console.warn(
          `Note: ${cast.name} id in account is ${hit.voice_id} (script has ${cast.voiceId}) — using account id`,
        );
        cast.voiceId = hit.voice_id;
      }
    }
  } catch (err) {
    console.warn(`voices list skipped: ${err.message}`);
  }

  let ok = 0;
  let skipped = 0;
  for (const job of jobs) {
    const cast = ELEVENLABS_VOICE_CAST[job.characterId];
    if (!cast) {
      console.error(`No cast for ${job.characterId}`);
      process.exit(1);
    }
    const outPath = join(OUT_BASE, job.outRel);
    if (!opts.force && (await exists(outPath))) {
      skipped += 1;
      console.log(`skip ${job.outRel}`);
      continue;
    }
    await mkdir(dirname(outPath), { recursive: true });
    process.stdout.write(`gen  ${job.outRel} … `);
    try {
      const buf = await tts(apiKey, cast.voiceId, job.text, cast);
      await writeFile(outPath, buf);
      console.log(`${buf.length} bytes`);
      ok += 1;
      // gentle rate limit
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      console.log("FAIL");
      console.error(err.message || err);
      process.exit(1);
    }
  }
  console.log(`Done. generated=${ok} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
