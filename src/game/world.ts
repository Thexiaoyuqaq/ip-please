import { T, type TextRef } from '@/i18n/text';
import type { RGB } from '@/render/palette';

export type CountryCode = 'US' | 'UK' | 'JP' | 'DE' | 'SG';

export interface CityDef {
  id: string;
  tz: string;
  state: string;
  /** Dialing code prefix, e.g. `212` for New York. */
  phone: string;
  /** City name as printed on the passport. */
  en: string;
}

export interface CountryDef {
  /** ISO-3 code used in the passport MRZ. */
  mrz: string;
  /** Country name printed on the passport. */
  passport: string;
  cover: RGB;
  band: RGB;
  lang: string;
  cities: CityDef[];
  first: string[];
  last: string[];
  /** Lines spoken by ordinary, compliant visitors. */
  hello: string[];
  thanks: string[];
}

export const COUNTRIES: Record<CountryCode, CountryDef> = {
  US: {
    mrz: 'USA',
    passport: 'UNITED STATES OF AMERICA',
    cover: [42, 50, 76],
    band: [60, 70, 100],
    lang: 'en-US',
    cities: [
      { id: 'newYork', tz: 'America/New_York', state: 'NY', phone: '212', en: 'NEW YORK' },
      { id: 'losAngeles', tz: 'America/Los_Angeles', state: 'CA', phone: '213', en: 'LOS ANGELES' },
      { id: 'chicago', tz: 'America/Chicago', state: 'IL', phone: '312', en: 'CHICAGO' },
      { id: 'seattle', tz: 'America/Los_Angeles', state: 'WA', phone: '206', en: 'SEATTLE' },
      { id: 'houston', tz: 'America/Chicago', state: 'TX', phone: '713', en: 'HOUSTON' },
      { id: 'denver', tz: 'America/Denver', state: 'CO', phone: '720', en: 'DENVER' },
      { id: 'boston', tz: 'America/New_York', state: 'MA', phone: '617', en: 'BOSTON' },
    ],
    first: ['JAMES', 'MARY', 'ROBERT', 'LINDA', 'DAVID', 'SARAH', 'KEVIN', 'ASHLEY', 'BRIAN', 'MEGAN', 'JASON', 'NANCY'],
    last: ['MILLER', 'DAVIS', 'GARCIA', 'WILSON', 'MOORE', 'CLARK', 'LEWIS', 'HALL', 'YOUNG', 'KING', 'LOPEZ', 'NGUYEN'],
    hello: ['Hi.', 'Morning.', "How's it going?", 'Hey there.', 'Hello!'],
    thanks: ['Thanks!', 'Have a good one.', 'Cheers.'],
  },
  UK: {
    mrz: 'GBR',
    passport: 'UNITED KINGDOM',
    cover: [100, 30, 40],
    band: [130, 50, 60],
    lang: 'en-GB',
    cities: [
      { id: 'london', tz: 'Europe/London', state: 'LDN', phone: '+44 20', en: 'LONDON' },
      { id: 'manchester', tz: 'Europe/London', state: 'MAN', phone: '+44 161', en: 'MANCHESTER' },
    ],
    first: ['OLIVER', 'HARRY', 'AMELIA', 'GEORGE', 'EMMA', 'JACK'],
    last: ['SMITH', 'JONES', 'TAYLOR', 'EVANS', 'HUGHES', 'WRIGHT'],
    hello: ['Cheers, mate.', 'Lovely weather.', 'Good morning.'],
    thanks: ['Ta!', 'Brilliant.'],
  },
  JP: {
    mrz: 'JPN',
    passport: 'JAPAN',
    cover: [110, 30, 36],
    band: [140, 50, 52],
    lang: 'ja-JP',
    cities: [
      { id: 'tokyo', tz: 'Asia/Tokyo', state: 'TKY', phone: '+81 3', en: 'TOKYO' },
      { id: 'osaka', tz: 'Asia/Tokyo', state: 'OSK', phone: '+81 6', en: 'OSAKA' },
    ],
    first: ['HIROSHI', 'YUKI', 'KENJI', 'AIKO', 'TAKESHI', 'HANA'],
    last: ['TANAKA', 'SATO', 'SUZUKI', 'ITO', 'WATANABE', 'KATO'],
    hello: ['Konnichiwa!', 'Ohayou.', 'Hello desu.'],
    thanks: ['Arigato!', 'Domo.'],
  },
  DE: {
    mrz: 'DEU',
    passport: 'DEUTSCHLAND',
    cover: [80, 30, 36],
    band: [110, 46, 50],
    lang: 'de-DE',
    cities: [
      { id: 'berlin', tz: 'Europe/Berlin', state: 'BER', phone: '+49 30', en: 'BERLIN' },
      { id: 'munich', tz: 'Europe/Berlin', state: 'MUC', phone: '+49 89', en: 'MUNICH' },
    ],
    first: ['LUKAS', 'ANNA', 'FELIX', 'LENA', 'JONAS', 'MIA'],
    last: ['MULLER', 'SCHMIDT', 'WEBER', 'BECKER', 'WAGNER', 'KOCH'],
    hello: ['Guten Tag.', 'Hallo.', 'Moin.'],
    thanks: ['Danke.', 'Super.'],
  },
  SG: {
    mrz: 'SGP',
    passport: 'REPUBLIC OF SINGAPORE',
    cover: [150, 40, 40],
    band: [180, 60, 56],
    lang: 'en-SG',
    cities: [{ id: 'singapore', tz: 'Asia/Singapore', state: 'SG', phone: '+65', en: 'SINGAPORE' }],
    first: ['WEI MING', 'MEI LING', 'JUN JIE', 'HUI MIN', 'RAJ', 'SITI'],
    last: ['TAN', 'LIM', 'LEE', 'NG', 'KUMAR', 'WONG'],
    hello: ['Hello lah.', 'Morning!', 'Can or not?'],
    thanks: ['Thanks lah.', 'Steady.'],
  },
};

