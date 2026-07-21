"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { MvDetail } from "./MvDetail";
import { SongDetail } from "@/components/song/SongDetail";
import { buildShareUrl } from "@/lib/share";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { SAMPLE_RESULT_VIDEO, SAMPLE_AUDIO, mockStoryboard, type Creation } from "@/lib/mv/mock";
import { DEFAULT_COMPOSE } from "@/lib/mv/types";
import { DEFAULT_STORYBOARD_LYRICS } from "@/lib/api/schemas";

/** Anything creation-shaped this dialog can present (fixture or live history). */
export type CreationLike = Creation;

interface Props {
  open: boolean;
  creation: CreationLike | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function CreationDialog({ open, creation, onClose, onDelete }: Props) {
  const router = useRouter();
  const { setCompose, patchCompose, setStoryboard, saveStoryboard } = useMvFlow();
  if (!creation) return null;
  const isMv = creation.kind === "mv";
  const del = () => { onDelete(creation.id); onClose(); };

  function editMv() {
    const sb = mockStoryboard();
    setStoryboard(sb);
    saveStoryboard(sb);
    setCompose({ ...DEFAULT_COMPOSE, description: creation!.title, song: { id: creation!.id, source: "sample", title: creation!.title, durationSec: 0, art: creation!.thumb }, settings: { ...DEFAULT_COMPOSE.settings, title: { on: true, text: creation!.title } } });
    router.push("/mv/edit");
    onClose();
  }

  function recreate() {
    if (isMv) {
      setCompose({ ...DEFAULT_COMPOSE, description: creation!.title, settings: { ...DEFAULT_COMPOSE.settings, title: { on: true, text: creation!.title } } });
      router.push("/mv/room");
    } else {
      router.push("/song/create");
    }
    onClose();
  }
  function useInMv() {
    patchCompose({ song: { id: creation!.id, source: "library", title: creation!.title, durationSec: 0, art: creation!.thumb } });
    router.push("/mv/room");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={940}>
      {isMv ? (
        <MvDetail
          videoUrl={SAMPLE_RESULT_VIDEO}
          posterUrl={creation.thumb}
          downloadUrl={SAMPLE_RESULT_VIDEO}
          shareUrl={buildShareUrl(creation.id)}
          info={{ title: creation.title, typeName: "", kind: "mv", dateLabel: creation.date, scenes: null }}
          onRecreate={recreate}
          onEdit={editMv}
          onDelete={del}
          onClose={onClose}
        />
      ) : (
        <SongDetail
          cover={creation.thumb}
          audioUrl={SAMPLE_AUDIO}
          lyrics={DEFAULT_STORYBOARD_LYRICS}
          downloadUrl={SAMPLE_AUDIO}
          shareUrl={buildShareUrl(creation.id)}
          info={{ title: creation.title, dateLabel: creation.date }}
          onRecreate={recreate}
          onUseInMv={useInMv}
          onDelete={del}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
