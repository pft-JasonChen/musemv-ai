import type { ContentRemoval } from "@/lib/report";
import type { MvType, Song, Storyboard } from "./types";
import { DEFAULT_STORYBOARD_LYRICS } from "@/lib/api/schemas";

export interface MvTypeOption {
  id: MvType;
  name: string;
  desc: string;
  video: string;
}

export const MV_TYPES: MvTypeOption[] = [
  {
    id: "storytelling",
    name: "Storytelling",
    desc: "A cinematic narrative unfolds scene by scene, driven by your description.",
    video: "/assets/videos/mv-preview/feature_intro_ai_mv_storytelling_480x640.mp4",
  },
  {
    id: "singing",
    name: "Singing",
    desc: "A virtual artist lip-syncs to your vocals, focusing on the singing performance.",
    video: "/assets/videos/mv-preview/feature_intro_ai_mv_singing_480x640.mp4",
  },
  {
    // Product owner request, 2026-08-13: display name only, "Sing & Story" —
    // `id` stays `"hybrid"` (MvTypeSchema, C2 contract surface, frozen; a
    // renamed enum value would be a G4-a contract break, not a UI change).
    id: "hybrid",
    name: "Sing & Story",
    desc: "Blends singing performance with story-driven cinematic moments.",
    video: "/assets/videos/mv-preview/feature_intro_ai_mv_hybrid_480x640.mp4",
  },
];

// Only two real audio files exist; every sample song maps to one of them so
// playback/trim preview always has real audio (demo decision 2026-07-11).
// durationSec is ALWAYS the full track length of the assigned file — the trim
// range lives in Song.trim, never overwrites the duration.
const AUDIO_PARTY_DANCE = "/assets/songs/Party%20Dance.mp3"; // 160s
const AUDIO_TOP_FLOW = "/assets/songs/Top%20Flow%20Production%20-%20Party.mp3"; // 114s
const DUR_PARTY_DANCE = 160;
const DUR_TOP_FLOW = 114;

export const SAMPLE_SONGS: Song[] = [
  {
    id: "s1",
    source: "sample",
    title: "Top Flow - Party",
    durationSec: DUR_TOP_FLOW,
    art: "/assets/images/album-art/album_05.jpg",
    url: AUDIO_TOP_FLOW,
  },
  {
    id: "s2",
    source: "sample",
    title: "Party Dance",
    durationSec: DUR_PARTY_DANCE,
    art: "/assets/images/album-art/album_08.jpg",
    url: AUDIO_PARTY_DANCE,
  },
  {
    id: "s3",
    source: "sample",
    title: "Forest Morning",
    durationSec: DUR_TOP_FLOW,
    art: "/assets/images/album-art/album_01.jpg",
    url: AUDIO_TOP_FLOW,
  },
  {
    id: "s4",
    source: "sample",
    title: "Golden Hour",
    durationSec: DUR_PARTY_DANCE,
    art: "/assets/images/album-art/album_03.jpg",
    url: AUDIO_PARTY_DANCE,
  },
  {
    id: "s5",
    source: "sample",
    title: "Neon Pulse",
    durationSec: DUR_TOP_FLOW,
    art: "/assets/images/album-art/album_02.jpg",
    url: AUDIO_TOP_FLOW,
  },
  {
    id: "s6",
    source: "sample",
    title: "Ethereal Echoes",
    durationSec: DUR_PARTY_DANCE,
    art: "/assets/images/album-art/album_06.jpg",
    url: AUDIO_PARTY_DANCE,
  },
  {
    id: "s7",
    source: "sample",
    title: "Elysian Reverie",
    durationSec: DUR_TOP_FLOW,
    art: "/assets/images/album-art/album_07.jpg",
    url: AUDIO_TOP_FLOW,
  },
];

export const MY_SONGS: Song[] = [
  {
    id: "m1",
    source: "library",
    title: "My Wedding Ballad",
    durationSec: DUR_PARTY_DANCE,
    art: "/assets/images/album-art/album_04.jpg",
    url: AUDIO_PARTY_DANCE,
  },
  {
    id: "m2",
    source: "library",
    title: "Summer Vibes",
    durationSec: DUR_TOP_FLOW,
    art: "/assets/images/album-art/album_09.jpg",
    url: AUDIO_TOP_FLOW,
  },
];

/**
 * `/mv/room`'s "Sample Characters" row: a face to drop into a character slot, with
 * a name under it. The names are placeholders (the photos came without any) —
 * rename freely. To add one, drop `Sample_P<n>.jpg` next to the others and append here.
 */
export const SAMPLE_CHARACTERS: { name: string; url: string }[] = [
  "Emma",
  "Liam",
  "Zara",
  "Noah",
  "Yuki",
  "Kenji",
  "Marco",
  "Sofia",
].map((name, i) => ({
  name,
  url: `/assets/images/character-photos/samples/Sample_P${i + 1}.jpg`,
}));

export interface TemplateOption {
  id: string;
  name: string;
  cover: string;
  prompt: string;
}

/**
 * A template's prompt is written in the same seven sections every time (product
 * owner, 2026-11-27): Theme, Character Setting, Costume Design, Style, Scene and
 * Background, Camera Shot, Ending. Each template supplies the creative parts; the
 * face-identity rules and the base camera instruction are shared so they stay
 * consistent. Every prompt must fit the description box (`DESCRIPTION_MAX`) —
 * `templates.test.ts` holds that.
 */
const CHARACTER_CORE =
  "Keep the figure moving gracefully to the melody and never stop. Strictly keep the input character's face ID, face shape, skin color and overall look in every scene; the character stays the same, realistic and recognizable. Smooth, young, flawless skin with natural foundation, no moles, no spots, no wrinkles. Small face, tall model, half body view, elegant presence.";

