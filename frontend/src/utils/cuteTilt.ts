// Cursor-tracking 3D tilt for [data-tilt] elements.
//
// A single delegated mousemove listener at the document level handles all
// tilt-enabled elements — no per-element listeners, no React-state churn.
// We update CSS custom properties (--tilt-x / --tilt-y / --tilt-scale) and
// the actual transform is applied by 3d-cute.css.
//
// Tilt strength comes from the optional `data-tilt` value (e.g. data-tilt="8"
// = max 8 degrees on each axis). Default: 6.
//
// Resets on mouseleave / blur. Skipped when prefers-reduced-motion is set.

let initialised = false;
let activeElements: HTMLElement[] = [];
let trackedHover: HTMLElement | null = null;

function getStrength(el: HTMLElement): number {
  const raw = el.getAttribute('data-tilt');
  const parsed = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 6;
}

function reset(el: HTMLElement) {
  el.style.setProperty('--tilt-x', '0deg');
  el.style.setProperty('--tilt-y', '0deg');
  el.style.setProperty('--tilt-scale', '1');
}

function refreshActiveElements() {
  activeElements = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'));
}

function onMouseMove(e: MouseEvent) {
  if (!activeElements.length) return;
  let entered: HTMLElement | null = null;

  for (const el of activeElements) {
    const rect = el.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) {
      if (el === trackedHover) reset(el);
      continue;
    }
    entered = el;
    const strength = getStrength(el);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Distance from centre, normalised to [-1, 1]
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    // rotateY follows horizontal cursor position; rotateX follows vertical (inverted)
    el.style.setProperty('--tilt-y', `${(dx * strength).toFixed(2)}deg`);
    el.style.setProperty('--tilt-x', `${(-dy * strength).toFixed(2)}deg`);
    el.style.setProperty('--tilt-scale', '1.02');
    break; // only the first matching element gets the tilt this frame
  }

  if (entered !== trackedHover) {
    if (trackedHover && trackedHover !== entered) reset(trackedHover);
    trackedHover = entered;
  }
}

function onMouseLeave() {
  if (trackedHover) {
    reset(trackedHover);
    trackedHover = null;
  }
}

export function initCuteTilt(): void {
  if (initialised || typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  // Touch devices: mousemove never fires meaningfully and the MutationObserver
  // would just burn cycles tracking phantom elements. Bail out.
  if (window.matchMedia?.('(hover: none), (pointer: coarse)').matches) return;

  refreshActiveElements();
  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  // Refresh the cached list whenever the DOM changes meaningfully.
  if ('MutationObserver' in window) {
    const obs = new MutationObserver(() => {
      // Cheap; querySelectorAll on a moderate DOM is sub-ms.
      refreshActiveElements();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  initialised = true;
}
