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

/** Social share-composer targets (spec P1-S2: Facebook / X / Pinterest / Reddit). */
function socialTargets(url: string, title: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return [
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { name: "Pinterest", href: `https://pinterest.com/pin/create/button/?url=${u}&description=${t}` },
    { name: "Reddit", href: `https://www.reddit.com/submit?url=${u}&title=${t}` },
  ];
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
      <p className="mb-3 text-[14px]" style={{ color: "var(--text-2)" }}>Shareable public link to “{title}”</p>
      <div className="flex items-center gap-2 rounded-xl border p-1.5" style={{ borderColor: "var(--border-2)", background: "var(--card-2)" }}>
        <input readOnly value={url} className="min-w-0 flex-1 bg-transparent px-2 text-[13px] outline-none" style={{ color: "var(--text-2)" }} aria-label="Share link" />
        <button onClick={copy} className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-bold text-white" style={{ background: "var(--accent)" }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {socialTargets(url, title).map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-xl border py-2 text-[12px] font-semibold"
            style={{ borderColor: "var(--border-2)", background: "var(--card-2)", color: "var(--text)" }}
          >
            {s.name}
          </a>
        ))}
      </div>
      <p className="mt-2 text-[11px]" style={{ color: "var(--text-3)" }}>
        If you share with a third-party service, its privacy policies &amp; terms apply.
      </p>

      {canNative && <Button className="mt-4 w-full" onClick={nativeShare}>Share…</Button>}
    </Modal>
  );
}
