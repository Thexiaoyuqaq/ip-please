import { rt } from '@/engine/runtime';
import { now } from '@/engine/clock';
import { pick } from '@/game/world';
import { resolveList, T } from '@/i18n/text';
import { flash, runSteps, B } from './state';
import { S } from '@/game/state';
import type { Step } from '@/game/queue/types';

export const QUIZ_THURSDAY = 7;
export const QUIZ_COUNT = 8;

/** Lie-detector quiz: a native Chinese speaker answers reflexively. */
export function quiz(): void {
  rt().sfx.play('click');
  const ent = B.ent;
  if (!ent || ent.phase !== 'here' || !ent.handed || B.event) return;
  if (now < ent.busyUntil) return;
  if (!ent.suspect) {
    flash(T('booth.flash.quizNeedSuspect'));
    return;
  }
  S.tut.quiz = true;
  const config = ent.spec.quiz;
  const pool = Array.from({ length: QUIZ_COUNT }, (_, i) => i).filter((i) => i !== QUIZ_THURSDAY || S.day === 4);
  let index: number;
  if (config && typeof config === 'object' && config.first !== undefined && !ent.quizDone.length) {
    index = config.first;
  } else {
    const left = pool.filter((i) => !ent.quizDone.includes(i));
    index = left.length ? pick(left) : pick(pool);
  }
  ent.quizDone.push(index);
  const tofu = index === 5;
  const cn = config === 'cn' || (typeof config === 'object' && config?.first !== undefined);

  const steps: Step[] = [{ who: 'C', text: T(`quiz.items.${index}.q`) }];
  if (cn) {
    steps.push({ who: 'E', text: T(`quiz.items.${index}.a`), expr: tofu ? 'angry' : 'grin', hold: tofu ? 1 : 1.1 });
    if (tofu) steps.push({ who: 'Q', text: T('quiz.tofuCrowd'), fight: true, hold: 1 });
    steps.push({ who: 'E', text: '……', expr: 'shock', hold: 1 });
    ent.exposed = true;
  } else {
    const confused = resolveList('quiz.confused');
    steps.push({ who: 'E', text: tofu ? 'Tofu… what?' : pick(confused), expr: 'neutral' });
  }
  runSteps(steps);
}
