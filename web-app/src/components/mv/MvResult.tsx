"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { buildShareUrl } from "@/lib/share";
import { MvDetail } from "./MvDetail";
import { MV_TYPES, mockStoryboard } from "@/lib/mv/mock";
import { MOCK_USER } from "@/lib/user";

export function MvResult() {
  const router = useRouter();
  const { resultUrl, compose, storyboard, setStoryboard, saveStoryboard } = useMvFlow();
  const { history } = useHistory();
  const shareId = history.find((h) => h.kind === "mv" && h.resultUrl === resultUrl)?.id ?? "";

  function editMv() {
    // Carry this video into the editor; ensure a storyboard exists (direct-mode renders have none).
    if (!storyboard) {
      const sb = mockStoryboard();
      setStoryboard(sb);
      saveStoryboard(sb);
    }
    router.push("/mv/edit");
  }

  useEffect(() => {
    if (!resultUrl) router.replace("/mv/room");
  }, [resultUrl, router]);

  if (!resultUrl) return null;

  const typeName = MV_TYPES.find((t) => t.id === compose.mvType)?.name ?? "Singing";
  const songTitle = compose.song?.title ?? "Untitled";
  const title = (compose.settings.title.on && compose.settings.title.text) || songTitle;
  const author = (compose.settings.author.on && compose.settings.author.text) || MOCK_USER.name;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6">
      <MvDetail
        videoUrl={resultUrl}
        downloadUrl={resultUrl}
        shareUrl={buildShareUrl(shareId)}
        info={{
          title,
          typeName,
          kind: "mv",
          dateLabel: "just now",
          author,
          songTitle,
          songArt: compose.song?.art,
          songDuration: compose.song?.durationSec,
          photos: compose.photos,
          ratio: compose.settings.ratio,
          resolution: compose.settings.resolution,
          scenes: storyboard?.scenes.length ?? null,
          subtitle: compose.settings.showSubtitle,
          hasCharacterTag: compose.photos.length > 0,
        }}
        onRecreate={() => router.push("/mv/room")}
        onEdit={editMv}
      />
    </div>
  );
}
