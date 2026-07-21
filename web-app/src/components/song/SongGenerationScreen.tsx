"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GenerationView } from "@/components/mv/GenerationView";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { isSongReady } from "@/lib/mv/types";

export function SongGenerationScreen() {
  const router = useRouter();
  const { startSong, songResult, songCompose } = useSongFlow();
  // Mid-flow guard: a reload/deep-link loses the compose form, so redirect to
  // the flow entry instead of generating from default (empty) input.
  const valid = songResult != null || isSongReady(songCompose);
  useEffect(() => {
    if (!valid) router.replace("/song/create");
  }, [valid, router]);
  if (!valid) return null;

  return (
    <GenerationView
      kind="song"
      title="Composing Your Song"
      subtitle="AI is generating your original track. This usually takes about a minute."
      estimate="~1 minute"
      nextHref="/song/result"
      start={startSong}
      alreadyDone={songResult != null}
    />
  );
}
