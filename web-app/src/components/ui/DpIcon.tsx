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
 *
 * `as` exists because some of DP's stylesheets size their icons with an ELEMENT
 * selector rather than a class — `CommunityProfilePage.css` has
 * `.community-profile__social i { width: 12px }`. Rendering a `<span>` there
 * matches nothing, and an unmatched mask is an invisible 0×0 box, not an error:
 * the counts render, the icons beside them silently do not. Measured on this
 * screen at all six widths before it was caught. Pass the tag DP used.
 */
export function DpIcon({
  name,
  className,
  as: Tag = "span",
}: {
  name: string;
  className?: string;
  /** The tag DP's stylesheet expects. Only matters when a rule selects by element. */
  as?: "span" | "i";
}) {
  const url = `url("/assets/icons/ui/${name}.svg")`;
  return (
    <Tag
      className={className}
      aria-hidden="true"
      style={{ maskImage: url, WebkitMaskImage: url }}
    />
  );
}
