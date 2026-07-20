"use client";

// Route-level auth gate for signed-in-only pages (Create flows, Profile, History).
// While logged out it opens the sign-in modal; dismissing it returns Home.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loggedIn, hydrated, requireLogin } = useAuth();
  const { locale } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !loggedIn) {
      requireLogin(undefined, () => router.replace(localePath(locale, "/")));
    }
  }, [hydrated, loggedIn, requireLogin, router, locale]);

  if (!hydrated || !loggedIn) return null;
  return <>{children}</>;
}
