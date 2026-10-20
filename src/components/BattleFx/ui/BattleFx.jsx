import { useEffect, useRef, useState } from "react";
import { getTypeColor } from "../../../data/pokemon";
import styles from "../styles/BattleFx.module.css";

const LIFETIME_MS = 1100;

const rand = (min, max) => min + Math.random() * (max - min);
const range = (n) => Array.from({ length: n }, (_, i) => i);

// Hər tipin öz effekti:
//  flight — hücum edəndən hədəfə uçan hissəciklər (cls: CSS sinfi, spread: yan sapma, size: ölçü)
//  burst  — hədəfdə partlayış hissəcikləri (dist: məsafə)
//  bolt   — true olsa, uçuş əvəzinə şimşək xətti çəkilir
const FX = {
  fire: {
    flight: { count: 8, cls: "fFire", spread: 7, size: [10, 28], stagger: 0.025 },
    burst: { count: 12, cls: "bEmber", dist: [34, 78], size: [6, 14] },
  },
  water: {
    flight: { count: 7, cls: "fDrop", spread: 12, size: [9, 20], stagger: 0.02 },
    burst: { count: 11, cls: "bDrop", dist: [26, 66], size: [6, 12], gravity: true },
  },
  electric: {
    bolt: true,
    flight: { count: 0 },
    burst: { count: 10, cls: "bSpark", dist: [30, 80], size: [4, 8] },
  },
  poison: {
    flight: { count: 4, cls: "fToxic", spread: 8, size: [20, 32], stagger: 0.04 },
    burst: { count: 7, cls: "bCloud", dist: [14, 40], size: [34, 62] },
  },
  flying: {
    flight: { count: 1, cls: "fSlash", spread: 0, size: [38, 38], stagger: 0 },
    wind: 4,
    burst: { count: 7, cls: "bFeather", dist: [30, 74], size: [8, 15] },
  },
  bug: {
    flight: { count: 11, cls: "fBug", spread: 26, size: [6, 10], stagger: 0.012 },
    burst: { count: 9, cls: "bBug", dist: [24, 62], size: [5, 9] },
  },
  normal: {
    flight: { count: 1, cls: "fStar", spread: 0, size: [30, 30], stagger: 0 },
    burst: { count: 8, cls: "bStar", dist: [28, 64], size: [8, 14] },
  },
};

// Şimşək: iki nöqtə arasında qırıq xətt (hər dəfə fərqli)
function boltPoints(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const segs = Math.max(6, Math.round(len / 38));
  const pts = [[x0, y0]];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const off = rand(-26, 26);
    pts.push([x0 + dx * t + nx * off, y0 + dy * t + ny * off]);
  }
  pts.push([x1, y1]);
  return pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
}

// Bir zərbə üçün bütün effekt məlumatını hazırlayır
function build(event, a, t) {
  const cfg = FX[event.type] ?? FX.normal;
  const x0 = a.left + a.width / 2;
  const y0 = a.top + a.height / 2;
  const x1 = t.left + t.width / 2;
  const y1 = t.top + t.height / 2;
  const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;

  const flight = range(cfg.flight.count).map((k) => ({
    k,
    cls: cfg.flight.cls,
    ox: rand(-cfg.flight.spread, cfg.flight.spread),
    oy: rand(-cfg.flight.spread, cfg.flight.spread),
    d: k * (cfg.flight.stagger ?? 0),
    sz: rand(...cfg.flight.size),
  }));

  // Uçan: hava xətləri (arxada qalan külək cizgiləri)
  const wind = range(cfg.wind ?? 0).map((k) => ({
    k,
    cls: "fWind",
    ox: rand(-16, 16),
    oy: rand(-16, 16),
    d: 0.02 + k * 0.025,
    sz: rand(22, 40),
  }));

  const burst = range(cfg.burst.count).map((k) => {
    const ang = (k / cfg.burst.count) * Math.PI * 2 + rand(-0.3, 0.3);
    const dist = rand(...cfg.burst.dist) * (event.crit ? 1.35 : 1);
    return {
      k,
      cls: cfg.burst.cls,
      bx: Math.cos(ang) * dist,
      by: Math.sin(ang) * dist,
      sz: rand(...cfg.burst.size) * (event.crit ? 1.25 : 1),
      gravity: cfg.burst.gravity,
    };
  });

  return {
    id: event.n,
    x0, y0, x1, y1, angle,
    color: getTypeColor(event.type),
    type: event.type,
    damage: event.damage,
    ko: event.ko,
    miss: event.miss,
    crit: event.crit,
    mult: event.mult,
    flight: [...flight, ...wind],
    burst,
    bolt: cfg.bolt && !event.miss ? boltPoints(x0, y0, x1, y1) : null,
  };
}

