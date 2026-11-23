// Estado persistente (progresso). Gravação atômica para não corromper se o processo cair.
import fs from 'node:fs';
import path from 'node:path';
import { PATHS } from './config.mjs';

const EMPTY = () => ({
  version: 1,
  createdAt: new Date().toISOString(),
  me: null, // { profileUrl, currentProfilePhotoId, currentCoverPhotoId }
  mappedAt: null,
  photos: {}, // fbid -> PhotoRecord
  albums: {}, // albumId -> AlbumRecord
  testOne: null, // { fbid, ok, at, before, after }
  testAlbum: null,
  approvedBulk: false,
  approvedAlbums: false,
  events: [],
});

export function loadState() {
  fs.mkdirSync(PATHS.dataDir, { recursive: true });
  if (!fs.existsSync(PATHS.state)) return EMPTY();
  return { ...EMPTY(), ...JSON.parse(fs.readFileSync(PATHS.state, 'utf8')) };
}

export function saveState(state) {
  fs.mkdirSync(PATHS.dataDir, { recursive: true });
  state.updatedAt = new Date().toISOString();
  const tmp = PATHS.state + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, PATHS.state);
}

export function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(path.dirname(PATHS.log), { recursive: true });
    fs.appendFileSync(PATHS.log, line + '\n');
  } catch {}
}

export function upsertPhoto(state, fbid, patch) {
  const prev = state.photos[fbid] || {
    fbid,
    url: null,
    sources: [],
    categories: [],
    albumIds: [],
    status: 'pending',
    before: null,
    after: null,
    reason: null,
    attempts: 0,
  };
  const next = { ...prev, ...patch };
  for (const k of ['sources', 'categories', 'albumIds']) {
    next[k] = [...new Set([...(prev[k] || []), ...(patch[k] || [])])];
  }
  state.photos[fbid] = next;
  return next;
}
