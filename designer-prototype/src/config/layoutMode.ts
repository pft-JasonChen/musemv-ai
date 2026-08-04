// Toggles which mobile experience renders below the app-mobile breakpoint
// (max-width: 767px, see AppLayout.css). Both versions stay fully built in
// the codebase — this single flag just switches which one is active:
//
// 'app'          — Figma app-reference Header + TabBar (current default)
// 'desktop-sync' — the collapsed-Sidebar/Navbar/Footer layout used on
//                  tablet/desktop, reused as-is at mobile widths
//
// Flip the value below to instantly swap back; no other code changes needed.
export const MOBILE_LAYOUT: 'app' | 'desktop-sync' = 'app'
