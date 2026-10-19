import { rt } from '@/engine/runtime';
import { now } from '@/engine/clock';
import { MiniPassport, Note, Citation, type Doc } from '@/game/docs';
import type { Issue } from '@/game/queue/types';
import { S } from '@/game/state';
import { decisionOf, flash, later, newEntrant, primaryOf, runSteps, say, stopTension, B } from './state';
import type { DocumentInstance, Entrant } from './types';
import { NEST, PRINT_X, DESK } from './layout';
import { H, W } from '@/render/canvas';
import { T } from '@/i18n/text';
import type { TextRef } from '@/i18n/text';
import { navigate } from '@/engine/navigation';
import type { EventItem, EntrantSpec } from '@/game/queue/types';

export function callNext(): void {
  const sfx = rt().sfx;
  sfx.play('click');
  if (B.ent || B.event || B.cut || B.closeup || B.ending || B.idx >= B.queue.length) return;
  const next = B.queue[B.idx];
  if (next && 'type' in next) {
    B.idx++;
    // Imported lazily through the module graph; events only runs when due.
    startEvent(next);
    return;
  }
  B.speakerT = now;
  sfx.play('intercom', 1, 0.03);
  say('C', T('booth.lineNext'));
  S.tut.called = true;
  const spec = B.queue[B.idx++] as EntrantSpec;
  const ent = newEntrant(spec, false);
  B.ent = ent;
  for (let i = 0; i < 4; i++) later(0.41 + i * 0.19, () => sfx.step(i));
  later(1.15, () => {
    if (B.ent !== ent) return;
    ent.phase = 'here';
    if (spec.tension) B.tensionSrc = sfx.play('tension', 0.9);
    const duration = runSteps(spec.intro);
    later(duration + (spec.intro.length ? 0 : 0.4), () => handDocs(ent));
  });
}

export function handDocs(ent: Entrant): void {
  if (B.ent !== ent) return;
  const sfx = rt().sfx;
  sfx.paper(S.day);
  if (ent.spec.docs.some((doc) => doc.key === 'pp')) later(0.1, () => sfx.play('thud', 0.5));
  ent.docs = ent.spec.docs.map(({ key, doc }, i) => {
    const instance: DocumentInstance = {
      doc,
      key,
      owner: 'ent',
      big: false,
      x: 48 + i * 24,
      y: 265,
      slot: [48 + i * 24, 265],
      marks: [],
    };
    B.docs.push(instance);
    return instance;
  });
  ent.handed = true;
  if (ent.spec.after) runSteps(ent.spec.after, 0.3);
}

export function checkLeave(): void {
  const ent = B.ent;
  if (!ent || ent.phase !== 'here') return;
  const primary = primaryOf(ent);
  if (!primary || !primary.returned) return;
  if (B.docs.some((doc) => doc.owner === 'ent' && doc.big && !doc.loose)) {
    if (!ent.complained) {
      ent.complained = true;
      say('E', T('booth.docsStillHere'));
    }
    return;
  }
  const decision = decisionOf(primary);
  ent.phase = 'waiting';
  later(Math.max(0, ent.busyUntil - now) + 0.2, () => leave(ent, decision));
}

export function leave(ent: Entrant, decision: ReturnType<typeof decisionOf>): void {
  if (B.ent !== ent) return;
  ent.phase = 'leave';
  ent.tLeave = now;
  ent.dir = decision === 'approve' ? 'right' : 'left';
  stopTension();
  const sfx = rt().sfx;
  for (let i = 0; i < 3; i++) later(i * 0.22, () => sfx.step(3 + i));
  later(0.15, () => {
    B.docs = B.docs.filter((doc) => doc.owner !== 'ent');
  });
  later(0.65, () => finish(ent, decision));
}

export function detain(): void {
  const ent = B.ent;
  const sfx = rt().sfx;
  sfx.play('click');
  if (!ent || ent.phase !== 'here' || !ent.handed || B.event) return;
  ent.phase = 'detained';
  ent.tDetain = now + 0.2;
  B.detainT = now;
  stopTension();
  sfx.play('detain');
  sfx.play('scuffle', 1, 0.2);
  later(1.2, () => {
    B.docs = B.docs.filter((doc) => doc.owner !== 'ent');
  });
  later(1.7, () => finish(ent, 'detain'));
}

export function finish(ent: Entrant, decision: ReturnType<typeof decisionOf>): void {
  if (B.ent !== ent) return;
  B.ent = null;
  B.lastFinish = now;
  if (!ent.noJudge) judge(ent, decision);
  const then = ent.spec.then;
  if (then === 'closeup') {
    B.closeup = { t0: now };
    rt().sfx.play('thud');
  }
  if (then === 'jorji5') afterJorji5(ent, decision);
  if (then === 'ending') afterAuthor(decision);
  if (B.idx >= B.queue.length && !B.cut && then !== 'ending') endDaySoon();
}

