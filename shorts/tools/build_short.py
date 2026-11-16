# Monta short.json (cena 3D completa) a partir das marcações de palavras. Cada plano começa no início de uma frase.
import json, sys
P = sys.argv[1]
W = json.load(open(f'{P}/audio/words_original.json'))['words']
K = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0   # fator de velocidade aplicado à voz (1.0 = fala natural)
SLOW = 1.55 / K                                           # as ações foram ajustadas para 1.55; esticar na mesma proporção
T = lambda i: round(W[i]['t0'] / K, 3)          # índice de palavra (transcrição original) -> segundos no áudio acelerado

ST = (0, 0, 0)            # rua (x=0)
EX = 80                   # esgoto (x=80)
FX = -80                  # criação de ratos (x=-80)
TZ = -2 + 0.6             # deslocamento do modelo do esgoto (bbox recentrado)

chars = [
  {"id": "cacador", "puppet": "puppets/hero", "pos": [0.6, 0, -1.2], "height": 1.75, "face": "neutral"},
  {"id": "fiscal", "puppet": "puppets/official", "pos": [5.0, 0, -2.6], "height": 1.8, "face": "happy", "flip": True},
  {"id": "cacador2", "puppet": "puppets/hero", "pos": [-3.2, 0, -3.4], "height": 1.7, "face": "happy", "flip": True},
  {"id": "cacador3", "puppet": "puppets/hero", "pos": [8.4, 0, -2.4], "height": 1.68, "face": "happy", "flip": True},
  # esgoto
  {"id": "cacadorT", "puppet": "puppets/hero", "pos": [EX + 30, 0, 0], "height": 1.75, "face": "neutral", "flip": True},
  {"id": "fiscalT", "puppet": "puppets/official", "pos": [EX + 32, 0, 0], "height": 1.8, "face": "confused"},
  # criação
  {"id": "cacadorF", "puppet": "puppets/hero", "pos": [FX + 1.6, 0, -0.6], "height": 1.75, "face": "happy"},
]
def rat(id, pos, h=0.34, tail=True, flip=False):
    chars.append({"id": id, "puppet": "puppets/rato" if tail else "puppets/rato-sem-rabo", "pos": pos, "height": h, "flip": flip})
for i, (x, z) in enumerate([(-1.2, 0.4), (-0.4, 1.1), (1.6, 0.8), (2.4, 0.2), (-2.4, 1.3)]):  # ratos da rua (aparecem no plano 2)
    rat(f"rr{i}", [-30 - i, 0, z])
for i, (x, z, f) in enumerate([(-2.0, 1.0, False), (-2.6, -1.2, True), (2.0, 0.4, True), (2.7, -2.2, False), (-1.8, -4.5, False), (2.3, -6.0, True)]):
    rat(f"rt{i}", [EX + x, 0.6, z], 0.36, True, f)
rat("filhote1", [EX + 2.1, 0.6, 6.4], 0.2, True, True); rat("filhote2", [EX + 2.6, 0.6, 6.0], 0.2, True, False); rat("filhote3", [EX + 1.7, 0.6, 5.8], 0.19, True, False)
for i, (x, z) in enumerate([(-1.7, -0.6), (-2.7, 0.0), (-2.2, -1.6), (1.6, -1.0), (2.8, -1.8), (1.9, -3.0), (-2.9, -3.4)]):
    rat(f"rp{i}", [EX + x, 0.6, z], 0.34, True, i % 2 == 0)
rat("mae", [EX + 2.2, 0.6, 5.5], 0.36, False, False)
for i, (x, z) in enumerate([(-1.0, -0.5), (0.4, 0.3), (-0.3, 1.0)]):
    rat(f"sr{i}", [-30, 0, 0], 0.34, False)      # sem rabo, entram no plano 16
for i, (x, y, z) in enumerate([(-1.9, 0.18, -3.1), (-1.3, 0.18, -2.9), (0.6, 0.18, -3.2), (1.1, 0.18, -3.0), (-1.6, 1.24, -3.05)]):
    rat(f"rf{i}", [FX + x, y, z + 0.2], 0.32, True, i % 2 == 1)

