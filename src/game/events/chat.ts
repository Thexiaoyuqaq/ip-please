import { rt } from '@/engine/runtime';
import { now } from '@/engine/clock';
import { navigate } from '@/engine/navigation';
import { getCtx, rect, outline, seg, easeOut, lerp, spark, W, H } from '@/render/canvas';
import { K } from '@/render/palette';
import { txt, tw } from '@/render/text';
import { resolveRef, T } from '@/i18n/text';
import { steps } from '@/game/queue/spec';
import { S } from '@/game/state';
import type { Decision } from '@/game/state';
import type { EntrantSpec } from '@/game/queue/types';
import { B, later, newEntrant, runSteps } from '@/game/booth/state';
import { endDaySoon, leave, printDoc } from '@/game/booth/entrant';
import { Citation } from '@/game/docs';
import type { ChatCut } from '@/game/booth/types';

export const CHAT_TYPE_DELAY = 1;
export const CHAT_CPS = 9;

function createChatCut(): ChatCut {
  const msg = resolveRef(T('chat.message'));
  const send = CHAT_TYPE_DELAY + [...msg].length / CHAT_CPS + 0.5;
  const ban = send + 1;
  const mail = ban + 1.2;
  return { type: 'chat', t0: now + 1.2, msg, send, ban, mail, dur: mail + 4.6 };
}

/** Jorji, final form: approve him and the checkpoint chats with Claude. */
export function afterJorji5(ent: { spec: EntrantSpec }, decision: Decision | null): void {
  if (decision === 'approve') {
    B.cut = createChatCut();
    later(1.2, () => rt().sfx.ambient(false));
    return;
  }
  if (!ent.spec.requeued) {
    const again: EntrantSpec = {
      ...ent.spec,
      requeued: true,
      intro: steps('script.d6.requeue', 'E', [{ expr: 'sad' }]),
    };
    B.queue.splice(B.idx, 0, again);
  }
}

export function updateChat(): void {
  const cut = B.cut;
  if (!cut) return;
  const elapsed = now - cut.t0;
  if (elapsed < 0) return;
  const key = elapsed >= CHAT_TYPE_DELAY ? Math.floor((elapsed - CHAT_TYPE_DELAY) * CHAT_CPS) : -1;
  if (key !== cut.lastKey && key >= 0 && key < [...cut.msg].length) {
    cut.lastKey = key;
    rt().sfx.key(key);
  }
  const sfx = rt().sfx;
  for (const [at, fn] of [
    [cut.send, () => sfx.play('click', 1.5)],
    [
      cut.ban,
      () => {
        sfx.play('glitch');
        sfx.play('siren_short');
      },
    ],
    [cut.mail, () => sfx.play('citation', 1.2)],
  ] as const) {
    cut.fired ??= new Set<number>();
    if (elapsed >= at && !cut.fired.has(at)) {
      cut.fired.add(at);
      fn();
    }
  }
  if (elapsed >= cut.dur) chatDone();
}

export function chatDone(): void {
  if (!B.cut) return;
  B.cut = null;
  rt().sfx.ambient(true);
  const spec: EntrantSpec = { person: 'JORJI_SUIT', voice: 110, docs: [], intro: [], primary: '', ok: [] };
  const ent = newEntrant(spec, true);
  ent.noJudge = true;
  ent.expr = 'sad';
  B.ent = ent;
  const duration = runSteps(steps('script.d6.chat', ['E', 'E', 'C'], [undefined, { hold: 1.4 }, { hold: 1.1 }]), 0.4);
  later(duration + 0.4, () => leave(ent, 'deny'));
}

export function afterAuthor(decision: Decision | null): void {
  S.flags.ending = decision === 'approve' ? 'approve' : 'deny';
  if (decision === 'approve') {
    B.allTokens = true;
    later(0.6, () =>
      printDoc(
        new Citation([
          T('author.citation.approved'),
          T('author.citation.author'),
          T('author.citation.deduct'),
        ]),
        1.4,
        'cit',
      ),
    );
    later(2.4, endDaySoon);
  } else {
    later(1.5, () => navigate('erased'));
  }
}

