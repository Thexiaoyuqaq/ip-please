import { BG_IMG } from '@/assets';
import { navigate } from '@/engine/navigation';
import { clearSave, newGame, S, FAMILY_MEMBERS } from '@/game/state';
import { resolveRef, T } from '@/i18n/text';
import { center, darken, getCtx, pattern, rect, outline } from '@/render/canvas';
import { K } from '@/render/palette';
import { bigText, txt } from '@/render/text';

const THUMB = ['....XX....', '...XXX....', '...XX.....', 'XX.XXXXXX.', 'XX.XXXXXXX', 'XX.XXXXXX.', 'XX.XXXXXXX', 'XX.XXXXXX.', 'XX..XXXXX.'];
const COIN = ['..XXXXX..', '.X.....X.', 'X..XXX..X', 'X..X....X', 'X..XXX..X', 'X....X..X', 'X..XXX..X', '.X.....X.', '..XXXXX..'];
const STAR = ['....X....', '....X....', '...XXX...', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '..XX.XX..', '.XX...XX.', '.X.....X.'];

export const RESTART_BTN = [250, 316, 390, 340] as const;

export function drawEnd(t: number): void {
  getCtx().drawImage(BG_IMG, 0, 0);
  darken(0.9);
  const approve = S.flags.ending !== 'deny';
  rect(0, 34, 639, 124, 'rgb(92,28,26)');
  rect(0, 34, 639, 35, K.RED);
  rect(0, 123, 639, 124, K.RED);
  bigText(320, 46, 'IP, PLEASE', 12, 4, K.WHITE, K.INK);
  txt(320, 106, resolveRef(T(approve ? 'end.title' : 'end.titleDeny')), 10, K.CLAUDE_L, 'ma');
  const stats = S.stats;
  if (t > 0.6) {
    txt(
      320,
      136,
      resolveRef(T('end.stats', { approve: stats.approve || 0, deny: stats.deny || 0, detain: stats.detain || 0, wrong: stats.wrong })),
      12,
      K.WHITE,
      'ma',
    );
    const family = FAMILY_MEMBERS.map((key) => {
      const name = resolveRef(T(`summary.familyNames.${key}`)).split(' ')[1] ?? key;
      const status = resolveRef(T(S.family[key].gone ? 'end.gone' : 'end.alive'));
      return resolveRef(T('end.familyItem', { name, status }));
    }).join('   ');
    txt(320, 156, family, 10, K.GREY, 'ma');
  }
  if (t > 1.2) {
    if (approve) {
      txt(320, 180, resolveRef(T('end.credit')), 12, K.WHITE, 'ma');
      if (S.flags.bribed) txt(320, 198, resolveRef(T('end.bribedNote')), 8, K.GREY, 'ma');
    } else {
      txt(320, 180, resolveRef(T('end.denyLine')), 10, K.WHITE, 'ma');
      txt(320, 198, resolveRef(T('end.denyHint')), 8, K.GREY, 'ma');
    }
  }
  if (t > 1.8) {
    bigText(320, 214, resolveRef(T(approve ? 'end.gloryThumbs' : 'end.gloryAnthrotzka')), 12, 2, K.CLAUDE_L, K.INK);
    if (approve) {
      (
        [
          [THUMB, T('end.like')],
          [COIN, T('end.coin')],
          [STAR, T('end.star')],
        ] as const
      ).forEach(([pixels, label], i) => {
        const cx = 320 - 90 + i * 90;
        pattern(pixels, cx - Math.floor((pixels[0].length * 3) / 2), 250, { X: K.CLAUDE_L }, 3);
        txt(cx, 282, resolveRef(label), 10, K.GREY, 'ma');
      });
    }
  }
  if (t > 2.4) {
    restartButton(resolveRef(T('common.restart')));
    txt(320, 346, resolveRef(T('end.footer')), 8, K.GREY_D, 'ma');
  }
}

export function drawOver(t: number): void {
  rect(0, 0, 639, 359, K.INK);
  bigText(320, 110, resolveRef(T('over.title')), 12, 4, K.RED_L);
  if (t > 0.6) txt(320, 180, resolveRef(T('over.line1')), 12, K.WHITE, 'ma');
  if (t > 1) txt(320, 204, resolveRef(T('over.line2')), 10, K.GREY, 'ma');
  if (t > 1.5) restartButton(resolveRef(T('common.again')));
}

export function restartButton(label: string): void {
  rect(...RESTART_BTN, K.RED_D);
  outline(...RESTART_BTN, K.RED_L);
  txt(center(RESTART_BTN)[0], RESTART_BTN[1] + 6, label, 12, K.WHITE, 'ma');
}

export function restartGame(): void {
  clearSave();
  newGame();
  navigate('daycard');
}
