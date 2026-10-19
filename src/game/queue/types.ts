import type { TextRef } from '@/i18n/text';
import type { Doc } from '@/game/docs';
import type { Decision } from '@/game/state';

export type Speaker = 'C' | 'E' | 'Q';

export type Expr = 'neutral' | 'smile' | 'grin' | 'talk' | 'shock' | 'nervous' | 'sad' | 'angry';

export interface StepOptions {
  expr?: Expr;
  sweat?: boolean;
  slip?: boolean;
  fight?: boolean;
  hold?: number;
}

/**
 * One line of dialogue. `text` is kept as a reference so the language can be
 * switched while a line is on screen.
 */
export interface Step extends StepOptions {
  who: Speaker;
  text?: TextRef | string;
}

export interface Issue {
  /** Field-id pairs that expose the problem, e.g. `[['pp.header', 'dv.tz']]`. */
  pairs?: string[][];
  /** `true` for the author's final document: every field is a mismatch. */
  all?: boolean;
  title: TextRef;
  sub: TextRef;
  ask?: Step[];
  fx?: 'pile' | 'strip';
  phone?: string;
}

/** A verbal tell: the exact intro line that exposes the traveler. */
export interface Tell extends Issue {
  say: TextRef;
}

export interface XrayItem {
  icon: 'cat' | 'keys';
  at: [number, number];
  label: TextRef;
  key: string;
}

export interface DocSpec {
  key: string;
  doc: Doc;
}

export type OnPlace = 'note' | 'nest' | 'accordion';

export interface EntrantSpec {
  person: string;
  voice: number;
  intro: Step[];
  after?: Step[];
  docs: DocSpec[];
  primary: string;
  ok: Decision[];
  reason?: TextRef;
  hint?: TextRef;
  issues: Issue[];
  xray?: XrayItem[];
  /** `'cn'` = will expose itself on any quiz question; `{first:n}` forces a question. */
  quiz?: 'cn' | { first: number } | null;
  react?: Partial<Record<Decision, Step[]>>;
  onPlace?: Record<string, OnPlace>;
  then?: 'closeup' | 'jorji5' | 'ending';
  tension?: boolean;
  tell?: Tell;
  bribe?: boolean;
  author?: boolean;
  noJudge?: boolean;
  requeued?: boolean;
}

export type EventItem = { type: 'rush' } | { type: 'clones' };

export type QueueItem = EntrantSpec | EventItem;

export function isEvent(item: QueueItem | undefined): item is EventItem {
  return !!item && 'type' in item;
}
