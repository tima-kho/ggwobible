import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const DATA_DIR = resolve(ROOT, 'data');
const FONTS_PATH = join(DATA_DIR, 'songs.fonts.json');

let fontsMap = {};

async function save() {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FONTS_PATH, JSON.stringify(fontsMap, null, 2), 'utf8');
}

export async function loadSongFonts() {
  try {
    const raw = await readFile(FONTS_PATH, 'utf8');
    fontsMap = JSON.parse(raw) || {};
  } catch {
    fontsMap = {};
  }
}

export function getAllSongFonts() {
  return { ...fontsMap };
}

export async function setSongFont(songId, fontId, fontSize) {
  const sid = String(songId);
  fontsMap[sid] = { fontId: String(fontId), fontSize: Number(fontSize) };
  await save();
  return fontsMap[sid];
}
