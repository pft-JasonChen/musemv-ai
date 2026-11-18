# eBugs to fix — 2026-11-18

- **Query:** `epf_ebug.py search --ycm-web --pm-open` — Product YouCam Muse Web (315), BugBelong PM, status NewCreated + Assigned.
- **Retrieved at:** 2026-11-18 14:52 CST. 5 eBugs: 4 new, plus YMW261112P0006 carried from `BUGS-TO-FIX-2026-11-13.md` (untracked file from an earlier session, left as is).
- Attachments downloaded to the session scratchpad and reviewed; none are in the repo.

## Summary

| eBug | Title | Triage | Local status |
| --- | --- | --- | --- |
| YMW261111P0002 | [Auto][Home] Card info area on Trending MV incorrectly displays user avatar instead of video duration | Clear to fix | Committed (not pushed) |
| YMW261117P0004 | [Home][History][Prototype] Now Playing page layout is inconsistent between Explore and History | Needs PM | Blocked |
| YMW261112P0005 | [History] Layout and contents of content notice for removed content are inconsistent with prototype | Needs PM | Blocked |
| YMW261112P0007 | [History] After editing and merging the MV which was removed from community, the MV is still unable to be published again | Needs PM (confirm by-design) | Blocked |
| YMW261112P0006 | [YCM Backend console] There lacks "Something else" of Reason shown to creator | Needs PM (confirm by-design) | Blocked |

---

