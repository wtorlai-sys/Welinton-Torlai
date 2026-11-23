// Relatórios (mapeamento e final). Contagens vêm só do que foi VERIFICADO na interface.
import fs from 'node:fs';
import { PATHS, AUDIENCE_PT } from './config.mjs';

const CAT_PT = {
  uploaded_by_me: 'Publicadas por você ("Suas fotos")',
  tagged_by_others: 'Publicadas por outras pessoas / você marcado(a)',
  profile_pictures: 'Fotos do perfil (álbum)',
  cover_photos: 'Fotos da capa (álbum)',
  timeline_photos: 'Publicações com fotos (linha do tempo)',
  mobile_uploads: 'Uploads do celular',
  featured: 'Destaques',
  other_special: 'Outros álbuns automáticos',
  user_album: 'Álbuns criados por você',
  current_profile_photo: 'Foto de perfil ATUAL',
  current_cover_photo: 'Foto de capa ATUAL',
};

const REASON_PT = {
  current_profile_photo: 'Foto de perfil atual — o Facebook exige que seja pública.',
  current_cover_photo: 'Foto de capa atual — o Facebook exige que seja pública.',
  tagged_by_others: 'Publicada por outra pessoa (você só foi marcado/a). Só o autor controla o público.',
  not_editable: 'Sem opção de editar público (outra pessoa publicou, ou restrição do Facebook).',
  audience_not_found: 'Indicador de público não localizado na página.',
  album_governed: 'Público definido pelo álbum — alterar o álbum.',
  must_be_public: 'O Facebook exige que esta foto seja pública.',
  only_me_unavailable: '"Somente eu" não é oferecido para esta foto.',
  not_verified: 'Alteração não confirmada após recarregar.',
  dialog_stuck: 'O seletor de público não fechou.',
  safety_stop: 'Interrompido por regra de segurança.',
  error: 'Erro técnico (ver log/captura).',
  album_no_edit_option: 'Álbum sem opção de edição.',
  album_no_privacy_option: 'Álbum sem seletor de público.',
  album_save_not_found: 'Botão Salvar do álbum não encontrado.',
};

export function buildReport(state) {
  const photos = Object.values(state.photos);
  const albums = Object.values(state.albums);
  const byCat = {};
  for (const p of photos) for (const c of p.categories.length ? p.categories : ['sem_categoria']) byCat[c] = (byCat[c] || 0) + 1;
  const byBefore = {};
  for (const p of photos) if (p.before) byBefore[p.before] = (byBefore[p.before] || 0) + 1;

  const changed = photos.filter((p) => p.status === 'changed_verified');
  const already = photos.filter((p) => p.status === 'already_only_me');
  const exceptions = photos.filter((p) => p.status === 'exception' || p.status === 'failed' || p.status === 'album_governed');
  const pending = photos.filter((p) => p.status === 'pending');
  const albumsChanged = albums.filter((a) => a.status === 'changed_verified');

  // Fotos governadas por um álbum que foi alterado e verificado
  const coveredByAlbum = exceptions.filter((p) => p.status === 'album_governed' && p.albumIds.some((id) => state.albums[id]?.status === 'changed_verified'));

  return {
    geradoEm: new Date().toISOString(),
    totais: {
      fotosIdentificadas: photos.length,
      albunsIdentificados: albums.length,
      fotosQueEstavamPublicas: byBefore.public || 0,
      fotosAlteradasParaSomenteEu: changed.length,
      albunsAlterados: albumsChanged.length,
      fotosQueJaEstavamPrivadas: already.length,
      fotosQueNaoPuderamSerAlteradas: exceptions.length - coveredByAlbum.length,
      fotosCobertasPorAlbumAlterado: coveredByAlbum.length,
      fotosAindaNaoProcessadas: pending.length,
    },
    publicoAntes: byBefore,
    categorias: byCat,
    excecoes: exceptions
      .filter((p) => !coveredByAlbum.includes(p))
      .map((p) => ({ fbid: p.fbid, url: p.url, motivo: REASON_PT[p.reason] || p.reasonText || p.reason, detalhe: p.reasonText || null, antes: p.before })),
    albuns: albums.map((a) => ({ id: a.id, nome: a.name, categoria: a.categoryLabel, fotos: a.photoCount, status: a.status, antes: a.before, depois: a.after, motivo: REASON_PT[a.reason] || a.reason })),
  };
}

export function writeReport(state) {
  const r = buildReport(state);
  fs.mkdirSync(PATHS.dataDir, { recursive: true });
  fs.writeFileSync(PATHS.reportJson, JSON.stringify(r, null, 2));
  const t = r.totais;
  const lines = [
    '# Relatório — privacidade das fotos do Facebook',
    '',
    `Gerado em ${r.geradoEm}. Todas as contagens de "alterada" foram verificadas recarregando a página.`,
    '',
    '## Totais',
    '',
    '| Item | Quantidade |',
    '|---|---:|',
    `| 1. Fotos identificadas | ${t.fotosIdentificadas} |`,
    `| 2. Fotos que estavam públicas | ${t.fotosQueEstavamPublicas} |`,
    `| 3. Fotos alteradas para "Somente eu" (verificadas) | ${t.fotosAlteradasParaSomenteEu} |`,
    `| 4. Álbuns alterados (verificados) | ${t.albunsAlterados} |`,
    `| 5. Fotos que já estavam "Somente eu" | ${t.fotosQueJaEstavamPrivadas} |`,
    `| 6. Fotos que não puderam ser alteradas | ${t.fotosQueNaoPuderamSerAlteradas} |`,
    `| Fotos cobertas por álbum alterado | ${t.fotosCobertasPorAlbumAlterado} |`,
    `| Ainda não processadas | ${t.fotosAindaNaoProcessadas} |`,
    '',
    '## Público encontrado antes da alteração',
    '',
    ...Object.entries(r.publicoAntes).map(([k, v]) => `- ${AUDIENCE_PT[k] || k}: ${v}`),
    '',
    '## Categorias identificadas',
    '',
    ...Object.entries(r.categorias).map(([k, v]) => `- ${CAT_PT[k] || k}: ${v}`),
    '',
    '## Álbuns',
    '',
    '| Álbum | Categoria | Fotos | Status | Motivo |',
    '|---|---|---:|---|---|',
    ...r.albuns.map((a) => `| ${a.nome} | ${a.categoria} | ${a.fotos} | ${a.status} | ${a.motivo || ''} |`),
    '',
    `## 7. Exceções que exigem intervenção manual (${r.excecoes.length})`,
    '',
    ...r.excecoes.map((e) => `- ${e.url} — ${e.motivo}${e.detalhe && e.detalhe !== e.motivo ? ` (${e.detalhe})` : ''}`),
    '',
  ];
  fs.writeFileSync(PATHS.reportMd, lines.join('\n'));
  return r;
}
