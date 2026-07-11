"use client";
import { GenerationView } from "@/components/mv/GenerationView";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
export default function Page() {
  const { startSong, songResult } = useSongFlow();
  return (
    <GenerationView kind="song" title="Composing Your Song" subtitle="AI is generating your original track. This usually takes about a minute." estimate="~1 minute" nextHref="/song/result" start={startSong} alreadyDone={songResult != null} />
  );
}
