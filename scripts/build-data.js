/**
 * Скрипт сборки локальной библиотеки Библии.
 *
 *   1. Скачивает два перевода (RST и KJV) из открытого репозитория
 *      https://github.com/bibleapi/bibleapi-bibles-json
 *   2. Парсит исходные форматы (NDJSON для RST, классический resultset для KJV).
 *   3. Раскладывает каждый перевод по 66 файлам:
 *      data/rst/01-genesis.json, data/kjv/01-genesis.json и т.д.
 *   4. При наличии KYB.SQLite3 и sqlite3 в PATH — выгружает кыргызский KYB в data/kyb/.
 *   5. Создаёт сводный data/books.json со списком книг и количеством глав.
 *
 * Использование:
 *   node scripts/build-data.js
 *   node scripts/build-data.js --kyb-only   — только KYB + обновление books.json (RST/KJV уже есть)
 *
 * Скачанные исходники кэшируются в .cache/, повторный запуск не качает заново.
 */
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOKS, TRANSLATIONS, BY_ID } from '../server/books-meta.js';
import { exportKybToData, mergeBooksIndexWithKyb } from './kyb-export.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CACHE_DIR = join(ROOT, '.cache');
const DATA_DIR = join(ROOT, 'data');

const SOURCES = {
  // Полный Синодальный перевод (66 книг) — структурированный JSON,
  // проверенный gist с числовыми BookId, ChapterId, VerseId.
  rst: 'https://gist.githubusercontent.com/a1ip/0a5ec1b89e79b4490ef5992a80e72eeb/raw/rst.json',
  // KJV — классический формат resultset.row[].field из bibleapi.
  kjv: 'https://raw.githubusercontent.com/bibleapi/bibleapi-bibles-json/master/kjv.json'
};

/* ---------------------- Утилиты ---------------------- */

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

