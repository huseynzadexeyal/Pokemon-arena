import { useEffect, useRef, useState } from "react";
import { getTypeColor } from "../../../data/pokemon";
import styles from "../styles/BattleFx.module.css";

const LIFETIME_MS = 1000;

// Hücum edən kartdan hədəf karta uçan şar, zərbə halqası və "-zərər" rəqəmi.
// Mövqelər kartların data-pid atributu ilə tapılır.
export default function BattleFx({ event }) {
  const [items, setItems] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    if (!event) return;
    const from = document.querySelector(`[data-pid="${event.attackerId}"]`);
    const to = document.querySelector(`[data-pid="${event.targetId}"]`);
    if (!from || !to) return;

    const a = from.getBoundingClientRect();
    const t = to.getBoundingClientRect();
    const item = {
      id: event.n,
      x0: a.left + a.width / 2,
      y0: a.top + a.height / 2,
      x1: t.left + t.width / 2,
      y1: t.top + t.height / 2,
      color: getTypeColor(event.type),
      damage: event.damage,
      ko: event.ko,
      miss: event.miss,
      crit: event.crit,
      mult: event.mult,
    };

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
          }}
        >
          <span className={styles.orb} />
          <span className={styles.impact}>
            {!i.miss && <span className={`${styles.ring} ${i.crit ? styles.critRing : ""}`} />}
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
