import type { SceneName } from './runtime';

/**
 * Scene transition hook. The engine registers the real implementation at boot;
 * gameplay modules can therefore trigger a scene change without importing the
 * engine (and creating a module cycle).
 */
export let navigate: (scene: SceneName) => void = () => {};

export function setNavigate(fn: (scene: SceneName) => void): void {
  navigate = fn;
}
