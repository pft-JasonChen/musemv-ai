import {
  ASK_NAME,
  BAG_NAME,
  IMG,
  PICK_CELL,
  PRODUCT_DESC,
  PRODUCT_NAME,
  media,
  type AgentFlowId,
} from "./content";
import type { Meta, Photo, Run, Shot, SurveyQ } from "./engine";

/**
 * The three demo scripts, step for step from handoff §5 (YCA `FLOW.F7 / ugc /
 * F8 / F9`). Think durations are the handoff's; anything not given uses the
 * engine default (2200ms). YCA's credit gate is NOT here — Muse's own credits
 * are settled at Generate instead (product owner, 2026-10-28).
 */

export interface UgcLaunch {
  /** What the launcher's recipe carried. The model is never carried: the
   *  Agent always asks for it (YCA passes `MODEL0 = null` from the launcher). */
  product: "url" | "photo" | null;
  /** A free prompt typed into the AI Shorts composer (2026-10-30) — opens the
   *  chat instead of a skill; see `fromPrompt`. */
  prompt?: string;
}

interface Cfg {
  ratio: string;
  dur: number;
}

/** Ratio / Duration / Resolution — three fixed questions, no pen row (§3.4.1). */
function videoQs(cfg: Cfg): SurveyQ[] {
  const R = ["9:16", "16:9", "3:4", "4:3", "1:1"];
  const D = [10, 15, 20, 30];
  return [
    {
      label: "Ratio",
      q: "Which aspect ratio?",
      pick: Math.max(0, R.indexOf(cfg.ratio)),
      options: [
        { title: "9:16", sub: "Vertical · Reels, TikTok, Shorts" },
        { title: "16:9", sub: "Landscape · YouTube" },
        { title: "3:4", sub: "Portrait · feed posts" },
        { title: "4:3", sub: "Classic landscape" },
        { title: "1:1", sub: "Square · feed posts" },
      ],
    },
    {
      label: "Duration",
      q: "How long should it be?",
      pick: Math.max(0, D.indexOf(cfg.dur)),
      options: [
        { title: "10s", sub: "A quick hook" },
        { title: "15s", sub: "Recommended for Reels and Shorts" },
        { title: "20s", sub: "More room for the story" },
        { title: "30s", sub: "The full walkthrough" },
      ],
    },
    {
      label: "Resolution",
      q: "Which resolution?",
      pick: 2,
      options: [
        { title: "480p", sub: "Fastest, for a quick preview" },
        { title: "720p", sub: "Faster to generate" },
        { title: "1080p", sub: "Recommended — sharp on every phone" },
        { title: "4K", sub: "Sharper, uses more credits" },
      ],
    },
  ];
}

async function settings(r: Run, cfg: Cfg) {
  const a = await r.ask(videoQs(cfg));
  cfg.ratio = a[0].value;
  cfg.dur = parseInt(a[1].value, 10);
  return a[2].value;
}

const styleQ = (options: [string, string][]): SurveyQ[] => [
  {
    label: "Video style",
    q: "Which video style?",
    free: "Something else…",
    options: options.map(([title, sub]) => ({ title, sub })),
  },
];

const SCRIPT_Q: SurveyQ[] = [
  {
    q: "How does the script look?",
    free: "Tell me what to change…",
    options: [{ title: "Looks good", sub: "Go on to the storyboard" }],
  },
];

/** Ready to use this storyboard? — Regenerate or a typed change loops (§3.4.2). */
async function boardStep(r: Run, src: string) {
  for (;;) {
    const [a] = await r.ask(
      [
        {
          q: "Ready to use this storyboard?",
          free: "Tell me what to change…",
          options: [
            { title: "Looks good", sub: "Use it as is" },
            { title: "Regenerate storyboard", sub: "Make a new version" },
          ],
        },
      ],
      true,
    );
    await r.wait(300);
    await r.answer(a.index === 0 ? "Looks good" : a.index === 1 ? "Regenerate storyboard" : a.value);
    if (a.index === 0) return;
    await r.think(2000, "image");
    await r.say({ kind: "board", intro: "Here’s a new version of the storyboard.", src });
  }
}

async function confirmPlan(
  r: Run,
  photos: Photo[],
  rows: [string, string][],
  meta: Meta,
  shots: Shot[],
  vo?: string,
) {
  await r.say({ kind: "summary", photos, rows, meta, shots, vo });
  await r.ask([
    {
      q: "Is everything in this plan correct?",
      free: "Tell me what to change…",
      options: [{ title: "Yes, looks right", sub: "Go on to generate" }],
    },
  ]);
  await r.think(900);
  await r.ready();
}

