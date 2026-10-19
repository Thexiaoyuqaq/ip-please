import { resolveList, resolveRef, T, type TextRef } from '@/i18n/text';
import { getCtx, rect } from '@/render/canvas';
import { K } from '@/render/palette';
import { txt, tw, wrap } from '@/render/text';
import { docShadow, type Doc, type FieldBox } from './core';

/** A note slipped into a passport by the Underground Transit Union. */
export class Note implements Doc {
  readonly icon: readonly ['card', readonly [number, number, number]] = ['card', [236, 228, 204]];
  readonly fields: Record<string, FieldBox> = {};
  private readonly linesKey: string;

  constructor(linesKey = 'doc.note') {
    this.linesKey = linesKey;
  }

  private lines(): string[] {
    return resolveList(this.linesKey);
  }

  get w(): number {
    return Math.max(...this.lines().map((s) => tw(s, 10))) + 16;
  }

  get h(): number {
    return 12 + 13 * this.lines().length;
  }

  draw(x: number, y: number): void {
    const g = getCtx();
    const w = this.w;
    const h = this.h;
    docShadow(x, y, w, h);
    rect(x, y, x + w - 1, y + h - 1, 'rgb(236,228,204)');
    g.fillStyle = K.DESK_D;
    g.beginPath();
    g.moveTo(x + w - 8, y);
    g.lineTo(x + w, y);
    g.lineTo(x + w, y + 8);
    g.fill();
    this.lines().forEach((s, i) => txt(x + 8, y + 7 + i * 13, s, 10, 'rgb(70,70,96)'));
  }
}

/** M.O.A. warning slip (the original game's citation). */
export class Citation implements Doc {
  readonly w = 168;
  readonly h: number;
  readonly icon: readonly ['card', readonly [number, number, number]] = ['card', [226, 184, 176]];
  readonly fields: Record<string, FieldBox> = {};
  private readonly lines: (TextRef | string)[];

  constructor(lines: (TextRef | string)[]) {
    this.lines = lines;
    this.h = 26 + 13 * lines.length + 6;
  }

  draw(x: number, y: number): void {
    docShadow(x, y, this.w, this.h);
    rect(x, y, x + this.w - 1, y + this.h - 1, 'rgb(226,184,176)');
    rect(x, y, x + this.w - 1, y + 16, K.RED_D);
    txt(x + 6, y + 4, resolveRef(T('doc.citationTitle')), 10, K.WHITE);
    txt(x + this.w - 6, y + 6, resolveRef(T('doc.citationTag')), 8, 'rgb(226,184,176)', 'ra');
    this.lines.forEach((line, i) => {
      const s = resolveRef(line);
      txt(x + 8, y + 22 + i * 13, s, tw(s, 10) > this.w - 14 ? 8 : 10, i === this.lines.length - 1 ? K.RED_D : K.TEXT);
    });
  }
}

/** Long perforated printout from the number-lookup printer. */
export class PrintStrip implements Doc {
  readonly w = 128;
  readonly h: number;
  readonly icon: readonly ['card', readonly [number, number, number]] = ['card', [232, 230, 222]];
  readonly fields: Record<string, FieldBox> = {};
  private readonly header: (TextRef | string)[];
  private readonly rows: string[];

  constructor(header: (TextRef | string)[], rows: string[]) {
    this.header = header;
    this.rows = rows;
    this.h = 10 + 13 * header.length + 6 + 10 * rows.length + 6;
  }

  draw(x: number, y: number): void {
    const { w, h } = this;
    const g = getCtx();
    docShadow(x, y, w, h);
    rect(x, y, x + w - 1, y + h - 1, 'rgb(232,230,222)');
    g.fillStyle = K.GREY;
    for (let yy = y + 3; yy < y + h; yy += 6) {
      g.fillRect(x + 2, yy, 1, 1);
      g.fillRect(x + w - 3, yy, 1, 1);
    }
    let yy = y + 6;
    for (const line of this.header) {
      txt(x + 8, yy, resolveRef(line), 10, K.INK);
      yy += 13;
    }
    rect(x + 6, yy, x + w - 7, yy, K.GREY);
    yy += 5;
    for (const s of this.rows) {
      txt(x + 8, yy, s, 8, K.TEXT);
      yy += 10;
    }
  }
}

/** The final traveler hands over a prompt instead of a passport. */
export class PromptPaper implements Doc {
  readonly w = 176;
  readonly h = 120;
  readonly icon: readonly ['card', readonly [number, number, number]] = ['card', [236, 234, 226]];
  private readonly text: TextRef;

  constructor(text: TextRef) {
    this.text = text;
  }

  get fields(): Record<string, FieldBox> {
    const lines = wrap(resolveRef(this.text), 10, 158);
    return {
      text: [6, 20, 170, 20 + 13 * lines.length],
      header: [3, 3, 172, 16],
    };
  }

  draw(x: number, y: number): void {
    docShadow(x, y, this.w, this.h);
    rect(x, y, x + this.w - 1, y + this.h - 1, 'rgb(236,234,226)');
    rect(x + 3, y + 3, x + this.w - 4, y + 16, 'rgb(120,116,110)');
    txt(x + 8, y + 6, resolveRef(T('doc.promptTitle')), 8, K.WHITE);
    wrap(resolveRef(this.text), 10, 158).forEach((s, i) => txt(x + 9, y + 22 + i * 13, s, 10, K.INK));
  }
}

/** The pile of address cards from the "same house number" effect. */
export function drawAddressCard(x: number, y: number): void {
  docShadow(x, y, 96, 34);
  rect(x, y, x + 95, y + 33, K.PAPER_D);
  rect(x + 1, y + 1, x + 94, y + 32, K.PAPER);
  txt(x + 6, y + 6, '123 MAIN ST', 10, K.TEXT);
  txt(x + 6, y + 20, 'PORTLAND, OR', 8, K.TEXT_L);
}
