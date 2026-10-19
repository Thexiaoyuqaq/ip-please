import { T } from '@/i18n/text';
import { countryRef, locationRef, timezoneRef } from '@/game/world';
import { languageIssue, tellIssue, timezoneIssue } from '../issues';
import { device2, steps, usPassport } from '../spec';
import type { EntrantSpec } from '../types';

/** Day 2: timezones and languages. */
export function day2Fixed(): Record<string, EntrantSpec> {
  const us = countryRef('US');
  return {
    john: {
      person: 'JOHN',
      voice: 125,
      intro: steps('script.d2.john.intro', 'E'),
      docs: [
        { key: 'pp', doc: usPassport('JOHN', 'SMITH', 'JOHN', '1990.07.04', 'LOS ANGELES') },
        { key: 'dv', doc: device2('104.28.66.12', locationRef('US', 'losAngeles'), 'Asia/Shanghai', 'zh-CN', 'Windows 11') },
      ],
      primary: 'pp',
      quiz: 'cn',
      ok: ['deny', 'detain'],
      reason: T('reason.johnTz'),
      issues: [
        timezoneIssue(us, timezoneRef('Asia/Shanghai'), steps('script.d2.john.askTz', ['C', 'E'], [undefined, { sweat: true, expr: 'nervous', hold: 1.5 }])),
        languageIssue(us, 'zh-CN', steps('script.d2.john.askLang', ['C', 'E'], [undefined, { sweat: true, expr: 'nervous' }])),
      ],
      react: { deny: [{ who: 'E', slip: true, hold: 0.8 }] },
    },
    brown: {
      person: 'BROWN',
      voice: 120,
      intro: steps('script.d2.brown.intro', 'E'),
      tell: tellIssue(
        { key: 'script.d2.brown.intro', index: 0 },
        T('tell.brown.sub'),
        steps('script.d2.brown.ask', ['C', 'E'], [undefined, { expr: 'nervous', sweat: true }]),
      ),
      docs: [
        { key: 'pp', doc: usPassport('BROWN', 'BROWN', 'MICHAEL', '1985.03.12', 'NEW YORK') },
        { key: 'dv', doc: device2('64.233.160.4', locationRef('US', 'newYork'), 'America/New_York', 'en-US', 'MacBook') },
      ],
      primary: 'pp',
      quiz: { first: 0 },
      ok: ['detain', 'deny'],
      reason: T('reason.brown'),
      hint: T('hint.tell'),
      issues: [],
    },
    emily: {
      person: 'EMILY',
      voice: 190,
      intro: steps('script.d2.emily.intro', 'E'),
      tell: tellIssue(
        { key: 'script.d2.emily.intro', index: 0 },
        T('tell.emily.sub'),
        steps('script.d2.emily.ask', ['C', 'E'], [undefined, { expr: 'nervous', sweat: true }]),
      ),
      docs: [
        { key: 'pp', doc: usPassport('EMILY', 'JONES', 'EMILY', '1992.11.02', 'CHICAGO', 'F') },
        { key: 'dv', doc: device2('23.94.12.77', locationRef('US', 'chicago'), 'America/Chicago', 'en-US', 'iPhone') },
      ],
      primary: 'pp',
      quiz: { first: 5 },
      ok: ['detain', 'deny'],
      reason: T('reason.emily'),
      hint: T('hint.tell'),
      issues: [],
    },
    jorji: {
      person: 'JORJI',
      voice: 110,
      intro: steps('script.d2.jorji.intro', 'E'),
      docs: [
        { key: 'pp', doc: usPassport('JORJI', 'COSTAVA', 'GEORGE', '1980.02.29', 'LOS ANGELES') },
        { key: 'dv', doc: device2('104.28.9.120', locationRef('US', 'losAngeles'), 'America/Los_Angeles', 'zh-CN', 'Windows 11') },
      ],
      primary: 'pp',
      quiz: 'cn',
      ok: ['deny', 'detain'],
      reason: T('reason.jorjiLang'),
      issues: [
        languageIssue(
          us,
          'zh-CN',
          steps('script.d2.jorji.ask', ['E', 'C', 'E'], [{ expr: 'grin' }, undefined, { expr: 'shock' }]),
        ),
      ],
      react: { deny: steps('script.d2.jorji.deny', 'E', [{ expr: 'sad', hold: 1.1 }]) },
    },
  };
}