const duration = (cfg: Cfg) => `00:${cfg.dur < 10 ? "0" : ""}${cfg.dur}`;
const scriptMeta = (cfg: Cfg, shots: number): Meta => [
  ["Duration", `${cfg.dur}s`],
  ["Shots", String(shots)],
  ["Ratio", cfg.ratio],
];

/* ── 流程 0 · Sub-skill UGC Review (F7 → ugc) ─────────────────────────────── */

async function ugc(r: Run, launch: UgcLaunch) {
  const cfg: Cfg = { ratio: "9:16", dur: 15 };
  const PRODUCT: Photo = { src: IMG.product, tag: "@product", fit: true };
  await r.wait(250);
  if (!launch.product) {
    await r.answer("Create a UGC Review video for your product featuring a model");
    await r.think(1600);
    const ask = await r.text("Sure! First, send me a photo of ", { pick: "your product" }, ".");
    await r.waitPhoto("product", PICK_CELL.ugcProduct, ask);
    await r.user({ kind: "photo", photo: PRODUCT });
  } else {
    await r.user({
      kind: "imgs",
      photos: [PRODUCT],
      line1: "Create a UGC Review video for ",
      line2: [{ tag: "@product" }, "featuring a model"],
    });
  }
  await r.think(2600);
  await r.text(
    `Before we start, let me confirm the video settings. This one is set to ${cfg.ratio} at ${cfg.dur} seconds by default.`,
  );
  const resolution = await settings(r, cfg);
  await r.think(1600);

  await r.text(
    "Got it. I still need a model for this video. Would you like to upload a photo, or should I create one for you?",
  );
  const [how] = await r.ask(
    [
      {
        q: "How should we add your model?",
        num: true,
        options: [
          { title: "Upload a photo", sub: "Pick one from your camera roll" },
          { title: "Generate one with AI", sub: "I’ll create a model that fits the product" },
        ],
      },
    ],
    true,
  );
  let model = IMG.picked;
  if (how.index === 1) {
    await r.answer("Generate one with AI");
    model = IMG.sample;
  } else {
    // Upload → the album opens right away; the photo is posted as the answer.
    await r.waitPhoto("recents", PICK_CELL.model, null, true);
    await r.user({ kind: "photo", photo: { src: model, tag: "@model" } });
  }
  await r.think(1600);
  const MODEL: Photo = { src: model, tag: "@model" };
  await r.say({
    kind: "assets",
    intro: "Here’s what I’ll work with:",
    photos: [MODEL, PRODUCT],
    outro: "If you’d like to swap either one, just tell me.",
  });
  await r.text("Next, let’s pick a video style for your UGC review.");
  const [style] = await r.ask(
    styleQ([
      ["Natural selfie", "Handheld, phone-camera feel, talking to camera"],
      ["Bright & clean", "Soft daylight, white vanity, crisp close-ups"],
      ["Cozy lifestyle", "Warm home tones, slower and relaxed"],
    ]),
  );
  await r.think(1600);
  await r.say({ kind: "productInfo", name: PRODUCT_NAME, desc: PRODUCT_DESC });
  await r.ask([
    {
      q: "Are the product name and description correct?",
      free: "Edit the name or description…",
      options: [{ title: "Yes, use them", sub: "Write the script with this" }],
    },
  ]);
  await r.think(2000);
  const SHOTS: Shot[] = [
    ["0–5s", "Bare-skin close-up by the window, tired-looking skin.", "Okay, real talk — my skin has looked so dull lately."],
    ["5–11s", "She holds up the serum, label to camera.", "So I’ve been trying this vegan collagen prep serum."],
    ["11–19s", "Two drops pressed into her cheeks, slow-motion absorption.", "It’s super light and sinks in right away. No sticky feeling."],
    ["19–26s", "Same light, two weeks later — firmer, glowing skin.", "Two weeks in, and look at this glow."],
    ["26–30s", "Smiling with the bottle next to her face, product name on screen.", "Honestly? It’s staying in my routine."],
  ];
  await r.say({ kind: "script", intro: "Here’s the script for your review:", meta: scriptMeta(cfg, 5), shots: SHOTS });
  await r.ask(SCRIPT_Q);
  await r.think(2400, "image");
  const board = media("UGC_storyboard.jpg");
  await r.say({ kind: "board", intro: "Here’s the storyboard, built from your script.", src: board });
  await boardStep(r, board);
  await confirmPlan(
    r,
    [MODEL, PRODUCT],
    [
      ["Video style", style.value],
      ["Product", PRODUCT_NAME],
    ],
    [...scriptMeta(cfg, 5), ["Resolution", resolution]],
    SHOTS,
  );
  await r.generate({ video: media("UGC_agent.mp4"), poster: media("UGC_agent.jpg"), dur: duration(cfg) });
}

