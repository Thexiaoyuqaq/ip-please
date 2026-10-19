import { T } from '@/i18n/text';
import { accountCard, Passport } from '@/game/docs';
import { locationRef } from '@/game/world';
import { addressIssue, smsIssue, virtualCardIssue } from '../issues';
import { device2, row, steps, usPassport, virtualCardValue } from '../spec';
import type { EntrantSpec } from '../types';

/** Day 3: payment cards and phone numbers. */
export function day3Fixed(): Record<string, EntrantSpec> {
  return {
    tom: {
      person: 'TOM',
      voice: 100,
      intro: steps('script.d3.tom.intro', 'E'),
      docs: [
        { key: 'pp', doc: usPassport('TOM', 'WILSON', 'TOM', '1978.05.30', 'DENVER') },
        { key: 'dv', doc: device2('75.164.8.31', locationRef('US', 'denver'), 'America/Denver', 'en-US', 'Windows 11') },
        { key: 'ac', doc: accountCard('VISA ··4821', '123 Main St, OR', '+1 720-341-0142') },
      ],
      primary: 'pp',
      quiz: 'cn',
      ok: ['deny', 'detain'],
      reason: T('reason.tomAddr'),
      issues: [addressIssue(steps('script.d3.tom.ask', ['C', 'E'], [undefined, { expr: 'nervous', sweat: true }]))],
    },
    alex: {
      person: 'ALEX',
      voice: 130,
      intro: steps('script.d3.alex.intro', 'E'),
      docs: [
        { key: 'pp', doc: usPassport('ALEX', 'TAYLOR', 'ALEX', '1996.08.15', 'SEATTLE') },
        { key: 'dv', doc: device2('45.79.21.200', locationRef('US', 'seattle'), 'America/Los_Angeles', 'en-US', 'Android') },
        { key: 'ac', doc: accountCard('VISA ··1209', '9 Elm Rd, WA', '+1 209-555-0198') },
      ],
      primary: 'pp',
      quiz: 'cn',
      ok: ['deny', 'detain'],
      reason: T('reason.alexSms'),
      issues: [smsIssue('+1 209-555-0198', steps('script.d3.alex.ask', ['C', 'E'], [undefined, { expr: 'shock' }]))],
    },
    carpool: {
      person: 'CARPOOL',
      voice: 150,
      intro: steps('script.d3.carpool.intro', 'E'),
      docs: [
        {
          key: 'pp',
          doc: new Passport({
            country: 'UNITED STATES OF AMERICA',
            name: 'FAMILY, MAX',
            person: 'CARPOOL',
            mrz: 'P<USAFAMILY<<MAX<<<<<<<<<<<<',
            rows: [row('dob', '—'), row('sex', '?'), row('iss', 'SAN JOSE'), row('exp', '2031.10.21')],
          }),
        },
        { key: 'dv', doc: device2('98.207.3.44', locationRef('US', 'sanJose'), 'America/Los_Angeles', 'en-US', 'MacBook') },
        { key: 'ac', doc: accountCard(T('data.maxSubscription'), '1 Family Way, CA', '+1 408-772-0110') },
      ],
      primary: 'pp',
      ok: ['deny', 'detain'],
      reason: T('reason.carpool'),
      issues: [
        {
          pairs: [
            ['pp.photo', 'rule.pay'],
            ['ac.pay', 'rule.pay'],
            ['pp.photo', 'pp.name'],
            ['pp.photo', 'ac.pay'],
          ],
          title: T('issue.carpool.title'),
          sub: T('issue.carpool.sub'),
          ask: steps('script.d3.carpool.ask', ['C', 'E'], [undefined, { expr: 'smile' }]),
        },
      ],
      react: { deny: steps('script.d3.carpool.deny', 'E', [{ expr: 'sad' }]) },
    },
    jorji: {
      person: 'JORJI',
      voice: 110,
      intro: steps('script.d3.jorji.intro', 'E'),
      docs: [
        { key: 'pp', doc: usPassport('JORJI', 'COSTAVA', 'GEORGE', '1980.02.29', 'LOS ANGELES') },
        { key: 'dv', doc: device2('104.28.9.120', locationRef('US', 'losAngeles'), 'America/Los_Angeles', 'en-US', 'Windows 11') },
        { key: 'ac', doc: accountCard(virtualCardValue(), '88 Sunset Blvd, CA', '+1 213-680-0177') },
      ],
      primary: 'pp',
      quiz: 'cn',
      ok: ['deny', 'detain'],
      reason: T('reason.jorjiVirtual'),
      issues: [virtualCardIssue(steps('script.d3.jorji.ask', ['C', 'E'], [undefined, { expr: 'nervous', sweat: true }]))],
      react: { deny: steps('script.d3.jorji.deny', 'E', [{ expr: 'sad' }]) },
    },
  };
}
