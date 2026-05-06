/**
 * Bible Presenter — клиентская часть.
 *
 * Один JS-файл, два режима:
 *   - чистый URL          → renderAdmin()  (панель управления)
 *   - ?mode=screen        → renderScreen() (экран проектора)
 *
 * Синхронизация через localStorage:
 *   v_text       — текст стиха
 *   v_ref        — ссылка ("Иоанна 3:16")
 *   v_translation— код перевода для подписи на экране
 *   trigger      — Date.now(), чтобы 'storage' срабатывал при повторном клике
 */

/* =========================================================
   Хелперы
   ========================================================= */
const KEYS = {
  TEXT: 'v_text',
  REF:  'v_ref',
  TRANS:'v_translation',
  TRIGGER: 'trigger'
};

function pushVerse({ text, ref, translation }) {
  localStorage.setItem(KEYS.TEXT, text);
  localStorage.setItem(KEYS.REF, ref);
  localStorage.setItem(KEYS.TRANS, translation || '');
  localStorage.setItem(KEYS.TRIGGER, String(Date.now()));
}

function clearVerse() {
  localStorage.setItem(KEYS.TEXT, '');
  localStorage.setItem(KEYS.REF, '');
  localStorage.setItem(KEYS.TRANS, '');
  localStorage.setItem(KEYS.TRIGGER, String(Date.now()));
}

