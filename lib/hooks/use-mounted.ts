import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

// Recharts assigns each chart instance auto-incrementing ids (clipPath/gradient
// defs) from a module-level counter that starts fresh on the client but can
// already be past zero on a warm server process — so the very first SSR pass
// of any recharts component can hydrate with mismatched ids. Deferring the
// actual chart to mount-time sidesteps it entirely: server and the hydration
// pass both read `false` here, so there's nothing to mismatch; the real chart
// appears on the very next render once the client snapshot flips to `true`.
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
