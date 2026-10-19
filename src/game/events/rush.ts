import { rt } from '@/engine/runtime';
import { now } from '@/engine/clock';
import { takePoolPerson } from '@/game/queue/random';
import { RUSH } from '@/game/queue/rush';
import { inBox } from '@/render/canvas';
import { K } from '@/render/palette';
import { rect, outline } from '@/render/canvas';
import { txt } from '@/render/text';
import { resolveRef, T } from '@/i18n/text';
import { B, later, newEntrant, say } from '@/game/booth/state';
import { cite } from '@/game/booth/entrant';
import { endDaySoon } from '@/game/booth/entrant';
import type { Decision } from '@/game/state';

export const RUSH_APPROVE = [250, 214, 400, 274] as const;
export const RUSH_DENY = [440, 214, 590, 274] as const;
export const RUSH_TIME = 2.6;

export function startRush(): void {
  rt().sfx.play('intercom');
  say('C', T('rush.start'));
  B.event = {
    type: 'rush',
    list: RUSH.map((entry) => ({ ...entry, person: entry.person === 'pool' ? takePoolPerson() : entry.person })),
    i: -1,
    t0: now,
    tFace: 0,
    hits: 0,
    wrong: 0,
    missed: 0,
    lock: true,
  };
  later(2.6, rushNext);
}

export function rushNext(): void {
  const event = B.event;
  if (!event || event.type !== 'rush') return;
  event.i++;
  B.ent = null;
  if (event.i >= event.list.length) {
    rushEnd();
    return;
  }
  const entry = event.list[event.i];
  const ent = newEntrant(
    {
      person: entry.person, voice: 130 + event.i * 15, docs: [], intro: [], primary: '', ok: [],
      issues: []
    },
    true,
  );
  B.ent = ent;
  event.tFace = now;
  event.lock = false;
  rt().sfx.step(event.i);
  say('E', T(`rush.lines.${entry.line}`));
  const index = event.i;
  later(RUSH_TIME, () => {
    if (B.event !== event || event.i !== index || event.lock) return;
    event.lock = true;
    event.missed++;
    ent.expr = 'sad';
    later(0.3, rushNext);
  });
}

export function rushPick(kind: Decision): void {
  const event = B.event;
  if (!event || event.type !== 'rush' || event.lock || !B.ent) return;
  event.lock = true;
  const entry = event.list[event.i];
  B.slams.push({ t: now, kind });
  rt().sfx.play(`stamp_${kind}`);
  B.shake = now;
  if (kind === entry.ok) {
    event.hits++;
    B.pay += 2;
  } else {
    event.wrong++;
  }
  B.ent.expr = kind === 'deny' ? 'shock' : 'smile';
  later(0.5, rushNext);
}

export function rushEnd(): void {
  const event = B.event;
  if (!event || event.type !== 'rush') return;
  B.event = null;
  B.lastFinish = now;
  B.total += event.list.length;
  say('C', T('rush.result', { hits: event.hits, wrong: event.wrong, missed: event.missed }));
  if (event.wrong) cite([T('rush.citationWrong', { wrong: event.wrong }), T('rush.citationRule')], 0.8);
  if (B.idx >= B.queue.length) endDaySoon();
}

export function drawRush(): void {
  const event = B.event;
  if (!event || event.type !== 'rush') return;
  const u = event.i < 0 ? 0 : Math.max(0, Math.min(1, 1 - (now - event.tFace) / RUSH_TIME));
  rect(240, 168, 600, 290, 'rgba(22,19,19,0.88)');
  outline(240, 168, 600, 290, K.CLAUDE);
  txt(420, 174, resolveRef(T('rush.header')), 10, K.CLAUDE_L, 'ma');
  txt(420, 190, event.i < 0 ? resolveRef(T('rush.ready')) : resolveRef(T('rush.counter', { n: event.i + 1, total: event.list.length })), 10, K.GREY, 'ma');
  rect(250, 204, 590, 207, K.METAL_D);
  if (event.i >= 0 && !event.lock) rect(250, 204, 250 + Math.round(340 * u), 207, u < 0.35 ? K.RED_L : K.CLAUDE_L);
  for (const [box, label, sub, color, colorD] of [
    [RUSH_APPROVE, 'APPROVED', T('rush.approve'), K.GREEN, K.GREEN_D],
    [RUSH_DENY, 'DENIED', T('rush.deny'), K.RED, K.RED_D],
  ] as const) {
    const hover = rt().ptr.mouse && inBox(rt().ptr.x, rt().ptr.y, box);
    rect(box[0] + 3, box[1] + 3, box[2] + 3, box[3] + 3, K.DESK_D);
    rect(box[0], box[1], box[2], box[3], colorD);
    rect(box[0] + 2, box[1] + 2, box[2] - 2, box[3] - 6, hover ? colorD : color);
    txt((box[0] + box[2]) >> 1, box[1] + 14, label, 12, K.WHITE, 'ma');
    txt((box[0] + box[2]) >> 1, box[1] + 32, resolveRef(sub), 12, K.WHITE, 'ma');
  }
}
