import { MvRoom } from "@/components/mv/MvRoom";
import type { Metadata } from "next";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/i18n/meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE, "mvRoom");
}

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
