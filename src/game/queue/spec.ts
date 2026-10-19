import { resolveList, T, type TextRef } from '@/i18n/text';
import {
  accountCard,
  Card,
  Passport,
  type Doc,
  type DocRow,
  type PassportOptions,
} from '@/game/docs';
import { COUNTRIES, DEVICES, pick, randDate, digits, type CountryCode } from '@/game/world';
import type { Speaker, Step, StepOptions } from './types';

/** Build a sequence of steps from a localized string array. */
export function steps(key: string, who: Speaker | Speaker[], options: (StepOptions | undefined)[] = []): Step[] {
  const length = resolveList(key).length;
  const whoList = Array.isArray(who) ? who : null;
  return Array.from({ length }, (_, index) => ({
    who: whoList ? (whoList[index] ?? whoList[whoList.length - 1]) : who,
    text: { key, index },
    ...(options[index] ?? {}),
  }));
}

export function line(who: Speaker, key: string, options: StepOptions = {}, vars?: Record<string, unknown>): Step {
  return { who, text: T(key, vars), ...options };
}

/** A line whose text is a constant (English speech that stays English in every locale). */
export function literal(who: Speaker, text: string, options: StepOptions = {}): Step {
  return { who, text, ...options };
}

export function choiceIndex(key: string): number {
  const length = resolveList(key).length;
  return length ? Math.floor(Math.random() * length) : 0;
}

export const row = (id: string, value: TextRef | string): DocRow => ({
  id,
  label: T(`doc.field.${id}`),
  value,
});

type PassportCtor = new (options: PassportOptions) => Passport;

export function makePassport(
  cc: CountryCode,
  person: string,
  surname: string,
  given: string,
  dob: string,
  iss: string,
  sex: 'M' | 'F' = 'M',
  Ctor: PassportCtor = Passport,
  extraRow?: DocRow,
): Passport {
  const country = COUNTRIES[cc];
  const mrz = `P<${country.mrz}${surname.replace(/ /g, '<')}<<${given.replace(/[ .]/g, '<')}`
    .padEnd(28, '<')
    .slice(0, 28);
  const rows = [row('dob', dob), row('sex', sex), row('iss', iss), extraRow ?? row('exp', randDate(2027, 2034))];
  return new Ctor({
    country: country.passport,
    name: `${surname}, ${given}`,
    person,
    cover: country.cover,
    band: country.band,
    mrz,
    rows,
  });
}

export function usPassport(
  person: string,
  surname: string,
  given: string,
  dob: string,
  iss: string,
  sex: 'M' | 'F' = 'M',
): Passport {
  return makePassport('US', person, surname, given, dob, iss, sex);
}

export function device1(ip: string, loc: TextRef | string): Doc {
  return new Card([row('ip', ip), row('loc', loc)]);
}

export function device2(
  ip: string,
  loc: TextRef | string,
  tz: string,
  lang: string,
  device?: string,
): Doc {
  return new Card([
    row('ip', ip),
    row('loc', loc),
    row('tz', tz),
    row('lang', lang),
    row('device', device ?? pick(DEVICES)),
  ]);
}

export { accountCard, Card, Passport };

export function virtualCardValue(): TextRef {
  return T('data.virtualCard', { last4: digits(4) });
}
