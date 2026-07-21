import { redirect } from "next/navigation";
import { localePath, isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";

// Legacy share route — consolidated onto the single `/share?id={hash}` scheme.
export default async function Page({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE;
  redirect(localePath(loc, `/share?id=${encodeURIComponent(id)}`));
}
