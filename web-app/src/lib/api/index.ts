// Public entry point for the API layer — THE backend swap point.
//
// The UI and providers import `api` from here and depend only on the MuseApi
// contract. Replacing the mock with a real backend is a one-line change:
// construct the real client instead of MockMuseApi.

import type { MuseApi } from "./contract";
import { MockMuseApi } from "./mock";

export const api: MuseApi = new MockMuseApi();

export type { MuseApi } from "./contract";
export { pollJob } from "./poll";
export * from "./schemas";
