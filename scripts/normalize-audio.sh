#!/usr/bin/env bash
# Peak-normalize announcer audio files to -1 dB.
# Requires: ffmpeg
#
# Usage:
#   ./scripts/normalize-audio.sh                     # normalize all announcer files
#   ./scripts/normalize-audio.sh client/public/audio/three.mp3  # normalize specific file(s)

set -euo pipefail

TARGET_PEAK=-1  # dBFS

ANNOUNCER_FILES=(
  client/public/audio/three.mp3
  client/public/audio/two.mp3
  client/public/audio/one.mp3
  client/public/audio/finish.mp3
  client/public/audio/difficulty-increase-1.mp3
  client/public/audio/difficulty-increase-2.mp3
  client/public/audio/difficulty-increase-3.mp3
)

if ! command -v ffmpeg &>/dev/null; then
  echo "Error: ffmpeg is required but not installed." >&2
  exit 1
fi

files=("${@:-${ANNOUNCER_FILES[@]}}")

for f in "${files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "Skipping: $f (not found)" >&2
    continue
  fi

  max_vol=$(ffmpeg -i "$f" -af volumedetect -f null - 2>&1 \
    | grep "max_volume:" | awk '{print $5}')

  gain=$(python3 -c "print(round(${TARGET_PEAK} - float('${max_vol}'), 1))")

  if python3 -c "exit(0 if abs(${gain}) < 0.5 else 1)"; then
    echo "$(basename "$f"): already at target (peak=${max_vol} dB)"
    continue
  fi

  tmp=$(mktemp /tmp/normalize-XXXX.mp3)
  ffmpeg -y -i "$f" -af "volume=${gain}dB" -b:a 128k "$tmp" 2>/dev/null
  mv "$tmp" "$f"

  # Copy to dist if it exists
  dist_path="${f/public/dist}"
  if [[ -d "$(dirname "$dist_path")" ]]; then
    cp "$f" "$dist_path"
  fi

  echo "$(basename "$f"): ${max_vol} dB -> +${gain} dB boost"
done
