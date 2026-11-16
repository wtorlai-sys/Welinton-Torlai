#!/usr/bin/env bash
# Mixa narração + efeitos (com ducking) e monta o MP4 final do episódio.
# Uso: scripts/mixar.sh            (usa out/parts/part*.mp4 renderizados com --muted)
#      scripts/mixar.sh audio      (só gera out/dormir_mix.m4a)
set -euo pipefail
cd "$(dirname "$0")/.."
VOZ=public/audio/dormir-no-mesmo-lugar.mp3
SFX=public/audio/dormir-sfx.wav
MIX=out/dormir_mix.m4a

# Efeitos -6 dB e "abaixam" sob a voz (sidechain); depois loudness -14 LUFS (Shorts/TikTok).
ffmpeg -v error -y -i "$VOZ" -i "$SFX" -filter_complex \
  "[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=2[voz][sc]; \
   [1:a]volume=0.5[fx]; \
   [fx][sc]sidechaincompress=threshold=0.04:ratio=4:attack=20:release=350[fxd]; \
   [voz][fxd]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:a aac -b:a 256k "$MIX"
echo "ok $MIX"
[ "${1:-}" = "audio" ] && exit 0

# Junta as partes de vídeo (mesmos parâmetros H.264) e coloca o áudio mixado.
ls out/parts/part*.mp4 | sort | sed "s|^|file '$(pwd)/|; s|$|'|" > out/parts/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/parts/list.txt -c copy out/parts/video_mudo.mp4
ffmpeg -v error -y -i out/parts/video_mudo.mp4 -i "$MIX" -map 0:v -map 1:a -c:v copy -c:a copy -shortest -movflags +faststart out/Dormir_no_mesmo_lugar.mp4
echo "ok out/Dormir_no_mesmo_lugar.mp4"