export function judge(ent: Entrant, decision: ReturnType<typeof decisionOf>): void {
  const spec = ent.spec;
  B.total++;
  if (decision) S.stats[decision] = (S.stats[decision] ?? 0) + 1;
  if (spec.author) return;
  if (spec.bribe && decision === 'approve' && S.flags.sawNote) {
    B.bribe += 20;
    S.flags.bribed = true;
    B.harmlessT = now;
    later(0.8, () => flash(T('booth.flash.bribe')));
  }
  if (decision && spec.ok.includes(decision)) {
    B.correct++;
    S.stats.correct++;
    B.pay += 5;
    if (decision === 'detain' && ent.exposed) B.bonus += 5;
    return;
  }
  S.stats.wrong++;
  const lines: (TextRef | string)[] =
    decision === 'approve'
      ? [T('booth.citation.approved'), spec.reason ?? '']
      : decision === 'detain'
        ? [T('booth.citation.detained'), T('booth.citation.allGood')]
        : [T('booth.citation.denied'), T('booth.citation.allGood')];
  if (decision === 'approve' && spec.hint) lines.push(spec.hint);
  cite(lines);
}

/** The first citation of a day is a warning; later ones cost 5 tokens. */
export function cite(lines: (TextRef | string)[], delay = 0.5): void {
  B.cites++;
  if (B.cites > 1) B.fines += 5;
  lines.push(B.cites > 1 ? T('booth.citation.fine') : T('booth.citation.firstWarn'));
  later(delay, () => printDoc(new Citation(lines), 1.1, 'cit'));
}

export function printDoc(doc: Doc, duration: number, key: string): void {
  if (B.printing) {
    B.printQueue.push([doc, duration, key]);
    return;
  }
  B.printing = { doc, t0: now, dur: duration, key };
  rt().sfx.printer(Math.round(duration * 10) / 10);
  later(duration, () => {
    B.printing = null;
    B.docs.push({ doc, key, owner: 'desk', big: true, x: PRINT_X, y: 131, marks: [] });
    if (key === 'cit') rt().sfx.play('citation');
    if (B.printQueue.length) {
      const [nextDoc, nextDuration, nextKey] = B.printQueue.shift()!;
      printDoc(nextDoc, nextDuration, nextKey);
    }
  });
}

export function endDaySoon(): void {
  if (B.ending) return;
  B.ending = true;
  const wait = B.printing ? 2 : 0;
  later(2.4 + wait, () => rt().sfx.play('bell'));
  later(4.2 + wait, () => goSummary());
}

function goSummary(): void {
  navigate('summary');
}

// ———————————————————— document machinery ————————————————————

export function onFirstPlace(doc: DocumentInstance): void {
  const ent = B.ent;
  if (!ent || doc.owner !== 'ent' || ent.placed.has(doc)) return;
  ent.placed.add(doc);
  const trigger = doc.nest !== undefined ? 'nest' : ent.spec.onPlace?.[doc.key];
  if (trigger === 'note') {
    const note = new Note();
    const [x, y] = clampDesk(doc.x + 30, doc.y + 70, note);
    later(0.3, () => {
      B.docs.push({ doc: note, key: 'note', owner: 'desk', big: true, x, y, marks: [] });
      rt().sfx.paper(11);
      S.flags.sawNote = true;
      flash(T('booth.flash.noteAppeared'));
    });
  } else if (trigger === 'nest') {
    const k = doc.nest === undefined ? 0 : doc.nest + 1;
    if (k >= NEST.length) return;
    const [w, h, cover, label] = [NEST[k].w, NEST[k].h, NEST[k].cover, NEST[k].label];
    const passport = new MiniPassport(w, h, cover, label);
    const [x, y] = clampDesk(doc.x + (doc.doc.w - w) / 2 + 14, doc.y + (doc.doc.h - h) / 2 + 18, passport);
    later(0.35, () => {
      if (B.ent !== ent) return;
      const instance: DocumentInstance = {
        doc: passport,
        key: `m${k + 1}`,
        owner: 'ent',
        loose: true,
        nest: k,
        big: true,
        x,
        y,
        marks: [],
      };
      B.docs.push(instance);
      ent.docs.push(instance);
      rt().sfx.paper(13 + k);
      if (k === 0) flash(T('booth.flash.nestFirst'));
      if (k === NEST.length - 1) flash(T('booth.flash.nestLast'));
    });
  } else if (trigger === 'accordion') {
    if ('unfoldT' in doc.doc) {
      (doc.doc as unknown as { unfoldT: number | null }).unfoldT = now;
    }
    for (let k = 0; k < 6; k++) later(k * 0.33, () => rt().sfx.paper(20 + k));
  }
}

export function clampDesk(x: number, y: number, doc: Doc): [number, number] {
  return [
    Math.round(Math.max(DESK[0] + 4, Math.min(W - doc.w - 4, x))),
    Math.round(Math.max(DESK[1] + 4, Math.min(H - doc.h - 4, y))),
  ];
}

// Event hooks are registered by the events module at boot (avoids a module cycle).
export let startEvent: (item: EventItem) => void = () => {};
export let afterJorji5: (ent: Entrant, decision: ReturnType<typeof decisionOf>) => void = () => {};
export let afterAuthor: (decision: ReturnType<typeof decisionOf>) => void = () => {};

export function registerEventHooks(hooks: {
  startEvent: (item: EventItem) => void;
  afterJorji5: (ent: Entrant, decision: ReturnType<typeof decisionOf>) => void;
  afterAuthor: (decision: ReturnType<typeof decisionOf>) => void;
}): void {
  startEvent = hooks.startEvent;
  afterJorji5 = hooks.afterJorji5;
  afterAuthor = hooks.afterAuthor;
}
