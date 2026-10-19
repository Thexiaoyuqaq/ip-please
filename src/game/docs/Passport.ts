import { resolveRef, type TextRef } from '@/i18n/text';
import { now } from '@/engine/clock';
import { easeOut, H, seg, lerp, getCtx, rect, outline, spark } from '@/render/canvas';
import { K, rgb } from '@/render/palette';
import type { RGB } from '@/render/palette';
import { spr, txt, tw } from '@/render/text';
import { docShadow, type Doc, type DocRow, type FieldBox } from './core';

export interface PassportOptions {
  /** Country line printed on the cover (kept in the document's original language). */
  country: string;
  name: string;
  rows: DocRow[];
  person: string;
  cover?: RGB;
  band?: RGB;
  mrz?: string;
}

export class Passport implements Doc {
  readonly w = 176;
  readonly h = 116;
  readonly country: string;
  readonly name: string;
  readonly rows: DocRow[];
  readonly person: string;
  readonly cover: string;
  readonly band: string;
  readonly mrz: string;
  readonly icon: readonly ['book', RGB];
  readonly fields: Record<string, FieldBox>;

  constructor({ country, name, rows, person, cover = [42, 50, 76], band = [60, 70, 100], mrz = '' }: PassportOptions) {
    this.country = country;
    this.name = name;
    this.rows = rows;
    this.person = person;
    this.cover = rgb(cover);
    this.band = rgb(band);
    this.mrz = mrz;
    this.icon = ['book', cover];
    this.fields = {
      header: [3, 3, 172, 16],
      name: [56, 20, 172, 34],
      photo: [9, 22, 50, 73],
    };
    rows.forEach((row, i) => {
      this.fields[row.id] = [56, 40 + i * 12, 150, 51 + i * 12];
    });
  }

  draw(x: number, y: number): void {
    const { w, h } = this;
    docShadow(x, y, w, h);
    rect(x, y, x + w - 1, y + h - 1, this.cover);
    rect(x + 3, y + 3, x + w - 4, y + h - 4, K.PAPER);
    for (let yy = y + 22; yy < y + h - 22; yy += 4) rect(x + 56, yy, x + w - 8, yy, K.PAPER_LINE);
    rect(x + 3, y + 3, x + w - 4, y + 16, this.band);
    txt(x + w / 2, y + 6, this.country, 8, K.PAPER, 'ma');
    rect(x + 9, y + 22, x + 50, y + 73, K.PAPER_D);
    spr(`photo:${this.person}`, x + 10, y + 23);
    txt(x + 58, y + 22, this.name, tw(this.name, 12) > 112 ? 10 : 12, K.TEXT);
    this.rows.forEach((row, i) => {
      txt(x + 58, y + 42 + i * 12, resolveRef(row.label), 8, K.TEXT_L);
      const value = resolveRef(row.value);
      txt(x + 80, y + 41 + i * 12, value, tw(value, 10) > 90 ? 8 : 10, K.TEXT);
    });
    spr('emblem', x + 18, y + 78);
    if (this.mrz) txt(x + 8, y + h - 15, this.mrz, 8, K.TEXT_L);
  }
}

/** Names printed on the transit hub's accordion passport. */
export const HOLDER_NAMES = [
  'KEVIN',
  '小王',
  'TONY',
  '阿强',
  'LUCY',
  '老张',
  'MOMO',
  '大刘',
  'JACK',
  '小美',
  'ERIC',
  '阿杰',
  'AMY',
  '胖虎',
  'LEO',
  '小林',
  'MIA',
  '二狗',
  'SAM',
  '阿珍',
  'BEN',
  '老李',
  'IVY',
  '小赵',
];

/** Transit hub: one passport listing 1,000 holders, unfolding like an accordion. */
export class AccordionPassport extends Passport {
  unfoldT: number | null = null;
  private readonly rowsList: string[];

  constructor(options: PassportOptions) {
    super(options);
    this.rowsList = Array.from(
      { length: 80 },
      (_, i) => `#${String(i + 1).padStart(4, '0')}  ${HOLDER_NAMES[(i * 7) % HOLDER_NAMES.length]}`,
    );
  }

  override draw(x: number, y: number): void {
    if (this.unfoldT !== null) {
      // Open upward when there is not enough room below.
      const up = H - (y + this.h) < 100;
      const sx = x + 12;
      const w = 152;
      const length = Math.round(lerp(0, up ? 150 : 210, easeOut(seg(now, this.unfoldT, this.unfoldT + 2))));
      const sy = up ? y + 6 - length : y + this.h - 6;
      const scroll = Math.max(0, now - this.unfoldT - 2) * 30;
      rect(sx + 2, sy + 2, sx + w + 1, sy + length + 1, K.DESK_D);
      rect(sx, sy, sx + w - 1, sy + length, K.PAPER);
      for (let fy = sy + 22; fy < sy + length; fy += 22) rect(sx, fy, sx + w - 1, fy, K.PAPER_D);
      const g = getCtx();
      g.save();
      g.beginPath();
      g.rect(sx, sy + 2, w, Math.max(0, length - 4));
      g.clip();
      this.rowsList.forEach((s, i) => txt(sx + 8, sy + 6 + i * 11 - (Math.floor(scroll) % 600), s, 8, K.TEXT));
      g.restore();
    }
    super.draw(x, y);
  }
}

/** Jorji's crayon "American passport" (pre-rendered as a single sprite). */
export class CrayonPassport implements Doc {
  readonly w = 176;
  readonly h = 116;
  readonly icon: readonly ['book', RGB] = ['book', [70, 90, 170]];
  readonly fields: Record<string, FieldBox> = {
    header: [3, 3, 172, 18],
    photo: [9, 22, 50, 73],
    eagle: [120, 70, 160, 104],
  };

  draw(x: number, y: number): void {
    docShadow(x, y, this.w, this.h);
    spr('crayon', x, y);
  }
}

/** Closed passport cover used by the nesting-doll scene. */
export class MiniPassport implements Doc {
  readonly w: number;
  readonly h: number;
  readonly cover: RGB;
  readonly label: TextRef | string;
  readonly icon: readonly ['book', RGB];
  readonly fields: Record<string, FieldBox>;

  constructor(w: number, h: number, cover: RGB, label: TextRef | string) {
    this.w = w;
    this.h = h;
    this.cover = cover;
    this.label = label;
    this.icon = ['book', cover];
    this.fields = { all: [0, 0, w - 1, h - 1] };
  }

  draw(x: number, y: number): void {
    const { w, h } = this;
    docShadow(x, y, w, h);
    rect(x, y, x + w - 1, y + h - 1, rgb(this.cover));
    if (w > 50) {
      outline(x + 3, y + 3, x + w - 4, y + h - 4, K.GOLD);
      spark(x + (w >> 1), y + (h >> 1) - 8, K.GOLD, false);
      const label = resolveRef(this.label);
      const size = tw(label, 10) < w - 12 ? 10 : 8;
      txt(x + w / 2, y + h - 18, label, size, K.GOLD, 'ma');
    } else {
      txt(x + w / 2, y + h / 2 - 4, resolveRef(this.label), 8, K.GOLD, 'ma');
    }
  }
}
