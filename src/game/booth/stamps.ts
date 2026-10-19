import { rt } from '@/engine/runtime';
import { now } from '@/engine/clock';
import { S } from '@/game/state';
import { easeOut, inBox, lerp, seg, smooth, W } from '@/render/canvas';
import { flash, later, runSteps, B } from './state';
import type { Decision } from '@/game/state';
import type { DocumentInstance } from './types';
import { MARK_XY, TRAY_Y0, TRAY_Y1, TRAY_X } from './layout';
import { T } from '@/i18n/text';

export function trayU(): number {
  const { open, t } = B.tray;
  return open ? easeOut(seg(now, t, t + 0.3)) : 1 - smooth(seg(now, t, t + 0.25));
}

export const trayX = (): number => Math.round(lerp(W, TRAY_X, trayU()));

export function setTray(open: boolean): void {
  if (B.tray.open === open) return;
  B.tray = { open, t: now };
  rt().sfx.play(open ? 'tray' : 'tray_back');
  if (open) S.tut.tray = true;
}

export function stampBtnBox(kind: Decision, tx: number): readonly [number, number, number, number] {
  const bx = tx + (kind === 'approve' ? 10 : 90);
  return [bx, TRAY_Y0 + 8, bx + 64, TRAY_Y0 + 48];
}

export function stamp(kind: Decision): void {
  const sfx = rt().sfx;
  B.presses.push({ t: now, kind });
  sfx.play(`stamp_${kind}`, 1, 0.03);
  B.shake = now + 0.05;
  const [mx, my] = MARK_XY[kind];
  const cx = mx + 29;
  const cy = my + 17;
  const target = [...B.docs]
    .reverse()
    .find((doc) => doc.big && inBox(cx, cy, [doc.x, doc.y, doc.x + doc.doc.w - 1, doc.y + doc.doc.h - 1]));
  if (target) {
    later(0.05, () => target.marks.push({ kind, rx: mx - target.x, ry: my - target.y }));
    S.tut.stamped = true;
    const ent = B.ent;
    if (ent && target.owner === 'ent' && target.key === ent.spec.primary && !ent.decided) {
      ent.decided = kind;
      // Track the instance for the leave check.
      void (target as DocumentInstance);
      if (ent.spec.tension && kind === 'approve') sfx.play('fanfare', 1, 0.4);
      const reaction = ent.spec.react?.[kind];
      if (reaction) runSteps(reaction, 0.4);
    }
  } else {
    flash(T('booth.flash.noStampTarget'));
  }
  later(0.5, () => setTray(false));
}

export { TRAY_X, TRAY_W, TRAY_Y0, TRAY_Y1 } from './layout';
