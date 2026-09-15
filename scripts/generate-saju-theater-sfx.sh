#!/usr/bin/env bash
# Generate tiny royalty-free/synth one-shot SFX for saju theater (ffmpeg).
# Usage: ./scripts/generate-saju-theater-sfx.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/saju/audio/sfx"
mkdir -p "$OUT"

encode() {
  local name="$1"
  local lavfi="$2"
  local dur="$3"
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "$lavfi" -t "$dur" \
    -ac 1 -ar 22050 -c:a libmp3lame -b:a 48k \
    "$OUT/${name}.mp3"
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "$lavfi" -t "$dur" \
    -ac 1 -ar 22050 -c:a libvorbis -q:a 2 \
    "$OUT/${name}.ogg"
  echo "wrote $OUT/${name}.mp3 + .ogg"
}

# Soft candle crackle / ambient sparkle (~1.1s)
encode candle \
  "anoisesrc=color=pink:amplitude=0.35:sample_rate=22050,highpass=f=1800,lowpass=f=6500,afade=t=in:st=0:d=0.04,afade=t=out:st=0.75:d=0.35,volume=0.55" \
  1.1

# Soft whoosh / door enter (~0.7s) — descending airy tone + hush
encode enter \
  "sine=frequency=320:sample_rate=22050,afade=t=in:st=0:d=0.02,afade=t=out:st=0.12:d=0.55,volume=0.22[a];anoisesrc=color=brown:amplitude=0.2:sample_rate=22050,highpass=f=400,lowpass=f=2800,afade=t=in:st=0:d=0.05,afade=t=out:st=0.25:d=0.4,volume=0.7[b];[a][b]amix=inputs=2:duration=shortest,volume=0.9" \
  0.7

# Soft bell chime for beat advance (~1.0s)
encode chime \
  "sine=frequency=880:sample_rate=22050,afade=t=in:st=0:d=0.01,afade=t=out:st=0.08:d=0.9,volume=0.28[a];sine=frequency=1320:sample_rate=22050,afade=t=in:st=0:d=0.01,afade=t=out:st=0.05:d=0.7,volume=0.12[b];[a][b]amix=inputs=2:duration=longest,volume=1.0" \
  1.0

ls -la "$OUT"
