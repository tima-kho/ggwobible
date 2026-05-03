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

async function api(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

/* =========================================================
   Роутер
   ========================================================= */
const isScreenMode =
  new URLSearchParams(location.search).get('mode') === 'screen';

if (isScreenMode) renderScreen();
else              renderAdmin();

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
        state.translation = b.dataset.code;
        localStorage.setItem('ui_translation', state.translation);
        renderTranslations();
        if (state.tab === 'search') runSearch();
        else renderBooksView();
        // если в reader открыта глава — перезагрузить её в новом переводе
        if (state.currentChapter) {
          const prevActive = state.activeVerseNumber;
          (async () => {
            await loadChapter(
              state.currentChapter.book.id,
              state.currentChapter.chapter,
              { scroll: false }
            );
            if (prevActive) pickVerse(prevActive);
          })();
        }
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

    els.results.innerHTML = items.map((it, i) => `
      <button class="card ${it.ref === state.activeRef ? 'active' : ''}"
              data-i="${i}">
        <div class="ref">${escapeHtml(it.ref)}</div>
        <div class="text">${escapeHtml(it.text)}</div>
      </button>
    `).join('');

    els.results.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', async () => {
        const it = items[Number(card.dataset.i)];
        // подгружаем главу, затем выбираем стих с пагинацией
        await loadChapter(it.bookId, it.chapter, { scroll: false });
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
               data-id="${b.id}" title="${escapeHtml(b.ruFull)}">
         ${escapeHtml(b.ru)}
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
    const activeCh = state.currentChapter?.book?.id === bookId
      ? state.currentChapter.chapter : null;
    const tiles = Array.from({ length: book.chaptersCount }, (_, i) => i + 1)
      .map(n => `
        <button class="chapter-tile ${n === activeCh ? 'active' : ''}" data-n="${n}">
          ${n}
        </button>`).join('');
    els.booksView.innerHTML = `
      ${renderBreadcrumbs([{ label: book.ru }])}
      <div class="section-title">${escapeHtml(book.ruFull)} · ${book.chaptersCount} глав</div>
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
  async function loadChapter(bookId, chapter, opts = {}) {
    const book = state.booksIndex.find(b => b.id === bookId);
    if (!book) return;
    els.readerTitle.textContent = book.ruFull;
    els.readerSub.textContent   = `Глава ${chapter} · загрузка...`;
    els.readerBody.innerHTML    = '<div class="reader-empty">Загрузка...</div>';

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

    state.currentChapter = { book: data.book, chapter: data.chapter, verses: data.verses };
    // активный стих и его страницы сбрасываются здесь; вызывайте pickVerse(),
    // если хотите тут же выбрать конкретный стих в новой главе.
    state.activeVerseNumber  = null;
    state.activeVersePages   = [];
    state.activeVersePageIndex = 0;

    renderReader();

    // Перерисовать сайдбар, чтобы подсветить активную книгу/главу
    if (state.tab === 'books') renderBooksView();
  }

  function renderReader() {
    const ch = state.currentChapter;
    if (!ch) return;
    els.readerTitle.textContent = `${ch.book.ruFull}, глава ${ch.chapter}`;
    els.readerSub.textContent   =
      `${ch.verses.length} стих${ch.verses.length === 1 ? '' :
        ch.verses.length < 5 ? 'а' : 'ов'}`;

    els.readerBody.innerHTML = ch.verses.map(v => `
      <span class="v ${v.number === state.activeVerseNumber ? 'active' : ''}"
            data-n="${v.number}">
        <a class="vnum" data-n="${v.number}" title="Отправить на экран">${v.number}</a>${escapeHtml(v.text)}
      </span> `).join('');

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
    state.activeVersePages    = splitVerseIntoPages(v.text);
    state.activeVersePageIndex = 0;
    pushCurrentPage();
  }

  /** Отправляет текущий слайд на проектор + обновляет UI. */
  function pushCurrentPage() {
    const ch = state.currentChapter;
    if (!ch || !state.activeVerseNumber) return;
    const v = ch.verses.find(x => x.number === state.activeVerseNumber);
    if (!v) return;

    const pages = state.activeVersePages.length ? state.activeVersePages : [v.text];
    const i     = Math.min(state.activeVersePageIndex, pages.length - 1);
    state.activeVersePageIndex = i;

    const baseRef = `${ch.book.ru} ${ch.chapter}:${v.number}`;
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
    els.btnPrevCh.disabled = !ch || (ch.book.id === 1 && ch.chapter === 1);
    const lastBook = state.booksIndex[state.booksIndex.length - 1];
    els.btnNextCh.disabled = !ch ||
      (ch.book.id === lastBook.id && ch.chapter === lastBook.chaptersCount);
  }

  function navChapter(delta) {
    const ch = state.currentChapter;
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

    // 3) граница главы → загружаем соседнюю
    const book = state.booksIndex.find(b => b.id === ch.book.id);
    if (next < min) {
      if (ch.chapter > 1) {
        await loadChapter(book.id, ch.chapter - 1, { scroll: false });
      } else {
        const idx = state.booksIndex.findIndex(b => b.id === book.id);
        if (idx <= 0) return;
        const prev = state.booksIndex[idx - 1];
        await loadChapter(prev.id, prev.chaptersCount, { scroll: false });
      }
      const last = state.currentChapter.verses.slice(-1)[0].number;
      pickVerse(last);
      goLastPage();
      return;
    }
    if (next > max) {
      if (ch.chapter < book.chaptersCount) {
        await loadChapter(book.id, ch.chapter + 1, { scroll: false });
      } else {
        const idx = state.booksIndex.findIndex(b => b.id === book.id);
        if (idx >= state.booksIndex.length - 1) return;
        const nxt = state.booksIndex[idx + 1];
        await loadChapter(nxt.id, 1, { scroll: false });
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
