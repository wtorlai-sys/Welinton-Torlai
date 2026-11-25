#!/usr/bin/env python3
"""Extrai o texto falado do roteiro, limpa para TTS e mede o roteiro contra o formato.

Uso: preparar_narracao.py <slug> [--so-metricas]

Lê   projects/<slug>/02-roteiro.md, trecho entre <!-- NARRACAO:INICIO --> e <!-- NARRACAO:FIM -->.
     Dentro dele: linhas que começam com '#', '>', '|', '[', '(' ou '<!--' são notas e NÃO são faladas.
Grava projects/<slug>/03-narracao/narracao.txt — texto pronto para COPIAR E COLAR no ElevenLabs (bloco único:
     quebras de parágrafo viram pausas longas na voz) — e imprime as métricas da auditoria e o próprio texto.

Limpeza: remove markdown (**, _, `), rótulos de bloco ("GANCHO:"), números e unidades por extenso
("30%" -> "trinta por cento", "50 °C" -> "cinquenta graus", "6 a 10 m" -> "seis a dez metros"),
nenhuma tag [PAUSA]/[SUSPENSE] (o modelo padrão as leria em voz alta).
"""
import re, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comum import proj

UN = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze",
      "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
CEN = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos",
       "oitocentos", "novecentos"]


def extenso(n: int) -> str:
    if n < 20: return UN[n]
    if n < 100: return DEZ[n // 10] + ("" if n % 10 == 0 else " e " + UN[n % 10])
    if n == 100: return "cem"
    if n < 1000: return CEN[n // 100] + ("" if n % 100 == 0 else " e " + extenso(n % 100))
    if n < 1_000_000:
        m, r = divmod(n, 1000)
        pre = "mil" if m == 1 else extenso(m) + " mil"
        if r == 0: return pre
        return pre + (" e " if r < 100 or r % 100 == 0 else " ") + extenso(r)
    m, r = divmod(n, 1_000_000)
    pre = "um milhão" if m == 1 else extenso(m) + " milhões"
    return pre if r == 0 else pre + " e " + extenso(r)


def num(s: str) -> str:
    s = s.replace(".", "")
    if "," in s:
        a, b = s.split(",", 1)
        return extenso(int(a)) + " vírgula " + " ".join(extenso(int(c)) for c in b) if len(b) > 1 else \
            extenso(int(a)) + " vírgula " + extenso(int(b))
    return extenso(int(s))


UNIDADES = [(r"°\s?C", "graus"), (r"%", "por cento"), (r"km", "quilômetros"), (r"cm", "centímetros"),
            (r"mm", "milímetros"), (r"m²", "metros quadrados"), (r"m³", "metros cúbicos"), (r"kg", "quilos"),
            (r"t\b", "toneladas"), (r"m\b", "metros"), (r"h\b", "horas"), (r"min\b", "minutos")]
NUM = r"\d+(?:\.\d{3})*(?:,\d+)?"


def normalizar(t: str) -> str:
    for u, ext in UNIDADES:
        t = re.sub(rf"({NUM})\s*a\s*({NUM})\s*{u}", lambda m: f"{num(m[1])} a {num(m[2])} {ext}", t)
        t = re.sub(rf"({NUM})\s*{u}", lambda m: f"{num(m[1])} {ext}", t)
    t = re.sub(NUM, lambda m: num(m[0]), t)
    return feminino(t)


FEM = ("toneladas", "horas", "vezes", "telhas", "casas", "paredes", "camadas", "peças", "semanas", "pessoas",
       "barras", "colunas", "estacas", "vigas", "lajes", "fileiras", "ripas", "gotas", "voltas", "partes")


def feminino(t: str) -> str:
    """'dois toneladas' -> 'duas toneladas', 'um hora' -> 'uma hora', 'duzentos telhas' -> 'duzentas telhas'."""
    def fix(m):
        nums = m[1]
        nums = re.sub(r"\bum\b", "uma", nums)
        nums = re.sub(r"\bdois\b", "duas", nums)
        nums = re.sub(r"entos\b", "entas", nums)
        return nums.rstrip() + " " + m[2]
    alvo = "|".join(FEM) + "|hora|tonelada|vez|telha|casa|parede|camada|peça|semana"
    return re.sub(rf"((?:\b(?:um|dois|três|quatro|cinco|seis|sete|oito|nove|dez|vinte|trinta|quarenta|cinquenta|"
                  rf"sessenta|setenta|oitenta|noventa|cento|duzentos|trezentos|quatrocentos|quinhentos|seiscentos|"
                  rf"setecentos|oitocentos|novecentos|mil|e)\b\s*)+)\b({alvo})\b", fix, t)


def extrair(md: str) -> str:
    m = re.search(r"<!--\s*NARRACAO:INICIO\s*-->(.*?)<!--\s*NARRACAO:FIM\s*-->", md, re.S)
    if not m:
        sys.exit("Marcadores <!-- NARRACAO:INICIO --> / <!-- NARRACAO:FIM --> não encontrados no 02-roteiro.md")
    linhas = []
    for ln in m[1].splitlines():
        s = ln.strip()
        if s.startswith("#"):
            linhas.append("\n\n")                                   # novo bloco = novo parágrafo
            continue
        if not s or s[0] in ">|[(" or s.startswith("<!--"):
            continue
        s = re.sub(r"^[A-ZÁÉÍÓÚÂÊÔÃÕÇ /]{3,}:\s*", "", s)          # rótulo de bloco "GANCHO:"
        s = re.sub(r"[*_`]", "", s)
        s = re.sub(r"\[[^\]]*\]", "", s)                             # [notas] residuais
        linhas.append(s.strip())
    texto = " ".join(linhas)
    paragrafos = [re.sub(r"\s+", " ", p).strip() for p in texto.split("\n\n")]
    # Bloco único: no ElevenLabs cada quebra de parágrafo vira pausa longa, e o formato quase não tem pausas.
    return " ".join(p for p in paragrafos if p)


def metricas(t: str) -> dict:
    frases = [f.strip() for f in re.split(r"(?<=[.!?])\s+", t) if f.strip()]
    pal = [len(f.split()) for f in frases]
    termos = re.findall(r"\b(?:Esse é o|Essa é a|Esses são os|Essas são as)\s+([^.!?]+)[.!]", t)
    low = t.lower()
    return {
        "palavras": len(t.split()), "caracteres": len(t),
        "duracao_estimada_s_a_200ppm": round(len(t.split()) / 200 * 60, 1),
        "frases": len(frases), "media_palavras_por_frase": round(sum(pal) / max(len(pal), 1), 1),
        "frases_acima_de_22_palavras": [f for f in frases if len(f.split()) > 22],
        "termos_nomeados": termos, "n_termos": len(termos),
        "conectores": {"então você": low.count("então você"), "mas": len(re.findall(r"\bmas\b", low)),
                       "é por isso que": low.count("é por isso que"), "porque": len(re.findall(r"\bporque\b", low))},
        "abre_com_se_voce": low.startswith("se você"),
        "tem_parabens_voce_construiu": "parabéns! você construiu" in low,
        "perguntas": sum(1 for f in frases if f.endswith("?")),
        "tags_proibidas": re.findall(r"\[[A-Z]+\]", t),
    }


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    slug = sys.argv[1]
    p = proj(slug)
    bruto = extrair((p / "02-roteiro.md").read_text(encoding="utf-8"))
    met = metricas(re.sub(r"\s+", " ", bruto))
    limpo = normalizar(bruto)
    met["caracteres_texto_para_colar"] = len(limpo)
    alvo = {"palavras": "470–560", "media_palavras_por_frase": "10–14", "n_termos": "6–13", "duracao": "140–165 s"}
    print(json.dumps({"metricas": met, "alvo_do_formato": alvo}, ensure_ascii=False, indent=1))
    if "--so-metricas" not in sys.argv:
        out = p / "03-narracao"; out.mkdir(exist_ok=True)
        (out / "narracao.txt").write_text(limpo + "\n", encoding="utf-8")
        print(f"\nTexto para colar no ElevenLabs salvo em {out/'narracao.txt'} ({len(limpo)} caracteres):\n")
        print(limpo)


if __name__ == "__main__":
    main()
