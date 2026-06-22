#!/usr/bin/env bash
# .claude/scripts/tier-a-static-check.sh
# Tier-A static check, run by the PostToolUse hook after Write|Edit|MultiEdit.
#   CHECK 1: no raw hex/rgb/hsl in CSS  (skip tokens.css, var(), url(#...)).
#   CHECK 2: img src + internal href must resolve.
#   CHECK 3: ALLOW-LIST class guard. A class token is LEGAL only if it maps to
#            component-catalog.md §0a (one of the 59 base classes, optionally as
#            block__element where the block is catalogued, and/or with a §1b
#            sanctioned --modifier), is an authorised .x- placeholder
#            (-> [STATIC: PLACEHOLDER], not FAIL), or is a §5 feature-scoped
#            class. Anything else -> [STATIC: FAIL] "not in component-catalog.md".
# Contract: NEVER block Claude. Only PRINT findings; always exit 0.

INPUT="$(cat 2>/dev/null || true)"
FILE="$(
  printf '%s' "$INPUT" | python3 -c \
  'import sys,json
try:
    d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))
except Exception:
    print("")' 2>/dev/null || true
)"

[ -z "$FILE" ] && exit 0
case "$FILE" in
  *.html|*.htm|*.css) : ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

BASE="$(basename "$FILE")"
ROOT="${CLAUDE_PROJECT_DIR:-.}"
emit() { echo "[STATIC: FAIL] $1"; }

# ---- CHECK 1 — raw colour literals in CSS (skip tokens.css / var() / url(#...)) ----
case "$FILE" in
  *.css)
    if [ "$BASE" != "tokens.css" ]; then
      while IFS=: read -r ln content; do
        [ -z "$ln" ] && continue
        snippet="$(printf '%s' "$content" | sed 's/^[[:space:]]*//' | cut -c1-60)"
        emit "$FILE:$ln — raw colour literal (\"$snippet\") -> bind to a tokens.css var()"
      done < <(grep -nEi '#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(' "$FILE" \
                 | grep -viE 'var\(|tokens\.css|url\(#')
    fi
    ;;
esac

# ---- CHECK 2 — broken refs in HTML (img src + internal href) ----
case "$FILE" in
  *.html|*.htm)
    dir="$(cd "$(dirname "$FILE")" 2>/dev/null && pwd)"
    while IFS=: read -r ln match; do
      [ -z "$ln" ] && continue
      val="${match#*\"}"; val="${val%\"}"
      case "$val" in
        http://*|https://*|//*|\#*|mailto:*|tel:*|data:*|javascript:*|"") continue ;;
      esac
      path="${val%%[?#]*}"
      [ -z "$path" ] && continue
      if [ "${path#/}" != "$path" ]; then
        target="$ROOT$path"
      else
        target="$dir/$path"
      fi
      [ -e "$target" ] || emit "$FILE:$ln — broken ref \"$val\" (looked for: $target)"
    done < <(grep -nEo '(src|href)="[^"]+"' "$FILE")
    ;;
esac

# ---- CHECK 3 — allow-list class guard (HTML class="" + CSS .selectors) ----
python3 - "$FILE" <<'PYEOF'
import sys, re
fp = sys.argv[1]

# component-catalog.md §0a — the 59 catalogued base classes (+ named elements).
CATALOG = {
 # Forms
 "btn","btn-group","btn-icon","checkbox","checkbox-group","combobox","autocomplete",
 "date-picker","radio","radio-group","segmented","select","search-input","slider",
 "textarea","textarea-wrapper","text-input","toggle","upload-area","file","file-list",
 "rating","rating-icon",
 # Navigation
 "breadcrumb","mobile-drawer","dropdown-menu","footer","side-menu","header","pagination",
 "stepper","tabs","tab","link",
 # Data display
 "accordion","avatar","badge","badge-count","badge-dot","card","table","tag","tag-group",
 "summary-list","thumbnail","empty-image","icon-container","divider","text-block","hero",
 "testimonial",
 # Feedback
 "notice","modal","processing","loading-bar","loading-spinner","tooltip","empty-state",
 # Gallery
 "gallery-grid","gallery-item",
}
# Sanctioned BEM modifiers. Source-cited; only values that REALLY ship as classes.
SANCTIONED_MODS = {
    # §1b state vocabulary
    "active", "open", "visible", "loading", "error", "disabled",
    # catalogued component one-offs (tag-- / notice--), §0a/§1b
    "selected", "small", "rounded", "toast", "global",
    # Button Type  (examples/button.html:102 primary, :105 secondary, :107 tertiary)
    "primary", "secondary", "tertiary",
    # Button Tone  (examples/button.html:102 brand, :103 neutral, :104 destructive, :148 inverse)
    "brand", "neutral", "destructive", "inverse",
    # Button Size  (examples/button.html:114 tiny, :115 small[above], :116 medium, :117 large)
    "tiny", "medium", "large",
    # Button-icon Shape  (examples/button-icon.html:102 square, :112 circle)
    "square", "circle",
    # Button-group layout  (examples/button-group.html:96 vertical, :105 stretch)
    "vertical", "stretch",
}  # "item" removed (Decision 3: it is a BEM element, handled by __element logic)
# §5 point 2 — feature-scoped (allowed, not catalogued).
FEATURE_EXACT = {"waveform","creator","storyboard","style-card","select-model",
                 "option-grid","song-item","gallery-cat-tab","gallery-card",
                 "gallery-bottomsheet"}
FEATURE_PREFIX = ("scene-","sb-","char-")

def classify(tok):
    if tok.startswith("x-"):
        return ("PLACEHOLDER", "authorised .x- gap — must be documented")
    if tok in FEATURE_EXACT or tok.startswith(FEATURE_PREFIX):
        return ("OK", "")
    parts = tok.split("--")
    base, mods = parts[0], parts[1:]
    for m in mods:
        if m not in SANCTIONED_MODS:
            return ("FAIL", "unsanctioned modifier --%s (not in component-catalog.md)" % m)
    if base in CATALOG:
        return ("OK", "")
    if "__" in base:
        block = base.split("__", 1)[0]
        if block in CATALOG:
            return ("OK", "")
        return ("FAIL", "BEM block \"%s\" not in component-catalog.md" % block)
    return ("FAIL", "not in component-catalog.md")

try:
    lines = open(fp, encoding="utf-8", errors="ignore").read().splitlines()
except Exception:
    sys.exit(0)

is_css = fp.endswith(".css")
seen = {}
for i, line in enumerate(lines, 1):
    toks = []
    if is_css:
        toks = re.findall(r'\.([A-Za-z_][A-Za-z0-9_-]*)', line)
    else:
        for attr in (re.findall(r'class\s*=\s*"([^"]*)"', line)
                     + re.findall(r"class\s*=\s*'([^']*)'", line)):
            toks += attr.split()
    for t in toks:
        if t and t not in seen:
            seen[t] = i

count = 0
for tok, ln in sorted(seen.items(), key=lambda kv: kv[1]):
    if count >= 50:
        print("[STATIC: note] class output capped at 50 findings"); break
    verdict, reason = classify(tok)
    if verdict == "FAIL":
        print('[STATIC: FAIL] %s:%d — class "%s" %s' % (fp, ln, tok, reason)); count += 1
    elif verdict == "PLACEHOLDER":
        print('[STATIC: PLACEHOLDER] %s:%d — class "%s" (%s)' % (fp, ln, tok, reason)); count += 1
PYEOF

# Always succeed — findings are advisory, never a gate.
exit 0
