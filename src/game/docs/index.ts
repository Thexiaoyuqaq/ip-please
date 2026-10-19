import { pt, rect } from '@/render/canvas';
import { K, rgb } from '@/render/palette';
import type { RGB } from '@/render/palette';

export * from './core';
export { Passport, AccordionPassport, CrayonPassport, MiniPassport } from './Passport';
export type { PassportOptions } from './Passport';
export { Card, accountCard, deviceCard, field } from './Card';
export { Note, Citation, PrintStrip, PromptPaper, drawAddressCard } from './Paper';
export { Rulebook } from './Rulebook';

/** Small document icon shown on the counter (18×12 for books, 16×10 for cards). */
export function smallIcon(kind: 'book' | 'card', color: RGB, x: number, y: number): void {
  if (kind === 'book') {
    rect(x, y, x + 18, y + 12, K.INK);
    rect(x + 1, y + 1, x + 17, y + 11, rgb(color));
    pt(x + 9, y + 6, K.GOLD);
  } else {
    const dark = color.map((c) => Math.floor(c * 0.85)) as unknown as RGB;
    const darker = color.map((c) => Math.floor(c * 0.8)) as unknown as RGB;
    rect(x, y, x + 16, y + 10, rgb(dark));
    rect(x + 1, y + 1, x + 15, y + 9, rgb(color));
    rect(x + 3, y + 4, x + 12, y + 4, rgb(darker));
  }
}
