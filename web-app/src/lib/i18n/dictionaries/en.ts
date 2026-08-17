// English is the source of truth AND the fallback. Every user-facing string
// wired through useT() gets a key here. Other locale files (jpn.ts, kor.ts, …)
// hold only the keys that have been translated; anything missing or empty
// falls back to the English value below — so the prototype always renders.

export const en = {
  // Sidebar / primary nav.
  // Labels follow the designer prototype (plan Phase 2, Slice 2a): "Create MV" →
  // "AI Music Video", "Create Song" → "AI Song". The KEYS deliberately keep their
  // old names — renaming them would churn every locale file for a copy change, and
  // the non-English dictionaries are intentionally empty and fall back here anyway.
  // Verified before changing: no e2e selector matches a sidebar label (the
  // "Create Song" in song-flow.spec.ts is a page CTA with role=button; nav items
  // are links).
  "nav.home": "Home",
  "nav.createMv": "AI Music Video",
  "nav.createSong": "AI Song",
  "nav.history": "History",
  "nav.profile": "Profile",
  // Present in DP's sidebar but hidden for MVP (CH6) — keys exist so V2 can
  // unhide without touching this file.
  "nav.storybook": "AI Storybook",
  "nav.blog": "Blog",
  // Sidebar profile footer
  "nav.freePlan": "Free plan",
  "nav.upgrade": "Upgrade",
  // Mobile chrome (MobileTabBar / MobileHeader)
  "nav.explore": "Explore",
  "nav.create": "Create",
  "nav.account": "Account",

  // Profile — stats & rows
  "profile.credits": "Credits",
  "profile.mvs": "MVs",
  "profile.songs": "Songs",
  "profile.musePro": "Muse Pro",
  "profile.validity": "Validity",
  "profile.upgrade": "Upgrade",
  "profile.subscribe": "Subscribe",
  "profile.manage": "Manage",
  "profile.proSubtitle": "More credits · faster renders · no watermark",
  "profile.proActive": "Active — thanks for being Pro",
  "profile.changePhoto": "Change Photo",
  "profile.toast.subscribed": "Welcome to Muse Pro!",
  "account.free": "Free",
  "profile.notifications": "Notifications",
  "profile.on": "On",
  "profile.off": "Off",
  "profile.sendFeedback": "Send Feedback",
  "profile.language": "Language",
  "profile.settings": "Settings",
  "profile.signOut": "Sign Out",

  // Profile — edit dialog
  "profile.editProfile": "Edit Profile",
  "profile.name": "Name",
  "profile.email": "Email",
  "profile.save": "Save",
  "profile.cancel": "Cancel",

  // Profile — feedback dialog (a CS support ticket; spec areas/06 §3.1).
  // "Ticket" never appears in the copy — the user-facing word stays "Feedback"
  // (§10 decision 12), so no e2e selector or dictionary value had to churn.
  "profile.feedbackPlaceholder": "Tell us what you think…",
  "profile.feedback.type": "Type",
  "profile.feedback.typePlaceholder": "Select an issue type",
  "profile.feedback.typePurchase": "Purchase and Payment",
  "profile.feedback.typeAccount": "Account",
  "profile.feedback.typeFeature": "Feature Issue",
  "profile.feedback.typeCommunity": "Community Report",
  "profile.feedback.typeOthers": "Others",
  "profile.feedback.subject": "Subject",
  "profile.feedback.subjectPlaceholder": "What's this about?",
  "profile.feedback.description": "Description",
  "profile.feedback.attachment": "Attachment",
  "profile.feedback.addFile": "Add file",
  "profile.feedback.attachmentHint": "Any file type · 10 MB total",
  "profile.feedback.attachmentTotal": "used of 10 MB",
  "profile.feedback.attachmentTooLarge": "File too large — 10 MB total.",
  "profile.feedback.removeFile": "Remove file",
  "profile.feedback.emailPlaceholder": "Enter your email",
  "profile.feedback.sendError": "Couldn't send. Please try again.",
  "profile.feedback.sending": "Sending…",
  "profile.feedback.sentTitle": "Feedback Sent",
  // `{email}` is substituted at render time — the only interpolated string here.
  "profile.feedback.sentBody": "Thanks — we'll reply to {email}.",
  "profile.feedback.done": "Done",
  "common.send": "Send",

  // Language picker
  "language.title": "Language",
  "language.subtitle": "Choose the language for the app. Untranslated text stays in English.",

  // Profile toasts
  "profile.toast.updated": "Profile updated",
  // `profile.toast.feedback` was removed 2026-08-17: the feedback dialog now
  // confirms in place with its own "Feedback Sent" step (AC-PROF-13), so a toast
  // would be a second, redundant acknowledgement of the same submit.
  "profile.toast.signedOut": "Signed out",
} as const;

export type Dictionary = typeof en;
export type TKey = keyof Dictionary;
