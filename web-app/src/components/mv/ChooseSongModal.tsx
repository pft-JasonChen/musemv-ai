"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { MY_SONGS, SAMPLE_SONGS, formatDuration } from "@/lib/mv/mock";
import type { Song } from "@/lib/mv/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (song: Song) => void;
}

export function ChooseSongModal({ open, onClose, onPick }: Props) {
  const [tab, setTab] = useState<"my" | "sample">("my");
  const songs = tab === "my" ? MY_SONGS : SAMPLE_SONGS;

  return (
    <Modal open={open} onClose={onClose} title="Choose Song">
      <div className="mb-3 flex border-b" style={{ borderColor: "var(--border-3)" }}>
        {(["my", "sample"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-[13px] font-bold"
            style={{
              color: tab === t ? "var(--accent)" : "var(--text-2)",
              borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
            }}
          >
            {t === "my" ? "My Songs" : "Sample Songs"}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-1">
        {songs.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-xl p-2"
            style={{ background: "var(--card-2)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.art} alt="" className="h-11 w-11 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">{s.title}</div>
              <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
                {formatDuration(s.durationSec)}
              </div>
            </div>
            <button
              onClick={() => {
                onPick(s);
                onClose();
              }}
              className="rounded-lg px-3 py-1.5 text-[13px] font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Use
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
