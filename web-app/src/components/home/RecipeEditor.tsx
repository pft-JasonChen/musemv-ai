"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * The UGC Review recipe as ONE editable prompt with the chips inline — the
 * pollo.ai Agent behaviour the product owner pointed at (2026-10-28): the
 * wording is ordinary text you can click into and rewrite, and every chip is
 * a single atom that Backspace / Delete removes whole.
 *
 * pollo.ai does this with TipTap (ProseMirror atom nodes). This is the same
 * idea without a new dependency: a native `contentEditable` whose chips are
 * `contenteditable="false"` spans, which every browser already deletes as one
 * unit. React renders the box EMPTY and never reconciles its children — the
 * text belongs to the user once it is on screen, and React touching nodes the
 * user has typed over is exactly how contentEditable + React breaks. So the
 * box is filled once on mount and then edited surgically:
 *
 * · state → DOM: choosing a product swaps the "+ Product image or Product URL"
 *   pair for one token (and drops the "or" between them if it is still just
 *   "or"); clearing a slot puts the pair back where the token was.
 * · DOM → state: deleting a token in the text clears that slot. A deleted
 *   empty chip ("+ Model Image") simply stays deleted — the user removed it.
 *   Filling the slot later appends its token at the end.
 */

type ChipKey = "pimg" | "purl" | "ptok" | "utok" | "model" | "mtok";

export interface RecipeProduct {
  type: "photo" | "url";
  url?: string;
}

function chipEl(key: ChipKey, label: string, icon?: string) {
  const el = document.createElement("span");
  el.contentEditable = "false";
  el.dataset.chip = key;
  el.className = key.endsWith("tok") ? "agent-recipe__tok" : "agent-recipe__chip";
  el.setAttribute("role", "button");
  if (icon) {
    const i = document.createElement("span");
    const url = `url("/assets/icons/ui/${icon}.svg")`;
    i.className = "agent-recipe__chip-icon";
    i.setAttribute("aria-hidden", "true");
    i.style.maskImage = url;
    i.style.webkitMaskImage = url;
    el.append(i);
  }
  el.append(label);
  return el;
}

const productChips = () => [chipEl("pimg", "Product image", "ic_add"), " or ", chipEl("purl", "Product URL", "ic_link")];
const modelChip = () => chipEl("model", "Model Image", "ic_add");

/** Remove what sits between two siblings, but only while it is still the untouched " or ". */
function dropOr(a: Node, b: Node) {
  const between: Node[] = [];
  for (let n = a.nextSibling; n && n !== b; n = n.nextSibling) between.push(n);
  if (between.every((n) => n.nodeType === Node.TEXT_NODE) && between.map((n) => n.textContent).join("").trim() === "or") {
    between.forEach((n) => n.parentNode?.removeChild(n));
  }
}

/** Append a token at the end, with exactly one space before it. */
function appendToken(ed: HTMLElement, node: HTMLElement) {
  const last = ed.lastChild;
  if (last && !/\s$/.test(last.textContent ?? "")) ed.append(" ");
  ed.append(node, " ");
}

export function RecipeEditor({
  product,
  model,
  hintUrl,
  onChip,
  onRemoved,
  onEnter,
}: {
  product: RecipeProduct | null;
  model: boolean;
  /** Guide dot on the Product URL chip (handoff §3.1). */
  hintUrl: boolean;
  onChip: (target: "product" | "url" | "model") => void;
  onRemoved: (slot: "product" | "model") => void;
  onEnter: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Fill once. Mounting is what "turn the recipe on" means, so this is also the reset.
  useLayoutEffect(() => {
    ref.current?.replaceChildren(
      "Create a UGC before-and-after video for ",
      ...productChips(),
      " featuring ",
      modelChip(),
      " ",
    );
  }, []);

  // state → DOM
  useLayoutEffect(() => {
    const ed = ref.current;
    if (!ed) return;
    const q = (k: ChipKey) => ed.querySelector<HTMLElement>(`[data-chip="${k}"]`);

    const tok = q("ptok") ?? q("utok");
    if (product) {
      const node =
        product.type === "photo"
          ? chipEl("ptok", "@Product 1")
          : chipEl("utok", (product.url ?? "").split("/")[0], "ic_link");
      const a = q("pimg");
      const b = q("purl");
      if (tok) tok.replaceWith(node);
      else if (a && b) {
        dropOr(a, b);
        a.replaceWith(node);
        b.remove();
      } else if (a ?? b) (a ?? b)!.replaceWith(node);
      else appendToken(ed, node);
    } else if (tok) tok.replaceWith(...productChips());

    const mtok = q("mtok");
    if (model && !mtok) {
      const chip = q("model");
      if (chip) chip.replaceWith(chipEl("mtok", "@Model 1"));
      else appendToken(ed, chipEl("mtok", "@Model 1"));
    } else if (!model && mtok) mtok.replaceWith(modelChip());
  }, [product, model]);

  // Guide dot: a data attribute the stylesheet draws, since the chip is not a React node.
  useEffect(() => {
    const chip = ref.current?.querySelector<HTMLElement>('[data-chip="purl"]');
    const on = hintUrl && !/[?&]nohint\b/.test(window.location.search);
    chip?.toggleAttribute("data-hint", on);
  }, [hintUrl, product]);

  return (
    <div
      ref={ref}
      className="agent-recipe__text"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Prompt"
      spellCheck={false}
      onClick={(e) => {
        const chip = (e.target as HTMLElement).closest<HTMLElement>("[data-chip]");
        const k = chip?.dataset.chip as ChipKey | undefined;
        if (!k) return;
        onChip(k === "purl" || k === "utok" ? "url" : k === "model" || k === "mtok" ? "model" : "product");
      }}
      onInput={() => {
        const ed = ref.current;
        if (!ed) return;
        if (product && !ed.querySelector('[data-chip="ptok"],[data-chip="utok"]')) onRemoved("product");
        if (model && !ed.querySelector('[data-chip="mtok"]')) onRemoved("model");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEnter();
        }
      }}
      onPaste={(e) => {
        // Plain text only — no pasted markup inside the prompt.
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
      }}
    />
  );
}
