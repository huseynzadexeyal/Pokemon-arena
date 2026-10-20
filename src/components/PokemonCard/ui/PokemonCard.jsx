import { memo, useEffect, useRef, useState } from "react";
import { FALLBACK_IMAGE, getImage, getTypeColor } from "../../../data/pokemon";
import { playHover } from "../../../utils/sound";
import Button from "../../Button/ui/Button";
import styles from "../styles/PokemonCard.module.css";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Can zolağının rəngi: çox → yaşıl, orta → sarı, az → qırmızı
const hpColor = (ratio) =>
  ratio > 0.5 ? "var(--green)" : ratio > 0.25 ? "var(--gold)" : "var(--red)";

// props:
//  hp — cari can; pokemon.hp — maksimum can
//  fx — { kind: "attack" | "hit" | "dodge", dir, n } və ya null (yalnız iştirak edən kartlara verilir)
const PokemonCard = memo(function PokemonCard({ pokemon, hp, onMore, index = 0, fx = null }) {
  const { name, id, type, move } = pokemon;
  const maxHp = pokemon.hp;
  const ratio = hp / maxHp;

  const cardRef = useRef(null);
  const tiltRef = useRef(null);
  const flashRef = useRef(null);
  const frame = useRef(0);
  const [src, setSrc] = useState(getImage(id));

  // Hücum: kart rəqibə tərəf irəli atılır. Zərbə: kart silkələnir və ağ parıldayır.
  // Dependency yalnız primitivlərdir ki, əlaqəsiz re-render animasiyanı təkrarlamasın.
  useEffect(() => {
    const el = cardRef.current;
    if (!fx || !el || reducedMotion()) return;

    if (fx.kind === "attack") {
      el.animate(
        [
          { transform: "translateY(0) scale(1)" },
          { transform: `translateY(${fx.dir * 20}px) scale(1.07)`, offset: 0.35 },
          { transform: "translateY(0) scale(1)" },
        ],
        { duration: 380, easing: "ease-out" }
      );
    } else if (fx.kind === "dodge") {
      el.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(18px) rotate(4deg)", offset: 0.4 },
          { transform: "translateX(0)" },
        ],
        { duration: 340, delay: 150, easing: "ease-out" }
      );
    } else {
      el.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-7px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 300, delay: 170 }
      );
      flashRef.current?.animate([{ opacity: 0 }, { opacity: 0.7 }, { opacity: 0 }], {
        duration: 320,
        delay: 170,
      });
    }
  }, [fx?.n, fx?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3D əyilmə — yalnız siçanla, requestAnimationFrame ilə kadrda bir dəfə
  const handleMove = (e) => {
    if (e.pointerType !== "mouse" || !tiltRef.current) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = tiltRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
      el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    });
  };

  const handleLeave = () => {
    cancelAnimationFrame(frame.current);
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <article
      ref={cardRef}
      data-pid={id}
      className={styles.card}
      style={{
        "--accent": getTypeColor(type),
        "--i": index,
        "--hp": ratio,
        "--hpc": hpColor(ratio),
      }}
    >
      <div
        ref={tiltRef}
        className={`${styles.tilt} ${hp === 0 ? styles.ko : ""}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && playHover()}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        <h3 className={styles.name}>{name}</h3>

        <div className={styles.art}>
          <img
            className={styles.image}
            src={src}
            alt={name}
            decoding="async"
            onError={() => setSrc(FALLBACK_IMAGE)}
          />
        </div>

        <p className={styles.type}>{type} · {move}</p>

        <div className={styles.hp}>
          <span>HP {hp}/{maxHp}</span>
          <span className={styles.bar}><span className={styles.fill} /></span>
        </div>

        <div className={styles.action}>
          <Button onClick={() => onMore(pokemon)}>Read more</Button>
        </div>

        {hp === 0 && <span className={styles.koBadge}>KO</span>}
        <span ref={flashRef} className={styles.flash} aria-hidden="true" />
      </div>
    </article>
  );
});

export default PokemonCard;
