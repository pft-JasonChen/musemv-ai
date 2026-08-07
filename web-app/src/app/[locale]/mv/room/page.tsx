import { MvRoom } from "@/components/mv/MvRoom";

// No `AuthGuard` here on purpose (2026-08-07, designer request): unlike the
// other create-flow/Profile/History routes, `/mv/room` is the destination of
// the marketing Navbar's "Start for Free" — a guest has to be able to browse
// and compose before deciding to sign in, or the CTA is indistinguishable
// from every other login-gated button on the page. The gate moves to the
// point that actually costs something: `MvRoom`'s "Create Music Video"
// button calls `requireLogin` itself before opening the mode chooser.
export default function MvRoomPage() {
  return <MvRoom />;
}
