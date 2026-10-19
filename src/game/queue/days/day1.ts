import { T } from '@/i18n/text';
import { CrayonPassport } from '@/game/docs';
import { cnLocationRef } from '@/game/world';
import { regionIssue } from '../issues';
import { device1, steps } from '../spec';
import type { EntrantSpec } from '../types';

/** Day 1: direct connections. */
export function day1Fixed(): Record<string, EntrantSpec> {
  const zhejiang = cnLocationRef('zhejiangUnicom');
  const hongKong = cnLocationRef('hongKong');
  const guangdong = cnLocationRef('guangdongMobile');
  return {
    grandpa: {
      person: 'GRANDPA',
      voice: 100,
      intro: steps('script.d1.grandpa.intro', 'E'),
      docs: [{ key: 'dv', doc: device1('115.236.20.8', zhejiang) }],
      primary: 'dv',
      ok: ['deny'],
      reason: T('reason.grandpa'),
      issues: [regionIssue(zhejiang)],
      react: { deny: steps('script.d1.grandpa.deny', 'E', [{ expr: 'sad' }]) },
    },
    hk: {
      person: 'HK_GUY',
      voice: 140,
      intro: steps('script.d1.hk.intro', 'E'),
      docs: [{ key: 'dv', doc: device1('103.152.8.21', hongKong) }],
      primary: 'dv',
      ok: ['deny'],
      reason: T('reason.hk'),
      issues: [regionIssue(hongKong)],
      react: { deny: steps('script.d1.hk.deny', 'E', [{ expr: 'shock', hold: 1.4 }]) },
    },
    jorji: {
      person: 'JORJI',
      voice: 110,
      intro: steps('script.d1.jorji.intro', 'E'),
      after: steps('script.d1.jorji.after', 'E'),
      docs: [
        { key: 'cp', doc: new CrayonPassport() },
        { key: 'dv', doc: device1('120.229.31.7', guangdong) },
      ],
      primary: 'cp',
      ok: ['deny'],
      reason: T('reason.jorjiCrayon'),
      issues: [
        {
          pairs: [
            ['cp.eagle', 'cp.header'],
            ['cp.eagle', 'cp.photo'],
            ['cp.header', 'cp.photo'],
          ],
          title: T('issue.crayon.title'),
          sub: T('issue.crayon.sub'),
          ask: steps('script.d1.jorji.askCrayon', ['C', 'E'], [undefined, { expr: 'nervous' }]),
        },
        regionIssue(guangdong),
        {
          pairs: [['cp.header', 'dv.loc']],
          title: T('issue.mismatch.title'),
          sub: T('issue.mismatch.sub', { loc: guangdong }),
          ask: steps('script.d1.jorji.askRegion', ['C', 'E'], [undefined, { expr: 'grin' }]),
        },
      ],
      react: { deny: steps('script.d1.jorji.deny', 'E', [{ expr: 'sad', hold: 1.2 }]) },
    },
  };
}
