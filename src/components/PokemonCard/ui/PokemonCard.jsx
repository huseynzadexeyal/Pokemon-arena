import { memo, useEffect, useRef, useState } from "react";
import { FALLBACK_IMAGE, getImage, getTypeColor } from "../../../data/pokemon";
import { playHover } from "../../../utils/sound";
import Button from "../../Button/ui/Button";
import styles from "../styles/PokemonCard.module.css";

export const REVEAL_STEP_MS = 110;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Can zolağının rəngi: çox → yaşıl, orta → sarı, az → qırmızı
const hpColor = (ratio) =>
  ratio > 0.5 ? "var(--green)" : ratio > 0.25 ? "var(--gold)" : "var(--red)";

// props:
//  hp — cari can; pokemon.hp — maksimum can
//  fx — { kind: "attack" | "hit" | "dodge", dir, n } və ya null (yalnız iştirak edən kartlara verilir)
const PokemonCard = memo(function PokemonCard({ pokemon, hp, onMore, index = 0, side = 0, revealed = true, cheer = false, fx = null }) {
  const { name, id, type, move } = pokemon;
  const maxHp = pokemon.hp;
  const ratio = hp / maxHp;

  const cardRef = useRef(null);
  const tiltRef = useRef(null);
  const flashRef = useRef(null);
  const frame = useRef(0);
  const [src, setSrc] = useState(getImage(id));
  // Kart əvvəlcə arxası (Pokeball) ilə paylanır; "Fight" basılanda növbə ilə çevrilib Pokemon açılır
  const [faceUp, setFaceUp] = useState(revealed);
  const [spawn, setSpawn] = useState(false); // çevriləndən sonra "doğulma" effekti
  const spawnTimer = useRef(0);

  // Real şəkli əvvəlcədən yükləyirik ki, kart çevriləndə dərhal görünsün
  useEffect(() => {
    const img = new Image();
    img.src = getImage(id);
  }, [id]);

  useEffect(() => {
    if (!revealed || faceUp) return;
    // Paylanma sırası ilə: hər komandadan növbə ilə bir kart
    const wait = (index * 2 + side) * REVEAL_STEP_MS;
    const timers = [];
    timers.push(
      setTimeout(() => {
        const el = tiltRef.current;
        if (!el || reducedMotion()) return setFaceUp(true);
        const out = el.animate(
          [{ transform: "rotateY(0deg) scale(1)" }, { transform: "rotateY(90deg) scale(1.06)" }],
          { duration: 170, easing: "ease-in", fill: "forwards" }
        );
        out.onfinish = () => {
          setFaceUp(true);
          setSpawn(true);
          spawnTimer.current = setTimeout(() => setSpawn(false), 900);
          out.cancel();
          el.animate(
            [{ transform: "rotateY(-90deg) scale(1.06)" }, { transform: "rotateY(0deg) scale(1)" }],
            { duration: 220, easing: "ease-out" }
          );
          flashRef.current?.animate([{ opacity: 0.8 }, { opacity: 0 }], { duration: 420 });
        };
      }, wait)
    );
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(spawnTimer.current);
    };
  }, [revealed]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Şəkil kartdan bir az fərqli sürüşür: dərinlik (parallax) hissi
      el.style.setProperty("--px", `${(x - 0.5) * 14}px`);
      el.style.setProperty("--py", `${(y - 0.5) * 10}px`);
    });
  };

  const handleLeave = () => {
    cancelAnimationFrame(frame.current);
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--px", "0px");
    el.style.setProperty("--py", "0px");
  };

  return (
    <article
      ref={cardRef}
      data-pid={id}
      className={styles.card}
      style={{
        "--accent": faceUp ? getTypeColor(type) : "#7c5cff",
        "--s": side,
        "--i": index,
        "--hp": ratio,
        "--hpc": hpColor(ratio),
      }}
    >
      <div
        ref={tiltRef}
        className={`${styles.tilt} ${hp === 0 ? styles.ko : ""} ${faceUp ? "" : styles.facedown}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && playHover()}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        <h3 className={styles.name}>{faceUp ? name : "???"}</h3>

        <div
          className={`${styles.art} ${faceUp && hp > 0 ? styles.live : ""} ${spawn ? styles.spawn : ""} ${
            cheer ? styles.cheer : ""
          } ${faceUp && hp > 0 && ratio <= 0.3 ? styles.weak : ""}`}
          data-t={type}
        >
          <span className={styles.shadow} aria-hidden="true" />
          {/* Tipə uyğun uçuşan hissəciklər: alov közləri, qabarcıqlar, qığılcımlar... */}
          {faceUp &&
            hp > 0 &&
            [0, 1, 2, 3, 4, 5].map((k) => (
              <span key={k} className={styles.mote} style={{ "--k": k }} aria-hidden="true" />
            ))}
          {spawn && <span className={styles.spawnRing} aria-hidden="true" />}
          <img
            className={styles.image}
            src={faceUp ? src : FALLBACK_IMAGE}
            alt={faceUp ? name : "Hidden Pokemon"}
            decoding="async"
            onError={() => setSrc(FALLBACK_IMAGE)}
          />
        </div>

        <p className={styles.type}>{faceUp ? `${type} · ${move}` : "Unknown"}</p>

        <div className={styles.hp}>
          <span>{faceUp ? `HP ${hp}/${maxHp}` : "HP ???"}</span>
          <span className={styles.bar}><span className={styles.fill} /></span>
        </div>

        <div className={styles.action}>
          <Button onClick={() => onMore(pokemon)} disabled={!faceUp}>Read more</Button>
        </div>

        {hp === 0 && <span className={styles.koBadge}>KO</span>}
        <span ref={flashRef} className={styles.flash} aria-hidden="true" />
      </div>
    </article>
  );
});

export default PokemonCard;
