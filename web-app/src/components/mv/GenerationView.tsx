"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useSongFlow } from "@/components/providers/SongFlowProvider";

interface Props {
  kind: "storyboard" | "render" | "song";
  title: string;
  subtitle: string;
  estimate: string;
  /** route to go to when this generation completes */
  nextHref: string;
  /** start function pulled from context */
  start: () => void;
  /** guard: if this is already satisfied, skip starting (e.g. storyboard exists) */
  alreadyDone: boolean;
}

export function GenerationView({ kind, title, subtitle, estimate, nextHref, start, alreadyDone }: Props) {
  const router = useRouter();
  // MV and Song generations each own their progress; pick by what this screen shows.
  const mvGen = useMvFlow().gen;
  const songGen = useSongFlow().gen;
  const gen = kind === "song" ? songGen : mvGen;

  // Start the mock generation once on mount.
  useEffect(() => {
    if (!alreadyDone) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate when done. Trust the job status alone — a real backend may report
  // "done" before progress reaches exactly 100 (the mock always hits 100).
  // MV-09: on reload the storyboard/result rehydrates from persistence while
  // `gen` resets to idle, so the job status never reaches "done" and the screen
  // would hang at 0%. `alreadyDone` means the artifact already exists — forward
  // to the next screen instead of waiting on a generation that will never run.
  useEffect(() => {
    if (alreadyDone || gen.status === "done") {
      const t = setTimeout(() => router.push(nextHref), 350);
      return () => clearTimeout(t);
    }
  }, [alreadyDone, gen.status, nextHref, router]);

  const backHref = kind === "song" ? "/song/create" : "/mv/room";

  if (gen.status === "failed") {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center px-6 py-16 text-center" role="alert">
        <div className="grid h-[88px] w-[88px] place-items-center rounded-full" style={{ background: "var(--card-2)" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF4E50" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        </div>
        <h1 className="mt-7 text-[22px] font-extrabold">Generation Failed</h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--text-2)" }}>
          Something went wrong while generating. Your credits were not charged — you can retry now or adjust your input and try again.
        </p>
        <div className="mt-8 flex gap-2">
          <Button variant="ghost" onClick={() => router.push(backHref)}>Back</Button>
          <Button onClick={start}>Retry</Button>
        </div>
      </div>
    );
  }

  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (gen.progress / 100) * circ;

  return (
    <div className="mx-auto flex max-w-[520px] flex-col items-center px-6 py-16 text-center">
      <div className="relative grid place-items-center" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--card-2)" strokeWidth="8" />
          <circle
            cx="70" cy="70" r={r} fill="none" stroke="var(--accent)" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray .15s linear" }}
          />
        </svg>
        <span className="absolute text-[24px] font-extrabold">{gen.progress}%</span>
      </div>

      <h1 className="mt-7 text-[22px] font-extrabold">{title}</h1>
      <p className="mt-2 text-[14px]" style={{ color: "var(--text-2)" }}>{subtitle}</p>
      <p className="mt-4 text-[13px] font-semibold" style={{ color: "var(--accent)" }}>{gen.step}</p>

      <div className="mt-6 w-full rounded-full" style={{ background: "var(--card-2)", height: 6 }}>
        <div className="h-full rounded-full" style={{ width: `${gen.progress}%`, background: "var(--mv-grad)", transition: "width .15s linear" }} />
      </div>

      <div className="mt-5 text-[12px]" style={{ color: "var(--text-2)" }}>
        Estimated time remaining<br />
        <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>{estimate}</span>
      </div>

      <div className="mt-8">
        <Button variant="ghost" onClick={() => router.push("/history")}>View Later</Button>
      </div>
      <p className="sr-only">{kind} generation in progress</p>
    </div>
  );
}
