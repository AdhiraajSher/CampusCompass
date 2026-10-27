import { afterEach, describe, expect, it, vi } from "vitest";
import { observeTextReveals } from "@/lib/text-reveal";

afterEach(() => vi.restoreAllMocks());

function setup(reduced = false) {
  document.body.innerHTML =
    '<main><h1 style="clip-path: inset(0)">CAMPUS<span class="green">COMPASS</span></h1></main>';
  const heading = document.querySelector("h1")!;
  let intersect: IntersectionObserverCallback;
  let nextFrame: FrameRequestCallback | undefined;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = callback;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  const raf = vi.fn((callback: FrameRequestCallback) => {
    nextFrame = callback;
    return 1;
  });
  vi.stubGlobal("requestAnimationFrame", raf);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(heading, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 300,
    bottom: 50,
    width: 300,
    height: 50,
    x: 0,
    y: 0,
    toJSON() {},
  });
  // jsdom has no layout engine; provide character rectangles only for animation measurement.
  Object.defineProperty(Range.prototype, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      left: 0,
      top: 0,
      right: 20,
      bottom: 40,
      width: 20,
      height: 40,
    }),
  });
  const cleanup = observeTextReveals();
  const show = () =>
    intersect?.(
      [
        {
          target: heading,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: heading.getBoundingClientRect(),
          intersectionRect: heading.getBoundingClientRect(),
          rootBounds: null,
          time: 0,
        },
      ],
      {} as IntersectionObserver,
    );
  return {
    heading,
    cleanup,
    show,
    raf,
    finish: () => nextFrame?.(performance.now() + 5000),
  };
}

describe("first-appearance text reveal", () => {
  it("preserves text and nested styling, settles, and does not replay on re-entry", () => {
    const { heading, show, finish, raf, cleanup } = setup();
    const originalNodes = Array.from(heading.childNodes);
    show();
    expect(heading).toHaveAttribute("data-type-enter");
    expect(heading.textContent).toBe("CAMPUSCOMPASS");
    expect(Array.from(heading.childNodes)).toEqual(originalNodes);
    expect(heading.querySelector(".green")).toHaveTextContent("COMPASS");
    finish();
    expect(heading).not.toHaveAttribute("data-type-enter");
    expect(heading.style.clipPath).toBe("inset(0)");
    const calls = raf.mock.calls.length;
    show();
    expect(raf).toHaveBeenCalledTimes(calls);
    cleanup();
  });

  it("leaves all text immediately readable when reduced motion is enabled", () => {
    const { heading, raf, cleanup } = setup(true);
    expect(heading.textContent).toBe("CAMPUSCOMPASS");
    expect(heading).not.toHaveAttribute("data-type-enter");
    expect(raf).not.toHaveBeenCalled();
    cleanup();
  });

  it("restores the original clipping if an animation is interrupted", () => {
    const { heading, show, cleanup } = setup();
    show();
    cleanup();
    expect(heading).not.toHaveAttribute("data-type-enter");
    expect(heading.style.clipPath).toBe("inset(0)");
    expect(heading.style.getPropertyValue("--type-caret-x")).toBe("");
  });
});
