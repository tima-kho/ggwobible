/* global React, ReactDOM, TVScreen, BOOKS_OT_FULL, BOOKS_NT_FULL, SCREEN_BGS, TEMPLATES, FONTS_SCREEN */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

/* ============ localStorage sync helpers ============ */
function pushToScreen(template, content) {
  localStorage.setItem('screen-template', template);
  localStorage.setItem('screen-content', JSON.stringify(content));
  localStorage.setItem('screen-trigger', String(Date.now()));
}

function readScreenState() {
  const fontId = localStorage.getItem('screen-fontId') || 'cormorant';
  let content = {};
  try { content = JSON.parse(localStorage.getItem('screen-content') || '{}'); } catch {}
  return {
    template:  localStorage.getItem('screen-template') || 'logo',
    content,
    bg:        localStorage.getItem('screen-bg')     || 'black',
    fontId,
    fontStack: (FONTS_SCREEN.find(f => f.id === fontId) || FONTS_SCREEN[0]).stack,
    fontSize:  Number(localStorage.getItem('screen-fontSize')) || 80,
  };
}

/* ============ TV Screen mode (?mode=screen) ============ */
function ScreenMode() {
  const [state, setState] = useState(readScreenState);
  const [scale, setScale] = useState(() => window.innerWidth / 1920);

  useEffect(() => {
    document.title = 'ТВ-экран · Великая Благодать';
    document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;background:#000';

    const onStorage = (e) => {
      if (!e.key || e.key.startsWith('screen-')) setState(readScreenState());
    };
    const onResize = () => setScale(window.innerWidth / 1920);

    window.addEventListener('storage', onStorage);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div style={{ width:'100vw', height:'100vh', overflow:'hidden', position:'fixed', inset:0, background:'#000' }}>
      <div style={{ position:'absolute', top:0, left:0, width:1920, height:1080 }}>
        <TVScreen state={state} scale={scale}/>
      </div>
    </div>
  );
}

/* ============ Song lyrics parser ============ */
function parseSongBlocks(lyrics) {
  const sections = String(lyrics || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  let verseN = 0;
  return sections.map(text => {
    const isChorus = /^(припев|хор|chorus|ref\.?)\s*:?/i.test(text);
    const clean = isChorus ? text.replace(/^(припев|хор|chorus|ref\.?)\s*:?\s*/i, '').trim() : text;
    if (!isChorus) verseN++;
    return { type: isChorus ? 'chorus' : 'verse', n: isChorus ? undefined : verseN, text: clean };
  });
}

/* ============ Default slide content ============ */
function defaultContent(template) {
  const kyVerse = 'Анткени Кудай адамдарды ушунчалык сүйгөндүктөн, ишенген ар бир адам өлбөстөн, түбөлүк өмүргө ээ болсун деп, Өзүнүн жалгыз Уулун берди.';
  switch (template) {
    case 'verse':      return { ref:'Жакан 3:16', text: kyVerse, translation:'КРГ · KYB 2004' };
    case 'bilingual':  return { ref:'Жакан 3:16', text: kyVerse, text2:'Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного, дабы всякий верующий в Него, не погиб, но имел жизнь вечную.', lang1:'КРГ · Кыргызча', lang2:'РСТ · Русский' };
    case 'song-title': return { title:'Осанна', subtitle:'Прославляю Я Тебя', songNum: 47 };
    case 'song-verse': return { text:'Адам Сенсиз жашаса,\nТүйшүктөнүп кыйналат\nМээримиң Сенин чексиз\nТеңир, Ырым Сага арналат', partNum: 1, songTitle:'Осанна', position:'1 / 4' };
    case 'chorus':     return { text:'Осанна, Осанна\nДаназалаймин Сени\nЖаным эңсейт Теңирди', songTitle:'Осанна' };
    case 'welcome':    return { kicker:'Воскресное служение', title:'Кош келиңиз', subtitle:'Добро пожаловать', date:'11 мая 2026' };
    case 'prayer':     return { text:'«Атабыз, асмандагы Атабыз,\nСенин ысмың ыйыкталсын,\nСенин Падышачылыгың келсин.»', ref:'Матай 6:9' };
    case 'announce':   return { kicker:'Объявление · Воскресенье', title:'Молитвенное собрание', desc:'Приглашаем всех на совместную молитву и пост в эту пятницу в 19:00.' };
    case 'logo':       return {};
    default:           return {};
  }
}

/* ============ Theme tokens ============ */
function tokens(dark) {
  return dark ? {
    bg:'#0E0A06', panelBg:'#16110A', border:'#2A2117', borderSoft:'#1F1810',
    text:'#F5E8D2', textMute:'#8E7B62', textSubtle:'#6A5A45',
    accent:'#C9A86B', accentSoft:'rgba(201,168,107,0.10)',
    cardBg:'#1F1810', inputBg:'#16110A', danger:'#E8765C',
    primary:'#8B5A2B', primaryText:'#FBF8F2', live:'#3FB364',
  } : {
    bg:'#FBF8F2', panelBg:'#FFFFFF', border:'#EDE4D2', borderSoft:'#F5EFE3',
    text:'#1A140B', textMute:'#6A5A45', textSubtle:'#8E7B62',
    accent:'#8B5A2B', accentSoft:'rgba(139,90,43,0.08)',
    cardBg:'#FBF8F2', inputBg:'#FFFFFF', danger:'#C2614D',
    primary:'#6B4220', primaryText:'#FBF8F2', live:'#3FB364',
  };
}

/* ============ Main App ============ */
function App() {
  const [dark, setDark] = useState(false);
  const [translation, setTranslation] = useState(() => localStorage.getItem('ui-trans') || 'kyb');
  const [tab, setTab] = useState('books');

  // Book navigation
  const allBooks = useMemo(() => [...BOOKS_OT_FULL, ...BOOKS_NT_FULL], []);
  const [bookIdx, setBookIdx] = useState(42); // John (id=43) at index 42
  const [chapter, setChapter] = useState(3);

  // Chapter data from API
  const [chapterVerses, setChapterVerses] = useState([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterBookMeta, setChapterBookMeta] = useState(null);
  const [activeVerse, setActiveVerse] = useState(null);

  // Songs from API
  const [songsList, setSongsList] = useState([]);
  const [activeSongId, setActiveSongId] = useState(null);
  const [activeSongBlocks, setActiveSongBlocks] = useState([]);
  const [activeSongData, setActiveSongData] = useState(null);
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [songCache, setSongCache] = useState({});
  const [editingSong, setEditingSong] = useState(null); // null | { id, title, lyrics, isNew }

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Screen / template
  const [template, setTemplate] = useState('verse');
  const [bg, setBg] = useState(() => localStorage.getItem('screen-bg') || 'black');
  const [fontId, setFontId] = useState(() => localStorage.getItem('screen-fontId') || 'cormorant');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('screen-fontSize') || 80));
  const [content, setContent] = useState(defaultContent('verse'));
  const [screenOn, setScreenOn] = useState(false);
  const screenWindowRef = useRef(null);

  const C = tokens(dark);
  const fontStack = (FONTS_SCREEN.find(f => f.id === fontId) || FONTS_SCREEN[0]).stack;

  // ── Load chapter from API ──────────────────────────────────────────
  useEffect(() => {
    const book = allBooks[bookIdx];
    if (!book) return;
    const serverId = book[3];
    setChapterLoading(true);
    setChapterVerses([]);
    setActiveVerse(null);
    fetch(`/api/books/${serverId}/chapters/${chapter}?translation=${translation}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setChapterVerses(data.verses || []);
          setChapterBookMeta(data.book || null);
        }
        setChapterLoading(false);
      })
      .catch(() => setChapterLoading(false));
  }, [bookIdx, chapter, translation]);

  // ── Load songs from API ────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/songs?limit=300')
      .then(r => r.json())
      .then(data => setSongsList(data.items || []))
      .catch(() => {});
  }, []);

  // ── Sync screen settings to localStorage ──────────────────────────
  useEffect(() => {
    localStorage.setItem('screen-bg',       bg);
    localStorage.setItem('screen-fontId',   fontId);
    localStorage.setItem('screen-fontSize', String(fontSize));
    localStorage.setItem('screen-settings-trigger', String(Date.now()));
  }, [bg, fontId, fontSize]);

  // ── Persist translation choice ─────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('ui-trans', translation);
  }, [translation]);

  // ── When template changes reset content ───────────────────────────
  useEffect(() => {
    setContent(defaultContent(template));
  }, [template]);

  // ── Track if TV window was closed ─────────────────────────────────
  useEffect(() => {
    if (!screenOn) return;
    const id = setInterval(() => {
      if (screenWindowRef.current && screenWindowRef.current.closed) {
        screenWindowRef.current = null;
        setScreenOn(false);
      }
    }, 1500);
    return () => clearInterval(id);
  }, [screenOn]);

  // ── Helpers ────────────────────────────────────────────────────────
  function bookLabel(meta) {
    const b = allBooks[bookIdx];
    if (translation === 'kyb') return b ? b[1] : (meta?.ru || ''); // kyFull from frontend data
    if (translation === 'kjv') return meta?.en || '';
    return meta?.ru || (b ? b[1] : ''); // short Russian name
  }

  const TRANS_LABEL = { rst:'РСТ · Синодальный', kyb:'КРГ · KYB 2004', kjv:'KJV' };
  const BILINGUAL_PAIR = { kyb: 'rst', rst: 'kyb', kjv: 'rst' };

  // ── ACTIONS ────────────────────────────────────────────────────────
  function sendVerse(verseNum, text) {
    if (template === 'bilingual') {
      sendBilingualVerse(verseNum, text);
      return;
    }
    const ref = `${bookLabel(chapterBookMeta)} ${chapter}:${verseNum}`;
    const newContent = { ref, text, translation: TRANS_LABEL[translation] || '' };
    setActiveVerse(verseNum);
    setTemplate('verse');
    setContent(newContent);
    pushToScreen('verse', newContent);
  }

  async function sendBilingualVerse(verseNum, text) {
    const book = allBooks[bookIdx];
    if (!book) return;
    const ref = `${bookLabel(chapterBookMeta)} ${chapter}:${verseNum}`;
    const trans2 = BILINGUAL_PAIR[translation] || 'rst';
    const lang1 = TRANS_LABEL[translation] || translation;
    const lang2 = TRANS_LABEL[trans2] || trans2;
    setActiveVerse(verseNum);
    const interim = { ref, text, lang1, text2: '…', lang2 };
    setContent(interim);
    pushToScreen('bilingual', interim);
    try {
      const data = await fetch(`/api/books/${book[3]}/chapters/${chapter}?translation=${trans2}`).then(r => r.json());
      const v2 = (data.verses || []).find(v => v.number === verseNum);
      const final = { ref, text, lang1, text2: v2 ? v2.text : '', lang2 };
      setContent(final);
      pushToScreen('bilingual', final);
    } catch {}
  }

  async function selectSong(songId) {
    setActiveSongId(songId);
    setActiveBlockIdx(0);
    if (songCache[songId]) {
      setActiveSongData(songCache[songId]);
      setActiveSongBlocks(songCache[songId].blocks);
      return;
    }
    try {
      const data = await fetch(`/api/songs/${songId}`).then(r => r.json());
      const blocks = parseSongBlocks(data.lyrics);
      const entry = { id: data.id, title: data.title, firstLine: data.firstLine, lyrics: data.lyrics, blocks };
      setSongCache(prev => ({ ...prev, [songId]: entry }));
      setActiveSongData(entry);
      setActiveSongBlocks(blocks);
    } catch {}
  }

  function sendSongTitle() {
    if (!activeSongData) return;
    setTemplate('song-title');
    const newContent = { title: activeSongData.title, subtitle: activeSongData.firstLine || '' };
    setContent(newContent);
    pushToScreen('song-title', newContent);
  }

  function sendSongBlock(idx) {
    if (!activeSongData || !activeSongBlocks[idx]) return;
    const block = activeSongBlocks[idx];
    setActiveBlockIdx(idx);
    const total = activeSongBlocks.length;
    let tmpl, newContent;
    if (block.type === 'chorus') {
      tmpl = 'chorus';
      newContent = { text: block.text, songTitle: activeSongData.title };
    } else {
      tmpl = 'song-verse';
      newContent = { text: block.text, partNum: block.n, songTitle: activeSongData.title, position: `${idx+1} / ${total}` };
    }
    setTemplate(tmpl);
    setContent(newContent);
    pushToScreen(tmpl, newContent);
  }

  function clearScreen() {
    setTemplate('logo');
    setContent({});
    pushToScreen('logo', {});
  }

  // ── Song editor ────────────────────────────────────────────
  function openSongEditor(songId) {
    const cached = songCache[songId];
    if (cached && cached.lyrics !== undefined) {
      setEditingSong({ id: cached.id, title: cached.title, lyrics: cached.lyrics, isNew: false });
      return;
    }
    if (activeSongData && activeSongData.id === songId && activeSongData.lyrics !== undefined) {
      setEditingSong({ id: activeSongData.id, title: activeSongData.title, lyrics: activeSongData.lyrics, isNew: false });
      return;
    }
    fetch(`/api/songs/${songId}`).then(r => r.json()).then(data => {
      setEditingSong({ id: data.id, title: data.title, lyrics: data.lyrics, isNew: false });
    }).catch(() => {});
  }

  function openNewSong() {
    setEditingSong({ id: null, title: '', lyrics: '', isNew: true });
  }

  async function handleSongSaved(savedSong) {
    try {
      const data = await fetch('/api/songs?limit=300').then(r => r.json());
      setSongsList(data.items || []);
    } catch {}
    const blocks = parseSongBlocks(savedSong.lyrics || '');
    const entry = { id: savedSong.id, title: savedSong.title, firstLine: savedSong.firstLine, lyrics: savedSong.lyrics, blocks };
    setSongCache(prev => {
      const next = { ...prev };
      if (savedSong.replacedId) delete next[savedSong.replacedId];
      next[savedSong.id] = entry;
      return next;
    });
    setActiveSongId(savedSong.id);
    setActiveSongData(entry);
    setActiveSongBlocks(blocks);
    setActiveBlockIdx(0);
    setEditingSong(null);
  }

  // ── Keyboard navigation ────────────────────────────────────
  const kbRef = useRef(null);
  kbRef.current = (e) => {
    if (editingSong) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;

    if (tab === 'books' || tab === 'search') {
      const maxCh = allBooks[bookIdx]?.[2] || 1;
      switch (e.key) {
        case 'ArrowUp':   e.preventDefault(); setChapter(c => Math.max(1, c - 1)); break;
        case 'ArrowDown': e.preventDefault(); setChapter(c => Math.min(maxCh, c + 1)); break;
        case 'ArrowLeft': e.preventDefault(); {
          if (!chapterVerses.length) break;
          const ci = chapterVerses.findIndex(v => v.number === activeVerse);
          const ni = ci <= 0 ? 0 : ci - 1;
          const v = chapterVerses[ni]; if (v) sendVerse(v.number, v.text);
          break;
        }
        case 'ArrowRight': e.preventDefault(); {
          if (!chapterVerses.length) break;
          const ci = chapterVerses.findIndex(v => v.number === activeVerse);
          const ni = ci < 0 ? 0 : Math.min(chapterVerses.length - 1, ci + 1);
          const v = chapterVerses[ni]; if (v) sendVerse(v.number, v.text);
          break;
        }
      }
    } else if (tab === 'songs') {
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); {
          if (!songsList.length) break;
          const ci = songsList.findIndex(s => s.id === activeSongId);
          const ni = ci <= 0 ? 0 : ci - 1;
          if (songsList[ni]) selectSong(songsList[ni].id);
          break;
        }
        case 'ArrowDown': e.preventDefault(); {
          if (!songsList.length) break;
          const ci = songsList.findIndex(s => s.id === activeSongId);
          const ni = ci < 0 ? 0 : Math.min(songsList.length - 1, ci + 1);
          if (songsList[ni]) selectSong(songsList[ni].id);
          break;
        }
        case 'ArrowLeft': e.preventDefault(); {
          if (!activeSongBlocks.length) break;
          sendSongBlock(Math.max(0, activeBlockIdx - 1));
          break;
        }
        case 'ArrowRight': e.preventDefault(); {
          if (!activeSongBlocks.length) break;
          sendSongBlock(Math.min(activeSongBlocks.length - 1, activeBlockIdx + 1));
          break;
        }
      }
    }
  };

  useEffect(() => {
    const handler = (e) => kbRef.current?.(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function openTvScreen() {
    if (screenWindowRef.current && !screenWindowRef.current.closed) {
      screenWindowRef.current.focus();
      return;
    }
    const w = window.open('?mode=screen', 'tv-screen', 'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no');
    if (w) {
      screenWindowRef.current = w;
      setScreenOn(true);
    }
  }

  function closeTvScreen() {
    if (screenWindowRef.current && !screenWindowRef.current.closed) {
      screenWindowRef.current.close();
    }
    screenWindowRef.current = null;
    setScreenOn(false);
  }

  // Search with debounce
  const searchTimerRef = useRef(null);
  function handleSearchInput(q) {
    setSearchQuery(q);
    clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await fetch(`/api/search?translation=${translation}&q=${encodeURIComponent(q)}&limit=60`).then(r => r.json());
        setSearchResults(data.items || []);
      } catch {}
      setSearchLoading(false);
    }, 220);
  }

  function sendSearchResult(item) {
    const newContent = { ref: item.ref, text: item.text, translation: TRANS_LABEL[translation] || '' };
    setTemplate('verse');
    setContent(newContent);
    pushToScreen('verse', newContent);
    // Also navigate to that chapter in the books tab
    const allBooksAll = [...BOOKS_OT_FULL, ...BOOKS_NT_FULL];
    const idx = allBooksAll.findIndex(b => b[3] === item.bookId);
    if (idx >= 0) {
      setBookIdx(idx);
      setChapter(item.chapter);
      setTab('books');
    }
  }

  const state = { template, bg, fontStack, fontSize, content };
  const currentBook = allBooks[bookIdx];
  const chapterTitle = chapterBookMeta
    ? `${bookLabel(chapterBookMeta)} · Глава ${chapter}`
    : currentBook
      ? `${currentBook[1]} · Глава ${chapter}`
      : 'Загрузка...';

  return (
    <div style={{
      width:'100vw', minHeight:'100vh',
      background: C.bg, color: C.text, fontFamily:'Manrope',
      display:'grid', gridTemplateColumns:'380px 1fr',
      transition:'background 0.3s, color 0.3s',
    }}>
      {editingSong && (
        <SongEditorModal
          C={C} dark={dark}
          song={editingSong}
          onSave={handleSongSaved}
          onClose={() => setEditingSong(null)}
        />
      )}
      <Sidebar
        C={C} dark={dark} setDark={setDark}
        translation={translation} setTranslation={setTranslation}
        tab={tab} setTab={setTab}
        bookIdx={bookIdx} setBookIdx={setBookIdx}
        chapter={chapter} setChapter={setChapter}
        activeSongId={activeSongId}
        activeSongBlocks={activeSongBlocks}
        activeSongData={activeSongData}
        activeBlockIdx={activeBlockIdx}
        songsList={songsList}
        selectSong={selectSong}
        sendSongTitle={sendSongTitle}
        sendSongBlock={sendSongBlock}
        openSongEditor={openSongEditor}
        openNewSong={openNewSong}
        searchQuery={searchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        handleSearchInput={handleSearchInput}
        sendSearchResult={sendSearchResult}
      />
      <Main
        C={C} dark={dark}
        state={state}
        template={template} setTemplate={setTemplate}
        bg={bg} setBg={setBg}
        fontId={fontId} setFontId={setFontId}
        fontSize={fontSize} setFontSize={setFontSize}
        content={content} setContent={setContent}
        screenOn={screenOn}
        openTvScreen={openTvScreen}
        closeTvScreen={closeTvScreen}
        tab={tab}
        activeVerse={activeVerse}
        sendVerse={sendVerse}
        chapterVerses={chapterVerses}
        chapterLoading={chapterLoading}
        chapterTitle={chapterTitle}
        chapter={chapter} setChapter={setChapter}
        bookIdx={bookIdx}
        allBooks={allBooks}
        activeSongData={activeSongData}
        activeSongBlocks={activeSongBlocks}
        activeBlockIdx={activeBlockIdx}
        sendSongBlock={sendSongBlock}
        openSongEditor={openSongEditor}
        clearScreen={clearScreen}
      />
    </div>
  );
}

/* ============ Sidebar ============ */
function Sidebar({ C, dark, setDark, translation, setTranslation, tab, setTab,
  bookIdx, setBookIdx, chapter, setChapter,
  activeSongId, activeSongBlocks, activeSongData, activeBlockIdx,
  songsList, selectSong, sendSongTitle, sendSongBlock,
  openSongEditor, openNewSong,
  searchQuery, searchResults, searchLoading, handleSearchInput, sendSearchResult,
}) {
  return (
    <aside style={{
      background: C.panelBg, borderRight: `1px solid ${C.border}`,
      padding: '24px 22px', display:'flex', flexDirection:'column', gap: 18,
      position:'sticky', top: 0, height: '100vh', overflow:'hidden',
    }}>
      {/* Brand */}
      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.accent}, ${dark ? '#8B5A2B' : '#6B4220'})`,
          display:'grid', placeItems:'center', color:'#FBF8F2',
          fontFamily:'Cormorant Garamond', fontSize: 22, fontWeight: 700,
        }}>В</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily:'Cormorant Garamond', fontSize: 22, fontWeight: 600, color: C.accent, lineHeight: 1.1 }}>Великая Благодать</div>
          <div style={{ fontSize: 11, color: C.textSubtle, marginTop: 2 }}>Библия · Песни · Проектор</div>
        </div>
        <button onClick={() => setDark(!dark)} title="Сменить тему" style={{
          width: 34, height: 34, borderRadius: 999,
          background: C.cardBg, border: `1px solid ${C.border}`,
          color: C.accent, cursor:'pointer', fontSize: 16,
        }}>{dark ? '☀' : '☾'}</button>
      </div>

      {/* Translation */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1, marginBottom: 8 }}>ПЕРЕВОД</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 6 }}>
          {[
            { code:'kyb', short:'КРГ', name:'Кыргызча' },
            { code:'rst', short:'РСТ', name:'Русский' },
            { code:'kjv', short:'KJV', name:'King James' },
          ].map(t => (
            <div key={t.code} onClick={() => setTranslation(t.code)} style={{
              padding:'8px 4px', borderRadius: 8,
              border: `1px solid ${translation===t.code ? C.accent : C.border}`,
              background: translation===t.code ? C.accentSoft : 'transparent',
              color: translation===t.code ? C.accent : C.text, textAlign:'center', cursor:'pointer',
            }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{t.short}</div>
              <div style={{ fontSize: 10, color: translation===t.code ? C.accent : C.textMute, marginTop: 2 }}>{t.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap: 22, borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginTop: 4 }}>
        {[['search','Поиск'], ['books','Книги'], ['songs','Песни']].map(([id,l]) => (
          <div key={id} onClick={() => setTab(id)} style={{
            fontSize: 14, fontWeight: tab===id ? 700 : 500,
            color: tab===id ? C.text : C.textMute,
            position:'relative', paddingBottom: 10, cursor:'pointer',
          }}>
            {l}
            {tab===id && <div style={{ position:'absolute', left:0, right:0, bottom:-11, height: 2, background: C.accent }}/>}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflow:'auto' }}>
        {tab === 'search' && (
          <SearchTab C={C}
            searchQuery={searchQuery} searchResults={searchResults}
            searchLoading={searchLoading} handleSearchInput={handleSearchInput}
            sendSearchResult={sendSearchResult}
          />
        )}
        {tab === 'books' && (
          <BooksTab C={C} bookIdx={bookIdx} setBookIdx={setBookIdx}
            chapter={chapter} setChapter={setChapter}
          />
        )}
        {tab === 'songs' && (
          <SongsTab C={C}
            songsList={songsList} activeSongId={activeSongId}
            activeSongBlocks={activeSongBlocks} activeSongData={activeSongData}
            activeBlockIdx={activeBlockIdx}
            selectSong={selectSong} sendSongTitle={sendSongTitle} sendSongBlock={sendSongBlock}
            openSongEditor={openSongEditor} openNewSong={openNewSong}
          />
        )}
      </div>
    </aside>
  );
}

/* ============ Search Tab ============ */
function SearchTab({ C, searchQuery, searchResults, searchLoading, handleSearchInput, sendSearchResult }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
      <div style={{
        padding:'10px 14px', borderRadius: 10,
        background: C.cardBg, border: `1px solid ${C.border}`,
        display:'flex', alignItems:'center', gap: 10,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input
          value={searchQuery}
          onChange={e => handleSearchInput(e.target.value)}
          placeholder="Поиск: слово или Иоанна 3:16"
          style={{
            flex:1, border:'none', background:'transparent', outline:'none',
            color: C.text, fontFamily:'Manrope', fontSize: 13,
          }}
        />
      </div>
      {!searchQuery && (
        <div style={{ fontSize: 11, color: C.textSubtle }}>
          Подсказка: введите слово или ссылку «Иоанна 3:16»
        </div>
      )}
      {searchLoading && (
        <div style={{ fontSize: 12, color: C.textMute, padding:'8px 0' }}>Поиск...</div>
      )}
      {searchResults.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>
            РЕЗУЛЬТАТЫ · {searchResults.length}
          </div>
          {searchResults.map((item, i) => (
            <div key={i} onClick={() => sendSearchResult(item)} style={{
              padding:'10px 12px', borderRadius: 8, background: C.cardBg,
              border: `1px solid ${C.border}`, cursor:'pointer',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 4 }}>{item.ref}</div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>
                {item.text.length > 120 ? item.text.slice(0,120)+'…' : item.text}
              </div>
            </div>
          ))}
        </div>
      )}
      {searchQuery && !searchLoading && searchResults.length === 0 && (
        <div style={{ fontSize: 12, color: C.textMute }}>Ничего не найдено</div>
      )}
    </div>
  );
}

/* ============ Books Tab ============ */
function BooksTab({ C, bookIdx, setBookIdx, chapter, setChapter }) {
  const allBooks = useMemo(() => [...BOOKS_OT_FULL, ...BOOKS_NT_FULL], []);
  const book = allBooks[bookIdx];
  const chapterCount = book ? book[2] : 28;

  function selectBook(idx) {
    setBookIdx(idx);
    setChapter(1);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>ВЕТХИЙ ЗАВЕТ · 39 КНИГ</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 5 }}>
        {BOOKS_OT_FULL.map(([n, f], i) => (
          <div key={i} onClick={() => selectBook(i)} title={f} style={{
            padding:'8px 4px', borderRadius: 8,
            border: `1px solid ${bookIdx===i ? C.accent : C.border}`,
            background: bookIdx===i ? C.accentSoft : 'transparent',
            color: bookIdx===i ? C.accent : C.text,
            textAlign:'center', fontSize: 12, fontWeight: bookIdx===i ? 600 : 500,
            cursor:'pointer',
          }}>{n}</div>
        ))}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1, marginTop: 8 }}>НОВЫЙ ЗАВЕТ · 27 КНИГ</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 5 }}>
        {BOOKS_NT_FULL.map(([n, f], i) => {
          const realIdx = i + BOOKS_OT_FULL.length;
          return (
            <div key={i} onClick={() => selectBook(realIdx)} title={f} style={{
              padding:'8px 4px', borderRadius: 8,
              border: `1px solid ${bookIdx===realIdx ? C.accent : C.border}`,
              background: bookIdx===realIdx ? C.accentSoft : 'transparent',
              color: bookIdx===realIdx ? C.accent : C.text,
              textAlign:'center', fontSize: 12, fontWeight: bookIdx===realIdx ? 600 : 500,
              cursor:'pointer',
            }}>{n}</div>
          );
        })}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1, marginTop: 12 }}>
        ГЛАВА · {book ? book[1] : ''}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 4 }}>
        {Array.from({ length: chapterCount }).map((_, i) => (
          <div key={i} onClick={() => setChapter(i+1)} style={{
            padding:'6px 0', borderRadius: 6,
            border: `1px solid ${chapter===i+1 ? C.accent : C.border}`,
            background: chapter===i+1 ? C.accentSoft : 'transparent',
            color: chapter===i+1 ? C.accent : C.text,
            textAlign:'center', fontSize: 11, fontWeight: chapter===i+1 ? 700 : 500,
            cursor:'pointer',
          }}>{i+1}</div>
        ))}
      </div>
    </div>
  );
}

