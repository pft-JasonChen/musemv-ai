# Engine changes — definition of done

Editing the builder is not the same as editing a spec. These rules apply to
`spec_builder.py`, `capture_lib.py`, `lint_spec.py`, `flowchart_lib.py` and
`spec-styles.css`.

`flowchart_lib.py` has no golden snapshot — its output is judged by eye. Any edit
to it means **re-rendering every feature's `make_flowchart.py` and looking at the
PNGs**, because a change to a shared node or edge style silently reshapes diagrams
that no test covers.

---

## Regression suite

Any edit to `spec_builder.py` or `capture_lib.py` must pass the regression suite
before it counts as done:

```bash
/usr/bin/python3 -m unittest discover -s skills/yco-spec/tests -v
```

The suite covers every `validate()` gate branch, the focus.json merge rules
(measured box overrides, manual `type`/`label` preserved, `focus_lock`, stale-key
warning), and a **golden HTML snapshot** (`tests/golden/spec.html`). If a rendering
change is intentional, regenerate with `REGEN_GOLDEN=1`, review the golden diff in
git, and commit it together with the change.

**Spec CSS lives in `skills/yco-spec/spec-styles.css`** (externalized 2026-07-19),
not in a Python string — edit that file to change spec styling. The builder inlines
it into every spec's `<style>`; the golden snapshot guards byte-identical output, so
a CSS edit that shifts any byte will fail the suite until you regenerate the golden.
