import { rt, st } from '@/engine/runtime';
import { navigate } from '@/engine/navigation';
import { LAST_DAY } from '@/game/constants';
import { B } from '@/game/booth/state';
import { FAMILY_MEMBERS, S, clearSave, saveGame, type FamilyMemberKey, type FamilyMemberState } from '@/game/state';
import { resolveRef, T, type TextRef } from '@/i18n/text';
import { center, inBox, rect, outline } from '@/render/canvas';
import { K } from '@/render/palette';
import { txt, wrap } from '@/render/text';

export const CONTINUE_BTN = [430, 318, 620, 344] as const;

type ExpenseKey = 'data' | 'heat' | 'extra' | 'med' | 'gpu';

interface ExpenseRow {
  key: ExpenseKey;
  label: TextRef;
  cost: number;
}

interface SummaryState {
  start: number;
  pay: number;
  bonus: number;
  bribe: number;
  fines: number;
  correct: number;
  total: number;
  rows: ExpenseRow[];
  on: Partial<Record<ExpenseKey, boolean>>;
  final: boolean;
  boxes: Partial<Record<ExpenseKey, readonly [number, number, number, number]>>;
}

export let SUM: SummaryState | null = null;

export function initSummary(): void {
  const fam = S.family;
  if (S.day === 4) {
    if (!fam.opus.gone) fam.opus.sick = Math.max(fam.opus.sick || 0, 1);
    if (!fam.sonnet.gone && !fam.sonnet.gpuHappy) fam.sonnet.wantsGPU = true;
  }
  const final = S.day === LAST_DAY && S.flags.ending === 'approve';
  const rows: ExpenseRow[] = [
    { key: 'data', label: T('summary.rows.data'), cost: 5 },
    { key: 'heat', label: T('summary.rows.heat'), cost: 3 },
  ];
  if (!fam.opus.gone) rows.push({ key: 'extra', label: T('summary.rows.extra'), cost: 10 });
  if (FAMILY_MEMBERS.some((key) => fam[key].sick && !fam[key].gone)) {
    rows.push({ key: 'med', label: T('summary.rows.med'), cost: 10 });
  }
  if (fam.sonnet.wantsGPU && !fam.sonnet.gone) {
    rows.push({ key: 'gpu', label: T('summary.rows.gpu'), cost: 20 });
  }
  SUM = {
    start: S.savings,
    pay: B.pay,
    bonus: B.bonus,
    bribe: B.bribe,
    fines: B.fines,
    correct: B.correct,
    total: B.total,
    rows,
    on: {},
    final,
    boxes: {},
  };
  let left = SUM.start + SUM.pay + SUM.bonus + SUM.bribe - SUM.fines - 5;
  for (const row of rows) {
    if (left >= row.cost && row.key !== 'gpu') {
      left -= row.cost;
      SUM.on[row.key] = true;
    }
  }
}

export function sumBalance(): number {
  if (!SUM) return 0;
  if (SUM.final) return 0;
  let balance = SUM.start + SUM.pay + SUM.bonus + SUM.bribe - SUM.fines - 5;
  for (const row of SUM.rows) if (SUM.on[row.key]) balance -= row.cost;
  return balance;
}

export function familyAfter(): Record<FamilyMemberKey, FamilyMemberState> {
  if (!SUM) throw new Error('Summary is not initialized');
  const fam = JSON.parse(JSON.stringify(S.family)) as Record<FamilyMemberKey, FamilyMemberState>;
  const on = SUM.on;
  for (const key of FAMILY_MEMBERS) {
    const member = fam[key];
    if (member.gone) continue;
    if (key === 'opus') {
      member.hunger = on.data ? (on.extra ? 0 : Math.max(1, member.hunger)) : member.hunger + 2;
    } else {
      member.hunger = on.data ? Math.max(0, member.hunger - 1) : member.hunger + 1;
    }
    member.heat = on.heat ? 0 : member.heat + 1;
    if (member.sick) member.sick = on.med ? 0 : member.sick + 1;
    if (member.hunger >= 4 || member.sick >= 3 || member.heat >= 3) member.gone = true;
  }
  if (on.gpu) {
    fam.sonnet.wantsGPU = false;
    fam.sonnet.gpuHappy = true;
  } else {
    fam.sonnet.gpuHappy = false;
  }
  fam.haiku.overtime = !on.data || !on.heat;
  return fam;
}

