import { rt } from '@/engine/runtime';
import { now } from '@/engine/clock';
import { S } from '@/game/state';
import { B } from './state';
import { entrantX } from './position';
import { WIN } from './layout';
import type { Entrant, XrayItem } from './types';

export function setXray(on: boolean): void {
  if (B.xray.on === on) return;
  B.xray = { on, t: now };
  rt().sfx.play(on ? 'xray' : 'click');
  if (on) S.tut.xray = true;
}

export const XRAY_ICONS: Record<'cat' | 'keys', readonly string[]> = {
  cat: [
    'X.........X',
    'XX.......XX',
    'XXX.....XXX',
    'XXXXXXXXXXX',
    'XX.XXXXX.XX',
    'XXXXXXXXXXX',
    'XXXX.X.XXXX',
    '.XXXXXXXXX.',
    '..XXXXXXX..',
  ],
  keys: [
    'XXXXXXXXXXXXXXX',
    'X.X.X.X.X.X.X.X',
    'XXXXXXXXXXXXXXX',
    'XX.X.X.X.X.X.XX',
    'XXXXXXXXXXXXXXX',
    'XXX.........XXX',
    'XXXXXXXXXXXXXXX',
  ],
};

/** Clickable box around an item hidden in the traveler's pocket. */
export function xrayItemBox(ent: Entrant, item: XrayItem): [number, number, number, number] {
  const ex = entrantX(ent) ?? 0;
  const pattern = XRAY_ICONS[item.icon];
  const pw = pattern[0].length * 2;
  const ph = pattern.length * 2;
  const cx = WIN[0] + ex + item.at[0];
  const cy = WIN[1] + item.at[1];
  return [cx - (pw >> 1) - 2, cy - (ph >> 1) - 2, cx + (pw >> 1) + 1, cy + (ph >> 1) + 1];
}
