#!/usr/bin/env python3
"""Registra o áudio que o USUÁRIO gerou no ElevenLabs e extrai o tempo de cada palavra.

Uso: transcrever_audio.py <slug> <caminho-do-audio.mp3|wav> [--modelo medium]

- Copia o áudio para projects/<slug>/03-narracao/narracao.<ext> (o original não é alterado).
- Transcreve com faster-whisper (tempo por palavra) e grava 03-narracao/timestamps.json no formato
  {words:[{text,start,end,type}]} lido por src/lib/timestamps.ts.
- Compara a transcrição com narracao.txt e lista palavras divergentes (pronúncia errada / trecho pulado).
- Marca estado.json audio_gerado=true (audio_aprovado continua false até o usuário aprovar).
"""
import sys, os, json, shutil, subprocess, tempfile, wave, re, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comum import proj, ler_estado, salvar_estado
import numpy as np

if len(sys.argv) < 3:
    sys.exit(__doc__)
slug, src = sys.argv[1], sys.argv[2]
modelo = sys.argv[sys.argv.index("--modelo") + 1] if "--modelo" in sys.argv else "medium"
if not os.path.exists(src):
    sys.exit(f"Arquivo não encontrado: {src}")
d = proj(slug) / "03-narracao"; d.mkdir(exist_ok=True)
ext = os.path.splitext(src)[1].lower() or ".mp3"
dst = d / f"narracao{ext}"
if os.path.abspath(src) != os.path.abspath(dst):
    shutil.copy(src, dst)

wav = os.path.join(tempfile.mkdtemp(), "a.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(dst), "-ac", "1", "-ar", "16000", wav], check=True)
try:
    from faster_whisper import WhisperModel
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "faster-whisper"], check=True)
    from faster_whisper import WhisperModel
w = wave.open(wav); audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
segs, _ = WhisperModel(modelo, device="cpu", compute_type="int8").transcribe(audio, language="pt", word_timestamps=True)
words = [{"text": x.word.strip(), "start": round(x.start, 3), "end": round(x.end, 3), "type": "word"}
         for s in segs for x in s.words if x.word.strip()]
(d / "timestamps.json").write_text(json.dumps({"language_code": "por", "source": "faster-whisper",
                                               "audio": dst.name, "words": words}, ensure_ascii=False, indent=1))

norm = lambda t: re.sub(r"[^\wà-ú]+", " ", t.lower()).split()
txt = d / "narracao.txt"
if txt.exists():
    a, b = norm(txt.read_text(encoding="utf-8")), norm(" ".join(x["text"] for x in words))
    dif = [(op, " ".join(a[i1:i2]), " ".join(b[j1:j2]))
           for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b).get_opcodes() if op != "equal"]
    print(f"Divergências roteiro × áudio ({len(dif)}; inclui erros do próprio Whisper — confira na escuta):")
    for op, x, y in dif[:40]:
        print(f"  {op:8} roteiro: '{x}'  →  áudio: '{y}'")

st = ler_estado(slug); st.update({"audio_gerado": True, "audio_aprovado": False}); salvar_estado(slug, st)
print(f"\nÁudio registrado em {dst}; {len(words)} palavras com tempo. Rode medir_audio.py {slug} e PARE para aprovação.")
