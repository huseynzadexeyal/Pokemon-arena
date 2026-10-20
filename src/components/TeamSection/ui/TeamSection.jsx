import { totalHp } from "../../../utils/teams";
import Confetti from "../../Confetti/ui/Confetti";
import CountUp from "../../CountUp/ui/CountUp";
import PokemonCard from "../../PokemonCard/ui/PokemonCard";
import styles from "../styles/TeamSection.module.css";

const TITLES = { winner: "Winner", lose: "Lose" };

// props:
//  hp     — { [pokemonId]: cari can }
//  result — "winner" | "lose" | undefined (döyüş gedərkən nəticə yoxdur)
//  fx     — cari hücum hadisəsi və ya null
//  side   — 0 (yuxarı komanda) | 1 (aşağı komanda): hücum istiqamətini təyin edir
export default function TeamSection({ name, team, hp, result, fx, side, onMore }) {
  const isWinner = result === "winner";
  const total = totalHp(team, hp);

  // Yalnız hücum edən və zərbə alan karta fx veririk — qalan kartlar yenidən render olmur
  const fxFor = (pokemon) => {
    if (!fx) return null;
    if (fx.attackerId === pokemon.id) return { kind: "attack", dir: side === 0 ? 1 : -1, n: fx.n };
    if (fx.targetId === pokemon.id) return { kind: fx.miss ? "dodge" : "hit", dir: 0, n: fx.n };
    return null;
  };

  return (
    <section className={`${styles.team} ${result ? styles[result] : ""}`}>
      {isWinner && <Confetti />}

      <div className={styles.head}>
        <h2 className={styles.title}>
          {isWinner && <span className={styles.crown} aria-hidden="true">👑</span>}
          {result ? `${name}: ${TITLES[result]}` : name}
        </h2>
        <p className={styles.total} aria-label={`Total HP ${total}`}>
          <CountUp value={total} />
          <span className={styles.unit}>HP</span>
        </p>
      </div>

      <div className={styles.grid}>
        {team.map((pokemon, i) => (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            hp={hp[pokemon.id]}
            index={i}
            fx={fxFor(pokemon)}
            onMore={onMore}
          />
        ))}
      </div>
    </section>
  );
}