props = [
  # rua colonial
  *[{"type": "house", "pos": [x, 0, -9.5], "size": [6.2, 4.6, 5], "wall": "textures/parede.jpg", "repeat": [2, 2], "roofTexture": "textures/telhado.jpg", "roofRepeat": [3, 2], "door": "#3b2a4a"} for x in (-10.5, -3.6, 3.4, 10.4)],
  {"type": "model", "file": "models/balcao.glb", "pos": [2.4, 0, -3.6], "height": 2.7},
  {"type": "model", "file": "models/poste.glb", "pos": [-1.8, 0, -4.6], "height": 4.4},
  {"type": "model", "file": "models/poste.glb", "pos": [8.2, 0, -4.6], "height": 4.4},
  {"type": "tree", "pos": [-6.8, 0, -5.6], "scale": 1.5, "color": "#5f9a4c"},
  {"type": "tree", "pos": [13.0, 0, -5.4], "scale": 1.4, "color": "#4f8f4a"},
  {"type": "crate", "pos": [6.4, 0, -4.6], "size": 0.75, "texture": "textures/madeira.jpg"},
  {"type": "crate", "pos": [6.5, 0.75, -4.65], "size": 0.55, "rotY": 20, "texture": "textures/madeira.jpg"},
  {"type": "barrel", "pos": [-4.6, 0, -4.4]}, {"type": "barrel", "pos": [-5.3, 0, -4.0]},
  {"type": "plane", "image": "textures/placa_peste.png", "pos": [-5.6, 0, -2.6], "size": [1.9, 2.3], "rotY": 18},
  # esgoto
  {"type": "model", "file": "models/esgoto.glb", "pos": [EX, 0, -15.0], "interior": True, "matte": False},
  {"type": "barrel", "pos": [EX + 2.8, 0.6, -7.2]}, {"type": "crate", "pos": [EX - 2.8, 0.6, -9.0], "size": 0.7, "texture": "textures/madeira.jpg"},
  {"type": "crate", "pos": [EX - 2.75, 1.3, -9.1], "size": 0.5, "rotY": 25, "texture": "textures/madeira.jpg"},
  # criação de ratos
  {"type": "house", "pos": [FX, 0, -9], "size": [8, 3.8, 5], "wall": "textures/madeira.jpg", "repeat": [3, 2], "roofTexture": "textures/telhado.jpg"},
  {"type": "model", "file": "models/gaiola.glb", "pos": [FX - 1.6, 0, -3.0], "height": 1.06},
  {"type": "model", "file": "models/gaiola.glb", "pos": [FX + 0.85, 0, -3.1], "height": 1.06, "rotY": -8},
  {"type": "model", "file": "models/gaiola.glb", "pos": [FX - 1.6, 1.06, -3.0], "height": 1.06, "rotY": 6},
  {"type": "crate", "pos": [FX + 3.0, 0, -3.4], "size": 0.8, "texture": "textures/madeira.jpg"},
  {"type": "barrel", "pos": [FX - 3.6, 0, -2.6]}, {"type": "barrel", "pos": [FX + 3.9, 0, -2.6]},
  {"type": "tree", "pos": [FX - 6, 0, -5], "scale": 1.6, "color": "#5f9a4c"}, {"type": "tree", "pos": [FX + 6.5, 0, -6], "scale": 1.3, "color": "#4f8f4a"},
]