type StatusLevel = 'ok' | 'warn' | 'bad' | 'good';

export function familyStatus(key: FamilyMemberKey, member: FamilyMemberState): [string, StatusLevel] {
  const status = (name: string, level: StatusLevel): [string, StatusLevel] => [resolveRef(T(`summary.status.${name}`)), level];
  if (member.gone) return status('deprecated', 'bad');
  if (member.sick) {
    if (key === 'opus') {
      return member.sick >= 2 ? status('sickOpusHeavy', 'bad') : status('sick', 'warn');
    }
    return member.sick >= 2 ? status('sickHeavy', 'bad') : status('sick', 'warn');
  }
  if (member.hunger >= 3) return status('starving', 'bad');
  if (key === 'sonnet' && member.heat > 0) return status('fever', 'warn');
  if (member.heat > 1) return status('overheated', 'bad');
  if (member.hunger === 2) return status('hungry', 'warn');
  if (member.hunger === 1) return status('peckish', 'warn');
  if (key === 'sonnet' && member.wantsGPU) return status('wantsGpu', 'warn');
  if (key === 'sonnet' && member.gpuHappy) return status('gpuHappy', 'good');
  if (key === 'haiku' && member.overtime) return status('overtime', 'warn');
  if (key === 'opus') return status('opusFed', 'good');
  return status('normal', 'ok');
}

export function ledgerRows(): [string, string][] {
  if (!SUM) return [];
  if (SUM.final) {
    const award = S.stats.wrong <= 5;
    return [
      [resolveRef(T('summary.ledger.savings')), `${SUM.start}`],
      [resolveRef(T('summary.ledger.wage')), `+${SUM.pay + SUM.bonus}`],
      [resolveRef(T(award ? 'summary.ledger.award' : 'summary.ledger.noAward')), award ? '+50' : '+0'],
      [resolveRef(T('summary.ledger.finalFine')), `-${resolveRef(T('summary.all'))}`],
    ];
  }
  const rows: [string, string][] = [
    [resolveRef(T('summary.ledger.savings')), `${SUM.start}`],
    [resolveRef(T('summary.ledger.wage')), `+${SUM.pay}`],
  ];
  if (SUM.bonus) rows.push([resolveRef(T('summary.ledger.bonus')), `+${SUM.bonus}`]);
  if (SUM.bribe) rows.push([resolveRef(T('summary.ledger.bribe')), `+${SUM.bribe}`]);
  if (SUM.fines) rows.push([resolveRef(T('summary.ledger.fine')), `-${SUM.fines}`]);
  rows.push([resolveRef(T('summary.ledger.electricity')), '-5']);
  return rows;
}

