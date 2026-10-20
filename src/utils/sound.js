// Bütün səslər brauzerdə Web Audio API ilə sintez olunur — audio faylı yoxdur.
// Zəncir: səs → master → compressor (zərbələr "yığcam" çıxsın) → çıxış
//          səs → reverb göndərişi (məkan hissi) → master
const STORAGE_KEY = "pokemon-arena:muted";

let ctx = null;
let master = null;
let reverbSend = null;
let noiseBuffer = null;
let lastHover = 0;

// Səs söndürülüb-söndürülməyib (seçim yadda saxlanılır)
let muted = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
})();

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  if (value) stopMusic();
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* localStorage bağlıdırsa problem deyil */
  }
}

// Süni "otaq" səsi: sönən küydən hazırlanmış impuls
function makeImpulse(c, seconds, decay) {
  const length = Math.floor(c.sampleRate * seconds);
  const buffer = c.createBuffer(2, length, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}

// AudioContext brauzer siyasətinə görə yalnız istifadəçi hərəkətindən sonra yaradılır
function getCtx() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(compressor);
    compressor.connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, 1.1, 2.5);
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.25;
    reverbSend.connect(reverb);
    reverb.connect(master);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ---------------------------------------------------------------------------
// Aşağı səviyyəli "səs yaradıcılar". Hamısı mütləq vaxt (t) qəbul edir.
// ---------------------------------------------------------------------------

// Rəngli ton: tezlik sürüşməsi, filtr, pan və reverb göndərişi ilə
function voice(
  c,
  { type = "sine", freq, to, t, dur, vol = 0.2, attack = 0.008, detune = 0, lp, lpTo, pan = 0, wet = 0, out = master }
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  let node = osc;
  if (lp) {
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(lp, t);
    if (lpTo) filter.frequency.exponentialRampToValueAtTime(lpTo, t + dur);
    osc.connect(filter);
    node = filter;
  }
  node.connect(gain);

  let end = gain;
  if (pan && c.createStereoPanner) {
    const panner = c.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner);
    end = panner;
  }
  end.connect(out);
  if (wet) {
    const send = c.createGain();
    send.gain.value = wet;
    end.connect(send);
    send.connect(reverbSend);
  }

  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Küy: külək, partlayış, zərbə "snap"ı, alqış üçün
function hiss(
  c,
  { t, dur, vol = 0.2, type = "bandpass", freq = 1000, to, q = 1, attack = 0.005, wet = 0, out = master }
) {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, t);
  if (to) filter.frequency.exponentialRampToValueAtTime(to, t + dur);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  if (wet) {
    const send = c.createGain();
    send.gain.value = wet;
    gain.connect(send);
    send.connect(reverbSend);
  }

  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

const rand = (min, max) => min + Math.random() * (max - min);

// Bütün ictimai funksiyalar bu qaydada başlayır: ctx yoxdursa (səssiz) heç nə etmirik
function run(fn) {
  const c = getCtx();
  if (c) fn(c, c.currentTime);
}