interface PromptSpec {
  /** Setting → Inciting Incident & Motive → Development & Climax → Resolution & Meaning. */
  theme: string;
  /** Added after the shared character rules (performance, or the art style the face is drawn in). */
  character: string;
  costume: string;
  style: string;
  scene: string;
  /** Added after the shared "smooth and natural" camera instruction. */
  camera: string;
  /** The closing image; every ending is a zoom out. */
  ending: string;
}

function buildPrompt(p: PromptSpec): string {
  return [
    `Theme:\n${p.theme}`,
    `Character Setting:\n${CHARACTER_CORE} ${p.character}`,
    `Costume Design:\n${p.costume}`,
    `Style:\n${p.style}`,
    `Scene and Background (no logo, no brand):\n${p.scene}`,
    `Camera Shot: Ensure smooth and natural background camera movement. ${p.camera}`,
    `Ending:\n${p.ending}`,
  ].join("\n\n");
}

/** The first six covers are the MV samples; the rest are the visual-style covers
 *  (`public/assets/images/visaul-style/`, sic). */
const STYLE_COVER = (name: string) => encodeURI(`/assets/images/visaul-style/vs_${name}.jpg`);

export const TEMPLATES: TemplateOption[] = [
  {
    id: "t1",
    name: "Neon City",
    cover: "/assets/videos/sample-mvs/mv_03_neon_city.jpg",
    prompt: buildPrompt({
      theme:
        "A glamorous midnight drive through a neon-soaked city. Setting: wet downtown streets after rain, signs reflecting in every puddle. Inciting Incident & Motive: the character leaves a rooftop party alone, drawn toward the brightest part of the skyline. Development & Climax: a convertible glides through intersections of pink and cyan light as the chorus hits and the city pulses with the beat. Resolution & Meaning: parked above the harbor, the character watches the lights settle, calm and free.",
      character: "Cool, confident and magnetic, with smooth, rhythmic movement.",
      costume:
        "Glossy black leather jacket over a metallic silk top, neon-framed reflective sunglasses, sleek tailored trousers, silver rings and chain earrings, polished boots, hair swept back with a wet-look finish.",
      style:
        "Cyberpunk-tinged cinematic night photography. Saturated magenta, electric blue and cyan color grading, high-contrast low-key lighting, glossy reflections, shallow depth of field with soft bokeh, subtle lens flare.",
      scene:
        "Rain-slicked avenues, towering glass skyscrapers, glowing signage in abstract unreadable lettering, a vintage convertible, crosswalks, steam rising from street vents, a rooftop overlooking the harbor.",
      camera: "Low tracking shots beside the car and slow orbiting moves around the character.",
      ending:
        "The final frame holds on the character against a sea of neon bokeh. Ending is zoom out over the glittering skyline.",
    }),
  },
  {
    id: "t2",
    name: "Cinematic Dark",
    cover: "/assets/videos/sample-mvs/mv_01_cinematic_dark.jpg",
    prompt: buildPrompt({
      theme:
        "A brooding noir-tinted drama told in close-ups. Setting: a dim apartment and an empty late-night street. Inciting Incident & Motive: the character wakes from a restless sleep haunted by a memory they cannot place. Development & Climax: they wander through shadow and rim light, emotions rising with the music until a single beam of red light breaks across their face. Resolution & Meaning: stillness returns; the character accepts the memory and steps into the dark with quiet resolve.",
      character: "Intense, introspective expression with minimal, controlled movement.",
      costume:
        "A worn black leather jacket over a dark collared shirt, a subtle silver earring, tousled hair; muted dark layers with no bright accents.",
      style:
        "Moody cinematic close-ups with dramatic low-key lighting, deep shadows and crimson-and-teal rim light, desaturated blacks, fine film grain, shallow depth of field, anamorphic feel.",
      scene:
        "A dim apartment with blinds casting bars of light, a rainy window, an empty night street under a single streetlamp, a narrow corridor with flickering fluorescent light.",
      camera: "Slow push-ins and stable close-ups with occasional rack focus.",
      ending:
        "The frame darkens until only the character's eyes catch the red light. Ending is zoom out into shadow.",
    }),
  },
  {
    id: "t3",
    name: "Late Night Stage",
    cover: "/assets/videos/sample-mvs/mv_02_late_night_stage.jpg",
    prompt: buildPrompt({
      theme:
        "An intimate late-night performance on a smoky stage. Setting: a small club after midnight, a lone spotlight and a worn guitar. Inciting Incident & Motive: the character steps up to play one last song for a handful of listeners. Development & Climax: the performance grows from a whisper to a full-voiced release as the lights rise and the room joins in. Resolution & Meaning: the final note fades into applause, leaving a quiet, emotional connection.",
      character:
        "Performing live with genuine emotion, eyes often closed, fully absorbed in the song.",
      costume:
        "A loose white graphic tee under an open denim jacket, a leather guitar strap, a wristband and a simple pendant, hair slightly tousled from the stage heat.",
      style:
        "Warm live-concert cinematography: amber stage lights, haze and floating dust, soft rim light, subtle film grain, rich shadows, an intimate and emotional mood.",
      scene:
        "A small club stage with a vintage amplifier, a microphone stand, acoustic and electric guitars, red velvet curtains, hazy spotlights and a silhouetted audience.",
      camera: "Close, stable shots on hands and face, then wider shots from the audience.",
      ending:
        "The spotlight narrows to the character's silhouette. Ending is zoom out across the empty room.",
    }),
  },
  {
    id: "t4",
    name: "Anime Style",
    cover: "/assets/videos/sample-mvs/mv_05_anime_style.jpg",
    prompt: buildPrompt({
      theme:
        "A vibrant anime coming-of-age adventure. Setting: a sunlit city of rooftops and cherry-blossom streets. Inciting Incident & Motive: the character hears a melody on the wind and runs to follow it. Development & Climax: across rooftops and train platforms, colors burst and the world swirls with energy as the chorus peaks. Resolution & Meaning: at the hilltop, the character finds the source of the song and smiles with new courage.",
      character:
        "Rendered as a stylized anime character with expressive eyes and flowing hair, while keeping the face ID recognizable.",
      costume:
        "A colorful layered streetwear jacket with bold patterns, a scarf fluttering in the wind, sneakers, a headset and playful accessories such as star pins.",
      style:
        "High-energy anime film aesthetic: bold ink outlines, vibrant saturated colors, cel shading, painterly skies with dramatic clouds, speed lines, sparkles and expressive motion.",
      scene:
        "Rooftops with laundry lines, a train crossing at sunset, narrow streets with blooming trees, a school-yard stairway and a hilltop overlooking the city.",
      camera: "Dynamic sweeping moves with dramatic anime-style angles and quick whip pans.",
      ending: "Petals drift across a glowing sunset sky. Ending is zoom out over the city.",
    }),
  },
  {
    id: "t5",
    name: "Nature Earth",
    cover: "/assets/videos/sample-mvs/mv_07_nature_earth.jpg",
    prompt: buildPrompt({
      theme:
        "A serene journey through untouched wilderness. Setting: alpine peaks, forests and a mirror-still lake at golden hour. Inciting Incident & Motive: the character leaves the city behind, seeking quiet and clarity. Development & Climax: they trek past waterfalls and ridgelines as the music swells with the rising sun. Resolution & Meaning: at the lakeshore, the character breathes in the stillness and feels at one with the earth.",
      character: "Calm, grounded movement with a peaceful, open expression.",
      costume:
        "Earth-toned outdoor layers: a soft wool sweater, a light windbreaker, durable trousers, hiking boots, a woven scarf and a small canvas backpack.",
      style:
        "Epic nature cinematography: warm golden-hour light, rich greens and glacier blues, atmospheric mist, natural film color, ultra-sharp landscapes with gentle depth, serene and awe-inspiring.",
      scene:
        "Snow-capped mountains, a pine forest, a glassy alpine lake reflecting the sky, a winding river, wildflower meadows and drifting morning fog.",
      camera:
        "Slow aerial glides and wide drone-style reveals, with gentle tracking beside the character.",
      ending: "Sunlight spills across the lake. Ending is zoom out to reveal the whole valley.",
    }),
  },
  {
    id: "t6",
    name: "Urban Performer",
    cover: "/assets/videos/sample-mvs/mv_09_urban_performer.jpg",
    prompt: buildPrompt({
      theme:
        "A raw rooftop performance above the city. Setting: a concrete rooftop at golden hour with the skyline behind. Inciting Incident & Motive: the character climbs up with a mic and a battered speaker to be heard. Development & Climax: the verse builds into an energetic chorus as the sun drops and the skyline ignites. Resolution & Meaning: the last line lands with confidence, claiming the city as their stage.",
      character: "Confident, rhythmic movement with strong stage presence.",
      costume:
        "Oversized streetwear: a graphic hoodie or camouflage jacket, layered gold chains, baggy cargo pants, chunky sneakers, a cap and rings.",
      style:
        "Gritty urban cinematography: warm golden-hour backlight, high-contrast color grading, energetic framing, lens flare, film grain and punchy contrast.",
      scene:
        "A weathered rooftop with graffiti walls, water tanks, a skyline of towers, a speaker stack and string lights, with city traffic glowing below.",
      camera: "Energetic movement with quick push-ins that stay smooth and stable.",
      ending:
        "The skyline glows behind the character's silhouette. Ending is zoom out over the rooftops.",
    }),
  },
  // Product owner, 2026-11-27: more visual-style covers, dropped into
  // `public/assets/images/visaul-style/`.
  {
    id: "t7",
    name: "Arena Lights",
    cover: STYLE_COVER("Arena Lights"),
    prompt: buildPrompt({
      theme:
        "A stadium-sized anthem performed under blinding lights. Setting: a packed arena at night with pyrotechnics waiting in the dark. Inciting Incident & Motive: the character walks out alone to a roaring crowd. Development & Climax: as the chorus drops, fire jets, lasers and confetti explode while thousands sing along. Resolution & Meaning: with arms raised, the character shares the moment with the crowd in pure triumph.",
      character:
        "Commanding stage presence with wide, expressive gestures, performing to the crowd.",
      costume:
        "A sparkling sequined stage jacket or embroidered tailored coat, fitted trousers, statement boots, bold jewelry and a wireless headset microphone.",
      style:
        "Epic live-concert cinematography: saturated beams of light, volumetric haze, sparks and confetti, powerful backlight, high dynamic range and an electrifying mood.",
      scene:
        "A giant arena stage with a runway, LED walls showing abstract visuals, towering truss lights, pyrotechnic flames and a sea of raised hands.",
      camera: "Sweeping crane moves over the crowd and sudden close-ups on the performer.",
      ending:
        "Confetti rains down through the beams of light. Ending is zoom out over the entire arena.",
    }),
  },
  {
    id: "t8",
    name: "Celestial Bloom",
    cover: STYLE_COVER("Celestial Bloom"),
    prompt: buildPrompt({
      theme:
        "A dreamlike fantasy where flowers and stars bloom together. Setting: a floating garden in a starlit sky. Inciting Incident & Motive: the character awakens among glowing seeds and follows them upward. Development & Climax: with each step, petals unfurl into constellations until the whole sky blooms in light. Resolution & Meaning: the character dissolves into drifting stardust, at peace with the universe.",
      character: "Weightless, flowing movement, as if floating.",
      costume:
        "A flowing translucent gown or robe in pearl and lavender silk with star-shaped embroidery, a crown of glowing blossoms, long trailing sleeves and shimmering jewelry.",
      style:
        "Ethereal fantasy art: iridescent pastel colors, soft glow, sparkling bokeh, luminous mist, painterly cosmic depth, dreamy and graceful.",
      scene:
        "A floating garden of giant glowing flowers, drifting petals, a night sky full of stars and nebulae, crystal pathways and soft clouds below.",
      camera: "Slow, floating moves that drift with the petals.",
      ending: "Stardust and petals swirl into the sky. Ending is zoom out to a bloom of stars.",
    }),
  },
  {
    id: "t9",
    name: "Concrete Pulse",
    cover: STYLE_COVER("Concrete Pulse"),
    prompt: buildPrompt({
      theme:
        "Street energy synchronized to the beat. Setting: graffiti-covered back alleys and an underpass at dusk. Inciting Incident & Motive: the character steps into the alley as the bass drops, ready to move. Development & Climax: sharp, rhythmic movement cuts across walls and stairs as the beat grows louder. Resolution & Meaning: the character stands in the center of the alley, owning the street.",
      character: "Sharp, rhythmic street-dance movement, perfectly on the beat.",
      costume:
        "Streetwear: a bomber jacket or windbreaker, a graphic tee, cargo pants, chunky sneakers, a beanie, a chain and fingerless gloves.",
      style:
        "Gritty urban cinematography: desaturated concrete tones with punchy color accents, hard directional light, sharp contrast, film grain and a raw documentary feel.",
      scene:
        "A graffiti-covered alley, concrete stairs, an underpass with hanging lamps, chain-link fences, posters and puddles reflecting colorful lights.",
      camera: "Rhythmic cuts on the beat with smooth tracking along walls and stairs.",
      ending: "A final pose in the center of the alley. Ending is zoom out.",
    }),
  },
  {
    id: "t10",
    name: "Dust & Chrome",
    cover: STYLE_COVER("Dust & Chrome"),
    prompt: buildPrompt({
      theme:
        "A sun-baked road movie on an endless desert highway. Setting: cracked asphalt under a blazing sky. Inciting Incident & Motive: the character leaves town in a vintage muscle car with nothing but a guitar. Development & Climax: dust storms and mirages chase the car as the engine and the chorus roar together. Resolution & Meaning: at sunset, the character stops, turns off the engine and listens to the silence.",
      character: "Rugged, cool and self-assured, with relaxed movement.",
      costume:
        "A worn leather jacket, a vintage band-style tee, faded denim, leather boots, aviator sunglasses and a silver belt buckle.",
      style:
        "Retro road-movie photography: sun-bleached warm tones, heat haze, rich chrome reflections, gritty film grain, wide-angle composition and a nostalgic Americana mood.",
      scene:
        "An empty desert highway, a vintage muscle car with polished chrome, red rock formations, a roadside gas pump, drifting dust and a blazing sunset.",
      camera: "Low-angle tracking shots beside the car and wide landscape shots.",
      ending: "The car glows in the sunset dust. Ending is zoom out over the endless road.",
    }),
  },
  {
    id: "t11",
    name: "Gilded Baroque",
    cover: STYLE_COVER("Gilded Baroque"),
    prompt: buildPrompt({
      theme:
        "An opulent baroque court drama by candlelight. Setting: a gilded palace hall with towering columns. Inciting Incident & Motive: the character enters a grand ball carrying a secret melody. Development & Climax: amid swirling dancers and candle flames, the music builds to a passionate crescendo. Resolution & Meaning: in the quiet gallery, the character reveals the song and the hall falls silent in awe.",
      character: "Regal, poised movement with theatrical elegance.",
      costume:
        "A richly embroidered velvet gown or brocade coat in deep burgundy and gold, a lace collar, jeweled brooches, pearl necklaces, an ornate headpiece and long gloves.",
      style:
        "Baroque oil-painting cinematography: warm candlelit chiaroscuro, deep reds and gold, luxurious textures, soft glow, rich shadows and theatrical grandeur.",
      scene:
        "A gilded hall with marble columns, crystal chandeliers, candelabras, heavy velvet drapes, ornate mirrors, a grand staircase and a lute resting on a gold chair.",
      camera: "Slow, elegant dolly moves and gentle orbits around the character.",
      ending:
        "Candlelight flickers across the gold walls. Ending is zoom out through the grand hall.",
    }),
  },
  {
    id: "t12",
    name: "Golden Hour Anthem",
    cover: STYLE_COVER("Golden Hour Anthem"),
    prompt: buildPrompt({
      theme:
        "An uplifting rooftop anthem at sunset. Setting: a city rooftop terrace bathed in golden light. Inciting Incident & Motive: the character picks up a guitar to sing about a new beginning. Development & Climax: the sun sinks, the skyline glows and the chorus lifts as warm light wraps the scene. Resolution & Meaning: the final chorus carries hope as the last light fades.",
      character: "Joyful and heartfelt, singing with an open smile.",
      costume:
        "A flowing terracotta or rust-colored dress or linen shirt, a light denim jacket, delicate gold jewelry and loose, sun-kissed hair.",
      style:
        "Warm golden-hour cinematography: glowing backlight, soft lens flare, honey-toned color grading, shallow depth of field and an optimistic, nostalgic mood.",
      scene:
        "A rooftop terrace with string lights, potted plants, a low wall overlooking a glowing skyline, a wooden stool and an acoustic guitar.",
      camera: "Gentle circular moves and wide, uplifting reveals of the skyline.",
      ending: "Golden light fills the frame. Ending is zoom out over the skyline.",
    }),
  },
  {
    id: "t13",
    name: "Monochrome Noir",
    cover: STYLE_COVER("Monochrome Noir"),
    prompt: buildPrompt({
      theme:
        "A smoky black-and-white noir ballad. Setting: a dim jazz club in the 1940s. Inciting Incident & Motive: a singer steps into a single spotlight, haunted by a lost love. Development & Climax: the song builds as smoke swirls and shadows deepen around the stage. Resolution & Meaning: the last note fades into silence and the spotlight goes out.",
      character: "Slow, smoldering movement with a dramatic, wistful expression.",
      costume:
        "A satin evening gown with sequin details or a double-breasted suit, long gloves, a pearl necklace, finger-wave hair and bold lipstick, all shown in monochrome.",
      style:
        "Classic black-and-white film noir: high-contrast monochrome, hard spotlight, deep shadows, drifting smoke, fine film grain and a timeless, melancholy mood.",
      scene:
        "A smoky jazz club stage with a vintage microphone, a piano, a velvet curtain, small round tables and a single hanging spotlight.",
      camera: "Slow dolly moves and close-ups through the smoke.",
      ending: "The spotlight closes on the singer. Ending is zoom out into darkness.",
    }),
  },
  {
    id: "t14",
    name: "Neon Mirage",
    cover: STYLE_COVER("Neon Mirage"),
    prompt: buildPrompt({
      theme:
        "A surreal neon dream in a futuristic city. Setting: a rain-washed cyber district at night. Inciting Incident & Motive: the character follows a glowing sign that appears and disappears. Development & Climax: reality bends as signs, reflections and rain merge into a shimmering mirage. Resolution & Meaning: at the heart of the maze, the character realizes the city is a dream and steps through.",
      character: "Cool, mysterious presence with slow, dreamy movement.",
      costume:
        "A holographic trench coat or glossy techwear jacket, neon-trimmed accessories, a transparent visor, dark fitted layers and metallic boots.",
      style:
        "Cyberpunk neon cinematography: vivid pink, purple and cyan lights, heavy reflections, volumetric rain, anamorphic flares and a surreal, dreamlike atmosphere.",
      scene:
        "A dense futuristic alley with towering holographic signs in abstract lettering, wet streets, steam, a lone noodle stall, flying vehicles and reflective glass.",
      camera: "Floating, gliding moves through reflections and rain.",
      ending: "The neon haze dissolves into light. Ending is zoom out over the dreamlike city.",
    }),
  },
  {
    id: "t15",
    name: "Sakura Anime Dream",
    cover: STYLE_COVER("Sakura Anime Dream"),
    prompt: buildPrompt({
      theme:
        "A tender anime spring story under cherry blossoms. Setting: a school rooftop in full bloom. Inciting Incident & Motive: the character finds an old music sheet drifting among petals. Development & Climax: as the song plays, memories bloom in pastel flashes and petals swirl around them. Resolution & Meaning: the character smiles through the petals, ready for the next chapter.",
      character:
        "Rendered as a gentle anime character with soft expressions, while keeping the face ID recognizable.",
      costume:
        "A pastel school-style uniform with a ribbon or tie, a light cardigan, a small crossbody bag, hair clips and sneakers.",
      style:
        "Soft anime film aesthetic: pastel pink and sky-blue palette, delicate line art, glowing backlight, falling petals, painterly clouds and a nostalgic, tender mood.",
      scene:
        "A school rooftop with a chain-link fence, cherry trees in full bloom, a distant city skyline, a music stand with sheet music and a sky full of drifting petals.",
      camera: "Gentle drifting moves with soft focus pulls through the petals.",
      ending: "Petals fill the frame. Ending is zoom out over the pink skyline.",
    }),
  },
  {
    id: "t16",
    name: "Super 8 Nostalgia",
    cover: STYLE_COVER("Super 8 Nostalgia"),
    prompt: buildPrompt({
      theme:
        "A warm home-movie memory of a summer long ago. Setting: a sunny suburban backyard and a garage band. Inciting Incident & Motive: friends gather to play a song for the first time. Development & Climax: laughter, dancing and sparklers fill the evening as the music grows. Resolution & Meaning: the film runs out, leaving a bittersweet, cherished memory.",
      character: "Natural, candid and joyful, as if caught on home film.",
      costume:
        "Retro 1970s outfits: a patterned knit sweater, flared jeans, a denim vest, a headband, round sunglasses and a leather bracelet.",
      style:
        "Authentic Super 8 film look: warm faded colors, heavy film grain, light leaks, gate flicker, soft focus edges and a nostalgic home-movie mood.",
      scene:
        "A sunlit backyard with a picnic table, a garage with amps and a drum kit, hanging laundry, a vintage station wagon, string lights and sparklers.",
      camera: "Natural, slightly loose framing that stays smooth, with soft pans and zooms.",
      ending: "The film burns out in a warm light leak. Ending is zoom out.",
    }),
  },
  {
    id: "t17",
    name: "Vaporwave Static",
    cover: STYLE_COVER("Vaporwave Static"),
    prompt: buildPrompt({
      theme:
        "A retro-futuristic vaporwave daydream. Setting: an endless pastel grid horizon at sunset. Inciting Incident & Motive: the character wakes in front of an old CRT screen playing static. Development & Climax: statues, palm trees and glitching shapes rise as the synth line loops. Resolution & Meaning: the character fades into the static, becoming part of the loop.",
      character: "Cool, detached and dreamy, with slow, stylized movement.",
      costume:
        "A pastel windbreaker or oversized shirt, retro sunglasses, holographic accessories, high-waisted trousers and chunky 90s sneakers.",
      style:
        "Vaporwave aesthetic: pink, purple and teal gradients, VHS static and scanlines, chromatic aberration, glitch effects, a retro 80s and 90s digital look.",
      scene:
        "A glowing grid horizon with a huge pastel sun, palm trees, floating marble busts, old CRT monitors, checkerboard floors and drifting pixel clouds.",
      camera: "Slow floating moves with occasional glitchy cuts that stay smooth.",
      ending: "The picture dissolves into VHS static. Ending is zoom out from the horizon.",
    }),
  },
];

