"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useSubscribe } from "@/components/providers/SubscribeProvider";
import { useBackNavigation } from "@/components/shell/DetailNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { COST_VIDEO_SHORT, DEMO_END, NEXT_REPLY, type AgentFlowId } from "@/lib/agent/content";
import { AgentEngine } from "@/lib/agent/engine";
import { flowScript, type UgcLaunch } from "@/lib/agent/flows";
import { AgentMessage, type MessageActions } from "./AgentMessages";
import { AgentSurvey } from "./AgentSurvey";
import { GuideHint } from "./GuideHint";
import { PhotoPicker } from "./PhotoPicker";

/**
 * `/agent` — the Video Shorts Agent chat (YCA handoff §2), reached from Home's
 * Video Shorts composer (`?flow=ugc&product=url|photo`) or from a template
 * card (`?flow=pet` / `?flow=bag`).
 *
 * The flow is read from `window.location.search` inside the start-up effect
 * rather than with `useSearchParams`: it is only needed once, in the browser,
 * and the hook would force a Suspense boundary and opt the route out of
 * prerendering for nothing (AGENTS.md → Architecture).
 *
 * Back always leaves the chat (the run is abandoned, nothing resumes) — the
 * handoff's `restart`, minus the launcher reset, which Home does for free by
 * mounting fresh.
 *
 * Credits are Muse's, not YCA's: Generate and the result's Regenerate charge
 * `COST_VIDEO_SHORT` and, below it, open Muse's Buy Credits instead (GL-01).
 * The chat keeps waiting on the same Generate button until the user can pay.
 */
/** Auto-scroll timing — the same as a message's fade-up in `agent.css`. */
const GLIDE_MS = 500;
/** The CSS timing function `cubic-bezier(x1, y1, x2, y2)`, evaluated exactly:
 *  solve the curve's x for time `k` (Newton, bisection as a fallback), return
 *  its y. So the scroll eases on the very curve the CSS fade does. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  const slope = (a: number, b: number, s: number) =>
    3 * a * (1 - s) ** 2 + 6 * (b - a) * s * (1 - s) + 3 * (1 - b) * s * s;
  return (k: number) => {
    if (k <= 0 || k >= 1) return Math.min(1, Math.max(0, k));
    let s = k;
    for (let i = 0; i < 8; i++) {
      const d = slope(x1, x2, s);
      if (Math.abs(d) < 1e-6) break;
      s -= (at(x1, x2, s) - k) / d;
    }
    if (s < 0 || s > 1 || Math.abs(at(x1, x2, s) - k) > 1e-4) {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 30; i++) {
        s = (lo + hi) / 2;
        if (at(x1, x2, s) < k) lo = s;
        else hi = s;
      }
    }
    return at(y1, y2, s);
  };
}

/** Same curve as `.agent-msg`'s fade-up in `agent.css` — change both together. */
const ease = cubicBezier(0.4, 0, 0.2, 1);