function wrapWords(s: string, size: 8 | 10 | 12, width: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of s.split(' ')) {
    const candidate = `${current} ${word}`.trim();
    if (tw(candidate, size) > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawChat(): void {
  const cut = B.cut;
  if (!cut) return;
  const elapsed = now - cut.t0;
  rect(0, 0, W - 1, H - 1, 'rgb(30,28,28)');
  let x0 = 100;
  let x1 = 540;
  const y0 = 34;
  const y1 = 330;
  if (elapsed >= cut.ban && elapsed < cut.mail) {
    const jitter = ((Math.floor(elapsed * 30) * 7919) % 13) - 6;
    x0 += jitter;
    x1 += jitter;
  }
  rect(x0, y0, x1, y1, 'rgb(238,234,226)');
  rect(x0, y0, x1, y0 + 18, 'rgb(206,198,186)');
  spark(x0 + 12, y0 + 9, K.CLAUDE, false);
  txt(x0 + 22, y0 + 5, 'Claude', 10, K.INK);
  txt((x0 + x1) >> 1, y0 + 60, resolveRef(T('chat.greeting')), 12, K.TEXT_L, 'ma');
  const typed = elapsed >= CHAT_TYPE_DELAY ? Math.floor((elapsed - CHAT_TYPE_DELAY) * CHAT_CPS) : 0;
  const boxY = y1 - 34;
  rect(x0 + 14, boxY, x1 - 14, boxY + 22, K.WHITE);
  outline(x0 + 14, boxY, x1 - 14, boxY + 22, 'rgb(170,162,150)');
  if (elapsed < cut.send) {
    const text = [...cut.msg].slice(0, typed).join('');
    txt(x0 + 22, boxY + 6, text, 12, K.INK);
    if (Math.floor(elapsed * 3) % 2 === 0) {
      const cx = x0 + 22 + tw(text);
      rect(cx + 1, boxY + 5, cx + 1, boxY + 17, K.INK);
    }
  } else {
    const width = tw(cut.msg) + 16;
    rect(x1 - 20 - width, y0 + 110, x1 - 20, y0 + 132, 'rgb(226,214,196)');
    txt(x1 - 12 - width, y0 + 116, cut.msg, 12, K.INK);
  }
  if (elapsed >= cut.ban) {
    if (Math.floor((elapsed - cut.ban) * 6) % 2 === 0 || elapsed >= cut.mail) {
      const g = getCtx();
      g.fillStyle = 'rgba(170,20,20,0.45)';
      g.fillRect(0, 0, W, H);
    }
    if (elapsed < cut.mail) {
      glitchRows(elapsed);
    }
  }
  if (elapsed >= cut.mail) {
    const u = easeOut(seg(elapsed, cut.mail, cut.mail + 0.3));
    const mx0 = 150;
    const my0 = Math.round(lerp(H, 100, u));
    const mx1 = 490;
    const my1 = my0 + 160;
    rect(mx0 + 4, my0 + 4, mx1 + 4, my1 + 4, K.INK);
    rect(mx0, my0, mx1, my1, 'rgb(236,232,222)');
    rect(mx0, my0, mx1, my0 + 18, K.RED_D);
    txt(mx0 + 8, my0 + 5, resolveRef(T('chat.emailTitle')), 10, K.WHITE);
    txt(mx0 + 12, my0 + 28, resolveRef(T('chat.emailSubject')), 10, K.INK);
    rect(mx0 + 12, my0 + 44, mx1 - 12, my0 + 44, 'rgb(190,182,170)');
    wrapWords(resolveRef(T('chat.emailBody')), 10, mx1 - mx0 - 24).forEach((line, i) =>
      txt(mx0 + 12, my0 + 52 + i * 14, line, 10, K.INK),
    );
    txt(mx1 - 12, my1 - 18, resolveRef(T('chat.emailSign')), 10, K.RED_D, 'ra');
  }
  if (elapsed > cut.mail + 1) txt(W - 8, H - 14, resolveRef(T('common.clickContinue')), 8, K.GREY, 'ra');
}

function glitchRows(elapsed: number): void {
  const g = getCtx();
  let seed = Math.floor(elapsed * 30) * 9301 + 7;
  const random = (a: number, b: number) => {
    seed = (seed * 9301 + 49297) % 233280;
    return a + Math.floor((seed / 233280) * (b - a + 1));
  };
  for (let i = 0; i < 6; i++) {
    const yy = random(0, H - 8);
    const hh = random(2, 8);
    g.drawImage(rt().frame, 0, yy, W, hh, random(-20, 20), yy, W, hh);
  }
}
