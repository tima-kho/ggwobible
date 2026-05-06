import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSongsCatalogFromRawFiles } from '../server/songs-catalog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

export async function buildSongsData(rootDir = ROOT) {
  const songs = await buildSongsCatalogFromRawFiles(rootDir);
  const dataDir = resolve(rootDir, 'data');
  await mkdir(dataDir, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    total: songs.length,
    songs
  };
  await writeFile(join(dataDir, 'songs.json'), JSON.stringify(payload, null, 2), 'utf8');
  const plainSongs = songs.map(song => ({
    title: song.title,
    lyrics: song.lyrics
  }));
  await writeFile(join(dataDir, 'songs.clean.json'), JSON.stringify(plainSongs, null, 2), 'utf8');
  return payload;
}

async function main() {
  console.log('Bible Presenter: сборка каталога песен');
  const payload = await buildSongsData(ROOT);
  console.log(`  data/songs.json — ${payload.total} песен`);
  console.log(`  data/songs.clean.json — ${payload.total} песен (title+lyrics)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('Ошибка сборки песен:', err.message || err);
    process.exit(1);
  });
}
