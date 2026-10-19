import { T } from '@/i18n/text';
import { accountCard } from '@/game/docs';
import { locationRef, pick, randIP, realPay, realPhone, STREETS } from '@/game/world';
import { tellIssue, xrayIssue, XRAY_ITEMS } from '../issues';
import { device2, steps, usPassport } from '../spec';
import type { EntrantSpec } from '../types';

/** Day 4: Crazy Thursday. */
export function day4Fixed(): Record<string, EntrantSpec> {
  const usDocs = (person: string, surname: string, given: string, sex: 'M' | 'F' = 'M') => [
    { key: 'pp', doc: usPassport(person, surname, given, '1994.10.22', 'SEATTLE', sex) },
    {
      key: 'dv',
      doc: device2(randIP(false), locationRef('US', 'seattle'), 'America/Los_Angeles', 'en-US', 'MacBook'),
    },
    { key: 'ac', doc: accountCard(realPay(), `${pick(STREETS)}, WA`, realPhone('US', '206')) },
  ];
  return {
    cat: {
      person: 'CAT_GIRL',
      voice: 215,
      intro: steps('script.d4.cat.intro', 'E'),
      docs: usDocs('CAT_GIRL', 'LEE', 'SOPHIA', 'F'),
      primary: 'pp',
      xray: [XRAY_ITEMS.cat],
      ok: ['deny', 'detain'],
      reason: T('reason.cat'),
      issues: [
        xrayIssue(
          'cat',
          steps('script.d4.cat.ask', ['C', 'E', 'C'], [undefined, { expr: 'nervous', sweat: true }]),
        ),
      ],
    },
    v50: {
      person: 'V50',
      voice: 120,
      intro: steps('script.d4.v50.intro', 'E'),
      tell: tellIssue(
        { key: 'script.d4.v50.intro', index: 0 },
        T('tell.v50.sub'),
        steps('script.d4.v50.ask', ['C', 'E'], [undefined, { expr: 'grin' }]),
      ),
      docs: usDocs('V50', 'MILLER', 'JAKE'),
      primary: 'pp',
      quiz: { first: 7 },
      ok: ['detain', 'deny'],
      reason: T('reason.v50'),
      hint: T('hint.tell'),
      issues: [],
    },
    jorji: {
      person: 'JORJI',
      voice: 110,
      intro: steps('script.d4.jorji.intro', 'E'),
      docs: [
        { key: 'pp', doc: usPassport('JORJI', 'COSTAVA', 'GEORGE', '1980.02.29', 'LOS ANGELES') },
        { key: 'dv', doc: device2('104.28.9.120', locationRef('US', 'losAngeles'), 'America/Los_Angeles', 'en-US', 'Windows 11') },
        { key: 'ac', doc: accountCard('VISA ··2468', '88 Sunset Blvd, CA', '+1 213-680-0177') },
      ],
      primary: 'pp',
      quiz: 'cn',
      xray: [XRAY_ITEMS.keys],
      ok: ['deny', 'detain'],
      reason: T('reason.jorjiKeys'),
      issues: [
        xrayIssue(
          'keys',
          steps('script.d4.jorji.ask', ['C', 'E'], [undefined, { expr: 'nervous', sweat: true }]),
        ),
      ],
      react: { deny: steps('script.d4.jorji.deny', 'E', [{ expr: 'sad' }]) },
    },
    hood: {
      person: 'HOOD',
      voice: 90,
      intro: steps('script.d4.hood.intro', 'E', [{ hold: 0.8 }]),
      docs: usDocs('HOOD', 'DOE', 'JOHN'),
      primary: 'pp',
      onPlace: { pp: 'note' },
      ok: ['approve'],
      issues: [],
    },
  };
}
