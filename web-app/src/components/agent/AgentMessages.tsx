"use client";
/* eslint-disable @next/next/no-img-element */

import { useLayoutEffect, useRef, useState } from "react";
import { DpIcon } from "@/components/ui/DpIcon";
import { KEEP_EXPLORING } from "@/lib/agent/content";
import type { AgentBody, FbKind, Meta, Msg, Photo, Seg, Shot, UserBody } from "@/lib/agent/engine";
import { GuideHint } from "./GuideHint";

/**
 * Every message type of the Agent chat (handoff §2.1). Markup is Muse's; the
 * copy inside the cards is fixed by the handoff and lives with the flows.
 */

export interface MessageActions {
  /** Id of the reply whose underlined words open the picker right now. */
  pickMsgId: number | null;
  openPicker: () => void;
  hintGenerate: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onSaved: (id: number) => void;
  onExplore: (text: (typeof KEEP_EXPLORING)[number]) => void;
  exploreUsed: boolean;
  revealDone: (id: number) => void;
  /** Called when a reply mounts so the list can follow it down. */
  follow: () => void;
}

/** Three bouncing dots on the MV gradient — the "generating" indicator for both
 *  the storyboard image and the video (2026-10-29). */
function GenDots() {
  return (
    <span className="agent-proc__dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function AgentMessage({ msg, a }: { msg: Msg; a: MessageActions }) {
  if (msg.role === "think" && msg.gen === "image") {
    return (
      <div className={`agent-msg agent-msg--think${msg.gone ? " agent-msg--gone" : ""}`}>
        <AgentHead />
        <div className="agent-proc__card" role="status">
          <GenDots />
          <span>Generating storyboard…</span>
        </div>
      </div>
    );
  }
  if (msg.role === "think") {
    return (
      <div className={`agent-msg agent-msg--think${msg.gone ? " agent-msg--gone" : ""}`}>
        <AgentHead />
        <p className="agent-think">
          Thinking &amp; analyzing
          <span className="agent-think__dots" aria-hidden="true">
            <b />
            <b />
            <b />
            <b />
          </span>
        </p>
      </div>
    );
  }
  if (msg.role === "user") return <UserMessage body={msg.body} />;
  return <AgentReply msg={msg} a={a} />;
}

function AgentHead() {
  return (
    <div className="agent-msg__hd">
      <span className="agent-avatar" aria-hidden="true">
        <DpIcon name="ic_sparkles" className="agent-avatar__icon" />
      </span>
      <span>AI Agent</span>
    </div>
  );
}

/* ── Agent replies: the whole message fades up (product owner, 2026-10-29) ──
   It replaced a line-by-line mask reveal. The engine still waits for
   `revealDone` before it moves on, so it fires once the fade has finished;
   reduced-motion users have no fade and are released on the next frame. */

const FADE_MS = 500;

function AgentReply({ msg, a }: { msg: Extract<Msg, { role: "agent" }>; a: MessageActions }) {
  const [revealed, setRevealed] = useState(false);
  const { revealDone, follow } = a;

  useLayoutEffect(() => {
    if (revealed) return;
    follow();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => {
      setRevealed(true);
      revealDone(msg.id);
    }, still ? 0 : FADE_MS);
    return () => window.clearTimeout(t);
  }, [msg.id, revealed, revealDone, follow]);

  return (
    <div
      className={`agent-msg agent-msg--agent${msg.gone ? " agent-msg--gone" : ""}`}
      data-msg={msg.id}
    >
      <AgentHead />
      <div className="agent-msg__body">
        <ReplyBody msg={msg} a={a} />
      </div>
      {msg.fb && <FeedbackBar kind={msg.fb} msg={msg} a={a} />}
      {/* The result carries its own bar (Download / Regenerate / 👍 / 👎) and Keep exploring. */}
      {msg.body.kind === "result" && revealed && <FeedbackBar kind="video" msg={msg} a={a} />}
      {msg.body.kind === "result" && revealed && (
        <div className="agent-next">
          <p className="agent-next__lb">Keep exploring</p>
          <div className="agent-next__row">
            {KEEP_EXPLORING.map((t) => (
              <button key={t} type="button" disabled={a.exploreUsed} onClick={() => a.onExplore(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReplyBody({ msg, a }: { msg: Extract<Msg, { role: "agent" }>; a: MessageActions }) {
  const b: AgentBody = msg.body;
  switch (b.kind) {
    case "text":
      return (
        <p className="agent-tx">
          <Segs segs={b.text} pick={a.pickMsgId === msg.id ? a.openPicker : null} />
        </p>
      );
    case "assets":
      return (
        <>
          <p className="agent-tx">{b.intro}</p>
          <Photos photos={b.photos} />
          <p className="agent-tx">{b.outro}</p>
        </>
      );
    case "productInfo":
      return (
        <>
          <p className="agent-tx">
            I pulled this product info from your link. I’ll use it to write the script, so please check that
            both are correct:
          </p>
          <div className="agent-card agent-pinfo">
            <p className="agent-card__lb">Product name</p>
            <p className="agent-pinfo__name">{b.name}</p>
            <p className="agent-card__lb">Description</p>
            <p className="agent-pinfo__desc">{b.desc}</p>
          </div>
        </>
      );
    case "script":
      return (
        <>
          <p className="agent-tx">{b.intro}</p>
          <div className="agent-card agent-script">
            <MetaRow meta={b.meta} />
            <Shots shots={b.shots} vo={b.vo} />
          </div>
        </>
      );
    case "board":
      return (
        <>
          <p className="agent-tx">{b.intro}</p>
          <div className="agent-board">
            <img src={b.src} alt="Storyboard" />
          </div>
        </>
      );
    case "summary":
      return (
        <>
          <p className="agent-tx">Here’s the plan:</p>
          <Photos photos={b.photos} />
          <div className="agent-card agent-script">
            <MetaRow meta={b.meta} />
            <ul className="agent-sum">
              {b.rows.map(([k, v]) => (
                <li key={k}>
                  <span>{k}</span>
                  <em>{v}</em>
                </li>
              ))}
            </ul>
            <p className="agent-card__lb agent-script__lb">Script</p>
            <Shots shots={b.shots} vo={b.vo} />
          </div>
        </>
      );
    case "ready":
      return (
        <>
          <p className="agent-tx">Great! Ready to generate?</p>
          {msg.buttons !== "removed" && (
            <div
              className={`agent-yn${msg.buttons === "fading" ? " agent-yn--gone" : ""}`}
              aria-hidden={msg.buttons !== "idle"}
            >
              <button
                type="button"
                className={`agent-yn__yes${msg.buttons === "pressed" ? " agent-yn__yes--press" : ""}`}
                disabled={msg.buttons !== "idle"}
                onClick={a.onGenerate}
              >
                Generate
                <GuideHint show={a.hintGenerate} />
              </button>
              {/* Not Yet is drawn and inert in the demo (handoff §3.3). */}
              <button type="button" className="agent-yn__no" disabled={msg.buttons !== "idle"}>
                Not Yet
              </button>
            </div>
          )}
        </>
      );
    case "proc":
      return (
        <div className="agent-proc">
          <p className="agent-tx">Video generation is processing...</p>
          <div className="agent-proc__card">
            <GenDots />
            <span>14 minutes left</span>
          </div>
          <p className="agent-proc__note">
            You can start a new chat and keep creating more videos. We’ll notify you once it’s ready. You can
            view the finished result anytime in History.
          </p>
          <span className="agent-proc__new">
            <DpIcon name="ic_add" className="agent-proc__new-icon" />
            Create New Chat
          </span>
        </div>
      );
    case "result":
      return (
        <>
          <p className="agent-tx">Done! Here’s your video</p>
          <ResultVideo msg={msg} body={b} onSaved={a.onSaved} />
          <p className="agent-tx">This looks polished! There’s plenty more you can create.</p>
        </>
      );
  }
}

/** Generated video: the overlay is Download until used, then Play (2026-10-08). */
function ResultVideo({
  msg,
  body,
  onSaved,
}: {
  msg: Extract<Msg, { role: "agent" }>;
  body: Extract<AgentBody, { kind: "result" }>;
  onSaved: (id: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      v.pause();
      setPlaying(false);
    }
  };
  return (
    <div className={`agent-res${playing ? " agent-res--playing" : ""}`}>
      <video
        ref={ref}
        src={`${body.video}#t=0.1`}
        poster={body.poster}
        preload="metadata"
        playsInline
        onEnded={(e) => {
          setPlaying(false);
          e.currentTarget.currentTime = 0.1;
        }}
      />
      <button
        type="button"
        className="agent-res__btn"
        aria-label={msg.saved ? (playing ? "Pause" : "Play") : "Download"}
        onClick={() => (msg.saved ? toggle() : onSaved(msg.id))}
      >
        <DpIcon
          name={msg.saved ? (playing ? "ic_pause" : "ic_play") : "ic_download"}
          className="agent-res__btn-icon"
        />
      </button>
      <span className="agent-res__du">{body.dur}</span>
    </div>
  );
}

/* ── Feedback bar (handoff §2.2) ──────────────────────────────────────────── */

function FeedbackBar({
  kind,
  msg,
  a,
}: {
  kind: FbKind;
  msg: Extract<Msg, { role: "agent" }>;
  a: MessageActions;
}) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const el = document.querySelector(`[data-msg="${msg.id}"] .agent-msg__body`);
    const text = Array.from(el?.querySelectorAll(".agent-tx") ?? [])
      .map((t) => t.textContent)
      .join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="agent-acts">
      {kind === "text" && (
        <button type="button" onClick={copy} aria-label="Copy">
          <DpIcon name={copied ? "ic_check" : "ic_copy"} className="agent-acts__icon" />
        </button>
      )}
      {kind !== "text" && (
        <button type="button" onClick={() => kind === "video" && a.onSaved(msg.id)} aria-label="Download">
          <DpIcon name="ic_download" className="agent-acts__icon" />
        </button>
      )}
      {kind === "video" && (
        <button type="button" onClick={a.onRegenerate} aria-label="Regenerate">
          <DpIcon name="ic_refresh" className="agent-acts__icon" />
        </button>
      )}
      <button
        type="button"
        aria-label="Good"
        aria-pressed={vote === "up"}
        onClick={() => setVote(vote === "up" ? null : "up")}
      >
        <DpIcon name={vote === "up" ? "ic_like_on" : "ic_like_off"} className="agent-acts__icon" />
      </button>
      <button
        type="button"
        aria-label="Bad"
        aria-pressed={vote === "down"}
        onClick={() => setVote(vote === "down" ? null : "down")}
      >
        <DpIcon name={vote === "down" ? "ic_dislike_on" : "ic_dislike_off"} className="agent-acts__icon" />
      </button>
    </div>
  );
}

/* ── User messages ─────────────────────────────────────────────────────────── */

function UserMessage({ body }: { body: UserBody }) {
  if (body.kind === "photo") {
    return (
      <div className="agent-msg agent-msg--user">
        <Photos photos={[body.photo]} user />
      </div>
    );
  }
  if (body.kind === "imgs") {
    return (
      <div className="agent-msg agent-msg--user">
        <Photos photos={body.photos} user />
        <div className="agent-bub">
          <p>{body.line1}</p>
          <p>
            <Segs segs={body.line2} pick={null} />
          </p>
        </div>
      </div>
    );
  }
  const plain = body.pairs.length === 1 && !body.pairs[0][0];
  return (
    <div className="agent-msg agent-msg--user">
      <div className="agent-bub">
        {plain
          ? body.pairs[0][1]
          : body.pairs.map(([k, v]) => (
              <p key={k}>
                {k}: {v}
              </p>
            ))}
      </div>
    </div>
  );
}

/* ── Shared bits ───────────────────────────────────────────────────────────── */

function Segs({ segs, pick }: { segs: Seg[]; pick: (() => void) | null }) {
  return (
    <>
      {segs.map((s, i) =>
        typeof s === "string" ? (
          <span key={i}>{s}</span>
        ) : "tag" in s ? (
          <span key={i} className="agent-tag">
            {s.tag}
          </span>
        ) : pick ? (
          <button key={i} type="button" className="agent-pick" onClick={pick}>
            <DpIcon name="ic_upload" className="agent-pick__icon" />
            {s.pick}
          </button>
        ) : (
          <span key={i}>{s.pick}</span>
        ),
      )}
    </>
  );
}

function Photos({ photos, user }: { photos: Photo[]; user?: boolean }) {
  return (
    <div className={`agent-photos${user ? " agent-photos--user" : ""}`}>
      {photos.map((p) => (
        <div key={p.src} className={`agent-photo${p.fit ? " agent-photo--fit" : ""}`}>
          <img src={p.src} alt="" />
          <span className="agent-photo__tg">{p.tag}</span>
        </div>
      ))}
    </div>
  );
}

function MetaRow({ meta }: { meta: Meta }) {
  return (
    <div className="agent-meta">
      {meta.map(([k, v]) => (
        <span key={k}>
          <i>{k}</i>
          {v}
        </span>
      ))}
    </div>
  );
}

function Shots({ shots, vo }: { shots: Shot[]; vo?: string }) {
  return (
    <div className="agent-shots">
      {shots.map(([t, action, line]) => (
        <div key={t} className="agent-shot">
          <span className="agent-shot__tc">{t}</span>
          <span className="agent-shot__d">
            {action}
            {line && (
              <span className="agent-shot__vo">
                <i>{vo ?? "Model says"}</i>“{line}”
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
