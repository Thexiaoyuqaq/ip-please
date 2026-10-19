import { loadImages } from '@/assets';
import { Sfx } from '@/audio/sfx';
import { now, setNow } from '@/engine/clock';
import { setNavigate } from '@/engine/navigation';
import { rt, setRuntime, st, type SceneName } from '@/engine/runtime';
import { callNext, checkLeave, detain, onFirstPlace } from '@/game/booth/entrant';
import { chatDone, closeupDone, registerGameplayHooks, startEvent, updateChat, updateClones } from '@/game/events';
import { shootAt } from '@/game/events/clones';
import { RUSH_APPROVE, RUSH_DENY, rushPick } from '@/game/events/rush';
import { drawAlarm, drawChat, drawCloseup, drawEffects, drawRush } from '@/game/events/render';
import { inspectClick, setInspect } from '@/game/booth/inspect';
import { quiz } from '@/game/booth/quiz';
import { ruleTabHit, toggleRules } from '@/game/booth/rules';
import { setXray } from '@/game/booth/xray';
import { B, flash, runTimers, startDay } from '@/game/booth/state';
import { stamp, stampBtnBox, setTray, trayU, trayX } from '@/game/booth/stamps';
import { composeInspect, drawBooth } from '@/game/booth/render';
import {
  BOOK_BOX,
  DESK,
  DETAIN_BTN,
  INSPECT_BTN,
  QUIZ_BTN,
  RULE_BTN,
  SPEAKER,
  TRAY_Y0,
  TRAY_Y1,
  XRAY_BTN,
} from '@/game/booth/layout';
import type { DocumentInstance } from '@/game/booth/types';
import { Rulebook } from '@/game/docs';
import { isEvent } from '@/game/queue/types';
import { clearSave, newGame, S } from '@/game/state';
import { drawBoot } from '@/game/screens/boot';
import { drawDayCard } from '@/game/screens/daycard';
import { drawEnd, drawOver, RESTART_BTN } from '@/game/screens/end';
import { drawNews } from '@/game/screens/news';
import { initSummary, drawSummary, summaryClick } from '@/game/screens/summary';
import { drawTitle, titleClick } from '@/game/screens/title';
import { drawTyped, erasedLines, introLines, resetTypedSound, typedSounds } from '@/game/screens/typed';
import { T } from '@/i18n/text';
import { H, W, drawCursor, inBox, makeCanvas, setCtx } from '@/render/canvas';
import { K } from '@/render/palette';

