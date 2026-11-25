#!/usr/bin/env python3
"""Pipeline de medição de um novo vídeo de referência (Fase 8 — aprendizado).

Uso: python3 -I analisar_video.py <video.mp4> <nome-curto> [--modelo medium]

Gera em viral-video-engine/analysis/dados/<nome>/ (nunca altera o vídeo original):
  ficha.json            duração, resolução, fps, loudness, cortes secos, ritmo visual
  transcricao.txt/.json transcrição com tempo por palavra (faster-whisper; instala com pip se faltar)
  sheet_XX.jpg          contact sheets 1 frame/s (10x3 = 30 s por folha) + gancho a 3 fps
Depois disso a análise é feita lendo as folhas e a transcrição, no mesmo molde de
analysis/video-01-arranha-ceu.md (roteiro, estrutura, audiovisual, edição, mapa temporal, hipóteses).
"""
import sys, os, json, subprocess, shutil, tempfile, wave
import numpy as np

if len(sys.argv) < 3:
    sys.exit(__doc__)
video, nome = os.path.abspath(sys.argv[1]), sys.argv[2]
modelo = sys.argv[sys.argv.index("--modelo") + 1] if "--modelo" in sys.argv else "medium"
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(os.path.dirname(os.path.dirname(here)), "..", "..", "viral-video-engine", "analysis", "dados", nome)
out = os.path.normpath(out)
os.makedirs(out, exist_ok=True)
work = tempfile.mkdtemp()
src = os.path.join(work, "v.mp4"); shutil.copy(video, src)


def sh(*a):
    return subprocess.run(a, capture_output=True, text=True)


probe = json.loads(sh("ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate",
                      "-of", "json", src).stdout)
ficha = {"arquivo_original": video, "duracao_s": round(float(probe["format"]["duration"]), 2),
         "streams": probe["streams"]}
lufs = [l.strip() for l in sh("ffmpeg", "-v", "info", "-i", src, "-af", "ebur128", "-f", "null", "-").stderr.splitlines()
        if l.strip().startswith(("I:", "LRA:"))]
ficha["loudness"] = lufs[-2:]
cuts = sh("ffmpeg", "-v", "info", "-i", src, "-vf", "select='gt(scene,0.25)',showinfo", "-f", "null", "-").stderr
ficha["cortes_secos_s"] = [float(x.split(":")[1].split()[0]) for x in cuts.split() if x.startswith("pts_time:")]

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", "fps=10,scale=36:64,format=gray", "-f", "rawvideo", "-"],
                     capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, 64, 36).astype(float)
d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
h = np.array([d[k * 5:(k + 1) * 5].mean() for k in range(len(d) // 5)])
peaks = [k / 2 for k in range(1, len(h) - 1) if h[k] > 6 and h[k] >= h[k - 1] and h[k] >= h[k + 1]]
sec = np.array([d[k * 10:(k + 1) * 10].mean() for k in range(len(d) // 10)])
ficha["ritmo_visual"] = {"segundos_quase_estaticos": int((sec < 1).sum()), "picos_visuais": len(peaks),
                         "intervalo_medio_entre_picos_s": round(float(np.diff(peaks).mean()), 2) if len(peaks) > 1 else None}

sh("ffmpeg", "-v", "error", "-y", "-i", src, "-vf", "fps=1,scale=180:-1,tile=10x3", os.path.join(out, "sheet_%02d.jpg"))
sh("ffmpeg", "-v", "error", "-y", "-t", "10", "-i", src, "-vf", "fps=3,scale=180:-1,tile=10x3", "-frames:v", "1",
   os.path.join(out, "gancho-3fps.jpg"))

wav = os.path.join(work, "a.wav")
sh("ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "16000", wav)
try:
    from faster_whisper import WhisperModel
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "faster-whisper"])
    from faster_whisper import WhisperModel
w = wave.open(wav); audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
segs, info = WhisperModel(modelo, device="cpu", compute_type="int8").transcribe(audio, word_timestamps=True)
segs = list(segs)
json.dump({"lang": info.language, "segs": [{"start": s.start, "end": s.end, "text": s.text,
           "words": [{"w": x.word, "s": x.start, "e": x.end} for x in s.words]} for s in segs]},
          open(os.path.join(out, "transcricao.json"), "w"), ensure_ascii=False)
with open(os.path.join(out, "transcricao.txt"), "w") as fh:
    fh.write("\n".join(f"[{s.start:06.2f} → {s.end:06.2f}] {s.text.strip()}" for s in segs) + "\n")
words = [x for s in segs for x in s.words]
if words:
    fala = words[-1].end - words[0].start
    ficha["roteiro"] = {"palavras": len(words), "palavras_por_minuto": round(len(words) / fala * 60),
                        "primeira_palavra_s": round(words[0].start, 2),
                        "pausas_acima_0_35s": sum(1 for a, b in zip(words, words[1:]) if b.start - a.end > 0.35)}
json.dump(ficha, open(os.path.join(out, "ficha.json"), "w"), ensure_ascii=False, indent=1)
shutil.rmtree(work)
print(json.dumps(ficha, ensure_ascii=False, indent=1))
print(f"\nArquivos em {out}. Revise a transcrição (o Whisper erra termos técnicos) antes de analisar.")
