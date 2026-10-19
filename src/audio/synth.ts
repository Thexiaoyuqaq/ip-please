/**
 * Procedural sound synthesis, ported from the original game's `sfx.js`.
 * Nothing is loaded from disk: every effect and music track is generated as
 * a Float32Array the first time it is played, then cached by `Sfx`.
 */

export const SR = 44100;

export const N = (duration: number): number => Math.max(1, Math.floor(duration * SR));

export function rng(seed: number): () => number {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function noise(n: number, seed: number): Float32Array {
  const r = rng(seed + 7);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = (r() + r() + r() + r() - 2) * 1.7;
  return x;
}

/** Second-order Butterworth (RBJ biquad); bandpass = highpass + lowpass in series. */
function biquad(x: Float32Array, type: 'lowpass' | 'highpass', f: number): Float32Array {
  f = Math.min(f, SR * 0.45);
  const w0 = (2 * Math.PI * f) / SR;
  const cs = Math.cos(w0);
  const al = Math.sin(w0) / (2 * Math.SQRT1_2);
  let b0: number, b1: number, b2: number;
  if (type === 'lowpass') {
    b0 = (1 - cs) / 2;
    b1 = 1 - cs;
    b2 = b0;
  } else {
    b0 = (1 + cs) / 2;
    b1 = -(1 + cs);
    b2 = b0;
  }
  const a0 = 1 + al;
  const a1 = -2 * cs;
  const a2 = 1 - al;
  const y = new Float32Array(x.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = (b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = yi;
    y[i] = yi;
  }
  return y;
}

export function filt(x: Float32Array, kind: 'lowpass' | 'highpass' | 'bandpass', f: number | [number, number]): Float32Array {
  if (kind === 'bandpass') {
    const [lo, hi] = f as [number, number];
    return biquad(biquad(x, 'highpass', lo), 'lowpass', hi);
  }
  return biquad(x, kind, f as number);
}

export const lin = (a: number, b: number, n: number): Float32Array => {
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = a + ((b - a) * i) / Math.max(1, n - 1);
  return x;
};

function phase(freq: number | Float32Array, n: number): Float32Array {
  const p = new Float32Array(n);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += typeof freq === 'number' ? freq : freq[i];
    p[i] = (2 * Math.PI * acc) / SR;
  }
  return p;
}

export function square(freq: number | Float32Array, n: number, duty = 0.5): Float32Array {
  const p = phase(freq, n);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = ((p[i] / (2 * Math.PI)) % 1) < duty ? 1 : -1;
  return x;
}

export function tri(freq: number | Float32Array, n: number): Float32Array {
  const p = phase(freq, n);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = 4 * Math.abs(((p[i] / (2 * Math.PI)) % 1) - 0.5) - 1;
  return x;
}

export function sine(freq: number | Float32Array, n: number): Float32Array {
  return phase(freq, n).map(Math.sin);
}

export function decay(n: number, tau: number): Float32Array {
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = Math.exp(-i / (tau * SR));
  return x;
}

export const mul = (a: Float32Array, b: Float32Array | number): Float32Array => {
  const x = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) x[i] = a[i] * (typeof b === 'number' ? b : b[i]);
  return x;
};

export const add = (a: Float32Array, b: Float32Array, g = 1): Float32Array => {
  const x = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) x[i] = a[i] + (i < b.length ? b[i] * g : 0);
  return x;
};

export function fade(x: Float32Array, attack = 0.004, release = 0.02): Float32Array {
  const n = x.length;
  const y = new Float32Array(n);
  const A = Math.max(1, attack * SR);
  const R = Math.max(1, release * SR);
  for (let i = 0; i < n; i++) y[i] = x[i] * Math.min(1, i / A) * Math.min(1, (n - i) / R);
  return y;
}

export function norm(x: Float32Array, peak = 1): Float32Array {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  return m > 0 ? mul(x, peak / m) : x;
}

export function cat(...parts: Float32Array[]): Float32Array {
  const n = parts.reduce((sum, p) => sum + p.length, 0);
  const x = new Float32Array(n);
  let offset = 0;
  for (const p of parts) {
    x.set(p, offset);
    offset += p.length;
  }
  return x;
}

export function place(out: Float32Array, t: number, x: Float32Array, g = 1): void {
  const p = N(t);
  for (let i = 0; i < x.length && p + i < out.length; i++) out[p + i] += x[i] * g;
}

