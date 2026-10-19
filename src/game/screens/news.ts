import { DATES, NEWS_ICONS } from '@/game/constants';
import { S } from '@/game/state';
import { resolveRef, T } from '@/i18n/text';
import { easeOut, lerp, rect, seg, H, W } from '@/render/canvas';
import { K } from '@/render/palette';
import { bigText, spr, txt, tw, wrap } from '@/render/text';

export function drawNews(t: number): void {
  const h1 = resolveRef(T(`news.${S.day}.h1`));
  const sub = resolveRef(T(`news.${S.day}.sub`));
  const h2 = S.day === 6 && S.flags.bribed ? resolveRef(T('news.bribedH2')) : resolveRef(T(`news.${S.day}.h2`));
  const icon = NEWS_ICONS[S.day];

  rect(0, 0, W - 1, H - 1, K.DESK);
  for (let y = 4; y < H; y += 7) if ((y * 7919) % 10 < 6) rect(0, y, W - 1, y, K.DESK_D);
  const px = 140;
  const pw = 360;
  const ph = 330;
  const py = Math.round(lerp(H + 4, 16, easeOut(seg(t, 0, 0.45))));
  rect(px + 4, py + 4, px + pw + 4, py + ph + 4, K.DESK_D);
  const ink = 'rgb(40,34,30)';
  const faint = 'rgb(176,164,144)';
  rect(px, py, px + pw, py + ph, 'rgb(224,214,192)');
  bigText(px + pw / 2, py + 10, resolveRef(T('news.masthead')), 12, 2, ink);
  txt(px + pw / 2, py + 38, `${resolveRef(T('news.mastheadEn'))}  ·  ${DATES[S.day]}`, 8, K.TEXT_L, 'ma');
  rect(px + 10, py + 50, px + pw - 10, py + 51, ink);
  rect(px + 10, py + 54, px + pw - 10, py + 54, ink);
  const k = tw(h1) * 2 <= pw - 24 ? 2 : 1;
  bigText(px + pw / 2, py + 62, h1, 12, k, ink);
  let yy = py + 62 + (k === 2 ? 30 : 18);
  for (const line of wrap(sub, 10, pw - 40)) {
    txt(px + pw / 2, yy, line, 10, K.TEXT, 'ma');
    yy += 13;
  }
  yy += 4;
  rect(px + 10, yy, px + pw - 10, yy, ink);
  yy += 8;
  spr(`news:${icon}`, px + 14, yy);
  let hy = yy + 2;
  for (const line of wrap(h2, 12, pw - 175)) {
    txt(px + 160, hy, line, 12, ink);
    hy += 16;
  }
  for (let r = 0; r < 4; r++) rect(px + 160, hy + 6 + r * 9, px + 340 - ((r * 37) % 50), hy + 9 + r * 9, faint);
  yy = Math.max(yy + 110, hy + 46);
  for (let row = 0; yy + row * 10 < py + ph - 12; row++) {
    for (let col = 0; col < 3; col++) {
      const x0 = px + 14 + col * 114;
      rect(x0, yy + row * 10, x0 + 100 - ((row * 13 + col * 7) % 30), yy + row * 10 + 3, faint);
    }
  }
  if (t > 0.8 && Math.floor(t * 2) % 2 === 0) {
    txt(W - 8, H - 14, resolveRef(T('common.clickWork')), 10, K.WHITE, 'ra');
  }
}
