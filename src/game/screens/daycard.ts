import { DATES, WEEKDAY_KEYS } from '@/game/constants';
import { S } from '@/game/state';
import { resolveRef, T } from '@/i18n/text';
import { rect } from '@/render/canvas';
import { K } from '@/render/palette';
import { bigText, txt } from '@/render/text';

export function drawDayCard(t: number): void {
  rect(0, 0, 639, 359, K.INK);
  if (t < 0.55) return;
  bigText(320, 132, `DAY ${S.day}`, 12, 4, K.WHITE);
  txt(
    320,
    196,
    resolveRef(T('dateLine', { date: DATES[S.day], weekday: T(WEEKDAY_KEYS[S.day]) })),
    10,
    K.GREY,
    'ma',
  );
}
