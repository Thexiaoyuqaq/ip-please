import { PEOPLE } from '@/assets';
import { T } from '@/i18n/text';
import { accountCard } from '@/game/docs';
import {
  CN_LOCS,
  COUNTRIES,
  countryRef,
  locationRef,
  pick,
  randDate,
  randIP,
  realPay,
  realPhone,
  rint,
  shuffle,
  STREETS,
  timezoneRef,
  cityRef,
  digits,
  type CountryCode,
} from '@/game/world';
import { addressIssue, languageIssue, regionIssue, smsIssue, timezoneIssue, virtualCardIssue, xrayIssue, XRAY_ITEMS } from './issues';
import { choiceIndex, device1, device2, literal, makePassport, steps, virtualCardValue } from './spec';
import type { EntrantSpec, Step } from './types';

export type FlawKind =
  | 'valid'
  | 'cn'
  | 'tz'
  | 'lang'
  | 'cnip'
  | 'hidden'
  | 'virtual'
  | 'oregon'
  | 'sms'
  | 'cat'
  | 'keys';

let poolLeft: string[] = [];

export function resetPool(): void {
  poolLeft = [];
}

/** Random travelers never repeat a portrait within a day. */
export function takePoolPerson(): string {
  if (!poolLeft.length) {
    poolLeft = shuffle(Object.keys(PEOPLE).filter((key) => !PEOPLE[key].scripted));
  }
  return poolLeft.pop()!;
}

const nervous = (key: string): Step => ({
  who: 'E',
  text: { key, index: choiceIndex(key) },
  sweat: true,
  expr: 'nervous',
});

function randomDay1(valid: boolean): EntrantSpec {
  const person = takePoolPerson();
  if (valid) {
    const cc = pick<CountryCode>(['US', 'US', 'US', 'UK', 'JP', 'DE', 'SG']);
    const country = COUNTRIES[cc];
    const city = pick(country.cities);
    return {
      person,
      voice: rint(100, 190),
      intro: [literal('E', pick(country.hello))],
      docs: [{ key: 'dv', doc: device1(randIP(false), locationRef(cc, city.id)) }],
      primary: 'dv',
      ok: ['approve'],
      issues: [],
      react: { approve: [literal('E', pick(country.thanks))] },
    };
  }
  const loc = T(`loc.cn.${pick(CN_LOCS.slice(0, 7))}`);
  return {
    person,
    voice: rint(100, 190),
    intro: [{ who: 'E', text: { key: 'random.day1.cnIntro', index: choiceIndex('random.day1.cnIntro') } }],
    docs: [{ key: 'dv', doc: device1(randIP(true), loc) }],
    primary: 'dv',
    ok: ['deny'],
    reason: T('reason.randomRegion', { loc }),
    issues: [regionIssue(loc)],
    react: {
      deny: [{ who: 'E', text: { key: 'random.day1.cnReact', index: choiceIndex('random.day1.cnReact') }, expr: 'sad' }],
    },
  };
}

