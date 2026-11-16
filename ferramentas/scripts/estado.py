#!/usr/bin/env python3
"""Lê e muda o estado de um vídeo (episodios/<slug>/_CLAUDE/projeto.json) sem abrir o arquivo inteiro.

Uso:
  estado.py <pasta> init [--perfil canal]
  estado.py <pasta> status
  estado.py <pasta> <bloco> [--json]
  estado.py <pasta> --item <id>
  estado.py <pasta> --set <caminho.com.pontos> <valor-json-ou-texto>
  estado.py <pasta> --etapa <etapa>=<status>
  estado.py <pasta> --pendencia <etapa> "<texto>"
  estado.py <pasta> --resolver <id>
"""
import json
import sys
from datetime import date
from pathlib import Path

ETAPAS = ['iniciar', 'preparar', 'motion_mapa', 'motion_render', 'sfx', 'render']
STATUS = {'pendente', 'em_andamento', 'aguardando_aprovacao', 'concluido', 'nao_precisa'}


def caminho(pasta):
    return Path(pasta) / '_CLAUDE' / 'projeto.json'


def ler(pasta):
    p = caminho(pasta)
    if not p.exists():
        sys.exit(f'sem estado: {p} (rode init)')
    return json.loads(p.read_text())


def gravar(pasta, d):
    p = caminho(pasta)
    tmp = p.with_suffix('.tmp')
    tmp.write_text(json.dumps(d, ensure_ascii=False, indent=1))
    tmp.replace(p)


def resumo(v, n=0):
    if isinstance(v, dict):
        return '\n'.join(f"{'  ' * n}{k}: {resumo(x, n + 1) if not isinstance(x, (dict, list)) else chr(10) + resumo(x, n + 1)}" for k, x in v.items())
    if isinstance(v, list):
        linhas = []
        for x in v[:60]:
            if isinstance(x, dict):
                linhas.append(f"{'  ' * n}- " + ' · '.join(f'{k}={json.dumps(y, ensure_ascii=False)[:70]}' for k, y in x.items()))
            else:
                linhas.append(f"{'  ' * n}- {x}")
        if len(v) > 60:
            linhas.append(f"{'  ' * n}… +{len(v) - 60}")
        return '\n'.join(linhas)
    return str(v)


def achar_item(d, iid):
    def busca(x):
        if isinstance(x, dict):
            if x.get('id') == iid:
                return x
            for y in x.values():
                r = busca(y)
                if r:
                    return r
        elif isinstance(x, list):
            for y in x:
                r = busca(y)
                if r:
                    return r
        return None
    return busca(d)


def main(a):
    if len(a) < 2:
        sys.exit(__doc__)
    pasta, cmd = a[0], a[1]
    if cmd == 'init':
        p = caminho(pasta)
        if p.exists():
            sys.exit(f'já existe: {p} (nada foi sobrescrito)')
        perfil = a[a.index('--perfil') + 1] if '--perfil' in a else 'canal'
        p.parent.mkdir(parents=True, exist_ok=True)
        d = {'projeto': Path(pasta).resolve().name, 'perfil': perfil, 'criado': date.today().isoformat(),
             'etapas': {e: 'pendente' for e in ETAPAS}, 'pendencias': [], 'alertas': []}
        gravar(pasta, d)
        print('ok', p)
        return
    d = ler(pasta)
    if cmd == 'status':
        print(f"{d['projeto']} · perfil {d['perfil']}")
        for e in ETAPAS:
            s = d['etapas'].get(e, '?')
            m = {'concluido': '✔', 'aguardando_aprovacao': '◐', 'em_andamento': '…', 'nao_precisa': '–'}.get(s, '○')
            print(f'  {m} {e:<14} {s}')
        abertas = [p for p in d.get('pendencias', []) if not p.get('resolvida')]
        for p in abertas:
            print(f"  ! {p['id']} [{p['etapa']}] {p['texto']}")
        for al in d.get('alertas', []):
            print(f'  ⚠ {al}')
        cad = Path(pasta) / '_CLAUDE' / 'aprendizados.md'
        n = sum(1 for l in cad.read_text().splitlines() if l.startswith('- [ ]')) if cad.exists() else 0
        print(f'  aprendizados anotados: {n}')
        prox = next((e for e in ETAPAS if d['etapas'].get(e) not in ('concluido', 'nao_precisa')), None)
        print(f'  próximo: {prox or "fim do fluxo"}')
        return
    if cmd == '--item':
        it = achar_item(d, a[2])
        print(json.dumps(it, ensure_ascii=False, indent=1) if it else 'não achado')
        return
    if cmd == '--set':
        chaves = a[2].split('.')
        try:
            val = json.loads(a[3])
        except json.JSONDecodeError:
            val = a[3]
        alvo = d
        for c in chaves[:-1]:
            alvo = alvo.setdefault(c, {})
        alvo[chaves[-1]] = val
        gravar(pasta, d)
        print('ok', a[2])
        return
    if cmd == '--etapa':
        e, s = a[2].split('=')
        if e not in ETAPAS or s not in STATUS:
            sys.exit(f'etapa/status inválido: {a[2]}')
        d['etapas'][e] = s
        gravar(pasta, d)
        print('ok', e, s)
        return
    if cmd == '--pendencia':
        n = len(d['pendencias']) + 1
        d['pendencias'].append({'id': f'p{n:02d}', 'etapa': a[2], 'texto': a[3], 'resolvida': False})
        gravar(pasta, d)
        print('ok', f'p{n:02d}')
        return
    if cmd == '--resolver':
        for p in d['pendencias']:
            if p['id'] == a[2]:
                p['resolvida'] = True
        gravar(pasta, d)
        print('ok', a[2])
        return
    bloco = d.get(cmd)
    if bloco is None:
        sys.exit(f'bloco inexistente: {cmd} (blocos: {", ".join(d)})')
    print(json.dumps(bloco, ensure_ascii=False, indent=1) if '--json' in a else resumo(bloco))


if __name__ == '__main__':
    main(sys.argv[1:])
