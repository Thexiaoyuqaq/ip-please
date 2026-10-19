import { now } from '@/engine/clock';
import { drawAddressCard } from '@/game/docs';
import { getCtx, setCtx, easeOut, seg, W } from '@/render/canvas';
import { bigText, txt } from '@/render/text';
import { K } from '@/render/palette';
import { resolveList, resolveRef, T } from '@/i18n/text';
import { B } from '@/game/booth/state';
import { DESK } from '@/game/booth/layout';
import { H, W } from '@/render/canvas';
import { endDaySoon } from '@/game/booth/entrant';
import { darken, lerp, rect, outline, spark } from '@/render/canvas';

/** Address-card pile effect (the "37th traveler at 123 Main St" reveal). */
export function drawEffects(g: CanvasRenderingContext2D): void {
  setCtx(g);
  B.effects = B.effects.filter((effect) => effect.ent === B.ent && now < effect.t0 + 4);
  for (const effect of B.effects) {
    if (effect.type !== 'pile') continue;
    const elapsed = now - effect.t0;
    const count = 37;
    const step = 1.6 / count;
    const visible = Math.min(count, Math.floor(elapsed / step) + 1);
    let seed = 7;
    const random = (a: number, b: number) => {
      seed = (seed * 9301 + 49297) % 233280;
      return a + Math.floor((seed / 233280) * (b - a + 1));
    };
    const ctx = getCtx();
    ctx.save();
    ctx.beginPath();
    ctx.rect(DESK[0], DESK[1], W - DESK[0], H - DESK[1]);
    ctx.clip();
    for (let i = 0; i < visible; i++) {
      const x = 430 + random(-60, 60);
      const y = 200 + random(-20, 70);
      const fall = 1 - easeOut(seg(elapsed, i * step, i * step + 0.08));
      drawAddressCard(x, y - Math.round(fall * 16));
    }
    ctx.restore();
    bigText(600, 290, `×${visible}`, 12, 2, K.RED_L, K.INK, 'right');
  }
}

/** Day 5 epilogue: the constitution close-up. */
export function drawCloseup(g: CanvasRenderingContext2D): void {
  if (!B.closeup) return;
  setCtx(g);
  const elapsed = now - B.closeup.t0;
  darken(0.72);
  const bw = 400;
  const bh = 230;
  const x0 = (W - bw) >> 1;
  const y0 = Math.round(lerp(H + 10, (H - bh) >> 1, easeOut(seg(elapsed, 0, 0.3))));
  rect(x0 - 6, y0 - 6, x0 + bw + 6, y0 + bh + 6, K.BOOK);
  outline(x0 - 6, y0 - 6, x0 + bw + 6, y0 + bh + 6, K.BOOK_L);
  rect(x0, y0, x0 + bw / 2 - 2, y0 + bh, K.PAPER);
  rect(x0 + bw / 2 + 2, y0, x0 + bw, y0 + bh, K.PAPER);
  rect(x0 + bw / 2 - 1, y0, x0 + bw / 2 + 1, y0 + bh, K.PAPER_D);
  spark(x0 + 24, y0 + 22, K.GOLD, false);
  txt(x0 + 36, y0 + 16, resolveRef(T('closeup.bookTitle')), 12, K.TEXT);
  resolveList('closeup.lines').forEach((line, i) =>
    txt(x0 + 16, y0 + 44 + i * 16, line, 10, i ? K.TEXT_L : K.TEXT),
  );
  for (let i = 0; i < 5; i++) {
    rect(x0 + 16, y0 + 140 + i * 12, x0 + bw / 2 - 20 - ((i * 13) % 40), y0 + 143 + i * 12, K.PAPER_D);
  }
  if (elapsed > 0.5) {
    resolveList('closeup.big').forEach((line, i) => bigText(x0 + (bw * 3) / 4, y0 + 64 + i * 40, line, 12, 2, K.RED_D));
  }
  if (elapsed > 1) txt(x0 + (bw * 3) / 4, y0 + bh - 26, resolveRef(T('closeup.note')), 8, K.TEXT_L, 'ma');
  if (elapsed > 1.2) txt(W / 2, H - 16, resolveRef(T('common.clickContinue')), 8, K.GREY, 'ma');
}

export function closeupDone(): void {
  B.closeup = null;
  if (B.idx >= B.queue.length) endDaySoon();
}
