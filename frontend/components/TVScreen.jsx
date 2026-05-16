/* global React */
import { SCREEN_BGS } from './AppData.jsx';
import { verseTextAvailDimensions, bilingualColumnTextAvailDimensions, fitFontSizeForWrappedText } from '../screenMetrics.js';

const { useState: useStateS } = React;

// Returns a font size that fits `text` within the given available area.
// Uses a simple character-count heuristic (no DOM measurement needed).
function fitFontSize(text, maxSize, availW, availH) {
  const lineH = 1.3;
  const charW = 0.52;
  for (let f = maxSize; f >= 24; f -= 2) {
    const charsPerLine = Math.max(1, Math.floor(availW / (f * charW)));
    const lines = Math.ceil((text || '').length / charsPerLine);
    if (lines * f * lineH <= availH) return f;
  }
  return 24;
}

/* ============ TV Screen — renders any template with dynamic content ============ */

function TVScreen({ state, scale = 1 }) {
  const { template, bg, fontStack, fontSize, content } = state;
  const bgObj = SCREEN_BGS.find(b => b.id === bg) || SCREEN_BGS[0];
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
    const { availW: vW, availH: vH } = verseTextAvailDimensions();
    const verseFontSize = fitFontSizeForWrappedText(content.text || '', fontSize, vW, vH);
    const hasParts = content.totalParts != null && content.totalParts > 1;
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
            fontSize: verseFontSize, fontWeight: 500, lineHeight: 1.3, textAlign:'center',
            maxWidth: '90%', whiteSpace: hasParts ? 'pre-line' : 'normal',
            textWrap: hasParts ? undefined : 'balance',
          }}>{content.text}</div>
        </div>
        <div style={{
          position:'absolute', bottom: 40, right: 56,
          fontFamily:'Manrope', fontSize: 18, color: muted, letterSpacing: 2,
        }}>{content.translation}</div>
        {hasParts && (
          <div style={{
            position:'absolute', bottom: 40, left: 56,
            fontFamily:'Manrope', fontSize: 18, color: muted, letterSpacing: 2,
          }}>{(content.partIdx || 0) + 1} / {content.totalParts}</div>
        )}
      </div>
    );
  }

  // ============ TEMPLATE: bilingual ============
  if (template === 'bilingual') {
    const { availW: bW, availH: bH, bodyFontSize: bFs } = bilingualColumnTextAvailDimensions(fontSize);
    const hasParts = content.totalParts != null && content.totalParts > 1;
    const colFontLeft = fitFontSizeForWrappedText(content.text || '', bFs, bW, bH);
    const colFontRight = fitFontSizeForWrappedText(content.text2 || '', bFs, bW, bH);
    return (
      <div style={{...wrap, display:'grid', gridTemplateColumns:'1fr 1px 1fr'}}>
        {[
          { lang: content.lang1 || 'КРГ · Кыргызча', text: content.text ?? '', f: colFontLeft },
          { lang: content.lang2 || 'РСТ · Русский',  text: content.text2 ?? '', f: colFontRight },
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
                fontSize: col.f, fontWeight: 400, lineHeight: 1.35,
                whiteSpace: hasParts ? 'pre-line' : 'normal',
                textWrap: hasParts ? undefined : 'balance',
              }}>{col.text}</div>
            </div>
          </React.Fragment>
        ))}
        <div style={{
          position:'absolute', top: 40, left:'50%', transform:'translateX(-50%)',
          fontFamily:'Manrope', fontSize: 16, letterSpacing: 8,
          textTransform:'uppercase', color: accent, fontWeight: 700,
        }}>{content.ref}</div>
        {hasParts && (
          <div style={{
            position:'absolute', bottom: 40, left: 56,
            fontFamily:'Manrope', fontSize: 18, color: muted, letterSpacing: 2,
          }}>{(content.partIdx || 0) + 1} / {content.totalParts}</div>
        )}
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
        {content.songNum != null && (
          <div style={{
            fontSize: 26, letterSpacing: 12, textTransform:'uppercase',
            fontFamily:'Manrope', fontWeight: 500, color: accent, marginBottom: 28,
          }}>песня № {content.songNum}</div>
        )}
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
    // 8% padding top/bottom → 908 px; verse-header ~64 px; bottom label ~56 px → ~788 px for text
    const isSplit = content.totalParts != null;
    const svFontSize = isSplit ? fontSize : fitFontSize(content.text || '', fontSize, W * 0.80, 788);
    const hasParts = isSplit && content.totalParts > 1;
    return (
      <div style={{...wrap, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8% 10%'}}>
        <div style={{
          fontSize: svFontSize, fontWeight: 400, lineHeight: 1.3, textAlign:'center',
          whiteSpace:'pre-line',
        }}>{content.text}</div>
        {content.songTitle != null && content.songTitle !== '' && (
        <div style={{
          position:'absolute', bottom: 40, left: 60,
          fontFamily:'Manrope', fontSize: 16, color: muted, letterSpacing: 1,
        }}>{content.songTitle}</div>
        )}
        {content.position != null && content.position !== '' && (
        <div style={{
          position:'absolute', bottom: 40, right: 60,
          fontFamily:'Manrope', fontSize: 16, color: muted, letterSpacing: 1,
        }}>{content.position}</div>
        )}
      </div>
    );
  }

  // ============ TEMPLATE: chorus ============
  if (template === 'chorus') {
    const isSplit = content.totalParts != null;
    const chorusFontSize = isSplit ? Math.min(110, fontSize * 1.4) : fitFontSize(content.text || '', Math.min(110, fontSize*1.4), W * 0.78, 860);
    const hasParts = isSplit && content.totalParts > 1;
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
            display:'flex', alignItems:'center', gap: 16,
          }}>
            ПРИПЕВ
            {hasParts && <span style={{ fontSize: 14, letterSpacing: 2, opacity: 0.7 }}>{(content.partIdx||0)+1}/{content.totalParts}</span>}
          </div>
          <div style={{
            fontSize: chorusFontSize, fontWeight: 500, lineHeight: 1.15,
            letterSpacing: -1, whiteSpace:'pre-line',
          }}>{content.text}</div>
        </div>
        {content.songTitle != null && content.songTitle !== '' && (
        <div style={{
          position:'absolute', bottom: 48, right: 60,
          fontFamily:'Manrope', fontSize: 14, color: muted,
          letterSpacing: 3, textTransform:'uppercase',
        }}>{content.songTitle}</div>
        )}
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
        {/* QR code — fixed bottom-right, never displaced by font changes */}
        <div style={{
          position:'absolute', bottom: 48, right: 56,
          display:'flex', flexDirection:'column', alignItems:'center', gap: 10,
        }}>
          <img src="/qrcode.jpg" alt="QR" style={{
            width: 160, height: 160, borderRadius: 12,
            border: `2px solid ${accent}`,
            background: '#fff', padding: 6,
            boxSizing: 'border-box',
          }}/>
          <div style={{
            fontFamily:'Manrope', fontSize: 14, color: accent,
            letterSpacing: 3, textTransform:'uppercase', fontWeight: 600,
          }}>Великая Благодать</div>
        </div>
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
            ['Дата','14 мая 2026, пт'],
            ['Время',content.time],
            ['Место',content.place],
            ['Ведёт', content.speaker],
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
      <div style={{...wrap, background: bgObj.bg, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <img src="/logo-ggwo.jpg" alt="Великая Благодать" style={{
          width: 200, height: 200, borderRadius: '50%', objectFit:'cover',
          flexShrink: 0,
        }}/>
        <div style={{
          marginLeft: 40,
          fontFamily:'Cormorant Garamond', fontWeight: 600,
          fontSize: 96, lineHeight: 1,
          color: isLight ? '#1A140B' : 'rgba(251,248,242,0.90)',
          letterSpacing: 2,
        }}>Великая Благодать</div>
      </div>
    );
  }

  return <div style={wrap}/>;
}

export default TVScreen;