// ———————————————— voices / ambience ————————————————

export function mumble(duration: number, pitch: number, seed: number, peak = 0.3): Float32Array {
  const r = rng(seed * 31 + 5);
  const out = new Float32Array(N(duration));
  const uni = (a: number, b: number) => a + (b - a) * r();
  let pos = 0;
  while (pos < out.length) {
    const n = Math.min(N(uni(0.06, 0.12)), out.length - pos);
    if (n < 64) break;
    const f0 = pitch * uni(0.85, 1.2);
    const glide = lin(f0, f0 * uni(0.85, 1.1), n);
    const p = phase(glide, n);
    const saw = new Float32Array(n);
    for (let i = 0; i < n; i++) saw[i] = ((p[i] / (2 * Math.PI)) % 1) * 2 - 1;
    const f1 = uni(450, 850);
    const f2 = uni(1100, 2200);
    const v = add(filt(saw, 'bandpass', [f1 * 0.7, f1 * 1.3]), filt(saw, 'bandpass', [f2 * 0.8, f2 * 1.2]), 0.6);
    out.set(fade(v, 0.012, 0.03).map((s, i) => s + out[pos + i]), pos);
    pos += n + N(uni(0.015, 0.05));
  }
  return norm(filt(out, 'lowpass', 3500), peak);
}

export function ambient(): Float32Array {
  const n = N(8);
  const wind = mul(filt(noise(n, 1), 'lowpass', 380), 3);
  const crowd = filt(noise(n, 2), 'bandpass', [220, 900]);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    crowd[i] *= 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t) * Math.sin(2 * Math.PI * 0.125 * t + 1);
  }
  return fade(norm(add(wind, crowd, 0.6), 0.06), 0.3, 0.3);
}

export function intercom(): Float32Array {
  const n = N(0.5);
  let v = cat(new Float32Array(N(0.04)), mumble(0.42, 150, 11, 1), new Float32Array(n)).slice(0, n);
  v = filt(add(v, noise(n, 12), 0.08), 'bandpass', [350, 2600]).map((s) => Math.tanh(s * 4));
  const click = noise(N(0.006), 13);
  return norm(add(v, click, 0.5), 0.4);
}

// ———————————————— desk sounds ————————————————

export function footstep(seed: number): Float32Array {
  const n = N(0.06);
  let x = mul(filt(noise(n, seed), 'lowpass', 900), decay(n, 0.012));
  x = add(x, mul(sine(90, n), decay(n, 0.02)), 0.6);
  return norm(x, 0.16);
}

export function paper(seed = 0): Float32Array {
  const n = N(0.18);
  const r = rng(seed + 100);
  const x = filt(noise(n, seed + 100), 'bandpass', [1800, 7000]);
  const crinkle = new Float32Array(n);
  for (let i = 0; i < n; i++) crinkle[i] = r() < 0.02 ? 0.5 + r() : 0;
  const cr = filt(crinkle, 'lowpass', 300);
  for (let i = 0; i < n; i++) {
    x[i] *= (0.6 + cr[i] * 8) * Math.min(1, i / N(0.02)) * Math.exp(-i / (0.05 * SR));
  }
  return norm(x, 0.2);
}

export function thud(): Float32Array {
  const n = N(0.25);
  let x = mul(sine(lin(120, 60, n), n), decay(n, 0.05));
  x = add(x, mul(filt(noise(n, 81), 'lowpass', 1200), decay(n, 0.01)));
  return add(norm(x, 0.45), paper(9), 0.6);
}

export function click(): Float32Array {
  const n = N(0.012);
  let x = mul(filt(noise(n, 21), 'highpass', 2000), decay(n, 0.002));
  x = add(x, mul(sine(2200, n), decay(n, 0.003)));
  return norm(x, 0.18);
}

const beep2 = (f1: number, d1: number, f2: number, d2: number, peak: number, dec?: number): Float32Array => {
  const a = square(f1, N(d1));
  let b = square(f2, N(d2));
  if (dec) b = mul(b, decay(b.length, dec));
  return norm(filt(fade(cat(a, b)), 'lowpass', 2500), peak);
};

