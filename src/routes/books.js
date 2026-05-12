import { getTranslations, getBooksIndex, getBook, getChapter, search } from '../services/library.service.js';

function pickTranslation(req) {
  const code = String(req.query?.translation || 'rst').toLowerCase();
  if (!getTranslations().some(t => t.code === code)) return null;
  return code;
}

export async function booksRoutes(fastify) {
  fastify.get('/api/translations', async () => ({ translations: getTranslations() }));

  fastify.get('/api/books', async () => ({ books: getBooksIndex() }));

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
}
