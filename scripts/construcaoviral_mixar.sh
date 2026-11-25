#!/usr/bin/env bash
# Construção Viral — mixa narração + SFX + trilha (ducking na voz) e monta o MP4 final.
# Uso: scripts/construcaoviral_mixar.sh piscina          (requer out/construcaoviral/<slug>_mudo.mp4)
#      scripts/construcaoviral_mixar.sh piscina audio    (só a mix)
set -euo pipefail
cd "$(dirname "$0")/.."
S=${1:?slug}
VOZ=public/construcaoviral/$S/narracao.mp3
SFX=out/construcaoviral/${S}_sfx.wav
MUS=out/construcaoviral/${S}_musica.wav
MIX=out/construcaoviral/${S}_mix.m4a
# Voz ao centro; trilha ~20 dB abaixo e SFX ~10 dB abaixo, os dois com sidechain da voz; master -14 LUFS, TP -1 dB.
ffmpeg -v error -y -i "$VOZ" -i "$SFX" -i "$MUS" -filter_complex \
  "[0:a]aformat=sample_rates=44100:channel_layouts=stereo,loudnorm=I=-16:TP=-2:LRA=7,asplit=3[voz][sc1][sc2]; \
   [1:a]volume=0.68[fx]; [fx][sc1]sidechaincompress=threshold=0.05:ratio=3:attack=15:release=300[fxd]; \
   [2:a]volume=0.2[mu]; [mu][sc2]sidechaincompress=threshold=0.03:ratio=6:attack=30:release=500[mud]; \
   [voz][fxd][mud]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1:LRA=11" \
  -c:a aac -b:a 256k "$MIX"
echo "ok $MIX"
[ "${2:-}" = "audio" ] && exit 0
ffmpeg -v error -y -i out/construcaoviral/${S}_mudo.mp4 -i "$MIX" -map 0:v -map 1:a -c:v copy -c:a copy -shortest -movflags +faststart viral-video-engine/output/$S.mp4
echo "ok viral-video-engine/output/$S.mp4"