function readVerse() {
  return {
    text:        localStorage.getItem(KEYS.TEXT) || '',
    ref:         localStorage.getItem(KEYS.REF) || '',
    translation: localStorage.getItem(KEYS.TRANS) || ''
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Убирает встроенные метки вида (23:1) или (22:10–12) из русской Псалтири (РСТ).
 */
function stripRstPsalmInlineMarkers(text) {
  return String(text || '').replace(/\(\d+:\d+(?:[–-]\d+)?\)\s*/g, '');
}

/** РСТ и KYB: одна и та же синодальная сетка и отображение Псалтири (не как KJV). */
function usesSynodalPsalmGrid(trans) {
  return trans === 'rst' || trans === 'kyb';
}

/**
 * Масоретская глава + стих (как в JSON / KJV) → «синодальная» глава и стих для подписей РСТ.
 * Источники данных хранят одну сетку глав (MT); в печатном СП нумерация псалмов иная.
 */
function mtPsalmToSynodalChapterVerse(mt, verse) {
  const v = Number(verse);
  if (mt <= 8) return { ch: mt, v };
  if (mt === 9) return { ch: 9, v };
  if (mt === 10) return { ch: 9, v: 20 + v };
  if (mt <= 113) return { ch: mt - 1, v };
  if (mt === 114) return { ch: 113, v };
  if (mt === 115) return { ch: 113, v: 8 + v };
  if (mt === 116) {
    if (v <= 9) return { ch: 114, v };
    return { ch: 115, v: v - 9 };
  }
  if (mt <= 146) return { ch: mt - 1, v };
  if (mt === 147) {
    if (v <= 11) return { ch: 146, v };
    return { ch: 147, v: v - 11 };
  }
  return { ch: mt, v };
}

function formatPsalmReaderTitle(trans, book, mtChapter, rstSynodal) {
  if (book.id !== 19) {
    const full = trans === 'kyb' && book.kyFull ? book.kyFull : book.ruFull;
    return `${full}, глава ${mtChapter}`;
  }
  const fullPs = trans === 'kyb' && book.kyFull ? book.kyFull : book.ruFull;
  if (usesSynodalPsalmGrid(trans) && rstSynodal != null) {
    return `${fullPs}, псалом ${rstSynodal}`;
  }
  if (usesSynodalPsalmGrid(trans)) {
    const { ch } = mtPsalmToSynodalChapterVerse(mtChapter, 1);
    return `${fullPs}, псалом ${ch}`;
  }
  if (trans === 'kjv') {
    return `${book.en} ${mtChapter}`;
  }
  return `${book.ruFull}, глава ${mtChapter}`;
}

/** Короткое имя книги и ссылка «книга глава:стих» для превью и проектора. */
function formatVerseRef(trans, book, mtChapter, verseNum, verseRow) {
  if (book.id !== 19) {
    const label = trans === 'kyb' && book.ky ? book.ky : book.ru;
    return `${label} ${mtChapter}:${verseNum}`;
  }
  if (usesSynodalPsalmGrid(trans) && verseRow?._src) {
    const { ch, v } = mtPsalmToSynodalChapterVerse(verseRow._src.mt, verseRow._src.v);
    const label = trans === 'kyb' && book.ky ? book.ky : book.ru;
    return `${label} ${ch}:${v}`;
  }
  if (usesSynodalPsalmGrid(trans)) {
    const { ch, v } = mtPsalmToSynodalChapterVerse(mtChapter, verseNum);
    const label = trans === 'kyb' && book.ky ? book.ky : book.ru;
    return `${label} ${ch}:${v}`;
  }
  if (trans === 'kjv') {
    return `${book.en} ${mtChapter}:${verseNum}`;
  }
  const label = trans === 'kyb' && book.ky ? book.ky : book.ru;
  return `${label} ${mtChapter}:${verseNum}`;
}

/** Текст стиха для отображения и проектора: без дублирующих скобок в Псалтири РСТ/KYB. */
function verseTextForDisplay(trans, bookId, rawText) {
  if (usesSynodalPsalmGrid(trans) && bookId === 19) {
    return stripRstPsalmInlineMarkers(rawText);
  }
  return rawText;
}

/** Номер псалма на сетке слева (1…150) для РСТ по позиции MT + стиха. */
function mtToRstSynodalTile(mt, verse) {
  return mtPsalmToSynodalChapterVerse(mt, verse).ch;
}

/**
 * Как загрузить один «псалом» в синодальной нумерации из файлов с масоретскими главами.
 * kind: single — одна MT-глава; merge — несколько подряд; slice — часть одной MT-главы.
 */
function synodalToLoadSpec(syn) {
  const s = Number(syn);
  if (s < 1 || s > 150) return null;
  if (s <= 8) return { kind: 'single', mt: s };
  if (s === 9) return { kind: 'merge', mts: [9, 10] };
  if (s <= 112) return { kind: 'single', mt: s + 1 };
  if (s === 113) return { kind: 'merge', mts: [114, 115] };
  if (s === 114) return { kind: 'slice', mt: 116, vFrom: 1, vTo: 9 };
  if (s === 115) return { kind: 'slice', mt: 116, vFrom: 10, vTo: 19 };
  if (s <= 145) return { kind: 'single', mt: s + 1 };
  if (s === 146) return { kind: 'slice', mt: 147, vFrom: 1, vTo: 11 };
  if (s === 147) return { kind: 'slice', mt: 147, vFrom: 12, vTo: 20 };
  return { kind: 'single', mt: s };
}

function debounce(fn, ms) {
  let t = null;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* =========================================================
   Разбиение длинных стихов на «слайды»
   =========================================================
   Для проектора нужен крупный читаемый шрифт.
   Длинный стих (типа Иоанна 6:51 или Откровение 21:18-21) не помещается
   в экран при таком кегле, поэтому режем его на куски.

   Алгоритм:
     1. Если длина <= MAX — возвращаем один кусок.
     2. Иначе пробуем нарезать по концам предложений (. ! ? ;).
     3. Если самый длинный кусок всё ещё > MAX — режем по запятым.
     4. Если и этого мало — режем по словам.
     В каждом случае пакуем токены жадно, чтобы куски выходили
     максимально близкими по длине.
   ========================================================= */
const MAX_PAGE_CHARS = 180;

function splitVerseIntoPages(text, maxLen = MAX_PAGE_CHARS) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return [clean];

  const seps = [
    /([.!?]+\s+)/g,  // конец предложения
    /([;]\s+)/g,     // точка с запятой
    /(,\s+)/g,       // запятая
    /(\s+)/g         // любой пробел (жёсткий fallback)
  ];

  for (const sep of seps) {
    const tokens = clean.split(sep).filter(Boolean);
    const pages  = packGreedy(tokens, maxLen);
    if (pages.every(p => p.length <= maxLen)) return pages;
  }

  return [clean];
}

function packGreedy(tokens, maxLen) {
  const pages = [];
  let buf = '';
  for (const t of tokens) {
    if ((buf + t).length <= maxLen) {
      buf += t;
    } else {
      if (buf.trim()) pages.push(buf.trim());
      buf = t.trimStart();
    }
  }
  if (buf.trim()) pages.push(buf.trim());
  return pages;
}

function splitSongIntoSlides(text, maxLen = 280) {
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) return [];
  const stanzas = raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const slides = [];

  for (const stanza of stanzas) {
    if (stanza.length <= maxLen) {
      slides.push(stanza);
      continue;
    }
    const lines = stanza.split('\n').map(x => x.trim()).filter(Boolean);
    const joined = [];
    let buf = '';
    for (const line of lines) {
      if (!buf) {
        buf = line;
        continue;
      }
      if ((buf + '\n' + line).length <= maxLen) {
        buf += `\n${line}`;
      } else {
        joined.push(buf);
        buf = line;
      }
    }
    if (buf) joined.push(buf);

    for (const chunk of joined) {
      if (chunk.length <= maxLen) slides.push(chunk);
      else slides.push(...splitVerseIntoPages(chunk, maxLen));
    }
  }

  return slides.length ? slides : splitVerseIntoPages(raw, maxLen);
}

async function api(path, options = undefined) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

/* =========================================================
   Роутер
   ========================================================= */
const mode = new URLSearchParams(location.search).get('mode');

if (mode === 'screen') renderScreen();
else if (mode === 'songs') renderSongs();
else renderAdmin();

/* =========================================================
   АДМИН-ПАНЕЛЬ
   ========================================================= */
async function renderAdmin() {
  document.title = 'Великая Благодать — Панель управления';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand">
            <h1>Великая Благодать</h1>
            <span class="ver">админ</span>
          </div>
          <p>Полная Библия. Поиск и презентация на проектор.</p>
        </div>

        <div class="translation-switch" id="trans"></div>

        <div class="tabs">
          <button data-tab="search" class="active">Поиск</button>
          <button data-tab="books">Книги</button>
          <a href="?mode=songs" class="tab-songs-link">Песни</a>
        </div>

        <div class="tab-pane" id="pane-search">
          <div class="search-wrap">
            <input
              id="search"
              class="search-input"
              type="text"
              placeholder="Поиск по тексту или ссылке (напр. Иоанна 3:16)"
              autocomplete="off"
              spellcheck="false">
          </div>
          <div class="search-meta" id="search-meta"></div>
          <div id="results" class="scroll"></div>
        </div>

        <div class="tab-pane" id="pane-books" style="display:none;">
          <div id="books-view"></div>
        </div>
      </aside>

      <main class="main">
        <div class="toolbar">
          <div>
            <h2>Предпросмотр</h2>
            <div class="status" id="status">Экран не открыт · ↑↓ — главы, ←→ — стихи и слайды</div>
          </div>
          <div class="actions">
            <button id="btn-clear" class="btn btn-danger">Очистить экран</button>
            <button id="btn-pip"   class="btn btn-secondary" title="Плавающее окно поверх всех окон (Chrome/Edge 116+)">Поверх окон</button>
            <button id="btn-open"  class="btn btn-primary">Открыть экран ТВ</button>
          </div>
        </div>

        <div class="preview-wrap">
          <div class="preview">
            <div id="preview-stage" class="stage hidden">
              <div id="preview-text" class="text"></div>
              <div id="preview-ref"  class="ref"></div>
            </div>
            <div id="preview-placeholder" class="placeholder">Экран пуст</div>
          </div>
        </div>

        <section class="reader" id="reader">
          <header class="reader-head" id="reader-head">
            <div>
              <div class="title" id="reader-title">Выберите главу</div>
              <div class="sub"   id="reader-sub">Слева в табе «Книги» или через поиск</div>
            </div>
            <div class="nav">
              <button id="btn-prev-chapter" title="Предыдущая глава (↑)" disabled>↑</button>
              <button id="btn-next-chapter" title="Следующая глава (↓)" disabled>↓</button>
            </div>
          </header>
          <div class="reader-body" id="reader-body">
            <div class="reader-empty">
              Нажмите на номер любого стиха в тексте — и он отправится на проектор.<br>
              Стрелки на клавиатуре: <b>↑/↓</b> — главы, <b>←/→</b> — стихи.
            </div>
          </div>
        </section>
      </main>
    </div>
  `;

  /* ----- состояние ----- */
  const state = {
    translation: localStorage.getItem('ui_translation') || 'rst',
    tab: 'search',
    booksIndex: [],
    activeRef: null,
    nav: { bookId: null },         // в сайдбаре: null = список книг, id = список глав
    currentChapter: null,          // { book, chapter, verses } — что показано в reader
    activeVerseNumber: null,       // подсвеченный/последний отправленный стих
    activeVersePages:    [],       // [str, str, ...] — стих, разбитый на «слайды»
    activeVersePageIndex: 0,       // текущий слайд (0..pages.length-1)
    screenWindow: null,
    pipWindow:   null,
    pipUpdate:   null              // прямой колбэк в PiP, минуя localStorage
  };

  /* ----- ссылки на узлы ----- */
  const $ = id => document.getElementById(id);
  const els = {
    trans:        $('trans'),
    search:       $('search'),
    searchMeta:   $('search-meta'),
    results:      $('results'),
    paneSearch:   $('pane-search'),
    paneBooks:    $('pane-books'),
    booksView:    $('books-view'),
    stage:        $('preview-stage'),
    text:         $('preview-text'),
    ref:          $('preview-ref'),
    placeholder:  $('preview-placeholder'),
    btnOpen:      $('btn-open'),
    btnPip:       $('btn-pip'),
    btnClear:     $('btn-clear'),
    status:       $('status'),
    readerTitle:  $('reader-title'),
    readerSub:    $('reader-sub'),
    readerBody:   $('reader-body'),
    btnPrevCh:    $('btn-prev-chapter'),
    btnNextCh:    $('btn-next-chapter')
  };

  /** Имена книг в списке слева: для KYB — кыргызские подписи из индекса. */
  function bookShort(b) {
    return state.translation === 'kyb' && b.ky ? b.ky : b.ru;
  }
  function bookFull(b) {
    return state.translation === 'kyb' && b.kyFull ? b.kyFull : b.ruFull;
  }

  /* ----- загрузка данных ----- */
  let translations = [];
  try {
    [{ translations }, { books: state.booksIndex }] = await Promise.all([
      api('/api/translations'),
      api('/api/books')
    ]);
  } catch (err) {
    els.results.innerHTML = `<div class="empty">Ошибка загрузки: ${escapeHtml(err.message)}</div>`;
    return;
  }

  /* ----- рендер переключателя переводов ----- */
  function renderTranslations() {
    els.trans.innerHTML = translations.map(t => `
      <button data-code="${t.code}" class="${t.code === state.translation ? 'active' : ''}">
        ${escapeHtml(t.shortName)} · ${escapeHtml(t.name)}
      </button>
    `).join('');
    els.trans.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        const prevTrans = state.translation;
        const prevCh      = state.currentChapter;
        const prevActive  = state.activeVerseNumber;

        state.translation = b.dataset.code;
        localStorage.setItem('ui_translation', state.translation);
        renderTranslations();
        if (state.tab === 'search') runSearch();
        else renderBooksView();

        if (!prevCh) return;

        (async () => {
          const bId = prevCh.book.id;
          if (bId === 19) {
            if (usesSynodalPsalmGrid(state.translation)) {
              if (usesSynodalPsalmGrid(prevTrans)) {
                await loadChapter(19, prevCh.rstSynodal ?? 1, { scroll: false });
              } else {
                const v = prevActive ?? prevCh.verses[0]?.number ?? 1;
                const syn = mtToRstSynodalTile(prevCh.chapter, v);
                await loadChapter(19, syn, { scroll: false });
              }
            } else {
              const mt = usesSynodalPsalmGrid(prevTrans)
                ? (prevCh.primaryMt ?? prevCh.chapter)
                : prevCh.chapter;
              await loadChapter(19, mt, { scroll: false, fromMt: true });
            }
          } else {
            await loadChapter(bId, prevCh.chapter, { scroll: false });
          }

          if (!prevActive) return;
          const hit = state.currentChapter.verses.find(x => x.number === prevActive);
          if (hit) pickVerse(prevActive);
          else {
            const last = state.currentChapter.verses.at(-1)?.number;
            if (last != null) pickVerse(last);
          }
        })();
      });
    });
  }

  /* ----- табы ----- */
  document.querySelectorAll('.tabs button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state.tab = b.dataset.tab;
      els.paneSearch.style.display = state.tab === 'search' ? '' : 'none';
      els.paneBooks.style.display  = state.tab === 'books'  ? '' : 'none';
      if (state.tab === 'books') renderBooksView();
    });
  });

  /* ----- поиск ----- */
  const runSearch = debounce(async () => {
    const q = els.search.value.trim();
    if (!q) {
      els.results.innerHTML = '';
      els.searchMeta.textContent = 'Подсказка: введите слово или ссылку «Иоанна 3:16»';
      return;
    }
    els.searchMeta.textContent = 'Поиск...';
    try {
      const data = await api(
        `/api/search?translation=${encodeURIComponent(state.translation)}` +
        `&q=${encodeURIComponent(q)}&limit=80`
      );
      renderResults(data);
    } catch (err) {
      els.results.innerHTML = `<div class="empty">Ошибка: ${escapeHtml(err.message)}</div>`;
    }
  }, 180);

  els.search.addEventListener('input', runSearch);

  function renderResults({ items, mode }) {
    if (!items.length) {
      els.searchMeta.textContent = 'Ничего не найдено';
      els.results.innerHTML = '<div class="empty">Попробуйте другой запрос</div>';
      return;
    }
    els.searchMeta.textContent =
      `${mode === 'reference' ? 'Найдено по ссылке' : 'Найдено по тексту'}: ${items.length}`;

    els.results.innerHTML = items.map((it, i) => {
      const book = state.booksIndex.find(b => b.id === it.bookId);
      const usePsalmRef = book && it.bookId === 19
        && (usesSynodalPsalmGrid(state.translation) || state.translation === 'kjv');
      const refShown = usePsalmRef
        ? formatVerseRef(state.translation, book, it.chapter, it.verse)
        : it.ref;
      const textShown = usesSynodalPsalmGrid(state.translation) && it.bookId === 19
        ? stripRstPsalmInlineMarkers(it.text)
        : it.text;
      const isActive = refShown === state.activeRef || it.ref === state.activeRef;
      return `
      <button class="card ${isActive ? 'active' : ''}"
              data-i="${i}">
        <div class="ref">${escapeHtml(refShown)}</div>
        <div class="text">${escapeHtml(textShown)}</div>
      </button>`;
    }).join('');

    els.results.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', async () => {
        const it = items[Number(card.dataset.i)];
        await loadChapter(it.bookId, it.chapter, {
          scroll: false,
          fromMt: it.bookId === 19
        });
        pickVerse(it.verse);
      });
    });
  }

  /* ----- таб «Книги»: только два уровня — книги → главы.
         Сами стихи показываются в reader справа. ----- */
  function renderBooksView() {
    if (!state.nav.bookId) return renderBooksList();
    return renderChaptersList(state.nav.bookId);
  }

  function renderBreadcrumbs(parts) {
    return `
      <div class="breadcrumbs">
        <button data-go="root">Все книги</button>
        ${parts.map(p => `
          <span class="sep">/</span>
          <span class="current">${escapeHtml(p.label)}</span>
        `).join('')}
      </div>
    `;
  }

  function bindBreadcrumbs() {
    els.booksView.querySelectorAll('[data-go]').forEach(b => {
      b.addEventListener('click', () => {
        if (b.dataset.go === 'root') state.nav = { bookId: null };
        renderBooksView();
      });
    });
  }

  function renderBooksList() {
    const ot = state.booksIndex.filter(b => b.testament === 'OT');
    const nt = state.booksIndex.filter(b => b.testament === 'NT');
    const tile = b =>
      `<button class="book-tile ${state.currentChapter?.book?.id === b.id ? 'active' : ''}"
               data-id="${b.id}" title="${escapeHtml(bookFull(b))}">
         ${escapeHtml(bookShort(b))}
       </button>`;
    els.booksView.innerHTML = `
      <div class="section-title">Ветхий Завет · ${ot.length} книг</div>
      <div class="book-grid">${ot.map(tile).join('')}</div>
      <div class="section-title">Новый Завет · ${nt.length} книг</div>
      <div class="book-grid">${nt.map(tile).join('')}</div>
    `;
    els.booksView.querySelectorAll('.book-tile').forEach(t => {
      t.addEventListener('click', () => {
        state.nav.bookId = Number(t.dataset.id);
        renderBooksView();
      });
    });
  }

  function renderChaptersList(bookId) {
    const book = state.booksIndex.find(b => b.id === bookId);
    if (!book) return renderBooksList();

    const rstPsalms =
      bookId === 19 && usesSynodalPsalmGrid(state.translation);

    if (rstPsalms) {
      const activeSyn =
        state.currentChapter?.book?.id === 19
          ? state.currentChapter.rstSynodal
          : null;
      const tiles = Array.from({ length: 150 }, (_, i) => i + 1)
        .map(n => `
        <button type="button"
                class="chapter-tile ${n === activeSyn ? 'active' : ''}"
                data-syn="${n}">
          ${n}
        </button>`).join('');
      els.booksView.innerHTML = `
      ${renderBreadcrumbs([{ label: bookShort(book) }])}
      <div class="section-title">${escapeHtml(bookFull(book))} · 150 псалмов (нумерация как в СП)</div>
      <div class="chapter-grid">${tiles}</div>
    `;
      bindBreadcrumbs();
      els.booksView.querySelectorAll('.chapter-tile').forEach(t => {
        t.addEventListener('click', () => {
          loadChapter(bookId, Number(t.dataset.syn), { scroll: true });
        });
      });
      return;
    }

    const activeCh = state.currentChapter?.book?.id === bookId
      ? state.currentChapter.chapter : null;
    const tiles = Array.from({ length: book.chaptersCount }, (_, i) => i + 1)
      .map(n => `
        <button type="button"
                class="chapter-tile ${n === activeCh ? 'active' : ''}" data-n="${n}">
          ${n}
        </button>`).join('');
    els.booksView.innerHTML = `
      ${renderBreadcrumbs([{ label: bookShort(book) }])}
      <div class="section-title">${escapeHtml(bookFull(book))} · ${book.chaptersCount} глав</div>
      <div class="chapter-grid">${tiles}</div>
    `;
    bindBreadcrumbs();
    els.booksView.querySelectorAll('.chapter-tile').forEach(t => {
      t.addEventListener('click', () => {
        loadChapter(bookId, Number(t.dataset.n), { scroll: true });
      });
    });
  }

  /* ----- выбор стиха и предпросмотр ----- */
  function selectVerse({ ref, text }) {
    state.activeRef = ref;
    pushVerse({ ref, text, translation: state.translation });
    updatePreview(text, ref);
    if (state.pipUpdate) state.pipUpdate(text, ref);
    document.querySelectorAll('.card').forEach(c => {
      c.classList.toggle('active', c.dataset.ref === ref);
    });
  }

  /* ----- READER: загрузка и отрисовка главы со стихами-ссылками ----- */

  function mapRstPsalmVersesWithSrc(mt, verses) {
    return verses.map(v => ({
      number: v.number,
      text: v.text,
      _src: { mt, v: v.number }
    }));
  }

  /**
   * Псалтирь РСТ/KYB: chapter = номер псалма 1…150 по синодали (сетка слева), если fromMt !== true.
   * fromMt: true — chapter — масоретская глава (поиск, переключение с KJV).
   */
  async function loadRstSynodalFromSpec(syn, opts) {
    const spec = synodalToLoadSpec(syn);
    if (!spec) {
      els.readerBody.innerHTML = '<div class="reader-empty">Нет такого псалма</div>';
      return;
    }
    const tr = state.translation;
    if (spec.kind === 'single') {
      const data = await api(
        `/api/books/19/chapters/${spec.mt}?translation=${tr}`
      );
      state.currentChapter = {
        book: data.book,
        chapter: data.chapter,
        verses: mapRstPsalmVersesWithSrc(data.chapter, data.verses),
        rstSynodal: syn,
        primaryMt: spec.mt
      };
    } else if (spec.kind === 'merge') {
      const parts = await Promise.all(
        spec.mts.map(mt =>
          api(`/api/books/19/chapters/${mt}?translation=${tr}`)
        )
      );
      let num = 0;
      const verses = [];
      for (let i = 0; i < spec.mts.length; i++) {
        const mt = spec.mts[i];
        for (const v of parts[i].verses) {
          num += 1;
          verses.push({
            number: num,
            text: v.text,
            _src: { mt, v: v.number }
          });
        }
      }
      state.currentChapter = {
        book: parts[0].book,
        chapter: spec.mts[0],
        verses,
        rstSynodal: syn,
        primaryMt: spec.mts[0]
      };
    } else {
      const data = await api(
        `/api/books/19/chapters/${spec.mt}?translation=${tr}`
      );
      const filtered = data.verses.filter(
        v => v.number >= spec.vFrom && v.number <= spec.vTo
      );
      const verses = filtered.map((v, i) => ({
        number: i + 1,
        text: v.text,
        _src: { mt: spec.mt, v: v.number }
      }));
      state.currentChapter = {
        book: data.book,
        chapter: data.chapter,
        verses,
        rstSynodal: syn,
        primaryMt: spec.mt
      };
    }
    state.activeVerseNumber   = null;
    state.activeVersePages     = [];
    state.activeVersePageIndex = 0;
    renderReader();
    if (state.tab === 'books') renderBooksView();
  }

  async function loadChapter(bookId, chapter, opts = {}) {
    const fromMt = opts.fromMt === true;
    const book = state.booksIndex.find(b => b.id === bookId);
    if (!book) return;
    els.readerTitle.textContent = bookFull(book);
    els.readerSub.textContent   = `Глава ${chapter} · загрузка...`;
    els.readerBody.innerHTML    = '<div class="reader-empty">Загрузка...</div>';

    if (bookId === 19 && usesSynodalPsalmGrid(state.translation) && !fromMt) {
      const syn = Number(chapter);
      try {
        await loadRstSynodalFromSpec(syn, opts);
      } catch (err) {
        els.readerBody.innerHTML =
          `<div class="reader-empty">Ошибка: ${escapeHtml(err.message)}</div>`;
      }
      return;
    }

    let data;
    try {
      data = await api(
        `/api/books/${bookId}/chapters/${chapter}` +
        `?translation=${encodeURIComponent(state.translation)}`
      );
    } catch (err) {
      els.readerBody.innerHTML =
        `<div class="reader-empty">Ошибка: ${escapeHtml(err.message)}</div>`;
      return;
    }

    const rstSyn =
      bookId === 19 && usesSynodalPsalmGrid(state.translation)
        ? mtToRstSynodalTile(data.chapter, data.verses[0]?.number ?? 1)
        : null;
    const verses =
      bookId === 19 && usesSynodalPsalmGrid(state.translation)
        ? mapRstPsalmVersesWithSrc(data.chapter, data.verses)
        : data.verses;

    state.currentChapter = {
      book: data.book,
      chapter: data.chapter,
      verses,
      rstSynodal: rstSyn,
      primaryMt: data.chapter                 // для перехода РСТ → другие переводы
    };
    state.activeVerseNumber   = null;
    state.activeVersePages    = [];
    state.activeVersePageIndex = 0;

    renderReader();

    if (state.tab === 'books') renderBooksView();
  }

  function renderReader() {
    const ch = state.currentChapter;
    if (!ch) return;
    els.readerTitle.textContent = formatPsalmReaderTitle(
      state.translation,
      ch.book,
      ch.chapter,
      ch.rstSynodal
    );
    els.readerSub.textContent   =
      `${ch.verses.length} стих${ch.verses.length === 1 ? '' :
        ch.verses.length < 5 ? 'а' : 'ов'}`;

    els.readerBody.innerHTML = ch.verses.map(v => {
      const shown = verseTextForDisplay(state.translation, ch.book.id, v.text);
      return `
      <span class="v ${v.number === state.activeVerseNumber ? 'active' : ''}"
            data-n="${v.number}">
        <a class="vnum" data-n="${v.number}" title="Отправить на экран">${v.number}</a>${escapeHtml(shown)}
      </span> `;
    }).join('');

    els.readerBody.querySelectorAll('.vnum').forEach(a => {
      a.addEventListener('click', () => pickVerse(Number(a.dataset.n)));
    });

    renderReaderActiveDecorations();
    updateChapterNavButtons();
  }

  /* ----- Выбор стиха с разбиением на «слайды» ----- */
  function pickVerse(n) {
    const ch = state.currentChapter;
    if (!ch) return;
    const v = ch.verses.find(x => x.number === n);
    if (!v) return;
    state.activeVerseNumber   = n;
    const displayText = verseTextForDisplay(state.translation, ch.book.id, v.text);
    state.activeVersePages    = splitVerseIntoPages(displayText);
    state.activeVersePageIndex = 0;
    pushCurrentPage();
  }

  /** Отправляет текущий слайд на проектор + обновляет UI. */
  function pushCurrentPage() {
    const ch = state.currentChapter;
    if (!ch || !state.activeVerseNumber) return;
    const v = ch.verses.find(x => x.number === state.activeVerseNumber);
    if (!v) return;

    const displayText = verseTextForDisplay(state.translation, ch.book.id, v.text);
    const pages = state.activeVersePages.length ? state.activeVersePages : [displayText];
    const i     = Math.min(state.activeVersePageIndex, pages.length - 1);
    state.activeVersePageIndex = i;

    const baseRef = formatVerseRef(
      state.translation,
      ch.book,
      ch.chapter,
      v.number,
      v
    );
    const ref = pages.length > 1 ? `${baseRef} (${i + 1}/${pages.length})` : baseRef;
    const text = pages[i];

    state.activeRef = baseRef;
    selectVerse({ ref, text });

    els.status.textContent = pages.length > 1
      ? `${baseRef} · слайд ${i + 1}/${pages.length} (← / →)`
      : baseRef;

    els.readerBody.querySelectorAll('.v').forEach(s => {
      s.classList.toggle('active', Number(s.dataset.n) === state.activeVerseNumber);
    });
    renderReaderActiveDecorations();
    scrollActiveVerseIntoView();
  }

  /** Маленький индикатор «слайд X/Y» рядом с активным стихом. */
  function renderReaderActiveDecorations() {
    els.readerBody.querySelectorAll('.page-pill').forEach(p => p.remove());
    const pages = state.activeVersePages;
    if (pages.length > 1 && state.activeVerseNumber) {
      const span = els.readerBody.querySelector(
        `.v[data-n="${state.activeVerseNumber}"]`
      );
      if (span) {
        const pill = document.createElement('span');
        pill.className = 'page-pill';
        pill.textContent = `${state.activeVersePageIndex + 1}/${pages.length}`;
        span.appendChild(pill);
      }
    }
  }

  function scrollActiveVerseIntoView() {
    const el = els.readerBody.querySelector('.v.active');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* ----- Навигация по главам и стихам ----- */
  function updateChapterNavButtons() {
    const ch = state.currentChapter;
    if (!ch) {
      els.btnPrevCh.disabled = true;
      els.btnNextCh.disabled = true;
      return;
    }
    if (ch.book.id === 19 && usesSynodalPsalmGrid(state.translation) && ch.rstSynodal != null) {
      els.btnPrevCh.disabled = ch.rstSynodal <= 1;
      els.btnNextCh.disabled = ch.rstSynodal >= 150;
      return;
    }
    els.btnPrevCh.disabled = ch.book.id === 1 && ch.chapter === 1;
    const lastBook = state.booksIndex[state.booksIndex.length - 1];
    els.btnNextCh.disabled =
      ch.book.id === lastBook.id && ch.chapter === lastBook.chaptersCount;
  }

  function navChapter(delta) {
    const ch = state.currentChapter;
    if (ch && ch.book.id === 19 && usesSynodalPsalmGrid(state.translation) && ch.rstSynodal != null) {
      const syn = ch.rstSynodal + delta;
      if (syn >= 1 && syn <= 150) {
        loadChapter(19, syn, { scroll: false });
        return;
      }
      if (syn < 1) {
        const idx = state.booksIndex.findIndex(b => b.id === 19);
        if (idx <= 0) return;
        const prev = state.booksIndex[idx - 1];
        loadChapter(prev.id, prev.chaptersCount, { scroll: false, fromMt: true });
        return;
      }
      const idx = state.booksIndex.findIndex(b => b.id === 19);
      if (idx >= state.booksIndex.length - 1) return;
      const next = state.booksIndex[idx + 1];
      loadChapter(next.id, 1, { scroll: false, fromMt: true });
      return;
    }

    let bookId, chapter;
    if (!ch) {
      // если ничего не открыто — открыть первую/последнюю главу Библии
      bookId = delta > 0 ? 1 : state.booksIndex[state.booksIndex.length - 1].id;
      const b = state.booksIndex.find(x => x.id === bookId);
      chapter = delta > 0 ? 1 : b.chaptersCount;
    } else {
      bookId  = ch.book.id;
      chapter = ch.chapter + delta;
      const book = state.booksIndex.find(b => b.id === bookId);
      if (chapter < 1) {
        // в конец предыдущей книги
        const idx = state.booksIndex.findIndex(b => b.id === bookId);
        if (idx <= 0) return;
        const prev = state.booksIndex[idx - 1];
        bookId = prev.id;
        chapter = prev.chaptersCount;
      } else if (chapter > book.chaptersCount) {
        // в начало следующей книги
        const idx = state.booksIndex.findIndex(b => b.id === bookId);
        if (idx >= state.booksIndex.length - 1) return;
        const next = state.booksIndex[idx + 1];
        bookId = next.id;
        chapter = 1;
      }
    }
    loadChapter(bookId, chapter, { scroll: false });
  }

  async function navVerse(delta) {
    const ch = state.currentChapter;
    if (!ch) {
      await loadChapter(1, 1, { scroll: true });
      pickVerse(1);
      return;
    }

    // 1) сначала пробуем перелистать «слайды» внутри активного стиха
    if (state.activeVerseNumber && state.activeVersePages.length > 1) {
      const nextPage = state.activeVersePageIndex + delta;
      if (nextPage >= 0 && nextPage < state.activeVersePages.length) {
        state.activeVersePageIndex = nextPage;
        pushCurrentPage();
        return;
      }
    }

    // 2) переход к соседнему стиху
    const cur = state.activeVerseNumber ?? ch.verses[0].number;
    const next = cur + delta;
    const min = ch.verses[0].number;
    const max = ch.verses[ch.verses.length - 1].number;

    // помощник: после смены стиха на «назад» — встаём на последний слайд
    const goLastPage = () => {
      if (state.activeVersePages.length > 1) {
        state.activeVersePageIndex = state.activeVersePages.length - 1;
        pushCurrentPage();
      }
    };

    if (next >= min && next <= max) {
      pickVerse(next);
      if (delta < 0) goLastPage();
      return;
    }

    // 3) граница главы → соседняя глава / псалом
    const book = state.booksIndex.find(b => b.id === ch.book.id);
    const rstPs =
      ch.book.id === 19 && usesSynodalPsalmGrid(state.translation) && ch.rstSynodal != null;

    if (next < min) {
      if (rstPs && ch.rstSynodal > 1) {
        await loadChapter(19, ch.rstSynodal - 1, { scroll: false });
        const last = state.currentChapter.verses.slice(-1)[0].number;
        pickVerse(last);
        goLastPage();
        return;
      }
      if (ch.chapter > 1) {
        await loadChapter(book.id, ch.chapter - 1, {
          scroll: false,
          fromMt: book.id === 19
        });
      } else {
        const idx = state.booksIndex.findIndex(b => b.id === book.id);
        if (idx <= 0) return;
        const prev = state.booksIndex[idx - 1];
        await loadChapter(prev.id, prev.chaptersCount, {
          scroll: false,
          fromMt: prev.id === 19
        });
      }
      const last = state.currentChapter.verses.slice(-1)[0].number;
      pickVerse(last);
      goLastPage();
      return;
    }
    if (next > max) {
      if (rstPs && ch.rstSynodal < 150) {
        await loadChapter(19, ch.rstSynodal + 1, { scroll: false });
        const first = state.currentChapter.verses[0].number;
        pickVerse(first);
        return;
      }
      if (ch.chapter < book.chaptersCount) {
        await loadChapter(book.id, ch.chapter + 1, {
          scroll: false,
          fromMt: book.id === 19
        });
      } else {
        const idx = state.booksIndex.findIndex(b => b.id === book.id);
        if (idx >= state.booksIndex.length - 1) return;
        const nxt = state.booksIndex[idx + 1];
        await loadChapter(nxt.id, 1, { scroll: false, fromMt: nxt.id === 19 });
      }
      const first = state.currentChapter.verses[0].number;
      pickVerse(first);
      return;
    }
  }

  function updatePreview(text, ref) {
    if (!text) {
      els.stage.classList.add('hidden');
      els.placeholder.style.display = '';
      els.text.textContent = '';
      els.ref.textContent  = '';
      return;
    }
    els.text.textContent = text;
    els.ref.textContent  = ref;
    els.placeholder.style.display = 'none';
    els.stage.classList.remove('hidden');
  }

  /* ----- кнопки ----- */
  els.btnOpen.addEventListener('click', () => {
    state.screenWindow = window.open(
      location.pathname + '?mode=screen',
      'biblePresenterScreen',
      'width=1200,height=720'
    );
    els.status.textContent = 'Окно проектора открыто (нажмите F11 для полного экрана)';
  });

  els.btnPip.addEventListener('click', openFloatingScreen);

  // Если PiP не поддерживается — подсвечиваем кнопку как недоступную.
  if (!('documentPictureInPicture' in window)) {
    els.btnPip.disabled = true;
    els.btnPip.title = 'Plain Picture-in-Picture доступен в Chrome/Edge 116+';
    els.btnPip.style.opacity = '0.5';
    els.btnPip.style.cursor = 'not-allowed';
  }

  els.btnClear.addEventListener('click', () => {
    state.activeRef          = null;
    state.activeVerseNumber  = null;
    state.activeVersePages   = [];
    state.activeVersePageIndex = 0;
    clearVerse();
    updatePreview('', '');
    if (state.pipUpdate) state.pipUpdate('', '');
    document.querySelectorAll('.card.active, .v.active').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.page-pill').forEach(p => p.remove());
    els.status.textContent = '↑↓ — главы, ←→ — стихи и слайды';
  });

  els.btnPrevCh.addEventListener('click', () => navChapter(-1));
  els.btnNextCh.addEventListener('click', () => navChapter(+1));

  /* ----- Клавиатура: ↑↓ — главы, ←→ — стихи ----- */
  function isTyping(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }
  document.addEventListener('keydown', e => {
    if (isTyping(e.target)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case 'ArrowUp':    e.preventDefault(); navChapter(-1); break;
      case 'ArrowDown':  e.preventDefault(); navChapter(+1); break;
      case 'ArrowLeft':  e.preventDefault(); navVerse(-1);   break;
      case 'ArrowRight': e.preventDefault(); navVerse(+1);   break;
    }
  });

  /**
   * Открывает плавающее окно поверх всех окон через Document Picture-in-Picture API.
   * В отличие от window.open, такое окно ОС-уровнево держится над остальными.
   * Поддерживается Chrome/Edge 116+; в Firefox/Safari работает обычная кнопка ТВ.
   */
  async function openFloatingScreen() {
    if (!('documentPictureInPicture' in window)) {
      alert('Ваш браузер не поддерживает плавающее окно «поверх всех». ' +
            'Откройте обычное окно («Открыть экран ТВ»), переместите его на проектор ' +
            'и нажмите F11 для полного экрана.');
      return;
    }
    if (state.pipWindow && !state.pipWindow.closed) {
      state.pipWindow.focus();
      return;
    }

    const pip = await window.documentPictureInPicture.requestWindow({
      width: 1280,
      height: 720
    });
    state.pipWindow = pip;

    // Встроенные стили — копировать главные стили дороже и нестабильно,
    // у проектора их и так совсем немного.
    const style = pip.document.createElement('style');
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        margin: 0; padding: 0; height: 100%;
        background: #000; color: #fff; overflow: hidden; cursor: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                     "Inter", "Helvetica Neue", Arial, sans-serif;
      }
      .screen {
        position: fixed; inset: 0; display: flex;
        align-items: center; justify-content: center;
        padding: 4vh 5vw; background: #000;
      }
      .stage { max-width: 92vw; text-align: center; transition: opacity .5s ease; }
      .stage.hidden { opacity: 0; }
      .text {
        font-size: clamp(28px, 5.5vw, 110px);
        line-height: 1.18; font-weight: 500; letter-spacing: 0.3px;
        color: #fff; word-wrap: break-word;
      }
      .ref {
        margin-top: 4vh; font-size: clamp(14px, 1.8vw, 36px);
        color: #888; letter-spacing: 1px;
      }
    `;
    pip.document.head.append(style);
    pip.document.title = 'Великая Благодать — Поверх окон';
    pip.document.body.innerHTML = `
      <div class="screen">
        <div id="stage" class="stage hidden">
          <div id="text" class="text"></div>
          <div id="ref" class="ref"></div>
        </div>
      </div>
    `;

    const $stage = pip.document.getElementById('stage');
    const $text  = pip.document.getElementById('text');
    const $ref   = pip.document.getElementById('ref');
    const FADE_MS = 500;
    let pending = null;

    function update(text, ref) {
      if (pending) clearTimeout(pending);
      $stage.classList.add('hidden');
      pending = setTimeout(() => {
        if (!text) { $text.textContent = ''; $ref.textContent = ''; return; }
        $text.textContent = text;
        $ref.textContent  = ref;
        requestAnimationFrame(() => $stage.classList.remove('hidden'));
      }, FADE_MS);
    }

    // Прямая связь admin → PiP: selectVerse() вызывает state.pipUpdate
    // напрямую, без localStorage — мгновенно и не зависит от 'storage' события,
    // которое в той же вкладке всё равно не сработает.
    state.pipUpdate = update;

    // Покажем текущий стих, если он уже выбран.
    const initial = readVerse();
    if (initial.text) {
      $text.textContent = initial.text;
      $ref.textContent  = initial.ref;
      requestAnimationFrame(() => $stage.classList.remove('hidden'));
    }

    pip.addEventListener('pagehide', () => {
      state.pipUpdate = null;
      state.pipWindow = null;
      els.status.textContent = 'Плавающее окно закрыто';
    });

    els.status.textContent = 'Плавающее окно поверх всех окон';
  }

  /* ----- синхронизация между админскими вкладками ----- */
  window.addEventListener('storage', e => {
    if (!e.key || [KEYS.TEXT, KEYS.REF, KEYS.TRIGGER].includes(e.key)) {
      const v = readVerse();
      state.activeRef = v.ref || null;
      updatePreview(v.text, v.ref);
      document.querySelectorAll('.card').forEach(c => {
        c.classList.toggle('active', c.dataset.ref === state.activeRef);
      });
    }
  });

  /* ----- старт ----- */
  renderTranslations();
  els.searchMeta.textContent = 'Подсказка: введите слово или ссылку «Иоанна 3:16»';

  const initial = readVerse();
  if (initial.text) {
    state.activeRef = initial.ref;
    updatePreview(initial.text, initial.ref);
  }
}

