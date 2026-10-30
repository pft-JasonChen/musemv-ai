"use client";

import { useEffect, useRef, useState } from "react";
import { DpIcon } from "@/components/ui/DpIcon";
import type { SurveyAnswer, SurveyQ } from "@/lib/agent/engine";
import { GuideHint } from "./GuideHint";

/**
 * The survey card (handoff §3.4, Figma "Survey explorations · A"): docks over
 * the input bar, one question at a time.
 *
 * · Tapping a row only SELECTS it; Next sends. Next is disabled until something
 *   is picked and never shows a price (2026-10-15).
 * · Every row responds, one pick per question (2026-10-08).
 * · The pen row counts as a pick as soon as it is focused or typed in; Enter = Next.
 * · Rows are numbered when there are 3+ (pen row included) or `num` asks for it.
 * · ‹ steps back a question and drops its answer.
 * · Dragging the grabber down past 80px (after a 14px dead zone) folds the card
 *   into a bar over the input; tapping the bar opens it again.
 * · Desktop (a fine pointer that can hover) has no grabber — a drag handle
 *   means nothing to a mouse (product owner, 2026-10-29). Like Claude's desktop
 *   question card it gets a collapse chevron in the header instead, and keys:
 *   1–9 pick a row, Enter sends (Next), Esc folds. The CSS decides which of
 *   grabber / chevron is drawn; both are always in the DOM.
 */
export function AgentSurvey({
  qs,
  onSubmit,
}: {
  qs: SurveyQ[];
  onSubmit: (answers: SurveyAnswer[]) => void;
}) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [sel, setSel] = useState<{ index: number; value: string } | null>(null);
  const [free, setFree] = useState("");
  const [folded, setFolded] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [drag, setDrag] = useState(0);
  const locked = useRef(false);
  const grab = useRef<{ y: number; moved: boolean; pointer: number } | null>(null);

  const q = qs[i];
  const numbered = q.num || q.options.length + (q.free ? 1 : 0) > 2;
  const canNext = sel !== null && (sel.index !== -1 || sel.value !== "");

  function swap(fn: () => void) {
    setSwapping(true);
    setTimeout(() => {
      fn();
      setSel(null);
      setFree("");
      setSwapping(false);
    }, 140);
  }

  function next() {
    if (!canNext || !sel || locked.current) return;
    locked.current = true;
    const picked = { label: q.label ?? "", value: sel.value, index: sel.index };
    setTimeout(() => {
      locked.current = false;
      const all = [...answers, picked];
      if (i + 1 < qs.length) {
        swap(() => {
          setAnswers(all);
          setI(i + 1);
        });
      } else onSubmit(all);
    }, 200);
  }

  function back() {
    if (i === 0 || locked.current) return;
    swap(() => {
      setAnswers(answers.slice(0, -1));
      setI(i - 1);
    });
  }

  // Keyboard, for the desktop card. Ignored while typing in the pen row (it
  // handles its own Enter) and on touch-only devices, which have no keys.
  const keys = useRef({ q, next });
  useEffect(() => {
    keys.current = { q, next };
  });
  useEffect(() => {
    if (folded || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
      const k = keys.current;
      if (e.key === "Escape") {
        e.preventDefault();
        setFolded(true);
        return;
      }
      if (typing) return;
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        k.next();
        return;
      }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= k.q.options.length && !locked.current) {
        e.preventDefault();
        setFree("");
        setSel({ index: n - 1, value: k.q.options[n - 1].title });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [folded]);

  if (folded) {
    return (
      <button type="button" className="agent-survey-bar" onClick={() => setFolded(false)}>
        <span className="agent-survey-bar__text">{q.q}</span>
        <DpIcon name="ic_chevron-up" className="agent-survey-bar__icon" />
        <GuideHint show />
      </button>
    );
  }

  // Hint: the suggested row, then Next once something is picked (or the pen row while it is empty).
  const hint = sel === null ? q.pick ?? 0 : canNext ? "next" : "free";

  return (
    <div
      className={`agent-survey${swapping ? " agent-survey--swap" : ""}${drag ? " agent-survey--drag" : ""}`}
      style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      role="group"
      aria-label={q.q}
    >
      <div
        className="agent-survey__grab"
        onPointerDown={(e) => {
          grab.current = { y: e.clientY, moved: false, pointer: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const g = grab.current;
          if (!g) return;
          const d = e.clientY - g.y;
          if (!g.moved && d < 14) return;
          g.moved = true;
          setDrag(Math.max(0, d - 14));
        }}
        onPointerUp={() => {
          const fold = grab.current?.moved && drag > 80;
          grab.current = null;
          setDrag(0);
          if (fold) setFolded(true);
        }}
        onPointerCancel={() => {
          grab.current = null;
          setDrag(0);
        }}
        aria-hidden="true"
      >
        <i />
      </div>

      <div className="agent-survey__hd">
        <h3 className="agent-survey__q">{q.q}</h3>
        {qs.length > 1 && (
          <div className="agent-survey__pg">
            <button
              type="button"
              className="agent-survey__prev"
              onClick={back}
              disabled={i === 0}
              aria-label="Previous question"
            >
              <DpIcon name="ic_chevron-left" className="agent-survey__prev-icon" />
            </button>
            {i + 1} of {qs.length}
          </div>
        )}
        <button
          type="button"
          className="agent-survey__fold"
          onClick={() => setFolded(true)}
          aria-label="Collapse"
          title="Collapse (Esc)"
        >
          <DpIcon name="ic_chevron-down" className="agent-survey__fold-icon" />
        </button>
      </div>

      <div className="agent-survey__ops">
        {q.options.map((o, k) => {
          const on = sel?.index === k;
          return (
            <button
              key={o.title}
              type="button"
              className={`agent-survey__op${on ? " agent-survey__op--on" : ""}`}
              aria-pressed={on}
              onClick={() => {
                if (locked.current) return;
                setFree("");
                setSel({ index: k, value: o.title });
              }}
            >
              <span className={`agent-survey__nm${numbered ? "" : " agent-survey__nm--bare"}`} aria-hidden="true">
                {on ? <DpIcon name="ic_check" className="agent-survey__check" /> : numbered ? k + 1 : null}
              </span>
              <span className="agent-survey__tx">
                <b>{o.title}</b>
                {o.sub && <span>{o.sub}</span>}
              </span>
              <GuideHint show={hint === k} />
            </button>
          );
        })}
        {q.free && (
          <label className={`agent-survey__own${sel?.index === -1 ? " agent-survey__op--on" : ""}`}>
            <DpIcon name="ic_edit" className="agent-survey__pen" />
            <input
              type="text"
              enterKeyHint="next"
              autoComplete="off"
              placeholder={q.free}
              value={free}
              onFocus={() => !locked.current && setSel({ index: -1, value: free.trim() })}
              onChange={(e) => {
                setFree(e.target.value);
                setSel({ index: -1, value: e.target.value.trim() });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  next();
                }
              }}
            />
            <GuideHint show={hint === "free"} />
          </label>
        )}
      </div>

      <div className="agent-survey__ft">
        <button type="button" className="agent-survey__next" disabled={!canNext} onClick={next}>
          <span>Next</span>
          <DpIcon name="ic_arrow_right" className="agent-survey__next-icon" />
          <GuideHint show={hint === "next"} />
        </button>
      </div>
    </div>
  );
}
