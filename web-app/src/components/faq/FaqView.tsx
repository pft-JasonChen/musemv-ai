"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { FAQ_SECTION_COMPONENT, type FaqDocument, type FaqItem } from "@/lib/api/schemas";
import { answerToPlainText, parseAnswer, type AnswerBlock } from "@/lib/faq/renderAnswer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useBackNavigation } from "@/components/shell/DetailNavbar";
import { Tabs } from "@/components/shell/RoomNavbar";
import { useDemoFlag } from "@/components/demo/useDemo";
import { ApiErrorState } from "@/components/ui/ApiErrorState";
import { DpIcon } from "@/components/ui/DpIcon";
import { FeedbackDialog } from "@/components/profile/FeedbackDialog";

/**
 * `/faq` — the help centre.
 *
 * ── LAYOUT: ONE PAGE, NOT A FILTER (product owner, 2026-09-07) ────────────
 * All 31 answers render at once, grouped into their nine CMS categories, with
 * a category bar that JUMPS rather than filters. Two things depend on that and
 * would be lost by showing one category at a time: the browser's own
 * find-in-page reaches every answer (Chrome will even open a closed
 * `<details>` to show a hit), and support can deep-link a single question as
 * `/faq#faq-24`.
 *
 * That bar is the shared `Tabs` component at every width — one wrapping row
 * above the content, exactly as `/explore/songs` renders its genre tags. It is
 * deliberately NOT a sticky side column any more: a control that changed
 * identity at 1024px was the inconsistency the product owner objected to.
 *
 * ── i18n: THE BODY IS TRANSLATED BY THE CMS, NOT BY US ────────────────────
 * `api.getFaq(locale)` is the only locale-varying call in the contract. FAQ
 * copy never enters `src/lib/i18n/dictionaries/` — RD asks the CMS for the
 * active language and the answers come back translated. The prototype ships
 * one English fixture on purpose (see `mock.ts`), so switching locale here
 * changes the URL and not the words; that is the mock being honest about
 * having one document, not the plumbing being absent.
 *
 * The page's own chrome (title, placeholder, the contact card) is hardcoded
 * English, matching every other screen outside nav/Profile — see AGENTS.md's
 * i18n scope rule. That is prototype scaffolding, not a product decision.
 *
 * ── WHY `<details>` AND NOT A HAND-ROLLED DISCLOSURE ──────────────────────
 * Keyboard operation, the open/closed state and find-in-page expansion all
 * come free and correct. An `aria-expanded` div would have to re-earn each of
 * them, and would silently forfeit the third — which is one of the two reasons
 * this screen is laid out the way it is.
 */

/** Sections the CMS may add that this screen has no renderer for are skipped
 *  rather than assumed — see `FaqSectionSchema`'s note. */
function renderableSections(doc: FaqDocument) {
  return doc.sections.filter(
    (s) => s.__component === FAQ_SECTION_COMPONENT && s.categoryFaqList.length > 0,
  );
}

/** Web reads `webAnswer`; `iosAnswer` is the fallback so a CMS entry that only
 *  filled the iOS variant renders text rather than an empty panel. */
function answerHtml(item: FaqItem): string | null {
  return item.webAnswer ?? item.iosAnswer;
}

function AnswerBody({ blocks }: { blocks: AnswerBlock[] }) {
  return (
    <>
      {blocks.map((block, i) =>
        block.kind === "p" ? (
          <p key={i}>{block.text}</p>
        ) : block.kind === "ul" ? (
          <ul key={i}>
            {block.items.map((li, j) => (
              <li key={j}>{li}</li>
            ))}
          </ul>
        ) : (
          <ol key={i}>
            {block.items.map((li, j) => (
              <li key={j}>{li}</li>
            ))}
          </ol>
        ),
      )}
    </>
  );
}

function Question({ item }: { item: FaqItem }) {
  const blocks = useMemo(() => parseAnswer(answerHtml(item)), [item]);
  return (
    <details className="faq-item" id={`faq-${item.id}`}>
      <summary className="faq-item__summary">
        <span className="faq-item__question">{item.question}</span>
        <DpIcon name="ic_chevron-down" className="faq-item__chevron" />
      </summary>
      <div className="faq-item__answer">
        <AnswerBody blocks={blocks} />
      </div>
    </details>
  );
}

