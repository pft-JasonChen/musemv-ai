/**
 * Canned prompt fills for `/song/create`'s two compose helpers — the **Idea**
 * button (both tabs) and the **Lyrics** button (Custom, non-instrumental).
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────────
 *
 * Both lists are the product owner's own copy, handed over on 2026-08-24 as
 * `[YCM] AI Song Ideas & Lyrics` (two CSV sheets: `Ideas`, `Lyrics`), and
 * transcribed here verbatim — line breaks, `[intro]`/`[verse]` markers and the
 * one Japanese sheet included. They are CONTENT, not fixtures invented to fill
 * a screen: don't reword them, don't "improve" the phrasing, and don't fold
 * them into `ENHANCE_SAMPLES` (that array is the mock `enhancePrompt`
 * response, a different feature with a different owner).
 *
 * ── WHY THIS FILE EXISTS AT ALL ─────────────────────────────────────────────
 *
 * The two Idea buttons were REMOVED on 2026-08-06 ("V1 ships no canned-sample
 * fillers") and RESTORED on 2026-08-24 at the product owner's request, this
 * time with real copy behind them. So the note that used to live in
 * `SongCompose.tsx` — "DP ships these, re-remove them on every drop" — is
 * withdrawn: DP's `.song-create__idea-btn` is now wanted, and a future drop
 * bringing it back is the drop agreeing with us.
 *
 * DP fills its own buttons from three-item placeholder arrays
 * (`IDEA_SUGGESTIONS` / `LYRICS_SUGGESTIONS` in `SongCreatePage.tsx`). These
 * are the real ones and are deliberately longer, so `pickIdea` below is what
 * keeps a second click from landing on the string already in the box.
 */

/**
 * Idea fills — a style + scene + tempo + mood line, the shape the song engine
 * reads best. Used by the Idea button in Simple mode (`describe`) and in Custom
 * mode (`lyrics`, which DP labels "LYRICS / IDEA" — the box takes either).
 */
export const SONG_IDEA_PROMPTS: readonly string[] = [
  "Dark R&B Rock, wandering through a foggy neon alley, slow tense pulse, eerie cinematic intensity",
  "Modern J-Pop, racing through a bright city at dawn, fast driving pop rhythm, bittersweet cinematic energy",
  "Chill Acoustic Beach Pop, driving along the coast at sunset, relaxed cruising groove, breezy nostalgic warmth",
  "Romantic Pop, watching city lights from a rooftop, soft mid-tempo dance groove, dreamy and intimate energy",
  "Orchestral Pop, watching rain fall over a quiet city, slow sweeping tempo, melancholic cinematic grandeur",
  "Ambient Electronic, watching the stars on a clear winter night, extremely slow evolving pace, deep meditative energy",
  "Swing Big Band, dancing in a vintage ballroom, lively brass-led swing, groovy energetic charm",
  "Country R&B, cruising a dirt road at sunset, steady mid-tempo groove, warm atmospheric confidence",
  "Romantic Bossa Nova, relaxing in a sunny courtyard, relaxed swaying rhythm, light breezy intimacy",
  "K-Pop Trap, getting ready for a glamorous night out, fast pumping beat, dark confident energy",
  "Pop, Hip-Hop, EDM, and K-Pop, celebrating with friends at a night festival, energetic dance groove, dreamy uplifting energy",
  "Uplifting Electronic House, dancing in a bright club, driving four-on-the-floor groove, energetic euphoric energy",
];