export function drawSummary(t: number): void {
  if (!SUM) return;
  rect(0, 0, 639, 359, K.INK);
  txt(320, 20, resolveRef(T('summary.header', { day: S.day })), 12, K.WHITE, 'ma');
  txt(320, 36, resolveRef(T('summary.stats', { total: SUM.total, correct: SUM.correct })), 10, K.GREY, 'ma');
  rect(60, 50, 580, 50, K.GREY_D);
  let y = 60;
  let k = 0;
  const shown = (i: number) => t >= 0.3 + i * 0.15;
  const token = resolveRef(T('summary.token'));
  for (const [label, value] of ledgerRows()) {
    if (!shown(k++)) return;
    txt(70, y, label, 12, K.GREY);
    txt(310, y, `${value} ${token}`, 12, value.startsWith('-') ? K.RED_L : K.WHITE, 'ra');
    y += 17;
  }
  SUM.boxes = {};
  const after = sumBalance();
  if (!SUM.final) {
    y += 2;
    txt(70, y, resolveRef(T('summary.optional')), 8, K.GREY_D);
    y += 12;
    for (const row of SUM.rows) {
      if (!shown(k++)) return;
      const on = !!SUM.on[row.key];
      const afford = on || after >= row.cost;
      SUM.boxes[row.key] = [66, y - 3, 314, y + 13];
      outline(70, y, 80, y + 10, afford ? K.WHITE : K.GREY_D);
      if (on) rect(72, y + 2, 78, y + 8, K.CLAUDE_L);
      txt(88, y, resolveRef(row.label), 12, afford ? K.WHITE : K.GREY_D);
      txt(310, y, `-${row.cost} ${token}`, 12, on ? K.RED_L : K.GREY_D, 'ra');
      y += 17;
    }
  }
  if (!shown(k++)) return;
  rect(70, y, 310, y, K.GREY_D);
  txt(70, y + 6, resolveRef(T('summary.balance')), 12, K.WHITE);
  txt(310, y + 6, `${after} ${token}`, 12, after < 0 ? K.RED_L : K.CLAUDE_L, 'ra');
  const fam = SUM.final ? S.family : familyAfter();
  let fy = 60;
  txt(370, fy - 2, resolveRef(T(SUM.final ? 'summary.family' : 'summary.familyTomorrow')), 10, K.GREY_D);
  fy += 14;
  for (const key of FAMILY_MEMBERS) {
    if (!shown(k++)) return;
    let [status, level] = familyStatus(key, fam[key]);
    if (SUM.final && key === 'opus') {
      [status, level] = fam.opus.gone
        ? [resolveRef(T('summary.status.opusFinalGone')), 'bad']
        : [resolveRef(T('summary.status.opusFinalFed')), 'good'];
    }
    const color = { ok: K.WHITE, warn: K.ORANGE, bad: K.RED_L, good: K.GREEN_L }[level];
    txt(370, fy, resolveRef(T(`summary.familyNames.${key}`)), 12, K.WHITE);
    wrap(status, 10, 250).forEach((line, i) => txt(370, fy + 15 + i * 12, line, 10, color));
    fy += 36;
  }
  if (!shown(k + 1)) return;
  const label = SUM.final
    ? resolveRef(T('summary.buttons.final'))
    : resolveRef(T(after < 0 ? 'summary.buttons.over' : 'summary.buttons.next'));
  rect(...CONTINUE_BTN, K.RED_D);
  outline(...CONTINUE_BTN, K.RED_L);
  txt(center(CONTINUE_BTN)[0], CONTINUE_BTN[1] + 7, label, 12, K.WHITE, 'ma');
}

export function summaryClick(x: number, y: number): void {
  if (!SUM || st() < 1.2) return;
  for (const row of SUM.rows) {
    const box = SUM.boxes[row.key];
    if (!box || !inBox(x, y, box)) continue;
    if (SUM.on[row.key]) {
      SUM.on[row.key] = false;
      if (row.key === 'data') SUM.on.extra = false;
    } else if (sumBalance() >= row.cost && (row.key !== 'extra' || SUM.on.data)) {
      SUM.on[row.key] = true;
    }
    rt().sfx.play('select');
    return;
  }
  if (!inBox(x, y, CONTINUE_BTN)) return;
  rt().sfx.play('click');
  if (SUM.final) {
    S.savings = 0;
    clearSave();
    navigate('end');
    return;
  }
  const balance = sumBalance();
  S.family = familyAfter();
  S.savings = balance;
  if (balance < 0) {
    clearSave();
    navigate('over');
    return;
  }
  S.day++;
  saveGame();
  navigate('daycard');
}
