import { now } from '@/engine/clock';
import { S } from '@/game/state';
import { W } from '@/render/canvas';
import { rect, outline } from '@/render/canvas';
import { K } from '@/render/palette';
import { txt, tw, type FontSize } from '@/render/text';
import { resolveRef } from '@/i18n/text';
import { T } from '@/i18n/text';
import { B } from './state';
import { DESK } from './layout';

export function hintText(): string {
  if (B.flash && now < B.flash.t + 3.2) return resolveRef(B.flash.text);
  const ent = B.ent;
  const here = !!ent && ent.phase === 'here' && !!ent.handed && !B.event;
  const tut = S.tut;
  if (S.day === 1) {
    if (!tut.called) return resolveRef(T('booth.hints.day1Called'));
    if (!here) return '';
    const onDesk = B.docs.some((doc) => doc.owner === 'ent' && doc.big);
    if (!tut.dragged && !onDesk) return resolveRef(T('booth.hints.day1Drag'));
    if (!tut.rules) return resolveRef(T('booth.hints.day1Rules'));
    if (!tut.tray) return resolveRef(T('booth.hints.day1Tray'));
    if (!tut.stamped) return resolveRef(T('booth.hints.day1Stamp'));
    if (!tut.returned && ent!.decided) return resolveRef(T('booth.hints.day1Return'));
    if (!tut.inspect && B.idx >= 3) return resolveRef(T('booth.hints.day1Inspect'));
    return '';
  }
  if (!here) return '';
  if (S.day <= 5 && !B.ruleOpened) return resolveRef(T('booth.hints.newRules'));
  if (S.day === 2) {
    if (!tut.inspect) return resolveRef(T('booth.hints.day2Inspect'));
    if (!tut.tell && !ent!.suspect && B.idx >= 3) return resolveRef(T('booth.hints.day2Tell'));
    if (!tut.quiz && ent!.suspect && ent!.spec.quiz) return resolveRef(T('booth.hints.day2Quiz'));
  }
  if (S.day === 3 && !tut.account && B.idx <= 2) return resolveRef(T('booth.hints.day3Account'));
  if (S.day === 4 && !tut.xray) return resolveRef(T('booth.hints.day4Xray'));
  return '';
}

export function drawHint(): void {
  const text = hintText();
  if (!text || B.insp.on) return;
  const size: FontSize = tw(text, 10) > 396 ? 8 : 10;
  const width = tw(text, size) + 12;
  const x = Math.max(DESK[0] + 4, W - 6 - width);
  const y = 134;
  rect(x, y, x + width, y + 15, 'rgba(22,19,19,0.92)');
  outline(x, y, x + width, y + 15, K.CLAUDE);
  txt(x + 6, y + (size === 10 ? 3 : 4), text, size, K.CLAUDE_L);
}
