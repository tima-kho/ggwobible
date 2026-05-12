/* global React */
const { useState } = React;

/* ============ Reusable bits ============ */

function BookCard({ name, full, active, theme = 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div
      style={{
        padding: '10px 6px',
        borderRadius: 10,
        border: `1px solid ${active ? (isDark ? '#C9A86B' : '#B8865A') : (isDark ? '#2A2117' : '#EDE4D2')}`,
        background: active
          ? (isDark ? 'rgba(201,168,107,0.12)' : '#EDE4D2')
          : (isDark ? '#16110A' : '#FBF8F2'),
        color: isDark ? '#E8D5B5' : '#3D2F1E',
        textAlign: 'center',
        fontFamily: 'Manrope',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        position: 'relative',
      }}
      title={full}
    >
      {name}
    </div>
  );
}

function VerseLine({ n, text, theme, active }) {
  const isDark = theme === 'dark';
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '10px 14px',
      borderRadius: 8,
      background: active ? (isDark ? 'rgba(201,168,107,0.08)' : 'rgba(184,134,90,0.10)') : 'transparent',
      cursor: 'pointer',
    }}>
      <span style={{
        fontFamily: 'Cormorant Garamond',
        fontSize: 18,
        fontWeight: 600,
        color: isDark ? '#C9A86B' : '#8B5A2B',
        minWidth: 24,
        paddingTop: 2,
      }}>{n}</span>
      <span style={{
        fontFamily: 'Manrope',
        fontSize: 15,
        lineHeight: 1.55,
        color: isDark ? '#E8D5B5' : '#1A140B',
        fontWeight: active ? 600 : 400,
      }}>{text}</span>
    </div>
  );
}

const BOOKS_OT = [
  ['Башт','Башталыш'],['Чыг','Чыгуу'],['Леб','Лебилер'],
  ['Сан','Сандар'],['Мыйз','Мыйзам'],['Жаш','Жашыя'],
  ['Башк','Башкаруу'],['Рут','Рут'],['1Шем','1 Шемуел'],
  ['2Шем','2 Шемуел'],['1Пад','1 Падыша'],['2Пад','2 Падыша'],
  ['1Жылн','1 Жылнаама'],['2Жылн','2 Жылнаама'],['Эзра','Эзра'],
  ['Нек','Некемия'],['Эст','Эстер'],['Аюб','Аюб'],
  ['Заб','Забур'],['Накыл','Накыл сөз'],['Нас','Насаатчы'],
];
const BOOKS_NT = [
  ['Матф','Матай'],['Мар','Марк'],['Лук','Лука'],
  ['Жкн','Жакан'],['Элч','Элчилер'],['Рим','Римдиктер'],
];

const VERSES_JOHN3 = [
  [14,'Муса чөлдө жыланды илип койгондой эле, Адам Уулу да илиниши керек.'],
  [15,'Ага ишенген ар бир адам түбөлүк өмүргө ээ болот.'],
  [16,'Анткени Кудай адамдарды ушунчалык сүйгөндүктөн, ишенген ар бир адам өлбөстөн, түбөлүк өмүргө ээ болсун деп, Өзүнүн жалгыз Уулун берди.'],
  [17,'Кудай Уулун дүйнөгө соттош үчүн жибербестен, дүйнөнү куткарыш үчүн жиберди.'],
  [18,'Ага ишенген адам соттолбойт. Ага ишенбеген адам болсо буга чейин эле соттолуп койгон, анткени ал Кудайдын жалгыз Уулунун ысымына ишенген эмес.'],
  [19,'Сот болсо мындай: жарык дүйнөгө келди, бирок адамдар жарыкка караганда караңгылыкты жакшы көрүштү.'],
];

const SCR_BGS = [
  { id:'black',    label:'Чёрный',    color:'#000000' },
  { id:'midnight', label:'Полночь',   color:'#0B1530' },
  { id:'navy',     label:'Морской',   color:'#0E2A56' },
  { id:'violet',   label:'Фиолет',    color:'#2A1A55' },
  { id:'burgundy', label:'Бургунди',  color:'#3B1A1A' },
  { id:'forest',   label:'Лесной',    color:'#0F2B22' },
  { id:'indigo',   label:'Индиго',    color:'#161A40' },
];

const TRANSLATIONS = [
  { id:'rst', short:'РСТ', name:'Русский Синодальный' },
  { id:'kyr', short:'КРГ', name:'Кыргызча (KYB, 2004)', active:true },
  { id:'kjv', short:'KJV', name:'King James Version' },
];

Object.assign(window, { BookCard, VerseLine, BOOKS_OT, BOOKS_NT, VERSES_JOHN3, SCR_BGS, TRANSLATIONS });
