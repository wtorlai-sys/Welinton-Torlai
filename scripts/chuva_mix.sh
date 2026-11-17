#!/usr/bin/env bash
# Mixa narração + trilha + efeitos de "A chuva da vovó" e monta o MP4 final (YouTube 16:9).
# Uso: scripts/chuva_mix.sh <video_mudo.mp4>
set -euo pipefail
cd "$(dirname "$0")/.."
VID=${1:-out/chuva_mudo.mp4}
VOZ=public/audio/chuva-da-vovo.mp3
MUS=public/audio/chuva-musica.wav
SFX=public/audio/chuva-sfx.wav
MIX=out/chuva_mix.m4a

# Trilha ~-18 dB e efeitos ~-12 dB abaixo da voz, os dois "abaixam" quando a voz fala (sidechain);
# loudness final -14 LUFS (YouTube). A trilha nunca some.
ffmpeg -v error -y -i "$VOZ" -i "$MUS" -i "$SFX" -filter_complex \
  "[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=3[voz][sc1][sc2]; \
   [1:a]volume=0.20[mus]; [2:a]volume=0.32[fx]; \
   [mus][sc1]sidechaincompress=threshold=0.05:ratio=3:attack=30:release=400[musd]; \
   [fx][sc2]sidechaincompress=threshold=0.05:ratio=2:attack=20:release=300[fxd]; \
   [voz][musd][fxd]amix=inputs=3:normalize=0:duration=longest,atrim=0:89.3,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:a aac -b:a 256k "$MIX"
ffmpeg -v error -y -i "$VID" -i "$MIX" -map 0:v -map 1:a -c:v copy -c:a copy -shortest -movflags +faststart out/A_chuva_da_vovo.mp4
echo "ok out/A_chuva_da_vovo.mp4"
