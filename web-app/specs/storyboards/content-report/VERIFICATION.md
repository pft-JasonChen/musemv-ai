# Content Report verification

Verified 2026-10-29 against the local production build on macOS.

- `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build`: passed. 174 unit tests. Lint retains one pre-existing unused `dirname` warning in `scripts/computed-style-diff.mjs`.
- Designer stylesheet check: 46 copied stylesheets remain verbatim. Existing undefined designer tokens are reported by that check and were not changed here.
- `capture_screenshots.mjs`: passed; 15 screenshots, desktop 1440×1000 and phone 390×844. It asserts guest access, six reasons, disabled Submit, whitespace rejection, draft retention, Done-only success, duplicate priority, five-success cap, hover/focus toast hold, refresh reset, failure/retry, self-report hiding, public Share removal, private Result and History notice. Same-route query changes use the supported native history API to retain one document/session. Mixed-kind cap accounting is additionally exercised by the component test.
- `verify_access.mjs`: passed; sign-out revokes private playback; removed items disappear from Home rails, official hero, Explore and public creator profile; public player media unmounts; refreshing resets the QA removal.
- Cap guard mutation: temporarily allowing a sixth submission makes the component guard test fail; restored implementation passes. No mutation remains in the source.
- S11 builder: passed with zero warnings; 15 acceptance criteria link to six paths. All 15 capture images and measured focus boxes are included. The flowchart and rendered offline storyboard were inspected.
- Word v1.2: rendered to four pages and all four pages visually inspected. The original Downloads document is unchanged.

The full behavior/axe e2e suite is left to the project's Stop hook. Port 3100 is not used by these checks. Linux visual baselines were not evaluated or re-recorded on this Mac; these storyboard images are walkthrough evidence, not replacement baselines. The changed report/notice states cover `/watch`, `/song/play`, `/explore/songs`, `/song/result`, `/share` and `/history`; QA moderation also affects Home, Explore, `/creator` and owner `/mv/result`.

Production report submission, immutable ownership IDs, reporter/session identity, server authorization, moderation persistence and cross-device synchronization remain RD integration work (TBD-RPT-07). The prototype performs no network requests for reporting.
