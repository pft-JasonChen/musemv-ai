import { FaqView } from "@/components/faq/FaqView";
import type { Metadata } from "next";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { pageMetadata } from "@/lib/i18n/meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(isLocale(locale) ? locale : DEFAULT_LOCALE, "faq");
}

export default function FaqPage() {
  return <FaqView />;
}
