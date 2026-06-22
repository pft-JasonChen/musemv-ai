"use client";

import { GenerationView } from "@/components/mv/GenerationView";
import { useMvFlow } from "@/components/mv/MvFlowProvider";

export default function Page() {
  const { startRender, resultUrl } = useMvFlow();
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
