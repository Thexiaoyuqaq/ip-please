import type { Doc } from '@/game/docs';
import type { EntrantSpec, Issue, QueueItem, Speaker, XrayItem } from '@/game/queue/types';
export type { XrayItem } from '@/game/queue/types';
import type { Decision } from '@/game/state';
import type { TextRef } from '@/i18n/text';

export interface Mark {
  kind: Decision;
  rx: number;
  ry: number;
}

export interface DocumentInstance {
  doc: Doc;
  key: string;
  owner: 'ent' | 'desk';
  big: boolean;
  x: number;
  y: number;
  marks: Mark[];
  slot?: [number, number];
  loose?: boolean;
  nest?: number;
  returned?: boolean;
}

export interface DialogueLine {
  t: number;
  who: Speaker;
  text: TextRef | string;
  ent: Entrant | null;
}

export type EntrantPhase = 'enter' | 'here' | 'waiting' | 'leave' | 'detained';

export interface Entrant {
  spec: EntrantSpec;
  tEnter: number;
  phase: EntrantPhase;
  expr: string;
  talkUntil: number;
  sweatT: number | null;
  slip: boolean;
  busyUntil: number;
  decided: Decision | null;
  asked: Set<Issue>;
  found: Set<Issue | string>;
  quizDone: number[];
  docs: DocumentInstance[];
  placed: Set<DocumentInstance>;
  instant: boolean;
  suspect: boolean;
  noJudge?: boolean;
  handed?: boolean;
  complained?: boolean;
  exposed?: boolean;
  tLeave?: number;
  dir?: 'left' | 'right';
  tDetain?: number;
}

export interface FieldHit {
  key: string | null;
  d?: DocumentInstance;
  box: () => readonly [number, number, number, number];
  xr?: XrayItem;
  ln?: DialogueLine;
}

export interface Banner {
  title: TextRef;
  sub: TextRef;
  issue?: Issue;
  ask?: boolean;
  bad: boolean;
}

export interface RushEvent {
  type: 'rush';
  list: { person: string; line: number; ok: Decision }[];
  i: number;
  t0: number;
  tFace: number;
  hits: number;
  wrong: number;
  missed: number;
  lock: boolean;
}

export interface CloneItem {
  ts: number;
  x0: number;
  y: number;
  v: number;
  state: 'wait' | 'run' | 'hit' | 'through';
  th: number;
}

export interface ClonesEvent {
  type: 'clones';
  t0: number;
  items: CloneItem[];
  hits: number;
  passed: number;
  siren: AudioBufferSourceNode | null;
  done: boolean;
}

export type BoothEvent = RushEvent | ClonesEvent;

export interface ChatCut {
  type: 'chat';
  t0: number;
  msg: string;
  send: number;
  ban: number;
  mail: number;
  dur: number;
  lastKey?: number;
  fired?: Set<number>;
}

export interface Timer {
  t: number;
  fn: () => void;
}

export interface BoothState {
  queue: QueueItem[];
  idx: number;
  ent: Entrant | null;
  docs: DocumentInstance[];
  lines: DialogueLine[];
  timers: Timer[];
  tray: { open: boolean; t: number };
  presses: { t: number; kind: Decision }[];
  shake: number;
  insp: { on: boolean; sel: FieldHit[]; banner: Banner | null; all: boolean };
  xray: { on: boolean; t: number };
  printing: { doc: Doc; t0: number; dur: number; key: string } | null;
  printQueue: [Doc, number, string][];
  effects: { type: 'pile'; t0: number; ent: Entrant }[];
  slams: { t: number; kind: Decision }[];
  ruleInst: DocumentInstance | null;
  rulePos: [number, number];
  ruleOpened: boolean;
  speakerT: number;
  fightT: number;
  harmlessT: number;
  pay: number;
  bonus: number;
  bribe: number;
  fines: number;
  cites: number;
  correct: number;
  total: number;
  flash: { text: TextRef | string; t: number } | null;
  clock0: number;
  ending: boolean;
  event: BoothEvent | null;
  cut: ChatCut | null;
  closeup: { t0: number } | null;
  lastFinish: number;
  tensionSrc: AudioBufferSourceNode | null;
  allTokens: boolean;
  detainT?: number;
}
