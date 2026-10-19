import type { TextRef } from '@/i18n/text';
import { rect } from '@/render/canvas';
import { K } from '@/render/palette';
import type { RGB } from '@/render/palette';

export type FieldBox = readonly [number, number, number, number];

export interface DocRow {
  /** Stable field id used by the inspection system (never localized). */
  id: string;
  label: TextRef | string;
  /** Plain data (IP, date, name) or a reference to localized text. */
  value: TextRef | string;
}

export type DocIconKind = 'book' | 'card';

export interface Doc {
  w: number;
  h: number;
  icon: readonly [DocIconKind, RGB];
  /** Clickable field boxes, relative to the document's top-left corner. */
  fields: Record<string, FieldBox>;
  draw(x: number, y: number): void;
}

export function docShadow(x: number, y: number, w: number, h: number): void {
  rect(x + 2, y + 2, x + w + 1, y + h + 1, K.DESK_D);
}
