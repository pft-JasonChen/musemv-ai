"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function NextSliceStub({ title, note }: { title: string; note: string }) {
  return (
    <div className="mx-auto max-w-[640px] px-6 py-24 text-center">
      <h1 className="text-[26px] font-extrabold">{title}</h1>
      <p className="mt-3 text-[15px]" style={{ color: "var(--text-2)" }}>{note}</p>
      <p className="mt-2 text-[13px]" style={{ color: "var(--text-3)" }}>
        This screen is the next slice of the build. The compose payload was captured in session storage.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/mv/room"><Button variant="secondary">Back to compose</Button></Link>
        <Link href="/"><Button variant="ghost">Home</Button></Link>
      </div>
    </div>
  );
}