/** Lyrics fills — complete lyric sheets with section markers. Custom mode only. */
export const LYRIC_PRESETS: readonly string[] = [
  `[intro]

[verse]
Frost climbs the window pane
Breath turns to silver mist
The world is holding still
In the quiet of the dark

[chorus]
I am drifting with the stars
Weightless in the endless deep
Cold light glows above
Watching over all we keep

[verse]
Shadows stretch across the field
Velvet sky is burning white
Ancient echoes start to hum
Through the crystal winter air

[chorus]
I am drifting with the stars
Weightless in the endless deep
Cold light glows above
Watching over all we keep

[bridge]
Silence blooms like frozen glass
Time suspends its heavy hand
Floating in the velvet tide
Fading to the distant blue

[outro]`,
  `[intro]

[verse]
窓を流れる街の灯りが
溶け出す朝の冷たい風
サイドシートには誰もいない
思い出だけを積み込んだ
信号機が青に変われば
この痛みも遠ざかるかな
エンジンが奏でる旋律
出口のない地図を走る

[chorus]
アクセル踏み込んで駆け抜ける
暁の街を切り裂いていく
さよならの影を追い越して
光の先へ進むのさ
忘れられない言葉も全部
朝焼けの中に置いていく

[verse]
昨日の自分が置いてきた
答えを探して彷徨った
バックミラーに映る景色は
少しずつ滲んで消えるよ
高速道路のカーブ曲がれば
新しい世界が顔を出す

[chorus]
アクセル踏み込んで駆け抜ける
暁の街を切り裂いていく
さよならの影を追い越して
光の先へ進むのさ
忘れられない言葉も全部
朝焼けの中に置いていく
君のいない道を選んだの

[bridge]
立ち止まった時間は終わる
震える手でハンドル握り
恐れなんて捨てていくから
未来はすぐそこにあるはず

[outro]`,
  `[intro]

[verse]
Grey clouds hanging heavy on the window pane
Got the rhythm of the drops tapping out a refrain
Open up the notebook while the kettle starts to hum
Searching for a quiet frequency, let the words come
Paper pages turning in the soft light of the lamp
Feeling like the world is slow, a little bit damp
Coffee getting colder but the thoughts are flowing clear
Nothing but the static and the lessons staying near

[chorus]
Rainy day state of mind, drift into the page
Lost in the chapters, a solitary stage
Keeping it slow while the clock ticks wide
Nowhere to go with the world left outside

[verse]
Ink staining lines where the logic finds a home
Scanning through the paragraphs, I’m free to roam
Highlighting the truth in a shade of neon blue
Connecting all the pieces that I never thought were true
Coffee steam rising like a ghost into the air
Finding little comforts in the silence that we share
Focus is a feather drifting steady on the breeze
Learning how to navigate the complicated seas

[chorus]
Rainy day state of mind, drift into the page
Lost in the chapters, a solitary stage
Keeping it slow while the clock ticks wide
Nowhere to go with the world left outside

[bridge]
Let the streetlights blur in a wash of golden haze
Everything is simple in these slow-motion days
Turning down the volume of the noise in my head
Taking in the meaning of the lines that I read
It’s just me and the ink in the pale afternoon
Caught in the hum of this low-fidelity tune

[outro]`,
  `[intro]

[verse]
The horizon bleeds in hues of violet light
I drift away beneath the fading sun
The water holds me in the velvet night
Before the day is finally undone

[chorus]
Lost in the waves of a golden tide
With nowhere left to go and nowhere to hide
Floating in echoes of a dream so deep
Wrapped in the silence that the oceans keep

[verse]
My heartbeat slows to match the rolling swell
The salt is heavy on the cooling air
Bound by a soft and ancient ocean spell
Leaving behind the weight of every care

[chorus]
Lost in the waves of a golden tide
With nowhere left to go and nowhere to hide
Floating in echoes of a dream so deep
Wrapped in the silence that the oceans keep

[bridge]
The stars awake within the liquid glass
Reflected sparks upon the midnight blue
Watching the moments gently drift and pass
Dissolving into light and shade and you

[outro]`,
  `[intro]

[verse]
The neon hum is calling out my name
A thousand colors washing out the gray
I catch your rhythm through the velvet night
Bathed in the glow of electric delight
The music swells beneath the open air
There is a magic waiting everywhere
I take your hand and feel the spark ignite
We lose ourselves until the morning light

[chorus]
Oh we're dancing under festival lights
Reaching for stars in the middle of nights
Spinning in circles we never look down
Lost in the glow of this carnival town
Everything's gold in the haze of the beat
With you in my arms the rhythm is sweet

[verse]
Your heartbeat syncs up with the pulsing drums
Forget the shadows of the days to come
We move as one through the crowded space
A steady fire that the stars embrace
The world is blurred in a prism of blue
I'm finding my heaven right here with you

[chorus]
Oh we're dancing under festival lights
Reaching for stars in the middle of nights
Spinning in circles we never look down
Lost in the glow of this carnival town
Everything's gold in the haze of the beat
With you in my arms the rhythm is sweet

[bridge]
And if the music fades away tomorrow
I will hold onto the light we borrowed
Beyond the reach of every silent fear
I know I'm safe whenever you are near
The night is ours to claim forevermore
Right here upon this glowing dance floor

[outro]`,
  `[intro]

[verse]
Lights are burning gold tonight
Everything feels so damn right
Step into the floor and move
Finding that electric groove
Shadows fading in the haze
Lost inside this neon maze
Hands are reaching to the sky
Watch the velvet colors fly

[chorus]
We are dancing in the light
Holding on with all our might
Feeling every beat of fire
Taking us a little higher

[verse]
Bass is thumping in my chest
Putting all the ghosts to rest
Spinning round until we blur
This is how the magic stir
Nothing else is real today
Only music leads the way
Rhythm runs inside my veins
Breaking free from heavy chains
Brightest star is in your eyes
Underneath the velvet skies

[chorus]
We are dancing in the light
Holding on with all our might
Feeling every beat of fire
Taking us a little higher

[bridge]
Let the rhythm take control
Let it resonate your soul
Stay within this perfect flow
Watching how the embers glow
Moving deeper in the night
Bathing in the liquid light

[outro]`,
  `[intro]

[verse]
The pine needles crunch beneath my boots
I settle where the ground is still and dry
Striking a match against the cool damp air
To watch the cedar logs begin to sigh

[chorus]
Oh the campfire carves a circle in the night
Keeping back the shadows and the deep
There is nothing left to hold onto tonight
But the promises the mountains mean to keep

[verse]
A moth dances close to the orange bloom
Ignoring how the heat might take its wing
I pull my heavy blanket tighter now
And listen to the woods begin to sing

[chorus]
Oh the campfire carves a circle in the night
Keeping back the shadows and the deep
There is nothing left to hold onto tonight
But the promises the mountains mean to keep

[bridge]
Tomorrow holds a map I cannot read
But here the sparks drift upward to the dark
I plant my weary spirit in the soil
And leave my story with a dying spark

[outro]`,
  `[intro]

[verse]
The ink is dancing on the paper edge
A whisper trapped in lines of gold and blue
Beside the glass upon the window ledge
I trace the silent words that lead to you

[chorus]
Oh, hold this flame until the morning light
The candle shadows paint a soft design
Within the velvet stillness of the night
Your ghost is breathing between every line

[verse]
I turn a page to find a hidden dream
The wax is weeping down the crystal base
We drift along a quiet, silver stream
Reflected in the window's dark embrace

[chorus]
Oh, hold this flame until the morning light
The candle shadows paint a soft design
Within the velvet stillness of the night
Your ghost is breathing between every line

[bridge]
It isn't just the story that I seek
It's how you found a rhythm in my soul
The secret language that we cannot speak
Until the final chapter makes us whole
[outro]`,
  `[intro]

[verse]
The golden beams are dancing on the wall
A quiet morning shadows start to fall
The scent of jasmine drifts across the stone
I'm happy just to be here on my own

[chorus]
Oh the world is spinning soft and slow
With nowhere else that I would need to go
Let the breeze whisper secrets in the light
Everything feels honest and so bright

[verse]
The coffee steam is curling in the air
I lose my heavy worries and my care
The garden gate is closed to all the noise
In simple peace I find my hidden joys

[chorus]
Oh the world is spinning soft and slow
With nowhere else that I would need to go
Let the breeze whisper secrets in the light
Everything feels honest and so bright

[bridge]
Time is just a rhythm in the heat
With lazy steps upon this tiled street
I trace the patterns where the colors play
Holding on to this lovely kind of day

[outro]`,
  `[intro]

[verse]
Lights fade in the dark
Burning like a spark
Feel the static rise
Reflected in your eyes

[chorus]
Chase the neon horizon
Lost in the sound
We are rising higher
Above the solid ground

[verse]
Electric pulse beat
Moving through the street
Gravity is gone
Until the break of dawn

[chorus]
Chase the neon horizon
Lost in the sound
We are rising higher
Above the solid ground

[bridge]
Running fast, never slow
Watching all the colors glow
Let the rhythm take control
Losing body, losing soul

[chorus]
Chase the neon horizon
Lost in the sound
We are rising higher
Above the solid ground

[outro]`,
];

/**
 * Random, but never the string already in the box: a plain `Math.random()` pick
 * over a 10-item list repeats about one click in ten, and a button that visibly
 * does nothing reads as broken rather than as unlucky. With one item, or when
 * every item is the current value, it returns the single item unchanged.
 */
export function pickIdea(items: readonly string[], current: string): string {
  const others = items.filter((item) => item.trim() !== current.trim());
  const pool = others.length > 0 ? others : items;
  return pool[Math.floor(Math.random() * pool.length)];
}
