"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMvFlow } from "./MvFlowProvider";
import { MvDetail } from "./MvDetail";
import { MV_TYPES } from "@/lib/mv/mock";
import { MOCK_USER } from "@/lib/user";

export function MvResult() {
  const router = useRouter();
  const { resultUrl, compose, storyboard } = useMvFlow();

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
        shareUrl={`https://musemv.ai/mv/${title.toLowerCase().replace(/\s+/g, "-")}`}
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
        onEdit={() => router.push("/mv/edit")}
      />
    </div>
  );
}