// ---------------------------------------------------------------------------
// Hücum səsləri — hər tipin öz xarakteri var (~0.25s, şar uçarkən)
// ---------------------------------------------------------------------------
const LAUNCH = {
  // Alov: yüksələn "vuuş" + çıtıltı
  fire(c, t) {
    hiss(c, { t, dur: 0.24, vol: 0.2, freq: 400, to: 2600, q: 0.8 });
    voice(c, { type: "sawtooth", freq: 150, to: 90, t, dur: 0.24, vol: 0.06, lp: 600 });
    for (let i = 0; i < 6; i++) {
      hiss(c, { t: t + rand(0, 0.22), dur: 0.03, vol: 0.12, type: "highpass", freq: 3000 });
    }
  },
  // Su: qabarcıqlar + sıçrayış
  water(c, t) {
    voice(c, { freq: 300, to: 900, t, dur: 0.09, vol: 0.16 });
    voice(c, { freq: 500, to: 1200, t: t + 0.06, dur: 0.09, vol: 0.14 });
    voice(c, { freq: 400, to: 1000, t: t + 0.12, dur: 0.09, vol: 0.12 });
    hiss(c, { t: t + 0.05, dur: 0.2, vol: 0.08, type: "highpass", freq: 2500 });
  },
  // Elektrik: sürətli sıçrayan "zzzt"
  electric(c, t) {
    for (let i = 0; i < 8; i++) {
      voice(c, { type: "square", freq: rand(600, 2400), t: t + i * 0.028, dur: 0.03, vol: 0.07 });
    }
    hiss(c, { t, dur: 0.22, vol: 0.09, type: "highpass", freq: 4000 });
  },
  // Zəhər / kabus: aşağı düşən, qəribə səslənən iki tən olmayan ton
  poison(c, t) {
    voice(c, { type: "sawtooth", freq: 300, to: 120, t, dur: 0.28, vol: 0.07, detune: -14, lp: 1200, lpTo: 300 });
    voice(c, { type: "sawtooth", freq: 300, to: 120, t, dur: 0.28, vol: 0.07, detune: 14, lp: 1200, lpTo: 300 });
    voice(c, { type: "triangle", freq: 200, to: 420, t: t + 0.1, dur: 0.14, vol: 0.07, wet: 0.2 });
  },
  // Uçan: külək
  flying(c, t) {
    hiss(c, { t, dur: 0.26, vol: 0.16, freq: 600, to: 1800, q: 0.7, attack: 0.06 });
    voice(c, { freq: 500, to: 900, t, dur: 0.22, vol: 0.05 });
  },
  // Həşərat: cırıltılı cik-cik
  bug(c, t) {
    for (let i = 0; i < 4; i++) {
      voice(c, { type: "triangle", freq: 1400, to: 2200, t: t + i * 0.05, dur: 0.04, vol: 0.08 });
    }
  },
  // Adi: sadə "vızz"
  normal(c, t) {
    hiss(c, { t, dur: 0.16, vol: 0.16, freq: 900, to: 400 });
    voice(c, { freq: 400, to: 200, t, dur: 0.16, vol: 0.09 });
  },
};

// Zərbə: gur "thump" + snap + qırılma + metal parıltısı. Zərər nə qədər böyükdürsə, bir o qədər güclü.
function impact(c, t, damage) {
  const s = Math.min(Math.max(damage / 45, 0.4), 1);
  voice(c, { freq: 170, to: 38, t, dur: 0.22, vol: 0.5 * s, wet: 0.05 });
  hiss(c, { t, dur: 0.08, vol: 0.35 * s, freq: 1800, q: 1.2 });
  voice(c, { type: "square", freq: 330, to: 90, t, dur: 0.12, vol: 0.12 * s, lp: 1800 });
  voice(c, { type: "triangle", freq: 1200, to: 900, t, dur: 0.2, vol: 0.06 * s, wet: 0.2 });
  if (damage >= 35) hiss(c, { t, dur: 0.28, vol: 0.12, type: "highpass", freq: 3000, wet: 0.15 }); // ağır zərbə
}

// KO: aşağı düşən "vııııu" + kədərli trombon "vaa-vaa-vaaa"
function knockout(c, t) {
  voice(c, { type: "sawtooth", freq: 520, to: 60, t, dur: 0.65, vol: 0.14, lp: 2500, lpTo: 200, wet: 0.15 });
  [
    [349, 0.3, 0.1],
    [330, 0.4, 0.1],
    [294, 0.5, 0.35],
  ].forEach(([freq, at, dur]) =>
    voice(c, { type: "sawtooth", freq, t: t + at, dur, vol: 0.09, lp: 1100, wet: 0.1 })
  );
}

// ---------------------------------------------------------------------------
// Döyüşün başlanğıcı və sonu
// ---------------------------------------------------------------------------

// Döyüş başlayır: 3 nağara zərbəsi, yüksələn sürüşmə, "FIGHT!" akordu
export function playBattleStart() {
  run((c, t) => {
    [0, 0.2, 0.4].forEach((at) => {
      voice(c, { freq: 150, to: 40, t: t + at, dur: 0.18, vol: 0.45 });
      hiss(c, { t: t + at, dur: 0.06, vol: 0.18, freq: 1500 });
    });
    voice(c, { type: "sawtooth", freq: 120, to: 900, t, dur: 0.55, vol: 0.06, lp: 2000 });
    [220, 330, 440].forEach((freq) =>
      voice(c, { type: "sawtooth", freq, t: t + 0.55, dur: 0.35, vol: 0.06, lp: 1800, wet: 0.3 })
    );
  });
}

