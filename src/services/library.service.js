/**
 * In-memory загрузчик и поисковый индекс для библейской библиотеки.
 *
 *   load()                       — однократно подгружает всю библиотеку с диска.
 *   getBooksIndex()              — список 66 книг с метаданными.
 *   getBook(translation, id)     — полное содержимое книги.
 *   getChapter(translation, id, n) — одна глава.
 *   search(translation, query, limit) — подстрочный поиск по стихам.
 *
 * Поиск — простой substring (case-insensitive). На ~31к стихов × переводы
 * это занимает <100мс, не нужен ни Lunr, ни полнотекстовый индекс.
 */
import { readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOKS, TRANSLATIONS } from '../utils/books-meta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');

/** translation -> Map<bookId, bookObject> */
const cache = new Map();
let booksIndex = null;

/* ---------------------- Загрузка ---------------------- */

async function loadTranslation(code) {
  const map = new Map();
  for (const meta of BOOKS) {
    const path = join(DATA_DIR, code, `${meta.slug}.json`);
    try {
      const raw = await readFile(path, 'utf8');
      map.set(meta.id, JSON.parse(raw));
    } catch (err) {
      console.warn(`[library] не удалось загрузить ${path}: ${err.message}`);
    }
  }
  return map;
}

export async function load() {
  console.log('[library] загрузка библиотеки...');
  const t0 = Date.now();
  for (const t of TRANSLATIONS) {
    cache.set(t.code, await loadTranslation(t.code));
  }

  // Сводный индекс — берём из data/books.json, если есть, иначе из метаданных.
  try {
    const raw = await readFile(join(DATA_DIR, 'books.json'), 'utf8');
    booksIndex = JSON.parse(raw).books;
  } catch {
    booksIndex = BOOKS.map(b => ({
      id: b.id, slug: b.slug, ru: b.ru, ruFull: b.ruFull,
      en: b.en, abbr: b.abbr, testament: b.testament,
      chaptersCount: cache.get('rst')?.get(b.id)?.chaptersCount ?? 0
    }));
  }

  const stats = TRANSLATIONS.map(t => `${t.code}=${cache.get(t.code).size}`).join(', ');
  console.log(`[library] готово за ${Date.now() - t0}мс (${stats})`);
}

/* ---------------------- Чтение ---------------------- */

export function getTranslations() { return TRANSLATIONS; }
export function getBooksIndex()  { return booksIndex; }

export function getBook(translation, id) {
  return cache.get(translation)?.get(Number(id)) ?? null;
}

export function getChapter(translation, id, n) {
  const book = getBook(translation, id);
  if (!book) return null;
  const chapter = book.chapters.find(c => c.number === Number(n));
  if (!chapter) return null;
  const meta = BOOKS.find(b => b.id === Number(id));
  return {
    book: {
      id: book.id, slug: book.slug,
      ru: meta?.ru || book.ru,
      ruFull: meta?.ruFull || book.ruFull,
      en: meta?.en || book.en,
      abbr: meta?.abbr || book.abbr,
      testament: meta?.testament || book.testament,
      chaptersCount: book.chaptersCount
    },
    chapter: chapter.number,
    verses: chapter.verses.map(v => ({ ...v, text: cleanText(v.text) }))
  };
}

/* ---------------------- Поиск ---------------------- */

const REF_PATTERN = /^\s*([1-3]?\s*[\p{L}.-]+)\s*(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?\s*$/u;

function cleanText(text) {
  return text.replace(/<\/?[A-Za-z]>/g, '');
}

function indexBookLabel(book, translation) {
  if (translation === 'kyb' && book.ky) return book.ky;
  return book.ru;
}

/**
 * Пытается распознать строку вида "Иоанна 3:16", "John 3:16-17", "Псалом 22"
 * как навигационный запрос. Возвращает { book, chapter, verseFrom, verseTo } или null.
 */
function tryParseReference(query, translation) {
  const m = query.match(REF_PATTERN);
  if (!m) return null;
  const [, rawName, chapter, verseFrom, verseTo] = m;
  const norm = rawName.replace(/\s+/g, ' ').trim().toLowerCase();
  const book = booksIndex.find(b => {
    const ru = b.ru.toLowerCase();
    const en = b.en.toLowerCase();
    const ky = (b.ky || '').toLowerCase();
    const matchKy = translation === 'kyb' && ky
      && (ky === norm || ky.startsWith(norm) || norm.startsWith(ky));
    return matchKy
        || ru === norm || en === norm
        || ru.startsWith(norm) || en.startsWith(norm)
        || norm.startsWith(ru) || norm.startsWith(en);
  });
  if (!book) return null;
  const chapterObj = getChapter(translation, book.id, chapter);
  if (!chapterObj) return null;
  return {
    book,
    chapter: Number(chapter),
    verseFrom: verseFrom ? Number(verseFrom) : null,
    verseTo: verseTo ? Number(verseTo) : null,
    verses: chapterObj.verses
  };
}

/**
 * Поиск по тексту стихов.
 *   query       — строка пользователя
 *   translation — код перевода (rst, kyb, kjv, …)
 *   limit       — ограничение количества результатов
 * Возвращает { mode: 'reference'|'text', items: [...] }.
 */
export function search(translation, query, limit = 60) {
  const q = String(query || '').trim();
  if (!q) return { mode: 'text', items: [] };

  // 1) Сначала пробуем как ссылку
  const ref = tryParseReference(q, translation);
  if (ref) {
    const items = [];
    if (ref.verseFrom) {
      const from = ref.verseFrom;
      const to = ref.verseTo ?? ref.verseFrom;
      for (const v of ref.verses) {
        if (v.number >= from && v.number <= to) {
          const bl = indexBookLabel(ref.book, translation);
          items.push({
            bookId: ref.book.id,
            bookRu: bl,
            chapter: ref.chapter,
            verse: v.number,
            ref: `${bl} ${ref.chapter}:${v.number}`,
            text: cleanText(v.text)
          });
        }
      }
    } else {
      // Если указана только глава — отдаём все стихи главы
      for (const v of ref.verses) {
        const bl = indexBookLabel(ref.book, translation);
        items.push({
          bookId: ref.book.id,
          bookRu: bl,
          chapter: ref.chapter,
          verse: v.number,
          ref: `${bl} ${ref.chapter}:${v.number}`,
          text: cleanText(v.text)
        });
      }
    }
    return { mode: 'reference', items: items.slice(0, limit) };
  }

  // 2) Иначе — substring search по тексту всех стихов
  const needle = q.toLowerCase();
  const items = [];
  const tr = cache.get(translation);
  if (!tr) return { mode: 'text', items: [] };

  outer:
  for (const [, book] of tr) {
    for (const ch of book.chapters) {
      for (const v of ch.verses) {
        if (v.text.toLowerCase().includes(needle)) {
          items.push({
            bookId: book.id,
            bookRu: book.ru,
            chapter: ch.number,
            verse: v.number,
            ref: `${book.ru} ${ch.number}:${v.number}`,
            text: cleanText(v.text)
          });
          if (items.length >= limit) break outer;
        }
      }
    }
  }

  return { mode: 'text', items };
}