A = lambda who, at=0.0, **k: {"at": at, "who": who, **k}
shots = [
  # 0 "Em 1902, Hanói pagou para matar ratos"
  dict(start=0, target="fiscal", headWidth=0.2, yaw=14, pitch=4, zoom=6, pan=[-25, 6], actions=[A("fiscal", 0.2, face="happy", pose={"armR": -115})]),
  # 1 "e acabou com mais ratos do que nunca"
  dict(start=T(7), anchor=[0.2, 0.5, 0.6], distance=6.0, yaw=-8, pitch=10, frameY=-0.05, zoom=4, pan=[20, 0], actions=[
       *[A(f"rr{i}", 0.0, to=[x, 0, z], over=0.01) for i, (x, z) in enumerate([(-4, 0.4), (-4.6, 1.1), (-3.5, 0.8), (-5, 0.2), (-4.2, 1.3)])],
       *[A(f"rr{i}", 0.02 + 0.06 * i, to=[x, 0, z], over=0.9, walk=True) for i, (x, z) in enumerate([(-1.2, 0.4), (-0.4, 1.1), (1.6, 0.8), (2.4, 0.2), (-2.4, 1.3)])],
       A("fiscal", 0.5, face="shocked", pose={"armR": 0, "armL": 30}), A("fiscal", 0.6, shake=0.8), A("cacador", 0.4, face="shocked", hop=0.12)]),
  # 2 "Os franceses tinham acabado de construir 19 km de esgoto moderno..."
  dict(start=T(15), anchor=[EX, 1.7, -6.0], distance=10.0, yaw=0, pitch=4, frameY=0.0, zoom=5),
  # 3 "Novo,"  4 "escuro,"  5 "quentinho." (três batidas no mesmo grupo de ratos)
  dict(start=T(29), target="rt0", headWidth=0.14, yaw=18, pitch=26, zoom=7, pan=[-15, 0], actions=[A("rt0", 0.1, hop=0.12)]),
  dict(start=T(31), target="rt2", headWidth=0.13, yaw=-18, pitch=24, zoom=5, pan=[15, 0], actions=[A("rt2", 0.0, hop=0.1)]),
  # 6 "Perfeito para ratos."
  dict(start=T(32), anchor=[EX, 0.9, -1.5], distance=6.5, yaw=0, pitch=12, zoom=5, actions=[*[A(f"rt{i}", 0.2 + 0.12 * i, hop=0.18) for i in range(6)]]),
  # 7 "Com medo da peste,"
  dict(start=T(35), target="fiscal", headWidth=0.22, yaw=10, pitch=2, zoom=8, pan=[0, 10], out="dissolve", actions=[A("fiscal", 0.0, face="nervous", pose={"armR": 0, "armL": 0}, shake=1.0)]),
  # 8 "o governo mandou caçadores vietnamitas descerem nos túneis."
  dict(start=T(39), target="cacadorT", headWidth=0.12, yaw=-24, pitch=6, zoom=5, pan=[-30, 0], actions=[
       A("cacadorT", 0.0, to=[EX + 2.1, 0.6, -10.0], over=0.01), A("cacadorT", 0.0, face="shouting", pose={"armR": -40, "armL": 40}), A("cacadorT", 0.2, to=[EX + 2.1, 0.6, -3.0], over=1.6, walk=True),
       A("rt5", 0.2, to=[EX + 2.6, 0.6, -1.0], over=1.2, walk=True, flip=False), A("rt3", 0.3, to=[EX + 1.6, 0.6, 0.0], over=1.2, walk=True, flip=False)]),
  # 9 "Numa única semana de abril,"
  dict(start=T(48), target="cacador", headWidth=0.18, yaw=18, pitch=4, zoom=6, pan=[-20, 0], out="dissolve", actions=[A("cacador", 0.0, face="happy", pose={"armR": -120})]),
  # 10 "eles trouxeram quase 8 mil ratos mortos."
  dict(start=T(53), target="fiscal", headWidth=0.1, yaw=-8, pitch=10, zoom=-4, pan=[10, 0], actions=[
       A("fiscal", 0.0, face="shocked", pose={"armR": 0}), A("cacador2", 0.2, face="happy", pose={"armL": 110}), A("cacador3", 0.3, face="happy", pose={"armR": -110}, hop=0.15)]),
  # 11 "Não bastou."
  dict(start=T(60), target="fiscal", headWidth=0.24, yaw=-14, zoom=8, actions=[A("fiscal", 0.0, face="nervous", pose={"head": -8, "armL": 0, "armR": 0})]),
  # 12 "Então veio a ideia genial."
  dict(start=T(62), target="fiscal", headWidth=0.2, yaw=12, pitch=6, zoom=6, pan=[0, -10], actions=[A("fiscal", 0.2, face="happy", pose={"head": 6, "armR": -150}, hop=0.08)]),
  # 13 "Qualquer pessoa ganharia 1 centavo por rato."
  dict(start=T(67), anchor=[2.4, 2.0, -3.9], distance=4.4, yaw=-6, pitch=4, frameY=0.18, zoom=5, pan=[0, -8], actions=[A("fiscal", 0.0, face="happy", pose={"armR": -60})]),
  # 14 "E, para não ter que contar cadáver,"
  dict(start=T(74), target="fiscal", headWidth=0.22, yaw=22, zoom=6, actions=[A("fiscal", 0.0, face="confused", pose={"head": 8, "armR": 0})]),
  # 15 "bastava entregar o rabo."
  dict(start=T(81), anchor=[2.9, 1.3, -3.4], distance=2.6, yaw=14, pitch=22, frameY=0.1, zoom=8, actions=[A("fiscal", 0.0, face="happy")]),
  # 16 "A cidade inteira virou caçadora."
  dict(start=T(85), target="cacador", headWidth=0.12, yaw=-20, pitch=6, zoom=5, pan=[-25, 0], actions=[
       A("cacador", 0.0, face="shouting", pose={"armR": -150, "armL": 150}, hop=0.2), A("cacador2", 0.15, face="shouting", pose={"armL": 140}, hop=0.18), A("cacador3", 0.3, face="shouting", pose={"armR": -140}, hop=0.2)]),
  # 17 "Entre abril e junho foram entregues centenas de milhares de rabos."
  dict(start=T(90), anchor=[2.0, 1.6, -3.0], distance=10.5, yaw=6, pitch=16, zoom=-6, pan=[0, 0], actions=[
       A("cacador", 0.0, face="happy", pose={"armR": -60, "armL": 30}, to=[2.0, 0, -2.0], over=1.2, walk=True), A("fiscal", 0.3, face="happy", pose={"armR": -120})]),
  # 18 "Até que os fiscais começaram a notar uma coisa estranha."
  dict(start=T(101), target="fiscal", headWidth=0.2, yaw=-18, pitch=4, zoom=7, pan=[20, 0], actions=[A("fiscal", 0.0, face="confused", pose={"head": -8, "armR": 0, "armL": 0}), A("fiscal", 1.2, pose={"head": 8})]),
  # 19 "Ratos vivos, andando pela rua,"
  dict(start=T(111), target="sr0", headWidth=0.14, yaw=12, pitch=10, frameY=0.0, zoom=4, pan=[-40, 0], actions=[
       *[A(f"sr{i}", 0.0, to=[-6 - i * 0.7, 0, 0.6 + i * 0.5], over=0.01) for i in range(3)],
       *[A(f"sr{i}", 0.05 + 0.15 * i, to=[x, 0, z], over=2.4, walk=True) for i, (x, z) in enumerate([(-1.0, 0.6), (-1.9, 1.1), (-2.6, 1.6)])]]),
  # 20 "sem rabo."
  dict(start=T(116), target="fiscal", headWidth=0.26, yaw=8, zoom=9, actions=[A("fiscal", 0.0, face="shocked", pose={"armL": 40, "armR": -40}, shake=0.6)]),
  # 21 "Você vê,"  -> noite
  dict(start=T(118), target="cacador", headWidth=0.24, yaw=-10, pitch=8, zoom=7, pan=[0, -12], out="dissolve", actions=[A("cacador", 0.0, face="neutral", pose={"armR": 0, "armL": 0, "head": 6}, to=[0.6, 0, -1.2], over=0.01)]),
  # 22 "um rato morto paga 1 centavo uma vez só."
  dict(start=T(120), target="cacador", headWidth=0.16, yaw=22, pitch=6, zoom=5, pan=[-20, 0], actions=[A("cacador", 0.0, face="confused", pose={"armR": -95, "head": -6})]),
  # 23 "Mas um rato vivo, sem rabo, continua fazendo filhotes."
  dict(start=T(129), target="mae", headWidth=0.11, yaw=-30, pitch=14, frameY=0.04, zoom=6, pan=[20, 0], out="dissolve", actions=[A("mae", 0.3, hop=0.1), A("filhote1", 0.9, hop=0.08), A("filhote2", 1.1, hop=0.08), A("filhote3", 1.3, hop=0.08)]),
  # 24 "E cada filhote nasce com um rabo novinho."
  dict(start=T(138), target="filhote2", headWidth=0.13, yaw=-36, pitch=10, frameY=0.0, zoom=8, actions=[A("filhote2", 0.4, hop=0.1), A("filhote1", 0.7, hop=0.1)]),
  # 25 "Então, os caçadores cortavam o rabo e soltavam o rato de volta no esgoto."
  dict(start=T(146), target="cacadorT", headWidth=0.14, yaw=-20, pitch=6, zoom=5, pan=[-25, 0], actions=[
       A("cacadorT", 0.0, face="nervous", to=[EX + 2.1, 0.6, -3.0], over=0.01, pose={"armR": 0, "armL": 0}), A("cacadorT", 0.8, face="happy", pose={"armL": 70}),
       A("rt1", 0.9, to=[EX - 2.4, 0.6, -14.0], over=1.4, walk=True, flip=True)]),
  # 26 "Hahaha, depois surgiram criações de ratos nos arredores da cidade,"
  dict(start=T(160), target="cacadorF", headWidth=0.14, yaw=16, pitch=6, zoom=5, pan=[-25, 0], out="dissolve", actions=[A("cacadorF", 0.0, face="happy", pose={"armR": -130}, hop=0.12)]),
  # 27 "só por causa dos rabos."
  dict(start=T(170), anchor=[FX - 1.6, 0.75, -2.8], distance=3.6, yaw=-8, pitch=8, zoom=7, actions=[*[A(f"rf{i}", 0.1 + 0.15 * i, hop=0.08) for i in range(5)]]),
  # 28 "O governo cancelou a recompensa"
  dict(start=T(175), target="fiscal", headWidth=0.2, yaw=-12, pitch=4, zoom=7, out="dissolve", actions=[A("fiscal", 0.0, face="shouting", pose={"armL": 100, "armR": -100}, shake=1.2)]),
  # 29 "e os ratos continuaram lá."
  dict(start=T(180), target="rr1", headWidth=0.12, yaw=8, pitch=12, frameY=0.0, zoom=4, pan=[20, 0], actions=[A("rr1", 0.4, hop=0.08), A("rr3", 0.6, hop=0.08)]),
  # 30 "Em 1906,"
  dict(start=T(185), anchor=[-5.6, 1.6, -2.6], distance=4.2, yaw=14, pitch=4, zoom=6, actions=[]),
  # 31 "a peste chegou a Hanói e matou pelo menos 263 pessoas."
  dict(start=T(187), target="cacador", headWidth=0.22, yaw=-16, pitch=4, zoom=8, pan=[0, 10], actions=[A("cacador", 0.0, face="shocked", pose={"armR": 0, "head": 0}, shake=1.4)]),
  # 32 "E o esgoto, que virou o paraíso dos ratos,"
  dict(start=T(198), target="rp2", headWidth=0.06, yaw=14, pitch=24, frameY=0.0, zoom=6, pan=[25, 0], actions=[*[A(f"rp{i}", 0.4 + 0.1 * i, hop=0.12) for i in range(7)]]),
  # 33 "tinha sido construído justamente para deixar a cidade mais limpa."
  dict(start=T(207), target="fiscalT", headWidth=0.2, yaw=14, pitch=4, zoom=7, pan=[0, -8], actions=[A("fiscalT", 0.0, to=[EX - 2.1, 0.6, -2.4], over=0.01), A("fiscalT", 0.0, face="confused", pose={"head": 8}), A("fiscalT", 1.6, face="shocked", pose={"armL": 40}), A("fiscalT", 2.4, face="neutral", pose={"head": -6})]),
]
def place(sh):
    x = sh["anchor"][0] if "anchor" in sh else next(c["pos"][0] for c in chars if c["id"] == sh["target"])
    return round(x / 40)