async function renderSongs() {
  document.title = 'Великая Благодать — Песни';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin songs-admin">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand">
            <a href="/" class="back-link">←</a>
            <h1>Великая Благодать</h1>
            <span class="ver">песни</span>
          </div>
          <p>Поиск песен, очередь и управление слайдами.</p>
        </div>

        <div class="search-wrap">
          <input id="song-search" class="search-input" type="text"
                 placeholder="Поиск по названию..." autocomplete="off" spellcheck="false">
        </div>
        <div class="search-meta" id="song-search-meta">Загрузка песен...</div>
        <div id="song-results" class="scroll"></div>
        <div class="songs-manual">
          <button class="songs-manual-header" id="songs-manual-toggle" type="button">
            <span class="songs-manual-title">Добавить вручную</span>
            <span class="songs-manual-arrow" id="songs-manual-arrow">›</span>
          </button>
          <div class="songs-manual-body" id="songs-manual-body">
            <input id="song-manual-title" class="search-input" type="text"
                   placeholder="Название (необязательно)">
            <textarea id="song-manual-lyrics" class="songs-manual-lyrics"
                      placeholder="Текст песни (абзацы — слайды)"></textarea>
            <button id="song-manual-add" class="btn btn-primary songs-manual-btn">Сохранить</button>
            <div id="song-manual-status" class="songs-manual-status"></div>
          </div>
        </div>
      </aside>

      <main class="main">
        <div class="toolbar">
          <div>
            <h2>Песни · предпросмотр</h2>
            <div class="status" id="song-status">Добавьте песню в очередь и выберите слайд</div>
          </div>
          <div class="actions">
            <button id="song-btn-clear" class="btn btn-danger">Очистить экран</button>
            <button id="song-btn-pip" class="btn btn-secondary">Поверх окон</button>
            <button id="song-btn-open" class="btn btn-primary">Открыть экран ТВ</button>
          </div>
        </div>

        <div class="preview-wrap">
          <div class="preview">
            <div id="song-preview-stage" class="stage hidden">
              <div id="song-preview-text" class="text"></div>
              <div id="song-preview-ref" class="ref"></div>
            </div>
            <div id="song-preview-placeholder" class="placeholder">Экран пуст</div>
          </div>
        </div>

        <section class="songs-workspace">
          <div class="songs-queue-panel">
            <header>
              <div class="title">Очередь песен</div>
              <div class="sub">↑/↓ — песни, ←/→ — слайды</div>
            </header>
            <div id="songs-queue" class="songs-queue-list"></div>
          </div>

          <div class="songs-slide-panel">
            <header class="songs-slide-header">
              <div>
                <div class="title" id="songs-current-title">Выберите песню</div>
                <div class="sub" id="songs-current-sub">Слайды появятся здесь</div>
              </div>
              <div class="songs-slide-actions">
                <button id="songs-prev-slide" class="btn btn-secondary">←</button>
                <button id="songs-next-slide" class="btn btn-secondary">→</button>
              </div>
            </header>
            <div id="songs-slide-text" class="songs-slide-text">Добавьте песню в очередь слева</div>
          </div>
        </section>
      </main>
    </div>
  `;

  const STORAGE_KEY = 'songs_queue_v1';
  const state = {
    songs: [],
    queue: [],
    activeSongIdx: -1,
    activeSlideIdx: 0,
    pipWindow: null,
    pipUpdate: null
  };
  const $ = id => document.getElementById(id);
  const els = {
    search: $('song-search'),
    manualTitle: $('song-manual-title'),
    manualLyrics: $('song-manual-lyrics'),
    manualAdd: $('song-manual-add'),
    manualStatus: $('song-manual-status'),
    searchMeta: $('song-search-meta'),
    results: $('song-results'),
    status: $('song-status'),
    queue: $('songs-queue'),
    slideTitle: $('songs-current-title'),
    slideSub: $('songs-current-sub'),
    slideText: $('songs-slide-text'),
    prevSlide: $('songs-prev-slide'),
    nextSlide: $('songs-next-slide'),
    btnOpen: $('song-btn-open'),
    btnPip: $('song-btn-pip'),
    btnClear: $('song-btn-clear'),
    previewStage: $('song-preview-stage'),
    previewText: $('song-preview-text'),
    previewRef: $('song-preview-ref'),
    previewPlaceholder: $('song-preview-placeholder')
  };

  async function createManualSong() {
    const title = (els.manualTitle.value || '').trim();
    const lyrics = (els.manualLyrics.value || '').trim();
    if (!lyrics) {
      els.manualStatus.textContent = 'Введите текст песни';
      return;
    }
    els.manualAdd.disabled = true;
    els.manualStatus.textContent = 'Сохраняю...';
    try {
      const created = await api('/api/songs/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, lyrics })
      });
      els.manualTitle.value = '';
      els.manualLyrics.value = '';
      els.manualStatus.textContent = `Сохранено: ${created.title}`;
      await runSearch();
      addToQueue(created);
    } catch (err) {
      els.manualStatus.textContent = `Ошибка: ${err.message}`;
    } finally {
      els.manualAdd.disabled = false;
    }
  }

  function updatePreview(text, ref) {
    if (!text) {
      els.previewStage.classList.add('hidden');
      els.previewPlaceholder.style.display = '';
      els.previewText.textContent = '';
      els.previewRef.textContent = '';
      return;
    }
    els.previewText.textContent = text;
    els.previewRef.textContent = ref;
    els.previewPlaceholder.style.display = 'none';
    els.previewStage.classList.remove('hidden');
  }

  function persistQueue() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      queue: state.queue,
      activeSongIdx: state.activeSongIdx,
      activeSlideIdx: state.activeSlideIdx
    }));
  }

  function restoreQueue() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!Array.isArray(parsed.queue)) return;
      state.queue = parsed.queue.filter(item =>
        item && item.id && item.title && Array.isArray(item.slides) && item.slides.length
      );
      state.activeSongIdx = Number.isInteger(parsed.activeSongIdx) ? parsed.activeSongIdx : -1;
      state.activeSlideIdx = Number.isInteger(parsed.activeSlideIdx) ? parsed.activeSlideIdx : 0;
      if (state.activeSongIdx >= state.queue.length) state.activeSongIdx = state.queue.length - 1;
      if (state.activeSongIdx < 0 && state.queue.length) state.activeSongIdx = 0;
    } catch {
      state.queue = [];
      state.activeSongIdx = -1;
      state.activeSlideIdx = 0;
    }
  }

  function currentSong() {
    if (state.activeSongIdx < 0 || state.activeSongIdx >= state.queue.length) return null;
    return state.queue[state.activeSongIdx];
  }

  function renderQueue() {
    if (!state.queue.length) {
      els.queue.innerHTML = '<div class="empty">Очередь пуста</div>';
      return;
    }
    els.queue.innerHTML = state.queue.map((song, i) => `
      <div class="songs-queue-item ${i === state.activeSongIdx ? 'active' : ''}" data-idx="${i}">
        <button class="songs-queue-main" data-idx="${i}">
          <div class="title">${escapeHtml(song.title)}</div>
          <div class="meta">${song.slides.length} слайдов</div>
        </button>
        <button class="songs-queue-remove" data-remove="${i}" title="Удалить">×</button>
      </div>
    `).join('');

    els.queue.querySelectorAll('[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeSongIdx = Number(btn.dataset.idx);
        state.activeSlideIdx = 0;
        renderQueue();
        pushCurrentSlide();
        persistQueue();
      });
    });

    els.queue.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = Number(btn.dataset.remove);
        state.queue.splice(idx, 1);
        if (!state.queue.length) {
          state.activeSongIdx = -1;
          state.activeSlideIdx = 0;
          clearVerse();
          updatePreview('', '');
          if (state.pipUpdate) state.pipUpdate('', '');
        } else if (state.activeSongIdx >= state.queue.length) {
          state.activeSongIdx = state.queue.length - 1;
          state.activeSlideIdx = 0;
        }
        renderQueue();
        pushCurrentSlide();
        persistQueue();
      });
    });
  }

  function pushCurrentSlide() {
    const song = currentSong();
    if (!song) {
      els.slideTitle.textContent = 'Выберите песню';
      els.slideSub.textContent = 'Слайды появятся здесь';
      els.slideText.textContent = 'Добавьте песню в очередь слева';
      els.status.textContent = 'Добавьте песню в очередь и выберите слайд';
      return;
    }
    if (state.activeSlideIdx < 0) state.activeSlideIdx = 0;
    if (state.activeSlideIdx >= song.slides.length) state.activeSlideIdx = song.slides.length - 1;

    const text = song.slides[state.activeSlideIdx];
    const ref = `${song.title} (${state.activeSlideIdx + 1}/${song.slides.length})`;
    pushVerse({ text, ref, translation: 'songs' });
    updatePreview(text, ref);
    if (state.pipUpdate) state.pipUpdate(text, ref);

    els.slideTitle.textContent = song.title;
    els.slideSub.textContent = `Слайд ${state.activeSlideIdx + 1} из ${song.slides.length}`;
    els.slideText.textContent = text;
    els.status.textContent = `${song.title} · ${state.activeSlideIdx + 1}/${song.slides.length}`;
    persistQueue();
  }

  function addToQueue(song) {
    if (state.queue.some(x => x.id === song.id)) {
      state.activeSongIdx = state.queue.findIndex(x => x.id === song.id);
      state.activeSlideIdx = 0;
      renderQueue();
      pushCurrentSlide();
      return;
    }
    const slides = splitSongIntoSlides(song.lyrics);
    if (!slides.length) return;
    state.queue.push({
      id: song.id,
      title: song.title,
      slides
    });
    state.activeSongIdx = state.queue.length - 1;
    state.activeSlideIdx = 0;
    renderQueue();
    pushCurrentSlide();
    persistQueue();
  }

  function renderSongsList(items) {
    if (!items.length) {
      els.results.innerHTML = '<div class="empty">Ничего не найдено</div>';
      return;
    }
    els.results.innerHTML = items.map((song, i) => `
      <div class="card songs-card">
        <button class="songs-card-main" data-open="${i}">
          <div class="ref">${escapeHtml(song.title)}</div>
          <div class="text">${escapeHtml(song.firstLine || 'Без текста')}</div>
        </button>
        <button class="songs-card-add" data-add="${i}">+ Очередь</button>
      </div>
    `).join('');

    els.results.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const song = items[Number(btn.dataset.add)];
        try {
          const full = await api(`/api/songs/${encodeURIComponent(song.id)}`);
          addToQueue(full);
        } catch (err) {
          els.searchMeta.textContent = `Ошибка: ${err.message}`;
        }
      });
    });

    els.results.querySelectorAll('[data-open]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const song = items[Number(btn.dataset.open)];
        try {
          const full = await api(`/api/songs/${encodeURIComponent(song.id)}`);
          const slides = splitSongIntoSlides(full.lyrics);
          els.slideTitle.textContent = full.title;
          els.slideSub.textContent = `Предпросмотр · ${slides.length} слайдов`;
          els.slideText.textContent = slides[0] || 'Нет текста';
        } catch (err) {
          els.searchMeta.textContent = `Ошибка: ${err.message}`;
        }
      });
    });
  }

  const runSearch = debounce(async () => {
    const q = els.search.value.trim();
    try {
      const data = q
        ? await api(`/api/songs/search?q=${encodeURIComponent(q)}&limit=400`)
        : await api('/api/songs?limit=400');
      state.songs = data.items || [];
      els.searchMeta.textContent = `Песен: ${state.songs.length}`;
      renderSongsList(state.songs);
    } catch (err) {
      els.searchMeta.textContent = `Ошибка: ${err.message}`;
    }
  }, 180);

  function navSlide(delta) {
    const song = currentSong();
    if (!song) return;
    const next = state.activeSlideIdx + delta;
    if (next < 0 || next >= song.slides.length) return;
    state.activeSlideIdx = next;
    pushCurrentSlide();
  }

  function navSong(delta) {
    if (!state.queue.length) return;
    const next = state.activeSongIdx + delta;
    if (next < 0 || next >= state.queue.length) return;
    state.activeSongIdx = next;
    state.activeSlideIdx = 0;
    renderQueue();
    pushCurrentSlide();
  }

  function isTyping(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  document.addEventListener('keydown', e => {
    if (isTyping(e.target)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); navSlide(-1); break;
      case 'ArrowRight': e.preventDefault(); navSlide(1); break;
      case 'ArrowUp': e.preventDefault(); navSong(-1); break;
      case 'ArrowDown': e.preventDefault(); navSong(1); break;
    }
  });

  async function openFloatingScreen() {
    if (!('documentPictureInPicture' in window)) {
      alert('Plain Picture-in-Picture доступен в Chrome/Edge 116+');
      return;
    }
    if (state.pipWindow && !state.pipWindow.closed) {
      state.pipWindow.focus();
      return;
    }
    const pip = await window.documentPictureInPicture.requestWindow({ width: 1280, height: 720 });
    state.pipWindow = pip;
    const style = pip.document.createElement('style');
    style.textContent = `
      html,body{margin:0;height:100%;background:#000;color:#fff;overflow:hidden}
      .screen{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:4vh 5vw}
      .stage{max-width:92vw;text-align:center;transition:opacity .5s ease}
      .stage.hidden{opacity:0}
      .text{font-size:clamp(28px,5.5vw,110px);line-height:1.18;white-space:pre-line}
      .ref{margin-top:4vh;font-size:clamp(14px,1.8vw,36px);color:#888}
    `;
    pip.document.head.append(style);
    pip.document.body.innerHTML = `
      <div class="screen">
        <div id="stage" class="stage hidden"><div id="text" class="text"></div><div id="ref" class="ref"></div></div>
      </div>
    `;
    const $stage = pip.document.getElementById('stage');
    const $text = pip.document.getElementById('text');
    const $ref = pip.document.getElementById('ref');
    let pending = null;
    const update = (text, ref) => {
      if (pending) clearTimeout(pending);
      $stage.classList.add('hidden');
      pending = setTimeout(() => {
        if (!text) { $text.textContent = ''; $ref.textContent = ''; return; }
        $text.textContent = text;
        $ref.textContent = ref;
        requestAnimationFrame(() => $stage.classList.remove('hidden'));
      }, 500);
    };
    state.pipUpdate = update;
    const initial = readVerse();
    if (initial.text) update(initial.text, initial.ref);
    pip.addEventListener('pagehide', () => {
      state.pipUpdate = null;
      state.pipWindow = null;
    });
  }

  document.getElementById('songs-manual-toggle').addEventListener('click', () => {
    const body  = document.getElementById('songs-manual-body');
    const arrow = document.getElementById('songs-manual-arrow');
    const open  = body.classList.toggle('open');
    arrow.classList.toggle('open', open);
  });

  els.search.addEventListener('input', runSearch);
  els.manualAdd.addEventListener('click', createManualSong);
  els.prevSlide.addEventListener('click', () => navSlide(-1));
  els.nextSlide.addEventListener('click', () => navSlide(1));
  els.btnOpen.addEventListener('click', () => {
    window.open(location.pathname + '?mode=screen', 'biblePresenterScreen', 'width=1200,height=720');
  });
  els.btnPip.addEventListener('click', openFloatingScreen);
  els.btnClear.addEventListener('click', () => {
    clearVerse();
    updatePreview('', '');
    if (state.pipUpdate) state.pipUpdate('', '');
    els.status.textContent = 'Экран очищен';
  });

  restoreQueue();
  renderQueue();
  pushCurrentSlide();
  await runSearch();

  const initial = readVerse();
  if (initial.text) updatePreview(initial.text, initial.ref);
}

/* =========================================================
   ЭКРАН ПРОЕКТОРА
   ========================================================= */
function renderScreen() {
  document.title = 'Великая Благодать — Экран';
  document.body.classList.add('screen-mode');

  document.getElementById('app').innerHTML = `
    <div class="screen">
      <div id="stage" class="stage hidden">
        <div id="text" class="text"></div>
        <div id="ref"  class="ref"></div>
      </div>
      <button id="fs-btn" class="fs-btn" title="Полный экран (F11)">⛶</button>
    </div>
  `;

  // Любой клик/нажатие клавиши уводит окно в полноэкранный режим:
  // на втором мониторе fullscreen перекрывает всё, что на нём есть,
  // и окно фактически становится «всегда сверху» для этого монитора.
  function tryFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) return;
    (el.requestFullscreen?.() ||
     el.webkitRequestFullscreen?.() ||
     el.mozRequestFullScreen?.() ||
     Promise.resolve()).catch?.(() => {});
  }
  document.addEventListener('click', tryFullscreen);
  document.addEventListener('keydown', e => {
    if (e.key === 'f' || e.key === 'F' || e.key === 'F11') tryFullscreen();
  });
  document.getElementById('fs-btn').addEventListener('click', tryFullscreen);

  const $stage = document.getElementById('stage');
  const $text  = document.getElementById('text');
  const $ref   = document.getElementById('ref');

  const FADE_MS = 500; // должно совпадать с CSS transition
  let pending = null;

  function update() {
    const { text, ref } = readVerse();
    if (pending) clearTimeout(pending);
    $stage.classList.add('hidden');
    pending = setTimeout(() => {
      if (!text) {
        $text.textContent = '';
        $ref.textContent  = '';
        return;
      }
      $text.textContent = text;
      $ref.textContent  = ref;
      requestAnimationFrame(() => $stage.classList.remove('hidden'));
    }, FADE_MS);
  }

  window.addEventListener('storage', e => {
    if (!e.key || [KEYS.TEXT, KEYS.REF, KEYS.TRIGGER].includes(e.key)) update();
  });

  // Если экран открыли позже, чем выбрали стих — показать сразу.
  const initial = readVerse();
  if (initial.text) {
    $text.textContent = initial.text;
    $ref.textContent  = initial.ref;
    requestAnimationFrame(() => $stage.classList.remove('hidden'));
  }
}
