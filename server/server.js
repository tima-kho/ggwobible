/**
 * Fastify-сервер Bible Presenter.
 *
 * Отдаёт:
 *   /                        — статика (public/index.html и т.д.)
 *   /api/translations        — список переводов
 *   /api/books               — индекс 66 книг
 *   /api/books/:id           — полная книга со всеми главами
 *   /api/books/:id/chapters/:n — одна глава
 *   /api/search?q=&translation= — поиск по ссылке или тексту
 *
 * Параметр перевода: ?translation=rst|kyb|kjv (по умолчанию rst).
 */
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  load, getTranslations, getBooksIndex, getBook, getChapter, search
} from './library.js';
import {
  loadSongs, getSongs, getSong, searchSongs, addCustomSong, deleteSong, updateSong
} from './songs-library.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 3100);
const HOST = process.env.HOST || '127.0.0.1';

const fastify = Fastify({
  logger: { level: 'info' }
});

/* ---------------------- Утилиты ---------------------- */

function pickTranslation(req) {
  const code = String(req.query?.translation || 'rst').toLowerCase();
  if (!getTranslations().some(t => t.code === code)) return null;
  return code;
}

/* ---------------------- API ---------------------- */

fastify.get('/api/translations', async () => ({
  translations: getTranslations()
}));

fastify.get('/api/books', async () => ({
  books: getBooksIndex()
}));

fastify.get('/api/books/:id', async (req, reply) => {
  const translation = pickTranslation(req);
  if (!translation) return reply.code(400).send({ error: 'Unknown translation' });
  const book = getBook(translation, req.params.id);
  if (!book) return reply.code(404).send({ error: 'Book not found' });
  return book;
});

fastify.get('/api/books/:id/chapters/:n', async (req, reply) => {
  const translation = pickTranslation(req);
  if (!translation) return reply.code(400).send({ error: 'Unknown translation' });
  const chapter = getChapter(translation, req.params.id, req.params.n);
  if (!chapter) return reply.code(404).send({ error: 'Chapter not found' });
  return chapter;
});

fastify.get('/api/search', async (req, reply) => {
  const translation = pickTranslation(req);
  if (!translation) return reply.code(400).send({ error: 'Unknown translation' });
  const q = String(req.query?.q || '').trim();
  const limit = Math.min(Number(req.query?.limit) || 60, 300);
  return search(translation, q, limit);
});

fastify.get('/api/songs', async req => ({
  items: getSongs(Math.min(Number(req.query?.limit) || 300, 1000))
}));

fastify.get('/api/songs/search', async req => {
  const q = String(req.query?.q || '').trim();
  const limit = Math.min(Number(req.query?.limit) || 120, 500);
  return searchSongs(q, limit);
});

fastify.get('/api/songs/:id', async (req, reply) => {
  const song = getSong(req.params.id);
  if (!song) return reply.code(404).send({ error: 'Song not found' });
  return song;
});

fastify.post('/api/songs/custom', async (req, reply) => {
  try {
    const created = await addCustomSong(req.body || {});
    return reply.code(201).send(created);
  } catch (err) {
    return reply.code(400).send({ error: err.message || 'Invalid song payload' });
  }
});

fastify.put('/api/songs/:id', async (req, reply) => {
  try {
    const updated = await updateSong(req.params.id, req.body || {});
    if (!updated) return reply.code(404).send({ error: 'Song not found' });
    return updated;
  } catch (err) {
    return reply.code(400).send({ error: err.message || 'Invalid payload' });
  }
});

fastify.delete('/api/songs/:id', async (req, reply) => {
  const deleted = await deleteSong(req.params.id);
  if (!deleted) return reply.code(404).send({ error: 'Song not found' });
  return { ok: true };
});

/* ---------------------- Статика и health ---------------------- */

fastify.register(fastifyStatic, {
  root: resolve(ROOT, 'public'),
  prefix: '/',
  index: 'index.html'
});

fastify.get('/healthz', async () => ({ ok: true }));

/* ---------------------- Старт ---------------------- */

(async () => {
  try {
    await load();
    await loadSongs();
    await fastify.listen({ host: HOST, port: PORT });
    fastify.log.info(`Bible Presenter готов: http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
