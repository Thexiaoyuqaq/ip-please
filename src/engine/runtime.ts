import type { DocumentInstance } from '@/game/booth/types';
import type { Sfx } from '@/audio/sfx';
import { now } from './clock';

export type SceneName =
  | 'boot'
  | 'intro'
  | 'title'
  | 'daycard'
  | 'news'
  | 'booth'
  | 'summary'
  | 'end'
  | 'over'
  | 'erased';

export interface Pointer {
  x: number;
  y: number;
  mouse: boolean;
  down: boolean;
}

export interface DragState {
  d: DocumentInstance;
  startedBig: boolean;
  off: [number, number];
  prev: { big: boolean; x: number; y: number };
  start: [number, number];
  moved: boolean;
}

export interface Runtime {
  sfx: Sfx;
  scene: SceneName;
  sceneT0: number;
  ptr: Pointer;
  drag: DragState | null;
  canvas: HTMLCanvasElement;
  screen: CanvasRenderingContext2D;
  /** Offscreen frame buffer; effects can sample it. */
  frame: HTMLCanvasElement;
  frameCtx: CanvasRenderingContext2D;
}

let runtime: Runtime | null = null;

export function setRuntime(value: Runtime): void {
  runtime = value;
}

export function rt(): Runtime {
  if (!runtime) throw new Error('Game runtime is not initialized');
  return runtime;
}

/** Seconds since the current scene started. */
export const st = (): number => now - rt().sceneT0;

export function goToScene(scene: SceneName): void {
  const r = rt();
  r.scene = scene;
  r.sceneT0 = now;
}