export function AgentView() {
  const [engine] = useState(() => new AgentEngine());
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot);
  /** The typed message (`engine.chat`, 2026-10-30). Kept while Send is waiting
   *  for the script to listen, so nothing typed is lost. */
  const [draft, setDraft] = useState("");
  const canSend = draft.trim() !== "" && s.listening && !s.chatting && !s.busy;
  const send = () => {
    if (!canSend) return;
    void engine.chat(draft);
    setDraft("");
  };
  const { credits, addCredits } = useCredits();
  const { openBuyCredits } = useSubscribe();
  const goBack = useBackNavigation("/");
  const listRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const raw = q.get("flow");
    const flow: AgentFlowId = raw === "pet" || raw === "bag" ? raw : "ugc";
    const p = q.get("product");
    const launch: UgcLaunch = { product: p === "url" || p === "photo" ? p : null };
    void engine.start(flowScript(flow, launch));
    return () => engine.stop();
  }, [engine]);

  // Follow the conversation: a reply is followed only until its first line
  // reaches the top under the header (2026-10-23), everything else to the end.
  // EXCEPT while a survey card is open (2026-10-29): the card floats over the
  // list, so the cap left it covering the end of the reply it asks about (a
  // script is taller than the room above the card). Then the view goes all the
  // way down, the reply's last line just clearing the card; its opening lines
  // may pass under the header, one scroll up. The cap returns once answered.
  //
  // Every follow goes through ONE eased scroll (2026-10-29). It used to mix the
  // browser's `behavior: "smooth"` (its own, unset duration) with instant
  // jumps from the reply and the dock's ResizeObserver, which landed first —
  // so the view alternately glided and snapped. Now a new target mid-glide
  // retargets the running animation from where it is, the timing and curve
  // match a message's fade-up (`.agent-msg`: 500ms, cubic-bezier(.4,0,.2,1)),
  // and a wheel or touch by the user cancels it rather than fighting them.
  const glide = useRef<{ raf: number; from: number; to: number; t0: number } | null>(null);
  const toEnd = useRef(false);
  /** Settles the dock padding; installed by the dock effect below. */
  const syncPad = useRef<(() => void) | null>(null);

  const stopGlide = useCallback(() => {
    if (glide.current) cancelAnimationFrame(glide.current.raf);
    glide.current = null;
  }, []);

  const scrollTo = useCallback((top: number) => {
    const sc = listRef.current;
    if (!sc) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sc.scrollTop = top;
      return;
    }
    const g = glide.current;
    if (g && Math.abs(g.to - top) < 1) return;
    if (g) cancelAnimationFrame(g.raf);
    const next = { raf: 0, from: sc.scrollTop, to: top, t0: performance.now() };
    const frame = (now: number) => {
      const k = Math.min(1, (now - next.t0) / GLIDE_MS);
      sc.scrollTop = next.from + (next.to - next.from) * ease(k);
      if (k < 1) next.raf = requestAnimationFrame(frame);
      else glide.current = null;
    };
    next.raf = requestAnimationFrame(frame);
    glide.current = next;
  }, []);

  const follow = useCallback(() => {
    const sc = listRef.current;
    if (!sc) return;
    // Settle the dock padding first (see `syncPad`), so a new message that
    // only fills space a closed survey left behind does not read as growth.
    syncPad.current?.();
    // Measure from where the view is heading, not where it is mid-glide.
    const at = glide.current?.to ?? sc.scrollTop;
    let target = sc.scrollHeight - sc.clientHeight;
    const cap = toEnd.current ? null : engine.getSnapshot().capId;
    const el = cap === null ? null : sc.querySelector<HTMLElement>(`[data-msg="${cap}"]`);
    if (el) {
      const top = sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 12;
      // Already past the reply's first line (a survey took the view to the
      // end): stay put. Pulling back up to it read as a jump after submitting.
      if (top < at - 1) return;
      target = Math.min(target, top);
    }
    if (target <= at + 1) return;
    scrollTo(target);
  }, [engine, scrollTo]);

  useEffect(() => {
    const sc = listRef.current;
    if (!sc) return;
    sc.addEventListener("wheel", stopGlide, { passive: true });
    sc.addEventListener("touchstart", stopGlide, { passive: true });
    return () => {
      sc.removeEventListener("wheel", stopGlide);
      sc.removeEventListener("touchstart", stopGlide);
      stopGlide();
    };
  }, [stopGlide]);

  const count = s.messages.length;
  useLayoutEffect(() => {
    toEnd.current = s.survey !== null;
    follow();
  }, [count, s.survey, follow]);

  // The dock floats over the list (2026-10-29), so the list's bottom padding
  // tracks the dock's height — the survey card comes and goes — and the view
  // re-follows when it changes, or the newest message would sit under it.
  // `--sb` is the list's scrollbar width (0 for overlay scrollbars): the dock
  // stops short of it so both centre on the same column.
  //
  // When the dock SHRINKS (a survey is submitted) the view must not move
  // (product owner, 2026-10-29). Cutting the padding would make the browser
  // clamp the scroll position and drag the conversation down, so the space the
  // card gave up is kept as `extra` padding instead: the answer and the replies
  // that follow fill it in place, each one using up its own height of it, and
  // ordinary following resumes only once it is gone. A message shrinking (the
  // thinking row collapsing) is absorbed the same way. (`syncPad` is declared
  // up with `glide`, because `follow` calls it.)
  useLayoutEffect(() => {
    const page = pageRef.current;
    const dock = dockRef.current;
    const sc = listRef.current;
    const list = sc?.firstElementChild as HTMLElement | null;
    if (!page || !dock || !sc || !list) return;
    let dockH = dock.offsetHeight;
    let extra = 0;
    const pad = () => dockH + extra;
    const setPad = () => page.style.setProperty("--dock-h", `${pad()}px`);
    setPad();
    let contentH = list.offsetHeight - pad();
    syncPad.current = () => {
      page.style.setProperty("--sb", `${sc.offsetWidth - sc.clientWidth}px`);
      const h = dock.offsetHeight;
      const c = list.offsetHeight - pad();
      if (h < dockH) extra += dockH - h;
      else extra = Math.max(0, extra - (h - dockH));
      dockH = h;
      if (c > contentH) extra = Math.max(0, extra - (c - contentH));
      else extra += contentH - c;
      setPad();
      contentH = list.offsetHeight - pad();
    };
    const ro = new ResizeObserver(() => follow());
    ro.observe(dock);
    ro.observe(sc);
    // The list grows after a message mounts too (a photo loads, a card
    // expands), so its own size is a reason to follow as well.
    ro.observe(list);
    return () => {
      syncPad.current = null;
      ro.disconnect();
    };
  }, [follow]);

  const charge = (then: () => void) => {
    if (credits < COST_VIDEO_SHORT) {
      openBuyCredits();
      return;
    }
    addCredits(-COST_VIDEO_SHORT);
    then();
  };

  const actions: MessageActions = {
    pickMsgId: s.awaiting && !s.picker ? s.awaiting.msgId : null,
    openPicker: engine.openPicker,
    hintGenerate: s.hint === "generate",
    onGenerate: () => charge(engine.tapGenerate),
    onRegenerate: () => {
      if (s.busy || s.survey) return;
      charge(() => void engine.regenerate());
    },
    onSaved: engine.markSaved,
    onExplore: (t) => void engine.explore(t, NEXT_REPLY[t], DEMO_END),
    exploreUsed: s.exploreUsed,
    revealDone: engine.revealDone,
    follow,
  };

  return (
    <div className="agent-page" ref={pageRef}>
      <header className="agent-page__bar">
        <button type="button" className="agent-page__back" onClick={goBack} aria-label="Back">
          <DpIcon name="ic_arrow_left" className="agent-page__back-icon" />
          <GuideHint show={s.hint === "back"} />
        </button>
        <h1 className="agent-page__title">AI Agent</h1>
        <button
          type="button"
          className="credit-balance agent-page__credits"
          aria-label="Credits"
          onClick={() => openBuyCredits()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/icons/ui/ic_credit.svg" alt="" />
          <span>{credits}</span>
        </button>
      </header>

      <div className="agent-page__scroll" ref={listRef}>
        <div className="agent-page__list" aria-live="polite">
          {s.messages.map((m) => (
            <AgentMessage key={m.id} msg={m} a={actions} />
          ))}
        </div>
      </div>

      <div className="agent-page__dock" ref={dockRef}>
        {s.survey && <AgentSurvey key={s.survey.key} qs={s.survey.qs} onSubmit={engine.submitSurvey} />}
        {/* Two rows, like Home's composer card (2026-10-30): the field on top,
            `+` and Send under it. */}
        <div className="agent-input">
          {/* Typing is live (product owner, 2026-10-30, past handoff §2): a sent
              message gets one canned reply — see `engine.chat`. */}
          <input
            className="agent-input__field"
            placeholder="Type your message here ..."
            aria-label="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="agent-input__bar">
            <button
              type="button"
              className="agent-input__photo"
              aria-label="Add photo"
              disabled={!s.awaiting || !!s.picker}
              onClick={engine.openPicker}
            >
              <DpIcon name="ic_add" className="agent-input__photo-icon" />
              <GuideHint show={s.hint === "photo"} />
            </button>
            <button
              type="button"
              className={`agent-send${canSend ? " agent-send--on" : ""}`}
              aria-label="Send"
              disabled={!canSend}
              onClick={send}
            >
              <DpIcon name="ic_arrow_right" className="agent-send__icon" />
            </button>
          </div>
          {/* Sits just above the composer, centred on it (2026-10-29). */}
          {s.toast && (
            <div className="agent-page__toast" role="status">
              {s.toast}
            </div>
          )}
        </div>
      </div>


      <PhotoPicker
        sheet={s.picker}
        hintCell={s.awaiting?.cell}
        onPick={engine.photoPicked}
        onClose={engine.closePicker}
      />
    </div>
  );
}
