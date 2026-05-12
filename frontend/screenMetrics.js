/**
 * Layout metrics for 1920×1080 TV slides (must match TVScreen padding).
 * CSS: percentage paddings resolve against the element's *width* (inline size),
 * so vertical 8% is 0.08 × 1920, not 0.08 × 1080.
 */
const W = 1920;
const H = 1080;

export function verseInnerBox() {
  const padX = 0.12 * W;
  const padY = 0.08 * W;
  return {
    innerW: W - 2 * padX,
    innerH: H - 2 * padY,
  };
}

/** Verse body: below ref block, inside maxWidth:90%, reserve bottom for overlays. */
export function verseTextAvailDimensions() {
  const { innerW, innerH } = verseInnerBox();
  const refBlock = 28 * 1.35 + 56 + 10;
  const bottomReserve = 80;
  const heuristicFudge = 0.9;
  const availW = innerW * 0.9;
  const availH = Math.max(160, (innerH - refBlock - bottomReserve) * heuristicFudge);
  return { availW, availH };
}

/**
 * One column in TVScreen bilingual layout: grid half-width, padding 7% 5%
 * (vertical % uses the column width in CSS), body text at ~0.62× screen verse size.
 */
export function bilingualColumnTextAvailDimensions(screenFontSize) {
  const colW = (W - 1) / 2;
  const padXFrac = 0.05;
  const padYFrac = 0.07;
  const availW = colW * (1 - 2 * padXFrac);
  const langBlock = 16 * 1.35 + 28;
  const innerH = H - 2 * padYFrac * colW;
  const availH = Math.max(120, (innerH - langBlock) * 0.9);
  const bodyFontSize = Math.max(22, Math.round(screenFontSize * 0.62));
  return { availW, availH, bodyFontSize };
}

/** Same word-wrap model as splitTextForScreen in App.jsx */
export function estimateWrapLines(text, fontSize, availW, charW = 0.52) {
  const charsPerLine = Math.max(1, Math.floor(availW / (fontSize * charW)));
  let lines = 0;
  for (const para of String(text || '').split('\n')) {
    if (!para.trim()) { lines++; continue; }
    let cur = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = cur ? `${cur} ${word}` : word;
      if (next.length > charsPerLine && cur) { lines++; cur = word; }
      else cur = next;
    }
    if (cur) lines++;
  }
  return Math.max(1, lines);
}

export function fitFontSizeForWrappedText(text, maxSize, availW, availH, lineH = 1.3) {
  for (let f = maxSize; f >= 22; f -= 2) {
    const n = estimateWrapLines(text, f, availW);
    if (n * f * lineH <= availH) return f;
  }
  return 22;
}
