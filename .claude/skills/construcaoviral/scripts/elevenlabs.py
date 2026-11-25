#!/usr/bin/env python3
"""Integração ElevenLabs da skill Construção Viral.

A chave NÃO fica no código nem em variável: neste ambiente o proxy de rede injeta o cabeçalho `xi-api-key`
em toda requisição para api.elevenlabs.io. Fora dele, defina ELEVENLABS_API_KEY.

Subcomandos:
  status                         plano, cota de caracteres usada/limite e renovação
  modelos                        modelos disponíveis + campos de custo que a API informar
  vozes [--filtro txt]           vozes da conta (id, nome, idioma/sotaque, categoria)
  custo <slug> [--modelo id]     caracteres que o texto vai consumir (não chama TTS)
  gerar <slug> --voz ID [--modelo id] [--speed 1.1] [--stability 0.45] [--similarity 0.8]
        [--style 0.2] [--seed N] --confirmar
                                 gera mp3 + timestamps; sem --confirmar só mostra o que faria

Saídas de `gerar` (em viral-video-engine/projects/<slug>/03-narracao/):
  narracao.mp3, alinhamento-bruto.json, timestamps.json ({words:[{text,start,end,type}]} — formato lido por
  src/lib/timestamps.ts), config.json (voz, modelo, parâmetros, caracteres, data).
"""
import argparse, base64, json, os, sys, urllib.request, urllib.error, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comum import PROJ

API = "https://api.elevenlabs.io"
DEFAULT_MODEL = "eleven_multilingual_v2"


def req(method, path, body=None, timeout=300):
    key = os.environ.get("ELEVENLABS_API_KEY", "sk_injetada_pelo_proxy")
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(API + path, data=data, method=method,
                               headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="replace")
        sys.exit(f"ERRO ElevenLabs HTTP {e.code} em {path}: {msg}\n"
                 "Nada foi gerado. Se for erro de chave (invalid_api_key), a credencial salva no ambiente "
                 "precisa ser corrigida (deve começar com 'sk_').")
    except urllib.error.URLError as e:
        sys.exit(f"ERRO de rede ao acessar {API}{path}: {e.reason}. Nada foi gerado.")


def cmd_status(a):
    d = req("GET", "/v1/user/subscription")
    used, lim = d.get("character_count"), d.get("character_limit")
    reset = d.get("next_character_count_reset_unix")
    print(json.dumps({"plano": d.get("tier"), "status": d.get("status"), "caracteres_usados": used,
                      "limite": lim, "restantes": (lim - used) if isinstance(lim, int) and isinstance(used, int) else None,
                      "renova_em": datetime.datetime.utcfromtimestamp(reset).isoformat() + "Z" if reset else None},
                     ensure_ascii=False, indent=1))


def cmd_modelos(a):
    for m in req("GET", "/v1/models"):
        if not m.get("can_do_text_to_speech", True):
            continue
        langs = [l.get("language_id") for l in m.get("languages", [])]
        cost = {k: v for k, v in m.items() if any(s in k for s in ("cost", "rate", "max_characters"))}
        print(f"{m.get('model_id'):28} pt={'pt' in langs or 'por' in langs}  {json.dumps(cost, ensure_ascii=False)}  {m.get('name')}")


def cmd_vozes(a):
    d = req("GET", "/v1/voices")
    for v in d.get("voices", []):
        lab = v.get("labels") or {}
        linha = f"{v.get('voice_id')}  {v.get('name'):24} cat={v.get('category')}  " + \
                " ".join(f"{k}={val}" for k, val in lab.items())
        if not a.filtro or a.filtro.lower() in linha.lower():
            print(linha)


def texto(slug):
    p = PROJ / slug / "03-narracao" / "narracao.txt"
    if not p.exists():
        sys.exit(f"Falta {p}. Rode antes: preparar_narracao.py {slug}")
    return p.read_text(encoding="utf-8").strip()


def estado(slug):
    p = PROJ / slug / "estado.json"
    return json.loads(p.read_text()) if p.exists() else {}


