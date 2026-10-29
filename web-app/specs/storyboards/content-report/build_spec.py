#!/usr/bin/env python3
"""S11 Content Report. Approved decisions 2026-10-29, live production-app captures.
The common report flow is owned here; S1/S2/S4/S8/S9 cross-reference it.
Desktop 1440x1000, with the approved phone treatment shown as a supplemental path.
"""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
sys.path.insert(0,str(ROOT/'skills/yco-spec'))
import spec_builder

def step(n,shot,user,system,limits,exact=()):
 return dict(num=n,shot=shot+'.png',user=user,system=system,limits=limits,exact=list(exact),qa=system)

cfg={
 'feature_name':'Content Report', 'breadcrumb':'YouCam Muse Web &rarr; Content Report',
 'version':'v1','date':'2026-10-29','actor_label':'WEB UI','author':'YouCam Muse','guideline':'',
 'description':'Report a song or music video with a built-in reason or an explanation. Reviewers can remove public access while the creator keeps private playback.',
 'overview':[['Scope','MV and Song players, community Song Result, public Share, History and owner Result'],['Audience','Web RD and QA'],['Source','Content Report PRD v1.1 plus product-owner decisions of 28&ndash;29 October 2026'],['Capture','Live production app: desktop 1440 &times; 1000; phone supplement 390 &times; 844']],
 'paths':[
 {'num':1,'name':'Choose a reason and submit','desc':'Visitors and signed-in users follow the same flow for other people\'s and official content.','entry':'Report flag or public Share menu','outcome':'Success remains until dismissed','steps':[
 step(1,'01_reasons','Presses Report on a music video.','The report dialog opens with six built-in reasons and Something else.',[
 'No sign-in is required.','The title is Report Music Video for an MV and Report Song for a song.','Submit Report is always visible and disabled until the input is valid.','The six built-in reasons appear in the order shown.'],['Report Music Video','Something else','Submit Report']),
 step(2,'02_selected','Selects one built-in reason.','The selection changes and Submit Report becomes enabled.',['Only one built-in reason can be selected.']),
 step(3,'03_details','Selects Something else and enters Details.','A separate Details page shows the draft and character counter.',['Details accepts at most 1000 characters.','Whitespace-only input cannot be submitted.','Back and re-entry retain the draft; Clear empties it; closing the dialog resets it.'],['Details']),
 step(4,'04_success','Presses Submit Report.','The success confirmation replaces the form.',['Disable submission while it is in progress.','Only successful submissions count and mark the content as reported.','Do not automatically close the success state after three seconds.','Done dismisses it; existing Close, Escape and backdrop dismissal remain available.','A successful report never removes or hides the content.'],['Thank you for keeping Muse safe','Done'])]},
 {'num':2,'name':'Duplicate and session limit','desc':'Exactly two controls prevent repeated or excessive reports in one document lifetime.','entry':'Report an already reported item or a sixth different item','outcome':'Feedback without opening the dialog','steps':[
 step(1,'05_duplicate','Presses Report on content already successfully reported in this session.','A neutral toast appears and the report dialog stays closed.',['Duplicate feedback wins even when the five-report cap is also reached.','Song and MV keys are distinct even when their IDs match.'],['You already reported this content.']),
 step(2,'06_cap','Successfully reports five items, then presses Report on a sixth different item.','An amber toast appears and the report dialog stays closed.',['MV and Song share five successful submissions; the fifth is allowed.','Cancelled and failed attempts do not count.','Client navigation and sign-in changes preserve the session; refresh or a new document resets it.','Both guard toasts last three seconds and hold on hover or focus; leaving restarts three seconds.','Phone toasts sit above the tab bar.'],['You have reached the report limit for this session.'])]},
 {'num':3,'name':'Failure and retry','desc':'The user can recover without losing the report draft.','entry':'Submission fails','outcome':'Retry succeeds','steps':[
 step(1,'07_failure','Submits while the submission service fails.','The error appears and the reason or Details remains editable.',['Do not count a failure or mark the item as reported.','Keep the report open and retain its input.','Submitting disables repeated clicks.'],['Couldn’t submit your report. Please try again.']),
 step(2,'04_success','Presses Submit Report again after the failure is resolved.','The retry enters success and counts once.',['The user retries explicitly; no automatic retry or automatic removal.'])]},
 {'num':4,'name':'Own content is not reportable','desc':'Official content remains reportable; ownership is based on the signed-in account.','entry':'Signed-in creator opens their own content','outcome':'No Report entry','steps':[
 step(1,'09_own_result','Opens their own song result while signed in.','The Report entry is absent.',['Reject attempted self-report submissions as well as hiding the entry.','Visitors can report public content; after sign-in evaluate ownership against the account.','The reported creator is not shown the reporter\'s identity.','Reporter identification or logging is defined by RD, separately from this anonymity promise.'])]},
 {'num':5,'name':'Reviewer removal and private access','desc':'Reviewer decisions change public visibility, not creator ownership.','entry':'Reviewer removes a reported item','outcome':'Public access unavailable; owner retains private playback','steps':[
 step(1,'08_share_removed','Opens a public Share link after reviewer removal.','The unavailable state replaces the media.',['Remove the item from Home, Explore and public creator profiles.','Public Share and player links are unavailable even to the signed-in owner.','Do not mount playable audio or video in unavailable views.'],["This link isn't available"]),
 step(2,'10_private_removed','The signed-in creator opens their own Result after removal.','Private playback and the removal notice remain available.',['Only the signed-in creator can use this private access.','Normal and permanent removal have the same access rules.','Signing out revokes private playback.']),
 step(3,'11_history_notice','Opens the removed item\'s more menu in History.','The notice appears above normal actions and Publish is absent.',['Keep the History list item visually normal: no badge, grey thumbnail or status label.'],['Removed from community','A reviewer removed this content. Tap to see the reason.']),
 step(4,'12_notice_detail','Presses the removal notice.','Content Notice shows the existing content and reason details.',['Keep Content Removed and Permanently Removed variants.','Retain publication and removal information, the category chip and existing reason explanations.','Got It dismisses the notice; no resubmission instructions or eligibility details.'],['Content Notice','Got It'])]},
 {'num':6,'name':'Phone presentation supplement','desc':'The same decisions apply in the existing phone layout.','entry':'Report on a phone','outcome':'Bottom sheet and manual confirmation','steps':[
 step(1,'13_mobile_reasons','Presses the report flag in the phone player.','A bottom sheet shows the same reasons and disabled Submit.',['The title follows the media kind.']),
 step(2,'14_mobile_details','Chooses Something else.','Details opens inside the sheet.',['The 1000-character and nonempty rules are unchanged.']),
 step(3,'15_mobile_success','Submits a valid report.','Success stays in the sheet until dismissed.',['No three-second auto-dismissal.'],['Done'])]}
 ],
 'prototype_deltas':[
 ('Report service','Local success simulation and a session-only QA failure control.','RD supplies endpoint, reason IDs, payload, identity/session and idempotent retry protocol.'),
 ('Moderation','QA selects an item, one of six reasons and removal type; state updates in the current document and resets on refresh. Fixed removed examples remain.','Persist reviewer decisions, enforce public/private authorization and synchronize across devices.'),
 ('Account identity','One mock account uses stable fixture attribution and local History ownership.','Use immutable account and owner IDs; never display names as authorization.'),
 ],
 'decisions':[
 ('D-01','Six reasons only?','Keep six built-in reasons plus Something else; always show disabled Submit until valid.'),
 ('D-02','Success dismissal?','Done manually dismisses; no three-second automatic dismissal.'),
 ('D-03','Authentication and ownership?','Guests may report; hide and block self-report after sign-in; official content remains reportable.'),
 ('D-04','Anti-abuse session?','Two controls only: duplicate priority and five mixed-kind successes per document lifetime; refresh resets.'),
 ('D-05','Toast duration?','Three seconds with hover and focus hold, restarting after leave.'),
 ('D-06','Failure?','Keep input, show the approved error, allow retry and do not count failure.'),
 ('D-07','Removal design and access?','Keep the existing notice design; all public access stops, signed-in owner retains History and Result playback.'),
 ('D-08','QA demonstration?','Use the existing QA panel; new failure and reviewer state is session-only and resets on refresh.'),
 ],
 'open_questions':[('Q-01','RD report and moderation integration','Provide endpoint, reason IDs, identity/session, idempotency, reviewer state and authorization contract. Product behavior is settled.','RD')],
 'changelog':[('v1','2026-10-29','Approved reporting and removal behavior with live desktop captures and a phone supplement.')],
 'svg_path':str(HERE/'user-flowchart.svg'),'screenshots_dir':str(HERE/'specs/screenshots'),'out_dir':str(HERE/'specs'),
 'prototype_src':[str(ROOT/'src/components/ui/ReportDialog.tsx'),str(ROOT/'src/lib/report.ts'),str(ROOT/'src/components/history/ContentNotice.tsx'),str(ROOT/'src/components/history/HistoryView.tsx')],
 'comments_enabled':False,
}
cfg['criteria'] = [
 ('AC-RPT-01','Guest reporting opens the correct media title without requiring sign-in.',['P1-S1','P6-S1']),
 ('AC-RPT-02','Six ordered reasons and Something else follow selection, Details validation and draft-retention rules.',['P1-S1','P1-S2','P1-S3','P6-S2']),
 ('AC-RPT-03','Submit stays visible, disabled until valid and while sending.',['P1-S1','P1-S2','P3-S1']),
 ('AC-RPT-04','Success has Done and never closes automatically after three seconds.',['P1-S4','P6-S3']),
 ('AC-RPT-05','Reporting success does not hide or remove content.',['P1-S4']),
 ('AC-RPT-06','Only successful submissions count toward five across songs and MVs.',['P2-S2','P3-S1']),
 ('AC-RPT-07','Duplicate feedback takes priority over the cap and is checked before submission.',['P2-S1','P2-S2']),
 ('AC-RPT-08','Guard toasts last three seconds with hover and focus hold.',['P2-S1','P2-S2']),
 ('AC-RPT-09','Reviewer removal blocks public access while retaining signed-in owner private playback.',['P5-S1','P5-S2']),
 ('AC-RPT-10','History keeps its normal list appearance, with a menu notice and no Publish.',['P5-S3']),
 ('AC-RPT-11','The existing notice variants and reason explanations remain, with Got It and no resubmission.',['P5-S4']),
 ('AC-RPT-12','Reporting is anonymous to creators and separate from the customer-support issue category.',['P4-S1']),
 ('AC-RPT-13','Self-report is hidden and blocked after sign-in; official content stays reportable.',['P4-S1']),
 ('AC-RPT-14','Failure retains the draft, counts nothing and allows explicit retry.',['P3-S1','P3-S2']),
 ('AC-RPT-15','QA failure and reviewer state are session-only, resettable and do not mutate fixed content.',['P3-S1','P5-S1','P5-S2']),
]
if __name__=='__main__':
 spec_builder.write_specs(cfg)
 # Normalize optional empty template sections without changing the shared builder.
 for name in ['spec.html', 'spec-bundled.html']:
  out=HERE/'specs'/name
  out.write_text('\n'.join(line.rstrip() for line in out.read_text().splitlines())+'\n')
