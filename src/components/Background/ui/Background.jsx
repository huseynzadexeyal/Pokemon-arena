import { useMemo } from "react";
import styles from "../styles/Background.module.css";

const PARTICLE_COUNT = 14;

// Fon: hərəkət edən işıq topları, şəbəkə və yuxarı süzülən qığılcımlar.
// Hamısı yalnız transform/opacity ilə animasiya olunur (GPU, donma yoxdur).
export default function Background() {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, () => ({
        left: Math.random() * 100,
        size: 3 + Math.random() * 4,
        duration: 9 + Math.random() * 9,
        delay: -Math.random() * 16,
      })),
    []
  );

  return (
    <div className={styles.bg} aria-hidden="true">
      <span className={`${styles.orb} ${styles.orbA}`} />
      <span className={`${styles.orb} ${styles.orbB}`} />
      <span className={`${styles.orb} ${styles.orbC}`} />
      <span className={styles.grid} />
      {particles.map((p, i) => (
        <span
          key={i}
          className={styles.particle}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
