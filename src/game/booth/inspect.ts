import { rt } from '@/engine/runtime';
import { now } from '@/engine/clock';
import { PrintStrip } from '@/game/docs';
import { S } from '@/game/state';
import { inBox } from '@/render/canvas';
import { tw, type FontSize } from '@/render/text';
import { T, resolveRef, type TextRef } from '@/i18n/text';
import { HOLDER_NAMES } from '@/game/docs/Passport';
import { Rulebook } from '@/game/docs';
import { B, later, runSteps } from './state';
import { printDoc } from './entrant';
import { ruleTabHit } from './rules';
import { entrantX } from './position';
import { xrayItemBox } from './xray';
import { ASK_BTN, DESK, WIN } from './layout';
import type { DialogueLine, DocumentInstance, FieldHit } from './types';
import type { Issue } from '@/game/queue/types';

export const docBox = (doc: DocumentInstance): [number, number, number, number] => [
  doc.x,
  doc.y,
  doc.x + doc.doc.w - 1,
  doc.y + doc.doc.h - 1,
];

export interface LineBox {
  ln: DialogueLine;
  size: FontSize;
  box: [number, number, number, number];
}

/** Positions of the last three dialogue lines (shared by drawing and hit testing). */
export function lineBoxes(): LineBox[] {
  return B.lines.slice(-3).map((ln, i) => {
    const text = resolveRef(ln.text);
    const size: FontSize = tw(text, 12) > 176 ? 10 : 12;
    const y = 288 + i * 17;
    return { ln, size, box: [30, y, 30 + tw(text, size) + 8, y + 15] };
  });
}

export function fieldAt(x: number, y: number): FieldHit | null {
  const ent = B.ent;
  if (ent && ent.handed) {
    for (const { ln, box } of lineBoxes()) {
      if (ln.who === 'E' && ln.ent === ent && inBox(x, y, box)) {
        return { key: 'say', ln, box: () => box };
      }
    }
  }
  if (B.xray.on && ent && ent.spec.xray && entrantX(ent) !== null) {
    for (const item of ent.spec.xray) {
      const b = xrayItemBox(ent, item);
      if (inBox(x, y, [b[0] - 3, b[1] - 3, b[2] + 3, b[3] + 3])) {
        return { key: item.key, box: () => xrayItemBox(ent, item), xr: item };
      }
    }
  }
  for (const d of [...B.docs].reverse()) {
    if (!d.big || !inBox(x, y, docBox(d)) || !inBox(x, y, DESK)) continue;
    let best: FieldHit | null = null;
    for (const [name, f] of Object.entries(d.doc.fields)) {
      const b: [number, number, number, number] = [d.x + f[0] - 1, d.y + f[1] - 1, d.x + f[2] + 1, d.y + f[3] + 1];
      if (inBox(x, y, b)) {
        best = {
          key: `${d.key}.${name}`,
          d,
          box: () => [d.x + f[0], d.y + f[1], d.x + f[2], d.y + f[3]],
        };
      }
    }
    return best ?? { key: null, d, box: () => docBox(d) };
  }
  return null;
}

export function setInspect(on: boolean): void {
  B.insp = { on, sel: [], banner: null, all: false };
  rt().sfx.play(on ? 'inspect_on' : 'inspect_off');
  if (on) S.tut.inspect = true;
}

export function matchIssue(keys: string[]): Issue | null {
  const ent = B.ent;
  if (!ent || !ent.handed) return null;
  for (const issue of ent.spec.issues) {
    if (issue.all) {
      const mine = (key: string) => /^(pr|dv)\./.test(key);
      if (keys.length === 2 && keys.every(mine)) return issue;
      continue;
    }
    for (const pair of issue.pairs ?? []) {
      if (pair.length !== keys.length) continue;
      const matched =
        pair.length === 1
          ? pair[0] === keys[0]
          : (pair[0] === keys[0] && pair[1] === keys[1]) || (pair[0] === keys[1] && pair[1] === keys[0]);
      if (matched) return issue;
    }
  }
  return null;
}

