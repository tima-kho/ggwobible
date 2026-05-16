import { getSongs, getSong, searchSongs, addCustomSong, deleteSong, updateSong } from '../services/songs.service.js';
import { getAllSongFonts, setSongFont } from '../services/songs-fonts.service.js';

export async function songsRoutes(fastify) {
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

  fastify.get('/api/songs-fonts', async () => getAllSongFonts());

  fastify.patch('/api/songs/:id/font', async (req, reply) => {
    const { fontId, fontSize } = req.body || {};
    if (!fontId || fontSize == null) return reply.code(400).send({ error: 'fontId and fontSize required' });
    const result = await setSongFont(req.params.id, fontId, Number(fontSize));
    return result;
  });
}
