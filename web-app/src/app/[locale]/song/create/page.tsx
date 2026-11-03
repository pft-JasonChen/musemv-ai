import { SongCompose } from "@/components/song/SongCompose";
import type { Metadata } from "next";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/i18n/meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE, "songCreate");
}

// No `AuthGuard` here on purpose (product decision 2026-08-12), matching
// `/mv/room`: a guest must be able to open the create screen and compose
// before deciding to sign in. The gate moved to the point that costs
// something — `SongCompose`'s "Create Song" button calls `requireLogin`
// itself before spending credits. See spec area 03 and area 09 §3.
export default function Page() {
  return <SongCompose />;
}
