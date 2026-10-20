import { POKEMON } from "../data/pokemon";
import { effectiveness } from "./types";

// Hər komanda neçə dəfə hücum edir. Sonuncu raund "FINAL" — zərbələr 1.5× güclüdür.
const ROUNDS = 5;
const CRIT_CHANCE = 0.12;
const MISS_CHANCE = 0.08;
const FINAL_BOOST = 1.5;
const SMART_TARGET = 0.65; // hücum edən çox vaxt ən sərfəli hədəfi seçir
const ODDS_RUNS = 400;

// Hər Pokemonun başlanğıc canı: { [id]: hp }
export const startHp = (teams) =>
  Object.fromEntries(teams.flat().map((p) => [p.id, p.hp]));

// Komandanın cari ümumi canı
export const totalHp = (team, hpMap) =>
  team.reduce((sum, p) => sum + hpMap[p.id], 0);

// Fisher–Yates qarışdırma (tam bərabər ehtimallı)
function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Hədəf seçimi: tip üstünlüyü + az canı olanı bitirmək; bəzən isə təsadüfi
function chooseTarget(attacker, targets, hp) {
  if (Math.random() > SMART_TARGET) return pick(targets);
  const score = (t) =>
    effectiveness(attacker.type, t.type) * (1 + 0.6 * (1 - hp[t.id] / t.hp)) + Math.random() * 0.3;
  return targets.reduce((best, t) => (score(t) > score(best) ? t : best));
}

function winnerOf(teams, finalHp) {
  const hp1 = totalHp(teams[0], finalHp);
  const hp2 = totalHp(teams[1], finalHp);
  return hp1 === hp2 ? (Math.random() < 0.5 ? 0 : 1) : hp1 > hp2 ? 0 : 1;
}

// Döyüşü əvvəlcədən hesablayır və hadisələr (events) siyahısı qaytarır.
// UI bu siyahını addım-addım oynadır, ona görə nəticə animasiya ilə həmişə üst-üstə düşür.
function simulateBattle(teams) {
  const hp = startHp(teams);
  const events = [];
  const firstSide = Math.random() < 0.5 ? 0 : 1; // kim əvvəl vurur — təsadüfi

  for (let round = 0; round < ROUNDS; round++) {
    const final = round === ROUNDS - 1;
    for (const side of [firstSide, 1 - firstSide]) {
      const attackers = teams[side].filter((p) => hp[p.id] > 0);
      const targets = teams[1 - side].filter((p) => hp[p.id] > 0);
      if (!attackers.length || !targets.length) continue;

      const attacker = pick(attackers);
      const target = chooseTarget(attacker, targets, hp);
      const mult = effectiveness(attacker.type, target.type);
      const miss = Math.random() < MISS_CHANCE;
      const crit = !miss && Math.random() < CRIT_CHANCE;

      // Zərbə = hücum gücünün 40–90%-i × tip əmsalı × (kritik 1.6×) × (final 1.5×)
      let damage = 0;
      if (!miss) {
        const base = attacker.attack * (0.4 + Math.random() * 0.5) * mult;
        const raw = Math.max(3, Math.round(base * (crit ? 1.6 : 1) * (final ? FINAL_BOOST : 1)));
        damage = Math.min(raw, hp[target.id]);
        hp[target.id] -= damage;
      }

      events.push({
        round: round + 1,
        final,
        side,
        attackerId: attacker.id,
        attackerName: attacker.name,
        targetId: target.id,
        targetName: target.name,
        move: attacker.move,
        type: attacker.type,
        mult,
        miss,
        crit,
        damage,
        hpAfter: hp[target.id],
        ko: !miss && hp[target.id] === 0,
      });
    }
  }

  return { events, finalHp: hp };
}

// Hər komandanın qələbə ehtimalı (Monte-Karlo) — mərc əmsalı buradan çıxır
function estimateOdds(teams) {
  let wins0 = 0;
  for (let i = 0; i < ODDS_RUNS; i++) {
    const { finalHp } = simulateBattle(teams);
    if (winnerOf(teams, finalHp) === 0) wins0++;
  }
  const p0 = Math.min(0.92, Math.max(0.08, wins0 / ODDS_RUNS));
  return [p0, 1 - p0].map((p) => ({
    chance: Math.round(p * 100),
    mult: Math.min(8, Math.max(1.5, Math.round((1 / p) * 10) / 10)), // ən azı ×1.5
  }));
}

// Ən çox zərər vuran Pokemon (bərabərlikdə KO sayı)
function findMvp(events) {
  const stats = {};
  for (const e of events) {
    const s = (stats[e.attackerId] ??= { id: e.attackerId, name: e.attackerName, damage: 0, kos: 0 });
    s.damage += e.damage;
    if (e.ko) s.kos++;
  }
  return Object.values(stats).sort((a, b) => b.damage - a.damage || b.kos - a.kos)[0] ?? null;
}

// 8 pokemonu təsadüfi 2 komandaya böl, döyüşü hesabla.
// Döyüş sonunda canı az qalan komanda uduzur (bərabərlikdə təsadüfi).
export function drawMatch() {
  const mixed = shuffle(POKEMON);
  const teams = [mixed.slice(0, 4), mixed.slice(4, 8)];
  const { events, finalHp } = simulateBattle(teams);

  return {
    sides: [
      { name: "You", team: teams[0] },
      { name: "PC", team: teams[1] },
    ],
    events,
    finalHp,
    winnerIndex: winnerOf(teams, finalHp),
    odds: estimateOdds(teams),
    mvp: findMvp(events),
  };
}
