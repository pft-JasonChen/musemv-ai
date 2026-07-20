// English is the source of truth AND the fallback. Every user-facing string
// wired through useT() gets a key here. Other locale files (jpn.ts, kor.ts, …)
// hold only the keys that have been translated; anything missing or empty
// falls back to the English value below — so the prototype always renders.

export const en = {
  // Sidebar / primary nav
  "nav.home": "Home",
  "nav.createMv": "Create MV",
  "nav.createSong": "Create Song",
  "nav.history": "History",
  "nav.profile": "Profile",

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
