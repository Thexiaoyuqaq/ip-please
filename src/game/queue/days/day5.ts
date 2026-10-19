import { T } from '@/i18n/text';
import { accountCard, AccordionPassport, Passport } from '@/game/docs';
import { locationRef } from '@/game/world';
import { regionIssue } from '../issues';
import { device2, makePassport, row, steps, usPassport } from '../spec';
import type { EntrantSpec } from '../types';

/** Day 5: the distillation army. */
export function day5Fixed(): Record<string, EntrantSpec> {
  const sgPassport = new Passport({
    country: 'REPUBLIC OF SINGAPORE',
    name: 'SG TECH PTE LTD',
    person: 'SG_MAN',
    cover: [132, 38, 40],
    band: [160, 56, 56],
    rows: [
      row('type', T('data.enterprise')),
      row('reg', 'SINGAPORE'),
      row('est', '2019.06.01'),
      row('shareholders', T('data.shareholdersSeeInside')),
    ],
  });
  return {
    sg: {
      person: 'SG_MAN',
      voice: 120,
      intro: steps('script.d5.sg.intro', 'E'),
      docs: [{ key: 'pp', doc: sgPassport }],
      primary: 'pp',
      onPlace: { pp: 'nest' },
      ok: ['deny', 'detain'],
      reason: T('reason.sg'),
      issues: [
        {
          pairs: [['m4.all'], ['pp.reg', 'm4.all'], ['pp.shareholders', 'm4.all'], ['m4.all', 'rule.corp']],
          title: T('issue.nest.title'),
          sub: T('issue.nest.sub'),
          ask: steps('script.d5.sg.ask', ['C', 'E'], [undefined, { expr: 'nervous', sweat: true }]),
        },
      ],
    },
    relay: {
      person: 'RELAY',
      voice: 95,
      intro: steps('script.d5.relay.intro', 'E', [{ hold: 0.7 }]),
      docs: [
        {
          key: 'pp',
          doc: makePassport('US', 'RELAY', 'ANDERSON', 'M.', '1971.09.13', 'LOS ANGELES', 'M', AccordionPassport, row('holders', T('data.holdersCount'))),
        },
      ],
      primary: 'pp',
      onPlace: { pp: 'accordion' },
      bribe: true,
      ok: ['deny', 'detain'],
      reason: T('reason.relay'),
      issues: [
        {
          pairs: [['pp.holders'], ['pp.holders', 'rule.pay']],
          title: T('issue.holders.title'),
          sub: T('issue.holders.sub'),
          ask: steps('script.d5.relay.ask', ['C', 'E'], [undefined, { expr: 'neutral' }]),
        },
      ],
    },
    mike: {
      person: 'MIKE',
      voice: 135,
      intro: steps('script.d5.mike.intro', 'E'),
      docs: [
        { key: 'pp', doc: usPassport('MIKE', 'JOHNSON', 'MIKE', '1988.06.20', 'DENVER') },
        { key: 'dv', doc: device2('101.88.12.9', T('loc.cn.shanghai'), 'Asia/Shanghai', 'en-US', 'MacBook') },
        { key: 'ac', doc: accountCard('VISA ··3305', '22 Oak St, CO', '+1 720-318-0166') },
      ],
      primary: 'pp',
      ok: ['deny', 'detain'],
      reason: T('reason.mike'),
      issues: [
        regionIssue(
          T('loc.cn.shanghai'),
          steps('script.d5.mike.ask', ['C', 'E', 'C'], [undefined, { expr: 'shock' }]),
        ),
      ],
      react: { deny: steps('script.d5.mike.deny', 'E', [{ expr: 'sad' }]) },
    },
    grandma: {
      person: 'GRANDMA',
      voice: 185,
      intro: steps('script.d5.grandma.intro', 'E'),
      docs: [
        {
          key: 'pp',
          doc: new Passport({
            country: 'UNITED STATES OF AMERICA',
            name: 'WONG, MEI LIN',
            person: 'GRANDMA',
            mrz: 'P<USAWONG<<MEI<LIN<<<<<<<<<<<<',
            rows: [row('dob', '1951.08.08'), row('sex', 'F'), row('iss', 'SAN FRANCISCO'), row('exp', '2030.03.15')],
          }),
        },
        { key: 'dv', doc: device2('73.162.4.18', locationRef('US', 'sanFrancisco'), 'America/Los_Angeles', 'en-US', 'iPad') },
        { key: 'ac', doc: accountCard('VISA ··8008', '1 Grant Ave, CA', '+1 415-982-0108') },
      ],
      primary: 'pp',
      ok: ['approve'],
      issues: [],
      react: { approve: steps('script.d5.grandma.approve', ['C', 'E'], [undefined, { expr: 'smile' }]) },
      then: 'closeup',
    },
  };
}