/* ============ Songs Tab ============ */
function SongsTab({ C, songsList, activeSongId, activeSongBlocks, activeSongData, activeBlockIdx,
  selectSong, sendSongTitle, sendSongBlock, openSongEditor, openNewSong }) {
  const [filter, setFilter] = useState('');
  const visible = filter
    ? songsList.filter(s => s.title.toLowerCase().includes(filter.toLowerCase()) || (s.firstLine||'').toLowerCase().includes(filter.toLowerCase()))
    : songsList;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
      {/* Search + New song */}
      <div style={{ display:'flex', gap: 6 }}>
        <div style={{
          flex: 1, padding:'8px 12px', borderRadius: 8,
          background: C.cardBg, border: `1px solid ${C.border}`,
          display:'flex', alignItems:'center', gap: 8,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Фильтр песен..."
            style={{ flex:1, border:'none', background:'transparent', outline:'none', color:C.text, fontFamily:'Manrope', fontSize:12 }}
          />
        </div>
        <button onClick={openNewSong} title="Новая песня" style={{
          padding:'8px 10px', borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.cardBg, color: C.accent, cursor:'pointer', fontSize: 16, lineHeight: 1,
        }}>+</button>
      </div>
      {songsList.length === 0 && (
        <div style={{ fontSize:12, color:C.textMute, padding:'8px 0' }}>Загрузка песен...</div>
      )}
      {visible.map(song => (
        <div key={song.id} style={{
          borderRadius: 10, border: `1px solid ${activeSongId===song.id ? C.accent : C.border}`,
          background: activeSongId===song.id ? C.accentSoft : C.cardBg,
          overflow:'hidden',
        }}>
          <div onClick={() => selectSong(song.id)} style={{
            padding:'10px 12px', display:'flex', alignItems:'center', gap: 8, cursor:'pointer',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily:'Cormorant Garamond', fontSize: 16, fontWeight: 600, color: C.text }}>{song.title}</div>
              {song.firstLine && (
                <div style={{ fontSize: 11, color: C.textMute, marginTop: 1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{song.firstLine}</div>
              )}
            </div>
            {activeSongId === song.id && (
              <>
                <button onClick={e => { e.stopPropagation(); sendSongTitle(); }} style={{
                  padding:'4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor:'pointer',
                  background: C.accent, color: C.primaryText, border:'none', flexShrink: 0,
                }}>Заставка</button>
                <button onClick={e => { e.stopPropagation(); openSongEditor(song.id); }} title="Редактировать песню" style={{
                  padding:'4px 8px', borderRadius: 6, fontSize: 12, cursor:'pointer',
                  background: 'transparent', color: C.textMute, border: `1px solid ${C.border}`,
                  flexShrink: 0, lineHeight: 1,
                }}>✎</button>
              </>
            )}
          </div>
          {activeSongId === song.id && activeSongBlocks.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '6px 8px', display:'flex', flexDirection:'column', gap: 4 }}>
              {activeSongBlocks.map((b, idx) => (
                <div key={idx} onClick={() => sendSongBlock(idx)} style={{
                  padding:'6px 8px', borderRadius: 6,
                  background: activeBlockIdx===idx ? C.accent : 'transparent',
                  color: activeBlockIdx===idx ? C.primaryText : C.text,
                  fontSize: 12, cursor:'pointer',
                  display:'flex', alignItems:'center', gap: 8,
                }}>
                  <span style={{
                    minWidth: 54, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform:'uppercase',
                    color: activeBlockIdx===idx ? 'rgba(255,255,255,0.85)' : (b.type==='chorus' ? C.accent : C.textMute),
                  }}>{b.type === 'chorus' ? '✦ Припев' : `Куплет ${b.n}`}</span>
                  <span style={{ flex: 1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {b.text.split('\n')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
          {activeSongId === song.id && activeSongBlocks.length === 0 && activeSongData === null && (
            <div style={{ padding:'8px 12px', fontSize:11, color:C.textMute }}>Загрузка...</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============ Main area ============ */
function Main({ C, dark, state, template, setTemplate, bg, setBg, fontId, setFontId, fontSize, setFontSize,
  content, setContent, screenOn, openTvScreen, closeTvScreen,
  tab, activeVerse, sendVerse, chapterVerses, chapterLoading, chapterTitle,
  chapter, setChapter, bookIdx, allBooks,
  activeSongData, activeSongBlocks, activeBlockIdx, sendSongBlock,
  openSongEditor, clearScreen }) {

  return (
    <main style={{ padding:'22px 28px', display:'flex', flexDirection:'column', gap: 18, minWidth: 0 }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 20 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily:'Cormorant Garamond', fontSize: 30, fontWeight: 600, color: C.text, letterSpacing: -0.5 }}>
            Предпросмотр
          </div>
          <div style={{ color: C.textMute, fontSize: 12, marginTop: 4, display:'flex', gap: 14, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: 999,
                background: screenOn ? C.live : '#999',
                boxShadow: screenOn ? `0 0 8px ${C.live}` : 'none',
              }}/>
              {screenOn ? 'ТВ-экран открыт · 1920×1080' : 'Экран не открыт'}
            </span>
            <span>{tab === 'songs' ? '↑↓ — песни · ←→ — слайды' : '↑↓ — главы · ←→ — стихи'}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button onClick={clearScreen} style={{
            padding:'9px 14px', borderRadius: 10,
            background:'transparent', border: `1px solid ${C.border}`,
            color: C.danger, fontWeight: 600, fontSize: 13, fontFamily:'Manrope', cursor:'pointer',
          }}>Очистить экран</button>
          <button onClick={screenOn ? closeTvScreen : openTvScreen} style={{
            padding:'9px 18px', borderRadius: 10,
            background: screenOn ? C.accentSoft : C.primary,
            border: screenOn ? `1px solid ${C.accent}` : 'none',
            color: screenOn ? C.accent : C.primaryText,
            fontWeight: 700, fontSize: 13, fontFamily:'Manrope', cursor:'pointer',
          }}>{screenOn ? 'Закрыть экран ТВ' : 'Открыть экран ТВ ↗'}</button>
        </div>
      </div>

      <TemplatePicker C={C} template={template} setTemplate={setTemplate} tab={tab}/>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap: 18 }}>
        <PreviewFrame C={C} state={state} screenOn={screenOn}/>
        <ScreenControls C={C} bg={bg} setBg={setBg} fontId={fontId} setFontId={setFontId} fontSize={fontSize} setFontSize={setFontSize}/>
      </div>

      <ContextList
        C={C} tab={tab} dark={dark}
        activeVerse={activeVerse} sendVerse={sendVerse}
        chapterVerses={chapterVerses} chapterLoading={chapterLoading} chapterTitle={chapterTitle}
        chapter={chapter} setChapter={setChapter} bookIdx={bookIdx} allBooks={allBooks}
        activeSongData={activeSongData} activeSongBlocks={activeSongBlocks}
        activeBlockIdx={activeBlockIdx} sendSongBlock={sendSongBlock}
        openSongEditor={openSongEditor}
        template={template} content={content} setContent={setContent}
      />
    </main>
  );
}

/* ============ Template picker ============ */
function TemplatePicker({ C, template, setTemplate, tab }) {
  const songIds    = ['song-title', 'song-verse', 'chorus'];
  const bibleIds   = ['verse', 'bilingual'];
  const serviceIds = ['welcome', 'prayer', 'announce', 'logo'];
  const contextIds = tab === 'songs'
    ? [...songIds, ...serviceIds]
    : [...bibleIds, ...serviceIds];
  const visible = TEMPLATES
    .filter(t => contextIds.includes(t.id))
    .sort((a, b) => contextIds.indexOf(a.id) - contextIds.indexOf(b.id));

  return (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: C.panelBg, border: `1px solid ${C.border}` }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>ШАБЛОН СЛАЙДА</div>
        <div style={{ fontSize: 11, color: C.textMute }}>{visible.length} готовых · кликните для предпросмотра</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${visible.length}, 1fr)`, gap: 8 }}>
        {visible.map(t => (
          <div key={t.id} onClick={() => setTemplate(t.id)} style={{
            padding:'10px 8px', borderRadius: 10,
            border: `1px solid ${template===t.id ? C.accent : C.border}`,
            background: template===t.id ? C.accentSoft : C.cardBg,
            cursor:'pointer', textAlign:'center',
          }}>
            <div style={{ fontSize: 20, color: template===t.id ? C.accent : C.textMute, lineHeight: 1 }}>{t.icon}</div>
            <div style={{ fontSize: 12, fontWeight: template===t.id ? 700 : 600, color: template===t.id ? C.accent : C.text, marginTop: 6 }}>{t.label}</div>
            <div style={{ fontSize: 10, color: C.textMute, marginTop: 2 }}>{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Preview frame ============ */
function PreviewFrame({ C, state, screenOn }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    function fit() {
      if (!ref.current) return;
      setScale(ref.current.clientWidth / 1920);
    }
    fit();
    const ro = new ResizeObserver(fit);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      aspectRatio: '16 / 9', borderRadius: 14,
      background:'#000', border: `1px solid ${C.border}`,
      position:'relative', overflow:'hidden',
      boxShadow:'0 30px 60px -20px rgba(0,0,0,0.4)',
    }}>
      <div style={{ width: 1920, height: 1080, position:'absolute', top: 0, left: 0 }}>
        <TVScreen state={state} scale={scale}/>
      </div>
      <div style={{
        position:'absolute', top: 14, left: 14, zIndex: 10,
        padding:'4px 10px', borderRadius: 6,
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
        color:'#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1,
        display:'flex', alignItems:'center', gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: screenOn ? '#FF4C4C' : '#666' }}/>
        {screenOn ? 'В ЭФИРЕ' : 'НЕ В ЭФИРЕ'}
      </div>
      {!screenOn && (
        <div style={{
          position:'absolute', inset: 0, background:'rgba(0,0,0,0.55)',
          display:'grid', placeItems:'center', color:'#fff', fontFamily:'Manrope', fontSize: 14, zIndex: 5,
        }}>Экран не транслируется</div>
      )}
    </div>
  );
}

/* ============ Screen controls (right panel) ============ */
function ScreenControls({ C, bg, setBg, fontId, setFontId, fontSize, setFontSize }) {
  return (
    <div style={{ padding: 16, borderRadius: 14, background: C.panelBg, border: `1px solid ${C.border}`, display:'flex', flexDirection:'column', gap: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>ФОН ЭКРАНА</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 10 }}>
        {SCREEN_BGS.map(b => (
          <div key={b.id} onClick={() => setBg(b.id)} style={{ position:'relative', cursor:'pointer' }}>
            <div style={{
              width:'100%', aspectRatio:'1', borderRadius: 999,
              background: b.flat || b.bg,
              border: bg===b.id ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
              boxShadow: bg===b.id ? `0 0 0 3px ${C.accentSoft}` : 'none',
            }}/>
            <div style={{ fontSize: 9, color: C.textMute, marginTop: 4, textAlign:'center', fontWeight: bg===b.id ? 700 : 400 }}>{b.label}</div>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: C.border }}/>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>ШРИФТ</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 5 }}>
        {FONTS_SCREEN.map(f => (
          <div key={f.id} onClick={() => setFontId(f.id)} style={{
            padding:'8px 4px', borderRadius: 8,
            border: `1px solid ${fontId===f.id ? C.accent : C.border}`,
            background: fontId===f.id ? C.accentSoft : 'transparent',
            color: fontId===f.id ? C.accent : C.text,
            textAlign:'center', fontSize: 11, fontWeight: 600, fontFamily: f.stack,
            cursor:'pointer',
          }}>{f.label}</div>
        ))}
      </div>
      <div style={{ height: 1, background: C.border }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>РАЗМЕР ТЕКСТА</div>
        <div style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{fontSize}pt</div>
      </div>
      <input type="range" min="32" max="140" value={fontSize}
        onChange={e => setFontSize(+e.target.value)}
        style={{ width:'100%', accentColor: C.accent }}/>
      <div style={{ display:'flex', gap: 6 }}>
        {[{l:'S',v:48},{l:'M',v:64},{l:'L',v:80},{l:'XL',v:104}].map(s => (
          <div key={s.l} onClick={() => setFontSize(s.v)} style={{
            flex:1, textAlign:'center', padding:'6px 0',
            borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: fontSize===s.v ? C.accentSoft : 'transparent',
            color: fontSize===s.v ? C.accent : C.textMute,
            border: `1px solid ${fontSize===s.v ? C.accent : C.border}`,
            cursor:'pointer',
          }}>{s.l}</div>
        ))}
      </div>
    </div>
  );
}

/* ============ Context list — verses / song / editor ============ */
function ContextList({ C, tab, dark,
  activeVerse, sendVerse, chapterVerses, chapterLoading, chapterTitle,
  chapter, setChapter, bookIdx, allBooks,
  activeSongData, activeSongBlocks, activeBlockIdx, sendSongBlock,
  openSongEditor, template, content, setContent }) {

  if (['welcome','prayer','announce','logo','song-title'].includes(template)) {
    return <ContentEditor C={C} template={template} content={content} setContent={setContent}/>;
  }

  if (tab === 'songs' && activeSongData) {
    return (
      <div style={{ background: C.panelBg, borderRadius: 14, border: `1px solid ${C.border}`, overflow:'hidden', minHeight: 280 }}>
        <div style={{ padding:'14px 20px', borderBottom: `1px solid ${C.border}`, display:'flex', alignItems:'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily:'Cormorant Garamond', fontSize: 20, fontWeight: 600 }}>{activeSongData.title}</div>
            <div style={{ fontSize: 12, color: C.textMute, marginTop: 2 }}>
              {activeSongBlocks.length} частей · кликните чтобы вывести на ТВ · ←→ клавиши
            </div>
          </div>
          <button onClick={() => openSongEditor(activeSongData.id)} style={{
            padding:'8px 14px', borderRadius: 8,
            border: `1px solid ${C.border}`, background: C.cardBg,
            color: C.text, fontFamily:'Manrope', fontSize: 12, fontWeight: 600, cursor:'pointer',
            display:'flex', alignItems:'center', gap: 6,
          }}>✎ Редактировать</button>
        </div>
        <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap: 6 }}>
          {activeSongBlocks.map((b, idx) => (
            <div key={idx} onClick={() => sendSongBlock(idx)} style={{
              padding:'10px 14px', borderRadius: 10,
              background: activeBlockIdx===idx ? C.accentSoft : C.cardBg,
              border: `1px solid ${activeBlockIdx===idx ? C.accent : C.border}`,
              cursor:'pointer', display:'flex', gap: 14,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform:'uppercase',
                color: b.type==='chorus' ? C.accent : C.textMute,
                minWidth: 70, paddingTop: 4,
              }}>{b.type==='chorus' ? '✦ Припев' : `Куплет ${b.n}`}</span>
              <div style={{ whiteSpace:'pre-line', fontSize: 14, lineHeight: 1.5, color: C.text }}>{b.text}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Verse list ──
  const currentBook = allBooks[bookIdx];
  const maxChapter = currentBook ? currentBook[2] : 1;

  return (
    <div style={{ background: C.panelBg, borderRadius: 14, border: `1px solid ${C.border}`, overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontFamily:'Cormorant Garamond', fontSize: 20, fontWeight: 600 }}>{chapterTitle}</div>
          <div style={{ fontSize: 12, color: C.textMute, marginTop: 2 }}>
            {chapterLoading ? 'Загрузка...' : template === 'bilingual'
            ? `${chapterVerses.length} стихов · кликните → оба перевода на ТВ`
            : `${chapterVerses.length} стихов · кликните по номеру → отправить на ТВ`}
          </div>
        </div>
        <div style={{ display:'flex', gap: 6 }}>
          <button onClick={() => setChapter(c => Math.max(1, c - 1))} disabled={chapter <= 1} style={{
            width: 34, height: 34, borderRadius: 8,
            background: C.cardBg, border: `1px solid ${C.border}`, color: C.text, cursor:'pointer',
            opacity: chapter <= 1 ? 0.4 : 1,
          }}>↑</button>
          <button onClick={() => setChapter(c => Math.min(maxChapter, c + 1))} disabled={chapter >= maxChapter} style={{
            width: 34, height: 34, borderRadius: 8,
            background: C.cardBg, border: `1px solid ${C.border}`, color: C.text, cursor:'pointer',
            opacity: chapter >= maxChapter ? 0.4 : 1,
          }}>↓</button>
        </div>
      </div>
      <div style={{ padding:'6px 12px' }}>
        {chapterLoading && (
          <div style={{ padding:'20px', textAlign:'center', color: C.textMute, fontSize: 13 }}>Загрузка главы...</div>
        )}
        {!chapterLoading && chapterVerses.length === 0 && (
          <div style={{ padding:'20px', textAlign:'center', color: C.textMute, fontSize: 13 }}>Нет данных для этой главы</div>
        )}
        {chapterVerses.map(v => (
          <div key={v.number} onClick={() => sendVerse(v.number, v.text)} style={{
            display:'flex', gap: 14, padding:'10px 12px', borderRadius: 8,
            background: activeVerse===v.number ? C.accentSoft : 'transparent', cursor:'pointer',
          }}>
            <span style={{ fontFamily:'Cormorant Garamond', fontSize: 18, fontWeight: 600, color: C.accent, minWidth: 26, paddingTop: 2 }}>
              {v.number}
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: C.text, fontWeight: activeVerse===v.number ? 600 : 400 }}>
              {v.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Content editor for service templates ============ */
function ContentEditor({ C, template, content, setContent }) {
  function field(key, label, multi) {
    return (
      <div key={key} style={{ display:'flex', flexDirection:'column', gap: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>{label}</div>
        {multi ? (
          <textarea value={content[key] || ''} onChange={e => setContent({ ...content, [key]: e.target.value })}
            rows={3} style={{
              padding:'10px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.cardBg, color: C.text, fontFamily:'Manrope', fontSize: 14,
              resize:'vertical', outline:'none',
            }}/>
        ) : (
          <input value={content[key] || ''} onChange={e => setContent({ ...content, [key]: e.target.value })}
            style={{
              padding:'10px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.cardBg, color: C.text, fontFamily:'Manrope', fontSize: 14, outline:'none',
            }}/>
        )}
      </div>
    );
  }

  const fieldMap = {
    welcome:      [['kicker','Подзаголовок'],['title','Заголовок'],['subtitle','Перевод'],['date','Дата']],
    prayer:       [['text','Текст молитвы', true],['ref','Ссылка']],
    announce:     [['kicker','Подзаголовок'],['title','Заголовок'],['desc','Описание', true]],
    'song-title': [['title','Название'],['subtitle','Подзаголовок']],
    bilingual:    [['ref','Ссылка'],['lang1','Язык 1'],['text','Текст 1', true],['lang2','Язык 2'],['text2','Текст 2', true]],
    logo:         [],
  };
  const fields = fieldMap[template] || [];

  return (
    <div style={{ background: C.panelBg, borderRadius: 14, border: `1px solid ${C.border}`, padding:'18px 20px', display:'flex', flexDirection:'column', gap: 14 }}>
      <div>
        <div style={{ fontFamily:'Cormorant Garamond', fontSize: 20, fontWeight: 600 }}>Содержимое слайда</div>
        <div style={{ fontSize: 12, color: C.textMute, marginTop: 2 }}>
          {template === 'logo' ? 'Чёрный экран с логотипом — без полей.' : 'Изменения видны в предпросмотре сразу.'}
        </div>
      </div>
      {fields.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
          {fields.map(([k, l, m]) => field(k, l, m))}
        </div>
      )}
      {template === 'announce' && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1, marginBottom: 6 }}>СТРОКИ (Метка : Значение)</div>
          <textarea
            value={(content.rows || [['Дата','14 мая 2026, пт'],['Время','19:00 — 21:00'],['Место','Главный зал'],['Ведёт','Пастор Алексей']]).map(r => r.join(' : ')).join('\n')}
            onChange={e => setContent({ ...content, rows: e.target.value.split('\n').map(l => {
              const idx = l.indexOf(' : ');
              return idx >= 0 ? [l.slice(0, idx), l.slice(idx + 3)] : [l, ''];
            }) })}
            rows={5}
            style={{
              width:'100%', padding:'10px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.cardBg, color: C.text, fontFamily:'Manrope', fontSize: 13,
              resize:'vertical', outline:'none', boxSizing:'border-box',
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ============ Song Editor Modal (full-screen) ============ */
function SongEditorModal({ C, dark, song, onSave, onClose }) {
  const isNew = !song.id;
  const [title, setTitle] = useState(song.title || '');
  const [slides, setSlides] = useState(() => {
    if (!song.lyrics) return [''];
    return song.lyrics.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  });
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState(song.lyrics || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function switchToRaw() {
    setRawText(slides.filter(s => s.trim()).join('\n\n'));
    setRawMode(true);
  }
  function switchToSlides() {
    const parsed = rawText.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    setSlides(parsed.length ? parsed : ['']);
    setRawMode(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const lyrics = rawMode ? rawText : slides.filter(s => s.trim()).join('\n\n');
    try {
      const url = isNew ? '/api/songs/custom' : `/api/songs/${song.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, lyrics }),
      });
      if (!resp.ok) { const e = await resp.json(); throw new Error(e.error || `HTTP ${resp.status}`); }
      const saved = await resp.json();
      onSave(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  function addSlide() { setSlides(prev => [...prev, '']); }
  function updateSlide(idx, val) { setSlides(prev => { const n=[...prev]; n[idx]=val; return n; }); }
  function deleteSlide(idx) { setSlides(prev => prev.filter((_,i) => i!==idx)); }
  function moveSlide(idx, delta) {
    setSlides(prev => {
      const n = [...prev]; const other = idx + delta;
      if (other < 0 || other >= n.length) return prev;
      [n[idx], n[other]] = [n[other], n[idx]]; return n;
    });
  }

  const btn = (variant='normal') => ({
    padding: variant==='icon' ? '5px 9px' : '9px 16px',
    borderRadius: 8,
    border: variant==='primary' ? 'none' : `1px solid ${C.border}`,
    background: variant==='primary' ? C.primary : variant==='danger' ? 'transparent' : C.cardBg,
    color: variant==='primary' ? C.primaryText : variant==='danger' ? C.danger : C.text,
    fontFamily:'Manrope', fontSize: 13, fontWeight: 600, cursor:'pointer',
  });

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:C.bg, display:'flex', flexDirection:'column', fontFamily:'Manrope',
    }}>
      {/* Header */}
      <div style={{
        padding:'14px 24px', borderBottom:`1px solid ${C.border}`,
        display:'flex', alignItems:'center', gap:12, background:C.panelBg, flexShrink:0,
      }}>
        <button onClick={onClose} style={{ ...btn(), fontSize:13, padding:'8px 14px' }}>← Назад</button>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Название песни..."
          style={{
            flex:1, border:`1px solid ${C.border}`, background:C.inputBg, color:C.text,
            padding:'9px 14px', borderRadius:10,
            fontFamily:'Cormorant Garamond', fontSize:24, fontWeight:600, outline:'none',
          }}
        />
        <button onClick={rawMode ? switchToSlides : switchToRaw}
          style={{ ...btn(), fontSize:12, padding:'8px 14px' }}>
          {rawMode ? '⊞ Слайды' : '≡ Текст'}
        </button>
        <button onClick={handleSave} disabled={saving} style={{ ...btn('primary') }}>
          {saving ? 'Сохранение...' : isNew ? '+ Создать' : '✓ Сохранить'}
        </button>
      </div>

      {error && (
        <div style={{ padding:'10px 24px', background:`${C.danger}18`, color:C.danger, fontSize:13, borderBottom:`1px solid ${C.danger}30`, flexShrink:0 }}>
          Ошибка: {error}
        </div>
      )}

      {/* Hint */}
      {!rawMode && (
        <div style={{ padding:'10px 24px 0', fontSize:11, color:C.textSubtle, flexShrink:0 }}>
          Слайды разделяются пустой строкой. Строки начинающиеся с «Припев:» или «Хор:» маркируются как припев.
        </div>
      )}

      {/* Body */}
      <div style={{ flex:1, overflow:'auto', padding:'16px 24px 32px' }}>
        {rawMode ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.textSubtle, letterSpacing:1 }}>
              ПОЛНЫЙ ТЕКСТ · СЛАЙДЫ РАЗДЕЛЯЮТСЯ ПУСТОЙ СТРОКОЙ
            </div>
            <textarea
              value={rawText} onChange={e => setRawText(e.target.value)}
              style={{
                width:'100%', minHeight:'65vh', padding:'16px',
                borderRadius:12, border:`1px solid ${C.border}`,
                background:C.inputBg, color:C.text,
                fontFamily:'Manrope', fontSize:15, lineHeight:1.65,
                resize:'vertical', outline:'none', boxSizing:'border-box',
              }}
            />
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {slides.map((slide, idx) => {
              const isChorus = /^(припев|хор|chorus|ref\.?)\s*:?/i.test(slide);
              return (
                <div key={idx} style={{
                  borderRadius:12, border:`1px solid ${isChorus ? C.accent : C.border}`,
                  background:C.panelBg, overflow:'hidden',
                }}>
                  <div style={{
                    padding:'8px 12px', borderBottom:`1px solid ${C.borderSoft}`,
                    display:'flex', alignItems:'center', gap:8,
                    background: isChorus ? `${C.accent}12` : 'transparent',
                  }}>
                    <span style={{
                      fontSize:9, fontWeight:700, letterSpacing:1.5,
                      color: isChorus ? C.accent : C.textMute,
                      textTransform:'uppercase', minWidth:64,
                    }}>
                      {isChorus ? '✦ Припев' : `Слайд ${idx+1}`}
                    </span>
                    <div style={{ flex:1 }}/>
                    <button onClick={() => moveSlide(idx,-1)} disabled={idx===0}
                      style={{ ...btn('icon'), opacity: idx===0 ? 0.35 : 1, fontSize:14 }}>↑</button>
                    <button onClick={() => moveSlide(idx,+1)} disabled={idx===slides.length-1}
                      style={{ ...btn('icon'), opacity: idx===slides.length-1 ? 0.35 : 1, fontSize:14 }}>↓</button>
                    <button onClick={() => deleteSlide(idx)}
                      style={{ ...btn('danger'), padding:'5px 10px', fontSize:15 }}>×</button>
                  </div>
                  <textarea
                    value={slide} onChange={e => updateSlide(idx, e.target.value)}
                    placeholder={isChorus ? 'Текст припева...' : 'Текст слайда / куплета...'}
                    style={{
                      width:'100%', minHeight:110, padding:'12px 14px',
                      border:'none', background:'transparent', color:C.text,
                      fontFamily:'Manrope', fontSize:14, lineHeight:1.65,
                      resize:'vertical', outline:'none', boxSizing:'border-box',
                    }}
                  />
                </div>
              );
            })}
            <button onClick={addSlide} style={{
              padding:'12px', borderRadius:12,
              border:`2px dashed ${C.border}`, background:'transparent',
              color:C.textMute, fontFamily:'Manrope', fontSize:13, fontWeight:600,
              cursor:'pointer', width:'100%',
            }}>+ Добавить слайд</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ Entry point ============ */
const IS_SCREEN = new URLSearchParams(location.search).get('mode') === 'screen';
ReactDOM.createRoot(document.getElementById('root')).render(
  IS_SCREEN ? <ScreenMode/> : <App/>
);
