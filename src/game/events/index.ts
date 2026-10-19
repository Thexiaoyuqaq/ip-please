import { registerEventHooks } from '@/game/booth/entrant';
import type { EventItem } from '@/game/queue/types';
import { startClones } from './clones';
import { startRush } from './rush';
import { afterAuthor, afterJorji5 } from './chat';

export function startEvent(item: EventItem): void {
  if (item.type === 'rush') startRush();
  if (item.type === 'clones') startClones();
}

export function registerGameplayHooks(): void {
  registerEventHooks({ startEvent, afterJorji5, afterAuthor });
}

export { updateClones } from './clones';
export { closeupDone } from './effects';
export { updateChat, chatDone } from './chat';
