"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GenerationView } from "@/components/mv/GenerationView";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { isComposeReady } from "@/lib/mv/types";

export function StoryboardGenerationScreen() {
  const router = useRouter();
  const { startStoryboard, storyboard, compose } = useMvFlow();
  // Mid-flow guard: a reload/deep-link loses the compose form, so redirect to
  // the flow entry instead of generating from default (empty) input.
  const valid = storyboard != null || isComposeReady(compose);
  useEffect(() => {
    if (!valid) router.replace("/mv/room");
  }, [valid, router]);
  if (!valid) return null;

  return (
    <GenerationView
      kind="storyboard"
      title="Crafting Your Storyboard"
      subtitle="AI is analyzing your audio and description to build the perfect cinematic sequence."
      estimate="~1 minute"
      nextHref="/mv/storyboard"
      start={startStoryboard}
      alreadyDone={storyboard != null}
    />
  );
}
