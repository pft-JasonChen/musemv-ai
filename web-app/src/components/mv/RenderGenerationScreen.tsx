"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GenerationView } from "@/components/mv/GenerationView";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { isComposeReady } from "@/lib/mv/types";

export function RenderGenerationScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const { startRender, resultUrl, compose } = useMvFlow();
  // Mid-flow guard: a reload/deep-link loses the compose form, so redirect to
  // the flow entry instead of rendering a job from default (empty) input.
  const valid = resultUrl != null || isComposeReady(compose);
  useEffect(() => {
    // R-9: through `localePath`, not a bare path. This was the one flow guard of
    // five that skipped it, so a non-English visitor who reloaded here was sent
    // to the UNPREFIXED `/mv/room` and lost their locale. The cookie redirect
    // hides it in English, which is exactly why it survived to 2026-08-19.
    if (!valid) router.replace(localePath(locale, "/mv/room"));
  }, [valid, router, locale]);
  if (!valid) return null;

  return (
    <GenerationView
      kind="render"
      title="Creating Your Music Video"
      subtitle="Your cinematic MV is being rendered. We'll notify you when it's ready."
      estimate="~2 minutes"
      nextHref="/mv/result"
      start={startRender}
      alreadyDone={resultUrl != null}
    />
  );
}