// Hücum edən kartdan hədəf karta uçan tip effekti, zərbə partlayışı və "-zərər" rəqəmi.
// Mövqelər kartların data-pid atributu ilə tapılır.
export default function BattleFx({ event }) {
  const [items, setItems] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    if (!event) return;
    const from = document.querySelector(`[data-pid="${event.attackerId}"]`);
    const to = document.querySelector(`[data-pid="${event.targetId}"]`);
    if (!from || !to) return;

    const item = build(event, from.getBoundingClientRect(), to.getBoundingClientRect());
    setItems((list) => [...list, item]);
    // Effekt bitəndən sonra DOM-dan silirik
    timers.current.push(
      setTimeout(() => setItems((list) => list.filter((i) => i.id !== item.id)), LIFETIME_MS)
    );
  }, [event]);

  // Komponent silinəndə bütün timeout-ları təmizləyirik
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <div className={styles.layer} aria-hidden="true">
      {items.map((i) => (
        <div
          key={i.id}
          style={{
            "--x0": `${i.x0}px`,
            "--y0": `${i.y0}px`,
            "--x1": `${i.x1}px`,
            "--y1": `${i.y1}px`,
            "--c": i.color,
            "--ang": `${i.angle}deg`,
          }}
        >
          {/* Şimşək xətti (elektrik) */}
          {i.bolt && (
            <svg className={styles.bolt} width="100%" height="100%">
              <polyline className={styles.boltGlow} points={i.bolt} />
              <polyline className={styles.boltCore} points={i.bolt} />
            </svg>
          )}

          {/* Uçuş hissəcikləri */}
          {i.flight.map((p) => (
            <span
              key={`f${p.k}${p.cls}`}
              className={`${styles.p} ${styles[p.cls]}`}
              style={{ "--ox": `${p.ox}px`, "--oy": `${p.oy}px`, "--d": `${p.d}s`, "--sz": `${p.sz}px` }}
            />
          ))}

          {/* Zərbə nöqtəsi */}
          <span className={styles.impact}>
            {i.bolt && !i.miss && <span className={styles.flash} />}
            {!i.miss && <span className={`${styles.ring} ${i.crit ? styles.critRing : ""}`} />}
            {!i.miss &&
              i.burst.map((b) => (
                <span
                  key={`b${b.k}`}
                  className={`${styles.b} ${styles[b.cls]} ${b.gravity ? styles.gravity : ""}`}
                  style={{ "--bx": `${b.bx}px`, "--by": `${b.by}px`, "--sz": `${b.sz}px` }}
                />
              ))}
            <span
              className={`${styles.dmg} ${i.ko ? styles.koText : ""} ${i.miss ? styles.missText : ""} ${i.crit ? styles.critText : ""}`}
            >
              {i.miss ? "MISS" : `-${i.damage}`}
              {i.crit && <span className={styles.tag}>CRITICAL!</span>}
              {!i.miss && i.mult > 1 && <span className={`${styles.tag} ${styles.good}`}>SUPER EFFECTIVE</span>}
              {!i.miss && i.mult < 1 && <span className={`${styles.tag} ${styles.weak}`}>not very effective</span>}
              {i.ko && <span className={styles.koTag}>KO!</span>}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
