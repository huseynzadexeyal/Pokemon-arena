// Zəif kompüterlərdə donmanın qarşısı: kadr sürəti aşağıdırsa bəzək effektləri avtomatik söndürülür.
// Əl ilə dəyişmək üçün: localStorage["pokemon-arena:lite"] = "1" (həmişə yüngül) və ya "0" (həmişə tam).
const KEY = "pokemon-arena:lite";
const LOW_FPS = 34;

const setLite = (on) => {
  if (on) document.documentElement.dataset.lite = "1";
  else delete document.documentElement.dataset.lite;
};

export function initPerformance() {
  let forced = null;
  try {
    forced = localStorage.getItem(KEY);
  } catch {
    /* localStorage bağlıdır */
  }
  if (forced === "1") return setLite(true);
  if (forced === "0") return;
  measure(2500);
}

// Verilən müddətdə orta kadr sürətini ölçür; aşağıdırsa yüngül rejimə keçir (bir dəfə)
export function measure(ms) {
  if (document.documentElement.dataset.lite) return;
  let frames = 0;
  let start = 0;
  const tick = (now) => {
    if (document.hidden) return; // tab gizlidirsə ölçmə yanlış olar
    start ||= now;
    frames++;
    if (now - start < ms) return requestAnimationFrame(tick);
    const fps = (frames / (now - start)) * 1000;
    if (fps < LOW_FPS) setLite(true);
  };
  requestAnimationFrame(tick);
}

// Final kartı açıqkən arxadakı animasiyalar dayandırılır
export const setFrozen = (on) => {
  if (on) document.documentElement.dataset.frozen = "1";
  else delete document.documentElement.dataset.frozen;
};
