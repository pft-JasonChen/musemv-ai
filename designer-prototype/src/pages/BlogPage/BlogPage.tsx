import { useState } from 'react'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import RoomNavbar from '../../components/RoomNavbar/RoomNavbar'
import Tabs from '../../components/Tabs/Tabs'
import { MUSIC_VIDEOS } from '../../data/musicVideos'
import { SONGS } from '../../data/songs'
import './BlogPage.css'

type BlogCategory = 'AI Music Video' | 'AI Song' | 'Storyboard' | 'Creator Guides'
type BlogTab = 'All' | BlogCategory
type BlogVersion = 1 | 3

interface BlogArticle {
  id: string
  category: BlogCategory
  title: string
  excerpt: string
  author: string
  date: string
  readTime: string
  image: string
}

const ARTICLES: BlogArticle[] = [
  {
    id: 'photo-to-music-video',
    category: 'AI Music Video',
    title: 'How to Make an AI Music Video From a Photo in 2026',
    excerpt:
      'Turn a single portrait into a polished performance video with music, motion, and a visual story that fits your track.',
    author: 'MUSE Editorial',
    date: 'Jul 29, 2026',
    readTime: '8 min read',
    image: MUSIC_VIDEOS[1]?.cover ?? '',
  },
  {
    id: 'ai-song-generator',
    category: 'AI Song',
    title: 'AI Song Generator Guide: Create Original Music in Minutes',
    excerpt:
      'Learn how lyrics, genre, mood, vocals, and song length work together when generating an original AI track.',
    author: 'Avery Chen',
    date: 'Jul 25, 2026',
    readTime: '10 min read',
    image: SONGS[0]?.cover ?? '',
  },
  {
    id: 'music-video-prompts',
    category: 'Creator Guides',
    title: '25 AI Music Video Prompts for Cinematic Results',
    excerpt:
      'Copy, customize, and combine these prompt formulas for performance scenes, narrative videos, and visualizers.',
    author: 'MUSE Editorial',
    date: 'Jul 22, 2026',
    readTime: '12 min read',
    image: MUSIC_VIDEOS[2]?.cover ?? '',
  },
  {
    id: 'storyboard-workflow',
    category: 'Storyboard',
    title: 'From Storyboard to Final Cut: Plan an AI Music Video Scene by Scene',
    excerpt:
      'A practical workflow for reviewing scenes, refining prompts, and keeping character and visual style consistent.',
    author: 'Mina Park',
    date: 'Jul 18, 2026',
    readTime: '9 min read',
    image: MUSIC_VIDEOS[3]?.cover ?? '',
  },
  {
    id: 'youtube-music-video',
    category: 'AI Music Video',
    title: 'How to Create a Music Video for YouTube Without a Production Crew',
    excerpt:
      'Build a publish-ready video with an original concept, character images, editable scenes, and the right aspect ratio.',
    author: 'Jordan Lee',
    date: 'Jul 15, 2026',
    readTime: '7 min read',
    image: MUSIC_VIDEOS[4]?.cover ?? '',
  },
  {
    id: 'lyrics-to-song',
    category: 'AI Song',
    title: 'How to Turn Lyrics Into a Song With AI',
    excerpt:
      'Structure your lyrics, describe the sound you want, and guide an AI song generator toward a more intentional result.',
    author: 'Avery Chen',
    date: 'Jul 11, 2026',
    readTime: '8 min read',
    image: SONGS[1]?.cover ?? '',
  },
  {
    id: 'tiktok-ideas',
    category: 'Creator Guides',
    title: '15 AI Music Video Ideas for TikTok, Reels, and Shorts',
    excerpt:
      'Short-form concepts designed around strong opening frames, clear visual hooks, and repeatable creator workflows.',
    author: 'MUSE Editorial',
    date: 'Jul 8, 2026',
    readTime: '6 min read',
    image: MUSIC_VIDEOS[5]?.cover ?? '',
  },
  {
    id: 'consistent-character',
    category: 'Storyboard',
    title: 'How to Keep the Same Character Across Every AI Video Scene',
    excerpt:
      'Use reference images and focused scene descriptions to preserve identity, wardrobe, and visual continuity.',
    author: 'Mina Park',
    date: 'Jul 4, 2026',
    readTime: '11 min read',
    image: MUSIC_VIDEOS[6]?.cover ?? '',
  },
  {
    id: 'instrumental-track',
    category: 'AI Song',
    title: 'How to Generate an Instrumental Track for Your Video',
    excerpt:
      'Choose a mood, genre, and duration that supports your edit without competing with dialogue or on-screen action.',
    author: 'Avery Chen',
    date: 'Jun 30, 2026',
    readTime: '7 min read',
    image: SONGS[2]?.cover ?? '',
  },
  {
    id: 'aspect-ratio',
    category: 'AI Music Video',
    title: '9:16 vs. 16:9: Which Music Video Format Should You Choose?',
    excerpt:
      'Compare vertical and landscape formats for social platforms, YouTube, presentations, and campaign assets.',
    author: 'Jordan Lee',
    date: 'Jun 26, 2026',
    readTime: '6 min read',
    image: MUSIC_VIDEOS[7]?.cover ?? '',
  },
  {
    id: 'songwriting-prompts',
    category: 'Creator Guides',
    title: '50 Songwriting Prompts to Break Through Creative Block',
    excerpt:
      'Explore themes, moods, narrative angles, and lyrical starting points for your next original AI-assisted song.',
    author: 'MUSE Editorial',
    date: 'Jun 21, 2026',
    readTime: '14 min read',
    image: SONGS[3]?.cover ?? '',
  },
  {
    id: 'storyboard-checklist',
    category: 'Storyboard',
    title: 'AI Storyboard Checklist: What to Review Before Creating Your MV',
    excerpt:
      'Check timing, scene progression, character framing, prompt clarity, and visual consistency before rendering.',
    author: 'Mina Park',
    date: 'Jun 17, 2026',
    readTime: '9 min read',
    image: MUSIC_VIDEOS[8]?.cover ?? '',
  },
  {
    id: 'music-video-style-guide',
    category: 'AI Music Video',
    title: 'How to Choose a Visual Style for Your AI Music Video',
    excerpt:
      'Match lighting, camera movement, color, and pacing to the emotion of your track before generating the first scene.',
    author: 'Jordan Lee',
    date: 'Jun 14, 2026',
    readTime: '8 min read',
    image: MUSIC_VIDEOS[9]?.cover ?? MUSIC_VIDEOS[0]?.cover ?? '',
  },
  {
    id: 'performance-video-ideas',
    category: 'AI Music Video',
    title: '12 AI Performance Video Ideas That Put Your Artist Center Stage',
    excerpt:
      'Explore stage, studio, street, and cinematic performance concepts designed to keep the artist visually consistent.',
    author: 'MUSE Editorial',
    date: 'Jun 10, 2026',
    readTime: '9 min read',
    image: MUSIC_VIDEOS[10]?.cover ?? MUSIC_VIDEOS[1]?.cover ?? '',
  },
  {
    id: 'music-video-character-photo',
    category: 'AI Music Video',
    title: 'How to Pick the Best Character Photo for an AI Music Video',
    excerpt:
      'Use clear framing, balanced lighting, and a recognizable expression to help every generated scene feel connected.',
    author: 'Jordan Lee',
    date: 'Jun 6, 2026',
    readTime: '6 min read',
    image: MUSIC_VIDEOS[11]?.cover ?? MUSIC_VIDEOS[2]?.cover ?? '',
  },
  {
    id: 'music-video-editing-workflow',
    category: 'AI Music Video',
    title: 'A Beginner-Friendly Workflow for Editing an AI Music Video',
    excerpt:
      'Move from generated clips to a finished sequence by reviewing timing, continuity, transitions, and the final cover.',
    author: 'MUSE Editorial',
    date: 'Jun 2, 2026',
    readTime: '11 min read',
    image: MUSIC_VIDEOS[12]?.cover ?? MUSIC_VIDEOS[3]?.cover ?? '',
  },
  {
    id: 'music-video-publishing',
    category: 'AI Music Video',
    title: 'How to Prepare Your AI Music Video for Publishing',
    excerpt:
      'Review subtitles, watermark settings, aspect ratio, metadata, and platform requirements before sharing your video.',
    author: 'Jordan Lee',
    date: 'May 29, 2026',
    readTime: '7 min read',
    image: MUSIC_VIDEOS[13]?.cover ?? MUSIC_VIDEOS[4]?.cover ?? '',
  },
  {
    id: 'ai-song-genre-guide',
    category: 'AI Song',
    title: 'AI Song Genres Explained: How to Describe the Sound You Want',
    excerpt:
      'Learn the musical language behind pop, electronic, acoustic, hip-hop, jazz, classical, and lo-fi generation.',
    author: 'Avery Chen',
    date: 'Jun 13, 2026',
    readTime: '10 min read',
    image: SONGS[4]?.cover ?? SONGS[0]?.cover ?? '',
  },
  {
    id: 'ai-song-mood-prompts',
    category: 'AI Song',
    title: '30 Mood Prompts for More Expressive AI-Generated Songs',
    excerpt:
      'Turn broad feelings into useful musical direction with prompts for uplifting, romantic, energetic, calm, and dark tracks.',
    author: 'Avery Chen',
    date: 'Jun 9, 2026',
    readTime: '12 min read',
    image: SONGS[5]?.cover ?? SONGS[1]?.cover ?? '',
  },
  {
    id: 'ai-song-vocal-style',
    category: 'AI Song',
    title: 'How Vocal Style Changes the Feeling of an AI Song',
    excerpt:
      'Compare vocal presence, range, intensity, and delivery so the generated performance supports your lyrics and genre.',
    author: 'MUSE Editorial',
    date: 'Jun 5, 2026',
    readTime: '8 min read',
    image: SONGS[6]?.cover ?? SONGS[2]?.cover ?? '',
  },
  {
    id: 'ai-song-title-guide',
    category: 'AI Song',
    title: 'How to Write a Memorable Title for Your AI-Generated Song',
    excerpt:
      'Find a concise title that captures the song’s central image, emotional turn, or most memorable lyrical phrase.',
    author: 'Avery Chen',
    date: 'Jun 1, 2026',
    readTime: '6 min read',
    image: SONGS[7]?.cover ?? SONGS[3]?.cover ?? '',
  },
  {
    id: 'ai-song-for-video',
    category: 'AI Song',
    title: 'How to Create an Original Song That Fits Your Video',
    excerpt:
      'Plan energy, structure, lyrics, and duration around the visual story so the soundtrack and edit feel made together.',
    author: 'MUSE Editorial',
    date: 'May 28, 2026',
    readTime: '9 min read',
    image: SONGS[8]?.cover ?? SONGS[4]?.cover ?? '',
  },
  {
    id: 'storyboard-scene-prompts',
    category: 'Storyboard',
    title: 'How to Write Clear Scene Prompts for an AI Storyboard',
    excerpt:
      'Describe subject, action, setting, framing, and mood in a repeatable structure that is easy to review and refine.',
    author: 'Mina Park',
    date: 'Jun 12, 2026',
    readTime: '10 min read',
    image: MUSIC_VIDEOS[14]?.cover ?? MUSIC_VIDEOS[5]?.cover ?? '',
  },
  {
    id: 'storyboard-pacing',
    category: 'Storyboard',
    title: 'Storyboard Pacing: How Long Should Each Music Video Scene Be?',
    excerpt:
      'Balance quick cuts and longer visual moments by listening for beats, lyric changes, transitions, and emotional peaks.',
    author: 'Mina Park',
    date: 'Jun 8, 2026',
    readTime: '8 min read',
    image: MUSIC_VIDEOS[15]?.cover ?? MUSIC_VIDEOS[6]?.cover ?? '',
  },
  {
    id: 'storyboard-visual-continuity',
    category: 'Storyboard',
    title: 'A Practical Guide to Visual Continuity Across Storyboard Scenes',
    excerpt:
      'Keep wardrobe, environment, lighting, props, and character direction consistent as the story moves between shots.',
    author: 'Mina Park',
    date: 'Jun 4, 2026',
    readTime: '11 min read',
    image: MUSIC_VIDEOS[16]?.cover ?? MUSIC_VIDEOS[7]?.cover ?? '',
  },
  {
    id: 'storyboard-review',
    category: 'Storyboard',
    title: 'How to Review an AI Storyboard Before You Create the Video',
    excerpt:
      'Catch unclear actions, repeated compositions, timing gaps, and character inconsistencies before rendering begins.',
    author: 'Mina Park',
    date: 'May 31, 2026',
    readTime: '7 min read',
    image: MUSIC_VIDEOS[17]?.cover ?? MUSIC_VIDEOS[8]?.cover ?? '',
  },
  {
    id: 'storyboard-to-edit',
    category: 'Storyboard',
    title: 'From Storyboard Scenes to a Cohesive Music Video Edit',
    excerpt:
      'Use the storyboard as a timing map while selecting alternate generations, rebuilding scenes, and assembling the final MV.',
    author: 'Mina Park',
    date: 'May 27, 2026',
    readTime: '9 min read',
    image: MUSIC_VIDEOS[18]?.cover ?? MUSIC_VIDEOS[9]?.cover ?? '',
  },
  {
    id: 'creator-prompt-formula',
    category: 'Creator Guides',
    title: 'The Prompt Formula Every AI Music Creator Should Know',
    excerpt:
      'Combine intent, subject, action, atmosphere, and constraints to make song and video prompts easier to control.',
    author: 'MUSE Editorial',
    date: 'Jun 11, 2026',
    readTime: '10 min read',
    image: MUSIC_VIDEOS[19]?.cover ?? MUSIC_VIDEOS[0]?.cover ?? '',
  },
  {
    id: 'creator-content-series',
    category: 'Creator Guides',
    title: 'How to Turn One AI Music Video Into a Complete Content Series',
    excerpt:
      'Plan teasers, alternate covers, vertical edits, behind-the-scenes posts, and follow-up clips from one creative concept.',
    author: 'MUSE Editorial',
    date: 'Jun 7, 2026',
    readTime: '8 min read',
    image: MUSIC_VIDEOS[20]?.cover ?? MUSIC_VIDEOS[1]?.cover ?? '',
  },
  {
    id: 'creator-release-checklist',
    category: 'Creator Guides',
    title: 'The Independent Creator’s AI Music Release Checklist',
    excerpt:
      'Organize the song, cover, music video, credits, captions, thumbnails, and publishing details before release day.',
    author: 'MUSE Editorial',
    date: 'Jun 3, 2026',
    readTime: '9 min read',
    image: SONGS[9]?.cover ?? SONGS[0]?.cover ?? '',
  },
  {
    id: 'creator-short-form-hooks',
    category: 'Creator Guides',
    title: '20 Visual Hooks for Short-Form AI Music Content',
    excerpt:
      'Start with movement, contrast, transformation, or an unanswered visual question to earn attention in the first seconds.',
    author: 'MUSE Editorial',
    date: 'May 30, 2026',
    readTime: '11 min read',
    image: MUSIC_VIDEOS[21]?.cover ?? MUSIC_VIDEOS[2]?.cover ?? '',
  },
  {
    id: 'creator-brand-consistency',
    category: 'Creator Guides',
    title: 'How to Build a Consistent Visual Identity With AI Creative Tools',
    excerpt:
      'Create recognizable patterns across color, type, imagery, characters, and tone without making every release look identical.',
    author: 'MUSE Editorial',
    date: 'May 26, 2026',
    readTime: '12 min read',
    image: SONGS[10]?.cover ?? SONGS[1]?.cover ?? '',
  },
]