export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly screen: CanvasRenderingContext2D;
  private readonly frame: HTMLCanvasElement;
  private readonly frameCtx: CanvasRenderingContext2D;
  private readonly sfx = new Sfx();
  private raf = 0;
  private disposed = false;
  private started = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = W;
    canvas.height = H;
    const screen = canvas.getContext('2d');
    if (!screen) throw new Error('2D canvas is not supported');
    this.screen = screen;
    const [frame, frameCtx] = makeCanvas(W, H);
    this.frame = frame;
    this.frameCtx = frameCtx;
    setRuntime({
      sfx: this.sfx,
      scene: 'boot',
      sceneT0: 0,
      ptr: { x: 320, y: 180, mouse: false, down: false },
      drag: null,
      canvas,
      screen,
      frame,
      frameCtx,
    });
    setNavigate((scene) => this.go(scene));
    registerGameplayHooks();
  }

  get audio(): Sfx {
    return this.sfx;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.bindInput();
    this.fit();
    window.addEventListener('resize', this.fit);
    newGame();
    await loadImages();
    rt().sceneT0 = now;
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.fit);
    this.unbindInput();
  }

  setMuted(muted: boolean): void {
    this.sfx.setMuted(muted);
  }

  // ———————————————————— scenes ————————————————————

  go(name: SceneName): void {
    const r = rt();
    r.scene = name;
    r.sceneT0 = now;
    resetTypedSound();
    this.sfx.ambient(name === 'booth');
    if (name === 'title') this.sfx.play('title', 0.8);
    if (name === 'daycard') this.sfx.play('day_hit');
    if (name === 'news') {
      this.sfx.play('whoosh');
      this.sfx.paper(31);
    }
    if (name === 'summary') {
      this.sfx.play('sad', 0.9);
      initSummary();
    }
    if (name === 'end') this.sfx.play('end', 0.8);
    if (name === 'booth') startDay();
  }

  private update(): void {
    const scene = rt().scene;
    if (scene === 'booth') {
      runTimers();
      if (B.cut) updateChat();
      if (B.event && B.event.type === 'clones') updateClones();
      const idle = !B.ent && !B.event && !B.cut && !B.closeup && !B.ending;
      const next = B.queue[B.idx];
      if (idle && isEvent(next) && now > B.lastFinish + 1.6) {
        B.idx++;
        startEvent(next);
      }
    }
    if (scene === 'intro') {
      typedSounds(introLines());
      if (st() > introLines().end) this.go('title');
    }
    if (scene === 'erased') {
      typedSounds(erasedLines());
      if (st() > erasedLines().end + 1) this.go('end');
    }
    if (scene === 'daycard' && st() > 1.9) this.go('news');
  }

  private render(): void {
    setCtx(this.frameCtx);
    const t = st();
    const scene = rt().scene;
    if (scene === 'boot') drawBoot();
    else if (scene === 'intro') drawTyped(introLines());
    else if (scene === 'erased') drawTyped(erasedLines());
    else if (scene === 'title') drawTitle(t);
    else if (scene === 'daycard') drawDayCard(t);
    else if (scene === 'news') drawNews(t);
    else if (scene === 'booth') {
      if (inChat()) drawChat();
      else drawBooth();
    } else if (scene === 'summary') drawSummary(t);
    else if (scene === 'end') drawEnd(t);
    else if (scene === 'over') drawOver(t);

    const g = this.screen;
    g.imageSmoothingEnabled = false;
    let ox = 0;
    let oy = 0;
    if (scene === 'booth') {
      const k = Math.floor((now - B.shake) * 30);
      if (k >= 0 && k < 4) [ox, oy] = [[0, 3], [1, -2], [-1, 1], [0, -1]][k];
    }
    g.fillStyle = K.INK;
    g.fillRect(0, 0, W, H);
    g.drawImage(this.frame, ox, oy);
    let cursor: 'hand' | 'arrow' | 'cross' = rt().drag ? 'hand' : 'arrow';
    if (scene === 'booth' && !inChat()) {
      if (B.insp.on) composeInspect(g);
      drawEffects(g);
      if (B.event && B.event.type === 'clones') {
        drawAlarm(g);
        cursor = 'cross';
      }
      if (B.event && B.event.type === 'rush') {
        setCtx(g);
        drawRush();
      }
      if (B.closeup) drawCloseup(g);
    }
    if (rt().ptr.mouse) {
      setCtx(g);
      drawCursor(rt().ptr.x, rt().ptr.y, cursor);
    }
  }

  // ———————————————————— input ————————————————————

  private bindInput(): void {
    this.canvas.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    this.canvas.addEventListener('contextmenu', this.preventDefault);
    window.addEventListener('keydown', this.onKeyDown);
  }

  private unbindInput(): void {
    this.canvas.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    this.canvas.removeEventListener('contextmenu', this.preventDefault);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private preventDefault = (event: Event): void => event.preventDefault();

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'm' || event.key === 'M') {
      const muted = this.sfx.toggleMute();
      window.dispatchEvent(new CustomEvent('ip-please:muted', { detail: muted }));
    }
  };

  private toGame(event: PointerEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    return [
      Math.floor(((event.clientX - rect.left) * W) / rect.width),
      Math.floor(((event.clientY - rect.top) * H) / rect.height),
    ];
  }

  private onDown = (event: PointerEvent): void => {
    this.sfx.init();
    const [x, y] = this.toGame(event);
    Object.assign(rt().ptr, { x, y, down: true, mouse: event.pointerType === 'mouse' });
    if (this.canvas.setPointerCapture) this.canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
    if (rt().scene === 'booth') this.boothInput(x, y);
    else this.sceneClick(x, y);
  };

  private onMove = (event: PointerEvent): void => {
    const [x, y] = this.toGame(event);
    Object.assign(rt().ptr, { x, y, mouse: event.pointerType === 'mouse' });
    if (rt().drag) this.dragMove(x, y);
  };

  private onUp = (event: PointerEvent): void => {
    const [x, y] = this.toGame(event);
    Object.assign(rt().ptr, { x, y, down: false });
    if (rt().drag) this.dragEnd(x, y);
  };

  private boothInput(x: number, y: number): void {
    if (B.cut) {
      if (now - B.cut.t0 > B.cut.mail + 1) chatDone();
      return;
    }
    if (inBox(x, y, RULE_BTN) && !B.event && !B.closeup) {
      toggleRules();
      return;
    }
    if (B.closeup) {
      if (now - B.closeup.t0 > 1.2) closeupDone();
      return;
    }
    if (B.event && B.event.type === 'clones') {
      if (y < 124) shootAt(x, y);
      return;
    }
    if (B.event && B.event.type === 'rush') {
      if (inBox(x, y, RUSH_APPROVE)) rushPick('approve');
      else if (inBox(x, y, RUSH_DENY)) rushPick('deny');
      return;
    }
    this.boothDown(x, y);
  }

  private boothDown(x: number, y: number): void {
    if (B.insp.on) {
      if (inBox(x, y, INSPECT_BTN)) return setInspect(false);
      if (S.day >= 4 && inBox(x, y, XRAY_BTN)) return setXray(!B.xray.on);
      return inspectClick(x, y);
    }
    const tx = trayX();
    const u = trayU();
    if (inBox(x, y, [tx - 14, 204, tx - 1, 244])) return setTray(!B.tray.open);
    if (u > 0.6) {
      for (const kind of ['approve', 'deny'] as const) {
        if (inBox(x, y, stampBtnBox(kind, tx))) return stamp(kind);
      }
      if (inBox(x, y, [tx, TRAY_Y0, W - 1, TRAY_Y1])) return;
    }
    if (inBox(x, y, INSPECT_BTN)) return setInspect(true);
    if (S.day >= 4 && inBox(x, y, XRAY_BTN)) return setXray(!B.xray.on);
    if (inBox(x, y, SPEAKER)) return callNext();
    if (S.day >= 2 && inBox(x, y, DETAIN_BTN)) return detain();
    if (S.day >= 2 && inBox(x, y, QUIZ_BTN)) return quiz();
    for (const doc of [...B.docs].reverse()) {
      const box = doc.big ? [doc.x, doc.y, doc.x + doc.doc.w - 1, doc.y + doc.doc.h - 1] : [doc.x, doc.y, doc.x + 18, doc.y + 12];
      if (doc.big && !inBox(x, y, DESK)) continue;
      if (inBox(x, y, box)) return this.dragStart(doc, x, y);
    }
    if (inBox(x, y, BOOK_BOX)) return toggleRules();
  }

  private dragStart(doc: DocumentInstance, x: number, y: number): void {
    B.docs = B.docs.filter((other) => other !== doc).concat([doc]);
    rt().drag = {
      d: doc,
      startedBig: doc.big,
      off: [x - doc.x, y - doc.y],
      prev: { big: doc.big, x: doc.x, y: doc.y },
      start: [x, y],
      moved: false,
    };
    this.sfx.paper(doc.x + doc.y);
  }

  private dragMove(x: number, y: number): void {
    const drag = rt().drag;
    if (!drag) return;
    const doc = drag.d;
    if (Math.hypot(x - drag.start[0], y - drag.start[1]) > 3) drag.moved = true;
    if (!drag.moved) return;
    if (x < DESK[0]) {
      doc.big = false;
      doc.x = x - 8;
      doc.y = y - 5;
      return;
    }
    doc.big = true;
    const offset: [number, number] = drag.startedBig ? drag.off : [Math.min(24, doc.doc.w / 2), 12];
    doc.x = Math.max(DESK[0] - offset[0], Math.min(W - 30, x - offset[0]));
    doc.y = Math.max(DESK[1] - 8, Math.min(H - 24, y - offset[1]));
  }

  private dragEnd(x: number, y: number): void {
    const drag = rt().drag;
    if (!drag) return;
    const doc = drag.d;
    const prev = drag.prev;
    const moved = drag.moved;
    rt().drag = null;
    if (!moved) {
      if (doc.big && ruleTabHit(doc, x, y)) {
        if (doc.doc instanceof Rulebook) doc.doc.flip();
        this.sfx.paper(2);
      }
      return;
    }
    if (doc.big) {
      if (doc.owner === 'ent' && doc.key === 'pp') this.sfx.play('thud', 0.6);
      else this.sfx.paper(x);
      if (doc.owner === 'ent') {
        S.tut.dragged = true;
        onFirstPlace(doc);
      }
      return;
    }
    // Dragged back to the window side.
    if (doc.key === 'cit' || doc.key === 'strip') {
      B.docs = B.docs.filter((other) => other !== doc);
      this.sfx.paper(3);
      return;
    }
    if (doc.key === 'note') {
      B.docs = B.docs.filter((other) => other !== doc);
      this.sfx.paper(3);
      S.flags.shredded = true;
      B.harmlessT = now;
      flash(T('booth.flash.noteThrown'));
      return;
    }
    if (doc.key === 'rule') {
      doc.x = prev.x;
      doc.y = prev.y;
      doc.big = true;
      toggleRules();
      return;
    }
    const ent = B.ent;
    const bounce = () => {
      Object.assign(doc, prev);
      if (!prev.big && doc.slot) {
        doc.x = doc.slot[0];
        doc.y = doc.slot[1];
      }
    };
    if (!ent || (ent.phase !== 'here' && ent.phase !== 'waiting')) {
      bounce();
      return;
    }
    if (doc.key === ent.spec.primary && !doc.marks.length) {
      bounce();
      if (prev.big) flash(T('booth.flash.stampFirst'));
      return;
    }
    if (!prev.big) {
      bounce();
      return;
    }
    B.docs = B.docs.filter((other) => other !== doc);
    doc.returned = true;
    this.sfx.paper(7);
    if (doc.key === ent.spec.primary) S.tut.returned = true;
    checkLeave();
  }

  private sceneClick(x: number, y: number): void {
    const scene = rt().scene;
    if (scene === 'boot') {
      this.go('intro');
      return;
    }
    if (scene === 'intro') {
      this.go('title');
      return;
    }
    if (scene === 'title') return titleClick(x, y);
    if (scene === 'news' && st() > 0.6) {
      this.go('booth');
      return;
    }
    if (scene === 'summary') return summaryClick(x, y);
    if (scene === 'erased' && st() > 1) {
      this.go('end');
      return;
    }
    if ((scene === 'end' || scene === 'over') && st() > 1.5 && inBox(x, y, RESTART_BTN)) {
      clearSave();
      newGame();
      this.go('daycard');
    }
  }

  private fit = (): void => {
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    this.canvas.style.width = `${Math.floor(W * scale)}px`;
    this.canvas.style.height = `${Math.floor(H * scale)}px`;
  };

  private loop = (timestamp: number): void => {
    if (this.disposed) return;
    setNow(timestamp / 1000);
    this.update();
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };
}

const inChat = (): boolean => !!B.cut && now >= B.cut.t0;
