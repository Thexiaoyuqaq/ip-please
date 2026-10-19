import type { Decision } from '@/game/state';

export interface RushEntry {
  /** `'pool'` picks a random unused portrait; otherwise a scripted SLANG sprite. */
  person: string;
  /** Index into the localized `rush.lines` array. */
  line: number;
  ok: Decision;
}

/** Express lane: deny Chinese slang, approve human speech. */
export const RUSH: RushEntry[] = [
  { person: 'SLANG0', line: 0, ok: 'deny' },
  { person: 'pool', line: 1, ok: 'approve' },
  { person: 'SLANG1', line: 2, ok: 'deny' },
  { person: 'SLANG2', line: 3, ok: 'deny' },
  { person: 'pool', line: 4, ok: 'approve' },
  { person: 'SLANG3', line: 5, ok: 'deny' },
];