// Qalib elan olunur: fanfar + parıltı + izdiham alqışı
export function playWin() {
  stopMusic();
  run((c, t) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      voice(c, { type: "sawtooth", freq, t: t + i * 0.1, dur: 0.2, vol: 0.08, lp: 3000 });
      voice(c, { type: "square", freq, t: t + i * 0.1, dur: 0.2, vol: 0.04 });
    });
    // Son akkord
    [523.25, 659.25, 783.99, 1046.5].forEach((freq) =>
      voice(c, { type: "triangle", freq, t: t + 0.45, dur: 1.0, vol: 0.09, wet: 0.3 })
    );
    // Parıltı
    for (let i = 0; i < 7; i++) {
      voice(c, { freq: rand(2000, 4200), t: t + 0.45 + i * 0.1, dur: 0.14, vol: 0.04, wet: 0.3, pan: rand(-0.8, 0.8) });
    }
    // Alqış: yavaş-yavaş güclənib sönən küy
    hiss(c, { t: t + 0.3, dur: 1.5, vol: 0.12, freq: 1400, q: 0.6, attack: 0.4, wet: 0.2 });
  });
}

// ---------------------------------------------------------------------------
// Döyüş musiqisi: 160 BPM, a-minor, 8-bit üslubunda (nağara + bas + melodiya)
// ---------------------------------------------------------------------------
const STEP = 60 / 160 / 4; // bir 16-lıq not
const BASS = [55, 0, 55, 0, 55, 0, 65.41, 0, 49, 0, 49, 0, 49, 0, 73.42, 0];
const LEAD = [440, 0, 523.25, 0, 659.25, 0, 523.25, 0, 392, 0, 493.88, 0, 587.33, 0, 493.88, 659.25];

let musicBus = null;
let musicTimer = null;
let musicStep = 0;
let nextTime = 0;

function scheduleStep(c, step, t) {
  const i = step % 16;
  const out = musicBus;
  if (i % 4 === 0) voice(c, { freq: 140, to: 40, t, dur: 0.14, vol: 0.4, out }); // kick
  if (i === 4 || i === 12) {
    hiss(c, { t, dur: 0.1, vol: 0.16, freq: 1900, out }); // snare
    voice(c, { type: "triangle", freq: 200, to: 120, t, dur: 0.06, vol: 0.1, out });
  }
  if (i % 2 === 0) hiss(c, { t, dur: 0.03, vol: 0.05, type: "highpass", freq: 7000, out }); // hat
  if (BASS[i]) voice(c, { type: "square", freq: BASS[i], t, dur: STEP * 1.6, vol: 0.12, lp: 700, out });
  if (LEAD[i]) voice(c, { type: "square", freq: LEAD[i], t, dur: STEP * 1.4, vol: 0.035, wet: 0.15, out });
}

// Döyüş boyu çalır; planlaşdırma 0.25s qabağa gedir ki, səs qırılmasın
export function startMusic() {
  const c = getCtx();
  if (!c) return;
  stopMusic();
  musicBus = c.createGain();
  musicBus.gain.value = 0.5;
  musicBus.connect(master);
  musicStep = 0;
  nextTime = c.currentTime + 0.3;

  const loop = () => {
    while (nextTime < c.currentTime + 0.25) {
      scheduleStep(c, musicStep++, nextTime);
      nextTime += STEP;
    }
    musicTimer = setTimeout(loop, 60);
  };
  loop();
}

// Musiqini yumşaq söndürür
export function stopMusic() {
  clearTimeout(musicTimer);
  musicTimer = null;
  if (musicBus && ctx) {
    const bus = musicBus;
    bus.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    setTimeout(() => bus.disconnect(), 500);
  }
  musicBus = null;
}

// ---------------------------------------------------------------------------
// Interfeys səsləri
// ---------------------------------------------------------------------------

