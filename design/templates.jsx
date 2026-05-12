/* global React */

/* ============ Projector slide templates · 1920×1080 each ============ */

/* 1. Classic centered Bible verse — bone background */
function TplVerseClassic() {
  return (
    <div style={{
      width: 1920, height: 1080, background: '#FBF8F2',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '8% 12%', fontFamily: 'Cormorant Garamond', color: '#1A140B',
      position: 'relative',
    }}>
      <div style={{
        fontSize: 28, letterSpacing: 8, textTransform: 'uppercase',
        fontFamily: 'Manrope', fontWeight: 600,
        color: '#8B5A2B', marginBottom: 48,
      }}>Иоанна · 3 : 16</div>
      <div style={{
        fontSize: 80, fontWeight: 500, lineHeight: 1.25, textAlign: 'center',
        textWrap: 'balance',
      }}>
        Анткени Кудай адамдарды ушунчалык сүйгөндүктөн,<br/>
        ишенген ар бир адам өлбөстөн,<br/>
        <em style={{ color: '#8B5A2B', fontStyle:'italic' }}>түбөлүк өмүргө</em> ээ болсун деп,<br/>
        Өзүнүн жалгыз Уулун берди.
      </div>
      <div style={{ position:'absolute', bottom: 48, fontFamily:'Manrope', fontSize: 18, color: '#8E7B62', letterSpacing: 2 }}>
        КРГ · KYB 2004
      </div>
    </div>
  );
}

