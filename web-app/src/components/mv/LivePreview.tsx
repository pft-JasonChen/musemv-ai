"use client";

import { MV_TYPES } from "@/lib/mv/mock";
import type { ComposeState } from "@/lib/mv/types";

export function LivePreview({ compose }: { compose: ComposeState }) {
  const type = MV_TYPES.find((t) => t.id === compose.mvType) ?? MV_TYPES[0];
  const portrait = compose.settings.ratio === "9:16";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{
          borderColor: "var(--border-2)",
          aspectRatio: portrait ? "9 / 16" : "16 / 9",
          width: portrait ? 270 : "100%",
          maxWidth: 480,
          boxShadow: "var(--shadow-card)",
          background: "#000",
        }}
      >
        <video
          key={type.video}
          src={type.video}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 55%, rgba(0,0,0,.75))" }} />

        {/* Photo chip */}
        {compose.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={compose.photos[0].url}
            alt="Character"
            className="absolute top-3 left-3 h-10 w-10 rounded-full object-cover border-2"
            style={{ borderColor: "rgba(255,255,255,.6)" }}
          />
        )}

        {/* Overlays */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-0.5">
          {compose.settings.title.on && (
            <div className="text-[15px] font-extrabold leading-tight text-white drop-shadow">
              {compose.settings.title.text || compose.song?.title || "Your MV Title"}
            </div>
          )}
          {compose.settings.author.on && (
            <div className="text-[12px] font-semibold text-white/85">
              {compose.settings.author.text || "Author"}
            </div>
          )}
          {compose.settings.showSubtitle && (
            <div className="mt-1 text-[11px] text-white/70 italic">♪ subtitle preview …</div>
          )}
        </div>

        {compose.settings.watermark && (
          <div className="absolute top-3 right-3 text-[10px] font-bold text-white/70">MuseMV.ai</div>
        )}
      </div>

      <div className="text-center">
        <div className="text-[13px] font-bold">{type.name}</div>
        <div className="text-[11px]" style={{ color: "var(--text-2)" }}>
          {compose.settings.ratio} · {compose.settings.resolution}
        </div>
      </div>
    </div>
  );
}
