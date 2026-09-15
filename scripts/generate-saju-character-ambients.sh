#!/usr/bin/env bash
# Warm counseling-spa character ambient beds (ffmpeg synth). No horror drones.
# Usage: ./scripts/generate-saju-character-ambients.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/saju/audio/character"
mkdir -p "$OUT"

DUR=8
SR=22050

encode() {
  local name="$1"
  local lavfi="$2"
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "$lavfi" -t "$DUR" \
    -ac 1 -ar "$SR" -c:a libmp3lame -b:a 48k \
    "$OUT/${name}.mp3"
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "$lavfi" -t "$DUR" \
    -ac 1 -ar "$SR" -c:a libvorbis -q:a 2 \
    "$OUT/${name}.ogg"
  local sz
  sz=$(wc -c < "$OUT/${name}.mp3" | tr -d ' ')
  echo "wrote $OUT/${name}.mp3 (${sz}B) + .ogg"
}

# baek-ryeon — warm ritual (soft low pad + sparse gentle chime)
encode baek-ryeon \
  "sine=f=98:r=${SR},volume=0.22[a0];sine=f=147:r=${SR},volume=0.14[a1];sine=f=196:r=${SR},volume=0.08[a2];sine=f=784:r=${SR},volume=0.04,afade=t=in:st=0:d=0.02,afade=t=out:st=0.15:d=1.5,adelay=2200|2200[ch];sine=f=1047:r=${SR},volume=0.025,afade=t=in:st=0:d=0.02,afade=t=out:st=0.1:d=1.2,adelay=5200|5200[ch2];[a0][a1][a2][ch][ch2]amix=inputs=5:duration=first:dropout_transition=0,afade=t=in:st=0:d=1.8,afade=t=out:st=6.2:d=1.8,volume=1.1"

# seo-nari — warm counseling room
encode seo-nari \
  "sine=f=130:r=${SR},volume=0.2[a0];sine=f=196:r=${SR},volume=0.15[a1];sine=f=261:r=${SR},volume=0.09[a2];sine=f=523:r=${SR},volume=0.04[a3];sine=f=880:r=${SR},volume=0.045,afade=t=in:st=0:d=0.01,afade=t=out:st=0.12:d=1.8,adelay=3000|3000[bell];[a0][a1][a2][a3][bell]amix=inputs=5:duration=first:dropout_transition=0,afade=t=in:st=0:d=1.8,afade=t=out:st=6.2:d=1.8,volume=1.05"

# cha-yuri — cool dry crystalline
encode cha-yuri \
  "sine=f=110:r=${SR},volume=0.14[a0];sine=f=165:r=${SR},volume=0.1[a1];sine=f=330:r=${SR},volume=0.055[a2];sine=f=990:r=${SR},volume=0.025,afade=t=in:st=0:d=0.01,afade=t=out:st=0.08:d=1.4,adelay=4000|4000[cr];[a0][a1][a2][cr]amix=inputs=4:duration=first:dropout_transition=0,afade=t=in:st=0:d=1.8,afade=t=out:st=6.2:d=1.8,volume=1.0"

# han-bora — soft sparkle / airy
encode han-bora \
  "sine=f=174:r=${SR},volume=0.16[a0];sine=f=261:r=${SR},volume=0.12[a1];sine=f=392:r=${SR},volume=0.07[a2];sine=f=1046:r=${SR},volume=0.03,afade=t=in:st=0:d=0.01,afade=t=out:st=0.1:d=1.3,adelay=1800|1800[t1];sine=f=1319:r=${SR},volume=0.022,afade=t=in:st=0:d=0.01,afade=t=out:st=0.08:d=1.1,adelay=4500|4500[t2];[a0][a1][a2][t1][t2]amix=inputs=5:duration=first:dropout_transition=0,afade=t=in:st=0:d=1.8,afade=t=out:st=6.2:d=1.8,volume=1.0"

# lee-doryeong — polite noble warm mid
encode lee-doryeong \
  "sine=f=123:r=${SR},volume=0.18[a0];sine=f=185:r=${SR},volume=0.14[a1];sine=f=246:r=${SR},volume=0.09[a2];sine=f=369:r=${SR},volume=0.05[a3];[a0][a1][a2][a3]amix=inputs=4:duration=first:dropout_transition=0,afade=t=in:st=0:d=1.8,afade=t=out:st=6.2:d=1.8,volume=1.05"

# han-siwoo — night cool sparse (calm, not scary)
encode han-siwoo \
  "sine=f=82:r=${SR},volume=0.17[a0];sine=f=123:r=${SR},volume=0.1[a1];sine=f=164:r=${SR},volume=0.055[a2];sine=f=656:r=${SR},volume=0.02,afade=t=in:st=0:d=0.02,afade=t=out:st=0.2:d=2.0,adelay=3500|3500[sp];[a0][a1][a2][sp]amix=inputs=4:duration=first:dropout_transition=0,afade=t=in:st=0:d=1.8,afade=t=out:st=6.2:d=1.8,volume=1.0"

# kang-seon — warm intimate closer
encode kang-seon \
  "sine=f=146:r=${SR},volume=0.22[a0];sine=f=220:r=${SR},volume=0.16[a1];sine=f=293:r=${SR},volume=0.1[a2];sine=f=440:r=${SR},volume=0.05[a3];[a0][a1][a2][a3]amix=inputs=4:duration=first:dropout_transition=0,afade=t=in:st=0:d=1.8,afade=t=out:st=6.2:d=1.8,volume=1.05"

ls -la "$OUT"
