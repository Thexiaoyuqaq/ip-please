import { now } from '@/engine/clock';
import { resolveRef, T } from '@/i18n/text';
import { rect } from '@/render/canvas';
import { K } from '@/render/palette';
import { bigText, spr, txt } from '@/render/text';

export function drawBoot(): void {
  rect(0, 0, 639, 359, K.INK);
  spr('title_emblem', 298, 92);
  bigText(320, 156, 'IP, PLEASE', 12, 3, K.WHITE);
  txt(320, 200, resolveRef(T('boot.tagline')), 10, K.CLAUDE_L, 'ma');
  if (Math.floor(now * 2) % 2 === 0) txt(320, 250, resolveRef(T('common.clickStart')), 12, K.WHITE, 'ma');
  txt(320, 300, resolveRef(T('boot.tips')), 8, K.GREY, 'ma');
  txt(320, 330, resolveRef(T('boot.tribute')), 8, K.GREY_D, 'ma');
}
