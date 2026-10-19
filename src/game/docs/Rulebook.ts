import { resolveList, resolveRef, T, type TextRef } from '@/i18n/text';
import { rect } from '@/render/canvas';
import { C, K } from '@/render/palette';
import type { RGB } from '@/render/palette';
import { type FontSize } from '@/assets';
import { txt, tw } from '@/render/text';
import { countryRef, type CountryCode } from '../world';
import { docShadow, type Doc, type FieldBox } from './core';

interface RuleDef {
  day: number;
  page: number;
  key: 'region' | 'tz' | 'quiz' | 'pay' | 'xray' | 'corp';
}

const RULES: RuleDef[] = [
  { day: 1, page: 0, key: 'region' },
  { day: 2, page: 0, key: 'tz' },
  { day: 2, page: 0, key: 'quiz' },
  { day: 3, page: 1, key: 'pay' },
  { day: 4, page: 1, key: 'xray' },
  { day: 5, page: 1, key: 'corp' },
];

/** Country / timezone / language table printed under §2. */
const RULE_TABLE: { cc: CountryCode; tz: string; lang: string }[] = [
  { cc: 'US', tz: 'America/*', lang: 'en-US' },
  { cc: 'UK', tz: 'Europe/London', lang: 'en-GB' },
  { cc: 'JP', tz: 'Asia/Tokyo', lang: 'ja-JP' },
  { cc: 'DE', tz: 'Europe/Berlin', lang: 'de-DE' },
  { cc: 'SG', tz: 'Asia/Singapore', lang: 'en-SG' },
];

type RuleRow =
  | { kind: 'head'; y: number; textKey: string; isNew: boolean; key: string }
  | { kind: 'sub'; y: number; textKey: string; index: number; key: string }
  | { kind: 'table'; y: number; cc: CountryCode; tz: string; lang: string; key: string }
  | { kind: 'looks'; y: number };

interface RulePage {
  rows: RuleRow[];
  fields: Record<string, FieldBox>;
  h: number;
}

/** The Claude Constitution: the day's entry rules, in one or two pages. */
export class Rulebook implements Doc {
  readonly w = 200;
  readonly h: number;
  readonly icon: readonly ['book', RGB] = ['book', C.BOOK];
  readonly npages: number;
  readonly pages: RulePage[];
  readonly tab: readonly [number, number, number, number];
  readonly day: number;
  page: number;

  constructor(day: number) {
    this.day = day;
    const rules = RULES.filter((rule) => rule.day <= day);
    this.npages = day >= 3 ? 2 : 1;
    this.pages = [];
    for (let p = 0; p < this.npages; p++) {
      const rows: RuleRow[] = [];
      for (const rule of rules.filter((r) => r.page === p)) {
        const isNew = rule.day === day;
        rows.push({ kind: 'head', y: 0, textKey: `doc.rulebook.${rule.key}.head`, isNew, key: rule.key });
        if (rule.key === 'tz') {
          for (const entry of RULE_TABLE) rows.push({ kind: 'table', y: 0, ...entry, key: rule.key });
        } else {
          resolveList(`doc.rulebook.${rule.key}.subs`).forEach((_, index) => {
            rows.push({ kind: 'sub', y: 0, textKey: `doc.rulebook.${rule.key}.subs`, index, key: rule.key });
          });
        }
      }
      if (p === this.npages - 1) rows.push({ kind: 'looks', y: 0 });

      let y = 22;
      const fields: Record<string, FieldBox> = {};
      for (const row of rows) {
        row.y = y;
        const size: FontSize = row.kind === 'head' ? 10 : 8;
        y += size === 10 ? 14 : 10;
        if (row.kind === 'looks') continue;
        const f = fields[row.key];
        fields[row.key] = f ? [f[0], f[1], f[2], y - 2] : [4, row.y - 2, this.w - 5, y - 2];
      }
      this.pages.push({ rows, fields, h: y + 6 });
    }
    this.h = Math.max(...this.pages.map((p) => p.h));
    this.page = this.npages - 1;
    this.tab = [this.w - 52, 3, this.w - 4, 16];
  }

  get fields(): Record<string, FieldBox> {
    return this.pages[this.page].fields;
  }

  flip(): void {
    this.page = (this.page + 1) % this.npages;
  }

  draw(x: number, y: number): void {
    const { w, h } = this;
    docShadow(x, y, w, h);
    rect(x, y, x + w - 1, y + h - 1, K.BOOK);
    rect(x + 3, y + 3, x + w - 4, y + h - 4, K.PAPER);
    rect(x + 3, y + 3, x + w - 4, y + 16, K.BOOK_L);
    txt(x + 8, y + 5, resolveRef(T('doc.ruleTitle')), 10, K.PAPER);
    if (this.npages > 1) {
      rect(x + this.tab[0], y + this.tab[1], x + this.tab[2], y + this.tab[3], K.BOOK);
      txt(x + this.tab[2] - 4, y + 7, resolveRef(T('doc.rulePage', { page: this.page + 1, pages: this.npages })), 8, K.PAPER, 'ra');
    } else {
      txt(x + w - 8, y + 7, `DAY ${this.day}`, 8, K.PAPER, 'ra');
    }
    for (const row of this.pages[this.page].rows) {
      if (row.kind === 'looks') {
        txt(x + 8, y + row.y, resolveRef(T('doc.rulebook.looks')), 8, K.TEXT_L);
      } else if (row.kind === 'table') {
        txt(x + 12, y + row.y, resolveRef(countryRef(row.cc)), 8, K.TEXT_L);
        txt(x + 52, y + row.y, row.tz, 8, K.TEXT_L);
        txt(x + 150, y + row.y, row.lang, 8, K.TEXT_L);
      } else {
        const color = row.kind === 'head' ? (row.isNew ? K.RED_D : K.TEXT) : K.TEXT_L;
        const size: FontSize = row.kind === 'head' ? 10 : 8;
        const text =
          row.kind === 'head'
            ? resolveRef(T(row.textKey))
            : (resolveList(row.textKey)[row.index] ?? '');
        txt(x + 8, y + row.y, text, size, color);
        if (row.kind === 'head' && row.isNew) {
          const nx = x + 10 + tw(text, size);
          rect(nx, y + row.y - 1, nx + 19, y + row.y + 8, K.RED);
          txt(nx + 2, y + row.y, 'NEW', 8, K.WHITE);
        }
      }
    }
  }
}
