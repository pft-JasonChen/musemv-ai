import type { PickerSheet } from "./content";

/**
 * Video Shorts Agent — the conversation engine (handoff §3), rewritten for
 * React from YCA's `say / think / user / ask / waitTap / generate` primitives.
 *
 * A plain external store, read with `useSyncExternalStore` — the same choice as
 * `demoStore.ts`, and for the same reason: this is a demo script, and keeping it
 * out of `AppProviders` keeps it outside the C4 contract surface RD codes
 * against. The flows (`flows.ts`) are written as `async` scripts against a
 * `Run`, exactly as YCA's are, because that is what keeps the order and timing
 * identical; the UI only renders the snapshot and reports taps back.
 *
 * Every step awaits its own timing and then checks it still belongs to the
 * current run. Leaving the page (or Change Approach) bumps the run, and the
 * abandoned script throws `STOP` at its next await — YCA's `alive(token)`.
 */

export type Seg = string | { pick: string } | { tag: string };
export interface Photo {
  src: string;
  tag: string;
  /** Product shots are letterboxed on white rather than cropped. */
  fit?: boolean;
}
export type Shot = [time: string, action: string, line?: string];
export type Meta = [label: string, value: string][];

export type AgentBody =
  | { kind: "text"; text: Seg[] }
  | { kind: "assets"; intro: string; photos: Photo[]; outro: string }
  | { kind: "productInfo"; name: string; desc: string }
  | { kind: "script"; intro: string; meta: Meta; shots: Shot[]; vo?: string }
  | { kind: "board"; intro: string; src: string }
  | { kind: "summary"; photos: Photo[]; rows: [string, string][]; meta: Meta; shots: Shot[]; vo?: string }
  | { kind: "ready" }
  | { kind: "proc" }
  | { kind: "result"; video: string; poster: string; dur: string };

export type UserBody =
  | { kind: "imgs"; photos: Photo[]; line1: string; line2: Seg[] }
  | { kind: "answers"; pairs: [string, string][] }
  | { kind: "photo"; photo: Photo };

/** Feedback bar under a reply (handoff §2.2). */
export type FbKind = "text" | "media" | "video";

export type Msg =
  /** `gen: "image"` = an image is being generated, drawn as a loading card. */
  | { id: number; role: "think"; gen?: "image"; gone?: boolean }
  | { id: number; role: "user"; body: UserBody }
  | {
      id: number;
      role: "agent";
      body: AgentBody;
      fb: FbKind | null;
      gone?: boolean;
      /** `ready` only: the Generate / Not Yet pair, pressed → fading → removed. */
      buttons?: "idle" | "pressed" | "fading" | "removed";
      /** `result` only: downloaded once ⇒ the overlay turns into Play. */
      saved?: boolean;
    };

export interface SurveyOption {
  title: string;
  sub?: string;
}
export interface SurveyQ {
  label?: string;
  q: string;
  options: SurveyOption[];
  /** The option the guide hint points at first. */
  pick?: number;
  /** Placeholder of the pen row; absent ⇒ fixed choices only. */
  free?: string;
  /** Number the rows even when there are only two. */
  num?: boolean;
}
export interface SurveyAnswer {
  label: string;
  value: string;
  /** -1 = typed into the pen row. */
  index: number;
}

export type Hint = "photo" | "generate" | "back" | null;

export interface AgentSnapshot {
  messages: Msg[];
  survey: { key: number; qs: SurveyQ[] } | null;
  /** The chat is waiting for a photo (photo button + underlined words live). */
  awaiting: { sheet: PickerSheet; cell: readonly [number, number]; msgId: number | null } | null;
  picker: PickerSheet | null;
  hint: Hint;
  /** Newest agent reply still being written — the list stops following once its top is reached. */
  capId: number | null;
  toast: string | null;
  exploreUsed: boolean;
  /** A generation (or regeneration) is in progress. */
  busy: boolean;
  /** The script is waiting on the user (survey, photo, Generate) or has ended —
   *  the only moments a typed message may go in without splitting a reply. */
  listening: boolean;
  /** A typed message and its reply are in progress (`chat`). */
  chatting: boolean;
}

export const STOP = Symbol("agent-stop");

