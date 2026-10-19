import { PEOPLE, SPRITES } from '@/assets';
import { now } from '@/engine/clock';
import { easeOut, lerp, seg, W } from '@/render/canvas';
import { WIN_CX } from './layout';
import type { Entrant } from './types';

/** Horizontal position of the traveler in the window, or null when absent. */
export function entrantX(ent: Entrant | null): number | null {
  if (!ent || now < ent.tEnter) return null;
  let x = WIN_CX;
  if (!ent.instant && now < ent.tEnter + 0.8) {
    x = Math.floor(Math.round(lerp(-130, WIN_CX, easeOut(seg(now, ent.tEnter, ent.tEnter + 0.8)))) / 2) * 2;
  }
  if (ent.phase === 'detained' && ent.tDetain !== undefined && now >= ent.tDetain + 0.8) {
    const u = seg(now, ent.tDetain + 0.8, ent.tDetain + 1.5);
    return u >= 1 ? null : Math.round(lerp(WIN_CX, -160, u * u));
  }
  if (ent.phase === 'leave' && ent.tLeave !== undefined) {
    const u = seg(now, ent.tLeave, ent.tLeave + 0.65);
    if (u >= 1) return null;
    return Math.floor(Math.round(lerp(WIN_CX, ent.dir === 'left' ? -160 : 360, u * u)) / 2) * 2;
  }
  return x;
}

/** Resolve the sprite key for the entrant's current expression. */
export function exprKey(ent: Entrant): string {
  const person = ent.spec.person;
  let expr = ent.expr;
  if (expr !== 'shock' && now < ent.talkUntil && Math.floor(now * 8) % 2 === 0) expr = 'talk';
  if (ent.slip && SPRITES[`${person}:${expr}:slip`]) return `${person}:${expr}:slip`;
  if (SPRITES[`${person}:${expr}`]) return `${person}:${expr}`;
  return `${person}:${PEOPLE[person]?.expr ?? 'neutral'}`;
}
