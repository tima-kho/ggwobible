/**
 * Выгрузка кыргызского перевода KYB из KYB.SQLite3 в data/kyb/*.json
 * (тот же формат, что у RST/KJV). Нужен sqlite3 в PATH (macOS: встроен).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOKS, TRANSLATIONS } from '../server/books-meta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function sqlite3Json(dbPath, sql) {
  const r = spawnSync('sqlite3', [dbPath, '-json', sql], {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024
  });
  if (r.error) {
    if (r.error.code === 'ENOENT') {
      throw new Error(
        'Команда sqlite3 не найдена. Установите SQLite CLI или добавьте её в PATH.'
      );
    }
    throw r.error;
  }
  if (r.status !== 0) {
    throw new Error(r.stderr || `sqlite3 завершился с кодом ${r.status}`);
  }
  const out = (r.stdout || '').trim();
  if (!out) return [];
  return JSON.parse(out);
}

/**
 * @param {object} opts
 * @param {(code: string, meta: object, chaptersMap: Map, names?: { ru: string, ruFull: string }) => Promise<object>} opts.writeBook
 */
export async function exportKybToData(root, { writeBook }) {
  const dbPath = join(root, 'KYB.SQLite3');
  if (!existsSync(dbPath)) {
    return { ok: false, reason: 'no-db', summary: null };
  }

  const bookRows = sqlite3Json(
    dbPath,
    'SELECT book_number, short_name, long_name FROM books ORDER BY book_number'
  );
  if (bookRows.length !== 66) {
    console.warn(`  [kyb] ожидалось 66 книг в SQLite, получено ${bookRows.length}`);
  }

  const versesRows = sqlite3Json(
    dbPath,
    'SELECT book_number, chapter, verse, text FROM verses ORDER BY book_number, chapter, verse'
  );

  const mapBnToId = new Map();
  bookRows.forEach((row, i) => {
    if (i < BOOKS.length) mapBnToId.set(Number(row.book_number), BOOKS[i].id);
  });

  const byBookId = new Map();
  for (const meta of BOOKS) {
    byBookId.set(meta.id, new Map());
  }

  for (const row of versesRows) {
    const id = mapBnToId.get(Number(row.book_number));
    if (!id) continue;
    const chapters = byBookId.get(id);
    const ch = Number(row.chapter);
    const vs = Number(row.verse);
    if (!chapters.has(ch)) chapters.set(ch, []);
    chapters.get(ch).push({
      number: vs,
      text: String(row.text ?? '').trim()
    });
  }

  const summary = [];
  for (let i = 0; i < BOOKS.length; i++) {
    const meta = BOOKS[i];
    const br = bookRows[i];
    const chaptersMap = byBookId.get(meta.id);
    const names = br
      ? { ru: String(br.short_name || '').trim(), ruFull: String(br.long_name || '').trim() }
      : null;
    const info = await writeBook('kyb', meta, chaptersMap, names);
    summary.push(info);
  }

  console.log(`  [kyb] сохранено файлов: ${summary.length} в data/kyb/`);
  return { ok: true, summary };
}

/** Объединить сводный индекс: RST + KJV из текущего books.json + KYB. */
export async function mergeBooksIndexWithKyb(root, kybSummary) {
  const dataDir = join(root, 'data');
  const path = join(dataDir, 'books.json');
  const raw = await readFile(path, 'utf8');
  const data = JSON.parse(raw);

  const rById = new Map(data.books.map(b => [b.id, b]));
  const index = BOOKS.map(meta => {
    const base = rById.get(meta.id);
    const k = kybSummary.find(x => x.id === meta.id);
    return {
      id: meta.id,
      slug: meta.slug,
      ru: base.ru,
      ruFull: base.ruFull,
      en: base.en,
      abbr: meta.abbr,
      testament: meta.testament,
      chaptersCount: base.chaptersCount ?? k?.chaptersCount ?? 0,
      ky: k?.ky,
      kyFull: k?.kyFull,
      versesCount: {
        ...base.versesCount,
        kyb: k?.versesCount ?? 0
      }
    };
  });

  await writeFile(
    join(dataDir, 'books.json'),
    JSON.stringify({ translations: TRANSLATIONS, books: index }, null, 2),
    'utf8'
  );
}
