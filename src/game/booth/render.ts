import { ATLAS_IMG, BG_IMG, PEOPLE, SPRITES, WIN_IMG } from '@/assets';
import { now } from '@/engine/clock';
import { rt } from '@/engine/runtime';
import { DATES, WEEKDAY_KEYS } from '@/game/constants';
import { smallIcon } from '@/game/docs';
import { S } from '@/game/state';
import {
  center,
  edgePoint,
  getCtx,
  H,
  inBox,
  lerp,
  line,
  makeCanvas,
  outline,
  pattern,
  pt,
  rect,
  seg,
  easeOut,
  setCtx,
  spark,
  tinyPerson,
  W,
} from '@/render/canvas';
import { K, rgb } from '@/render/palette';
import { spr, txt, tw } from '@/render/text';
import { resolveRef, T } from '@/i18n/text';
import { B } from './state';
import { drawHint } from './hints';
import { lineBoxes } from './inspect';
import { entrantX, exprKey } from './position';
import { XRAY_ICONS } from './xray';
import {
  ASK_BTN,
  BANNER1_X,
  BANNER_BOX,
  BOOTH_POS,
  DESK,
  DETAIN_BTN,
  INSPECT_BTN,
  PRINT_X,
  QUEUE_FRONT,
  QUIZ_BTN,
  RULE_BTN,
  SPEAKER,
  TRAY_W,
  TRAY_Y0,
  TRAY_Y1,
  WIN,
  WIN_CX,
  WIN_H,
  WIN_W,
  XRAY_BTN,
} from './layout';
import { trayU, trayX } from './stamps';
import type { Entrant } from './types';
import { drawClones } from '@/game/events/render';

const silCache = new Map<string, HTMLCanvasElement>();

function silhouette(key: string): HTMLCanvasElement {
  const cached = silCache.get(key);
  if (cached) return cached;
  const s = SPRITES[key];
  const [canvas, g] = makeCanvas(s[2], s[3]);
  g.drawImage(ATLAS_IMG, s[0], s[1], s[2], s[3], 0, 0, s[2], s[3]);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = K.XRAY_FG;
  g.fillRect(0, 0, s[2], s[3]);
  silCache.set(key, canvas);
  return canvas;
}

function drawXray(ent: Entrant | null, ex: number | null): void {
  const g = getCtx();
  rect(0, 0, WIN_W - 1, WIN_H - 1, K.XRAY_BG);
  g.fillStyle = 'rgb(24,50,52)';
  for (let x = 0; x < WIN_W; x += 12) g.fillRect(x, 0, 1, WIN_H);
  for (let y = 0; y < WIN_H; y += 12) g.fillRect(0, y, WIN_W, 1);
  if (ex !== null && ent) {
    const key = exprKey(ent);
    const s = SPRITES[key];
    const fw = PEOPLE[ent.spec.person]?.fw ?? 180;
    g.drawImage(silhouette(key), ex - fw / 2 + s[4], s[5]);
    g.strokeStyle = K.XRAY_L;
    g.lineWidth = 1;
    const ellipse = (cx: number, cy: number, rx: number, ry: number) => {
      g.beginPath();
      g.ellipse(cx + 0.5, cy + 0.5, rx, ry, 0, 0, Math.PI * 2);
      g.stroke();
    };
    ellipse(ex, 46, 22, 26);
    ellipse(ex - 8, 48, 4, 4);
    ellipse(ex + 8, 48, 4, 4);
    rect(ex, 76, ex + 1, WIN_H, K.XRAY_L);
    for (let k = 0, y = 98; y < WIN_H; y += 9, k++) {
      const w = 30 - k * 2;
      g.beginPath();
      g.ellipse(ex + 0.5, y + 3, w, 7, 0, Math.PI * 1.11, Math.PI * 1.89);
      g.stroke();
    }
    for (const item of ent.spec.xray ?? []) {
      const lit = ent.found.has(item.key) || B.insp.sel.some((selected) => selected.key === item.key);
      const pat = XRAY_ICONS[item.icon];
      const pw = pat[0].length * 2;
      const ph = pat.length * 2;
      const ix = ex + item.at[0];
      const iy = item.at[1];
      pattern(pat, ix - (pw >> 1), iy - (ph >> 1), { X: lit ? K.RED_L : K.XRAY_L }, 2);
      if (lit) {
        const lw = tw(resolveRef(item.label), 8) + 6;
        const lx = Math.max(2, Math.min(WIN_W - lw - 2, ix - (lw >> 1)));
        rect(lx, iy - (ph >> 1) - 14, lx + lw, iy - (ph >> 1) - 4, K.INK);
        txt(lx + 3, iy - (ph >> 1) - 12, resolveRef(item.label), 8, K.RED_L);
      }
    }
  }
  const scan = Math.round(seg(now, B.xray.t, B.xray.t + 0.6) * WIN_H);
  if (scan < WIN_H) {
    rect(0, scan, WIN_W - 1, WIN_H - 1, K.XRAY_BG);
    rect(0, scan, WIN_W - 1, scan + 1, K.XRAY_L);
  }
  txt(4, 3, resolveRef(T('booth.xrayTitle')), 8, K.XRAY_L);
}

