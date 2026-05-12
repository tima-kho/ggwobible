import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function normalizeWhitespace(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\[\s*СЛАЙД\s*\]/gi, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeTitle(text) {
  return String(text || '')
    .replace(/\r\n?/g, ' ')
    .replace(/[\\/*_`#]/g, ' ')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleLookupKey(text) {
  return normalizeTitle(text)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lyricsHashKey(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s\n]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstNonEmptyLine(lyrics) {
  return normalizeWhitespace(lyrics)
    .split('\n')
    .map(x => x.trim())
    .find(Boolean) || '';
}

function normalizeLineKey(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitToMeaningfulLines(text) {
  return normalizeWhitespace(text)
    .split('\n')
    .map(x => x.trim())
    .filter(Boolean);
}

function splitToParagraphs(text) {
  return normalizeWhitespace(text)
    .split(/\n{2,}/)
    .map(x => x.trim())
    .filter(Boolean);
}

function looksLikeMetaLine(line) {
  const t = normalizeLineKey(line);
  if (!t) return true;
  if (t.startsWith('http ') || t.startsWith('https ')) return true;
  if (t.includes('holychords')) return true;
  return false;
}

function looksLikeSongStartLine(line) {
  const t = normalizeLineKey(line);
  if (!t || t.length < 12) return false;
  if (t.startsWith('припев') || t.startsWith('куплет')) return false;
  const words = t.split(' ').filter(Boolean);
  if (words.length < 3) return false;
  return true;
}

/** Первые строки каждого абзаца — чтобы находить границы песен внутри «одной презентации». */
function collectParagraphStarters(entry) {
  const lyrics = entry.lyrics || '';
  const paras = splitToParagraphs(lyrics);
  if (paras.length >= 3 || lyrics.length >= 1600) {
    return paras.map(p => firstNonEmptyLine(p)).filter(Boolean);
  }
  const first = firstNonEmptyLine(lyrics) || firstNonEmptyLine(entry.title);
  return first ? [first] : [];
}

function countStarterLine(first, freq, prefixes) {
  if (!first || looksLikeMetaLine(first)) return;
  const t = normalizeLineKey(first);
  if (!t || t.length < 8) return;
  const words = t.split(' ').filter(Boolean);
  const okForDict =
    looksLikeSongStartLine(first) || (t.length >= 18 && words.length >= 4);
  if (!okForDict) return;
  freq.set(t, (freq.get(t) || 0) + 1);
  const prefix = words.slice(0, 4).join(' ');
  if (words.length >= 3) {
    prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
  }
}

function buildSongStartDictionary(entries) {
  const freq = new Map();
  const prefixes = new Map();
  for (const entry of entries) {
    for (const first of collectParagraphStarters(entry)) {
      countStarterLine(first, freq, prefixes);
    }
  }
  const starts = new Set();
  const startPrefixes = new Set();
  for (const [key, count] of freq) {
    if (count >= 2) starts.add(key);
  }
  for (const [key, count] of prefixes) {
    if (count >= 2) startPrefixes.add(key);
  }
  return { starts, startPrefixes };
}

function startsWithKnownSongPrefix(lineKey, startPrefixes) {
  const words = lineKey.split(' ').filter(Boolean);
  if (words.length < 3) return false;
  for (let n = Math.min(6, words.length); n >= 3; n -= 1) {
    const prefix = words.slice(0, n).join(' ');
    if (startPrefixes.has(prefix)) return true;
  }
  return false;
}

function splitLongMonolithicLyrics(lyrics, knownStarts, knownStartPrefixes) {
  const lines = splitToMeaningfulLines(lyrics).filter(line => !looksLikeMetaLine(line));
  if (lines.length < 26) return null;

  const chunks = [];
  let buf = [];
  const seenInChunk = new Set();

  const flushChunk = () => {
    const text = normalizeWhitespace(buf.join('\n'));
    const ml = splitToMeaningfulLines(text);
    if (text.length >= 45 && ml.length >= 4) chunks.push(text);
    buf = [];
    seenInChunk.clear();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const key = normalizeLineKey(line);
    const bufText = buf.join('\n');
    const known =
      knownStarts.has(key) || startsWithKnownSongPrefix(key, knownStartPrefixes);
    const weak = looksLikeSongStartLine(line);
    const minLines = known ? 8 : 16;
    const minChars = known ? 160 : 380;
    const splitHere =
      buf.length >= minLines &&
      bufText.length >= minChars &&
      (known || weak) &&
      !seenInChunk.has(key);

    if (splitHere) flushChunk();
    buf.push(line);
    if (key) seenInChunk.add(key);
  }
  flushChunk();

  return chunks.length >= 2 ? chunks : null;
}

function splitCompositeLyrics(lyrics, knownStarts, knownStartPrefixes) {
  const paragraphs = splitToParagraphs(lyrics)
    .map(p => splitToMeaningfulLines(p).filter(line => !looksLikeMetaLine(line)).join('\n'))
    .map(p => p.trim())
    .filter(Boolean);
  if (!paragraphs.length) return [lyrics];

  const chunks = [];
  let currentParas = [];
  const currentFirstLineKeys = new Set();
  for (let i = 0; i < paragraphs.length; i += 1) {
    const para = paragraphs[i];
    const line = firstNonEmptyLine(para);
    const key = normalizeLineKey(line);
    const currentLen = currentParas.length;
    const restLen = paragraphs.length - i;
    const looksLikeKnownStart =
      knownStarts.has(key) || startsWithKnownSongPrefix(key, knownStartPrefixes);
    const splitHere =
      currentLen >= 2 &&
      restLen >= 1 &&
      looksLikeKnownStart &&
      !currentFirstLineKeys.has(key);

    if (splitHere) {
      chunks.push(normalizeWhitespace(currentParas.join('\n\n')));
      currentParas = [];
      currentFirstLineKeys.clear();
    }
    currentParas.push(para);
    if (key) currentFirstLineKeys.add(key);
  }
  if (currentParas.length) chunks.push(normalizeWhitespace(currentParas.join('\n\n')));

  let cleaned = chunks.filter(
    part =>
      part && splitToMeaningfulLines(part).length >= 3 && part.length >= 50
  );
  if (!cleaned.length) {
    cleaned = [normalizeWhitespace(paragraphs.join('\n\n'))];
  }

  if (cleaned.length >= 2) return cleaned;

  const mono = splitLongMonolithicLyrics(lyrics, knownStarts, knownStartPrefixes);
  if (mono && mono.length >= 2) return mono;

  return cleaned;
}

/**
 * Канонический список названий: варианты до «/», до «(» и внутри скобок —
 * попадают в словарь границ песен и в подбор заголовка для каталога.
 */
function expandCanonicalTitles(canonicalStrings) {
  const keys = new Set();
  const prefixes = new Set();
  if (!Array.isArray(canonicalStrings)) return { keys, prefixes };
  for (const raw of canonicalStrings) {
    const line = String(raw || '').trim();
    if (!line) continue;
    for (const slashPart of line.split('/').map(s => s.trim()).filter(Boolean)) {
      const m = slashPart.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      const variants = m ? [m[1].trim(), m[2].trim()] : [slashPart];
      for (const v of variants) {
        const k = normalizeLineKey(v);
        if (k.length >= 8) keys.add(k);
        const words = k.split(' ').filter(Boolean);
        if (words.length >= 3) prefixes.add(words.slice(0, 4).join(' '));
        else if (words.length === 2 && k.length >= 10) prefixes.add(words.join(' '));
      }
    }
  }
  return { keys, prefixes };
}

/** Если первая строка текста совпадает с каноном — возвращаем строку из списка как название. */
function matchCanonicalCatalogTitle(firstLine, canonicalList) {
  const fl = titleLookupKey(firstLine);
  if (!fl || fl.length < 4) return null;
  let bestEntry = null;
  let bestVkLen = 0;
  for (const entry of canonicalList) {
    const variants = [];
    for (const slashPart of String(entry).split('/').map(s => s.trim()).filter(Boolean)) {
      const pm = slashPart.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (pm) {
        variants.push(pm[1].trim(), pm[2].trim());
      } else {
        variants.push(slashPart);
      }
    }
    for (const v of variants) {
      const vk = titleLookupKey(v);
      if (vk.length < 6) continue;
      const aligned =
        fl.startsWith(vk) ||
        vk.startsWith(fl.slice(0, Math.min(fl.length, vk.length + 3)));
      if (aligned && vk.length > bestVkLen) {
        bestVkLen = vk.length;
        bestEntry = entry.trim();
      }
    }
  }
  return bestEntry ? bestEntry.slice(0, 140) : null;
}

function splitCompositeEntries(entries, canonicalExpansion) {
  const { starts, startPrefixes } = buildSongStartDictionary(entries);
  if (canonicalExpansion) {
    for (const k of canonicalExpansion.keys) starts.add(k);
    for (const p of canonicalExpansion.prefixes) startPrefixes.add(p);
  }
  const out = [];
  for (const entry of entries) {
    const parts = splitCompositeLyrics(entry.lyrics, starts, startPrefixes);
    if (parts.length <= 1) {
      out.push(entry);
      continue;
    }
    for (let i = 0; i < parts.length; i += 1) {
      out.push({
        ...entry,
        sourceRef: `${entry.sourceRef}.part${i + 1}`,
        title: '',
        lyrics: parts[i]
      });
    }
  }
  return out;
}

function looksLikeDate(title) {
  return /^\d{6,8}$/.test(title) || /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(title);
}

function looksLikeFilename(title) {
  return /\.[a-z0-9]{2,5}$/i.test(title) || /presentation|презентаци/i.test(title);
}

function pickBestTitle(rawTitle, lyrics, canonicalList) {
  const firstLine = firstNonEmptyLine(lyrics);
  if (canonicalList?.length && firstLine) {
    const canon = matchCanonicalCatalogTitle(firstLine, canonicalList);
    if (canon) return canon;
  }
  const cleanedTitle = normalizeTitle(rawTitle);
  if (cleanedTitle && !looksLikeDate(cleanedTitle) && !looksLikeFilename(cleanedTitle) && cleanedTitle.length >= 4) {
    return cleanedTitle.slice(0, 140);
  }
  if (firstLine) return firstLine.slice(0, 140);
  return 'Без названия';
}

export function extractSongsFromJsonRaw(raw, canonicalExpansion) {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  const entries = parsed.map((row, i) => ({
    source: 'json',
    sourceRef: `songs_lyrics.json#${i + 1}`,
    title: normalizeTitle(row?.title || ''),
    lyrics: normalizeWhitespace(row?.lyrics || '')
  })).filter(x => x.lyrics);
  return splitCompositeEntries(entries, canonicalExpansion);
}

export function extractSongsFromMarkdownRaw(raw, canonicalExpansion) {
  const re = /^###\s+\\?---\s+ИЗ (?:ПРЕЗЕНТАЦИИ|ДОКУМЕНТА):\s*(.*?)\s*\\?---\s*$/gmi;
  const sections = [];
  const matches = [...raw.matchAll(re)];
  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    const title = normalizeTitle(current[1] || '');
    const from = current.index + current[0].length;
    const to = next ? next.index : raw.length;
    const lyrics = normalizeWhitespace(raw.slice(from, to));
    if (!lyrics) continue;
    sections.push({
      source: 'md',
      sourceRef: `щиыршызшыщл.md#${i + 1}`,
      title,
      lyrics
    });
  }
  return splitCompositeEntries(sections, canonicalExpansion);
}

function compactAliases(aliases, title) {
  const seen = new Set([titleLookupKey(title)]);
  const out = [];
  for (const alias of aliases) {
    const clean = normalizeTitle(alias);
    const key = titleLookupKey(clean);
    if (!clean || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(clean.slice(0, 140));
    if (out.length >= 10) break;
  }
  return out;
}

export function buildSongsCatalog({ jsonSongs, mdSongs, canonicalTitles }) {
  const all = [...jsonSongs, ...mdSongs];
  const byLyrics = new Map();
  const byIdentity = new Map();

  for (const item of all) {
    const lyrics = normalizeWhitespace(item.lyrics);
    if (!lyrics) continue;
    const hash = lyricsHashKey(lyrics);
    if (!hash || hash.length < 24) continue;

    const lines = splitToMeaningfulLines(lyrics);
    const first = normalizeLineKey(lines[0] || '');
    const second = normalizeLineKey(lines[1] || '');
    const identity = `${first}|${second}`;

    const mergeWith = (target, sourceItem, sourceLyrics) => {
      const newIsLonger = sourceLyrics.length > target.lyrics.length * 1.15;
      if (newIsLonger) target.lyrics = sourceLyrics;
      if (sourceItem.title && !target.titles.includes(sourceItem.title)) {
        target.titles.push(sourceItem.title);
      }
      if (!target.sources.some(s => s.ref === sourceItem.sourceRef)) {
        target.sources.push({ source: sourceItem.source, ref: sourceItem.sourceRef });
      }
    };

    const existing = byLyrics.get(hash);
    if (!existing) {
      const created = {
        lyrics,
        titles: [item.title],
        sources: [{ source: item.source, ref: item.sourceRef }]
      };
      byLyrics.set(hash, created);
      if (first) byIdentity.set(identity, created);
      continue;
    }

    mergeWith(existing, item, lyrics);
    if (first) byIdentity.set(identity, existing);
  }

  // Вторая волна дедупликации: одинаковое начало песни, но мелкие отличия текста.
  for (const item of all) {
    const lyrics = normalizeWhitespace(item.lyrics);
    if (!lyrics) continue;
    const lines = splitToMeaningfulLines(lyrics);
    const first = normalizeLineKey(lines[0] || '');
    const second = normalizeLineKey(lines[1] || '');
    if (!first) continue;
    const identity = `${first}|${second}`;
    const existing = byIdentity.get(identity);
    if (!existing) continue;
    if (existing.lyrics === lyrics) continue;
    const existingFirst = normalizeLineKey(firstNonEmptyLine(existing.lyrics));
    if (existingFirst !== first) continue;

    if (lyrics.length > existing.lyrics.length * 1.15) existing.lyrics = lyrics;
    if (item.title && !existing.titles.includes(item.title)) existing.titles.push(item.title);
    if (!existing.sources.some(s => s.ref === item.sourceRef)) {
      existing.sources.push({ source: item.source, ref: item.sourceRef });
    }
  }

  const songs = [...byLyrics.values()].map((item, i) => {
    const title = pickBestTitle(item.titles.find(Boolean), item.lyrics, canonicalTitles);
    const firstLine = firstNonEmptyLine(item.lyrics);
    const aliases = compactAliases(item.titles, title);
    return {
      id: `song-${String(i + 1).padStart(4, '0')}`,
      title,
      aliases,
      firstLine,
      lyrics: item.lyrics,
      sources: item.sources
    };
  });

  songs.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  songs.forEach((song, i) => {
    song.id = `song-${String(i + 1).padStart(4, '0')}`;
  });

  return songs;
}

export async function buildSongsCatalogFromRawFiles(rootDir) {
  const songsJsonPath = resolve(rootDir, 'songs_lyrics.json');
  const songsMdPath = resolve(rootDir, 'щиыршызшыщл.md');
  const canonicalPath = resolve(rootDir, 'data/canonical-song-titles.json');
  let canonicalTitles = [];
  try {
    const rawCanon = await readFile(canonicalPath, 'utf8');
    const parsed = JSON.parse(rawCanon);
    if (Array.isArray(parsed)) canonicalTitles = parsed.map(String);
  } catch {
    canonicalTitles = [];
  }
  const canonicalExpansion = expandCanonicalTitles(canonicalTitles);
  const [rawJson, rawMd] = await Promise.all([
    readFile(songsJsonPath, 'utf8'),
    readFile(songsMdPath, 'utf8')
  ]);
  const jsonSongs = extractSongsFromJsonRaw(rawJson, canonicalExpansion);
  const mdSongs = extractSongsFromMarkdownRaw(rawMd, canonicalExpansion);
  return buildSongsCatalog({ jsonSongs, mdSongs, canonicalTitles });
}