const BLOG_TABS: BlogTab[] = ['All', 'AI Music Video', 'AI Song', 'Storyboard', 'Creator Guides']

function BlogVersionNav({ version }: { version: BlogVersion }) {
  return (
    <nav className="blog-page__versions" aria-label="Blog concept versions">
      {([1, 3] as BlogVersion[]).map((item) => (
        <a
          key={item}
          href={`/blog${item}`}
          className={`blog-page__version${item === version ? ' blog-page__version--active' : ''}`}
        >
          Blog {item}
        </a>
      ))}
    </nav>
  )
}

function ArticleMeta({ article }: { article: BlogArticle }) {
  return (
    <p className="blog-article-meta">
      <span>{article.author}</span>
      <span aria-hidden="true">·</span>
      <time>{article.date}</time>
      <span aria-hidden="true">·</span>
      <span>{article.readTime}</span>
    </p>
  )
}

function ArticleCard({ article, horizontal = false }: { article: BlogArticle; horizontal?: boolean }) {
  return (
    <article className={`blog-card${horizontal ? ' blog-card--horizontal' : ''}`}>
      <a href={`#${article.id}`} className="blog-card__image-link" aria-label={article.title}>
        <img className="blog-card__image" src={article.image} alt="" />
      </a>
      <div className="blog-card__body">
        <p className="blog-card__category">{article.category}</p>
        <h2 className="blog-card__title">
          <a href={`#${article.id}`}>{article.title}</a>
        </h2>
        <p className="blog-card__excerpt">{article.excerpt}</p>
        <ArticleMeta article={article} />
      </div>
    </article>
  )
}

