/** Reveal existing text without replacing nodes, changing wrapping, or hiding it from readers. */
export function observeTextReveals(): () => void {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || typeof IntersectionObserver === "undefined")
    return () => {};

  const selector = [
    "main h1",
    "main h2",
    "main h3",
    ".hero-meta > span",
    ".hero-split .mono",
    ".section-heading .mono",
    ".dashboard-eyebrow > span",
    ".signin-intro > .mono",
    ".site-header nav .scramble",
    ".nav-cta .scramble",
    ".rainbow-button .scramble",
    ".text-link .scramble",
  ].join(",");
  const seen = new WeakSet<Element>();
  const running = new Map<HTMLElement, () => void>();

  function reveal(element: HTMLElement) {
    const bounds = element.getBoundingClientRect();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const stops: { left: number; x: number; top: number; bottom: number }[] =
      [];
    const range = document.createRange();
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('[aria-hidden="true"]')) continue;
      let offset = 0;
      for (const character of node.textContent ?? "") {
        range.setStart(node, offset);
        offset += character.length;
        range.setEnd(node, offset);
        if (!character.trim()) continue;
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          stops.push({
            left: rect.left - bounds.left,
            x: rect.right - bounds.left,
            top: rect.top - bounds.top,
            bottom: rect.bottom - bounds.top,
          });
        }
      }
    }
    if (!stops.length) return;

    // Original text remains in place, so nested colors, kerning and line breaks stay exact.
    const properties = [
      "clip-path",
      "--type-caret-x",
      "--type-caret-y",
      "--type-caret-height",
    ];
    const original = properties.map((property) =>
      element.style.getPropertyValue(property),
    );
    let frame = 0;
    let previous = -1;
    const started = performance.now();
    const duration = Math.min(1250, Math.max(450, stops.length * 46));
    const caretWidth = Math.max(
      3,
      parseFloat(getComputedStyle(element).fontSize) * 0.065,
    );
    const finish = () => {
      cancelAnimationFrame(frame);
      element.removeAttribute("data-type-enter");
      properties.forEach((property, index) => {
        if (original[index])
          element.style.setProperty(property, original[index]);
        else element.style.removeProperty(property);
      });
      running.delete(element);
    };
    function paint(index: number) {
      const stop = stops[Math.max(0, index - 1)];
      const x = index === 0 ? Math.max(0, stop.left) : stop.x;
      const right = Math.min(bounds.width, x + caretWidth * 2);
      const top = Math.max(0, stop.top);
      const bottom = Math.min(bounds.height, stop.bottom);
      element.style.clipPath = `polygon(0 0, 100% 0, 100% ${top}px, ${right}px ${top}px, ${right}px ${bottom}px, 0 ${bottom}px)`;
      element.style.setProperty("--type-caret-x", `${x}px`);
      element.style.setProperty(
        "--type-caret-y",
        `${top + (bottom - top) * 0.12}px`,
      );
      element.style.setProperty(
        "--type-caret-height",
        `${(bottom - top) * 0.76}px`,
      );
    }
    const tick = (now: number) => {
      if (!element.isConnected || motion.matches) {
        finish();
        return;
      }
      const progress = Math.min(
        1,
        Math.max(0, (now - started - 80) / duration),
      );
      const index = Math.floor(progress * stops.length);
      if (index !== previous) {
        paint(index);
        previous = index;
      }
      if (progress === 1) finish();
      else frame = requestAnimationFrame(tick);
    };
    element.setAttribute("data-type-enter", "");
    paint(0);
    running.set(element, finish);
    frame = requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target)) continue;
        seen.add(entry.target);
        observer.unobserve(entry.target);
        if (!motion.matches && entry.target instanceof HTMLElement)
          reveal(entry.target);
      }
    },
    { threshold: 0.12 },
  );

  function register() {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      if (seen.has(element)) return;
      // A heading owns its nested Scramble span: never animate the same letters twice.
      const parentHeading = element.parentElement?.closest("h1, h2, h3");
      if (parentHeading) return;
      observer.observe(element);
    });
  }
  const mutations = new MutationObserver(register);
  register();
  mutations.observe(document.body, { childList: true, subtree: true });
  const settle = () => running.forEach((finish) => finish());
  const visibility = () => {
    if (document.hidden) settle();
  };
  window.addEventListener("resize", settle, { passive: true });
  motion.addEventListener("change", settle);
  document.addEventListener("visibilitychange", visibility);
  return () => {
    observer.disconnect();
    mutations.disconnect();
    settle();
    window.removeEventListener("resize", settle);
    motion.removeEventListener("change", settle);
    document.removeEventListener("visibilitychange", visibility);
  };
}