const EMPTY: AgentSnapshot = {
  messages: [],
  survey: null,
  awaiting: null,
  picker: null,
  hint: null,
  capId: null,
  toast: null,
  exploreUsed: false,
  busy: false,
  listening: false,
  chatting: false,
};

/** The canned answer to a typed message (2026-10-30): the demo cannot read
 *  free text, so it says so and points at what moves the chat on right now. */
const CHAT_REPLY = {
  survey: "Thanks! I can't act on typed messages in this demo yet — please pick an option in the card below to continue.",
  photo: "Thanks! I can't act on typed messages in this demo yet — tap + below to add the photo and we'll keep going.",
  generate: "Thanks! I can't act on typed messages in this demo yet — tap Generate when you're ready.",
  done: "Thanks! I can't act on typed messages in this demo yet — try another skill from AI Shorts to make a new video.",
};

/** Fixed timings, handoff §2.3. */
export const T = {
  user: 870,
  think: 2200,
  thinkCollapse: 320,
  afterReveal: 650,
  surveyEcho: 300,
  proc: 3200,
} as const;

const OWN_ACTIONS = new Set<AgentBody["kind"]>(["script", "summary", "ready", "result", "proc"]);
const REVIEWED = new Set<AgentBody["kind"]>(["script", "board", "productInfo", "summary"]);

export class AgentEngine {
  private state: AgentSnapshot = EMPTY;
  private listeners = new Set<() => void>();
  private run = 0;
  private nextId = 1;
  private surveyKey = 0;
  /** Last reply still waiting to learn whether another reply follows it. */
  private pendingFb: number | null = null;
  private reveals = new Map<number, () => void>();
  private onSurvey: ((a: SurveyAnswer[]) => void) | null = null;
  private onPhoto: (() => void) | null = null;
  private onGenerate: (() => void) | null = null;
  /** What `generate` re-runs when the result's Regenerate is tapped. */
  private lastResult: { video: string; poster: string; dur: string } | null = null;
  /** Settles when the typed message in progress has its reply. */
  private chatDone: Promise<void> | null = null;

