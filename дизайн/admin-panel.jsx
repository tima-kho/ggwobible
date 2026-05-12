/* global React, BookCard, VerseLine, BOOKS_OT, BOOKS_NT, VERSES_JOHN3, SCR_BGS, TRANSLATIONS */
const { useState: useStateA } = React;

/* ============ AdminPanel ============ */
function AdminPanel({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const tab = 'books';
  const C = isDark ? {
    bg: '#0E0A06',
    panelBg: '#16110A',
    border: '#2A2117',
    borderSoft: '#1F1810',
    text: '#F5E8D2',
    textMute: '#8E7B62',
    textSubtle: '#6A5A45',
    accent: '#C9A86B',
    accentSoft: 'rgba(201,168,107,0.10)',
    cardBg: '#1F1810',
    inputBg: '#16110A',
    danger: '#E8765C',
    primary: '#8B5A2B',
    primaryText: '#FBF8F2',
    chipBorder: '#3A2F22',
  } : {
    bg: '#FBF8F2',
    panelBg: '#FFFFFF',
    border: '#EDE4D2',
    borderSoft: '#F5EFE3',
    text: '#1A140B',
    textMute: '#6A5A45',
    textSubtle: '#8E7B62',
    accent: '#8B5A2B',
    accentSoft: 'rgba(139,90,43,0.08)',
    cardBg: '#FBF8F2',
    inputBg: '#FFFFFF',
    danger: '#C2614D',
    primary: '#6B4220',
    primaryText: '#FBF8F2',
    chipBorder: '#DCCDB1',
  };

  return (
    <div style={{
      width: 1440, height: 900,
      background: C.bg,
      fontFamily: 'Manrope',
      color: C.text,
      display: 'grid',
      gridTemplateColumns: '380px 1fr',
      overflow: 'hidden',
    }}>
      {/* ============ LEFT SIDEBAR ============ */}
      <aside style={{
        background: C.panelBg,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '28px 24px',
        gap: 20,
        overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, ${isDark ? '#8B5A2B' : '#6B4220'})`,
            display:'grid', placeItems:'center',
            color: '#FBF8F2',
            fontFamily: 'Cormorant Garamond', fontSize: 22, fontWeight: 700,
            boxShadow: isDark ? '0 4px 14px rgba(201,168,107,0.25)' : '0 4px 14px rgba(139,90,43,0.20)',
          }}>В</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Cormorant Garamond', fontSize: 22, fontWeight: 600,
              color: C.accent, lineHeight: 1.1,
            }}>Великая Благодать</div>
            <div style={{ fontSize: 11, color: C.textSubtle, marginTop: 2 }}>
              Библия · Песни · Проектор
            </div>
          </div>
          <div style={{
            padding: '4px 8px', borderRadius: 6,
            background: C.accentSoft, color: C.accent,
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          }}>АДМИН</div>
        </div>

        {/* Theme toggle pill */}
        <div style={{
          display:'flex', padding: 4, borderRadius: 999,
          background: C.cardBg, border: `1px solid ${C.border}`,
        }}>
          {['Свет','Тьма','Авто'].map((l,i)=>(
            <div key={l} style={{
              flex:1, textAlign:'center', padding:'6px 0',
              borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: (i===0&&!isDark)||(i===1&&isDark) ? C.accent : 'transparent',
              color: (i===0&&!isDark)||(i===1&&isDark) ? C.primaryText : C.textMute,
              cursor:'pointer',
            }}>{l}</div>
          ))}
        </div>

        {/* Translation picker */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1, marginBottom: 8 }}>
            ПЕРЕВОД
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {TRANSLATIONS.map(t => (
              <div key={t.id} style={{
                padding: '10px 6px', borderRadius: 10,
                border: `1px solid ${t.active ? C.accent : C.border}`,
                background: t.active ? C.accentSoft : 'transparent',
                color: t.active ? C.accent : C.text,
                textAlign: 'center', fontSize: 11, lineHeight: 1.3,
                cursor: 'pointer',
              }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{t.short}</div>
                <div style={{ fontSize: 10, color: t.active ? C.accent : C.textMute, marginTop: 2 }}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display:'flex', gap: 24,
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: 12, marginTop: 4,
        }}>
          {['Поиск','Книги','Песни','Заметки'].map(t => (
            <div key={t} style={{
              fontSize: 14, fontWeight: tab==='books' && t==='Книги' ? 700 : 500,
              color: tab==='books' && t==='Книги' ? C.text : C.textMute,
              position:'relative', paddingBottom: 12, cursor: 'pointer',
            }}>
              {t}
              {tab==='books' && t==='Книги' && (
                <div style={{
                  position:'absolute', left: 0, right: 0, bottom: -13,
                  height: 2, background: C.accent,
                }}/>
              )}
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: C.cardBg, border: `1px solid ${C.border}`,
          display:'flex', alignItems:'center', gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMute} strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
          </svg>
          <span style={{ color: C.textMute, fontSize: 13 }}>Иоанна 3:16</span>
        </div>

        {/* Books grid */}
        <div style={{ overflow:'hidden', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1, marginBottom: 10 }}>
            ВЕТХИЙ ЗАВЕТ · 39 КНИГ
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {BOOKS_OT.slice(0, 21).map(([n, f], i) => (
              <BookCard key={n} name={n} full={f} active={i===0} theme={theme}/>
            ))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1, margin: '18px 0 10px' }}>
            НОВЫЙ ЗАВЕТ · 27 КНИГ
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {BOOKS_NT.slice(0, 6).map(([n, f], i) => (
              <BookCard key={n} name={n} full={f} active={i===2} theme={theme}/>
            ))}
          </div>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <main style={{
        padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20,
        overflow: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 24 }}>
          <div>
            <div style={{
              fontFamily: 'Cormorant Garamond', fontSize: 32, fontWeight: 600,
              color: C.text, letterSpacing: -0.5,
            }}>Иоанна 3 · стих 16 <span style={{ color: C.textMute, fontSize: 18, fontWeight: 400 }}>в эфире</span></div>
            <div style={{ color: C.textMute, fontSize: 13, marginTop: 4 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: '#3FB364', display:'inline-block' }}/>
                ТВ-экран открыт · 1920×1080
              </span>
              <span style={{ margin: '0 12px', color: C.borderSoft }}>·</span>
              <span>↑↓ — главы · ←→ — стихи</span>
            </div>
          </div>
          <div style={{ display:'flex', gap: 8 }}>
            <button style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.danger, fontWeight: 600, fontSize: 13,
              fontFamily: 'Manrope', cursor: 'pointer',
            }}>Очистить экран</button>
            <button style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.text, fontWeight: 600, fontSize: 13,
              fontFamily: 'Manrope', cursor: 'pointer',
            }}>Поверх окон</button>
            <button style={{
              padding: '10px 18px', borderRadius: 10,
              background: C.primary, border: 'none',
              color: C.primaryText, fontWeight: 700, fontSize: 13,
              fontFamily: 'Manrope', cursor: 'pointer',
              boxShadow: isDark ? '0 0 0 1px rgba(201,168,107,0.2)' : 'none',
            }}>Открыть экран ТВ ↗</button>
          </div>
        </div>

        {/* Preview + sidebar */}
        <div style={{ display:'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          {/* TV preview */}
          <div style={{
            aspectRatio: '16 / 9',
            borderRadius: 14,
            background: '#000',
            border: `1px solid ${C.border}`,
            position:'relative', overflow:'hidden',
            boxShadow: isDark ? '0 30px 60px -20px rgba(0,0,0,0.6)' : '0 30px 60px -20px rgba(61,47,30,0.25)',
          }}>
            <div style={{
              position:'absolute', inset: 0,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              padding: '8% 10%', textAlign:'center', color:'#fff',
            }}>
              <div style={{
                fontFamily: 'Cormorant Garamond', fontSize: 14, fontWeight: 500,
                letterSpacing: 3, textTransform: 'uppercase',
                color: '#C9A86B', marginBottom: 18, opacity: 0.85,
              }}>Иоанна 3:16</div>
              <div style={{
                fontFamily: 'Cormorant Garamond', fontSize: 32, fontWeight: 500,
                lineHeight: 1.35, textWrap:'balance', color:'#FBF8F2',
              }}>
                Анткени Кудай адамдарды ушунчалык сүйгөндүктөн,
                <br/>ишенген ар бир адам өлбөстөн, түбөлүк өмүргө ээ болсун деп,
                <br/>Өзүнүн жалгыз Уулун берди.
              </div>
              <div style={{
                position:'absolute', bottom: 20, right: 24,
                fontFamily:'Manrope', fontSize: 11, color:'rgba(255,255,255,0.5)',
                letterSpacing: 1,
              }}>КРГ · KYB 2004</div>
            </div>
            {/* Live badge */}
            <div style={{
              position:'absolute', top: 14, left: 14,
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
              color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1,
              display:'flex', alignItems:'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#FF4C4C' }}/>
              В ЭФИРЕ
            </div>
          </div>

          {/* Background swatches */}
          <div style={{
            padding: 16, borderRadius: 14,
            background: C.panelBg, border: `1px solid ${C.border}`,
            display:'flex', flexDirection:'column', gap: 14,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>
              ФОН ЭКРАНА
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 10 }}>
              {SCR_BGS.map((b, i) => (
                <div key={b.id} style={{ position:'relative' }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', borderRadius: 999,
                    background: b.color,
                    border: i===0 ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                    boxShadow: i===0 ? `0 0 0 3px ${C.accentSoft}` : 'none',
                    cursor: 'pointer',
                  }}/>
                  <div style={{ fontSize: 9, color: C.textMute, marginTop: 4, textAlign:'center' }}>{b.label}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: C.border }}/>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSubtle, letterSpacing: 1 }}>
              ШРИФТ
            </div>
            <div style={{
              padding: 12, borderRadius: 10, border: `1px solid ${C.border}`,
              fontFamily: 'Cormorant Garamond', fontSize: 18,
              color: C.text, textAlign:'center',
            }}>
              Cormorant 32pt
            </div>
            <div style={{ display:'flex', gap: 6 }}>
              {['S','M','L','XL'].map((s, i) => (
                <div key={s} style={{
                  flex:1, textAlign:'center', padding: '6px 0',
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: i===2 ? C.accentSoft : 'transparent',
                  color: i===2 ? C.accent : C.textMute,
                  border: `1px solid ${i===2 ? C.accent : C.border}`,
                  cursor: 'pointer',
                }}>{s}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Verse list */}
        <div style={{
          flex: 1, background: C.panelBg, borderRadius: 14,
          border: `1px solid ${C.border}`, overflow:'hidden',
          display:'flex', flexDirection:'column',
        }}>
          <div style={{
            padding: '14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <div style={{
                fontFamily:'Cormorant Garamond', fontSize: 20, fontWeight: 600,
                color: C.text,
              }}>Жакан · Глава 3</div>
              <div style={{ fontSize: 12, color: C.textMute, marginTop: 2 }}>
                21 стих · кликните по номеру → отправить на ТВ
              </div>
            </div>
            <div style={{ display:'flex', gap: 6 }}>
              <button style={{
                width: 34, height: 34, borderRadius: 8,
                background: C.cardBg, border: `1px solid ${C.border}`,
                color: C.text, cursor: 'pointer',
              }}>↑</button>
              <button style={{
                width: 34, height: 34, borderRadius: 8,
                background: C.cardBg, border: `1px solid ${C.border}`,
                color: C.text, cursor: 'pointer',
              }}>↓</button>
            </div>
          </div>
          <div style={{ padding: '8px 16px', overflow:'hidden', flex: 1 }}>
            {VERSES_JOHN3.map(([n, t]) => (
              <VerseLine key={n} n={n} text={t} theme={theme} active={n===16}/>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

window.AdminPanel = AdminPanel;
