import { describe, it, expect } from "vitest";
import { parseAnswer, answerToPlainText } from "./renderAnswer";
import { FAQ_FIXTURE } from "./fixture";
import { FAQ_SECTION_COMPONENT } from "@/lib/api/schemas";

describe("parseAnswer", () => {
  it("reads a single paragraph", () => {
    expect(parseAnswer("<p>Hello world</p>")).toEqual([{ kind: "p", text: "Hello world" }]);
  });

  it("keeps blocks in document order and distinguishes ul from ol", () => {
    expect(parseAnswer("<p>Lead</p><ul><li>a</li><li>b</li></ul><ol><li>1</li></ol>")).toEqual([
      { kind: "p", text: "Lead" },
      { kind: "ul", items: ["a", "b"] },
      { kind: "ol", items: ["1"] },
    ]);
  });

  it("returns [] for null, undefined and empty", () => {
    expect(parseAnswer(null)).toEqual([]);
    expect(parseAnswer(undefined)).toEqual([]);
    expect(parseAnswer("")).toEqual([]);
  });

  it("keeps text that is not wrapped in any block", () => {
    expect(parseAnswer("bare text")).toEqual([{ kind: "p", text: "bare text" }]);
    expect(parseAnswer("before<p>inside</p>after")).toEqual([
      { kind: "p", text: "before" },
      { kind: "p", text: "inside" },
      { kind: "p", text: "after" },
    ]);
  });

  // The allowlist's whole point: an unknown tag degrades to its text rather
  // than vanishing (content loss) or surviving as markup (an injection).
  it("degrades a disallowed tag to its text content", () => {
    expect(parseAnswer("<p>See <strong>this</strong> now</p>")).toEqual([
      { kind: "p", text: "See this now" },
    ]);
    expect(parseAnswer("<p>ok</p><table><tr><td>cell</td></tr></table>")).toEqual([
      { kind: "p", text: "ok" },
      { kind: "p", text: "cell" },
    ]);
  });

  it("does not emit a script tag's markup", () => {
    const blocks = parseAnswer("<p>safe</p><script>alert(1)</script>");
    expect(JSON.stringify(blocks)).not.toContain("<script");
    expect(blocks[0]).toEqual({ kind: "p", text: "safe" });
  });

  // Entities are decoded only AFTER tags are stripped, so escaped markup in
  // the source can never be promoted into a real tag by this parser.
  it("decodes entities without re-creating tags", () => {
    expect(parseAnswer("<p>Tom &amp; Jerry</p>")).toEqual([{ kind: "p", text: "Tom & Jerry" }]);
    expect(parseAnswer("<p>&lt;script&gt;x&lt;/script&gt;</p>")).toEqual([
      { kind: "p", text: "<script>x</script>" },
    ]);
  });

  it("drops empty paragraphs and empty list items", () => {
    expect(parseAnswer("<p></p><p>  </p><ul><li></li></ul><p>real</p>")).toEqual([
      { kind: "p", text: "real" },
    ]);
  });
});

describe("answerToPlainText", () => {
  it("flattens list items so search can match inside them", () => {
    const html = "<p>Refund eligibility:</p><ul><li>iOS: handled by Apple</li></ul>";
    expect(answerToPlainText(html)).toBe("Refund eligibility: iOS: handled by Apple");
  });
});

describe("the shipped fixture", () => {
  const items = FAQ_FIXTURE.sections.flatMap((s) => s.categoryFaqList);

  it("has 9 categories and 31 questions", () => {
    expect(FAQ_FIXTURE.sections).toHaveLength(9);
    expect(items).toHaveLength(31);
  });

  it("uses only the section component the screen knows how to render", () => {
    for (const s of FAQ_FIXTURE.sections) expect(s.__component).toBe(FAQ_SECTION_COMPONENT);
  });

  // A question id is the `#faq-<id>` deep-link target, so a collision would
  // silently point support at the wrong answer.
  it("has unique, stable question ids", () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("parses every answer into at least one block", () => {
    for (const item of items) {
      const blocks = parseAnswer(item.webAnswer ?? item.iosAnswer);
      expect(blocks.length, `question ${item.id} produced no blocks`).toBeGreaterThan(0);
    }
  });
});
