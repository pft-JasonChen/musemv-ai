"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { buildShareUrl } from "@/lib/share";
import { SongDetail } from "./SongDetail";

export function SongResultView() {
  const router = useRouter();
  const { songResult } = useSongFlow();
  const { patchCompose } = useMvFlow();
  const { history } = useHistory();

  useEffect(() => {
    if (!songResult) router.replace("/song/create");
  }, [songResult, router]);

  if (!songResult) return null;

  function useInMv() {
    if (!songResult) return;
    patchCompose({ song: { id: songResult.id, source: "library", title: songResult.title, durationSec: songResult.durationSec, art: songResult.cover, lyrics: songResult.lyrics } });
    router.push("/mv/room");
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <SongDetail
        cover={songResult.cover}
        audioUrl={songResult.audioUrl}
        lyrics={songResult.lyrics}
        downloadUrl={songResult.audioUrl}
        shareUrl={buildShareUrl(history.find((h) => h.kind === "song" && h.resultUrl === songResult.audioUrl)?.id ?? "")}
        info={{ title: songResult.title, dateLabel: "just now", genre: songResult.genre, mood: songResult.mood, instrumental: songResult.instrumental, durationSec: songResult.durationSec }}
        onRecreate={() => router.push("/song/create")}
        onUseInMv={useInMv}
      />
    </div>
  );
}