export function discrepancy(): Float32Array {
  const n1 = N(0.12);
  const n2 = N(0.4);
  const a = mul(add(square(110, n1), square(155.6, n1)), 0.5);
  const b = mul(mul(add(square(98, n2), square(138.6, n2)), 0.5), decay(n2, 0.15));
  return norm(filt(fade(cat(a, b)), 'lowpass', 1400), 0.26);
}

export function tray(reverse = false): Float32Array {
  const n = N(0.26);
  const m = N(0.09);
  const sweep = filt(noise(n, 31), 'bandpass', [300, 2400]);
  for (let i = 0; i < n; i++) sweep[i] *= Math.sin((Math.PI * i) / n) * 0.7;
  let clunk = mul(add(sine(220, m), sine(331, m), 0.6), decay(m, 0.02));
  clunk = add(clunk, mul(filt(noise(m, 32), 'lowpass', 1500), decay(m, 0.01)));
  return norm(cat(sweep, clunk), reverse ? 0.18 : 0.26);
}

export function stamp(kind: 'approve' | 'deny'): Float32Array {
  const n = N(0.4);
  const f = kind === 'approve' ? lin(110, 50, n) : lin(95, 42, n);
  const th = mul(sine(f, n), decay(n, 0.09));
  const hit = mul(filt(noise(n, 41), 'lowpass', 1600), decay(n, 0.012));
  const check = mul(filt(noise(n, 42), 'bandpass', [2000, 6000]), decay(n, 0.006));
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = Math.tanh((th[i] + hit[i] * 0.8 + check[i] * 0.4) * 1.5);
  return norm(x, 0.85);
}

export function detainBtn(): Float32Array {
  const n = N(0.3);
  const gate = square(8, n);
  const x = mul(mul(square(220, n), gate.map((g) => (g > 0 ? 1 : 0))), decay(n, 0.2));
  return norm(filt(x, 'lowpass', 1800), 0.2);
}

export function scuffle(): Float32Array {
  const out = new Float32Array(N(1.2));
  const r = rng(91);
  for (let i = 0; i < 10; i++) place(out, i * 0.1 + r() * 0.03, footstep(60 + (i % 6)), 0.8 + r() * 0.6);
  place(out, 0.35, mumble(0.35, 95, 92, 0.25));
  return out;
}

export function printer(duration: number): Float32Array {
  const n = N(duration);
  const x = new Float32Array(n);
  const buzz = filt(square(55, n), 'lowpass', 900);
  const tick = filt(noise(n, 71), 'bandpass', [1500, 5000]);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    x[i] =
      buzz[i] * (0.5 + 0.5 * Math.sign(Math.sin(2 * Math.PI * 14 * t))) * 0.6 +
      tick[i] * (Math.sin(2 * Math.PI * 28 * t) > 0.8 ? 0.5 : 0);
  }
  return norm(fade(x, 0.01, 0.05), 0.16);
}

export function typekey(seed: number): Float32Array {
  const n = N(0.03);
  return norm(mul(filt(noise(n, 300 + seed), 'bandpass', [1200, 5000]), decay(n, 0.004)), 0.12);
}

export function whoosh(): Float32Array {
  const n = N(0.3);
  const x = filt(noise(n, 88), 'bandpass', [400, 3000]);
  for (let i = 0; i < n; i++) x[i] *= Math.sin((Math.PI * i) / n) ** 2;
  return norm(x, 0.2);
}

export function crowdFight(duration: number): Float32Array {
  const out = new Float32Array(N(duration));
  const r = rng(77);
  for (let i = 0; i < Math.floor(duration * 6); i++) {
    place(out, r() * (duration - 0.3), mumble(0.25, 110 + r() * 110, 400 + i, 0.25));
  }
  return norm(out, 0.3);
}

export function bell(): Float32Array {
  const n = N(1.6);
  let x = new Float32Array(n);
  for (const [f, g] of [
    [880, 1],
    [1320, 0.5],
    [2200, 0.25],
  ] as const) {
    x = add(x, mul(sine(f, n), decay(n, 0.5)), g);
  }
  return norm(x, 0.25);
}

export function gunshot(): Float32Array {
  const n = N(0.5);
  const shift = N(0.11);
  const crack = mul(filt(noise(n, 61), 'lowpass', 4000), decay(n, 0.02));
  const boom = mul(sine(lin(90, 40, n), n), decay(n, 0.12));
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = Math.tanh((crack[i] + boom[i] + (i >= shift ? crack[i - shift] * 0.25 : 0)) * 2);
  }
  return norm(x, 0.7);
}