for i, sh in enumerate(shots):
    sh.pop("out", None)
    if SLOW != 1:
        if "zoom" in sh: sh["zoom"] = round(sh["zoom"] / SLOW ** 0.6, 2)
        if "pan" in sh: sh["pan"] = [round(v / SLOW ** 0.6, 1) for v in sh["pan"]]
        for a in sh.get("actions", []):
            a["at"] = round(a["at"] * SLOW, 3)
            if a.get("over", 0) > 0.05: a["over"] = round(a["over"] * SLOW, 3)
            if "shake" in a: a["shake"] = round(a["shake"] * SLOW, 3)
    if i + 1 < len(shots) and place(shots[i + 1]) != place(sh): sh["out"] = "dissolve"
short = {
  "fps": 30,
  "audio": {"voice": "audio/voice.mp3", "music": "audio/music.mp3", "musicDb": -6},
  "words": "audio/words.json", "captions": {"wordsPer": 1}, "font": "fonts/Inter-Black.otf",
  "moods": {
    "day": {"sun": {"azimuth": 35, "elevation": 48, "color": "#ffdcae", "intensity": 2.5}, "sky": {"top": "#5f86d8", "horizon": "#f2b98a"},
            "fill": {"sky": "#8ea2ff", "ground": "#6a3b6e", "intensity": 1.1}},
    "night": {"sun": {"azimuth": -40, "elevation": 40, "color": "#a9bcff", "intensity": 1.8}, "sky": {"top": "#1d2a6e", "horizon": "#6268b4"},
              "fill": {"sky": "#8796f2", "ground": "#5a4c9c", "intensity": 2.1}, "exposure": 1.5},
  },
  "lighting": [{"t": 0, "mood": "day"}, {"t": T(118), "mood": "night", "fade": 0.8}],
  "ground": {"texture": "textures/chao.jpg", "repeat": [100, 100]},
  "backdrop": {"image": "bg/hanoi.jpg"}, "ink": {"set": 4},
  "characters": chars, "props": props, "shots": shots, "end": "audio",
}
json.dump(short, open(f'{P}/short.json', 'w'), ensure_ascii=False, indent=1)
print(len(shots), 'planos', len(chars), 'personagens')
