import { T } from '@/i18n/text';
import { accountCard, PromptPaper } from '@/game/docs';
import { locationRef } from '@/game/world';
import { device2, steps, usPassport } from '../spec';
import type { EntrantSpec } from '../types';

/** Day 6: George, the final version — and the last traveler. */
export function day6Fixed(): Record<string, EntrantSpec> {
  return {
    jorji: {
      person: 'JORJI_SUIT',
      voice: 110,
      tension: true,
      intro: steps('script.d6.jorji.intro', 'E', [{ expr: 'neutral', hold: 1.3 }]),
      docs: [
        { key: 'pp', doc: usPassport('JORJI_SUIT', 'COSTAVA', 'GEORGE', '1980.02.29', 'LOS ANGELES') },
        { key: 'dv', doc: device2('76.88.140.2', locationRef('US', 'losAngeles', true), 'America/Los_Angeles', 'en-US', 'MacBook') },
        { key: 'ac', doc: accountCard(T('data.visaPhysical'), '88 Sunset Blvd, CA', 'Google Voice') },
      ],
      primary: 'pp',
      ok: ['approve'],
      issues: [],
      react: {
        approve: steps('script.d6.jorji.approve', 'E', [{ expr: 'grin' }]),
        deny: steps('script.d6.jorji.deny', 'E', [{ expr: 'shock' }]),
      },
      then: 'jorji5',
    },
    author: {
      person: 'AUTHOR',
      voice: 100,
      author: true,
      intro: [],
      docs: [
        { key: 'pr', doc: new PromptPaper(T('data.authorPrompt')) },
        { key: 'dv', doc: device2('??.??.??.??', T('data.usEast8'), 'Asia/Shanghai', 'zh-CN', 'Claude Code') },
      ],
      primary: 'pr',
      ok: ['approve', 'deny', 'detain'],
      react: { approve: steps('script.d6.author.approve', 'C', [{ hold: 2 }]) },
      issues: [{ all: true, title: T('issue.author.title'), sub: T('issue.author.sub') }],
      then: 'ending',
    },
  };
}
