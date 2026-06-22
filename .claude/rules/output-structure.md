# Output Structure

## Single-variant (default)

```
prototypes/<feature-slug>/
├── index.html
├── css/
│   ├── tokens.css        ← @import from design-system, never redefine values
│   ├── components.css
│   └── layout.css
├── js/
│   ├── main.js
│   └── components/<name>.js
├── img/
└── README.md
```

## Multi-variant (explicit request only)

```
prototypes/<feature-slug>/
├── idea-1/              ← matches specs/idea-1.md
└── idea-2/              ← matches specs/idea-2.md
```

## Iteration

Revisions of an existing variant use a `v2/` subfolder inside that variant. Never overwrite — always new folder.

## Temp scripts

One-off utilities live in `prototypes/<feature>/temp/` (gitignored). Do not reference from HTML or JS. Delete after use on user confirmation.

## Image assets

Primary: local `img/` at project root (`icons/`, `photos/`, `ui/`, `brand/`, `product/`).
Fallback: Figma export. See `.claude/skills/web-asset-library/SKILL.md`.
