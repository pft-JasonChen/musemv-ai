// External store backing the mock auth boolean, read via useSyncExternalStore.
// Kept outside React so hydration reads localStorage without a setState-in-effect,
// and so getServerSnapshot() renders logged-out on the server (no SSR mismatch).

const LS_KEY = "muse_auth";
const listeners = new Set<() => void>();

export const authStore = {
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    if (typeof window !== "undefined") window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      if (typeof window !== "undefined") window.removeEventListener("storage", cb);
    };
  },
  getSnapshot(): boolean {
    try {
      return localStorage.getItem(LS_KEY) === "1";
    } catch {
      return false;
    }
  },
  getServerSnapshot(): boolean {
    return false;
  },
  set(v: boolean): void {
    try {
      if (v) localStorage.setItem(LS_KEY, "1");
      else localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  },
};

// "Am I hydrated yet?" as an external store — false during SSR/first paint, true after.
export const hydratedStore = {
  subscribe(): () => void {
    return () => {};
  },
  getSnapshot(): boolean {
    return true;
  },
  getServerSnapshot(): boolean {
    return false;
  },
};
