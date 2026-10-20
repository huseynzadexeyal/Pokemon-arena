// Oyunçunun irəliləyişi (sikkələr, seriya) brauzerdə saxlanılır
const KEY = "pokemon-arena:progress";
export const START_COINS = 100;
export const REFILL_COINS = 50;
export const MIN_STAKE = 10;
export const WIN_BONUS = 10; // düzgün proqnoz üçün sabit əlavə
export const WATCH_REWARD = 5; // mərc etmədən izləyənə də kiçik mükafat

const fresh = () => ({ coins: START_COINS, streak: 0, best: 0, played: 0, won: 0 });

export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && Number.isFinite(raw.coins)) return { ...fresh(), ...raw };
  } catch {
    /* saxlanılmış məlumat yoxdur və ya xarabdır */
  }
  return fresh();
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* localStorage bağlıdırsa problem deyil */
  }
}

// Mərc nəticəsi: qalib gələndə əmsala görə qazanc + seriya bonusu, uduzanda mərc itir
export function settleBet(progress, { stake, mult, won }) {
  const streak = won ? progress.streak + 1 : 0;
  const bonus = won && streak >= 2 ? Math.min(streak - 1, 5) * 5 : 0;
  const delta = won ? Math.round(stake * (mult - 1)) + WIN_BONUS + bonus : -stake;
  return {
    delta,
    bonus,
    next: {
      ...progress,
      coins: Math.max(0, progress.coins + delta),
      streak,
      best: Math.max(progress.best, streak),
      played: progress.played + 1,
      won: progress.won + (won ? 1 : 0),
    },
  };
}
