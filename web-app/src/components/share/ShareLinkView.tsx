"use client";

// Public, unauthenticated Share Link Page (spec P2-S1 / P2-S2).
// Minimal chrome: wordmark, one media card, Share + Download, a "Try" CTA.
// An unresolvable id — or ?type=expired — renders the expired empty state.
// This route renders WITHOUT the app shell (see AppShell) and is not behind AuthGuard.

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { buildShareUrl, resolveShare } from "@/lib/share";
import { downloadFile } from "@/lib/download";

function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function ShareLinkView() {
  const params = useSearchParams();
  const { locale } = useLocale();
  const { history } = useHistory();
  const [shareOpen, setShareOpen] = useState(false);

  const id = params.get("id");
  const forcedExpired = params.get("type") === "expired";
  const media = forcedExpired ? null : resolveShare(id, history);

  const home = localePath(locale, "/");

  const Wordmark = (
    <Link href={home} className="text-[18px] font-extrabold tracking-tight" aria-label="YouCam Muse home">
      YouCam <span style={{ color: "var(--accent)" }}>Muse</span>
    </Link>
  );

  // ── Expired / invalid (P2-S2) ──────────────────────────────────────────────
  if (!media) {
    return (
      <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
        <header className="flex items-center px-6 py-4">{Wordmark}</header>
        <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
          <div className="grid h-[80px] w-[80px] place-items-center rounded-full" style={{ background: "var(--card-2)" }}>
            <Icon d="M13.73 21a2 2 0 0 1-3.46 0M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M1 1l22 22" size={34} />
          </div>
          <h1 className="mt-7 text-[22px] font-extrabold">This link has expired</h1>
          <p className="mt-2 text-[14px]" style={{ color: "var(--text-2)" }}>
            Shared links are available for 30 days. Ask the sender to share it again, or create your own result in YouCam Muse.
          </p>
          <Link
            href={home}
            className="mt-8 inline-flex h-[50px] items-center rounded-xl px-7 text-[19px] font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            Go to YouCam Muse
          </Link>
        </main>
      </div>
    );
  }

  // ── Valid link (P2-S1) ──────────────────────────────────────────────────────
  const downloadName = media.kind === "mv" ? `${media.title}.mp4` : `${media.title}.mp3`;
  const downloadUrl = media.videoUrl ?? media.audioUrl;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <header className="flex items-center px-6 py-4">{Wordmark}</header>

      <main className="mx-auto flex w-full max-w-[520px] flex-1 flex-col items-center px-6 pb-24 pt-4">
        {/* Media card */}
        <div className="w-full overflow-hidden rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border-2)" }}>
          {media.kind === "mv" ? (
            <video
              src={media.videoUrl}
              poster={media.posterUrl}
              controls
              playsInline
              className="block w-full"
              style={{ aspectRatio: "9 / 16", objectFit: "cover", background: "#000" }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.posterUrl} alt={media.title} className="w-full max-w-[300px] rounded-xl object-cover" style={{ aspectRatio: "1" }} />
              <audio src={media.audioUrl} controls className="w-full" />
            </div>
          )}
        </div>

        {/* Title + creator */}
        <h1 className="mt-5 text-center text-[20px] font-extrabold">{media.title}</h1>
        {media.creator && (
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>by {media.creator}</p>
        )}

        {/* Action row — Share + Download */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setShareOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full"
            style={{ background: "var(--card-2)", color: "var(--text)" }}
            aria-label="Share"
          >
            <Icon d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v14" />
          </button>
          {downloadUrl && (
            <button
              onClick={() => downloadFile(downloadUrl, downloadName)}
              className="grid h-11 w-11 place-items-center rounded-full"
              style={{ background: "var(--card-2)", color: "var(--text)" }}
              aria-label="Download"
            >
              <Icon d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
            </button>
          )}
        </div>

        {/* Primary CTA */}
        <Link
          href={home}
          className="mt-8 inline-flex h-[50px] items-center rounded-xl px-7 text-[19px] font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          Try YouCam Muse
        </Link>
      </main>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} title={media.title} url={buildShareUrl(id ?? "")} />
    </div>
  );
}
