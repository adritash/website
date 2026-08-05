"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedStatProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  delay?: number;
};

function animateValue(
  target: number,
  onUpdate: (value: number) => void,
  duration = 1200
) {
  const start = performance.now();

  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    onUpdate(Math.round(target * eased * 10) / 10);
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

export default function AnimatedStat({
  value,
  suffix = "",
  prefix = "",
  label,
  delay = 0,
}: AnimatedStatProps) {
  const [display, setDisplay] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();

          const prefersReduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches;

          window.setTimeout(() => {
            if (prefersReduced) {
              setDisplay(value);
              return;
            }
            animateValue(value, setDisplay);
          }, delay);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, delay]);

  const formatted =
    value % 1 !== 0 ? display.toFixed(1) : Math.round(display).toString();

  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-border bg-surface-elevated p-5 text-center shadow-sm ${visible ? "stat-animate" : "opacity-0"}`}
    >
      <p className="text-2xl font-bold text-brand sm:text-3xl">
        {prefix}
        {formatted}
        {suffix}
      </p>
      <p className="mt-1 text-xs font-medium leading-snug text-muted">{label}</p>
    </div>
  );
}
