/* global React */
const { useState: useStateS } = React;

/* ============ TV Screen — renders any template with dynamic content ============ */

function TVScreen({ state, scale = 1 }) {
  const { template, bg, fontStack, fontSize, content } = state;
  const bgObj = window.SCREEN_BGS.find(b => b.id === bg) || window.SCREEN_BGS[0];
  const isLight = !!bgObj.light;
  const textColor = isLight ? '#1A140B' : '#FBF8F2';
  const accent = isLight ? '#8B5A2B' : '#C9A86B';
  const muted = isLight ? 'rgba(26,20,11,0.5)' : 'rgba(255,255,255,0.45)';

  const W = 1920, H = 1080;
  const wrap = {
    width: W, height: H, background: bgObj.bg,
    fontFamily: fontStack, color: textColor,
    position:'relative', overflow:'hidden',
    transform: `scale(${scale})`, transformOrigin:'top left',
  };

  // ============ TEMPLATE: verse ============
  if (template === 'verse') {
    return (
      <div style={wrap}>
        <div style={{
          position:'absolute', inset:0, padding:'8% 12%',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            fontSize: 28, letterSpacing: 8, textTransform:'uppercase',
            fontFamily:'Manrope', fontWeight: 600, color: accent, marginBottom: 56,
          }}>{content.ref}</div>
          <div style={{
            fontSize: fontSize, fontWeight: 500, lineHeight: 1.3, textAlign:'center',
            textWrap:'balance', maxWidth: '90%',
          }}>{content.text}</div>
        </div>
        <div style={{
          position:'absolute', bottom: 40, right: 56,
          fontFamily:'Manrope', fontSize: 18, color: muted, letterSpacing: 2,
        }}>{content.translation}</div>
      </div>
    );
  }

  // ============ TEMPLATE: bilingual ============
  if (template === 'bilingual') {
    return (
      <div style={{...wrap, display:'grid', gridTemplateColumns:'1fr 1px 1fr'}}>
        {[
          { lang: content.lang1 || 'КРГ · Кыргызча', text: content.text },
          { lang: content.lang2 || 'РСТ · Русский',  text: content.text2 || 'Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного, дабы всякий верующий в Него, не погиб, но имел жизнь вечную.' },
        ].map((col, i) => (
          <React.Fragment key={i}>
            {i===1 && <div style={{ background:`linear-gradient(180deg, transparent, ${accent}55, transparent)`, height:'100%' }}/>}
            <div style={{
              padding:'7% 5%', display:'flex', flexDirection:'column', justifyContent:'center',
            }}>
              <div style={{
                fontFamily:'Manrope', fontSize: 16, letterSpacing: 6, textTransform:'uppercase',
                color: accent, fontWeight: 600, marginBottom: 28,
              }}>{col.lang}</div>
              <div style={{
                fontSize: Math.round(fontSize*0.62), fontWeight: 400, lineHeight: 1.35, textWrap:'balance',
              }}>{col.text}</div>
            </div>
          </React.Fragment>
        ))}
        <div style={{
          position:'absolute', top: 40, left:'50%', transform:'translateX(-50%)',
          fontFamily:'Manrope', fontSize: 16, letterSpacing: 8,
          textTransform:'uppercase', color: accent, fontWeight: 700,
        }}>{content.ref}</div>
      </div>
    );
  }

  // ============ TEMPLATE: song-title ============
  if (template === 'song-title') {
    return (
      <div style={{...wrap, background: bgObj.bg, backgroundImage: !isLight ? `
        radial-gradient(circle at 20% 30%, rgba(201,168,107,0.18) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(194,97,77,0.15) 0%, transparent 50%)` : undefined,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 24, marginBottom: 50 }}>
          <div style={{ width: 100, height: 1, background: accent }}/>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <path d="M20 4 L24 16 L36 20 L24 24 L20 36 L16 24 L4 20 L16 16 Z" fill={accent}/>
          </svg>
          <div style={{ width: 100, height: 1, background: accent }}/>
        </div>
        <div style={{
          fontSize: 26, letterSpacing: 12, textTransform:'uppercase',
          fontFamily:'Manrope', fontWeight: 500, color: accent, marginBottom: 28,
        }}>песня № {content.songNum || 47}</div>
        <div style={{
          fontSize: Math.min(180, fontSize*2.3), fontWeight: 500, lineHeight: 1, textAlign:'center',
          letterSpacing: -2, fontStyle:'italic',
        }}>{content.title}</div>
        {content.subtitle && (
          <div style={{
            fontSize: 36, fontWeight: 400, color: isLight ? '#6A5A45' : 'rgba(255,255,255,0.6)',
            marginTop: 28, letterSpacing: 4,
          }}>{content.subtitle}</div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap: 24, marginTop: 50 }}>
          <div style={{ width: 100, height: 1, background: accent }}/>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: accent }}/>
          <div style={{ width: 100, height: 1, background: accent }}/>
        </div>
      </div>
    );
  }

  // ============ TEMPLATE: song-verse ============
  if (template === 'song-verse') {
    return (
      <div style={{...wrap, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8% 10%'}}>
        <div style={{
          fontSize: 24, letterSpacing: 6, textTransform:'uppercase',
          fontFamily:'Manrope', fontWeight: 600, color: accent, marginBottom: 40,
          display:'flex', alignItems:'center', gap: 16,
        }}>
          <span style={{ width: 40, height: 1, background: accent }}/>
          Куплет {content.partNum || 1}
          <span style={{ width: 40, height: 1, background: accent }}/>
        </div>
        <div style={{
          fontSize: fontSize, fontWeight: 400, lineHeight: 1.3, textAlign:'center',
          textWrap:'balance', whiteSpace:'pre-line',
        }}>{content.text}</div>
        <div style={{
          position:'absolute', bottom: 40, left: 60,
          fontFamily:'Manrope', fontSize: 16, color: muted, letterSpacing: 1,
        }}>{content.songTitle}</div>
        <div style={{
          position:'absolute', bottom: 40, right: 60,
          fontFamily:'Manrope', fontSize: 16, color: muted, letterSpacing: 1,
        }}>{content.position || '1 / 3'}</div>
      </div>
    );
  }

  // ============ TEMPLATE: chorus ============
  if (template === 'chorus') {
    return (
      <div style={{...wrap, display:'grid', gridTemplateColumns:'12px 1fr'}}>
        <div style={{ background: `linear-gradient(180deg, ${accent}, ${isLight ? '#8B5A2B' : '#8B5A2B'})` }}/>
        <div style={{
          display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start',
          padding:'8% 8% 8% 10%',
        }}>
          <div style={{
            fontFamily:'Manrope', fontSize: 22, fontWeight: 700,
            letterSpacing: 10, color: accent, marginBottom: 40,
          }}>ПРИПЕВ</div>
          <div style={{
            fontSize: Math.min(110, fontSize*1.4), fontWeight: 500, lineHeight: 1.15,
            textWrap:'balance', letterSpacing: -1, whiteSpace:'pre-line',
          }}>{content.text}</div>
        </div>
        <div style={{
          position:'absolute', bottom: 48, right: 60,
          fontFamily:'Manrope', fontSize: 14, color: muted,
          letterSpacing: 3, textTransform:'uppercase',
        }}>{content.songTitle || 'Великая Благодать'}</div>
      </div>
    );
  }

  // ============ TEMPLATE: welcome ============
  if (template === 'welcome') {
    return (
      <div style={{...wrap, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <svg width="180" height="180" style={{ position:'absolute', top: 60, left: 60, opacity: 0.45 }}>
          <circle cx="90" cy="90" r="80" stroke={accent} strokeWidth="1" fill="none"/>
          <circle cx="90" cy="90" r="60" stroke={accent} strokeWidth="1" fill="none"/>
          <circle cx="90" cy="90" r="3" fill={accent}/>
        </svg>
        <svg width="180" height="180" style={{ position:'absolute', bottom: 60, right: 60, opacity: 0.45 }}>
          <path d="M30 90 L90 30 L150 90 L90 150 Z" stroke={accent} strokeWidth="1" fill="none"/>
          <path d="M60 90 L90 60 L120 90 L90 120 Z" stroke={accent} strokeWidth="1" fill="none"/>
        </svg>
        <div style={{
          fontSize: 24, letterSpacing: 12, textTransform:'uppercase',
          fontFamily:'Manrope', fontWeight: 600, color: accent, marginBottom: 40,
        }}>{content.kicker || 'Воскресное служение'}</div>
        <div style={{
          fontSize: Math.min(220, fontSize*2.6), fontWeight: 500, lineHeight: 1, fontStyle:'italic',
          letterSpacing: -4, textAlign:'center',
        }}>{content.title || 'Кош келиңиз'}</div>
        <div style={{
          fontSize: 44, fontWeight: 400, color: isLight ? '#6A5A45' : 'rgba(255,255,255,0.7)',
          marginTop: 24, letterSpacing: 2,
        }}>{content.subtitle || 'Добро пожаловать'}</div>
        <div style={{
          marginTop: 60, padding: '14px 40px',
          border: `1px solid ${accent}`, borderRadius: 999,
          fontFamily:'Manrope', fontSize: 18, color: accent,
          letterSpacing: 4, textTransform:'uppercase', fontWeight: 600,
        }}>{content.date || '10 мая 2026'}</div>
      </div>
    );
  }

  // ============ TEMPLATE: prayer ============
  if (template === 'prayer') {
    return (
      <div style={{...wrap, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <svg width="80" height="120" viewBox="0 0 80 120" style={{ marginBottom: 36 }}>
          <ellipse cx="40" cy="25" rx="8" ry="14" fill={accent} opacity="0.9"/>
          <ellipse cx="40" cy="22" rx="4" ry="8" fill="#FFE9B0"/>
          <rect x="36" y="40" width="8" height="60" fill={isLight ? '#3D2F1E' : '#3D2F1E'}/>
          <rect x="28" y="98" width="24" height="12" rx="2" fill="#6B4220"/>
        </svg>
        <div style={{
          fontSize: 24, letterSpacing: 12, textTransform:'uppercase',
          fontFamily:'Manrope', fontWeight: 500, color: accent, marginBottom: 44,
        }}>Молитва</div>
        <div style={{
          fontSize: Math.min(72, fontSize*0.9), fontWeight: 400, lineHeight: 1.4, textAlign:'center',
          textWrap:'balance', maxWidth: 1400, fontStyle:'italic',
        }}>{content.text}</div>
        {content.ref && (
          <div style={{ marginTop: 44, fontSize: 18, fontFamily:'Manrope', color: accent, letterSpacing: 4 }}>
            {content.ref}
          </div>
        )}
      </div>
    );
  }

  // ============ TEMPLATE: announce ============
  if (template === 'announce') {
    return (
      <div style={{...wrap, display:'grid', gridTemplateColumns:'1fr 1fr', background: isLight ? '#FBF8F2' : bgObj.bg}}>
        <div style={{
          background: 'linear-gradient(135deg, #8B5A2B, #3D2F1E)',
          padding:'8% 6%', display:'flex', flexDirection:'column', justifyContent:'center',
          color: '#FBF8F2',
        }}>
          <div style={{
            fontSize: 20, letterSpacing: 6, textTransform:'uppercase',
            color: '#E8D5B5', fontWeight: 600, marginBottom: 24, fontFamily:'Manrope',
          }}>{content.kicker || 'Объявление · Воскресенье'}</div>
          <div style={{
            fontFamily:'Cormorant Garamond', fontSize: 88, fontWeight: 500,
            lineHeight: 1.05, letterSpacing: -2, marginBottom: 32,
          }}>{content.title || 'Молитвенное собрание'}</div>
          <div style={{
            fontFamily:'Manrope', fontSize: 26, fontWeight: 400, lineHeight: 1.45,
            color: 'rgba(251,248,242,0.85)',
          }}>{content.desc || 'Приглашаем всех на совместную молитву и пост в эту пятницу в 19:00.'}</div>
        </div>
        <div style={{
          padding:'8% 6%', display:'flex', flexDirection:'column', justifyContent:'center', gap: 28,
          color: isLight ? '#1A140B' : '#FBF8F2', background: isLight ? '#FBF8F2' : bgObj.bg,
        }}>
          {(content.rows || [
            ['Дата',content.date],
            ['Время',content.time],
            ['Место',content.place],
            ['Ведёт',content.speaker],
          ]).map(([l,v]) => (
            <div key={l} style={{ borderBottom: `1px solid ${isLight ? '#EDE4D2' : 'rgba(255,255,255,0.1)'}`, paddingBottom: 18 }}>
              <div style={{ fontSize: 14, letterSpacing: 3, textTransform:'uppercase', color: muted, fontWeight: 600, marginBottom: 6, fontFamily:'Manrope' }}>{l}</div>
              <div style={{ fontFamily:'Cormorant Garamond', fontSize: 44, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============ TEMPLATE: logo / black ============
  if (template === 'logo') {
    return (
      <div style={{...wrap, background:'#000', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <div style={{
          width: 80, height: 80, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(201,168,107,0.18), rgba(139,90,43,0.10))',
          border: '1px solid rgba(201,168,107,0.20)',
          display:'grid', placeItems:'center',
          color:'rgba(201,168,107,0.85)',
          fontFamily:'Cormorant Garamond', fontSize: 44, fontWeight: 600,
        }}>В</div>
        <div style={{
          marginTop: 28, fontFamily:'Manrope', fontSize: 14, color:'rgba(255,255,255,0.2)',
          letterSpacing: 8, textTransform:'uppercase',
        }}>Великая Благодать</div>
      </div>
    );
  }

  return <div style={wrap}/>;
}

window.TVScreen = TVScreen;
