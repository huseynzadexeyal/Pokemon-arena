import { useState } from "react";
import { FALLBACK_IMAGE, POKEMON, getImage, getTypeColor } from "../../../data/pokemon";
import Button from "../../Button/ui/Button";
import styles from "../styles/Finale.module.css";

// Qalibə xüsusi final səhnəsi: parlaq şüalar, nəticə banneri, MVP və mükafat.
// props: match, outcome ({won, delta, bonus, watch}), streak, onNext, onClose
export default function Finale({ match, outcome, streak, onNext, onClose }) {
  const [failed, setFailed] = useState(false);
  const youWon = match.winnerIndex === 0;
  const mvp = match.mvp;
  const hero = mvp ? POKEMON.find((p) => p.id === mvp.id) : null;
  const delta = outcome?.delta ?? 0;

  return (
    <div className={`${styles.overlay} ${youWon ? styles.win : styles.lose}`} onClick={onClose}>
      <div className={styles.rays} aria-hidden="true" />

      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label={youWon ? "Victory" : "Defeat"}
        style={{ "--accent": hero ? getTypeColor(hero.type) : "#7c5cff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={styles.kicker}>{youWon ? "VICTORY" : "DEFEAT"}</p>
        <h2 className={styles.title}>{youWon ? "YOU WIN!" : "PC WINS!"}</h2>

        {hero && (
          <div className={styles.hero}>
            <span className={styles.halo} />
            <img
              className={styles.image}
              src={failed ? FALLBACK_IMAGE : getImage(hero.id)}
              alt={hero.name}
              onError={() => setFailed(true)}
            />
            <p className={styles.mvp}>
              ⭐ MVP <b>{hero.name}</b>
            </p>
            <p className={styles.sub}>
              {mvp.damage} damage{mvp.kos ? ` · ${mvp.kos} KO` : ""}
            </p>
          </div>
        )}

        <div className={styles.stats}>
          <span className={`${styles.pill} ${delta >= 0 ? styles.plus : styles.minus}`}>
            {delta >= 0 ? "+" : ""}
            {delta} 🪙
          </span>
          {streak >= 2 && <span className={`${styles.pill} ${styles.hot}`}>🔥 {streak} streak</span>}
          {outcome?.bonus > 0 && <span className={`${styles.pill} ${styles.hot}`}>bonus +{outcome.bonus}</span>}
        </div>

        <div className={styles.actions}>
          <Button variant="success" onClick={onNext} autoFocus>
            Next Match ▶
          </Button>
          <Button variant="ghost" onClick={onClose} aria-label="View battlefield">
            ✕
          </Button>
        </div>
      </div>
    </div>
  );
}
