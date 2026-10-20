import { useLayoutEffect, useRef } from "react";

// Rəqəmi əvvəlki dəyərindən yenisinə hamar sayır (ilk dəfə 0-dan).
// Mətni birbaşa DOM-da yeniləyir — hər kadrda React re-render olmur.
export default function CountUp({ value }) {
  const ref = useRef(null);
  const current = useRef(0); // ekranda hazırda göstərilən rəqəm
  const first = useRef(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Azaldılmış hərəkət seçilibsə birbaşa son rəqəmi göstəririk
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = value;
      el.textContent = value;
      return;
    }

    const from = current.current;
    const duration = first.current ? 800 : 350;
    const delay = first.current ? 0 : 170; // zərbə dəyəndən sonra düşsün
    first.current = false;

    let raf;
    let start;
    const tick = (now) => {
      start ??= now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      current.current = Math.round(from + (value - from) * eased);
      el.textContent = current.current;
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return <span ref={ref}>0</span>;
}
