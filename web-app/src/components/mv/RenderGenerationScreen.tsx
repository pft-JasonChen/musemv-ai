"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GenerationView } from "@/components/mv/GenerationView";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { isComposeReady } from "@/lib/mv/types";

export function RenderGenerationScreen() {
  const router = useRouter();
  const { startRender, resultUrl, compose } = useMvFlow();
  // Mid-flow guard: a reload/deep-link loses the compose form, so redirect to
  // the flow entry instead of rendering a job from default (empty) input.
  const valid = resultUrl != null || isComposeReady(compose);
  useEffect(() => {
    if (!valid) router.replace("/mv/room");
  }, [valid, router]);
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