function drawWindow(): void {
  const g = getCtx();
  g.save();
  g.beginPath();
  g.rect(WIN[0], WIN[1], WIN_W, WIN_H);
  g.clip();
  g.translate(WIN[0], WIN[1]);
  const ent = B.ent;
  const ex = entrantX(ent);
  if (B.xray.on) {
    drawXray(ent, ex);
  } else {
    g.drawImage(WIN_IMG, 0, 0);
    if (ex !== null && ent) {
      const moving = !ent.instant && now < ent.tEnter + 0.8;
      const bob = moving && Math.floor(now * 10) % 2 ? 1 : 0;
      spr(exprKey(ent), ex - (PEOPLE[ent.spec.person]?.fw ?? 180) / 2, bob);
      if (ent.sweatT !== null) {
        const s = Math.min(6, Math.floor((now - ent.sweatT) / 0.35));
        const sx = ex + 22;
        const sy = 42 + s;
        pt(sx, sy, K.SWEAT);
        rect(sx - 1, sy + 1, sx + 1, sy + 3, K.SWEAT);
        pt(sx - 1, sy + 1, K.WHITE);
      }
      if (ent.phase === 'detained' && ent.tDetain !== undefined && now >= ent.tDetain) {
        const u = easeOut(seg(now, ent.tDetain, ent.tDetain + 0.35));
        for (const [person, side] of [
          ['GUARD', -1],
          ['GUARD2', 1],
        ] as const) {
          const gx = Math.round(lerp(WIN_CX + side * 230, ex + side * 70, u));
          spr(`${person}:angry`, gx - 90, 4);
        }
      }
    }
    for (const slam of B.slams) {
      if (now < slam.t || now > slam.t + 0.6) continue;
      const s = SPRITES[`stamp:${slam.kind}`];
      g.drawImage(ATLAS_IMG, s[0], s[1], s[2], s[3], WIN_CX - s[2] + 10, 40, s[2] * 2, s[3] * 2);
    }
    g.strokeStyle = 'rgba(255,255,255,0.1)';
    g.lineWidth = 3;
    for (const offset of [150, 160, 166]) {
      g.beginPath();
      g.moveTo(offset, 0);
      g.lineTo(offset - 40, WIN_H);
      g.stroke();
    }
  }
  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.fillRect(0, 0, WIN_W, 2);
  g.restore();
}

function along(path: readonly (readonly number[])[], distance: number): [number, number] {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (distance <= length) {
      const u = length ? distance / length : 1;
      return [Math.round(a[0] + (b[0] - a[0]) * u), Math.round(a[1] + (b[1] - a[1]) * u)];
    }
    distance -= length;
  }
  const last = path[path.length - 1];
  return [last[0], last[1]];
}

