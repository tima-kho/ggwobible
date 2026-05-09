import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSongsCatalogFromRawFiles } from './songs-catalog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'data');
const CUSTOM_SONGS_PATH = join(DATA_DIR, 'songs.custom.json');
const HIDDEN_SONGS_PATH = join(DATA_DIR, 'songs.hidden.json');

let baseSongs = [];
let customSongs = [];
let hiddenIds = new Set();
let songs = [];
const byId = new Map();

function lookupKey(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeLyrics(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\[\s*СЛАЙД\s*\]/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeTitle(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstNonEmptyLine(text) {
  return String(text || '')
    .split('\n')
    .map(x => x.trim())
    .find(Boolean) || '';
}

function rebuildIndex() {
  songs = [...customSongs, ...baseSongs].filter(s => !hiddenIds.has(s.id));
  byId.clear();
  for (const song of songs) byId.set(song.id, song);
}

async function saveCustomSongs() {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    CUSTOM_SONGS_PATH,
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      total: customSongs.length,
      songs: customSongs
    }, null, 2),
    'utf8'
  );
}

async function saveHiddenIds() {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    HIDDEN_SONGS_PATH,
    JSON.stringify([...hiddenIds], null, 2),
    'utf8'
  );
}

async function loadHiddenIds() {
  try {
    const raw = await readFile(HIDDEN_SONGS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadCustomSongs() {
  try {
    const raw = await readFile(CUSTOM_SONGS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.songs) ? parsed.songs : [];
  } catch {
    return [];
  }
}

export async function loadSongs() {
  let loaded = [];
  try {
    const raw = await readFile(join(DATA_DIR, 'songs.json'), 'utf8');
    const parsed = JSON.parse(raw);
    loaded = Array.isArray(parsed?.songs) ? parsed.songs : [];
    console.log(`[songs] loaded from data/songs.json (${loaded.length})`);
  } catch {
    loaded = await buildSongsCatalogFromRawFiles(ROOT);
    console.warn('[songs] data/songs.json missing, using raw songs sources');
  }

  baseSongs = loaded;
  customSongs = await loadCustomSongs();
  hiddenIds = new Set(await loadHiddenIds());
  rebuildIndex();
}

export function getSongs(limit = 300) {
  return songs.slice(0, Math.max(1, Math.min(limit, 1000))).map(song => ({
    id: song.id,
    title: song.title,
    firstLine: song.firstLine,
    aliases: song.aliases
  }));
}

export function getSong(id) {
  return byId.get(String(id)) || null;
}

function nextCustomSongId() {
  const prefix = 'song-custom-';
  let max = 0;
  for (const song of customSongs) {
    const match = String(song.id || '').match(/^song-custom-(\d+)$/);
    if (!match) continue;
    max = Math.max(max, Number(match[1]) || 0);
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export async function addCustomSong(input) {
  const lyrics = sanitizeLyrics(input?.lyrics || '');
  const titleRaw = normalizeTitle(input?.title || '');
  const title = titleRaw || firstNonEmptyLine(lyrics).slice(0, 140) || 'Без названия';
  if (!lyrics) {
    throw new Error('Lyrics is required');
  }
  const song = {
    id: nextCustomSongId(),
    title: title.slice(0, 140),
    aliases: [],
    firstLine: firstNonEmptyLine(lyrics).slice(0, 240),
    lyrics,
    sources: [{ source: 'manual', ref: 'manual' }]
  };
  customSongs.unshift(song);
  await saveCustomSongs();
  rebuildIndex();
  return song;
}

export async function deleteSong(id) {
  const sid = String(id);
  const isCustom = customSongs.some(s => s.id === sid);
  if (isCustom) {
    customSongs = customSongs.filter(s => s.id !== sid);
    await saveCustomSongs();
  } else if (baseSongs.some(s => s.id === sid)) {
    hiddenIds.add(sid);
    await saveHiddenIds();
  } else {
    return false;
  }
  rebuildIndex();
  return true;
}

export function searchSongs(query, limit = 120) {
  const q = lookupKey(query);
  if (!q) return { items: getSongs(limit) };

  const scored = [];
  for (const song of songs) {
    const candidates = [song.title, ...(song.aliases || [])].map(lookupKey).filter(Boolean);
    let score = 0;
    for (const candidate of candidates) {
      if (candidate === q) score = Math.max(score, 100);
      else if (candidate.startsWith(q)) score = Math.max(score, 80);
      else if (candidate.includes(q)) score = Math.max(score, 50);
    }
    if (score > 0) scored.push({ score, song });
  }

  scored.sort((a, b) =>
    b.score - a.score || a.song.title.localeCompare(b.song.title, 'ru')
  );

  return {
    items: scored.slice(0, Math.max(1, Math.min(limit, 500))).map(({ song }) => ({
      id: song.id,
      title: song.title,
      firstLine: song.firstLine,
      aliases: song.aliases
    }))
  };
}