export function FaqView() {
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  const goBack = useBackNavigation("/");
  const forceEmpty = useDemoFlag("faqSearchEmpty");

  const [doc, setDoc] = useState<FaqDocument | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [fbOpen, setFbOpen] = useState(false);
  const sectionsRef = useRef<HTMLDivElement | null>(null);

  /**
   * Retry is a counter rather than a callback that re-runs the fetch, so the
   * effect stays the single owner of the request. Doing it the other way means
   * clearing `failed` synchronously inside the effect body, which
   * `react-hooks/set-state-in-effect` rejects — and rightly: that write happens
   * during render-commit, not in response to anything resolving.
   */
  useEffect(() => {
    let live = true;
    api.getFaq(locale).then(
      (d) => {
        if (!live) return;
        setDoc(d);
        setFailed(false);
      },
      () => {
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, [locale, attempt]);

  const sections = useMemo(() => (doc ? renderableSections(doc) : []), [doc]);

  /**
   * ── THE CATEGORY BAR IS THE SHARED `Tabs` COMPONENT (product owner,
   *    2026-09-07) ─────────────────────────────────────────────────────────
   *
   * The same component `/explore/songs` uses for its ten genre tags, so the
   * two screens cannot drift apart. It was briefly a custom row with Previous
   * / Next arrows copied from `TopPicksSection`; the product owner rejected
   * that on consistency grounds, and measuring `/explore/songs` at 390px
   * settles the layout question too — its tag bar is `flex-wrap: wrap` with
   * `overflow-x: visible`, wrapping to two rows rather than scrolling.
   * Wrapping is the house pattern; the arrows were the deviation.
   */
  const categoryTabs = useMemo(
    () => sections.map((s) => ({ id: String(s.id), label: s.category })),
    [sections],
  );

  /**
   * The search index is built once per document, not per keystroke, and it
   * matches the ANSWER as well as the question — "refund" appears only inside
   * an answer's list items, and it is exactly the kind of word a user types.
   */
  const index = useMemo(
    () =>
      sections.flatMap((section) =>
        section.categoryFaqList.map((item) => ({
          item,
          category: section.category,
          haystack: `${item.question} ${answerToPlainText(answerHtml(item))}`.toLowerCase(),
        })),
      ),
    [sections],
  );

  const trimmed = query.trim().toLowerCase();
  const searching = trimmed.length > 0;

  /**
   * Matches keep their category grouping rather than collapsing into one flat
   * list: "Can I get a refund?" reads very differently under "Subscription &
   * Premium" than it would as a bare row, and reusing the browse markup means
   * there is only one row design to keep correct.
   *
   * The demo flag is the LAST branch and never touches `index` or `sections` —
   * a switch that emptied the source would change what the PRODUCTION build
   * does when the flag is off, and could not be undone from the panel.
   */
  const resultSections = useMemo(() => {
    if (!searching || forceEmpty) return [];
    const hits = new Set(
      index.filter((e) => e.haystack.includes(trimmed)).map((e) => e.item.id),
    );
    return sections
      .map((s) => ({ ...s, categoryFaqList: s.categoryFaqList.filter((i) => hits.has(i.id)) }))
      .filter((s) => s.categoryFaqList.length > 0);
  }, [searching, forceEmpty, index, trimmed, sections]);

  const resultCount = resultSections.reduce((n, s) => n + s.categoryFaqList.length, 0);

  /**
   * Open and reveal a `#faq-<id>` deep link once the content is on screen.
   *
   * Imperative on purpose: making `open` a controlled prop would turn all 31
   * `<details>` into controlled elements and take their free behaviour with
   * it. Runs in an effect, so nothing reads `window` during render (R-1).
   */
  useEffect(() => {
    if (!doc) return;
    const hash = window.location.hash;
    if (!/^#faq-\d+$/.test(hash)) return;
    const el = document.getElementById(hash.slice(1));
    if (!(el instanceof HTMLDetailsElement)) return;
    el.open = true;
    el.scrollIntoView({ block: "start" });
  }, [doc]);

  /**
   * `Tabs` renders BUTTONS, which is what finally fixed the phone Back button.
   * The bar used to be `<a href="#faq-section-N">`, and every anchor click
   * PUSHED a history entry — measured: three clicks, three entries — so Back
   * had to walk back through every category the reader had touched before it
   * left the page ("Back does nothing, or it jumps to a section"). A button
   * pushes none.
   *
   * `replaceState` still writes the hash so the position stays shareable, but
   * it adds nothing to the stack, so Back means "leave the FAQ" on the first
   * press. It must NOT become `pushState`.
   */
  const jumpToSection = (id: string) => {
    const el = document.getElementById(`faq-section-${id}`);
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
    window.history.replaceState(null, "", `#faq-section-${id}`);
    setCurrentId(Number(id));
  };

  /** Scroll-spy for the rail. Skipped while searching — the rail is not shown
   *  then, and observing detached sections would just churn state. */
  useEffect(() => {
    if (!doc || searching) return;
    const nodes = sectionsRef.current?.querySelectorAll("[data-faq-section]");
    if (!nodes?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setCurrentId(Number(visible.target.getAttribute("data-faq-section")));
      },
      // A band across the upper third: the "current" category is the one whose
      // heading has most recently passed under the sticky chrome, which is what
      // a reader perceives as where they are.
      { rootMargin: "-80px 0px -66% 0px", threshold: 0 },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [doc, searching]);

  return (
    <>
      <div className="faq-page">
        {/* Phone-only. AppLayout.css hides `.navbar` AND `.footer` below 767px,
            so without this the route has no way back on a phone (A5). */}
        <div className="faq-page__phone-bar">
          <button
            type="button"
            className="faq-page__phone-back"
            aria-label="Back"
            onClick={goBack}
          >
            <DpIcon name="ic_chevron-left" className="faq-page__phone-back-icon" />
          </button>
          <p className="faq-page__phone-title">FAQ</p>
          <span />
        </div>

        <div className="faq-page__head">
          <h1 className="faq-page__title">How can we help?</h1>
          <p className="faq-page__subtitle">
            Answers about creating Music Videos and Songs, publishing to the community, your
            account, and billing.
          </p>
          <div className="faq-page__search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles"
              aria-label="Search help articles"
            />
            {query && (
              <button
                type="button"
                className="faq-page__search-clear"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <DpIcon name="ic_close" />
              </button>
            )}
          </div>
        </div>

        {failed ? (
          <ApiErrorState onRetry={() => setAttempt((a) => a + 1)} />
        ) : !doc ? null : searching ? (
          <div className="faq-page__body">
            <div className="faq-page__sections">
              {resultCount === 0 ? (
                <div className="faq-page__empty">
                  <strong>No results for &ldquo;{query.trim()}&rdquo;</strong>
                  <p>
                    Try a different word, or clear the search to browse all {index.length}{" "}
                    questions by category.
                  </p>
                </div>
              ) : (
                <>
                  {/* Announced politely so a screen-reader user hears the count
                      change as they type, instead of only discovering it by
                      arrowing into the list. */}
                  {/* Built as ONE template literal rather than interleaved JSX
                      expressions: the wrapped version rendered "2 resultsfor"
                      because the space before "for" sat at a line break and was
                      collapsed away. Measured in the browser — it reads fine in
                      the source either way. */}
                  <p className="faq-page__result-count" role="status">
                    {`${resultCount} ${resultCount === 1 ? "result" : "results"} for “${query.trim()}”`}
                  </p>
                  {resultSections.map((section) => (
                    <section
                      key={section.id}
                      className="faq-section"
                      aria-labelledby={`faq-result-label-${section.id}`}
                    >
                      <p className="faq-section__label" id={`faq-result-label-${section.id}`}>
                        {section.category}
                      </p>
                      <div className="faq-section__card">
                        {section.categoryFaqList.map((item) => (
                          <Question key={item.id} item={item} />
                        ))}
                      </div>
                    </section>
                  ))}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="faq-page__body">
            {/* Falls back to the FIRST category rather than to `null`. The
                scroll-spy only names a section once one enters its band, so at
                scroll 0 nothing would be lit and the bar would look inert —
                `/explore/songs` always has one tag selected. Defaulting here is
                also truthful: unscrolled, you are at the first category. */}
            <Tabs
              tabs={categoryTabs}
              active={String(currentId ?? sections[0]?.id ?? "")}
              onChange={jumpToSection}
            />

            <div className="faq-page__sections" ref={sectionsRef}>
              {sections.map((section) => (
                <section
                  key={section.id}
                  className="faq-section"
                  id={`faq-section-${section.id}`}
                  data-faq-section={section.id}
                  aria-labelledby={`faq-label-${section.id}`}
                >
                  <p className="faq-section__label" id={`faq-label-${section.id}`}>
                    {section.category}
                  </p>
                  <div className="faq-section__card">
                    {section.categoryFaqList.map((item) => (
                      <Question key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        <div className="faq-page__contact">
          <span className="faq-page__contact-copy">
            <strong>Still need help?</strong>
            <span>Send us the details and our support team will reply within 1 business day.</span>
          </span>
          {/* `requireLogin` gates this for the same reason the Footer's Contact
              is gated (product owner, 2026-09-01): the form prefills the
              signed-in address, so a guest gets the sign-in dialog first. */}
          <button
            type="button"
            className="history-page__empty-cta"
            onClick={() => requireLogin(() => setFbOpen(true))}
          >
            Send Feedback
          </button>
        </div>
      </div>

      {/* Conditionally mounted — unmounting IS the form reset, exactly as
          `Footer` and `ProfileView` mount it. */}
      {fbOpen && <FeedbackDialog onClose={() => setFbOpen(false)} />}
    </>
  );
}
