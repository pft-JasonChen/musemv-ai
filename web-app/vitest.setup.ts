import "@testing-library/jest-dom/vitest";

// Node >= 25 ships its own Web Storage on globalThis, and without `--localstorage-file` its
// `localStorage` getter returns undefined. Vitest 3's jsdom environment only copies a window key
// onto globalThis when the key is absent there or on vitest's fixed key list — `localStorage` and
// `sessionStorage` are on neither, so Node's empty getter shadows jsdom's Storage and every
// `localStorage.clear()` throws. Point both back at the jsdom window vitest exposes as `jsdom`.
const dom = (globalThis as { jsdom?: { window: Window } }).jsdom;
if (dom) {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(globalThis, key, { get: () => dom.window[key], configurable: true });
  }
}
