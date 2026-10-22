// AI Song — copy for the "unsupported language" error on `/song/create`.
//
// Product owner, 2026-10-22: many AI Song jobs came back as the backend's
// "invalid parameter" error, traced to lyrics/ideas written in a language the
// song model does not take. The product wants a clear error instead.
//
// **RD owns the detection** (product owner, same day). A front-end script-based
// check was built and then removed at their request, so nothing here inspects
// the text. Today the error is reachable only through the `?demo=1` panel flag
// `songLangUnsupported`; RD wires the real trigger to its own answer.

/** The list the `( i )` tooltip shows. Order and wording are the design's. */
export const SUPPORTED_SONG_LANGUAGES =
  "English, Japanese, German, Portuguese, Italian, French, Spanish, Turkish, Chinese, Korean, and Hindi";

export const UNSUPPORTED_LANGUAGE_MESSAGE = "This language isn’t supported yet.";