export type CnLocationId =
  | 'beijingUnicom'
  | 'shanghaiTelecom'
  | 'guangdongMobile'
  | 'sichuanTelecom'
  | 'jiangsuMobile'
  | 'hubeiTelecom'
  | 'zhejiangUnicom'
  | 'macau'
  | 'hongKong';

/** Mainland locations first; Hong Kong and Macau are the last two entries. */
export const CN_LOCS: CnLocationId[] = [
  'beijingUnicom',
  'shanghaiTelecom',
  'guangdongMobile',
  'sichuanTelecom',
  'jiangsuMobile',
  'hubeiTelecom',
  'zhejiangUnicom',
  'macau',
  'hongKong',
];

export const DEVICES = ['Windows 11', 'MacBook', 'iPhone', 'Android', 'iPad', 'Linux'];

export const STREETS = [
  '12 Oak St',
  '480 Pine Ave',
  '77 Maple Dr',
  '1500 Elm St',
  '23 Cedar Ln',
  '9 Lake Rd',
  '310 Hill St',
  '6 Birch Ct',
];

export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const rint = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rint(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const digits = (n: number): string => Array.from({ length: n }, () => rint(0, 9)).join('');

export function randIP(cn: boolean): string {
  const a = cn ? pick([36, 58, 106, 111, 115, 120, 183, 223]) : pick([23, 34, 45, 64, 72, 98, 104, 142, 172, 203]);
  return `${a}.${rint(1, 254)}.${rint(0, 255)}.${rint(1, 254)}`;
}

export function randDate(y0: number, y1: number): string {
  return `${rint(y0, y1)}.${String(rint(1, 12)).padStart(2, '0')}.${String(rint(1, 28)).padStart(2, '0')}`;
}

export function realPhone(cc: CountryCode, code: string): string {
  if (cc === 'US') return `+1 ${code}-${rint(2, 9)}${digits(2)}-${digits(4)}`;
  return `${code} ${digits(4)} ${digits(4)}`;
}

export function realPay(): string {
  return `${pick(['VISA', 'VISA', 'MASTERCARD', 'AMEX'])} ··${digits(4)}`;
}

export const countryRef = (cc: CountryCode): TextRef => T(`country.${cc}`);

export const cityRef = (cc: CountryCode, cityId: string): TextRef => T(`city.${cc}.${cityId}`);

/** Localized "United States · New York", or just "Singapore" for city-states. */
export function locationRef(cc: CountryCode, cityId?: string, home = false): TextRef {
  if (!cityId || cc === 'SG') return countryRef(cc);
  return T(home ? 'loc.fullHome' : 'loc.full', { country: countryRef(cc), city: cityRef(cc, cityId) });
}

export const cnLocationRef = (id: CnLocationId): TextRef => T(`loc.cn.${id}`);

/** Beijing time gets a friendly name in the discrepancy banner. */
export function timezoneRef(tz: string): TextRef | string {
  return tz === 'Asia/Shanghai' ? T('issue.tz.beijing') : tz;
}