## YMW261111P0002 — [Auto][Home] Card info area on Trending MV incorrectly displays user avatar instead of video duration

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1111
- Reported by CRUZ_CHU at 2026-11-11T09:03:31
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261111P0002
- Retrieved at: 2026-11-18 14:52 CST
- Triage: **Clear to fix** — the rule was already decided (YMW261021P0001: every Home MV card shows the creator, not the duration; RD's 11-11 comment and the PM chat screenshot). The 2026-10-29 change (`1d31dde`) only reached the two hero carousels and missed the Trending rail.
- Local status: **Committed** (not pushed).
- Decision needed: None.
- Related code/spec: `src/components/home/NewMVsSection.tsx` (Trending rail, desktop + phone "Trending MV") — fixed. Already done: `HeroBannerSection.tsx` / `HeroBannerSectionV3.tsx` (`HeroCreator`). Not changed: the legacy `.hero-banner__subtitle` in `HeroBannerSection.tsx` (still "Retro \| 2-3 min" but `display:none` at every width it mounts); `/watch` phone subtitle "Singing \| 1-2 min" (`CommunityMvPlayer.tsx`) — not Home, outside this rule. `/explore/mvs` cards show no subtitle. Spec area 04 Home rails.

### Report

- Short Description:
  [Auto][Home] Card info area on Trending MV incorrectly displays user avatar instead of video duration
- Repro Steps:
  1. Login YCM Web
  2. Go to the Home page.
  3. Check the info / icon area on the Trending MV cards.
- Result:
  The card displays the currently logged-in user's avatar icon.
- Expect Result:
  Display info match mockup.(e.g., Popular | 2-3 min)
  Or please check if this need to adjust in mockup.

### Attachments
- result.png  `iForm/2026/11/11/654bfffd-a49b-48d8-a239-042b0671fd4b.png`
- YMW261021P0001.png  `iForm/2026/11/11/68a65eed-3c3f-40ec-9e6a-11b148e27ded.png`
- 2026-11-17_161528-prototype.png  `iForm/2026/11/17/3774180f-9086-4f2e-b69a-03f809c75b01.png`

### Comments
- **RUBY_FENG** (2026-11-11T11:41:35): Hi Cruz,
After discussing with the PM, we confirmed that all MV duration information on the Home page should be replaced with the creator's name. You can also refer to the conversation screenshot for details.
Therefore, we propose marking this issue as NAB. Thank you.

https://eperfect.perfectcorp.com/IF3/ebug/BPM/Start/ViewPage/View?BugCode=YMW261021P0001
- **KURT_WANG** (2026-11-17T16:18:36): Hi Jason,
 We found that trending music videos information on prototype are not changed, could you help adjust it？

(refer 2026-11-17_161528-prototype.png)

### Resolution and verification

- Root cause: Trending rail passed `subtitle={mv.meta}` ("Popular | 2-3 min"); the earlier fix only edited the two hero components.
- Resolution: Rail card line is now `mv.creator`, kept in the same flat-card layout (Card's community layout would also change the cover and add a likes pill, which nobody asked for). Spec 04 + `CHANGELOG-SPEC.md` 2026-11-18. New e2e "YMW261111P0002".
- Verified: typecheck / lint / test:run (225/225) / build exit 0. New e2e passes; mutation-tested (reverted to `mv.meta` → fails with Received "Popular | 2-3 min"). Local dev `/` at 1440 and 390: cards read Cinematic Dark / EchoingDreams, Nature & Earth / ChasingWaves, …
- Not verified: Production (not pushed). Visual gate not evaluated — the `/` `-linux` baselines need re-recording on Linux (card line text changed).

### Reply comment (paste into eBug)

<!-- Written once the change ships or the decision is made. -->

---

## YMW261117P0004 — [Home][History][Prototype] Now Playing page layout is inconsistent between Explore and History

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1117
- Reported by JOANNE_HSIEH at 2026-11-17T17:38:58
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261117P0004
- Retrieved at: 2026-11-18 14:52 CST
- Triage: **Needs PM** — two of the three differences are by design, one is an unspecified inconsistency.
- Local status: **Not handled this round** — product owner, 2026-11-18: only YMW261111P0002 and YMW261112P0005 are changed now.
- Decision needed: (1) Header flag: by design — History opens YOUR song on `/song/result`, and you can't report your own work (area 14: Report hidden on own content); Explore opens a community song on `/song/play`. Confirm. (2) Author line: own-song result screen has none (designer prototype has none either); Explore shows the creator. Keep, or add your name under the title? (3) Mute / Lyrics order: History = mute → lyrics, Explore = lyrics → mute. No spec; the History order came from a 2026-09-16 override that made the desktop-only volume button show on phones without reordering it. Pick one order for both (recommend Explore's lyrics → mute, a one-line move in `SongResultView`).
- Related code/spec: `src/components/song/SongResultView.tsx` (History → own song, mute `:537-565` then lyrics `:566-575`); `src/components/song/SongDetailView.tsx` `MobileNowPlaying` (lyrics `:399-406` then mute `:415-443`); `designer-overrides.css:535-545`; specs area 03 `:237/:280` still say volume is desktop-only (stale); area 14 own-content report rule.

### Report

- Short Description:
  [Home][History][Prototype] Now Playing page layout is inconsistent between Explore and History
- Repro Steps:
  1. https://musemv-ai.vercel.app/
  2. Go to Explore (Home) and click a song to open Now Playing
  3. Go to History and click an AI song to open Now Playing
  4. Compare the two Now Playing pages
- Result:
  Now Playing page layout is inconsistent between Explore and History
  - Header
  - Author
  - Order of the mute and lyrics button
- Expect Result:
  Pls check if this is expected

### Attachments
- prototype (2).png  `iForm/2026/11/17/e83cf629-442c-4abd-9309-236873a01104.png`

### Resolution and verification

- Root cause: Two different screens by design (own result vs community player); the button order drifted from an override.
- Resolution: —
- Verified: —
- Not verified: —

### Reply comment (paste into eBug)

<!-- Written once the change ships or the decision is made. -->

---

## YMW261112P0005 — [History] Layout and contents of content notice for removed content are inconsistent with prototype

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1112
- Reported by KURT_WANG at 2026-11-12T16:54:52
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261112P0005
- Retrieved at: 2026-11-18 14:52 CST
- Triage: **Decided 2026-11-18** (product owner): there is no ordinary-vs-permanent removal rule. Delete "A reviewer removed this content after a community report."; one wording for every removal (top line "This content violated our content policy.", explanation "This content contained {reason}."); the four draft reason sentences approved as written; Copyright → "authorization"; spec drops the Content Removed / Permanently Removed variants.
- Local status: **Committed** (not pushed) — awaiting the product owner's local test.
- Decision needed: Answered — see Triage.
- Related code/spec: `src/components/history/ContentNotice.tsx` (`NoticeBody` `:29-77`); `src/lib/report.ts` (`ContentRemoval.kind`, `REMOVAL_REASON_COPY` `:73-100`, `removalDetail` `:102-107`); seeds `src/lib/mv/mock.ts:406-443`; spec `specs/areas/14-content-report.md` §3.4, AC-RPT-11; storyboard content-report step 12.

### Report

- Short Description:
  [History] Layout and contents of content notice for removed content are inconsistent with prototype
- Repro Steps:
  1. Login YCM web
  2. History > expand actions menu of a music which is removed form community
  3. Click the notice
  4. Check layout and contents
- Result:
  Layout and contents of content notice for removed content are inconsistent with prototype
  1. Style of close button looks different.
  2. Background color of Got It button is different.
  3. Description texts are different.
  4. Removal reason doesn't align center.
- Expect Result:
  Should be consistent with prototype.

### Attachments
- 2026-11-12_164549.png  `iForm/2026/11/12/4f25e137-25fa-4e20-a7fc-3f8802fa2da5.png`
- 2026-11-12_165433-prototype.png  `iForm/2026/11/12/820175cb-0cf1-4628-b649-af02d9fae1bd.png`
- 2026-11-12_165949-removing_date.png  `iForm/2026/11/12/a0ef2475-0f79-49f4-a32f-53c690339b0c.png`
- Mobile_prototype vs dev site.jpg  `iForm/2026/11/16/496a37c9-941a-40b9-807e-cfbe096c92c7.jpg`

### Comments
- **KURT_WANG** (2026-11-12T17:02:31): Add 2 differences for removing date.
1. It lacks "X" in front of the removing date.
2. Font color and background color of the removing date looks different.

Please refer 2026-11-12_165949-removing_date.png.
- **JUNHAO_CHEN** (2026-11-16T11:50:34): Please help check whether the description should display "A reviewer removed this content after a community report." or "This content violated our content policy."? Thank you!
- **JOANNE_HSIEH** (2026-11-16T12:01:27): Hi RD, 
This UI issue also happens on mobile Galaxy S23 Ultra (Mobile_prototype vs dev site.jpg)
- **RUBY_FENG** (2026-11-18T11:15:00): Hi Jason,
Could you please help clarify the conditions for displaying each of the two strings in the top 3(2026-11-12_165433-prototype.png)? We need this information to correctly map the removal reasons and generate the corresponding text in the bottom 3(2026-11-12_165433-prototype.png). Thank you.

1. Top 3: There are currently two strings defined in the spec, but the conditions for displaying each string have not been specified.
   - "This content contained …"
   - "This content was permanently removed because it contained …"

2. Bottom 3: The displayed text should be generated by mapping the removal reason based on the string selected in the top three. For example, if the top string is "This content contained …" and the removal reason category is "Sexual", the final text should be:
   - "This content contained sexually explicit or adult material that is not permitted on Muse."

### Resolution and verification

- Root cause: Strings and their conditions live only in code; the spec says "keep existing variants".
- Resolution: `ContentRemoval.kind` removed (`src/lib/report.ts`), `removalDetail` is single-form, TBC markers dropped, "authorization"; `ContentNotice.tsx` top line fixed to "This content violated our content policy."; `contentModeration.remove` lost its severity arg; QA panel Removal type switch removed (`DemoPanel.tsx`); seed comments updated (`mock.ts`, ids kept). Spec area 14 §3.4 (copy + six-sentence table), QA panel line, checklist; storyboard S11 → v4 (all shots recaptured, VERIFICATION.md v4); `CHANGELOG-SPEC.md`. Not changed: History menu's own line "A reviewer removed this content. Tap to see the reason." (menu notice, not the dialog); Word v1.2 docx still mentions the two variants. RD's visual mismatches in the report (close button, Got It colour, centred reason, ✕ before the date) are their build vs the prototype — no prototype change.
- Verified: typecheck / lint (1 pre-existing warning) / test:run (225/225) / build exit 0. New e2e "YMW261112P0005" passes on both seeded removals; mutation-tested ("authorisation" → fails). S11 capture script passed against the production build; recaptured `12_notice_detail` shows the new copy.
- Not verified: Production (not pushed). Visual gate not evaluated.

### Reply comment (paste into eBug)

<!-- Written once the change ships or the decision is made. -->

---

## YMW261112P0007 — [History] After editing and merging the MV which was removed from community, the MV is still unable to be published again

- ePF status: Assigned
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: JASON_CHEN
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1112
- Reported by KURT_WANG at 2026-11-12T18:34:42
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261112P0007
- Retrieved at: 2026-11-18 14:52 CST
- Triage: **Needs PM (confirm by-design)** — prototype and spec both say a removed item can't be published again (area 14 AC-RPT-10: removed items hide Publish; no resubmission). RD/BE propose NAB.
- Local status: **Not handled this round** — product owner, 2026-11-18: only YMW261111P0002 and YMW261112P0005 are changed now.
- Decision needed: Confirm NAB. Related gap: Edit MV is still offered on a removed MV, and Merge re-renders the SAME creation, so the removal stays — editing can never lead to publishing. Keep Edit MV available (private edits are fine), or hide it on removed MVs? Either way I'd add one spec line: "removal stays with the creation through Edit / Merge".
- Related code/spec: `src/components/history/HistoryView.tsx:1010` (Publish hidden when removed), Edit MV condition near `:956`; `src/lib/contentModeration.ts:55-64` (removal keyed by creation id); `MvFlowProvider.tsx:236-253` + `HistoryProvider.tsx:30-34` (Merge replaces the same row). Spec area 14 `:83`, AC-RPT-10/11, Word v1.2 §6.

### Report

- Short Description:
  [History] After editing and merging the MV which was removed from community, the MV is still unable to be published again
- Repro Steps:
  1. Login YCM web
  2. History > expand actions menu of a MV which is removed form community > Edit MV
  3. Modify the prompt of a scene > Recreate
  4. Merge MV
  5. After finishing merging MV, enter history page and expand the actions menu
- Result:
  There is unable to publish the MV again.
- Expect Result:
  The MV is able to be published.

### Attachments
- 2026-11-12_183414.png  `iForm/2026/11/12/55ec1357-daec-4ef0-aff1-dcf35549adb5.png`

### Comments
- **JUNHAO_CHEN** (2026-11-16T11:00:28): Once a result is removed from the community, it can no longer be published. Please help check the behavior. Thank you.
- **RUBY_FENG** (2026-11-16T11:10:59): Hi Kurt,
The current behavior is consistent with both the mockup and the spec received by the backend team. --> Once an item is removed, it cannot be published again. Propose NAB.
- **KURT_WANG** (2026-11-16T11:20:55): Hi Jason,
 Please help check current behavior is expected or not, thanks.

### Resolution and verification

- Root cause: Not a defect by the current spec.
- Resolution: —
- Verified: —
- Not verified: —

### Reply comment (paste into eBug)

<!-- Written once the change ships or the decision is made. -->

---

## YMW261112P0006 — [YCM Backend console] There lacks "Something else" of Reason shown to creator

- ePF status: NewCreated
- Priority: 5 | Severity: 2
- ePF handler: JASON_CHEN | Assignee: 
- BugBelong: PM | Product: YouCam Muse Web | Version: 1.1 | Build: 1112
- Reported by KURT_WANG at 2026-11-12T17:23:02
- Form: https://eperfect.perfectcorp.com/IF3/ebug/BPM/FormView/YMW261112P0006
- Retrieved at: 2026-11-18 14:52 CST
- Triage: **Needs PM (confirm by-design)** — first logged in `docs/BUGS-TO-FIX-2026-11-13.md` (no ruling then). The web app treats "Something else" as a report input, not a removal category: Word spec v1.2 §6 says "The category chip corresponds to one of the six built-in reasons. Something else is a reporting input, not an additional removal category." So a reviewer approving a "Something else" report picks one of the six policy categories — the console's list matches the spec.
- Local status: **Not handled this round** — product owner, 2026-11-18: only YMW261111P0002 and YMW261112P0005 are changed now.
- Decision needed: Confirm NAB (optionally I copy the v1.2 §6 sentence into area 14 so it's in the area spec too).
- Related code/spec: `src/lib/report.ts:4-20` (`REPORT_REASONS` six + separate `REPORT_OTHER`); `ContentRemoval.reason` limited to the six; `ReportDialog.tsx:228/250`; spec area 14 `:36`, `:84`, TBD-RPT-07 (reason-ID mapping owned by RD); console UI out of scope (`:14`).

### Report

- Short Description:
  [YCM Backend console] There lacks "Something else" of Reason shown to creator
- Repro Steps:
  1. Login YCM web
  2. Report a MV and select the reason "something else"
  3. YCM backend console > find the reported song > select "Approve report — remove"
  4. Check Reason shown to creator
- Result:
  There lacks "Something else" of Reason shown to creator.
- Expect Result:
  Please help confirm if it's expected or not.

### Attachments
- 2026-11-12_171859.png  `iForm/2026/11/12/d204a523-e40a-4b7e-8f52-7bfd745ffa88.png`
- 2026-11-12_172250.png  `iForm/2026/11/12/f692d254-8efa-4302-ad42-870ef2d48e05.png`

### Resolution and verification

- Root cause: Not a defect by the current spec.
- Resolution: —
- Verified: —
- Not verified: —

### Reply comment (paste into eBug)

<!-- Written once the change ships or the decision is made. -->

---