def cmd_custo(a):
    t = texto(a.slug)
    print(f"Texto: {len(t)} caracteres, {len(t.split())} palavras. Modelo pretendido: {a.modelo}.")
    print("Consumo em créditos = caracteres x multiplicador do modelo (veja `modelos`). Confira a cota com `status`.")


def words_from_alignment(al):
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur, s = [], "", None
    for c, a0, a1 in zip(chars, st, en):
        if c.isspace():
            if cur:
                words.append({"text": cur, "start": round(s, 3), "end": round(prev_end, 3), "type": "word"})
                cur = ""
            continue
        if not cur:
            s = a0
        cur += c
        prev_end = a1
    if cur:
        words.append({"text": cur, "start": round(s, 3), "end": round(prev_end, 3), "type": "word"})
    return words


def cmd_gerar(a):
    st = estado(a.slug)
    if not st.get("roteiro_auditado"):
        sys.exit("Bloqueado: o roteiro ainda não passou pela auditoria (estado.json roteiro_auditado=false).")
    t = texto(a.slug)
    vs = {"stability": a.stability, "similarity_boost": a.similarity, "style": a.style,
          "use_speaker_boost": True, "speed": a.speed}
    body = {"text": t, "model_id": a.modelo, "voice_settings": vs}
    if a.seed is not None:
        body["seed"] = a.seed
    print(f"Voz {a.voz} | modelo {a.modelo} | {len(t)} caracteres | {json.dumps(vs)}")
    if not a.confirmar:
        print("Simulação: nada enviado. Repita com --confirmar para gerar (consome créditos).")
        return
    d = req("POST", f"/v1/text-to-speech/{a.voz}/with-timestamps?output_format=mp3_44100_128", body, timeout=600)
    if not d.get("audio_base64"):
        sys.exit(f"Resposta sem áudio: {list(d.keys())}. Nada foi salvo.")
    out = PROJ / a.slug / "03-narracao"
    out.mkdir(parents=True, exist_ok=True)
    (out / "narracao.mp3").write_bytes(base64.b64decode(d["audio_base64"]))
    al = d.get("alignment") or d.get("normalized_alignment")
    (out / "alinhamento-bruto.json").write_text(json.dumps({k: v for k, v in d.items() if k != "audio_base64"}, ensure_ascii=False))
    if al:
        (out / "timestamps.json").write_text(json.dumps({"language_code": "por", "source": "elevenlabs-with-timestamps",
                                                         "words": words_from_alignment(al)}, ensure_ascii=False, indent=1))
    cfg = {"voz_id": a.voz, "modelo": a.modelo, "voice_settings": vs, "seed": a.seed, "caracteres": len(t),
           "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(), "arquivo": "narracao.mp3"}
    (out / "config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=1))
    p = PROJ / a.slug / "estado.json"
    st.update({"audio_gerado": True, "audio_aprovado": False})
    p.write_text(json.dumps(st, ensure_ascii=False, indent=1))
    print(f"OK: {out/'narracao.mp3'} salvo. Rode medir_audio.py {a.slug} e PARE para aprovação do usuário.")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = p.add_subparsers(dest="cmd", required=True)
    s.add_parser("status").set_defaults(f=cmd_status)
    s.add_parser("modelos").set_defaults(f=cmd_modelos)
    v = s.add_parser("vozes"); v.add_argument("--filtro"); v.set_defaults(f=cmd_vozes)
    c = s.add_parser("custo"); c.add_argument("slug"); c.add_argument("--modelo", default=DEFAULT_MODEL); c.set_defaults(f=cmd_custo)
    g = s.add_parser("gerar"); g.add_argument("slug"); g.add_argument("--voz", required=True)
    g.add_argument("--modelo", default=DEFAULT_MODEL); g.add_argument("--speed", type=float, default=1.1)
    g.add_argument("--stability", type=float, default=0.45); g.add_argument("--similarity", type=float, default=0.8)
    g.add_argument("--style", type=float, default=0.2); g.add_argument("--seed", type=int)
    g.add_argument("--confirmar", action="store_true"); g.set_defaults(f=cmd_gerar)
    a = p.parse_args(); a.f(a)


if __name__ == "__main__":
    main()
