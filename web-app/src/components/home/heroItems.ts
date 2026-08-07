/**
 * ── DP's HERO CATALOG, RE-EXPRESSED AS PUBLIC PATHS (landing-page slice) ─────
 *
 * DP declares this list inside `HeroBannerSection.tsx` and imports all sixteen
 * files by name (`import video01 from '../../assets/hero/…?url'`). Two reasons
 * it becomes a module of its own here:
 *
 *  1. `?url` has no Next equivalent. WA serves static files from `public/`, so
 *     each entry is a path string — the same convention `songAudioUrl()` and
 *     `public/assets/icons/ui/` already use.
 *  2. BOTH hero treatments consume it. DP's `HeroBannerSectionV3` imports
 *     `HERO_ITEMS` back out of `HeroBannerSection`, which makes the mobile file
 *     a dependency of the desktop one for data reasons alone. Splitting the data
 *     out keeps the two treatments independently re-syncable, which is the whole
 *     reason both are ported rather than collapsed into one.
 *
 * ── WHY `encodeHero` EXISTS, AND WHY IT IS NOT OPTIONAL ─────────────────────
 *
 * Four of the sixteen filenames contain a literal SPACE (`hero_01_Vintage
 * Car.png`). Vite hashed those away; Next does not — `public/` is served at the
 * name on disk, and a raw space in a URL path is not a valid request. It 404s,
 * and a 404 on a `<video src>` is silent: no throw, no console error, just a
 * black box where the hero should be. `community.ts`'s `AUDIO` array already
 * encodes for the same reason (`Party%20Dance.mp3`).
 *
 * `encodeURIComponent` on the FILENAME only — not `encodeURI` on the whole path
 * — because `encodeURI` leaves `#` and `?` alone, and those are exactly the
 * characters that would silently truncate a path if a future drop used one.
 *
 * ── THE ASSETS THEMSELVES ARE VENDORED ON PURPOSE ───────────────────────────
 *
 * `designer-prototype/PROVENANCE.md` used to exclude `src/assets/hero/` along
 * with `covers/` and `storyboard-clips/`. The product owner lifted that for this
 * directory on 2026-08-07 (13 MB, versus `covers/`'s 257 MB), because DP's
 * name-imports mean a missing hero file does not degrade — it takes DP's whole
 * module graph down and every route renders white (`DESIGNER-TODO` A12).
 * **Every future drop must re-copy `src/assets/hero/` into both
 * `designer-prototype/` and `web-app/public/assets/hero/`.** The re-sync block
 * in `PROVENANCE.md` says so too; this comment is the second of the two places,
 * on purpose.
 */

export interface HeroItem {
  title: string;
  subtitle: string;
  video: string;
  thumbnail: string;
}

function encodeHero(filename: string): string {
  return `/assets/hero/${encodeURIComponent(filename)}`;
}

/** Verbatim from DP's `HERO_ITEMS` — titles, subtitles and pairing all unchanged. */
export const HERO_ITEMS: HeroItem[] = [
  {
    title: "Vintage Drive",
    subtitle: "Retro | 2-3 min",
    video: encodeHero("hero_01_Vintage Car-tmp-tmp.mp4"),
    thumbnail: encodeHero("hero_01_Vintage Car.png"),
  },
  {
    title: "Splash Zone",
    subtitle: "Energetic | 2-3 min",
    video: encodeHero("hero_02_Splash-tmp-tmp.mp4"),
    thumbnail: encodeHero("hero_02_Splash.png"),
  },
  {
    title: "Urban Runway",
    subtitle: "Fashion | 2-3 min",
    video: encodeHero("hero_03_Urban Fashion-tmp-tmp.mp4"),
    thumbnail: encodeHero("hero_03_Urban Fashion.png"),
  },
  {
    title: "Midnight Static",
    subtitle: "Ambient | 3-4 min",
    video: encodeHero("hero_04_midnight_static-tmp-tmp.mp4"),
    thumbnail: encodeHero("hero_04_midnight_static.jpeg"),
  },
  {
    title: "Pastel Dreams",
    subtitle: "Dreamy | 2-3 min",
    video: encodeHero("hero_05_pastel_film_converted.mp4"),
    thumbnail: encodeHero("hero_05_pastel_film.jpeg"),
  },
  {
    title: "Wonderland Echoes",
    subtitle: "Fantasy | 3-4 min",
    video: encodeHero("hero_06_alice_in_wonderland.mp4"),
    thumbnail: encodeHero("hero_06_alice_in_wonderland.jpg"),
  },
  {
    title: "J-Pop Rush",
    subtitle: "Pop | 2-3 min",
    video: encodeHero("hero_07_jpop.mp4"),
    thumbnail: encodeHero("hero_07_jpop.jpeg"),
  },
  {
    title: "Paper Wonderland",
    subtitle: "Whimsical | 2-3 min",
    video: encodeHero("hero_08_paper_wonderland_converted.mp4"),
    thumbnail: encodeHero("hero_08_paper_wonderland.jpeg"),
  },
];
