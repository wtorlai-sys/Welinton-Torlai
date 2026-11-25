"""Caminhos comuns dos scripts da skill Construção Viral."""
import pathlib, json
SKILL = pathlib.Path(__file__).resolve().parents[1]
ROOT = SKILL.parents[2]                      # raiz do repositório (.claude/skills/<skill>)
ENGINE = ROOT / "viral-video-engine"
PROJ = ENGINE / "projects"
TEMPLATES = SKILL / "templates"

def proj(slug):
    p = PROJ / slug
    if not p.exists():
        raise SystemExit(f"Projeto não existe: {p}. Crie com novo_projeto.py {slug} \"Título\"")
    return p

def ler_estado(slug):
    p = proj(slug) / "estado.json"
    return json.loads(p.read_text()) if p.exists() else {}

def salvar_estado(slug, st):
    (proj(slug) / "estado.json").write_text(json.dumps(st, ensure_ascii=False, indent=1))
