import { useCallback, useEffect, useRef, useState } from "react";
import { drawMatch, startHp } from "./utils/teams";
import {
  MIN_STAKE,
  REFILL_COINS,
  loadProgress,
  saveProgress,
  settleBet,
  WATCH_REWARD,
} from "./utils/progress";
import {
  isMuted,
  setMuted,
  playBattleStart,
  playDeal,
  playReveal,
  playBust,
  playChip,
  playClick,
  playClose,
  playCoins,
  playHit,
  playOpen,
  playWin,
  playZoom,
  startMusic,
  stopMusic,
} from "./utils/sound";
import { Background, BattleFx, Button, Finale, TeamSection, PokemonModal } from "./components";
import styles from "./App.module.css";

const INTRO_MS = 1500; // kartlar çevrilib açıldıqdan sonra döyüşün başlamasına qədər
const STEP_MS = { 1: 450, 2: 240 }; // iki zərbə arasındakı fasilə (sürətə görə)
const STAKES = [10, 25, 50];
const ZOOM_MS = 1700; // kamera qalibə yaxınlaşır, sonra final kartı açılır

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Təzə komandalar, tam can
const freshMatch = () => {
  const match = drawMatch();
  return { match, hp: startHp(match.sides.map((s) => s.team)) };
};

// Kommentator sətri: kim kimə nə ilə vurdu
function Commentary({ event }) {
  if (!event) return null;
  const { attackerName, targetName, move, miss, crit, mult, damage, ko, final } = event;
  return (
    <p className={styles.comment} key={event.n}>
      {final && <span className={styles.final}>FINAL ROUND ×1.5 </span>}
      <b>{attackerName}</b> {miss ? "missed" : "→"} <b>{targetName}</b>
      <span className={styles.move}> · {move}</span>
      {!miss && <span className={styles.dmgText}> −{damage}</span>}
      {crit && <span className={styles.crit}> CRIT!</span>}
      {!miss && mult > 1 && <span className={styles.good}> Super effective!</span>}
      {!miss && mult < 1 && <span className={styles.weak}> Not very effective</span>}
      {ko && <span className={styles.koText}> KO!</span>}
    </p>
  );
}

