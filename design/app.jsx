/* global React, TVScreen, BOOKS_OT_FULL, BOOKS_NT_FULL, JOHN_3, SONGS, SCREEN_BGS, TEMPLATES, FONTS_SCREEN */
const { useState, useEffect, useMemo, useRef } = React;

/* ============ Default screen content per template ============ */
function defaultContent(template, ctx = {}) {
  const v = JOHN_3.find(([n]) => n === 16);
  switch (template) {
    case 'verse':     return { ref:'Иоанна 3:16', text: v[1], translation:'КРГ · KYB 2004' };
    case 'bilingual': return { ref:'Иоанна 3:16', text: v[1], text2:'Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного, дабы всякий верующий в Него, не погиб, но имел жизнь вечную.', lang1:'КРГ · Кыргызча', lang2:'РСТ · Русский' };
    case 'song-title':return { title:'Осанна', subtitle:'Прославляю Я Тебя', songNum: 47 };
    case 'song-verse':return { text:'Адам Сенсиз жашаса,\nТүйшүктөнүп кыйналат\nМээримиң Сенин чексиз\nТеңир, Ырым Сага арналат', partNum: 1, songTitle:'Осанна', position:'1 / 4' };
    case 'chorus':    return { text:'Осанна, Осанна\nДаназалаймин Сени\nЖаным эңсейт Теңирди', songTitle:'Осанна' };
    case 'welcome':   return { kicker:'Воскресное служение', title:'Кош келиңиз', subtitle:'Добро пожаловать', date:'10 мая 2026' };
    case 'prayer':    return { text:'«Атабыз, асмандагы Атабыз,\nСенин ысмың ыйыкталсын,\nСенин Падышачылыгың келсин.»', ref:'Матай 6:9' };
    case 'announce':  return { kicker:'Объявление · Воскресенье', title:'Молитвенное собрание', desc:'Приглашаем всех на совместную молитву и пост в эту пятницу в 19:00.' };
    case 'logo':      return {};
    default:          return {};
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
  const [tab, setTab] = useState('books'); // search | books | songs
  const [bookIdx, setBookIdx] = useState(3); // Иоанна
  const [chapter, setChapter] = useState(3);
  const [activeVerse, setActiveVerse] = useState(16);
  const [activeSongId, setActiveSongId] = useState('osanna');
  const [activeBlockIdx, setActiveBlockIdx] = useState(2);

  const [template, setTemplate] = useState('verse');
  const [bg, setBg] = useState('black');
  const [fontId, setFontId] = useState('cormorant');
  const [fontSize, setFontSize] = useState(80);
  const [content, setContent] = useState(defaultContent('verse'));

  const [screenOn, setScreenOn] = useState(true);
  const [tvWindow, setTvWindow] = useState(false);

  const C = tokens(dark);
  const fontStack = FONTS_SCREEN.find(f => f.id === fontId).stack;

  const activeSong = SONGS.find(s => s.id === activeSongId);

  // when template changes, reset content to defaults
  useEffect(() => {
    setContent(defaultContent(template));
  }, [template]);

  // ============ ACTIONS ============
  function sendVerse(n) {
    const v = JOHN_3.find(([num]) => num === n);
    if (!v) return;
    setActiveVerse(n);
    setTemplate('verse');
    setContent({ ref:`Иоанна 3:${n}`, text: v[1], translation:'КРГ · KYB 2004' });
  }

  function sendSongBlock(songId, idx) {
    const song = SONGS.find(s => s.id === songId);
    const block = song.blocks[idx];
    setActiveSongId(songId);
    setActiveBlockIdx(idx);
    if (block.type === 'chorus') {
      setTemplate('chorus');
      setContent({ text: block.text, songTitle: song.title });
    } else {
      setTemplate('song-verse');
      setContent({
        text: block.text, partNum: block.n, songTitle: song.title,
        position: `${idx+1} / ${song.blocks.length}`,
      });
    }
  }

  function sendSongTitle(songId) {
    const song = SONGS.find(s => s.id === songId);
    setActiveSongId(songId);
    setTemplate('song-title');
    setContent({ title: song.title, subtitle: song.subtitle, songNum: song.num });
  }

  function clearScreen() {
    setTemplate('logo');
    setContent({});
  }

  const state = { template, bg, fontStack, fontSize, content };

  return (
    <div style={{
      width:'100vw', minHeight:'100vh',
      background: C.bg, color: C.text, fontFamily:'Manrope',
      display:'grid', gridTemplateColumns:'380px 1fr',
      transition:'background 0.3s, color 0.3s',
    }}>
      {/* ============ SIDEBAR ============ */}
      <Sidebar
        C={C} dark={dark} setDark={setDark}
        tab={tab} setTab={setTab}
        bookIdx={bookIdx} setBookIdx={setBookIdx}
        chapter={chapter} setChapter={setChapter}
        activeSongId={activeSongId} setActiveSongId={setActiveSongId}
        sendSongTitle={sendSongTitle} sendSongBlock={sendSongBlock}
        activeBlockIdx={activeBlockIdx}
      />

      {/* ============ MAIN ============ */}
      <Main
        C={C} dark={dark}
        state={state}
        template={template} setTemplate={setTemplate}
        bg={bg} setBg={setBg}
        fontId={fontId} setFontId={setFontId}
        fontSize={fontSize} setFontSize={setFontSize}
        content={content} setContent={setContent}
        screenOn={screenOn} setScreenOn={setScreenOn}
        tvWindow={tvWindow} setTvWindow={setTvWindow}
        tab={tab}
        activeVerse={activeVerse} sendVerse={sendVerse}
        activeSong={activeSong} sendSongBlock={sendSongBlock}
        clearScreen={clearScreen}
      />
    </div>
  );
}

/* ============ Sidebar ============ */
function Sidebar({ C, dark, setDark, tab, setTab, bookIdx, setBookIdx, chapter, setChapter, activeSongId, sendSongTitle, sendSongBlock, activeBlockIdx }) {
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
            { short:'РСТ', name:'Русский' },
            { short:'КРГ', name:'Кыргызча', active: true },
            { short:'KJV', name:'King James' },
          ].map(t => (
            <div key={t.short} style={{
              padding:'8px 4px', borderRadius: 8,
              border: `1px solid ${t.active ? C.accent : C.border}`,
              background: t.active ? C.accentSoft : 'transparent',
              color: t.active ? C.accent : C.text, textAlign:'center', cursor:'pointer',
            }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{t.short}</div>
              <div style={{ fontSize: 10, color: t.active ? C.accent : C.textMute, marginTop: 2 }}>{t.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap: 22, borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginTop: 4 }}>
        {[
          ['search','Поиск'], ['books','Книги'], ['songs','Песни'],
        ].map(([id,l]) => (
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
        {tab === 'search' && <SearchTab C={C}/>}
        {tab === 'books'  && <BooksTab C={C} bookIdx={bookIdx} setBookIdx={setBookIdx} chapter={chapter} setChapter={setChapter}/>}
        {tab === 'songs'  && <SongsTab C={C} activeSongId={activeSongId} activeBlockIdx={activeBlockIdx} sendSongTitle={sendSongTitle} sendSongBlock={sendSongBlock}/>}
      </div>
    </aside>
  );
}

function SearchTab({ C }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
      <div style={{
        padding:'10px 14px', borderRadius: 10,
        background: C.cardBg, border: `1px solid ${C.border}`,
        display:'flex', alignItems:'center', gap: 10,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span style={{ color: C.textMute, fontSize: 13 }}>Иоанна 3:16</span>
      </div>
      <div style={{ fontSize: 11, color: C.textSubtle }}>
        Подсказка: введите слово или ссылку «Иоанна 3:16»
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1, marginTop: 12 }}>НЕДАВНИЕ</div>
      {['Иоанна 3:16','Псалом 22','Матфея 6:9-13'].map(r => (
        <div key={r} style={{
          padding:'10px 12px', borderRadius: 8, background: C.cardBg,
          border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
          display:'flex', justifyContent:'space-between', cursor:'pointer',
        }}>
          <span>{r}</span><span style={{ color: C.textMute }}>↵</span>
        </div>
      ))}
    </div>
  );
}

function BooksTab({ C, bookIdx, setBookIdx, chapter, setChapter }) {
  const allBooks = useMemo(() => [...BOOKS_OT_FULL, ...BOOKS_NT_FULL], []);
  const book = allBooks[bookIdx];
  const chapterCount = book ? book[2] : 28;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>ВЕТХИЙ ЗАВЕТ · 39 КНИГ</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 5 }}>
        {BOOKS_OT_FULL.map(([n, f], i) => (
          <div key={n} onClick={() => setBookIdx(i)} title={f} style={{
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
            <div key={n} onClick={() => setBookIdx(realIdx)} title={f} style={{
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

function SongsTab({ C, activeSongId, activeBlockIdx, sendSongTitle, sendSongBlock }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
      {SONGS.map(song => (
        <div key={song.id} style={{
          borderRadius: 10, border: `1px solid ${activeSongId===song.id ? C.accent : C.border}`,
          background: activeSongId===song.id ? C.accentSoft : C.cardBg,
          overflow:'hidden',
        }}>
          <div onClick={() => sendSongTitle(song.id)} style={{
            padding:'10px 12px', display:'flex', alignItems:'center', gap: 10, cursor:'pointer',
          }}>
            <span style={{
              minWidth: 30, height: 30, borderRadius: 6, background: C.accentSoft,
              display:'grid', placeItems:'center', color: C.accent, fontSize: 11, fontWeight: 700,
            }}>№{song.num}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily:'Cormorant Garamond', fontSize: 17, fontWeight: 600, color: C.text }}>{song.title}</div>
              <div style={{ fontSize: 11, color: C.textMute, marginTop: 1 }}>{song.subtitle}</div>
            </div>
            <span style={{ color: C.textMute, fontSize: 11 }}>{song.blocks.length} ч.</span>
          </div>
          {activeSongId === song.id && (
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '6px 8px', display:'flex', flexDirection:'column', gap: 4 }}>
              {song.blocks.map((b, idx) => (
                <div key={idx} onClick={() => sendSongBlock(song.id, idx)} style={{
                  padding:'6px 8px', borderRadius: 6,
                  background: activeBlockIdx===idx ? C.accent : 'transparent',
                  color: activeBlockIdx===idx ? C.primaryText : C.text,
                  fontSize: 12, cursor:'pointer',
                  display:'flex', alignItems:'center', gap: 8,
                }}>
                  <span style={{
                    minWidth: 50, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform:'uppercase',
                    color: activeBlockIdx===idx ? 'rgba(255,255,255,0.85)' : C.textMute,
                  }}>{b.type === 'chorus' ? 'Припев' : `Куплет ${b.n}`}</span>
                  <span style={{ flex: 1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {b.text.split('\n')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============ Main area ============ */
function Main(props) {
  const { C, dark, state, template, setTemplate, bg, setBg, fontId, setFontId, fontSize, setFontSize,
          content, setContent, screenOn, setScreenOn, tvWindow, setTvWindow,
          tab, activeVerse, sendVerse, activeSong, sendSongBlock, clearScreen } = props;

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
            <span>↑↓ — главы · ←→ — стихи и слайды</span>
          </div>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button onClick={clearScreen} style={{
            padding:'9px 14px', borderRadius: 10,
            background:'transparent', border: `1px solid ${C.border}`,
            color: C.danger, fontWeight: 600, fontSize: 13, fontFamily:'Manrope', cursor:'pointer',
          }}>Очистить экран</button>
          <button onClick={() => setTvWindow(!tvWindow)} style={{
            padding:'9px 14px', borderRadius: 10,
            background: tvWindow ? C.accentSoft : 'transparent', border: `1px solid ${tvWindow ? C.accent : C.border}`,
            color: tvWindow ? C.accent : C.text, fontWeight: 600, fontSize: 13, fontFamily:'Manrope', cursor:'pointer',
          }}>Поверх окон</button>
          <button onClick={() => setScreenOn(!screenOn)} style={{
            padding:'9px 18px', borderRadius: 10,
            background: C.primary, border:'none', color: C.primaryText,
            fontWeight: 700, fontSize: 13, fontFamily:'Manrope', cursor:'pointer',
          }}>{screenOn ? 'Закрыть экран ТВ' : 'Открыть экран ТВ ↗'}</button>
        </div>
      </div>

      {/* Template picker */}
      <TemplatePicker C={C} template={template} setTemplate={setTemplate}/>

      {/* Preview + side controls */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap: 18 }}>
        <PreviewFrame C={C} state={state} dark={dark} screenOn={screenOn}/>
        <ScreenControls C={C} bg={bg} setBg={setBg} fontId={fontId} setFontId={setFontId} fontSize={fontSize} setFontSize={setFontSize}/>
      </div>

      {/* Context list */}
      <ContextList
        C={C} tab={tab} dark={dark}
        activeVerse={activeVerse} sendVerse={sendVerse}
        activeSong={activeSong} sendSongBlock={sendSongBlock}
        template={template} content={content} setContent={setContent}
      />
    </main>
  );
}

/* ============ Template picker ============ */
function TemplatePicker({ C, template, setTemplate }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12,
      background: C.panelBg, border: `1px solid ${C.border}`,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>ШАБЛОН СЛАЙДА</div>
        <div style={{ fontSize: 11, color: C.textMute }}>{TEMPLATES.length} готовых · кликните для предпросмотра</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(9, 1fr)', gap: 8 }}>
        {TEMPLATES.map(t => (
          <div key={t.id} onClick={() => setTemplate(t.id)} style={{
            padding:'10px 8px', borderRadius: 10,
            border: `1px solid ${template===t.id ? C.accent : C.border}`,
            background: template===t.id ? C.accentSoft : C.cardBg,
            cursor:'pointer', textAlign:'center', position:'relative',
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
      const w = ref.current.clientWidth;
      setScale(w / 1920);
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
      {/* Live badge */}
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
          position:'absolute', inset: 0, background:'rgba(0,0,0,0.65)',
          display:'grid', placeItems:'center', color:'#fff', fontFamily:'Manrope', fontSize: 14, zIndex: 5,
        }}>Экран не транслируется</div>
      )}
    </div>
  );
}

/* ============ Right-side screen controls ============ */
function ScreenControls({ C, bg, setBg, fontId, setFontId, fontSize, setFontSize }) {
  return (
    <div style={{
      padding: 16, borderRadius: 14,
      background: C.panelBg, border: `1px solid ${C.border}`,
      display:'flex', flexDirection:'column', gap: 14,
    }}>
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

/* ============ Context list (verses or song or template fields) ============ */
function ContextList({ C, tab, activeVerse, sendVerse, activeSong, sendSongBlock, template, content, setContent }) {
  // If service template, show content editor
  if (['welcome','prayer','announce','logo','song-title','bilingual'].includes(template)) {
    return <ContentEditor C={C} template={template} content={content} setContent={setContent}/>;
  }

  if (tab === 'songs' && activeSong) {
    return (
      <div style={{
        background: C.panelBg, borderRadius: 14, border: `1px solid ${C.border}`,
        overflow:'hidden', minHeight: 280,
      }}>
        <div style={{ padding:'14px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily:'Cormorant Garamond', fontSize: 20, fontWeight: 600 }}>{activeSong.title}</div>
          <div style={{ fontSize: 12, color: C.textMute, marginTop: 2 }}>
            №{activeSong.num} · {activeSong.blocks.length} частей · кликните чтобы вывести на ТВ
          </div>
        </div>
        <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap: 6 }}>
          {activeSong.blocks.map((b, idx) => (
            <div key={idx} onClick={() => sendSongBlock(activeSong.id, idx)} style={{
              padding:'10px 14px', borderRadius: 10,
              background: C.cardBg, border: `1px solid ${C.border}`,
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

  // Default: verse list
  return (
    <div style={{
      background: C.panelBg, borderRadius: 14, border: `1px solid ${C.border}`,
      overflow:'hidden',
    }}>
      <div style={{
        padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div>
          <div style={{ fontFamily:'Cormorant Garamond', fontSize: 20, fontWeight: 600 }}>Жакан · Глава 3</div>
          <div style={{ fontSize: 12, color: C.textMute, marginTop: 2 }}>
            21 стих · кликните по номеру → отправить на ТВ
          </div>
        </div>
        <div style={{ display:'flex', gap: 6 }}>
          <button style={{
            width: 34, height: 34, borderRadius: 8,
            background: C.cardBg, border: `1px solid ${C.border}`, color: C.text, cursor:'pointer',
          }}>↑</button>
          <button style={{
            width: 34, height: 34, borderRadius: 8,
            background: C.cardBg, border: `1px solid ${C.border}`, color: C.text, cursor:'pointer',
          }}>↓</button>
        </div>
      </div>
      <div style={{ padding:'6px 12px' }}>
        {JOHN_3.map(([n, t]) => (
          <div key={n} onClick={() => sendVerse(n)} style={{
            display:'flex', gap: 14, padding:'10px 12px', borderRadius: 8,
            background: activeVerse===n ? C.accentSoft : 'transparent', cursor:'pointer',
          }}>
            <span style={{
              fontFamily:'Cormorant Garamond', fontSize: 18, fontWeight: 600,
              color: C.accent, minWidth: 26, paddingTop: 2,
            }}>{n}</span>
            <span style={{ fontSize: 14, lineHeight: 1.55, color: C.text, fontWeight: activeVerse===n ? 600 : 400 }}>{t}</span>
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

  const fields = {
    welcome:   [['kicker','Подзаголовок'],['title','Заголовок'],['subtitle','Перевод'],['date','Дата']],
    prayer:    [['text','Текст молитвы', true],['ref','Ссылка']],
    announce:  [['kicker','Подзаголовок'],['title','Заголовок'],['desc','Описание', true]],
    'song-title': [['title','Название'],['subtitle','Подзаголовок'],['songNum','Номер песни']],
    bilingual: [['ref','Ссылка'],['lang1','Язык 1'],['text','Текст 1', true],['lang2','Язык 2'],['text2','Текст 2', true]],
    logo:      [],
  }[template] || [];

  return (
    <div style={{
      background: C.panelBg, borderRadius: 14, border: `1px solid ${C.border}`,
      padding:'18px 20px', display:'flex', flexDirection:'column', gap: 14,
    }}>
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
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1, marginBottom: 6 }}>СТРОКИ (label : значение)</div>
          <textarea
            value={(content.rows || [['Дата','14 мая 2026, пт'],['Время','19:00 — 21:00'],['Место','Главный зал'],['Ведёт','Пастор Эмиль']]).map(r => r.join(' : ')).join('\n')}
            onChange={e => setContent({ ...content, rows: e.target.value.split('\n').map(l => l.split(' : ')) })}
            rows={5}
            style={{
              padding:'10px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.cardBg, color: C.text, fontFamily:'JetBrains Mono', fontSize: 12,
              resize:'vertical', outline:'none', width:'100%',
            }}/>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
