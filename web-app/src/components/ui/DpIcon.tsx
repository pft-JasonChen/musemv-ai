/**
 * D4: the designer prototype draws icons as a CSS `mask-image` tinted by
 * `currentColor`, not as inline `<svg>`. All 90 of DP's icon filenames exist
 * under `public/assets/icons/ui/` (Phase 1 added the 6 WA was missing), so a
 * migrated screen names the file and the surrounding BEM class sizes it.
 *
 * Extracted here on the second migrated screen (`/explore/mvs`) — `/history`
 * had a private copy, and a third screen would have made three. It is
 * deliberately dumb: no icon registry, no name union. The BEM class does the
 * sizing, so passing the wrong class gives a 0×0 span, not a broken layout.
 *
 * This is NOT licence to convert WA's inline-`<svg>` backlog — AGENTS.md scopes
 * icon conversion to the screen being migrated.
 */
export function DpIcon({ name, className }: { name: string; className?: string }) {
  const url = `url("/assets/icons/ui/${name}.svg")`;
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  );
}
