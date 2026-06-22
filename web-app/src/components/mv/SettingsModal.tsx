"use client";

import { Modal } from "@/components/ui/Modal";
import type { MvSettings } from "@/lib/mv/types";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: MvSettings;
  onChange: (next: MvSettings) => void;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T;
  options: T[];
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] font-semibold">{label}</span>
      <div className="flex rounded-lg p-0.5" style={{ background: "var(--card-2)" }}>
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onSelect(o)}
            className="rounded-md px-3 py-1 text-[13px] font-semibold"
            style={{
              background: value === o ? "var(--accent)" : "transparent",
              color: value === o ? "#fff" : "var(--text-2)",
            }}
          >
            {o}
          </button>
        ))}
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

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-5">
        <Segmented label="Aspect Ratio" value={settings.ratio} options={["9:16", "16:9"]} onSelect={(ratio) => set({ ratio })} />
        <Segmented label="Resolution" value={settings.resolution} options={["720P", "1080P"]} onSelect={(resolution) => set({ resolution })} />

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
    </Modal>
  );
}
