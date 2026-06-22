"use client";
import { GenerationView } from "@/components/mv/GenerationView";
import { useMvFlow } from "@/components/mv/MvFlowProvider";
export default function Page() {
  const { startSong, songResult } = useMvFlow();
  return (
    <GenerationView kind="song" title="Composing Your Song" subtitle="AI is generating your original track. This usually takes about a minute." estimate="~1 minute" nextHref="/song/result" start={startSong} alreadyDone={songResult != null} />
  );
}