  /** Run `fn` now, or once the typed message in progress has its reply — so a
   *  survey answer, photo or Generate tapped meanwhile cannot split it. */
  private afterChat(fn: () => void) {
    if (this.chatDone) void this.chatDone.then(fn);
    else fn();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = () => this.state;
  getServerSnapshot = () => EMPTY;

  private set(patch: Partial<AgentSnapshot>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private patchMsg(id: number, patch: Partial<Msg>) {
    this.set({
      messages: this.state.messages.map((m) => (m.id === id ? ({ ...m, ...patch } as Msg) : m)),
    });
  }
  private removeMsg(id: number) {
    this.set({ messages: this.state.messages.filter((m) => m.id !== id) });
  }

  /** Start a flow on a clean chat. Returns when the script ends or is abandoned. */
  async start(script: (r: Run) => Promise<void>) {
    const token = ++this.run;
    this.pendingFb = null;
    this.reveals.clear();
    this.onSurvey = this.onPhoto = this.onGenerate = null;
    this.lastResult = null;
    this.chatDone = null;
    this.state = EMPTY;
    this.set({});
    try {
      await script(new Run(this, token));
      if (token === this.run) this.set({ listening: true });
    } catch (e) {
      if (e !== STOP) throw e;
    }
  }

  stop() {
    this.run++;
    this.reveals.forEach((done) => done());
    this.reveals.clear();
  }

  /* ── internals the Run calls ───────────────────────────────────────────── */

  alive(token: number) {
    if (token !== this.run) throw STOP;
  }
  async wait(ms: number, token: number) {
    await new Promise((r) => setTimeout(r, ms));
    this.alive(token);
  }

  async think(ms: number, token: number, gen?: "image") {
    this.set({
      messages: [...this.state.messages, { id: this.nextId++, role: "think", gen }],
      capId: null,
    });
    await this.wait(ms, token);
  }

  private async dropThinking(token: number) {
    const th = this.state.messages.find((m) => m.role === "think" && !m.gone);
    if (!th) return;
    this.patchMsg(th.id, { gone: true });
    await this.wait(T.thinkCollapse, token);
    this.removeMsg(th.id);
  }

  async say(body: AgentBody, token: number) {
    await this.dropThinking(token);
    if (this.pendingFb !== null) this.setFb(this.pendingFb);
    const id = this.nextId++;
    const msg: Msg = { id, role: "agent", body, fb: null, buttons: body.kind === "ready" ? "idle" : undefined };
    this.set({ messages: [...this.state.messages, msg], capId: id });
    this.pendingFb = OWN_ACTIONS.has(body.kind) ? null : id;
    await new Promise<void>((done) => this.reveals.set(id, done));
    this.alive(token);
    await this.wait(T.afterReveal, token);
    return id;
  }

  /** The UI calls this when a reply has finished its line-by-line reveal. */
  revealDone = (id: number) => {
    const done = this.reveals.get(id);
    this.reveals.delete(id);
    done?.();
  };

  setFb(id: number, kind?: FbKind) {
    this.pendingFb = null;
    const m = this.state.messages.find((x) => x.id === id);
    if (!m || m.role !== "agent" || m.fb) return;
    // Download only for generated output; echoed reference photos count as text.
    this.patchMsg(id, { fb: kind ?? (m.body.kind === "board" ? "media" : "text") });
  }

  async user(body: UserBody, token: number) {
    this.pendingFb = null;
    this.set({
      messages: [...this.state.messages, { id: this.nextId++, role: "user", body }],
      capId: null,
    });
    await this.wait(T.user, token);
  }

  /** One survey card of 1…n questions; resolves with every answer at once. */
  async ask(qs: SurveyQ[], token: number, raw = false) {
    this.pendingFb = null;
    const last = [...this.state.messages].reverse().find((m) => m.role === "agent");
    const review = last && last.role === "agent" && REVIEWED.has(last.body.kind) ? last.id : null;
    const answers = await new Promise<SurveyAnswer[]>((resolve) => {
      this.onSurvey = resolve;
      this.set({ survey: { key: ++this.surveyKey, qs }, listening: true });
    });
    this.alive(token);
    this.set({ listening: false });
    if (review !== null) this.setFb(review);
    if (raw) return answers;
    await this.wait(T.surveyEcho, token);
    await this.user({ kind: "answers", pairs: answers.map((a) => [a.label, a.value]) }, token);
    return answers;
  }

  submitSurvey = (answers: SurveyAnswer[]) => {
    const done = this.onSurvey;
    this.onSurvey = null;
    this.set({ survey: null });
    this.afterChat(() => done?.(answers));
  };

  /** Wait for a photo. `msgId` is the reply whose underlined words also open the picker. */
  async waitPhoto(sheet: PickerSheet, cell: readonly [number, number], msgId: number | null, token: number, open = false) {
    await new Promise<void>((resolve) => {
      this.onPhoto = resolve;
      this.set({
        awaiting: { sheet, cell, msgId },
        hint: open ? null : "photo",
        picker: open ? sheet : null,
        listening: true,
      });
    });
    this.alive(token);
    this.set({ listening: false });
  }

  openPicker = () => {
    if (this.state.awaiting && !this.state.picker) this.set({ picker: this.state.awaiting.sheet, hint: null });
  };
  /** Closed without a photo → the guide points back at the photo button. */
  closePicker = () => {
    if (this.state.picker) this.set({ picker: null, hint: this.state.awaiting ? "photo" : this.state.hint });
  };
  photoPicked = () => {
    const done = this.onPhoto;
    this.onPhoto = null;
    this.set({ picker: null, awaiting: null, hint: null });
    this.afterChat(() => done?.());
  };

  async waitGenerate(token: number) {
    await new Promise<void>((resolve) => {
      this.onGenerate = resolve;
      this.set({ hint: "generate", listening: true });
    });
    this.alive(token);
    this.set({ listening: false });
  }
  /** The UI has already settled the credits (Muse's GL-01 gate) before calling this. */
  tapGenerate = () => {
    const done = this.onGenerate;
    this.onGenerate = null;
    this.set({ hint: null });
    this.afterChat(() => done?.());
  };

  pressReady(id: number, buttons: "pressed" | "fading" | "removed") {
    this.patchMsg(id, { buttons });
  }

  async generate(result: { video: string; poster: string; dur: string }, token: number) {
    this.lastResult = result;
    this.set({ busy: true, hint: null });
    await this.think(1200, token);
    const proc = await this.say({ kind: "proc" }, token);
    await this.wait(T.proc, token);
    // The processing card fades out as the result video comes in.
    setTimeout(() => {
      if (token !== this.run) return;
      this.patchMsg(proc, { gone: true });
      setTimeout(() => token === this.run && this.removeMsg(proc), 700);
    }, 300);
    await this.say({ kind: "result", ...result }, token);
    this.set({ busy: false, hint: "back" });
  }

  markSaved = (id: number) => this.patchMsg(id, { saved: true });

  /** Result-bar Regenerate. Credits are settled by the caller first. */
  regenerate = async () => {
    const token = this.run;
    if (!this.lastResult || this.state.busy || this.state.survey || this.state.chatting) return;
    this.set({ busy: true, hint: null });
    try {
      await this.wait(200, token);
      await this.user({ kind: "answers", pairs: [["", "Regenerate"]] }, token);
      await this.generate(this.lastResult, token);
    } catch (e) {
      if (e !== STOP) throw e;
    }
  };

  /** Keep exploring (handoff §3.5): one tap per chat, one reply, then the demo ends. */
  explore = async (text: string, reply: string, endToast: string) => {
    const token = this.run;
    if (this.state.exploreUsed || this.state.busy || this.state.chatting) return;
    this.set({ exploreUsed: true, hint: null });
    try {
      await this.user({ kind: "answers", pairs: [["", text]] }, token);
      await this.think(1200, token);
      await this.say({ kind: "text", text: [reply] }, token);
      this.set({ toast: endToast, hint: "back" });
    } catch (e) {
      if (e !== STOP) throw e;
    }
  };

  /**
   * A typed message (product owner, 2026-10-30): it goes in as the user's
   * bubble and gets one canned reply — the demo is scripted and cannot act on
   * free text. Only while the script is `listening`, one at a time; a survey
   * answer, photo or Generate tapped meanwhile waits for the reply
   * (`afterChat`), so the script's next message never splits it.
   */
  chat = async (text: string) => {
    const token = this.run;
    const t = text.trim();
    if (!t || !this.state.listening || this.state.chatting || this.state.busy) return;
    const reply = this.state.survey
      ? CHAT_REPLY.survey
      : this.state.awaiting
        ? CHAT_REPLY.photo
        : this.onGenerate
          ? CHAT_REPLY.generate
          : CHAT_REPLY.done;
    let release = () => {};
    this.chatDone = new Promise<void>((r) => (release = r));
    this.set({ chatting: true });
    try {
      await this.user({ kind: "answers", pairs: [["", t]] }, token);
      await this.think(1200, token);
      await this.say({ kind: "text", text: [reply] }, token);
    } catch (e) {
      if (e !== STOP) throw e;
    } finally {
      this.chatDone = null;
      if (token === this.run) this.set({ chatting: false });
      release();
    }
  };
}

/** A flow's handle on the engine, bound to one run. */
export class Run {
  constructor(
    readonly engine: AgentEngine,
    readonly token: number,
  ) {}
  wait = (ms: number) => this.engine.wait(ms, this.token);
  think = (ms: number = T.think, gen?: "image") => this.engine.think(ms, this.token, gen);
  say = (body: AgentBody) => this.engine.say(body, this.token);
  text = (...text: Seg[]) => this.engine.say({ kind: "text", text }, this.token);
  user = (body: UserBody) => this.engine.user(body, this.token);
  answer = (value: string) => this.engine.user({ kind: "answers", pairs: [["", value]] }, this.token);
  ask = (qs: SurveyQ[], raw = false) => this.engine.ask(qs, this.token, raw);
  waitPhoto = (sheet: PickerSheet, cell: readonly [number, number], msgId: number | null, open = false) =>
    this.engine.waitPhoto(sheet, cell, msgId, this.token, open);
  setFb = (id: number) => this.engine.setFb(id);

  /** "Great! Ready to generate?" → Generate → the pair fades out → echo (handoff §5, confirmYes). */
  async ready() {
    const id = await this.say({ kind: "ready" });
    await this.engine.waitGenerate(this.token);
    this.engine.pressReady(id, "pressed");
    await this.wait(180);
    this.engine.pressReady(id, "fading");
    await this.wait(380);
    this.engine.pressReady(id, "removed");
    this.engine.setFb(id);
    await this.answer("Generate");
  }

  generate = (result: { video: string; poster: string; dur: string }) =>
    this.engine.generate(result, this.token);
}
