"use client";

// Public, unauthenticated Share Link Page.
// Simplified chrome (2026-07-23): only a logo header (→ home), the media
// (MV video / song), and a Download button. No share action, title/creator, or
// "Try" CTA. An unresolvable id — or ?type=expired — renders the expired state.
// This route renders WITHOUT the app shell (see AppShell) and is not behind AuthGuard.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { resolveShare } from "@/lib/share";
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

  const id = params.get("id");
  const forcedExpired = params.get("type") === "expired";
  const media = forcedExpired ? null : resolveShare(id, history);

  const home = localePath(locale, "/");

  // Header — logo only; clicking it goes to the home page.
  const Header = (
    <header className="flex items-center px-6 py-4">
      <Link href={home} className="text-[18px] font-extrabold tracking-tight" aria-label="YouCam Muse home">
        YouCam <span style={{ color: "var(--accent)" }}>Muse</span>
      </Link>
    </header>
  );

  // ── Expired / invalid ───────────────────────────────────────────────────────
  if (!media) {
    return (
      <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
        {Header}
        <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
          <div className="grid h-[80px] w-[80px] place-items-center rounded-full" style={{ background: "var(--card-2)" }}>
            <Icon d="M13.73 21a2 2 0 0 1-3.46 0M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M1 1l22 22" size={34} />
          </div>
          <h1 className="mt-7 text-[22px] font-extrabold">This link has expired</h1>
          <p className="mt-2 text-[14px]" style={{ color: "var(--text-2)" }}>
            Shared links are available for 30 days. Ask the sender to share it again.
          </p>
        </main>
      </div>
    );
  }

  // ── Valid link — media + download only ──────────────────────────────────────
  const downloadName = media.kind === "mv" ? `${media.title}.mp4` : `${media.title}.mp3`;
  const downloadUrl = media.videoUrl ?? media.audioUrl;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      {Header}

      <main className="mx-auto flex w-full max-w-[520px] flex-1 flex-col items-center px-6 pb-24 pt-4">
        {/* Media */}
        <div
          className={media.kind === "mv" ? "overflow-hidden rounded-2xl" : "w-full overflow-hidden rounded-2xl"}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border-2)",
            // Cap the portrait (9:16) video to 80% of the viewport height so it
            // never overflows on wide/short viewports; width derives from the
            // aspect ratio instead of always filling the 520px column.
            ...(media.kind === "mv" ? { aspectRatio: "9 / 16", maxHeight: "80vh", width: "auto", maxWidth: "100%" } : {}),
          }}
        >
          {media.kind === "mv" ? (
            <video
              src={media.videoUrl}
              poster={media.posterUrl}
              controls
              playsInline
              className="block h-full w-full"
              style={{ objectFit: "cover", background: "#000" }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.posterUrl} alt={media.title} className="w-full max-w-[300px] rounded-xl object-cover" style={{ aspectRatio: "1" }} />
              <audio src={media.audioUrl} controls className="w-full" />
            </div>
          )}
        </div>

        {/* Download button */}
        {downloadUrl && (
          <button
            onClick={() => downloadFile(downloadUrl, downloadName)}
            className="mt-6 inline-flex h-[50px] items-center gap-2 rounded-xl px-7 text-[16px] font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            <Icon d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
            Download
          </button>
        )}
      </main>
    </div>
  );
}
