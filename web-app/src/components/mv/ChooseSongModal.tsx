"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MY_SONGS, SAMPLE_SONGS, formatDuration } from "@/lib/mv/mock";
import type { Song } from "@/lib/mv/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (song: Song) => void;
}

export function ChooseSongModal({ open, onClose, onPick }: Props) {
  const router = useRouter();
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

      {tab === "my" && songs.length === 0 ? (
        // MV-11: empty My Songs → prompt to create one instead of a blank list.
        <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
          </span>
          <div>
            <div className="text-[15px] font-bold">You haven&apos;t created any songs yet</div>
            <div className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>Create an AI song to use it in your music video.</div>
          </div>
          <Button onClick={() => { onClose(); router.push("/song/create"); }}>Create Song</Button>
        </div>
      ) : (
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
      )}
    </Modal>
  );
}
