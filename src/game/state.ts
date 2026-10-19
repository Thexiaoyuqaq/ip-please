import { LAST_DAY } from './constants';

export type Decision = 'approve' | 'deny' | 'detain';

export interface FamilyMemberState {
  hunger: number;
  heat: number;
  sick: number;
  gone?: boolean;
  wantsGPU?: boolean;
  gpuHappy?: boolean;
  overtime?: boolean;
}

export type FamilyMemberKey = 'haiku' | 'sonnet' | 'opus';

export interface Stats {
  approve: number;
  deny: number;
  detain: number;
  correct: number;
  wrong: number;
}

export interface Flags {
  sawNote?: boolean;
  shredded?: boolean;
  bribed?: boolean;
  ending?: 'approve' | 'deny';
}

export interface TutorialFlags {
  called?: boolean;
  dragged?: boolean;
  rules?: boolean;
  tray?: boolean;
  stamped?: boolean;
  returned?: boolean;
  inspect?: boolean;
  tell?: boolean;
  quiz?: boolean;
  account?: boolean;
  xray?: boolean;
  sniper?: boolean;
}

/** State that survives between days and is written to localStorage. */
export interface SaveState {
  day: number;
  savings: number;
  family: Record<FamilyMemberKey, FamilyMemberState>;
  stats: Stats;
  flags: Flags;
  tut: TutorialFlags;
}

export const SAVE_KEY = 'ip-please-save-v1';

export function createInitialState(): SaveState {
  return {
    day: 1,
    savings: 0,
    family: {
      haiku: { hunger: 0, heat: 0, sick: 0 },
      sonnet: { hunger: 0, heat: 0, sick: 0 },
      opus: { hunger: 1, heat: 0, sick: 0 },
    },
    stats: { approve: 0, deny: 0, detain: 0, correct: 0, wrong: 0 },
    flags: {},
    tut: {},
  };
}

export const S: SaveState = createInitialState();

export const FAMILY_MEMBERS: FamilyMemberKey[] = ['haiku', 'sonnet', 'opus'];

export function newGame(): void {
  for (const key of Object.keys(S) as (keyof SaveState)[]) delete (S as unknown as Record<string, unknown>)[key];
  Object.assign(S, createInitialState());
}

export function saveGame(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  } catch {
    /* private mode: saving is best-effort */
  }
}

export function loadSave(): SaveState | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as SaveState | null;
    if (!parsed || typeof parsed.day !== 'number' || parsed.day <= 1 || parsed.day > LAST_DAY) return null;
    if (!parsed.family || !parsed.stats) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
