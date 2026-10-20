import { useEffect, useState } from "react";
import { FALLBACK_IMAGE, getImage, getTypeColor } from "../../../data/pokemon";
import { strongAgainst, weakTo } from "../../../utils/types";
import Button from "../../Button/ui/Button";
import styles from "../styles/PokemonModal.module.css";

// HP zolağının 100% olduğu dəyər (ən yüksək HP-dən bir az böyük)
const HP_CAP = 120;

export default function PokemonModal({ pokemon, onClose }) {
  const [failedId, setFailedId] = useState(null);

  // Escape ilə bağlanma — yalnız modal açıq olanda dinləyirik
  useEffect(() => {
    if (!pokemon) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pokemon, onClose]);

  if (!pokemon) return null;
  const { name, id, type, hp, attack, move } = pokemon;
  const strong = strongAgainst(type);
  const weak = weakTo(type);
  const src = failedId === id ? FALLBACK_IMAGE : getImage(id);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        style={{
          "--accent": getTypeColor(type),
          "--pct": `${Math.min(hp / HP_CAP, 1) * 100}%`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={styles.name}>{name}</h3>

        <div className={styles.art}>
          <span className={styles.ring} />
          <img className={styles.image} src={src} alt={name} decoding="async" onError={() => setFailedId(id)} />
        </div>

        <p className={styles.row}>ID: #{String(id).padStart(3, "0")}</p>
        <p className={styles.row}>
          Type: <span className={styles.badge}>{type}</span>
        </p>
        <p className={styles.row}>HP: {hp}</p>
        <p className={styles.row}>Attack: {attack}</p>
        <p className={styles.row}>Move: <b>{move}</b></p>
        <p className={styles.row}>
          Strong vs: {strong.length ? strong.map((t) => <span key={t} className={styles.mini}>{t}</span>) : "—"}
        </p>
        <p className={styles.row}>
          Weak to: {weak.length ? weak.map((t) => <span key={t} className={`${styles.mini} ${styles.miniWeak}`}>{t}</span>) : "—"}
        </p>
        <span className={styles.bar}><span className={styles.fill} /></span>

        <Button onClick={onClose} autoFocus>Close</Button>
      </div>
    </div>
  );
}
