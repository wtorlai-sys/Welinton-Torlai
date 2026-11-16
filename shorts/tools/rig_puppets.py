# Recorta as camadas desenhadas, grava rig.json (pivôs de pescoço, ombros, quadris), faces, folha de emoções e preview.
import json, os, sys
from PIL import Image
root = sys.argv[1]; S = root + '/_svg'; M = json.load(open(S + '/meta.json'))
def crop(src, dst):
    im = Image.open(src).convert('RGBA'); bb = im.getbbox(); im.crop(bb).save(dst); return [bb[0], bb[1], bb[2]-bb[0], bb[3]-bb[1]]
def build(pid, names, pivots, size, feet, head, eyes, faces=None, skin='#f6f1e2'):
    d = f'{root}/{pid}'; os.makedirs(d + '/faces', exist_ok=True)
    layers = {n: {'file': n + '.png', 'box': crop(f'{S}/{pid}/L_{n}.png', f'{d}/{n}.png'), 'pivot': pivots[n]} for n in names}
    rig = {'version': 2, 'name': pid, 'size': size, 'feetY': feet, 'head': head, 'skin': skin, 'layers': layers,
           'order': [n for n in ['legL','legR','armL','armR','body','head'] if n in names], 'faces': {}}
    if eyes: rig['eyes'] = eyes
    for f in faces or []:
        box = crop(f'{S}/{pid}/F_{f}.png', f'{d}/faces/{f}.png'); hp = pivots['head']
        rig['faces'][f] = {'file': f'faces/{f}.png', 'size': box[2:], 'pivot': [hp[0]-box[0], hp[1]-box[1]],
                           'center': [head['center'][0]-box[0], head['center'][1]-box[1]], 'diameter': head['diameter']}
    json.dump(rig, open(d + '/rig.json', 'w'), indent=1); return rig
F = ['happy','nervous','shocked','shouting','confused','neutral']
hero = build('hero', ['head','body','armL','armR','legL','legR'],
  {'head': M['NECK'], 'body': M['HIPC'], 'armL': M['SH']['L'], 'armR': M['SH']['R'], 'legL': M['HIP']['L'], 'legR': M['HIP']['R']},
  [M['W'], M['H']], M['FEET'], {'center': M['HC'], 'diameter': 2*M['HR']}, [{'c': e, 'r': 15} for e in M['EYES']], F)
Image.open(S + '/hero/source.png').save(root + '/hero/source.png')
sheet = Image.new('RGBA', (3*560, 2*560), (0,0,0,0))
for i, f in enumerate(F):
    im = Image.open(f'{root}/hero/faces/{f}.png'); im.thumbnail((520, 520)); sheet.alpha_composite(im, ((i%3)*560 + (560-im.width)//2, (i//3)*560 + (560-im.height)//2))
sheet.save(root + '/hero/emotions.png')
R = M['rat']
for pid in ['rato', 'rato-sem-rabo']:
    build(pid, ['head','body'], {'head': R['NECK'], 'body': R['HIPC']}, [R['RW'], R['RH']], R['FEET'], {'center': [370, 140], 'diameter': 150}, None, skin='#948ca0')
def assemble(rig, d, ang, spread=0):
    W, H = rig['size']; c = Image.new('RGBA', (W, H), (0,0,0,0))
    off = {'head': (0,-spread), 'legL': (-spread//3, spread), 'legR': (spread//3, spread), 'armL': (-spread,0), 'armR': (spread,0)}
    for n in rig['order']:
        L = rig['layers'][n]; im = Image.open(f"{d}/{L['file']}"); px, py = L['pivot']; bx, by = L['box'][:2]
        big = Image.new('RGBA', (W*2, H*2), (0,0,0,0)); big.alpha_composite(im, (int(W + bx - px), int(H + by - py)))
        big = big.rotate(-ang.get(n, 0), center=(W, H), resample=Image.BICUBIC)
        o = off.get(n, (0,0)); x0, y0 = int(W - px - o[0]), int(H - py - o[1])
        c.alpha_composite(big.crop((x0, y0, x0 + W, y0 + H)))
    return c
d = root + '/hero'; W, H = hero['size']
panels = [Image.open(d + '/source.png'), assemble(hero, d, {}, 90), assemble(hero, d, {}), assemble(hero, d, {'armL': 40, 'armR': -120, 'head': 9, 'legL': 14, 'legR': -14})]
pv = Image.new('RGBA', (W*4 + 30, H), (150,155,170,255))
for i, p in enumerate(panels): pv.alpha_composite(p, (i*(W+10), 0))
pv.convert('RGB').save(d + '/preview.png')
print('rig ok')
