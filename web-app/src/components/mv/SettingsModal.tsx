"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SubscribeModal } from "@/components/credits/SubscribeModal";
import { useAuth } from "@/components/providers/AuthProvider";
import type { MvSettings } from "@/lib/mv/types";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: MvSettings;
  onChange: (next: MvSettings) => void;
}

function Crown() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ color: "var(--gold)" }}>
      <path d="M3 7l4 4 5-6 5 6 4-4-1.5 12h-15z" />
    </svg>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onSelect,
  icons,
  locked,
  onLocked,
}: {
  label: string;
  value: T;
  options: T[];
  onSelect: (v: T) => void;
  icons?: Partial<Record<T, string>>;
  /** Options that require Muse Pro — greyed with a crown; tap routes to IAP. */
  locked?: Partial<Record<T, boolean>>;
  onLocked?: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] font-semibold">{label}</span>
      <div className="flex rounded-lg p-0.5" style={{ background: "var(--card-2)" }}>
        {options.map((o) => {
          const isLocked = locked?.[o] ?? false;
          return (
            <button
              key={o}
              onClick={() => (isLocked ? onLocked?.(o) : onSelect(o))}
              className="flex items-center gap-1.5 rounded-md px-3 py-1 text-[13px] font-semibold"
              style={{
                background: value === o && !isLocked ? "var(--accent)" : "transparent",
                color: isLocked ? "var(--text-3)" : value === o ? "#fff" : "var(--text-2)",
              }}
            >
              {icons?.[o] && <img src={icons[o]} width={16} height={16} alt="" style={{ opacity: isLocked ? 0.5 : value === o ? 1 : 0.6 }} />}
              {o}
              {isLocked && <Crown />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="relative h-6 w-10 rounded-full transition-colors"
      style={{ background: on ? "var(--accent)" : "var(--card-3)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: on ? 18 : 2 }}
      />
    </button>
  );
}

export function SettingsModal({ open, onClose, settings, onChange }: Props) {
  const set = (patch: Partial<MvSettings>) => onChange({ ...settings, ...patch });
  const { subscribed } = useAuth();
  const [subOpen, setSubOpen] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-5">
        <Segmented label="Aspect Ratio" value={settings.ratio} options={["9:16", "16:9"]} onSelect={(ratio) => set({ ratio })} />
        {/* MV-04: "High" quality is a Muse Pro feature — locked on the free plan. */}
        <Segmented
          label="Quality"
          value={settings.resolution}
          options={["Standard", "High"]}
          onSelect={(resolution) => set({ resolution })}
          icons={{ Standard: "/assets/icons/ui/ic_sd.svg", High: "/assets/icons/ui/ic_hd.svg" }}
          locked={{ High: !subscribed }}
          onLocked={() => setSubOpen(true)}
        />

        <div className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: "var(--border-3)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold">MV Title</span>
            <Toggle on={settings.title.on} onToggle={() => set({ title: { ...settings.title, on: !settings.title.on } })} />
          </div>
          {settings.title.on && (
            <input
              value={settings.title.text}
              onChange={(e) => set({ title: { ...settings.title, text: e.target.value } })}
              placeholder="Title text"
              className="rounded-lg px-3 py-2 text-[14px] outline-none"
              style={{ background: "var(--card-2)", color: "var(--text)" }}
            />
          )}

          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold">Author Name</span>
            <Toggle on={settings.author.on} onToggle={() => set({ author: { ...settings.author, on: !settings.author.on } })} />
          </div>
          {settings.author.on && (
            <input
              value={settings.author.text}
              onChange={(e) => set({ author: { ...settings.author, text: e.target.value } })}
              placeholder="Author name"
              className="rounded-lg px-3 py-2 text-[14px] outline-none"
              style={{ background: "var(--card-2)", color: "var(--text)" }}
            />
          )}

          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold">Show Subtitle</span>
            <Toggle on={settings.showSubtitle} onToggle={() => set({ showSubtitle: !settings.showSubtitle })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold">Show Watermark</span>
            <Toggle on={settings.watermark} onToggle={() => set({ watermark: !settings.watermark })} />
          </div>
        </div>
      </div>
      <SubscribeModal open={subOpen} onClose={() => setSubOpen(false)} />
    </Modal>
  );
}
