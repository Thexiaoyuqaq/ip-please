import { i18n } from './index';

/**
 * A reference to a localized string. Strings composed inside the game data
 * (locations, issues, reasons...) are kept as references instead of being
 * resolved eagerly, so switching the language at runtime updates every
 * screen — including a day already in progress.
 */
export interface TextRef {
  key: string;
  vars?: Record<string, unknown>;
  /** When the key points to an array, select this element (picked once at spec-build time). */
  index?: number;
}

export const T = (key: string, vars?: Record<string, unknown>, index?: number): TextRef => ({ key, vars, index });

export function isTextRef(value: unknown): value is TextRef {
  return typeof value === 'object' && value !== null && 'key' in value;
}

/** Resolve a TextRef (or a plain string) with the current language. Nested refs are resolved recursively. */
export function resolveRef(ref: TextRef | string | undefined, depth = 0): string {
  if (ref === undefined) return '';
  if (typeof ref === 'string') return ref;
  if (depth > 8) return ref.key;
  const vars = ref.vars
    ? Object.fromEntries(Object.entries(ref.vars).map(([k, v]) => [k, isTextRef(v) ? resolveRef(v, depth + 1) : v]))
    : undefined;
  if (ref.index !== undefined) {
    const list = i18n.t(ref.key, { ...vars, returnObjects: true });
    return Array.isArray(list) ? String(list[ref.index] ?? '') : '';
  }
  const value = i18n.t(ref.key, vars ?? {});
  return typeof value === 'string' ? value : '';
}

/** Resolve an array of localized strings. */
export function resolveList(key: string, vars?: Record<string, unknown>): string[] {
  const value = i18n.t(key, { ...vars, returnObjects: true });
  return Array.isArray(value) ? (value as string[]) : [];
}
