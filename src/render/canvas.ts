import { C, K, rgba } from './palette';

export const W = 640;
export const H = 360;

export type Ctx = CanvasRenderingContext2D;

let current: Ctx | null = null;

export function setCtx(ctx: Ctx): void {
  current = ctx;
  ctx.imageSmoothingEnabled = false;
}

export function getCtx(): Ctx {
  if (!current) throw new Error('Canvas context is not set');
  return current;
}

export function makeCanvas(width: number, height: number): [HTMLCanvasElement, Ctx] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not supported');
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

/** Inclusive-coordinate rectangle, matching the original engine's convention. */
export function rect(x0: number, y0: number, x1: number, y1: number, color: string): void {
  const g = getCtx();
  g.fillStyle = color;
  g.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
}

export function outline(x0: number, y0: number, x1: number, y1: number, color: string, width = 1): void {
  rect(x0, y0, x1, y0 + width - 1, color);
  rect(x0, y1 - width + 1, x1, y1, color);
  rect(x0, y0, x0 + width - 1, y1, color);
  rect(x1 - width + 1, y0, x1, y1, color);
}

export function pt(x: number, y: number, color: string): void {
  const g = getCtx();
  g.fillStyle = color;
  g.fillRect(x, y, 1, 1);
}

export function line(x0: number, y0: number, x1: number, y1: number, color: string): void {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  if (y0 === y1) return rect(Math.min(x0, x1), y0, Math.max(x0, x1), y0, color);
  if (x0 === x1) return rect(x0, Math.min(y0, y1), x0, Math.max(y0, y1), color);
  const g = getCtx();
  g.fillStyle = color;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

export function pattern(
  pixels: readonly string[],
  x: number,
  y: number,
  colors: Record<string, string | undefined>,
  scale = 1,
): void {
  const g = getCtx();
  for (let j = 0; j < pixels.length; j++) {
    const row = pixels[j];
    for (let i = 0; i < row.length; i++) {
      const color = colors[row[i]];
      if (color) {
        g.fillStyle = color;
        g.fillRect(x + i * scale, y + j * scale, scale, scale);
      }
    }
  }
}

const SPARK_13 = [
  '......X......',
  '...X..X..X...',
  '....X.X.X....',
  '.X...XXX...X.',
  '..XX.XXX.XX..',
  '....XXXXX....',
  'XXXXXXXXXXXXX',
  '....XXXXX....',
  '..XX.XXX.XX..',
  '.X...XXX...X.',
  '....X.X.X....',
  '...X..X..X...',
  '......X......',
];

const SPARK_7 = ['...X...', '.X.X.X.', '..XXX..', 'XXXXXXX', '..XXX..', '.X.X.X.', '...X...'];

export function spark(cx: number, cy: number, color: string, big = true, scale = 1): void {
  const pixels = big ? SPARK_13 : SPARK_7;
  const radius = Math.floor(pixels.length / 2) * scale;
  pattern(pixels, cx - radius, cy - radius, { X: color }, scale);
}

const CURSOR_PX = [
  'X.........',
  'XX........',
  'XWX.......',
  'XWWX......',
  'XWWWX.....',
  'XWWWWX....',
  'XWWWWWX...',
  'XWWWWWWX..',
  'XWWWWWWWX.',
  'XWWWWXXXXX',
  'XWWXWX....',
  'XWX.XWX...',
  'XX...XWX..',
  '......XX..',
];

const HAND_PX = [
  '....XX......',
  '...XWWX.....',
  '...XWWX.....',
  '...XWWXXX...',
  '...XWWXWWXX.',
  '.XXXWWXWWXWX',
  'XWWXWWWWWXWX',
  'XWWWWWWWWWWX',
  '.XWWWWWWWWWX',
  '..XWWWWWWWX.',
  '...XWWWWWX..',
  '...XXXXXXX..',
];

export function drawCursor(x: number, y: number, mode: 'arrow' | 'hand' | 'cross'): void {
  if (mode === 'hand') return pattern(HAND_PX, x - 5, y - 1, { X: K.INK, W: K.WHITE });
  pattern(CURSOR_PX, x, y, { X: K.INK, W: K.WHITE });
}

export function darken(alpha: number, color: readonly number[] = C.INK, box: readonly [number, number, number, number] | null = null): void {
  const g = getCtx();
  g.fillStyle = rgba(color, alpha);
  if (box) g.fillRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
  else g.fillRect(0, 0, W, H);
}

// —— easing & geometry ——

export const clamp = (u: number): number => Math.max(0, Math.min(1, u));

export const seg = (t: number, t0: number, t1: number): number =>
  t1 > t0 ? clamp((t - t0) / (t1 - t0)) : +(t >= t1);

export const smooth = (u: number): number => u * u * (3 - 2 * u);

export const easeOut = (u: number): number => 1 - (1 - u) ** 3;

export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

export const lerp2 = (p: readonly number[], q: readonly number[], u: number): [number, number] => [
  Math.round(lerp(p[0], q[0], u)),
  Math.round(lerp(p[1], q[1], u)),
];

export const inBox = (x: number, y: number, box: readonly number[]): boolean =>
  x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3];

export const center = (box: readonly number[]): [number, number] => [
  Math.floor((box[0] + box[2]) / 2),
  Math.floor((box[1] + box[3]) / 2),
];

export function edgePoint(box: readonly number[], toward: readonly number[]): [number, number] {
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const dx = toward[0] - cx;
  const dy = toward[1] - cy;
  if (!dx && !dy) return [Math.round(cx), Math.round(cy)];
  const sx = dx ? (x1 - x0) / 2 / Math.abs(dx) : Infinity;
  const sy = dy ? (y1 - y0) / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy) + 0.02;
  return [Math.round(cx + dx * s), Math.round(cy + dy * s)];
}

/** Tiny walking figure used outside the booth; x/y is the center of the feet. */
export function tinyPerson(
  x: number,
  y: number,
  coat: string,
  hat: string | null = null,
  step = 0,
  skin: string = K.SKIN,
): void {
  rect(x - 3, y + 1, x + 3, y + 1, K.GROUND_D);
  rect(x - 2, y - 3, x - 1, y - (step ? 1 : 0), K.OUTLINE);
  rect(x + 1, y - 3, x + 2, y - (step ? 0 : 1), K.OUTLINE);
  rect(x - 2, y - 8, x + 2, y - 4, coat);
  rect(x - 1, y - 11, x + 1, y - 9, skin);
  if (hat) rect(x - 1, y - 11, x + 1, y - 11, hat);
}
