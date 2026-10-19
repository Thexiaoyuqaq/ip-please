import { H, W } from '@/render/canvas';
import type { RGB } from '@/render/palette';
import type { TextRef } from '@/i18n/text';
import { T } from '@/i18n/text';

// ———————————————————— Booth layout ————————————————————

export const WIN = [8, 134, 210, 262] as const;
export const WIN_W = 203;
export const WIN_H = 129;
export const WIN_CX = 101;
export const SPEAKER = [6, 290, 24, 306] as const;
export const DETAIN_BTN = [172, 268, 212, 280] as const;
export const QUIZ_BTN = [126, 268, 166, 280] as const;
export const INSPECT_BTN = [602, 322, 634, 354] as const;
export const XRAY_BTN = [566, 322, 598, 354] as const;
export const RULE_BTN = [530, 322, 562, 354] as const;
export const ASK_BTN = [548, 140, 590, 162] as const;
export const BANNER_BOX = [300, 134, 598, 168] as const;
export const TRAY_Y0 = 196;
export const TRAY_Y1 = 252;
export const TRAY_W = 170;
export const TRAY_X = W - TRAY_W;
export const MARK_XY = { approve: [483, 220], deny: [562, 220] } as const;
export const BOOTH_POS = [312, 117] as const;
export const QUEUE_FRONT = [292, 102] as const;
export const PRINT_X = 240;
export const BOOK_BOX = [500, 306, 556, 359] as const;
export const DESK = [220, 128, W - 1, H - 1] as const;
export const BANNER1_X = 70;

export interface NestEntry {
  w: number;
  h: number;
  cover: RGB;
  label: TextRef;
}

/** Passports nested inside the Singapore enterprise passport, outermost first. */
export const NEST: NestEntry[] = [
  { w: 124, h: 84, cover: [24, 86, 96], label: T('data.documents.cayman') },
  { w: 98, h: 66, cover: [40, 96, 70], label: T('data.documents.bvi') },
  { w: 74, h: 50, cover: [110, 40, 52], label: T('data.documents.hongKong') },
  { w: 40, h: 28, cover: [150, 30, 30], label: T('data.documents.china') },
];
