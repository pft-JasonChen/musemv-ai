"use client";

import { Modal } from "@/components/ui/Modal";
import { COST_RENDER, COST_STORYBOARD, type MvMode } from "@/lib/mv/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: MvMode) => void;
}

function ModeCard({
  icon,
  title,
  desc,
  time,
  cost,
  costColor,
  recommended,
  onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  time: string;
  cost: number;
  costColor: string;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="hover-lift relative flex-1 rounded-2xl border p-4 text-left"
      style={{ background: "var(--card-2)", borderColor: recommended ? "var(--accent)" : "var(--border-2)" }}
    >
      {recommended && (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Recommended
        </span>
      )}
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-[15px] font-bold">{title}</div>
      <div className="mt-1 text-[12px] leading-snug" style={{ color: "var(--text-2)" }}>
        {desc}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--card-3)", color: "var(--text-2)" }}>
          {time}
        </span>
        <span className="rounded-md px-2 py-1 text-[11px] font-bold" style={{ background: "color-mix(in srgb, " + costColor + " 18%, transparent)", color: costColor }}>
          {cost} credits
        </span>
      </div>
    </button>
  );
}

export function ModeModal({ open, onClose, onSelect }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="How would you like to create?" maxWidth={640}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ModeCard
          icon="🎞️"
          title="Create Storyboard First"
          desc="AI crafts a scene-by-scene storyboard for you to review and approve before rendering."
          time="~1 min"
          cost={COST_STORYBOARD}
          costColor="var(--accent)"
          recommended
          onClick={() => onSelect("storyboard_first")}
        />
        <ModeCard
          icon="⚡"
          title="Create MV Directly"
          desc="AI generates your music video immediately. Fast and effortless."
          time="~2 min"
          cost={COST_RENDER}
          costColor="var(--gold)"
          onClick={() => onSelect("direct")}
        />
      </div>
    </Modal>
  );
}
