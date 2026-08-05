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

  // Profile — feedback dialog
  "profile.feedbackPlaceholder": "Tell us what you think…",
  "common.send": "Send",

  // Language picker
  "language.title": "Language",
  "language.subtitle": "Choose the language for the app. Untranslated text stays in English.",

  // Profile toasts
  "profile.toast.updated": "Profile updated",
  "profile.toast.feedback": "Thanks for your feedback!",
  "profile.toast.signedOut": "Signed out",
} as const;

export type Dictionary = typeof en;
export type TKey = keyof Dictionary;
