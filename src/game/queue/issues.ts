import { T, type TextRef } from '@/i18n/text';
import type { Issue, Step, Tell, XrayItem } from './types';

export function regionIssue(loc: TextRef, ask?: Step[]): Issue {
  return {
    pairs: [
      ['dv.loc', 'rule.region'],
      ['dv.ip', 'rule.region'],
    ],
    title: T('issue.region.title'),
    sub: T('issue.region.sub', { loc }),
    ask,
  };
}

export function timezoneIssue(country: TextRef, tz: TextRef | string, ask?: Step[]): Issue {
  return {
    pairs: [
      ['pp.header', 'dv.tz'],
      ['dv.loc', 'dv.tz'],
      ['dv.tz', 'rule.tz'],
    ],
    title: T('issue.tz.title'),
    sub: T('issue.tz.sub', { country, tz }),
    ask,
  };
}

export function languageIssue(country: TextRef, lang: string, ask?: Step[]): Issue {
  return {
    pairs: [
      ['pp.header', 'dv.lang'],
      ['dv.loc', 'dv.lang'],
      ['dv.lang', 'rule.tz'],
    ],
    title: T('issue.lang.title'),
    sub: T('issue.lang.sub', { country, lang }),
    ask,
  };
}

export function virtualCardIssue(ask?: Step[]): Issue {
  return {
    pairs: [['ac.pay', 'rule.pay']],
    title: T('issue.virtual.title'),
    sub: T('issue.virtual.sub'),
    ask,
  };
}

export function smsIssue(phone: string, ask?: Step[]): Issue {
  return {
    pairs: [['ac.phone', 'rule.pay']],
    title: T('issue.sms.title'),
    sub: T('issue.sms.sub', { phone }),
    ask,
    fx: 'strip',
    phone,
  };
}

export function addressIssue(ask?: Step[]): Issue {
  return {
    pairs: [
      ['ac.bill', 'rule.pay'],
      ['ac.bill', 'dv.loc'],
    ],
    title: T('issue.addr.title'),
    sub: T('issue.addr.sub'),
    ask,
    fx: 'pile',
  };
}

export function tellIssue(say: TextRef, sub: TextRef, ask: Step[]): Tell {
  return {
    say,
    title: T('issue.tell.title'),
    sub,
    ask,
  };
}

export const XRAY_ITEMS = {
  cat: { icon: 'cat', at: [36, 104], label: T('booth.xrayItems.cat'), key: 'xr.cat' } as XrayItem,
  keys: { icon: 'keys', at: [-36, 104], label: T('booth.xrayItems.keys'), key: 'xr.keys' } as XrayItem,
};

export function xrayIssue(kind: 'cat' | 'keys', ask: Step[]): Issue {
  const item = XRAY_ITEMS[kind];
  return {
    pairs: [[item.key], [item.key, 'rule.xray']],
    title: T('issue.xray.title'),
    sub: T(`issue.xray.${kind}`),
    ask,
  };
}
