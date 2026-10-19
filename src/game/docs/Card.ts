import { resolveRef, T, type TextRef } from '@/i18n/text';
import { getCtx, rect } from '@/render/canvas';
import { K, rgb, C } from '@/render/palette';
import type { RGB } from '@/render/palette';
import { spr, txt, tw } from '@/render/text';
import { docShadow, type Doc, type DocRow, type FieldBox } from './core';

export interface CardOptions {
  title?: TextRef;
  sub?: TextRef | string;
  color?: RGB;
  colorD?: RGB;
  valueX?: number;
  seal?: boolean;
}

/** Device entry card / account card: a title plus label-value rows. */
export class Card implements Doc {
  readonly rows: DocRow[];
  readonly title: TextRef;
  readonly sub: TextRef | string;
  readonly color: string;
  readonly colorD: string;
  readonly valueX: number;
  readonly seal: boolean;
  readonly w = 152;
  readonly h: number;
  readonly icon: readonly ['card', RGB];
  readonly fields: Record<string, FieldBox> = {};

  constructor(
    rows: DocRow[],
    {
      title = T('doc.deviceTitle'),
      sub = T('doc.deviceSub'),
      color = C.PINK,
      colorD = C.PINK_D,
      valueX = 38,
      seal,
    }: CardOptions = {},
  ) {
    this.rows = rows;
    this.title = title;
    this.sub = sub;
    this.color = rgb(color);
    this.colorD = rgb(colorD);
    this.valueX = valueX;
    this.seal = seal === undefined ? rows.length >= 4 : seal;
    this.h = 20 + 14 * rows.length + (this.seal ? 14 : 6);
    this.icon = ['card', color];
    rows.forEach((row, i) => {
      this.fields[row.id] = [4, 18 + 14 * i, this.w - 5, 31 + 14 * i];
    });
  }

  draw(x: number, y: number): void {
    const { w, h } = this;
    docShadow(x, y, w, h);
    rect(x, y, x + w - 1, y + h - 1, this.colorD);
    rect(x + 1, y + 1, x + w - 2, y + h - 2, this.color);
    rect(x + 1, y + 1, x + w - 2, y + 14, this.colorD);
    txt(x + 6, y + 4, resolveRef(this.title), 10, K.TEXT);
    txt(x + w - 6, y + 6, resolveRef(this.sub), 8, K.TEXT_L, 'ra');
    if (this.seal) spr('seal', x + w - 40, y + h - 38);
    const g = getCtx();
    this.rows.forEach((row, i) => {
      const yy = y + 20 + i * 14;
      txt(x + 8, yy, resolveRef(row.label), 10, K.TEXT_L);
      const value = resolveRef(row.value);
      txt(x + this.valueX, yy, value, tw(value, 10) > w - this.valueX - 6 ? 8 : 10, K.TEXT);
      g.fillStyle = this.colorD;
      for (let sx = x + 6; sx < x + w - 6; sx += 2) g.fillRect(sx, yy + 11, 1, 1);
    });
  }
}

export function field(id: string, value: TextRef | string): DocRow {
  return { id, label: T(`doc.field.${id}`), value };
}

export function accountCard(pay: string | TextRef, bill: string | TextRef, phone: string | TextRef): Card {
  return new Card([field('pay', pay), field('bill', bill), field('phone', phone)], {
    title: T('doc.accountTitle'),
    sub: T('doc.accountSub'),
    color: C.SAGE,
    colorD: C.SAGE_D,
    seal: false,
  });
}

export function deviceCard(rows: Array<[string, TextRef | string]>): Card {
  return new Card(rows.map(([id, value]) => field(id, value)));
}