export function showIssue(issue: Issue): void {
  const ent = B.ent;
  if (!ent) return;
  const sfx = rt().sfx;
  const I = B.insp;
  I.banner = {
    title: issue.title,
    sub: issue.sub,
    issue,
    ask: !!issue.ask && !ent.asked.has(issue) && ent.phase === 'here',
    bad: true,
  };
  ent.suspect = true;
  if (issue.all) I.all = true;
  sfx.play('discrepancy', 1, 0.03);
  for (const selected of I.sel) {
    if (selected.xr && selected.key) ent.found.add(selected.key);
  }
  if (/ac\.|rule\.pay/.test(JSON.stringify(issue.pairs ?? []))) S.tut.account = true;
  if (issue.fx && !ent.found.has(issue)) {
    if (issue.fx === 'pile') {
      B.effects.push({ type: 'pile', t0: now, ent });
      for (let i = 0; i < 37; i += 2) later(i * 0.043, () => rt().sfx.paper(i));
    }
    if (issue.fx === 'strip') {
      const rows = Array.from(
        { length: 39 },
        (_, i) =>
          `#${String(i + 1).padStart(4, '0')}  ${HOLDER_NAMES[(i * 5) % HOLDER_NAMES.length].padEnd(6)} 06:${String(
            (i * 7) % 60,
          ).padStart(2, '0')}`,
      );
      printDoc(
        new PrintStrip([T('doc.printTitle'), issue.phone ?? '', T('doc.printRegs')], rows),
        1.8,
        'strip',
      );
    }
  }
  ent.found.add(issue);
}

function sameText(a: TextRef | string | undefined, b: TextRef | string): boolean {
  if (a === undefined) return false;
  if (typeof a === 'string' || typeof b === 'string') return a === b;
  return a.key === b.key && (a.index ?? -1) === (b.index ?? -1);
}

export function inspectClick(x: number, y: number): void {
  const sfx = rt().sfx;
  const I = B.insp;
  if (I.banner?.ask && inBox(x, y, ASK_BTN)) {
    const issue = I.banner.issue!;
    if (!B.ent || B.ent.phase !== 'here') {
      setInspect(false);
      return;
    }
    B.ent.asked.add(issue);
    setInspect(false);
    runSteps(issue.ask ?? [], 0.15);
    return;
  }
  const hit = fieldAt(x, y);
  if (hit?.d && ruleTabHit(hit.d, x, y)) {
    if (hit.d.doc instanceof Rulebook) hit.d.doc.flip();
    sfx.paper(2);
    I.sel = I.sel.filter((selected) => selected.d !== hit.d);
    return;
  }
  if (I.banner) {
    I.banner = null;
    I.sel = [];
    I.all = false;
  }
  if (!hit || !hit.key) return;
  if (hit.key === 'say') {
    I.sel = [hit];
    sfx.play('select');
    const tell = B.ent?.spec.tell;
    if (tell && hit.ln && sameText(hit.ln.text, tell.say)) {
      S.tut.tell = true;
      showIssue(tell);
    } else {
      I.banner = { title: T('issue.sayFine.title'), sub: T('issue.sayFine.sub'), bad: false };
    }
    return;
  }
  if (I.sel.some((selected) => selected.key === 'say')) I.sel = [];
  const index = I.sel.findIndex((selected) => selected.key === hit.key);
  if (index >= 0) {
    I.sel.splice(index, 1);
    return;
  }
  I.sel.push(hit);
  sfx.play('select');
  const single = I.sel.length === 1 ? matchIssue([hit.key]) : null;
  if (single) {
    showIssue(single);
    return;
  }
  if (I.sel.length < 2) return;
  const issue = matchIssue(I.sel.flatMap((selected) => (selected.key ? [selected.key] : [])));
  if (issue) showIssue(issue);
  else I.banner = { title: T('issue.noMatch.title'), sub: T('issue.noMatch.sub'), bad: false };
}
