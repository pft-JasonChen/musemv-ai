/**
 * Parses the tiny HTML subset the FAQ CMS authors into flat, typed blocks.
 *
 * ── WHY A PARSER AND NOT `dangerouslySetInnerHTML` ────────────────────────
 * The product owner chose the hand-rolled allowlist over pulling in a
 * sanitizer (2026-09-07). Two reasons it holds up beyond "one less
 * dependency": the component renders REAL React elements, so there is no
 * `dangerouslySetInnerHTML` anywhere in the tree to audit later; and an
 * unknown tag DEGRADES to its text rather than disappearing or executing —
 * so the day an author pastes a `<table>` or a tracking `<script>` from Word,
 * the page shows the words and drops the markup instead of breaking or
 * running it.
 *
 * The whole grammar the CMS actually uses, measured across all 31 answers in
 * `ycm-faq-sample.json`: `<p>`, `<ul>`, `<ol>`, `<li>`. Nothing else. No
 * links, no emphasis, no headings, no images, no attributes.
 *
 * ── DELIBERATELY NOT LINKIFIED ────────────────────────────────────────────
 * Several answers contain bare URLs and e-mail addresses (`youcammuse.ai`,
 * `reportaproblem.apple.com`, `youcammuse_web@perfectcorp.com`) as PLAIN TEXT.
 * Auto-linkifying them here would be the front end guessing at authorial
 * intent — and it guesses wrong the first time an answer mentions a domain it
 * does not want clickable. The fix belongs in the CMS: author them as `<a>`,
 * then teach this parser the tag in the same change.
 */

export type AnswerBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

/** The five entities an HTML-authoring CMS can emit for this content. */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * Everything that is not one of the four allowed tags becomes text. Note the
 * order: entities are decoded AFTER tags are stripped, so an escaped
 * `&lt;script&gt;` in the source survives as visible text and cannot be
 * promoted into a real tag by this function.
 */
function toText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
    .replace(/\s+/g, " ")
    .trim();
}

function listItems(inner: string): string[] {
  const items: string[] = [];
  for (const m of inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = toText(m[1]);
    if (text) items.push(text);
  }
  return items;
}

/**
 * `html` → blocks, in document order.
 *
 * Text that sits outside any recognised block is not dropped: it is collected
 * into a paragraph of its own. An answer authored as a bare string with no
 * `<p>` wrapper still renders, which matters because nothing stops a CMS
 * author from writing one.
 */
export function parseAnswer(html: string | null | undefined): AnswerBlock[] {
  if (!html) return [];
  const blocks: AnswerBlock[] = [];
  const pattern = /<(p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let cursor = 0;

  const flushLoose = (upTo: number) => {
    const text = toText(html.slice(cursor, upTo));
    if (text) blocks.push({ kind: "p", text });
  };

  for (const m of html.matchAll(pattern)) {
    const start = m.index ?? 0;
    flushLoose(start);
    cursor = start + m[0].length;

    const tag = m[1].toLowerCase();
    if (tag === "p") {
      const text = toText(m[2]);
      if (text) blocks.push({ kind: "p", text });
    } else {
      const items = listItems(m[2]);
      if (items.length) blocks.push({ kind: tag === "ul" ? "ul" : "ol", items });
    }
  }
  flushLoose(html.length);
  return blocks;
}

/**
 * The same content as one plain string — what the search index matches on, so
 * a query for "refund" finds the answer that only mentions it in a list item.
 */
export function answerToPlainText(html: string | null | undefined): string {
  return parseAnswer(html)
    .map((b) => (b.kind === "p" ? b.text : b.items.join(" ")))
    .join(" ");
}
