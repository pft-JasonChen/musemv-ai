"use client";

import { GenerationView } from "@/components/mv/GenerationView";
import { useMvFlow } from "@/components/mv/MvFlowProvider";

export default function Page() {
  const { startStoryboard, storyboard } = useMvFlow();
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
