"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export function ShareDialog({ open, onClose, title, url }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }
  async function nativeShare() {
    if (navigator.share) { try { await navigator.share({ title, url }); } catch {} }
    else copy();
  }
  const canNative = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Modal open={open} onClose={onClose} title="Share" maxWidth={420}>
      <p className="mb-3 text-[14px]" style={{ color: "var(--text-2)" }}>Share “{title}”</p>
      <div className="flex items-center gap-2 rounded-xl border p-1.5" style={{ borderColor: "var(--border-2)", background: "var(--card-2)" }}>
        <input readOnly value={url} className="min-w-0 flex-1 bg-transparent px-2 text-[13px] outline-none" style={{ color: "var(--text-2)" }} aria-label="Share link" />
        <button onClick={copy} className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-bold text-white" style={{ background: "var(--accent)" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {canNative && <Button className="mt-4 w-full" onClick={nativeShare}>Share…</Button>}
    </Modal>
  );
}
