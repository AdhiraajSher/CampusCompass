"use client";
import { useEffect, useRef, useState } from "react";
import { observeTextReveals } from "@/lib/text-reveal";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_/#";
/** Stable-width text with a visual-only scramble on entry AND exit. */
export function Scramble({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(children);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const run = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (timer.current) clearInterval(timer.current);
    let frame = 0;
    timer.current = setInterval(() => {
      frame += 0.8;
      setDisplay(
        children
          .split("")
          .map((c, i) =>
            c === " " || i < frame
              ? c
              : alphabet[Math.floor(Math.random() * alphabet.length)],
          )
          .join(""),
      );
      if (frame >= children.length) {
        if (timer.current) clearInterval(timer.current);
        setDisplay(children);
      }
    }, 22);
  };
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  return (
    <span
      className={`scramble ${className}`}
      onPointerEnter={run}
      onPointerLeave={run}
      onFocus={run}
    >
      <span className="scramble-measure">{children}</span>
      <span className="scramble-text" aria-hidden="true">
        {display}
      </span>
    </span>
  );
}
export function Effects() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(observeTextReveals, []);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const fine = matchMedia("(pointer:fine)");
    type Particle = {
      x: number;
      y: number;
      life: number;
      vx: number;
      vy: number;
      color: string;
    };
    let particles: Particle[] = [],
      frame = 0,
      last = 0,
      hue = 0;
    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      el.width = innerWidth * d;
      el.height = innerHeight * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      particles = [];
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    const draw = (now: number) => {
      const delta = Math.min((now - last) / 16.67, 2) || 1;
      last = now;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.life -= 0.035 * delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        const size = Math.max(2, 7 * p.life);
        ctx.fillRect(Math.round(p.x), Math.round(p.y), size, size);
      }
      ctx.globalAlpha = 1;
      frame = particles.length ? requestAnimationFrame(draw) : 0;
    };
    const move = (e: PointerEvent) => {
      if (reduced.matches || !fine.matches || e.pointerType === "touch") return;
      particles.push({
        x: e.clientX,
        y: e.clientY,
        life: 1,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.5,
        color: `hsl(${(hue++ * 39) % 360} 93% 54%)`,
      });
      if (particles.length > 70) particles.shift();
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };
    const visibility = () => {
      if (document.hidden) clear();
    };
    const motion = () => {
      if (reduced.matches) clear();
    };
    resize();
    addEventListener("resize", resize);
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", motion);
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((e) => observer.observe(e));
    return () => {
      clear();
      observer.disconnect();
      removeEventListener("resize", resize);
      removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", motion);
    };
  }, []);
  return <canvas ref={canvas} className="particle-canvas" aria-hidden="true" />;
}