function BlogOne({ articles }: { articles: BlogArticle[] }) {
  const lead = articles[0]
  if (!lead) return null

  return (
    <div className="blog-one">
      <article className="blog-one__lead">
        <img src={lead.image} alt="" className="blog-one__lead-image" />
        <div className="blog-one__lead-overlay" />
        <div className="blog-one__lead-copy">
          <p>{lead.category}</p>
          <h2>{lead.title}</h2>
          <span>{lead.excerpt}</span>
          <ArticleMeta article={lead} />
        </div>
      </article>
      <div className="blog-one__grid">
        {articles.slice(1).map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}

function BlogThree({ articles }: { articles: BlogArticle[] }) {
  const lead = articles[0]
  if (!lead) return null

  return (
    <div className="blog-three">
      <div className="blog-three__magazine">
        <article className="blog-three__feature">
          <img src={lead.image} alt="" />
          <div className="blog-three__feature-copy">
            <p>{lead.category}</p>
            <h2>{lead.title}</h2>
            <span>{lead.excerpt}</span>
            <ArticleMeta article={lead} />
          </div>
        </article>
        <div className="blog-three__secondary">
          {articles.slice(1, 3).map((article) => (
            <ArticleCard key={article.id} article={article} horizontal />
          ))}
        </div>
        <aside className="blog-three__trending">
          <p className="blog-three__section-label">TRENDING NOW</p>
          <ol>
            {articles.slice(3, 8).map((article, index) => (
              <li key={article.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p>{article.category}</p>
                  <a href={`#${article.id}`}>{article.title}</a>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <section className="blog-three__latest">
        <div className="blog-three__latest-header">
          <div>
            <p className="blog-three__section-label">FRESH IDEAS &amp; PRACTICAL GUIDES</p>
            <h2>Latest from MUSE</h2>
          </div>
          <a href="#blog-top">Browse all articles</a>
        </div>
        <div className="blog-three__latest-grid">
          {articles.slice(3).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section className="blog-three__newsletter">
        <div>
          <p>THE MUSE CREATOR LETTER</p>
          <h2>New AI music and video ideas, once a week.</h2>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="blog-email" className="blog-three__email-label">
            Email address
          </label>
          <input id="blog-email" type="email" placeholder="you@example.com" />
          <button type="submit">Subscribe</button>
        </form>
      </section>
    </div>
  )
}

function BlogPage({ version }: { version: BlogVersion }) {
  const [activeTab, setActiveTab] = useState<BlogTab>('All')
  const visibleArticles =
    activeTab === 'All' ? ARTICLES : ARTICLES.filter((article) => article.category === activeTab)
  const controls = (
    <div className="blog-page__controls">
      <Tabs tabs={BLOG_TABS} active={activeTab} onChange={(tab) => setActiveTab(tab as BlogTab)} />
      <BlogVersionNav version={version} />
    </div>
  )

  return (
    <AppLayout navbar={<RoomNavbar title="Blog" credits={390} tabsSlot={controls} />} showFooter>
      <div id="blog-top" className={`blog-page blog-page--${version}`}>
        {version === 1 && <BlogOne articles={visibleArticles} />}
        {version === 3 && <BlogThree articles={visibleArticles} />}
      </div>
    </AppLayout>
  )
}

export default BlogPage
