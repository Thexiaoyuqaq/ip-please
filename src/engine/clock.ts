/**
 * Game clock, in seconds. Exported as a live binding so every module can
 * import `now` and see updates without passing it around.
 */
export let now = 0;

export function setNow(seconds: number): void {
  now = seconds;
}