export function siren(duration: number): Float32Array {
  const n = N(duration);
  const f = new Float32Array(n);
  for (let i = 0; i < n; i++) f[i] = 620 + (Math.sin((2 * Math.PI * 0.9 * i) / SR) > 0 ? 260 : 0);
  return norm(fade(filt(square(f, n, 0.4), 'lowpass', 2200), 0.05, 0.2), 0.16);
}

export function glitch(): Float32Array {
  const n = N(0.6);
  const x = new Float32Array(n);
  const r = rng(55);
  for (let k = 0; k < 14; k++) {
    const p = Math.floor(r() * (n - 2000));
    const m = 400 + Math.floor(r() * 1600);
    const sq = square(200 + r() * 1800, m);
    const g = 0.3 + r() * 0.7;
    for (let i = 0; i < m; i++) x[p + i] += sq[i] * g;
  }
  return norm(x, 0.25);
}

export function xray(): Float32Array {
  const n = N(0.8);
  const m = N(0.06);
  const a = sine(lin(80, 160, n), n);
  const b = sine(lin(160, 320, n), n);
  const beep = square(1320, m);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    x[i] = (a[i] + 0.5 * b[i]) * (0.6 + 0.4 * Math.sin((2 * Math.PI * 9 * i) / SR)) + (i >= n - m ? beep[i - n + m] * 0.5 : 0);
  }
  return norm(fade(x, 0.05, 0.05), 0.18);
}

// ———————————————— music (an original minor-key march) ————————————————

const mf = (m: number): number => 440 * 2 ** ((m - 69) / 12);

const THEME: readonly (readonly (readonly [number | null, number])[])[] = [
  [
    [62, 1],
    [62, 0.5],
    [64, 0.5],
    [65, 1],
    [69, 1],
  ],
  [
    [67, 1.5],
    [65, 0.5],
    [64, 2],
  ],
  [
    [60, 1],
    [64, 0.5],
    [65, 0.5],
    [67, 1],
    [70, 1],
  ],
  [
    [69, 3],
    [null, 1],
  ],
  [
    [74, 1],
    [72, 0.5],
    [70, 0.5],
    [69, 1],
    [65, 1],
  ],
  [
    [67, 1],
    [70, 0.5],
    [69, 0.5],
    [67, 1],
    [64, 1],
  ],
  [
    [65, 1],
    [64, 0.5],
    [62, 0.5],
    [61, 1],
    [64, 1],
  ],
  [
    [62, 3],
    [null, 1],
  ],
];

const CHORDS: readonly (readonly [number, readonly number[]])[] = [
  [38, [62, 65, 69]],
  [36, [60, 64, 67]],
  [36, [60, 64, 70]],
  [41, [65, 69, 72]],
  [46, [62, 65, 70]],
  [43, [62, 67, 70]],
  [45, [61, 64, 69]],
  [38, [62, 65, 69]],
];

function lead(m: number, duration: number): Float32Array {
  const n = N(duration);
  const f = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    f[i] = mf(m) * (1 + 0.006 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, t / 0.25));
  }
  const a = square(f, n, 0.25);
  const b = square(f.map((v) => v * 1.003), n);
  const c = sine(f.map((v) => v / 2), n);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    x[i] = (a[i] * 0.6 + b[i] * 0.4 + c[i] * 0.3) * Math.min(1, t / 0.012) * (0.75 + 0.25 * Math.exp(-t / 0.08));
  }
  return filt(fade(x, 0.005, 0.05), 'lowpass', 2600);
}

const bass = (m: number, duration: number): Float32Array =>
  fade(mul(tri(mf(m), N(duration)), decay(N(duration), 0.35)), 0.004, 0.04);

function pad(chord: readonly number[], duration: number): Float32Array {
  const n = N(duration);
  let x = new Float32Array(n);
  for (const m of chord) x = add(x, square(mf(m - 12), n), 1 / chord.length);
  for (let i = 0; i < n; i++) x[i] *= Math.min(1, i / SR / 0.15);
  return filt(fade(x, 0.02, 0.2), 'lowpass', 900);
}

const kick = (): Float32Array => {
  const n = N(0.3);
  return mul(sine(lin(75, 45, n), n), decay(n, 0.09));
};

