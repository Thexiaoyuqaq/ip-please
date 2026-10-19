import { rt } from '@/engine/runtime';
import { Rulebook } from '@/game/docs';
import { S } from '@/game/state';
import { inBox } from '@/render/canvas';
import { B } from './state';
import type { DocumentInstance } from './types';

export function toggleRules(): void {
  rt().sfx.paper(5);
  if (B.ruleInst) {
    B.rulePos = [B.ruleInst.x, B.ruleInst.y];
    B.docs = B.docs.filter((doc) => doc !== B.ruleInst);
    B.ruleInst = null;
    return;
  }
  B.ruleInst = {
    doc: new Rulebook(S.day),
    key: 'rule',
    owner: 'desk',
    big: true,
    x: B.rulePos[0],
    y: B.rulePos[1],
    marks: [],
  };
  B.docs.push(B.ruleInst);
  B.ruleOpened = true;
  S.tut.rules = true;
}

export function ruleTabHit(doc: DocumentInstance, x: number, y: number): boolean {
  if (doc.key !== 'rule') return false;
  const book = doc.doc as Rulebook;
  if (book.npages < 2) return false;
  const tab = book.tab;
  return inBox(x, y, [doc.x + tab[0], doc.y + tab[1], doc.x + tab[2], doc.y + tab[3]]);
}