function drawExterior(): void {
  const ent = B.ent;
  if (
    ent &&
    !ent.instant &&
    now >= ent.tEnter &&
    !(ent.phase === 'detained' && ent.tDetain !== undefined && now >= ent.tDetain + 0.9)
  ) {
    const meta = PEOPLE[ent.spec.person];
    const [coat, top] = meta.walker;
    let pos: [number, number];
    let moving: boolean;
    if (ent.phase === 'leave' && ent.tLeave !== undefined) {
      const path =
        ent.dir === 'right'
          ? [BOOTH_POS, [352, 112], [720, 112]]
          : [BOOTH_POS, [296, 122], [-20, 122]];
      pos = along(path, (now - ent.tLeave) * 70);
      moving = true;
    } else {
      const u = seg(now, ent.tEnter, ent.tEnter + 0.8);
      pos = [
        Math.round(QUEUE_FRONT[0] + (BOOTH_POS[0] - QUEUE_FRONT[0]) * u),
        Math.round(QUEUE_FRONT[1] + (BOOTH_POS[1] - QUEUE_FRONT[1]) * u),
      ];
      moving = u > 0 && u < 1;
    }
    const step = moving ? Math.floor(now * 8) % 2 : 0;
    tinyPerson(pos[0], pos[1], rgb(coat), rgb(top), step);
    (meta.extra ?? []).forEach(([c, h], i) => {
      tinyPerson(pos[0] - 6 - i * 5, pos[1] - 3 + (i % 2) * 4, rgb(c), rgb(h), step);
    });
  }
  if (B.fightT >= 0 && now >= B.fightT && now < B.fightT + 3) drawFight();
  if (B.harmlessT >= 0 && now >= B.harmlessT && now < B.harmlessT + 1.8 && Math.floor((now - B.harmlessT) * 6) % 2 === 0) {
    const x = BANNER1_X + 5 + tw('HELPFUL · HONEST · ', 10);
    rect(x - 2, 14, x + tw('HARMLESS', 10) + 1, 27, 'rgb(200,60,50)');
    txt(x, 16, 'HARMLESS', 10, K.WHITE);
  }
}

