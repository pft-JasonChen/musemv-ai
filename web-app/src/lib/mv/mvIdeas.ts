/**
 * Prompts the Home MV input's "Idea" button writes (2026-10-30).
 *
 * PLACEHOLDER copy, written for the prototype — unlike `songIdeas.ts`, which is
 * transcribed from the product owner's CSVs. Replace with the real pool when
 * one exists. `/mv/room` deliberately has no Idea button (see `MvRoom.tsx`);
 * this pool only feeds Home. Fills go through `pickIdea` (songIdeas.ts), so a
 * tap never repeats the current prompt.
 */
export const MV_IDEA_PROMPTS: readonly string[] = [
  "At midnight, raindrops dance on the pavement, whispering stories of the past. Two strangers share an umbrella and a song under flickering streetlights.",
  "A road trip at golden hour: windows down, hair in the wind, desert highways and neon motel signs flashing by as the chorus kicks in.",
  "A dreamy rooftop party above a glittering city, slow-motion confetti, friends dancing until the sun comes up.",
  "A lone dancer in an empty theatre, a single spotlight, dust in the air, every beat landing in a sweeping turn.",
  "A retro arcade adventure in pixel-bright colours, the singer jumping between game worlds to chase a runaway heart.",
  "A quiet seaside town at dawn: waves, bicycles, a letter in a bottle, and a reunion on the pier at the final chorus.",
  "A futuristic neon metropolis in the rain, holograms flickering as the hero races through crowded streets on a motorbike.",
  "A cozy winter cabin, snow falling outside, warm candlelight and a slow dance by the fireplace.",
];