// `IDEAS` and `SONG_IDEAS` lived here until 2026-08-06. They fed the "Idea" /
// "Ideas" buttons on /mv/room and /song/create, which V1 does not ship — see
// the note in `SongCompose.tsx`. Deleted rather than left dangling, because a
// fixture with no consumer reads as a feature someone forgot to wire up.

export const SAMPLE_RESULT_VIDEO =
  "/assets/videos/mv-preview/feature_intro_ai_mv_singing_480x640.mp4";

/** Build a mock storyboard (3 scenes, prototype-faithful). */
export function mockStoryboard(opts?: {
  description?: string;
  lyrics?: string;
  title?: string;
}): Storyboard {
  const title = opts?.title?.trim() || "your track";
  return {
    characterImage: "/assets/images/storyboard/storyboard_01.jpg",
    visualStyle:
      "Radiant and joyful, with a dreamy yet devoted expression. Her look is glamorous and sophisticated.",
    scenes: [
      {
        id: "sc1",
        index: 1,
        range: "00:00–00:09",
        // Spec 11 §3.5 prices a Recreate by the SHOT's kind, not the MV's, which
        // is why a Hybrid MV bills both rates. The real generator will label
        // these; the fixture labels them by hand so the arithmetic is exercised.
        kind: "story" as const,
        text: "In a softly lit, elegant dressing room, the woman stands before a grand mirror.",
      },
      {
        id: "sc2",
        index: 2,
        range: "00:09–00:12",
        kind: "sing" as const,
        text: "Close-up on the vocalist as she begins to sing, her expression serene.",
      },
      {
        id: "sc3",
        index: 3,
        range: "00:12–00:15",
        kind: "story" as const,
        text: "The camera follows her hands as she traces the intricate lace patterns on her dress.",
      },
    ],
    story:
      opts?.description?.trim() ||
      "A radiant artist performing in a softly lit studio, dreamy and devoted.",
    lyrics: opts?.lyrics?.trim() || DEFAULT_STORYBOARD_LYRICS,
    coverImage: "/assets/images/storyboard/storyboard_01.jpg",
    coverDescription: `Create a captivating cover image for "${title}" that embodies the essence of a dreamy night sky filled with shimmering stars.`,
  };
}