export default function App() {
  // Səhifə açılanda komandalar tam canla gəlir və oyunçu qalibi proqnozlaşdıra bilir
  const [initial] = useState(freshMatch);
  const [match, setMatch] = useState(initial.match);
  const [hp, setHp] = useState(initial.hp);
  const [fx, setFx] = useState(null); // hazırda oynanan zərbə
  const [round, setRound] = useState(0); // key kimi: yeni oyunda kartlar yenidən daxil olur
  const [phase, setPhase] = useState("pick"); // "pick" → "fighting" → "done"
  const [selected, setSelected] = useState(null);
  const [muted, setMutedState] = useState(isMuted);

  const [progress, setProgress] = useState(loadProgress);
    const [stake, setStake] = useState(() => Math.min(MIN_STAKE, Math.max(loadProgress().coins, 0)));
  const [speed, setSpeed] = useState(1);
  const [outcome, setOutcome] = useState(null); // { bet, won, delta, bonus }

  const [finale, setFinale] = useState(0); // 0: yoxdur · 1: kamera yaxınlaşır · 2: final kartı
  const timer = useRef(null);
  const finaleTimer = useRef(null);
  const fxCount = useRef(0);
  const speedRef = useRef(1);
  const pageRef = useRef(null);
  speedRef.current = speed;

  const fighting = phase === "fighting";
  const canBet = progress.coins >= MIN_STAKE;

  useEffect(() => saveProgress(progress), [progress]);

  // Komponent silinəndə gözləyən timeout-u və musiqini təmizləyirik
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(finaleTimer.current);
      stopMusic();
    },
    []
  );

  // Kritik zərbə və KO zamanı ekran silkələnir
  const shake = (strong) => {
    if (reducedMotion()) return;
    const d = strong ? 9 : 5;
    pageRef.current?.animate(
      [
        { transform: "translate(0,0)" },
        { transform: `translate(${-d}px, ${d / 2}px)` },
        { transform: `translate(${d}px, ${-d / 2}px)` },
        { transform: `translate(${-d / 2}px, 0)` },
        { transform: "translate(0,0)" },
      ],
      { duration: 280, delay: 200 }
    );
  };

  const startGame = () => {
    if (phase !== "pick") return; // ikiqat kliklərdən qoruma

    const events = match.events;
    const placed = canBet ? Math.min(stake, progress.coins) : 0; // oyunçu həmişə Team 1 ("You")-dur
    setPhase("fighting");
    setOutcome(null);
    setFx(null);
    playBattleStart();
    playReveal();
    startMusic();

    let i = 0;
    const step = () => {
      if (i >= events.length) {
        // Döyüş bitdi: qalib elan olunur, mərc hesablanır
        setFx(null);
        setPhase("done");
        playWin();
        setFinale(1);
        playZoom();
        finaleTimer.current = setTimeout(() => setFinale(2), ZOOM_MS);
        if (placed > 0) {
          const won = match.winnerIndex === 0;
          const res = settleBet(progress, { stake: placed, mult: match.odds[0].mult, won });
          setProgress(res.next);
          setOutcome({ won, delta: res.delta, bonus: res.bonus });
          setTimeout(won ? playCoins : playBust, 700);
        } else {
          // Mərc etməyən də izlədiyi üçün kiçik mükafat alır
          setProgress((p) => ({ ...p, coins: p.coins + WATCH_REWARD, played: p.played + 1 }));
          setOutcome({ watch: true, delta: WATCH_REWARD });
          setTimeout(playCoins, 700);
        }
        return;
      }
      const event = events[i++];
      setFx({ ...event, n: ++fxCount.current });
      setHp((current) => ({ ...current, [event.targetId]: event.hpAfter }));
      playHit(event); // hücum səsi (tipə görə) + zərbə + effektlər
      if (event.crit || event.ko) shake(event.ko);
      timer.current = setTimeout(step, STEP_MS[speedRef.current]);
    };
    timer.current = setTimeout(step, INTRO_MS);
  };

  const nextMatch = () => {
    if (phase !== "done") return;
    const next = freshMatch();
    // Sikkə qurtardısa, kiçik "yardım" paketi verilir ki, oyun dayanmasın
    if (progress.coins < MIN_STAKE) setProgress((p) => ({ ...p, coins: REFILL_COINS, streak: 0 }));
    setMatch(next.match);
    setHp(next.hp);
    setSelected(null);
    setOutcome(null);
    setStake((s) => Math.min(s, Math.max(progress.coins < MIN_STAKE ? REFILL_COINS : progress.coins, MIN_STAKE)));
    setRound((r) => r + 1);
    setFx(null);
    clearTimeout(finaleTimer.current);
    setFinale(0);
    setPhase("pick");
    playDeal();
  };

  const chooseStake = (value) => {
    if (phase !== "pick") return;
    playChip();
    setStake(value);
  };

  const openModal = useCallback((pokemon) => {
    playOpen();
    setSelected(pokemon);
  }, []);

  const closeModal = useCallback(() => {
    playClose();
    setSelected(null);
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) playClick(); // səsi açanda təsdiq səsi
  };

  // Nəticə yalnız döyüş bitəndən sonra göstərilir
  const resultOf = (index) => {
    if (phase !== "done") return undefined;
    return match.winnerIndex === index ? "winner" : "lose";
  };

  // Komandanı öz slotunda göstərir. key=round olduğu üçün yeni oyunda panel yenidən daxil olur
  const renderSide = (index) => {
    const side = match.sides[index];
    return (
      <div className={styles.side} key={`${round}-${index}`}>
        <TeamSection
          name={side.name}
          team={side.team}
          hp={hp}
          result={resultOf(index)}
          fx={fx}
          side={index}
          revealed={phase !== "pick"}
          onMore={openModal}
        />
      </div>
    );
  };

  // VS sırasındakı yan xana: mərc düyməsi / kommentator / nəticə
  const renderCell = (index) => {
    const odds = match.odds[index];
    
    if (phase === "pick") {
      const stakeNow = Math.min(stake, progress.coins);
      return (
        <p className={styles.odds}>
          <span className={styles.betTop}>{index === 0 ? (canBet ? `Stake ${stakeNow} 🪙` : "Free play") : "Computer"}</span>
          <span className={styles.betOdds}>
            {odds.chance}% to win{index === 0 && canBet ? ` · ×${odds.mult.toFixed(1)}` : ""}
          </span>
        </p>
      );
    }

    if (phase === "fighting") {
      return fx && fx.side === index ? <Commentary event={fx} /> : null;
    }

    // phase === "done"
    if (index === 0) {
      if (outcome?.watch) {
        return (
          <p className={`${styles.note} ${match.winnerIndex === 0 ? styles.won : styles.lost}`}>
            {match.winnerIndex === 0 ? "You win!" : "PC wins!"} <b>+{outcome.delta} 🪙</b>
          </p>
        );
      }
      return (
        <p className={`${styles.note} ${outcome?.won ? styles.won : styles.lost}`}>
          {outcome?.won ? "You win!" : "PC wins"}{" "}
          <b>
            {outcome?.delta > 0 ? "+" : ""}
            {outcome?.delta} 🪙
          </b>
          {outcome?.bonus > 0 && <span className={styles.bonus}> (streak +{outcome.bonus})</span>}
        </p>
      );
    }
    return match.mvp ? (
      <p className={styles.note}>
        ⭐ MVP <b>{match.mvp.name}</b> · {match.mvp.damage} dmg{match.mvp.kos ? ` · ${match.mvp.kos} KO` : ""}
      </p>
    ) : null;
  };

  return (
    <>
      <Background />

      <main ref={pageRef} className={`${styles.page} ${fighting ? styles.fighting : ""}`}>
        <header className={styles.header}>
          <h1 className={styles.logo}>Pokemon Arena</h1>

          <div className={styles.wallet} title={`Best streak ${progress.best} · Won ${progress.won}/${progress.played}`}>
            <span key={progress.coins} className={styles.coinPop}>🪙 {progress.coins}</span>
            {outcome?.delta ? (
              <span key={`d${round}${outcome.delta}`} className={`${styles.delta} ${outcome.delta > 0 ? styles.won : styles.lost}`}>
                {outcome.delta > 0 ? "+" : ""}{outcome.delta}
              </span>
            ) : null}
            <span className={progress.streak >= 2 ? styles.hot : ""}>🔥 {progress.streak}</span>
          </div>

          {canBet && (
            <div
              className={`${styles.stakes} ${phase === "pick" ? "" : styles.stakesHidden}`}
              role="group"
              aria-label="Stake"
              aria-hidden={phase !== "pick"}
            >
              {STAKES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.chip} ${stake === s ? styles.chipOn : ""}`}
                  onClick={() => chooseStake(s)}
                  disabled={s > progress.coins || phase !== "pick"}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
            aria-label={`Battle speed ${speed}x`}
          >
            <span className={styles.speed}>{speed}×</span>
          </Button>

          <Button
            variant="ghost"
            onClick={toggleSound}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
            aria-pressed={!muted}
          >
            {muted ? "🔇" : "🔊"}
          </Button>

          <Button variant="success" onClick={phase === "done" ? nextMatch : startGame} disabled={fighting}>
            {fighting ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Fighting…
              </>
            ) : phase === "done" ? (
              "Next Match ▶"
            ) : (
              "⚔ Fight!"
            )}
          </Button>
        </header>

        <div className={`${styles.arena} ${finale && phase === "done" ? styles[`zoom${match.winnerIndex}`] : ""}`}>
          {renderSide(0)}

          <div className={styles.vsRow} aria-live="polite">
            <div className={`${styles.cell} ${styles.cellLeft}`}>{renderCell(0)}</div>
            <span className={styles.vs}>VS</span>
            <div className={`${styles.cell} ${styles.cellRight}`}>{renderCell(1)}</div>
          </div>

          {renderSide(1)}
        </div>
      </main>

      <BattleFx event={fx} />
      {finale === 2 && phase === "done" && (
        <Finale
          match={match}
          outcome={outcome}
          streak={progress.streak}
          onNext={nextMatch}
          onClose={() => setFinale(0)}
        />
      )}
      <PokemonModal pokemon={selected} onClose={closeModal} />
    </>
  );
}
