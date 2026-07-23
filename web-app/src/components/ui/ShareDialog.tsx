"use client";

import { useState } from "react";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

// MVP (2026-07-23): the Share dialog is copy-link only — no social-platform
// targets and no native share sheet. Social channels are deferred (TBD-SHARE-02).
export function ShareDialog({ open, onClose, title, url }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  return (
    <Modal open={open} onClose={onClose} title="Share" maxWidth={420}>
      <p className="mb-3 text-[14px]" style={{ color: "var(--text-2)" }}>Shareable public link to “{title}”</p>
      <div className="flex items-center gap-2 rounded-xl border p-1.5" style={{ borderColor: "var(--border-2)", background: "var(--card-2)" }}>
        <input readOnly value={url} className="min-w-0 flex-1 bg-transparent px-2 text-[13px] outline-none" style={{ color: "var(--text-2)" }} aria-label="Share link" />
        <button onClick={copy} className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-bold text-white" style={{ background: "var(--accent)" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </Modal>
  );
}
