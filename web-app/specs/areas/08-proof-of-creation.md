# Area 08 — Proof of Creation

> Read `../00-overview.md` first (conventions, ID scheme).

## Status: Removed — not in web scope

Proof of Creation (App F21) was decided **out of scope for the web MVP**. As of **2026-07-24** the
placeholder screen has been removed from the codebase: the `/proof` route, the `proof/ProofView`
component, and the History `⋯` menu's **Get Proof** entry are all deleted. There is no certificate,
payment, hashing, or issuance anywhere in `web-app/`.

If Proof of Creation is scoped for a future phase, RD designs it end-to-end — payment ($4.90 IAP vs.
other), hashing (App uses a SHA-256 audio hash), which creation it binds to, owner-name handling, and
certificate delivery (App emails a PDF) are all undefined. See the parity matrix in
`../00-overview.md` §8 (App F21).
