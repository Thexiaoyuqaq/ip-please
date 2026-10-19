import { BG_IMG } from '@/assets';
import { rt, st } from '@/engine/runtime';
import { navigate } from '@/engine/navigation';
import { clearSave, loadSave, newGame, S } from '@/game/state';
import { resolveRef, T } from '@/i18n/text';
import { darken, getCtx, inBox, rect, outline } from '@/render/canvas';
import { K } from '@/render/palette';
import { bigText, spr, txt } from '@/render/text';

export const CONTINUE_TITLE = [190, 292, 312, 318] as const;
export const NEWGAME_TITLE = [328, 292, 450, 318] as const;

export function drawTitle(t: number): void {
  getCtx().drawImage(BG_IMG, 0, 0);
  darken(0.88);
  if (t < 0.3) return;
  rect(0, 124, 639, 214, 'rgb(92,28,26)');
  rect(0, 124, 639, 125, K.RED);
  rect(0, 213, 639, 214, K.RED);
  spr('title_emblem', 298, 62);
  bigText(320, 140, 'IP, PLEASE', 12, 5, K.WHITE, K.INK);
  if (t >= 1) bigText(320, 232, resolveRef(T('title.subtitle')), 12, 2, K.CLAUDE_L, K.INK);
  if (t >= 1.6) txt(320, 268, resolveRef(T('title.tagline')), 8, K.GREY, 'ma');
  if (t < 1.6) return;
  const save = loadSave();
  if (save) {
    for (const [box, label] of [
      [CONTINUE_TITLE, T('title.continue', { day: save.day })],
      [NEWGAME_TITLE, T('title.newGame')],
    ] as const) {
      const hover = rt().ptr.mouse && inBox(rt().ptr.x, rt().ptr.y, box);
      rect(box[0], box[1], box[2], box[3], hover ? K.RED : K.RED_D);
      outline(box[0], box[1], box[2], box[3], K.RED_L);
      txt((box[0] + box[2]) >> 1, box[1] + 7, resolveRef(label), 12, K.WHITE, 'ma');
    }
  } else if (Math.floor(t * 2) % 2 === 0) {
    txt(320, 300, resolveRef(T('common.clickPlay')), 12, K.WHITE, 'ma');
  }
}

export function titleClick(x: number, y: number): void {
  if (st() < 1.6) return;
  const save = loadSave();
  if (!save) {
    newGame();
    navigate('daycard');
    return;
  }
  if (inBox(x, y, CONTINUE_TITLE)) {
    newGame();
    Object.assign(S, save);
    navigate('daycard');
    return;
  }
  if (inBox(x, y, NEWGAME_TITLE)) {
    clearSave();
    newGame();
    navigate('daycard');
  }
}
