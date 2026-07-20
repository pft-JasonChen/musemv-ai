import { notFound } from "next/navigation";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppShell } from "@/components/shell/AppShell";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { isLocale, LOCALES } from "@/lib/i18n/config";

// Prerender one static tree per supported locale.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <LocaleProvider locale={locale}>
      <AppProviders>
        <AppShell>{children}</AppShell>
      </AppProviders>
    </LocaleProvider>
  );
}
