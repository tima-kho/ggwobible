import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './services/library.service.js';
import { loadSongs } from './services/songs.service.js';
import { loadSongFonts } from './services/songs-fonts.service.js';
import { booksRoutes } from './routes/books.js';
import { songsRoutes } from './routes/songs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3100);
const HOST = process.env.HOST || '127.0.0.1';

const fastify = Fastify({ logger: { level: 'info' } });

fastify.register(booksRoutes);
fastify.register(songsRoutes);

fastify.register(fastifyStatic, {
  root: resolve(ROOT, 'public'),
  prefix: '/',
  index: 'index.html',
});

fastify.get('/healthz', async () => ({ ok: true }));

(async () => {
  try {
    await load();
    await loadSongs();
    await loadSongFonts();
    await fastify.listen({ host: HOST, port: PORT });
    fastify.log.info(`Bible Presenter готов: http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