/** A different demo cover image, cycled into the storyboard on "regenerate". */
export function randomCoverImage(): string {
  const n = Math.floor(Math.random() * 12) + 1;
  return `/assets/images/album-art/album_${String(n).padStart(2, "0")}.jpg`;
}

export function formatDuration(sec: number): string {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export interface Creation {
  id: string;
  kind: "mv" | "song";
  title: string;
  thumb: string;
  date: string;
  plays: number;
  likes: number;
  shares: number;
  liked: boolean;
}

// ── History ("My Creations") samples — ported from the app prototype ────────
export type HistoryStatus = "done" | "processing" | "failed";
export type HistoryKind = "mv" | "song" | "storyboard";

export interface HistorySample {
  id: string;
  kind: HistoryKind;
  title: string;
  thumb?: string; // image for done/community; omitted for processing/failed
  meta?: string; // shown instead of stats (e.g. "AI Song", "Storyboard")
  status: HistoryStatus;
  source?: "community";
  date: string;
  plays: number;
  likes: number;
  shares: number;
  liked: boolean;
  published?: boolean;
  /** Taken down by a reviewer after a community report — see `ContentRemoval`. */
  removal?: ContentRemoval;
  /** Community rows open this song in the player. */
  communitySongId?: string;
  /**
   * The finished artifact, for rows that came from a live job. Seed rows have
   * none and fall back to the sample media — see `useOpenCreation`.
   */
  resultUrl?: string;
}

export const HISTORY_SAMPLES: HistorySample[] = [
  // The vendored `Neon Static` result (2026-09-09). First row because it is
  // the one creation whose lyrics carry REAL per-line timing, so it is what
  // demonstrates YMW260903P0005 on `/song/result` — the screen the bug was
  // filed against — reached the way a user reaches their own song: History
  // row, or the "My Creations" rail on `/song/create`. `useOpenCreation` picks
  // up its audio and its LRC by title (`timedSongAudio`/`lyricsLrcForTitle`).
  {
    id: "h-neon-static",
    kind: "song",
    title: "Neon Static",
    thumb: "/assets/images/album-art/album_neon_static.png",
    status: "done",
    date: "2026-09-09",
    plays: 42,
    likes: 11,
    shares: 4,
    liked: false,
  },
  // Dated today so the public share page is easy to demo from History (see resolveShare).
  {
    id: "h-cinematic-night",
    kind: "mv",
    title: "Cinematic Night",
    thumb: "/assets/videos/sample-mvs/mv_01_cinematic_dark.jpg",
    status: "done",
    date: "2026-07-23",
    plays: 0,
    likes: 0,
    shares: 0,
    liked: true,
  },
  {
    id: "h-new-ai-song-proc",
    kind: "song",
    title: "New AI Song",
    meta: "AI Song",
    status: "processing",
    date: "2026-06-08",
    plays: 0,
    likes: 0,
    shares: 0,
    liked: false,
  },
  {
    id: "h-golden-hour",
    kind: "song",
    title: "Golden Hour",
    thumb: "/assets/images/album-art/album_01.jpg",
    status: "done",
    date: "2026-06-08",
    plays: 108,
    likes: 38,
    shares: 15,
    liked: true,
  },
  {
    id: "h-starlight",
    kind: "storyboard",
    title: "Starlight in Your Eyes",
    thumb: "/assets/images/storyboard/storyboard_01.jpg",
    meta: "Storyboard",
    status: "done",
    date: "2026-06-06",
    plays: 0,
    likes: 0,
    shares: 0,
    liked: false,
  },
  {
    id: "h-neon-city-nights",
    kind: "mv",
    title: "Neon City Nights",
    thumb: "/assets/videos/sample-mvs/mv_03_neon_city.jpg",
    status: "done",
    date: "2026-06-06",
    plays: 68,
    likes: 12,
    shares: 3,
    liked: false,
  },
  {
    id: "h-midnight-drive",
    kind: "song",
    title: "Midnight Drive",
    thumb: "/assets/images/album-art/album_08.jpg",
    status: "done",
    date: "2026-06-05",
    plays: 26,
    likes: 16,
    shares: 8,
    liked: false,
  },
  {
    id: "h-whispers-past",
    kind: "song",
    title: "Whispers of the Past",
    thumb: "/assets/images/album-art/album_05.jpg",
    status: "done",
    source: "community",
    date: "2026-06-09",
    plays: 1200,
    likes: 265,
    shares: 68,
    liked: true,
    communitySongId: "ns-whispers-past",
  },
  {
    id: "h-midnight-drive-failed",
    kind: "song",
    title: "Midnight Drive",
    meta: "AI Song",
    status: "failed",
    date: "2026-06-05",
    plays: 0,
    likes: 0,
    shares: 0,
    liked: false,
  },
  // Two takedown fixtures (2026-10-21, Figma "Menu + Removed Notice"): one of each
  // severity, one MV and one song, so the menu notice and both notice screens can
  // be reached without a demo switch.
  {
    id: "h-love-melody-removed",
    kind: "mv",
    title: "Love Melody",
    thumb: "/assets/videos/sample-mvs/mv_02_late_night_stage.jpg",
    status: "done",
    date: "2026-09-22",
    plays: 214,
    likes: 31,
    shares: 9,
    liked: false,
    published: false,
    removal: {
      kind: "removed",
      reason: "Spam or commercial advertising",
      publishedOn: "2026-09-22",
      removedOn: "2026-10-13",
    },
  },
  {
    id: "h-velvet-skyline-permanent",
    kind: "song",
    title: "Velvet Skyline",
    thumb: "/assets/images/album-art/album_03.jpg",
    status: "done",
    date: "2026-09-22",
    plays: 87,
    likes: 14,
    shares: 5,
    liked: false,
    published: false,
    removal: {
      kind: "permanent",
      reason: "Copyright or unauthorized use",
      publishedOn: "2026-09-22",
      removedOn: "2026-10-13",
    },
  },
];

/** The takedown on a seeded History row, if a reviewer removed it — Result pages look it up by `?id=`. */
export function removalForId(id: string | null | undefined): ContentRemoval | undefined {
  return id ? HISTORY_SAMPLES.find((h) => h.id === id)?.removal : undefined;
}

export const SAMPLE_CREATIONS: Creation[] = [
  {
    id: "c1",
    kind: "mv",
    title: "Cinematic Night",
    thumb: "/assets/videos/sample-mvs/mv_01_cinematic_dark.jpg",
    date: "2026-06-08",
    plays: 0,
    likes: 0,
    shares: 0,
    liked: true,
  },
  {
    id: "c2",
    kind: "song",
    title: "Golden Hour",
    thumb: "/assets/images/album-art/album_01.jpg",
    date: "2026-06-08",
    plays: 108,
    likes: 38,
    shares: 15,
    liked: true,
  },
  {
    id: "c3",
    kind: "mv",
    title: "Neon City Drive",
    thumb: "/assets/videos/sample-mvs/mv_03_neon_city.jpg",
    date: "2026-06-05",
    plays: 42,
    likes: 12,
    shares: 3,
    liked: false,
  },
  {
    id: "c4",
    kind: "song",
    title: "Ethereal Echoes",
    thumb: "/assets/images/album-art/album_06.jpg",
    date: "2026-06-03",
    plays: 215,
    likes: 64,
    shares: 22,
    liked: false,
  },
  {
    id: "c5",
    kind: "mv",
    title: "Urban Performer",
    thumb: "/assets/videos/sample-mvs/mv_09_urban_performer.jpg",
    date: "2026-05-30",
    plays: 9,
    likes: 2,
    shares: 0,
    liked: false,
  },
];

import type { SongCompose, SongResult } from "./types";

/**
 * The nine SONG GENRES — product owner, 2026-09-01. This list is the single
 * source of truth for BOTH `/song/create`'s GENRE chips and `/explore/songs`'s
 * genre tab bar ("tag please match creation"), which is why it lives here in
 * `lib` rather than beside either screen. `SongDetailView` imports it and
 * prepends "All"; it no longer derives its tabs from the catalog's own data.
 *
 * Order is the product owner's, not alphabetical — do not sort it.
 *
 * ⚠️ "Hip-Hop" and "Rap" are two separate chips, as specified. The request
 * wrote the first one "Hip pop"; confirmed 2026-09-01 as the existing
 * "Hip-Hop" spelling this constant already used, not a new distinct genre.
 *
 * Replaces the previous eight (…"Acoustic", "Lo-fi"). Those two, plus "Indie"
 * and "Funk", are gone from the product vocabulary entirely, so the 14 mock
 * community songs tagged with them were re-tagged onto this list in the same
 * change (`community.ts`) — otherwise five of the nine tabs would have shown
 * an empty list against an empty-state design that does not exist yet
 * (`DESIGNER-TODO` A30).
 */
export const GENRES = [
  "Pop",
  "Hip-Hop",
  "R&B",
  "Rock",
  "Jazz",
  "Electronic",
  "Rap",
  "Classical",
  "Country",
];

/** MOOD chips. Unchanged 2026-09-01 — the product owner respecified MOOD's
 *  SELECTION semantics (optional, single-select) but not its option list. */
export const MOODS = ["Uplifting", "Melancholic", "Romantic", "Energetic", "Calm", "Dark"];
export const VOCALS = ["Male", "Female"];

export const SAMPLE_AUDIO = "/assets/songs/Party%20Dance.mp3";

const SONG_TITLES = [
  "Golden Hour",
  "Midnight Drive",
  "Paper Hearts",
  "Neon Skyline",
  "Afterglow",
  "Holding On",
];

export function mockSongResult(c: SongCompose): SongResult {
  const n = Math.floor(Math.random() * 12) + 1;
  const cover = `/assets/images/album-art/album_${String(n).padStart(2, "0")}.jpg`;
  const title = c.title.trim() || SONG_TITLES[Math.floor(Math.random() * SONG_TITLES.length)];
  return {
    id: crypto.randomUUID(),
    title,
    cover,
    genre: c.genre,
    mood: c.mood,
    durationSec: 62 + Math.floor(Math.random() * 120),
    audioUrl: SAMPLE_AUDIO,
    instrumental: c.instrumental,
    lyrics: c.lyrics || undefined,
  };
}

// ── Prompt Enhance fixtures ─────────────────────────────────────────────────
// Canned "AI-enhanced" rewrites keyed by context. Backend-less: the mock picks
// one at random for the requested kind. Ported from the mobile prototype.
export const ENHANCE_SAMPLES: Record<string, string[]> = {
  mv: [
    "A cinematic journey through fragmented memories — golden-hour close-ups give way to wide sweeping shots of empty streets at dusk. Slow-motion moments punctuate the narrative: a hand reaching out, a door closing, light refracting through rain-streaked glass. The visual language is intimate yet expansive, echoing the emotional core of the music.",
    "An editorial-style visual narrative where the artist moves through shifting environments — a candlelit room, a rooftop at night, a sun-drenched coastline. Each scene transition mirrors a lyrical turn, building tension through texture and contrast until a release of saturated color in the final act.",
    "A dreamlike sequence that blends reality and abstraction: handheld footage of intimate moments intercut with stylized wide-angle compositions. Cool blue tones in the verses warm into amber and gold as the chorus hits, with practical light sources — candles, neon signs, headlights — anchoring every frame.",
  ],
  song: [
    "A cinematic, emotionally charged piece that weaves together raw vulnerability and soaring hope. Each verse peels back another layer, building toward a chorus that feels like finally exhaling after holding your breath for years.",
    "An intimate yet anthemic song about the space between who we were and who we're becoming. Rich with sensory detail — rain on windows, city lights through glass, the specific ache of a memory you can't quite shake.",
    "A sweeping, bittersweet ballad tracing the invisible thread that connects two people across distance and time. Lush instrumentation gives way to a stripped-back bridge that lands with quiet devastation before the final chorus lifts everything into catharsis.",
  ],
  lyrics: [
    "[Verse]\nHeadlights cutting through the dark\nYour voice still echoes where you left your mark\nI'm holding onto everything we said\nLiving in the words still running through my head\n\n[Chorus]\nAnd if the night forgets my name\nI'll still remember how you stayed\nThrough every mile and every flame\nYou were the one thing that stayed the same",
    "[Verse]\nQuiet rooms and fading light\nI keep replaying that last goodnight\nEvery silence has your shape\nEvery memory I can't escape\n\n[Chorus]\nSo play it slow, let it burn\nGive me one more song to learn\nHold me here till the record turns\nThis is the only way home I've earned",
    "[Verse]\nCity lights blur into gold\nEvery story that we never told\nI'm still chasing what we used to be\nBefore the world got in between\n\n[Chorus]\nSay you'll wait for me tonight\nUnder every fading light\nWe were never meant to say goodbye\nSo hold this moment till it's right",
  ],
  storyboard: [
    "In a softly diffused light, she stands at the edge of a vast open field at dusk. Her silhouette is framed against a sky that bleeds from gold into deep violet, eyes half-closed as the wind catches the hem of her dress — a quiet moment suspended between longing and release.",
    "A rain-slicked street at night. She walks alone through pools of reflected neon, unhurried, wrapped in thought. The camera follows at a distance, close enough to sense the weight she carries, far enough to let her keep it.",
    "She sits at a window seat, morning light filtering through gauze curtains, tracing patterns across her face. A half-drunk cup of tea rests beside her. The scene holds still — just breath, light, and the particular silence of someone deciding something.",
  ],
  scene: [
    "Effortlessly radiant, with a warm and open expression that draws you in. Her look is polished yet approachable — elegant without effort, as if the light simply finds her wherever she stands.",
    "Quietly commanding, with a gaze that holds a story. Her presence is composed and cinematic — every detail considered, nothing overdone. The kind of beauty that photographs in any light.",
    "Luminous and expressive, with an energy that shifts between dreamy softness and sharp intent. Her style is distinctive and self-assured, carrying the mood of the scene without trying to.",
  ],
  cover: [
    "A breathtaking cover that captures the essence of the song — a lone figure bathed in golden twilight, standing at the crossroads of memory and hope. Soft bokeh, warm film grain, and a color grade that feels like nostalgia made visible.",
    "An evocative, editorial-quality cover image: the subject mid-motion against a dramatic sky, colors saturated just beyond reality. The composition draws the eye inward, the mood aching and cinematic in equal measure.",
    "A striking visual that distills the song's emotional core — intimate framing, dusk-lit atmosphere, textures that feel both timeless and urgent. The image should feel like the first frame of a film you already know you'll love.",
  ],
};