function drawFight(): void {
  const g = getCtx();
  let seed = Math.floor(now * 10) * 9301 + 49297;
  const r = (a: number, b: number) => {
    seed = (seed * 9301 + 49297) % 233280;
    return a + Math.floor((seed / 233280) * (b - a + 1));
  };
  const greys = [
    [150, 144, 132],
    [172, 166, 152],
    [128, 122, 112],
  ];
  for (let i = 0; i < 9; i++) {
    const x = 250 + r(0, 34);
    const y = 88 + r(0, 18);
    const radius = r(5, 9);
    g.fillStyle = rgb(greys[r(0, 2)]);
    g.beginPath();
    g.arc(x, y, radius, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 3; i++) spark(246 + r(0, 44), 80 + r(0, 24), 'rgb(230,210,120)', false);
  const word = Math.floor(now * 2.5) % 2 ? '甜！' : '咸！';
  const bx = word === '甜！' ? 236 : 286;
  rect(bx, 64, bx + 24, 77, K.WHITE);
  outline(bx, 64, bx + 24, 77, K.INK);
  txt(bx + 12, 66, word, 10, K.INK, 'ma');
}

function button(box: readonly [number, number, number, number], glyph: string, label: string, active: boolean): void {
  const [x0, y0, x1, y1] = box;
  rect(x0 + 2, y0 + 2, x1 + 2, y1 + 2, K.DESK_D);
  rect(x0, y0, x1, y1, active ? K.RED_D : K.METAL_D);
  outline(x0, y0, x1, y1, K.METAL_L);
  txt((x0 + x1) >> 1, y0 + 6, glyph, 12, K.WHITE, 'ma');
  txt((x0 + x1) >> 1, y0 + 21, label, 8, active ? K.WHITE : K.GREY, 'ma');
}

function drawBoothLower(): void {
  const idle = !B.ent && !B.event && B.idx < B.queue.length && !B.ending;
  const on = now < B.speakerT + 0.5 || (idle && Math.floor(now * 2) % 2 === 0);
  const [x0, y0] = SPEAKER;
  rect(x0, y0, x0 + 18, y0 + 16, on ? K.CLAUDE : K.METAL_D);
  outline(x0, y0, x0 + 18, y0 + 16, K.METAL_L);
  for (let yy = y0 + 3; yy < y0 + 15; yy += 3) rect(x0 + 3, yy, x0 + 15, yy, K.INK);
  for (const { ln, size, box } of lineBoxes()) {
    const n = Math.max(1, Math.floor((now - ln.t) * 26));
    const [bx, y] = box;
    rect(...box, 'rgb(30,28,26)');
    outline(...box, 'rgb(76,70,64)');
    if (ln.who === 'C') rect(bx, y, bx + 1, y + 15, K.CLAUDE);
    txt(35, y + (size === 12 ? 2 : 3), resolveRef(ln.text), size, ln.who === 'C' ? K.CLAUDE_L : K.WHITE, 'la', n);
  }
  txt(
    8,
    347,
    resolveRef(T('dateLine', { date: DATES[S.day], weekday: T(WEEKDAY_KEYS[S.day]) })),
    10,
    K.GREY,
  );
  const minutes = 6 * 60 + Math.floor((now - B.clock0) / 1.1);
  txt(210, 346, `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, 12, K.LED, 'ra');
  if (S.day >= 2) {
    const ent = B.ent;
    const can = !!ent && ent.phase === 'here' && !!ent.handed && !B.event;
    const lit = now < (B.detainT ?? -9) + 0.6;
    rect(...DETAIN_BTN, lit ? K.RED : K.RED_D);
    outline(...DETAIN_BTN, K.OUTLINE);
    txt(center(DETAIN_BTN)[0], DETAIN_BTN[1] + 2, resolveRef(T('booth.buttons.detain')), 10, can ? K.WHITE : K.GREY, 'ma');
    const busy = !can || !ent?.suspect || now < ent.busyUntil;
    rect(...QUIZ_BTN, busy ? K.METAL_D : 'rgb(70,80,104)');
    outline(...QUIZ_BTN, K.OUTLINE);
    txt(center(QUIZ_BTN)[0], QUIZ_BTN[1] + 2, resolveRef(T('booth.buttons.quiz')), 10, busy ? K.GREY : K.WHITE, 'ma');
  }
  for (const doc of B.docs) {
    if (!doc.big) smallIcon(doc.doc.icon[0], doc.doc.icon[1], doc.x, doc.y);
  }
}

function drawDesk(): void {
  const g = getCtx();
  g.save();
  g.beginPath();
  g.rect(DESK[0], DESK[1], DESK[2] - DESK[0] + 1, DESK[3] - DESK[1] + 1);
  g.clip();
  for (const doc of B.docs) {
    if (!doc.big) continue;
    doc.doc.draw(doc.x, doc.y);
    if (doc.marks.length) {
      g.save();
      g.beginPath();
      g.rect(doc.x, doc.y, doc.doc.w, doc.doc.h);
      g.clip();
      for (const mark of doc.marks) spr(`stamp:${mark.kind}`, doc.x + mark.rx, doc.y + mark.ry);
      g.restore();
    }
  }
  if (B.printing) {
    const { doc, t0, dur } = B.printing;
    const length = Math.max(1, Math.round(doc.h * seg(now, t0, t0 + dur)));
    g.save();
    g.beginPath();
    g.rect(PRINT_X, 131, doc.w + 3, length);
    g.clip();
    doc.draw(PRINT_X, 131);
    g.restore();
  }
  g.restore();
  rect(PRINT_X - 4, 128, PRINT_X + 172, 130, K.INK);
}

function drawTray(): void {
  const tx = trayX();
  const u = trayU();
  const hx = tx - 13;
  rect(hx, 204, tx - 1, 244, K.METAL_D);
  outline(hx, 204, tx - 1, 244, K.METAL_L);
  txt(hx + 4, 209, B.tray.open ? '>' : '<', 10, K.WHITE);
  const seal = [...resolveRef(T('booth.tray.seal'))];
  seal.forEach((ch, i) => txt(hx + 3, 223 + i * (seal.length <= 2 ? 10 : 8), ch, 8, K.WHITE));
  if (u <= 0) return;
  const press: Record<string, number> = {};
  for (const p of B.presses) if (now >= p.t && now < p.t + 0.22) press[p.kind] = 5;
  rect(tx + 3, TRAY_Y0 + 3, tx + TRAY_W + 3, TRAY_Y1 + 3, K.DESK_D);
  rect(tx, TRAY_Y0, tx + TRAY_W, TRAY_Y1, K.METAL);
  rect(tx, TRAY_Y0, tx + TRAY_W, TRAY_Y0 + 2, K.METAL_L);
  rect(tx, TRAY_Y1 - 2, tx + TRAY_W, TRAY_Y1, K.METAL_D);
  rect(tx, TRAY_Y0, tx + 3, TRAY_Y1, K.METAL_D);
  for (const [label, kind, color, colorD] of [
    ['APPROVED', 'approve', K.GREEN, K.GREEN_D],
    ['DENIED', 'deny', K.RED, K.RED_D],
  ] as const) {
    const offset = press[kind] ?? 0;
    const bx = tx + (kind === 'approve' ? 10 : 90);
    const by = TRAY_Y0 + 8 + offset;
    rect(bx + 2, by + 2, bx + 66, by + 42 - offset, K.METAL_D);
    rect(bx, by, bx + 64, by + 40, colorD);
    rect(bx + 1, by + 1, bx + 63, by + 36, color);
    rect(bx + 22, by + 6, bx + 42, by + 18, colorD);
    rect(bx + 24, by + 6, bx + 40, by + 8, color);
    txt(bx + 32, by + 25, label, 8, K.WHITE, 'ma');
  }
}

function drawButtons(): void {
  button(RULE_BTN, '§', resolveRef(T('booth.buttons.rule')), !!B.ruleInst);
  if (S.day >= 4) button(XRAY_BTN, 'X', resolveRef(T('booth.buttons.xray')), B.xray.on);
  button(INSPECT_BTN, '?', resolveRef(T('booth.buttons.inspect')), B.insp.on);
}

export function composeInspect(g: CanvasRenderingContext2D): void {
  const frame = rt().frame;
  g.fillStyle = 'rgba(26,10,10,0.55)';
  g.fillRect(0, 0, W, H);
  const lighten = (bx: readonly number[]) => {
    if (bx[2] <= bx[0] || bx[3] <= bx[1]) return;
    g.drawImage(frame, bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1], bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1]);
    g.fillStyle = 'rgba(26,10,10,0.2)';
    g.fillRect(bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1]);
  };
  for (const doc of B.docs) {
    if (doc.big) {
      lighten([Math.max(DESK[0], doc.x), Math.max(DESK[1], doc.y), Math.min(W, doc.x + doc.doc.w), Math.min(H, doc.y + doc.doc.h)]);
    }
  }
  if (B.xray.on) lighten([WIN[0], WIN[1], WIN[2] + 1, WIN[3] + 1]);
  if (B.ent && B.ent.handed) lighten([28, 286, 220, 339]);
  const I = B.insp;
  let boxes: (readonly number[])[] = I.sel.map((selected) => selected.box());
  if (I.all && B.ent) {
    boxes = [];
    for (const doc of B.ent.docs) {
      if (doc.big) {
        for (const field of Object.values(doc.doc.fields)) {
          boxes.push([doc.x + field[0], doc.y + field[1], doc.x + field[2], doc.y + field[3]]);
        }
      }
    }
  }
  for (const b of boxes) g.drawImage(frame, b[0], b[1], b[2] - b[0] + 1, b[3] - b[1] + 1, b[0], b[1], b[2] - b[0] + 1, b[3] - b[1] + 1);
  setCtx(g);
  if (boxes.length >= 2 && I.banner && I.banner.bad) {
    for (let i = 0; i < boxes.length - 1; i++) {
      const p = edgePoint(boxes[i], center(boxes[i + 1]));
      const q = edgePoint(boxes[i + 1], center(boxes[i]));
      line(p[0], p[1], q[0], q[1], K.RED_L);
    }
  }
  for (const b of boxes) outline(b[0] - 2, b[1] - 2, b[2] + 2, b[3] + 2, K.RED_L, 2);
  drawButtons();
  const banner = I.banner;
  if (banner) {
    const [x0, y0] = BANNER_BOX;
    rect(...BANNER_BOX, K.INK);
    outline(...BANNER_BOX, banner.bad ? K.RED : K.GREY_D);
    txt(x0 + 8, y0 + 5, resolveRef(banner.title), 12, banner.bad ? K.RED_L : K.GREY);
    const sub = resolveRef(banner.sub);
    txt(x0 + 8, y0 + 21, sub, tw(sub, 10) > 236 && banner.ask ? 8 : 10, K.WHITE);
    if (banner.ask) {
      const hover = rt().ptr.mouse && inBox(rt().ptr.x, rt().ptr.y, ASK_BTN);
      rect(...ASK_BTN, hover ? K.RED : K.RED_D);
      outline(...ASK_BTN, K.RED_L);
      txt(center(ASK_BTN)[0], 145, resolveRef(T('booth.ask')), 12, K.WHITE, 'ma');
    }
  } else {
    const text = resolveRef(I.sel.length ? T('booth.inspect.pickSecond') : T('booth.inspect.idle'));
    rect(...BANNER_BOX, 'rgba(22,19,19,0.85)');
    outline(...BANNER_BOX, K.GREY_D);
    txt(BANNER_BOX[0] + 8, BANNER_BOX[1] + 12, text, 10, K.GREY);
  }
}

export function drawBooth(): void {
  getCtx().drawImage(BG_IMG, 0, 0);
  drawExterior();
  if (B.event && B.event.type === 'clones') drawClones(B.event);
  drawWindow();
  drawBoothLower();
  drawDesk();
  drawTray();
  drawButtons();
  drawHint();
}

