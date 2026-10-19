import { rt } from '@/engine/runtime';
import { now } from '@/engine/clock';
import { S } from '@/game/state';
import { setCtx, tinyPerson } from '@/render/canvas';
import { K } from '@/render/palette';
import { rect, outline } from '@/render/canvas';
import { txt } from '@/render/text';
import { resolveRef, T } from '@/i18n/text';
import { B, later, say } from '@/game/booth/state';
import { cite, endDaySoon } from '@/game/booth/entrant';
import { setInspect } from '@/game/booth/inspect';
import { H, W } from '@/render/canvas';
import type { CloneItem, ClonesEvent } from '@/game/booth/types';

export const GATE_X = 356;

export function startClones(): void {
  const items: CloneItem[] = [];
  for (let i = 0; i < 10; i++) {
    items.push({
      ts: now + 1.6 + i * 0.6,
      x0: 226 + (i % 3) * 20,
      y: 104 + ((i * 7) % 18),
      v: 30 + (i % 4) * 5,
      state: 'wait',
      th: 0,
    });
  }
  B.event = {
    type: 'clones',
    t0: now,
    items,
    hits: 0,
    passed: 0,
    siren: rt().sfx.play('siren', 0.55),
    done: false,
  };
  B.xray.on = false;
  if (B.insp.on) setInspect(false);
  say('C', T('clones.alert'));
  S.tut.sniper = true;
}

export function clonePos(clone: CloneItem): [number, number] | null {
  if (now < clone.ts) return null;
  if (clone.state === 'hit') {
    const xh = clone.x0 + clone.v * (clone.th - clone.ts);
    if (now < clone.th + 0.7) return [xh, clone.y];
    const x = xh - clone.v * 0.9 * (now - clone.th - 0.7);
    return x > -10 ? [x, clone.y] : null;
  }
  return [clone.x0 + clone.v * (now - clone.ts), clone.y];
}

export function updateClones(): void {
  const event = B.event;
  if (!event || event.type !== 'clones') return;
  for (const clone of event.items) {
    if (clone.state === 'wait' && now >= clone.ts) clone.state = 'run';
    if (clone.state === 'run' && (clonePos(clone)?.[0] ?? 0) >= GATE_X) {
      clone.state = 'through';
      event.passed++;
      rt().sfx.play('discrepancy', 0.6);
    }
  }
  if (!event.done && event.items.every((clone) => clone.state === 'hit' || clone.state === 'through')) {
    event.done = true;
    later(1, () => {
      rt().sfx.stop(event.siren);
      B.event = null;
      B.lastFinish = now;
      say(
        'C',
        event.passed
          ? T('clones.resultCaught', { hits: event.hits, passed: event.passed })
          : T('clones.resultClean'),
      );
      B.bonus += event.hits;
      if (event.passed) cite([T('clones.citation', { passed: event.passed }), T('clones.citationRule')], 0.8);
      if (B.idx >= B.queue.length) endDaySoon();
    });
  }
}

export function shootAt(x: number, y: number): void {
  const event = B.event;
  if (!event || event.type !== 'clones') return;
  rt().sfx.play('gunshot', 0.5);
  B.shake = now;
  let best: CloneItem | null = null;
  let bestDistance = 16;
  for (const clone of event.items) {
    if (clone.state !== 'run') continue;
    const pos = clonePos(clone);
    if (!pos) continue;
    const distance = Math.hypot(pos[0] - x, pos[1] - 6 - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = clone;
    }
  }
  if (best) {
    best.state = 'hit';
    best.th = now;
    event.hits++;
  }
}

export function drawClones(event: ClonesEvent): void {
  for (const clone of event.items) {
    const pos = clonePos(clone);
    if (!pos || clone.state === 'wait') continue;
    const [x, y] = [Math.round(pos[0]), pos[1]];
    if (clone.state === 'through' && x > W + 10) continue;
    const step = clone.state !== 'hit' || now > clone.th + 0.7 ? Math.floor(now * 10) % 2 : 0;
    tinyPerson(
      x,
      y,
      clone.state === 'hit' && now < clone.th + 0.7 ? 'rgb(150,150,150)' : 'rgb(100,100,100)',
      K.OUTLINE,
      step,
    );
    if (clone.state === 'hit' && now < clone.th + 0.7) {
      const rise = Math.round(Math.min(1, (now - clone.th) / 0.7) * 6);
      rect(x - 10, y - 24 - rise, x + 10, y - 15 - rise, K.WHITE);
      txt(x, y - 23 - rise, '429', 8, K.RED, 'ma');
    }
  }
}

export function drawAlarm(g: CanvasRenderingContext2D): void {
  const event = B.event;
  if (!event || event.type !== 'clones') return;
  const elapsed = now - event.t0;
  g.fillStyle = `rgba(180,20,20,${0.1 + 0.08 * (Math.floor(elapsed * 3) % 2)})`;
  g.fillRect(0, 124, W, H - 124);
  setCtx(g);
  if (Math.floor(elapsed * 3) % 2 === 0 || elapsed > 2) {
    rect(150, 44, 490, 62, K.INK);
    outline(150, 44, 490, 62, K.RED_L);
    txt(320, 49, resolveRef(T('clones.banner')), 10, K.RED_L, 'ma');
  }
  txt(470, 72, resolveRef(T('clones.counter', { hits: event.hits, passed: event.passed })), 10, K.WHITE, 'ma');
}
