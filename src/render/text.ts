import { ATLAS_IMG, FONT, FONT_IMG, type FontSize, SPRITES } from '@/assets';
import { getCtx, makeCanvas } from './canvas';
import { K } from './palette';

export type { FontSize } from '@/assets';

// The font sheet is white-on-transparent; each (size, color, string) combo is
// colored once into a small cache canvas.
const PL = 2;
const PT = 4;
const textCache = new Map<string, HTMLCanvasElement>();

export function glyph(size: FontSize, ch: string) {
  return FONT[size][ch];
}

export function tw(s: string, size: FontSize = 12): number {
  let width = 0;
  for (const ch of s) {
    const g = FONT[size][ch];
    width += g ? g[6] : size;
  }
  return width;
}

function textCanvas(s: string, size: FontSize, color: string): HTMLCanvasElement {
  const key = `${size}|${color}|${s}`;
  const cached = textCache.get(key);
  if (cached) return cached;
  if (textCache.size > 1500) textCache.clear();
  const width = tw(s, size) + PL * 2 + 2;
  const height = size + PT + 6;
  const [canvas, g] = makeCanvas(Math.max(1, width), height);
  let x = PL;
  for (const ch of s) {
    const gl = FONT[size][ch];
    if (!gl) {
      x += size;
      continue;
    }
    if (gl[2] > 0) g.drawImage(FONT_IMG, gl[0], gl[1], gl[2], gl[3], x + gl[4], PT + gl[5], gl[2], gl[3]);
    x += gl[6];
  }
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, canvas.width, canvas.height);
  textCache.set(key, canvas);
  return canvas;
}

export type TextAnchor = 'la' | 'ma' | 'ra';

/**
 * Draw pixel text.
 * anchor: 'la' left, 'ma' center, 'ra' right. `y` is the visual top of the glyphs.
 * `chars` limits the number of characters drawn (typewriter effect).
 */
export function txt(
  x: number,
  y: number,
  s: string | number,
  size: FontSize = 12,
  color: string = K.WHITE,
  anchor: TextAnchor = 'la',
  chars: number | null = null,
): void {
  const g = getCtx();
  const str = String(s);
  if (!str) return;
  const canvas = textCanvas(str, size, color);
  const width = tw(str, size);
  if (anchor === 'ma') x = Math.round(x - width / 2);
  else if (anchor === 'ra') x -= width;
  if (chars !== null) {
    if (chars <= 0) return;
    const part = tw([...str].slice(0, chars).join(''), size);
    g.drawImage(canvas, 0, 0, PL + part, canvas.height, x - PL, y - PT, PL + part, canvas.height);
    return;
  }
  g.drawImage(canvas, x - PL, y - PT);
}

/** Scaled-up pixel text (used for titles). */
export function bigText(
  x: number,
  y: number,
  s: string,
  size: FontSize,
  k: number,
  color: string,
  shadow: string | null = null,
  align: 'center' | 'right' | 'left' = 'center',
): [number, number] {
  const g = getCtx();
  const width = tw(s, size) * k;
  if (align === 'center') x = Math.round(x - width / 2);
  else if (align === 'right') x -= width;
  const draw1 = (cc: string, dx: number, dy: number) => {
    const canvas = textCanvas(s, size, cc);
    g.drawImage(canvas, 0, 0, canvas.width, canvas.height, dx - PL * k, dy - PT * k, canvas.width * k, canvas.height * k);
  };
  if (shadow) draw1(shadow, x + k, y + k);
  draw1(color, x, y);
  return [width, size * k];
}

/** Character-by-character wrapping (works for both CJK and Latin text). */
export function wrap(s: string, size: FontSize, width: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const ch of s) {
    if (ch === '\n') {
      lines.push(current);
      current = '';
      continue;
    }
    if (current && tw(current + ch, size) > width) {
      lines.push(current);
      current = ch.trim();
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Draw a sprite from the generated atlas. Returns false if the key is unknown. */
export function spr(key: string, x: number, y: number): boolean {
  const s = SPRITES[key];
  if (!s) return false;
  getCtx().drawImage(ATLAS_IMG, s[0], s[1], s[2], s[3], x + s[4], y + s[5], s[2], s[3]);
  return true;
}