/** Скачивает URL в локальный файл с кэшированием. */
async function fetchCached(url, cachePath) {
  if (await exists(cachePath)) {
    process.stdout.write(`  [cache] ${cachePath}\n`);
    return readFile(cachePath, 'utf8');
  }
  process.stdout.write(`  [http]  ${url}\n`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось скачать ${url}: HTTP ${res.status}`);
  const text = await res.text();
  await ensureDir(dirname(cachePath));
  await writeFile(cachePath, text, 'utf8');
  return text;
}

/* ---------------------- Парсеры ---------------------- */

/**
 * RST в виде структурированного JSON:
 *   { Translation, Books: [{ BookId, Chapters: [{ ChapterId, Verses: [{ VerseId, Text }] }] }] }
 * Возвращает Map<bookId, Map<chapter, Array<{number, text}>>>.
 */
function parseRST(raw) {
  const data = JSON.parse(raw);
  const byBook = new Map();
  for (const book of data?.Books ?? []) {
    const meta = BY_ID.get(book.BookId);
    if (!meta) continue;
    const chapters = new Map();
    for (const ch of book.Chapters ?? []) {
      const verses = (ch.Verses ?? []).map(v => ({
        number: v.VerseId,
        text: String(v.Text || '').trim()
      }));
      if (verses.length) chapters.set(ch.ChapterId, verses);
    }
    if (chapters.size) byBook.set(meta.id, chapters);
  }
  return byBook;
}

/**
 * KJV формат: { resultset: { row: [{ field: [id, book, chapter, verse, text] }] } }.
 */
function parseKJV(raw) {
  const data = JSON.parse(raw);
  const rows = data?.resultset?.row || [];
  const byBook = new Map();
  for (const row of rows) {
    const f = row.field;
    if (!Array.isArray(f) || f.length < 5) continue;
    const [, bookNum, chapter, verse, text] = f;
    const meta = BY_ID.get(bookNum);
    if (!meta) continue;
    if (!byBook.has(meta.id)) byBook.set(meta.id, new Map());
    const chapters = byBook.get(meta.id);
    if (!chapters.has(chapter)) chapters.set(chapter, []);
    chapters.get(chapter).push({
      number: verse,
      text: String(text || '').trim()
    });
  }
  return byBook;
}

/* ---------------------- Запись на диск ---------------------- */

/**
 * Сохраняет одну книгу в её JSON-файл и возвращает мини-описание
 * для сводного индекса.
 */
/**
 * @param {null | { ru: string, ruFull: string }} displayNames — для KYB: кыргызские названия в файле книги; в индекс всё равно кладём русские ru + поля ky.
 */
async function writeBook(translationCode, meta, chaptersMap, displayNames = null) {
  const chapters = [...chaptersMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([number, verses]) => ({
      number,
      verses: verses
        .slice()
        .sort((a, b) => a.number - b.number)
    }));

  const ru = displayNames?.ru ?? meta.ru;
  const ruFull = displayNames?.ruFull ?? meta.ruFull;

  const out = {
    id: meta.id,
    slug: meta.slug,
    ru,
    ruFull,
    en: meta.en,
    abbr: meta.abbr,
    testament: meta.testament,
    translation: translationCode,
    chaptersCount: chapters.length,
    versesCount: chapters.reduce((s, c) => s + c.verses.length, 0),
    chapters
  };

  const dir = join(DATA_DIR, translationCode);
  await ensureDir(dir);
  await writeFile(
    join(dir, `${meta.slug}.json`),
    JSON.stringify(out, null, 0), // компактно — иначе ~30МБ на перевод
    'utf8'
  );

  return {
    id: meta.id,
    slug: meta.slug,
    ru: meta.ru,
    ruFull: meta.ruFull,
    en: meta.en,
    abbr: meta.abbr,
    testament: meta.testament,
    chaptersCount: out.chaptersCount,
    versesCount: out.versesCount,
    ky: displayNames ? displayNames.ru : undefined,
    kyFull: displayNames ? displayNames.ruFull : undefined
  };
}

/* ---------------------- Главный поток ---------------------- */

async function buildOne(code, parser) {
  console.log(`\n=== ${code.toUpperCase()} ===`);
  const cachePath = join(CACHE_DIR, `${code}.json`);
  const raw = await fetchCached(SOURCES[code], cachePath);
  const parsed = parser(raw);

  console.log(`  Распознано книг: ${parsed.size}`);
  if (parsed.size !== 66) {
    console.warn(`  ВНИМАНИЕ: ожидалось 66 книг, получено ${parsed.size}`);
  }

  const summary = [];
  for (const meta of BOOKS) {
    const chapters = parsed.get(meta.id);
    if (!chapters || chapters.size === 0) {
      console.warn(`  пропуск ${meta.id} ${meta.en}: нет данных`);
      continue;
    }
    const info = await writeBook(code, meta, chapters);
    summary.push(info);
  }
  console.log(`  Сохранено файлов: ${summary.length} в data/${code}/`);
  return summary;
}

async function main() {
  const KYB_ONLY = process.argv.includes('--kyb-only');

  if (KYB_ONLY) {
    console.log('Bible Presenter: только KYB из KYB.SQLite3');
    await ensureDir(DATA_DIR);
    try {
      const result = await exportKybToData(ROOT, { writeBook });
      if (!result.ok) {
        console.error('Файл KYB.SQLite3 не найден в корне проекта.');
        process.exit(1);
      }
      await mergeBooksIndexWithKyb(ROOT, result.summary);
      console.log('\nГотово: data/kyb/ и data/books.json обновлены.');
    } catch (err) {
      console.error(err.message || err);
      process.exit(1);
    }
    return;
  }

  console.log('Bible Presenter: сборка библиотеки');
  await ensureDir(DATA_DIR);

  const rstSummary = await buildOne('rst', parseRST);
  const kjvSummary = await buildOne('kjv', parseKJV);

  let kybSummary = null;
  console.log('\n=== KYB (локальный SQLite) ===');
  try {
    const result = await exportKybToData(ROOT, { writeBook });
    if (result.ok) kybSummary = result.summary;
    else console.log('  Пропуск — положите KYB.SQLite3 в корень проекта.');
  } catch (err) {
    console.warn(`  Пропуск KYB: ${err.message}`);
  }

  // Сводный индекс книг для фронта (RST + KJV + опционально KYB).
  const index = BOOKS.map(meta => {
    const r = rstSummary.find(b => b.id === meta.id);
    const kv = kjvSummary.find(b => b.id === meta.id);
    const ky = kybSummary?.find(b => b.id === meta.id);
    return {
      id: meta.id,
      slug: meta.slug,
      ru: meta.ru,
      ruFull: meta.ruFull,
      en: meta.en,
      abbr: meta.abbr,
      testament: meta.testament,
      chaptersCount: r?.chaptersCount ?? kv?.chaptersCount ?? ky?.chaptersCount ?? 0,
      ky: ky?.ky,
      kyFull: ky?.kyFull,
      versesCount: {
        rst: r?.versesCount ?? 0,
        kjv: kv?.versesCount ?? 0,
        kyb: ky?.versesCount ?? 0
      }
    };
  });

  await writeFile(
    join(DATA_DIR, 'books.json'),
    JSON.stringify({ translations: TRANSLATIONS, books: index }, null, 2),
    'utf8'
  );

  console.log('\nГотово. Структура:');
  console.log(`  data/books.json`);
  console.log(`  data/rst/  — ${rstSummary.length} файлов`);
  console.log(`  data/kjv/  — ${kjvSummary.length} файлов`);
  if (kybSummary) {
    console.log(`  data/kyb/  — ${kybSummary.length} файлов`);
  }
}

main().catch(err => {
  console.error('Ошибка сборки:', err);
  process.exit(1);
});