/* ── 流程 1 · Creator template Pet Diary (F8) ─────────────────────────────── */

/** How the agent opens a skill on a fresh chat. After a free prompt
 *  (`fromPrompt`) it opens with an acknowledgement instead. */
const GREETING = "Hi there! 👋 I’m your AI Shorts agent. ";

async function pet(r: Run) {
  const cfg: Cfg = { ratio: "9:16", dur: 15 };
  const PET: Photo = { src: IMG.pet, tag: "@pet" };
  await r.wait(250);
  const hi = await r.text(
    `${GREETING}Send me a photo of `,
    { pick: "your pet" },
    ", and I’ll turn one of their everyday moments into a short film. ✨",
  );
  await r.waitPhoto("recents", PICK_CELL.pet, hi);
  await r.user({
    kind: "imgs",
    photos: [PET],
    line1: "Create a 15-second photorealistic short about your pet’s daily moment",
    line2: ["featuring", { tag: "@pet" }],
  });
  await r.think(2600);
  await r.text(
    `Before we start, let me confirm the video settings. This template is set to ${cfg.ratio} at ${cfg.dur} seconds.`,
  );
  const resolution = await settings(r, cfg);
  await r.think(1600);
  await r.say({
    kind: "assets",
    intro: "Here’s the photo I’ll use:",
    photos: [PET],
    outro: "Your tuxedo cat will be the star. If you’d like to use a different photo, just tell me.",
  });
  await r.text("Let’s set the look of your pet diary.");
  const [style] = await r.ask(
    styleQ([
      ["Cozy diary", "Handheld camera, warm light, diary voiceover"],
      ["Cinematic slow-mo", "Shallow focus, slow drifting snow"],
      ["Playful vlog", "Quick cuts, upbeat music"],
    ]),
  );
  await r.think(2200);
  const SHOTS: Shot[] = [
    ["0–3s", "From a warm wooden window sill, your cat watches the first snowflakes drift by.", "Day one of winter. Something is falling from the sky."],
    ["3–5s", "A careful white paw touches the snowy balcony floor.", "Cold. Very cold. Investigating anyway."],
    ["5–8s", "Whiskers twitch as it sniffs the crisp winter air.", "It smells like… nothing? Suspicious."],
    ["8–10s", "It presses down and leaves a tiny paw print in the snow.", "I have left my mark."],
    ["10–13s", "A playful swipe at a big falling snowflake.", "Got one. I think."],
    ["13–15s", "It turns and looks straight at the camera, wide-eyed.", "Okay, human. Snow is approved."],
  ];
  await r.say({
    kind: "script",
    intro:
      "Here’s the script: your cat’s first snow, from the window to the balcony. A cozy diary voiceover with a soft guitar and piano lullaby plays underneath.",
    meta: scriptMeta(cfg, 6),
    shots: SHOTS,
    vo: "Voiceover",
  });
  await r.ask(SCRIPT_Q);
  await r.think(2400, "image");
  const board = media("Pet_storyboard.jpg");
  await r.say({ kind: "board", intro: "Here’s the storyboard, built from your script.", src: board });
  await boardStep(r, board);
  await confirmPlan(r, [PET], [["Video style", style.value]], [...scriptMeta(cfg, 6), ["Resolution", resolution]], SHOTS, "Voiceover");
  await r.generate({ video: media("Pet_diary_vdo.mp4"), poster: media("Pet_diary_vdo.jpg"), dur: duration(cfg) });
}

/* ── 流程 2 · Marketer template Handbag Showcase (YCA: "Polished Bag", F9) ── */

