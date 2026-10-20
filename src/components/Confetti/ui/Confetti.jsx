import { useMemo } from "react";
import styles from "../styles/Confetti.module.css";

const COLORS = ["#ffd24a", "#2ee59d", "#ff4d6d", "#3fa9ff", "#b65cff", "#ffffff"];
const COUNT = 24;

// Qalib komanda üçün bir dəfəlik konfeti yağışı
export default function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 1.9 + Math.random() * 1.6,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
      })),
    []
  );

  return (
    <div className={styles.wrap} aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={styles.piece}
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.h,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--spin": `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