// Kartın üzərinə gələndə yüngül "tik" (60ms-dən tez təkrarlanmır)
export function playHover() {
  const now = performance.now();
  if (now - lastHover < 60) return;
  lastHover = now;
  run((c, t) => voice(c, { type: "triangle", freq: 900, to: 1300, t, dur: 0.05, vol: 0.05 }));
}

// Modal açılanda: yuxarı iki notlu cingilti
export const playOpen = () =>
  run((c, t) => {
    voice(c, { type: "triangle", freq: 520, t, dur: 0.1, vol: 0.12, wet: 0.15 });
    voice(c, { type: "triangle", freq: 780, t: t + 0.07, dur: 0.14, vol: 0.12, wet: 0.15 });
  });

// Modal bağlananda: aşağı iki not
export const playClose = () =>
  run((c, t) => {
    voice(c, { type: "triangle", freq: 780, t, dur: 0.08, vol: 0.1 });
    voice(c, { type: "triangle", freq: 520, t: t + 0.06, dur: 0.1, vol: 0.1 });
  });

// Səs düyməsi ilə açanda təsdiq səsi
export const playClick = () =>
  run((c, t) => voice(c, { type: "square", freq: 620, to: 320, t, dur: 0.07, vol: 0.1 }));

// ---------------------------------------------------------------------------
// Yeni hadisələr: boş atış, kritik zərbə, tip üstünlüyü, mərc nəticəsi
// ---------------------------------------------------------------------------

// Boş atış: hədəf yayınır — qısa "fiuu"
function whoosh(c, t) {
  hiss(c, { t, dur: 0.22, vol: 0.14, freq: 2200, to: 500, q: 0.8, attack: 0.03 });
}

// Kritik zərbə: kəskin "zap" + parıltı
function critSting(c, t) {
  voice(c, { type: "square", freq: 900, to: 2400, t, dur: 0.12, vol: 0.12 });
  voice(c, { type: "sawtooth", freq: 120, to: 50, t, dur: 0.3, vol: 0.3, lp: 900 });
  hiss(c, { t, dur: 0.35, vol: 0.14, type: "highpass", freq: 3500, wet: 0.2 });
}

// Çox təsirli: yüksələn 3 notlu "ding"
function superDing(c, t) {
  [880, 1175, 1568].forEach((freq, i) =>
    voice(c, { type: "triangle", freq, t: t + i * 0.06, dur: 0.14, vol: 0.1, wet: 0.2 })
  );
}

// Az təsirli: boğuq "dup"
function resistThud(c, t) {
  voice(c, { type: "square", freq: 180, to: 90, t, dur: 0.12, vol: 0.08, lp: 500 });
}

export function playHit({ type, damage, ko, miss = false, crit = false, mult = 1 }) {
  run((c, t) => {
    (LAUNCH[type] ?? LAUNCH.normal)(c, t);
    if (miss) return whoosh(c, t + 0.2);
    impact(c, t + 0.2, damage);
    if (crit) critSting(c, t + 0.2);
    if (mult > 1) superDing(c, t + 0.3);
    else if (mult < 1) resistThud(c, t + 0.22);
    if (ko) knockout(c, t + 0.2);
  });
}

// Mərc: qazandın — sikkə cingiltisi
export const playCoins = () =>
  run((c, t) => {
    [988, 1319, 1319, 1568].forEach((freq, i) =>
      voice(c, { type: "square", freq, t: t + i * 0.07, dur: 0.12, vol: 0.07, wet: 0.2 })
    );
    for (let i = 0; i < 5; i++) {
      voice(c, { freq: rand(2500, 4500), t: t + 0.3 + i * 0.06, dur: 0.1, vol: 0.04, wet: 0.3, pan: rand(-0.7, 0.7) });
    }
  });

// Mərc: uduzdun — enən "vaa-vaa"
export const playBust = () =>
  run((c, t) => {
    [330, 277, 233].forEach((freq, i) =>
      voice(c, { type: "sawtooth", freq, t: t + i * 0.16, dur: i === 2 ? 0.5 : 0.15, vol: 0.07, lp: 1000, wet: 0.1 })
    );
  });

// Mərc seçimi / çip kliki
export const playChip = () =>
  run((c, t) => voice(c, { type: "triangle", freq: 700, to: 1000, t, dur: 0.06, vol: 0.09 }));