/* 2. Song verse — dark moody navy */
function TplSongVerse() {
  return (
    <div style={{
      width: 1920, height: 1080,
      background: 'radial-gradient(ellipse at 50% 30%, #1A2A52 0%, #0B1530 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '8% 10%', fontFamily: 'Manrope', color: '#FBF8F2',
      position: 'relative',
    }}>
      <div style={{
        fontSize: 24, letterSpacing: 6, textTransform: 'uppercase',
        fontWeight: 600, color: '#C9A86B', marginBottom: 36,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{ width: 40, height: 1, background: '#C9A86B' }}/>
        Куплет 1
        <span style={{ width: 40, height: 1, background: '#C9A86B' }}/>
      </div>
      <div style={{
        fontSize: 72, fontWeight: 400, lineHeight: 1.3, textAlign: 'center',
        fontFamily: 'Cormorant Garamond', textWrap: 'balance',
      }}>
        Адам Сенсиз жашаса,<br/>
        Түйшүктөнүп кыйналат<br/>
        Мээримиң Сенин чексиз<br/>
        Теңир, Ырым Сага арналат
      </div>
      <div style={{ position:'absolute', bottom: 40, left: 60, fontSize: 16, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
        Осанна · Прославляю
      </div>
      <div style={{ position:'absolute', bottom: 40, right: 60, fontSize: 16, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
        1 / 3
      </div>
    </div>
  );
}

/* 3. Chorus — full bleed gold accent */
function TplChorus() {
  return (
    <div style={{
      width: 1920, height: 1080, background: '#000',
      display: 'grid', gridTemplateColumns: '12px 1fr',
      fontFamily: 'Cormorant Garamond', color: '#FBF8F2',
      position: 'relative', overflow:'hidden',
    }}>
      <div style={{ background: 'linear-gradient(180deg, #C9A86B, #8B5A2B)' }}/>
      <div style={{
        display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start',
        padding: '8% 8% 8% 10%',
      }}>
        <div style={{
          fontFamily:'Manrope', fontSize: 22, fontWeight: 700,
          letterSpacing: 10, color: '#C9A86B', marginBottom: 40,
        }}>ПРИПЕВ</div>
        <div style={{
          fontSize: 96, fontWeight: 500, lineHeight: 1.15,
          textWrap: 'balance', letterSpacing: -1,
        }}>
          Осанна, Осанна<br/>
          Даназалаймин <em style={{ color: '#C9A86B', fontStyle:'italic' }}>Сени</em><br/>
          Жаным эңсейт <span style={{ color: '#C9A86B' }}>Теңирди</span>
        </div>
      </div>
      <div style={{
        position:'absolute', bottom: 48, right: 60,
        fontFamily:'Manrope', fontSize: 14, color: 'rgba(255,255,255,0.35)',
        letterSpacing: 3, textTransform: 'uppercase',
      }}>Великая Благодать</div>
    </div>
  );
}

/* 4. Song title card */
function TplSongTitle() {
  return (
    <div style={{
      width: 1920, height: 1080,
      background: '#3B1A1A',
      backgroundImage: `
        radial-gradient(circle at 20% 30%, rgba(201,168,107,0.18) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(194,97,77,0.15) 0%, transparent 50%)
      `,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:'Cormorant Garamond', color:'#FBF8F2',
      position:'relative',
    }}>
      {/* Ornament */}
      <div style={{ display:'flex', alignItems:'center', gap: 24, marginBottom: 60 }}>
        <div style={{ width: 100, height: 1, background: '#C9A86B' }}/>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 4 L24 16 L36 20 L24 24 L20 36 L16 24 L4 20 L16 16 Z" fill="#C9A86B"/>
        </svg>
        <div style={{ width: 100, height: 1, background: '#C9A86B' }}/>
      </div>
      <div style={{
        fontSize: 28, letterSpacing: 12, textTransform: 'uppercase',
        fontFamily: 'Manrope', fontWeight: 500, color: '#C9A86B',
        marginBottom: 32,
      }}>песня № 47</div>
      <div style={{
        fontSize: 160, fontWeight: 500, lineHeight: 1, textAlign:'center',
        letterSpacing: -2, fontStyle:'italic',
      }}>Осанна</div>
      <div style={{
        fontSize: 36, fontWeight: 400, color: 'rgba(255,255,255,0.65)',
        marginTop: 24, letterSpacing: 4,
      }}>Прославляю Я Тебя</div>
      <div style={{ display:'flex', alignItems:'center', gap: 24, marginTop: 60 }}>
        <div style={{ width: 100, height: 1, background: '#C9A86B' }}/>
        <div style={{ width: 8, height: 8, borderRadius: 999, background: '#C9A86B' }}/>
        <div style={{ width: 100, height: 1, background: '#C9A86B' }}/>
      </div>
    </div>
  );
}

/* 5. Announcement */
function TplAnnouncement() {
  return (
    <div style={{
      width: 1920, height: 1080, background: '#FBF8F2',
      display:'grid', gridTemplateColumns: '1fr 1fr',
      fontFamily: 'Manrope', color: '#1A140B', position: 'relative',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #8B5A2B, #3D2F1E)',
        padding: '8% 6%', display:'flex', flexDirection:'column', justifyContent:'center',
        color: '#FBF8F2',
      }}>
        <div style={{
          fontSize: 20, letterSpacing: 6, textTransform:'uppercase',
          color: '#E8D5B5', fontWeight: 600, marginBottom: 24,
        }}>Объявление · Воскресенье</div>
        <div style={{
          fontFamily:'Cormorant Garamond', fontSize: 96, fontWeight: 500,
          lineHeight: 1.05, letterSpacing: -2, marginBottom: 32,
        }}>Молитвенное собрание</div>
        <div style={{
          fontSize: 28, fontWeight: 400, lineHeight: 1.45,
          color: 'rgba(251,248,242,0.85)',
        }}>
          Приглашаем всех на совместную молитву и пост<br/>
          в эту пятницу в 19:00.
        </div>
      </div>
      <div style={{
        padding: '8% 6%', display:'flex', flexDirection:'column', justifyContent:'center', gap: 28,
      }}>
        {[
          { l:'Дата',  v:'14 мая 2026, пт' },
          { l:'Время', v:'19:00 — 21:00' },
          { l:'Место', v:'Главный зал' },
          { l:'Ведёт', v:'Пастор Алексей' },
        ].map(r => (
          <div key={r.l} style={{ borderBottom: '1px solid #EDE4D2', paddingBottom: 20 }}>
            <div style={{ fontSize: 16, letterSpacing: 3, textTransform:'uppercase', color: '#8E7B62', fontWeight: 600, marginBottom: 8 }}>{r.l}</div>
            <div style={{ fontFamily:'Cormorant Garamond', fontSize: 48, fontWeight: 500, color: '#1A140B' }}>{r.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 6. Prayer / reflection — minimal black */
function TplPrayer() {
  return (
    <div style={{
      width: 1920, height: 1080,
      background: 'radial-gradient(ellipse at 50% 100%, #0F2B22 0%, #000 70%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:'Cormorant Garamond', color: '#FBF8F2',
      position:'relative',
    }}>
      {/* candle ornament */}
      <svg width="80" height="120" viewBox="0 0 80 120" style={{ marginBottom: 40 }}>
        <ellipse cx="40" cy="25" rx="8" ry="14" fill="#C9A86B" opacity="0.9"/>
        <ellipse cx="40" cy="22" rx="4" ry="8" fill="#FFE9B0"/>
        <rect x="36" y="40" width="8" height="60" fill="#3D2F1E"/>
        <rect x="28" y="98" width="24" height="12" rx="2" fill="#6B4220"/>
      </svg>
      <div style={{
        fontSize: 24, letterSpacing: 12, textTransform:'uppercase',
        fontFamily:'Manrope', fontWeight: 500, color: '#C9A86B',
        marginBottom: 48,
      }}>Молитва</div>
      <div style={{
        fontSize: 64, fontWeight: 400, lineHeight: 1.4, textAlign:'center',
        textWrap:'balance', maxWidth: 1400, fontStyle:'italic',
        color: 'rgba(255,255,255,0.95)',
      }}>
        «Атабыз, асмандагы Атабыз,<br/>
        Сенин ысмың ыйыкталсын,<br/>
        Сенин Падышачылыгың келсин.»
      </div>
      <div style={{ marginTop: 48, fontSize: 18, fontFamily:'Manrope', color: '#C9A86B', letterSpacing: 4 }}>
        Матай 6:9
      </div>
    </div>
  );
}

/* 7. Black / clear */
function TplBlack() {
  return (
    <div style={{
      width: 1920, height: 1080, background: '#000',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      position:'relative',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(201,168,107,0.18), rgba(139,90,43,0.10))',
        border: '1px solid rgba(201,168,107,0.20)',
        display:'grid', placeItems:'center',
        color:'rgba(201,168,107,0.85)',
        fontFamily:'Cormorant Garamond', fontSize: 44, fontWeight: 600,
      }}>В</div>
      <div style={{
        marginTop: 32, fontFamily:'Manrope', fontSize: 14, color:'rgba(255,255,255,0.18)',
        letterSpacing: 8, textTransform:'uppercase',
      }}>Великая Благодать</div>
    </div>
  );
}

/* 8. Welcome / opener */
function TplWelcome() {
  return (
    <div style={{
      width: 1920, height: 1080,
      background: 'linear-gradient(160deg, #FBF8F2 0%, #EDE4D2 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:'Cormorant Garamond', color: '#1A140B',
      position:'relative', overflow:'hidden',
    }}>
      {/* corner ornament */}
      <svg width="180" height="180" style={{ position:'absolute', top: 60, left: 60, opacity: 0.5 }}>
        <circle cx="90" cy="90" r="80" stroke="#8B5A2B" strokeWidth="1" fill="none"/>
        <circle cx="90" cy="90" r="60" stroke="#8B5A2B" strokeWidth="1" fill="none"/>
        <circle cx="90" cy="90" r="3" fill="#8B5A2B"/>
      </svg>
      <svg width="180" height="180" style={{ position:'absolute', bottom: 60, right: 60, opacity: 0.5 }}>
        <path d="M30 90 L90 30 L150 90 L90 150 Z" stroke="#8B5A2B" strokeWidth="1" fill="none"/>
        <path d="M60 90 L90 60 L120 90 L90 120 Z" stroke="#8B5A2B" strokeWidth="1" fill="none"/>
      </svg>

      <div style={{
        fontSize: 24, letterSpacing: 12, textTransform: 'uppercase',
        fontFamily:'Manrope', fontWeight: 600, color:'#8B5A2B',
        marginBottom: 40,
      }}>Воскресное служение</div>
      <div style={{
        fontSize: 200, fontWeight: 500, lineHeight: 1, fontStyle:'italic',
        letterSpacing: -4, color:'#3D2F1E',
      }}>Кош келиңиз</div>
      <div style={{
        fontSize: 48, fontWeight: 400, color:'#6A5A45',
        marginTop: 24, letterSpacing: 2,
      }}>Добро пожаловать</div>
      <div style={{
        marginTop: 80, padding: '14px 40px',
        border: '1px solid #B8865A', borderRadius: 999,
        fontFamily:'Manrope', fontSize: 18, color:'#8B5A2B',
        letterSpacing: 4, textTransform:'uppercase', fontWeight: 600,
      }}>10 мая 2026</div>
    </div>
  );
}

/* 9. Two-column bilingual */
function TplBilingual() {
  return (
    <div style={{
      width: 1920, height: 1080, background: '#0B1530',
      display:'grid', gridTemplateColumns: '1fr 1px 1fr',
      fontFamily:'Cormorant Garamond', color:'#FBF8F2',
      position:'relative',
    }}>
      {[
        { lang:'КРГ · Кыргызча', text:'Анткени Кудай адамдарды ушунчалык сүйгөндүктөн, ишенген ар бир адам өлбөстөн, түбөлүк өмүргө ээ болсун деп, Өзүнүн жалгыз Уулун берди.' },
        { lang:'РСТ · Русский',  text:'Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного, дабы всякий верующий в Него, не погиб, но имел жизнь вечную.' },
      ].map((col, i) => (
        <React.Fragment key={i}>
          {i===1 && <div style={{ background: 'linear-gradient(180deg, transparent, rgba(201,168,107,0.3), transparent)' }}/>}
          <div style={{
            padding: '7% 5%', display:'flex', flexDirection:'column', justifyContent:'center',
          }}>
            <div style={{
              fontFamily:'Manrope', fontSize: 16, letterSpacing: 6, textTransform: 'uppercase',
              color:'#C9A86B', fontWeight: 600, marginBottom: 28,
            }}>{col.lang}</div>
            <div style={{
              fontSize: 44, fontWeight: 400, lineHeight: 1.35, textWrap:'balance',
            }}>{col.text}</div>
          </div>
        </React.Fragment>
      ))}
      <div style={{
        position:'absolute', top: 40, left: '50%', transform:'translateX(-50%)',
        fontFamily:'Manrope', fontSize: 16, letterSpacing: 8,
        textTransform:'uppercase', color:'#C9A86B', fontWeight: 700,
      }}>Иоанна 3:16</div>
    </div>
  );
}

Object.assign(window, {
  TplVerseClassic, TplSongVerse, TplChorus, TplSongTitle,
  TplAnnouncement, TplPrayer, TplBlack, TplWelcome, TplBilingual,
});
