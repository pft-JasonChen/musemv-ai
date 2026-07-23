"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

function I({ d, size = 18 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

export function ProofView() {
  const router = useRouter();
  const [owner, setOwner] = useState("");
  const hash = "6456474747444888g6457dhjuu64777";

  return (
    <div className="mx-auto max-w-[520px] px-4 py-6 sm:px-6">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
        <I d="M15 18l-6-6 6-6" size={16} /> Back
      </button>

      <h1 className="text-[22px] font-extrabold tracking-tight">Proof of Creation</h1>
      <p className="mb-5 mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>
        Register your creation on-chain to certify authorship and creation time.
      </p>

      {/* Certificate */}
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border-2)", background: "var(--card)" }}>
        <div className="flex items-center gap-2 p-5" style={{ background: "linear-gradient(120deg, rgba(168,85,247,.25), rgba(67,56,202,.15))" }}>
          <span className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: "var(--accent)" }}>
            <I d="M12 2l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V6z M9 12l2 2 4-4" />
          </span>
          <div>
            <div className="text-[15px] font-extrabold">Certificate of Authenticity</div>
            <div className="text-[11px]" style={{ color: "var(--text-2)" }}>YouCam Muse · Verified Creation</div>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <Field label="Verification hash" value={hash} mono />
          <Field label="Issued" value="2026-06-22" />
          <Field label="Network" value="Polygon" />

          <div>
            <div className="mb-1 text-[12px]" style={{ color: "var(--text-2)" }}>Creator name</div>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Creator Name"
              className="w-full rounded-xl border bg-transparent p-3 text-[14px] outline-none"
              style={{ background: "var(--card-2)", borderColor: "var(--border-2)", color: "var(--text)" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Button className="w-full" onClick={() => router.back()}>Unlock for $4.90</Button>
        <div className="mt-3 flex items-center justify-center gap-3 text-[12px]" style={{ color: "var(--text-3)" }}>
          <button className="hover:underline" onClick={() => router.back()}>Restore</button>
          <span>|</span>
          <button className="hover:underline">Privacy Policy</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] font-semibold" style={mono ? { fontFamily: "ui-monospace, monospace" } : undefined}>{value}</span>
    </div>
  );
}