const snare = (seed: number): Float32Array => {
  const n = N(0.14);
  return add(
    mul(filt(noise(n, 500 + seed), 'bandpass', [1500, 6000]), decay(n, 0.04)),
    mul(sine(190, n), decay(n, 0.03)),
    0.5,
  );
};

export function march(bars: readonly number[], bpm = 104, drums = true, leadG = 1, tail = 1.5): Float32Array {
  const beat = 60 / bpm;
  const bar = 4 * beat;
  const out = new Float32Array(N(bars.length * bar + tail));
  bars.forEach((b, bi) => {
    const t0 = bi * bar;
    let t = t0;
    for (const [note, beats] of THEME[b]) {
      if (note) {
        const last = bi === bars.length - 1 && beats >= 3;
        place(out, t, lead(note, beats * beat * (last ? 1.4 : 0.92)), 0.33 * leadG);
      }
      t += beats * beat;
    }
    const [root, chord] = CHORDS[b];
    for (let k = 0; k < 4; k++) place(out, t0 + k * beat, bass(k % 2 === 0 ? root : root + 7, beat * 0.85), 0.3);
    place(out, t0, pad(chord, bar), 0.1);
    if (drums) {
      for (let k = 0; k < 4; k++) {
        if (k % 2 === 0) place(out, t0 + k * beat, kick(), 0.5);
        else place(out, t0 + k * beat, snare(k + bi), 0.22);
      }
      if (b === 3 || b === 7) {
        for (let r = 0; r < 4; r++) place(out, t0 + 3 * beat + (r * beat) / 4, snare(20 + r), 0.12 + 0.03 * r);
      }
    }
  });
  return norm(out, 0.6);
}

export function dayHit(): Float32Array {
  const out = new Float32Array(N(1.6));
  for (let r = 0; r < 10; r++) place(out, r * 0.05, kick(), 0.15 + r * 0.03);
  place(out, 0.55, kick(), 1);
  place(out, 0.55, pad([62, 65, 69], 0.9), 0.35);
  return norm(out, 0.5);
}

/** The one sincere approval in the whole game: a D-major fanfare. */
export function fanfare(): Float32Array {
  const beat = 0.5;
  const out = new Float32Array(N(3.6));
  (
    [
      [62, 0.5],
      [66, 0.5],
      [69, 0.5],
      [74, 2.5],
    ] as const
  ).forEach(([m, b], i) => {
    place(out, i * 0.25, lead(m, b * beat), 0.4);
    place(out, i * 0.25, kick(), 0.4);
  });
  place(out, 0.75, pad([62, 66, 69, 74], 2.6), 0.18);
  place(out, 0.75, bass(38, 2), 0.4);
  return norm(out, 0.6);
}

/** Low drone + heartbeat. */
export function tension(duration: number): Float32Array {
  const n = N(duration);
  const drone = filt(add(mul(square(mf(26), n), 0.5), square(mf(33) * 1.002, n), 0.4), 'lowpass', 300);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = drone[i] * Math.min(1, i / SR / 1.5) * 0.5;
  for (let k = 0; k < duration - 0.3; k += 0.8) {
    place(out, k, kick(), 0.6);
    place(out, k + 0.2, kick(), 0.4);
  }
  return norm(fade(out, 0.1, 0.4), 0.35);
}

export const MAKERS: Record<string, () => Float32Array> = {
  gunshot,
  glitch,
  fanfare,
  xray,
  siren: () => siren(9),
  siren_short: () => siren(2.4),
  tension: () => tension(24),
  click,
  thud,
  intercom,
  discrepancy,
  scuffle,
  whoosh,
  bell,
  detain: detainBtn,
  inspect_on: () => beep2(330, 0.06, 495, 0.09, 0.13),
  inspect_off: () => beep2(495, 0.05, 330, 0.07, 0.09),
  select: () => norm(filt(fade(square(880, N(0.04))), 'lowpass', 3000), 0.1),
  citation: () => beep2(330, 0.15, 247, 0.3, 0.22, 0.12),
  tray: () => tray(false),
  tray_back: () => tray(true),
  stamp_deny: () => stamp('deny'),
  stamp_approve: () => stamp('approve'),
  title: () => march([0, 1, 2, 3]),
  end: () => march([4, 5, 6, 7]),
  sad: () => norm(march([6, 7], 84, false, 0.8, 2), 0.4),
  day_hit: dayHit,
  fight: () => crowdFight(3),
};
