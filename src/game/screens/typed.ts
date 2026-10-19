import { rt, st } from '@/engine/runtime';
import { i18n } from '@/i18n';
import { resolveList, resolveRef, T } from '@/i18n/text';
import { rect } from '@/render/canvas';
import { K } from '@/render/palette';
import { txt, tw } from '@/render/text';

export interface TypedLine {
  pi: number;
  s: string;
  t: number;
}

export type TypedLines = TypedLine[] & { end: number; npara: number };

function typeLines(paras: string[][]): TypedLines {
  const out = [] as unknown as TypedLines;
  let t = 0.5;
  paras.forEach((para, pi) => {
    for (const s of para) {
      out.push({ pi, s, t });
      t += [...s].length / 17 + 0.12;
    }
    t += 0.6;
  });
  out.end = t + 1.3;
  out.npara = paras.length;
  return out;
}

const cache = new Map<string, TypedLines>();

function intro(): TypedLines {
  const key = `intro|${i18n.language}`;
  let lines = cache.get(key);
  if (!lines) {
    lines = typeLines([resolveList('intro.p1'), resolveList('intro.p2'), resolveList('intro.p3')]);
    cache.set(key, lines);
  }
  return lines;
}

function erased(): TypedLines {
  const key = `erased|${i18n.language}`;
  let lines = cache.get(key);
  if (!lines) {
    lines = typeLines([
      resolveList('erased.p1'),
      resolveList('erased.p2'),
      resolveList('erased.p3'),
      resolveList('erased.p4'),
    ]);
    cache.set(key, lines);
  }
  return lines;
}

export { intro as introLines, erased as erasedLines };

export function drawTyped(lines: TypedLines): void {
  rect(0, 0, 639, 359, K.INK);
  const total = lines.length + lines.npara - 1;
  let y = Math.floor(180 - (total * 18) / 2);
  let last: number | null = null;
  for (const { pi, s, t } of lines) {
    if (last !== null && pi !== last) y += 18;
    last = pi;
    const n = Math.floor((st() - t) * 17);
    if (n > 0) txt(Math.floor(320 - tw(s) / 2), y, s, 12, 'rgb(214,206,190)', 'la', n);
    y += 18;
  }
  txt(632, 346, resolveRef(T('common.clickSkip')), 8, K.GREY_D, 'ra');
}

let lastKey = -1;

export function typedSounds(lines: TypedLines): void {
  const key = Math.floor(st() * 17);
  if (key === lastKey) return;
  lastKey = key;
  for (const { s, t } of lines) {
    const i = Math.floor((st() - t) * 17);
    if (i >= 0 && i < [...s].length && [...s][i].trim()) {
      rt().sfx.key(i);
      break;
    }
  }
}

export function resetTypedSound(): void {
  lastKey = -1;
}
