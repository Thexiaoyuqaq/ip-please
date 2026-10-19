import { day1Fixed } from './days/day1';
import { day2Fixed } from './days/day2';
import { day3Fixed } from './days/day3';
import { day4Fixed } from './days/day4';
import { day5Fixed } from './days/day5';
import { day6Fixed } from './days/day6';
import { randomEntrant, resetPool, type FlawKind } from './random';
import type { EntrantSpec, QueueItem } from './types';

const FLAWS: Record<number, FlawKind[]> = {
  2: ['tz', 'lang', 'cnip', 'hidden'],
  3: ['tz', 'lang', 'cnip', 'hidden', 'virtual', 'oregon', 'sms'],
  4: ['tz', 'lang', 'cnip', 'hidden', 'virtual', 'oregon', 'sms', 'cat', 'keys'],
  5: ['tz', 'lang', 'cnip', 'hidden', 'virtual', 'oregon', 'sms', 'cat', 'keys'],
  6: ['tz', 'lang', 'cnip', 'hidden', 'virtual', 'oregon', 'sms', 'cat', 'keys'],
};

function flawsFor(day: number, count: number): EntrantSpec[] {
  const pool = [...FLAWS[day]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((kind) => randomEntrant(day, kind));
}

/** Build the day's queue. Portrait pools reset every day. */
export function buildQueue(day: number): QueueItem[] {
  resetPool();
  const R = (kind: FlawKind) => randomEntrant(day, kind);

  if (day === 1) {
    const fixed = day1Fixed();
    return [fixed.grandpa, R('valid'), fixed.hk, R(Math.random() < 0.5 ? 'valid' : 'cn'), fixed.jorji, R('valid')];
  }
  if (day === 2) {
    const fixed = day2Fixed();
    const flaws = flawsFor(2, 2);
    return [fixed.john, R('valid'), fixed.brown, flaws[0], fixed.emily, fixed.jorji, R('valid'), flaws[1]];
  }
  if (day === 3) {
    const fixed = day3Fixed();
    const flaws = flawsFor(3, 2);
    return [fixed.tom, R('valid'), fixed.alex, flaws[0], fixed.carpool, fixed.jorji, R('valid'), flaws[1]];
  }
  if (day === 4) {
    const fixed = day4Fixed();
    const flaws = flawsFor(4, 2);
    return [
      fixed.cat,
      R('valid'),
      fixed.v50,
      { type: 'rush' },
      flaws[0],
      fixed.jorji,
      fixed.hood,
      R('valid'),
      flaws[1],
    ];
  }
  if (day === 5) {
    const fixed = day5Fixed();
    const flaws = flawsFor(5, 1);
    return [fixed.sg, fixed.relay, { type: 'clones' }, fixed.mike, flaws[0], fixed.grandma, R('valid')];
  }
  const fixed = day6Fixed();
  const randomFlaw = FLAWS[6][Math.floor(Math.random() * FLAWS[6].length)];
  return [fixed.jorji, R('valid'), R(randomFlaw), R('hidden'), fixed.author];
}
