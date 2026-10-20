import { useEffect, useState } from "react";

// 0-dan hədəf rəqəmə qədər hamar sayma animasiyası
export default function useCountUp(target, { duration = 1200, delay = 0 } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Azaldılmış hərəkət seçilibsə birbaşa son rəqəmi göstəririk
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }

    let raf;
    let start;
    const tick = (now) => {
      start ??= now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);

    // Komponent silinəndə və ya hədəf dəyişəndə təmizləyirik
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return value;
}
