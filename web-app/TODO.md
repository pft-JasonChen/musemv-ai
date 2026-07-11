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

## 2. Home page fails the axe WCAG AA gate (pre-existing; needs a design decision)

`npm run e2e` → `a11y: / has no WCAG A/AA violations` fails with 6
color-contrast nodes: the "Create" pill buttons in the home song rows —
white 12px bold text on `--accent` (#A855F7), ratio 3.95:1 vs the 4.5:1
minimum (`src/components/home/HomeView.tsx:163`, same pattern in
`src/components/community/SongExplore.tsx:38`).

Not fixed here because `--accent` is synced from the mobile Figma and token
values must not be edited (AGENTS.md). Options for the design owner: darker
accent variant for small text, larger/heavier label (≥ 19px bold only needs
3:1), or a different fill for these pills. Once decided, add a token and
re-run `npm run e2e`.

## 3. Dev-dependency audit findings (tooling only, not shipped code)

`npm audit`: 7 vulnerabilities (6 moderate, 1 high — vite path traversal via
the Storybook/Vitest toolchain). All in devDependencies; nothing reaches the
built app. Clearing them likely means the Storybook 8 → 9 major upgrade —
schedule as maintenance, don't `npm audit fix --force` casually.
