"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { COST_SONG_RECREATE } from "@/lib/mv/types";
import { buildShareUrl } from "@/lib/share";
import { SongDetail } from "./SongDetail";

export function SongResultView() {
  const router = useRouter();
  const { songResult, resetForRecreate } = useSongFlow();
  const { patchCompose } = useMvFlow();
  const { history } = useHistory();
  const { credits } = useCredits();
  const [buyOpen, setBuyOpen] = useState(false);

  useEffect(() => {
    if (!songResult) router.replace("/song/create");
  }, [songResult, router]);

  if (!songResult) return null;

  function useInMv() {
    if (!songResult) return;
    patchCompose({ song: { id: songResult.id, source: "library", title: songResult.title, durationSec: songResult.durationSec, art: songResult.cover, lyrics: songResult.lyrics } });
    router.push("/mv/room");
  }

  // SONG-03: Recreate re-rolls the song for COST_SONG_RECREATE, keeping the
  // current one in History. Insufficient balance routes to IAP (GL-01).
  function recreate() {
    if (credits < COST_SONG_RECREATE) { setBuyOpen(true); return; }
    resetForRecreate();
    router.push("/song/creating");
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
        onRecreate={recreate}
        onUseInMv={useInMv}
      />
      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}