export function randomEntrant(day: number, kind: FlawKind): EntrantSpec {
  if (day === 1) return randomDay1(kind === 'valid');

  const person = takePoolPerson();
  const cc: CountryCode = kind === 'valid' ? pick<CountryCode>(['US', 'US', 'US', 'US', 'UK', 'JP', 'DE', 'SG']) : 'US';
  const country = COUNTRIES[cc];
  const city = pick(country.cities);
  const sex = pick(['M', 'F'] as const);
  const passport = makePassport(cc, person, pick(country.last), pick(country.first), randDate(1960, 2004), city.en, sex);

  let loc = locationRef(cc, city.id);
  let tz = city.tz;
  let lang = country.lang;
  let ip = randIP(false);
  let pay: string | ReturnType<typeof virtualCardValue> = realPay();
  let bill = `${pick(STREETS)}, ${city.state}`;
  let phone = realPhone(cc, city.phone);

  const spec: EntrantSpec = {
    person,
    voice: rint(100, 190),
    intro: [literal('E', pick(country.hello))],
    primary: 'pp',
    issues: [],
    quiz: null,
    ok: ['approve'],
    docs: [],
    react: { approve: [literal('E', pick(country.thanks))] },
  };

  if (kind === 'tz') {
    tz = 'Asia/Shanghai';
    spec.issues.push(
      timezoneIssue(countryRef('US'), timezoneRef(tz), [
        { who: 'C', text: T('random.ask.tz') },
        nervous('random.nervous.tz'),
      ]),
    );
    spec.reason = T('reason.randomTz');
  } else if (kind === 'lang') {
    lang = 'zh-CN';
    spec.issues.push(
      languageIssue(countryRef('US'), lang, [
        { who: 'C', text: T('random.ask.lang') },
        nervous('random.nervous.lang'),
      ]),
    );
    spec.reason = T('reason.randomLang');
  } else if (kind === 'cnip') {
    loc = T(`loc.cn.${pick(CN_LOCS.slice(0, 4))}`);
    ip = randIP(true);
    tz = 'Asia/Shanghai';
    spec.intro = [{ who: 'E', text: { key: 'random.cnip.intro', index: choiceIndex('random.cnip.intro') } }];
    spec.issues.push(
      regionIssue(loc, [
        { who: 'C', text: T('random.ask.cnip') },
        literal('E', "But I'm American!", { expr: 'shock' }),
      ]),
    );
    spec.issues.push({
      pairs: [['pp.header', 'dv.loc']],
      title: T('issue.cnip.title'),
      sub: T('issue.cnip.sub', { loc }),
    });
    spec.reason = T('reason.randomCnip');
    spec.react = { deny: [literal('E', 'Unbelievable.', { expr: 'sad' })] };
  } else if (kind === 'hidden') {
    const index = choiceIndex('random.tells');
    const say = { key: `random.tells.${index}.say` };
    spec.intro = [{ who: 'E', text: say }];
    spec.tell = {
      say,
      title: T('issue.tell.title'),
      sub: T(`random.tells.${index}.sub`),
      ask: steps(`random.tells.${index}.ask`, ['C', 'E'], [undefined, { expr: 'nervous', sweat: true }]),
    };
    spec.quiz = 'cn';
    spec.reason = T('reason.randomHidden');
    spec.hint = T('hint.tell');
  } else if (kind === 'virtual') {
    pay = virtualCardValue();
    spec.issues.push(
      virtualCardIssue([{ who: 'C', text: T('random.ask.virtual') }, nervous('random.nervous.virtual')]),
    );
    spec.reason = T('reason.randomVirtual');
  } else if (kind === 'oregon') {
    bill = '123 Main St, OR';
    spec.issues.push(
      addressIssue([{ who: 'C', text: T('random.ask.oregon') }, nervous('random.nervous.oregon')]),
    );
    spec.reason = T('reason.randomOregon', { city: cityRef('US', city.id) });
  } else if (kind === 'sms') {
    phone = `+1 ${pick(['209', '310', '415', '646'])}-555-01${digits(2)}`;
    spec.issues.push(
      smsIssue(phone, [{ who: 'C', text: T('random.ask.sms') }, nervous('random.nervous.sms')]),
    );
    spec.reason = T('reason.randomSms');
  } else if (kind === 'cat' || kind === 'keys') {
    spec.xray = [XRAY_ITEMS[kind]];
    spec.issues.push(
      xrayIssue(kind, [{ who: 'C', text: T(`random.ask.${kind}`) }, nervous(`random.nervous.${kind}`)]),
    );
    spec.reason = T(kind === 'cat' ? 'reason.randomCat' : 'reason.randomKeys');
  }

  if (kind !== 'valid') {
    spec.ok = ['deny', 'detain'];
    if (kind !== 'cnip') spec.quiz = 'cn';
    if (!spec.react?.deny) {
      spec.react = {
        deny: [{ who: 'E', text: { key: 'random.deny', index: choiceIndex('random.deny') }, expr: 'sad' }],
      };
    }
  }

  spec.docs = [
    { key: 'pp', doc: passport },
    { key: 'dv', doc: device2(ip, loc, tz, lang) },
  ];
  if (day >= 3) spec.docs.push({ key: 'ac', doc: accountCard(pay, bill, phone) });
  return spec;
}
