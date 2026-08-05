# TODO — deferred work (decisions on record)

Items agreed with the product owner but intentionally not done yet. Each entry
says why it's deferred and what "done" looks like. See also
`docs/DEVELOPER-HANDOVER.md` § Known gaps.

## 1. Define the Community feature (deferred 2026-07-11, product-owner decision)

The community surface (home feed sections, `/explore/mvs`, `/explore/songs`,
`/watch`, `/song/play`, `/creator`) is fully rendered but runs on **hard-coded
seed data** in `src/lib/mv/community.ts`. There is no product definition behind
it yet.

**Strategy proposal (2026-07-11):** `docs/community-strategy-proposal.html` — a
manager-facing proposal covering the four locked decisions (official-first feed
with locale-secondary; IP-based locale; HN-gravity time-decayed ranking;
auto-prescreen + human-review-of-gray-zone moderation), the Phase 1/2/3
algorithm roadmap, the Phase 1 ranking formula, the moderation pipeline + data
model, and open decisions still needing sign-off. Turn its conclusions into a
`specs/` spec + API contract once approved.

What "defined" means (all currently missing):

- **Product spec** — which community capabilities are real product scope
  (browse, play, like, share, follow, publish?) vs. demo dressing. Write it as
  a spec in `specs/` like `specs/mv-creation-flow.spec.md`, with EARS
  acceptance criteria.
- **Data contract** — community entities already have Zod schemas
  (`CommunityMv`, `CommunitySong`, `CommunityCreator` in
  `src/lib/api/schemas.ts`), but the `MuseApi` contract has **no community
  endpoints** (list/feed/detail/like/publish). Extend the contract + mock once
  the spec exists.
- **Real-vs-mock scope** — decide what the first backend release serves
  (e.g. read-only feeds) and what stays seeded.

Until then: do not build further community UI on top of the seed data.

## 2. Accent pills fail WCAG AA contrast (needs a design decision)

The small accent pills — "Create" in home/explore song rows, History filter
chips, SongCompose mode chips, Creator tabs — put white 12–13px bold text on
`--accent` (#A855F7): 3.95:1 vs the 4.5:1 minimum.

Status 2026-07-12: the axe gate now auto-scans every route and stays GREEN by
excluding exactly these pill selectors (`e2e/a11y.spec.ts`,
`KNOWN_CONTRAST_PILLS`) so it still catches everything else. Not fixed in code
because `--accent` is Figma-synced and token values must not be edited
(AGENTS.md). Options for the design owner: darker accent variant for small
text, larger/heavier label (≥ 19px bold only needs 3:1), or a different fill.
Once decided: add the token, restyle the pills, delete the exclusions.

## 3. Dev-dependency audit findings (tooling only, not shipped code)

Status 2026-07-12: Storybook upgraded 8 → 10 and vite 5 → 6; findings dropped
from 7 (1 high) to **2 moderate**, both from the `postcss` version pinned
inside `next@16.2.x` itself — upstream, dev-time only, no fix short of a Next
canary. Re-check after the next Next.js minor.

## 4. The production build strips `backdrop-filter`, so every DP blur is dead (found 2026-08-05, Slice 3b G7)

**`backdrop-filter` never renders in a production build.** The CSS minifier in the
`next build` pipeline keeps the obsolete `-webkit-` prefix and drops the standard
property. From `.next/static/chunks/*.css`:

```css
.detail-navbar{z-index:20;-webkit-backdrop-filter:blur(8px);background:linear-gradient(#09090b 0%,#09090b00 100%);…}
```

The source (`src/styles/designer/DetailNavbar.css`, verbatim from DP) declares
**both**. Only the prefixed one survives — and **Chrome 149 ignores the prefixed
form entirely**. Measured, in the same browser the e2e suite uses:

| element style                          | computed `backdropFilter` |
| -------------------------------------- | ------------------------- |
| `-webkit-backdrop-filter: blur(8px)`   | `none`                    |
| `backdrop-filter: blur(8px)`           | `blur(8px)`               |

So this is not a headless artifact and not a DP defect — DP's CSS is correct. It is
our build pipeline silently removing the only form that works.

**Scope: 13 of the 19 copied designer stylesheets use `backdrop-filter`** —
`DetailNavbar`, `RoomNavbar`, `MobileHeader`, `MobileTabBar`, `Card`, `Badge`,
`IconButton`, `CreditBalance`, `HistoryPage`, `LyricsSheet`, and more. Every
frosted-glass surface in the migrated UI is currently plain transparent.

**Where it is already visibly wrong:** `/explore/songs` at ≥1024px. DP's navbar
background is `linear-gradient(#09090b → transparent)` and relies on the blur to
keep the fade legible. With no blur, the song list scrolls **sharply** through the
navbar's lower half — rows and album thumbnails collide with the Back control and
sit under the tab pills, unreadable (screenshot in the slice's review notes).

**Why it never showed until now.** `/history` is the only other migrated screen with
a two-row navbar, and at 1440×800 it does not scroll at all (`scrollHeight` equals
the viewport), so nothing has ever passed behind that gradient. `/explore/mvs`'s
navbar has no tabs row, so its opaque top covers the whole 80px.

**Not fixed here, deliberately.** The fix is in the build/minifier configuration and
would change the rendering of **all 13 stylesheets across every migrated screen** —
it needs its own change, its own six-width re-check, and new visual baselines. Doing
it at the tail of a screen migration would bundle an app-wide visual change into a
slice that is supposed to be one screen. **Do NOT paper over it in
`designer-overrides.css`** by making the navbar opaque: that hides one symptom of a
systemic problem and leaves the other twelve.

**Done looks like:** the standard `backdrop-filter` present in
`.next/static/chunks/*.css`; a test asserting `getComputedStyle(navbar).backdropFilter
!== "none"` on a production build so it cannot regress silently; the six widths
re-checked and baselines re-recorded on Linux.
