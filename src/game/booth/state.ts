import { PEOPLE } from '@/assets';
import { rt } from '@/engine/runtime';
import { now } from '@/engine/clock';
import { S } from '@/game/state';
import { buildQueue } from '@/game/queue/buildQueue';
import type { EntrantSpec, QueueItem, Speaker, Step } from '@/game/queue/types';
import { resolveRef, type TextRef } from '@/i18n/text';
import type { BoothState, DocumentInstance, Entrant } from './types';

/** Today's checkpoint state. Replaced wholesale at the start of every day. */
export let B: BoothState = createBoothState();

function createBoothState(): BoothState {
  return {
    queue: [],
    idx: 0,
    ent: null,
    docs: [],
    lines: [],
    timers: [],
    tray: { open: false, t: -9 },
    presses: [],
    shake: -9,
    insp: { on: false, sel: [], banner: null, all: false },
    xray: { on: false, t: -9 },
    printing: null,
    printQueue: [],
    effects: [],
    slams: [],
    ruleInst: null,
    rulePos: [228, 136],
    ruleOpened: false,
    speakerT: -9,
    fightT: -9,
    harmlessT: -9,
    pay: 0,
    bonus: 0,
    bribe: 0,
    fines: 0,
    cites: 0,
    correct: 0,
    total: 0,
    flash: null,
    clock0: now,
    ending: false,
    event: null,
    cut: null,
    closeup: null,
    lastFinish: now,
    tensionSrc: null,
    allTokens: false,
  };
}

export function startDay(): void {
  B = createBoothState();
  B.queue = buildQueue(S.day);
}

export function later(dt: number, fn: () => void): void {
  B.timers.push({ t: now + dt, fn });
}

export function runTimers(): void {
  const due = B.timers.filter((timer) => timer.t <= now);
  if (!due.length) return;
  B.timers = B.timers.filter((timer) => timer.t > now);
  due.sort((a, b) => a.t - b.t).forEach((timer) => timer.fn());
}

export function say(who: Speaker, text: TextRef | string): void {
  const ent = B.ent;
  B.lines.push({ t: now, who, text, ent });
  const pitch = who === 'C' ? 176 : who === 'Q' ? 160 : ent ? ent.spec.voice : 125;
  const resolved = resolveRef(text);
  rt().sfx.mumble(resolved, pitch, B.lines.length * 7 + S.day);
  if (who === 'E' && ent) {
    ent.talkUntil = now + Math.min(1.3, 0.25 + 0.065 * [...resolved].length);
  }
}

/** Play a sequence of lines/actions, returning its total duration in seconds. */
export function runSteps(steps: Step[], delay = 0): number {
  let t = delay;
  const ent = B.ent;
  for (const step of steps) {
    later(t, () => {
      if (B.ent !== ent) return;
      if (ent) {
        if (step.expr) ent.expr = step.expr;
        if (step.sweat && ent.sweatT === null) ent.sweatT = now;
        if (step.slip) {
          ent.slip = true;
          ent.expr = 'shock';
        }
      }
      if (step.fight) {
        B.fightT = now;
        rt().sfx.play('fight');
      }
      if (step.text) say(step.who, step.text);
    });
    const length = step.text ? [...resolveRef(step.text)].length : 0;
    t += step.hold !== undefined ? step.hold : Math.max(0.9, 0.4 + 0.085 * length);
  }
  if (ent) ent.busyUntil = Math.max(ent.busyUntil || 0, now + t);
  return t;
}

export function newEntrant(spec: EntrantSpec, instant: boolean): Entrant {
  return {
    spec,
    tEnter: instant ? now - 1 : now + 0.35,
    phase: instant ? 'here' : 'enter',
    expr: PEOPLE[spec.person]?.expr ?? 'neutral',
    talkUntil: 0,
    sweatT: null,
    slip: false,
    busyUntil: 0,
    decided: null,
    asked: new Set(),
    found: new Set(),
    quizDone: [],
    docs: [],
    placed: new Set(),
    instant,
    suspect: false,
  };
}

export const nextItem = (): QueueItem | undefined => B.queue[B.idx];

export const decisionOf = (inst: DocumentInstance | undefined) =>
  inst && inst.marks.length ? inst.marks[inst.marks.length - 1].kind : null;

export function primaryOf(ent: Entrant): DocumentInstance | undefined {
  return ent.docs.find((doc) => doc.key === ent.spec.primary);
}

export function flash(text: TextRef | string): void {
  B.flash = { text, t: now };
}

export function stopTension(): void {
  if (B.tensionSrc) {
    rt().sfx.stop(B.tensionSrc);
    B.tensionSrc = null;
  }
}