async function bag(r: Run, opener = GREETING) {
  const cfg: Cfg = { ratio: "9:16", dur: 15 };
  const BAG: Photo = { src: IMG.bag, tag: "@product", fit: true };
  await r.wait(250);
  const hi = await r.text(
    `${opener}Send me a photo of `,
    { pick: "your product" },
    ", and I’ll turn it into a polished showcase video. ✨",
  );
  await r.waitPhoto("product", PICK_CELL.bag, hi);
  await r.user({
    kind: "imgs",
    photos: [BAG],
    line1: "Create product showcase storyboard ",
    line2: ["infographic for", { tag: "@product" }],
  });
  await r.think(2600);
  await r.text("Before we start, let me confirm the video settings. This template is set to 9:16 at 15 seconds.");
  const resolution = await settings(r, cfg);
  await r.think(1600);
  await r.say({
    kind: "assets",
    intro: "Here’s the product photo I’ll use:",
    photos: [BAG],
    outro: "If you’d like to use a different photo, just tell me.",
  });
  await r.text("Which video style fits the bag best?");
  const [style] = await r.ask(
    styleQ([
      ["Luxury editorial", "Golden light, slow camera moves, rich textures"],
      ["Clean studio", "Seamless white backdrop, crisp detail"],
      ["Infographic storyboard", "Feature callouts across four panels"],
    ]),
  );
  await r.think(1600);
  await r.text(ASK_NAME);
  await r.answer(BAG_NAME);
  await r.think(2000);
  const SHOTS: Shot[] = [
    ["0–3s", "Golden-hour grassland at sunset, the bag resting on a stone plinth."],
    ["3–6s", "Slow push-in until the bag fills the frame."],
    ["6–9s", "Macro on the gold sphere hardware, then across the spotted calf hair."],
    ["9–12s", "Close on the stitched leather handle; wind sweeps a ring through the grass."],
    ["12–15s", "Back to the hero shot against the setting sun, product name fades in."],
  ];
  await r.say({ kind: "script", intro: "Here’s the script:", meta: scriptMeta(cfg, 5), shots: SHOTS });
  await r.ask(SCRIPT_Q);
  await r.think(2400, "image");
  const board = media("agent-f9-bag_storyboard.jpg");
  await r.say({ kind: "board", intro: "Here’s the storyboard, built from your script.", src: board });
  await boardStep(r, board);
  await confirmPlan(
    r,
    [BAG],
    [
      ["Video style", style.value],
      ["Product", BAG_NAME],
    ],
    [...scriptMeta(cfg, 5), ["Resolution", resolution]],
    SHOTS,
  );
  await r.generate({ video: media("agent-f9-bag_vdo.mp4"), poster: media("agent-f9-bag_vdo.jpg"), dur: duration(cfg) });
}

/* ── A free prompt from the AI Shorts composer (product owner, 2026-10-30) ──
   The demo has no script for arbitrary text, so the Agent takes the prompt
   as the opening message and asks what KIND of video the user wants — three
   directions plus a pen row for their own — never which skill to use (the
   skills stay the Agent's business). Each direction runs the closest script:
   a product review is UGC Review (`ugc`); a showcase, a brand film or
   anything written in continues as the product showcase (`bag`).
   PLACEHOLDER copy. */

async function fromPrompt(r: Run, prompt: string) {
  await r.wait(250);
  await r.answer(prompt);
  await r.think(1600);
  await r.text("Love that idea! ✨ What kind of video should it be? Here are a few directions to start from.");
  const [kind] = await r.ask(
    [
      {
        q: "What kind of video do you want to make?",
        num: true,
        options: [
          { title: "Product review", sub: "A creator tries your product on camera" },
          { title: "Product showcase", sub: "Your product, presented like a polished ad" },
          { title: "Cinematic brand film", sub: "A film-like brand moment around your product" },
        ],
        free: "Describe another kind of video…",
      },
    ],
    true,
  );
  // The review script states its own request as the user's line; the others
  // get the pick echoed, then the showcase script opens on an acknowledgement.
  if (kind.index === 0) return ugc(r, { product: null });
  await r.answer(kind.value);
  await r.think(1200);
  return bag(r, kind.index === -1 ? "Got it! I’ll start it as a product video. " : "Great choice! ");
}

export function flowScript(id: AgentFlowId, launch: UgcLaunch): (r: Run) => Promise<void> {
  if (launch.prompt) return (r) => fromPrompt(r, launch.prompt!);
  if (id === "pet") return (r) => pet(r);
  if (id === "bag") return (r) => bag(r);
  return (r) => ugc(r, launch);
}
