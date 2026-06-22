# YouCam Muse — Asset Library

把 Figma 匯出的資產放到對應資料夾後，告訴 Claude「幫我把 assets 替換進 prototype」即可自動更新。

---

## 資料夾結構

```
assets/
├── icons/
│   ├── app/                 # App Icon + Wordmark 識別
│   └── ui/                  # 通用 UI 圖示（SVG）
│
├── images/
│   ├── album-art/           # 歌曲封面圖
│   ├── banner/              # Explore 頁 Banner
│   ├── character-photos/
│   │   └── samples/         # 內建示範人臉（Sample Photos）
│   ├── onboarding/          # Onboarding 頁面背景圖（目前空資料夾）
│   └── storyboard/          # 分鏡縮圖
│
├── songs/                   # 示範用 MP3 音樂
│
└── videos/
    ├── mv-preview/          # Feature Intro 介紹影片（MP4）
    ├── sample-mvs/          # MV 風格卡片縮圖（JPG thumbnail）
    └── storyboard-clips/    # 分鏡 Scene 預覽截圖（JPG）
```

---

## 現有檔案清單

### `icons/app/`
| 檔案 | 說明 |
|---|---|
| `ic_app_ycm.png` | App Icon 原始尺寸 |
| `ic_app_ycm_512.png` | App Icon 512×512 |
| `ic_app_ycm_1024.png` | App Icon 1024×1024 |
| `muse_wordmark_logo_gradient.png` | Muse Wordmark — 漸層版 |
| `muse_wordmark_logo_white.png` | Muse Wordmark — 純白版 |

### `icons/ui/`
全部為 SVG，命名前綴 `ic_`：

`ic_account` `ic_add` `ic_alert` `ic_arrow_left` `ic_arrow_right` `ic_camera` `ic_certified` `ic_check` `ic_chevron-left` `ic_chevron-right` `ic_circle` `ic_circle_check` `ic_circle_radio` `ic_clock` `ic_close` `ic_compass_OL` `ic_credit` `ic_crown` `ic_delete` `ic_dislike_off` `ic_dislike_on` `ic_download` `ic_edit` `ic_expand` `ic_favorite_off` `ic_favorite_on` `ic_flash` `ic_hd` `ic_headphones` `ic_history_OL` `ic_home` `ic_info` `ic_language` `ic_lightbulb` `ic_like_off` `ic_like_on` `ic_link` `ic_log_out` `ic_media` `ic_more` `ic_notification` `ic_pause` `ic_play` `ic_publish` `ic_rectangle_hor` `ic_rectangle_ver` `ic_refresh` `ic_reload` `ic_script` `ic_send` `ic_settings` `ic_share` `ic_shrink` `ic_singing_mic` `ic_skip_back` `ic_skip_forward` `ic_song` `ic_song_ai` `ic_song_list` `ic_speaker_off` `ic_speaker_on` `ic_square` `ic_star` `ic_timer` `ic_unlimited` `ic_upload` `ic_video` `ic_video_ai`

### `images/album-art/`
`album_01.jpg` ～ `album_14.jpg`（14 張歌曲封面）

### `images/banner/`
`img_banner_newer.jpg`

### `images/character-photos/samples/`
`Sample_P1.jpg` ～ `Sample_P8.jpg`、`Sample_P9_multi.png`（9 張示範人臉）

### `images/storyboard/`
`storyboard_01.jpg`

### `songs/`
| 檔案 | 說明 |
|---|---|
| `Party Dance.mp3` | 示範用歌曲 1 |
| `Top Flow Production - Party.mp3` | 示範用歌曲 2 |

### `videos/mv-preview/`
| 檔案 | 說明 |
|---|---|
| `feature_intro_ai_mv_hybrid_480x640.mp4` | Feature Intro — Hybrid 風格 |
| `feature_intro_ai_mv_singing_480x640.mp4` | Feature Intro — Singing 風格 |
| `feature_intro_ai_mv_storytelling_480x640.mp4` | Feature Intro — Storytelling 風格 |

### `videos/sample-mvs/`
MV 風格卡片縮圖（JPG），`mv_01` ～ `mv_14`：

| 檔案 | 風格名稱 |
|---|---|
| `mv_01_cinematic_dark.jpg` | Cinematic Dark |
| `mv_02_late_night_stage.jpg` | Late Night Stage |
| `mv_03_neon_city.jpg` | Neon City |
| `mv_04_eletronic.jpg` | Electronic |
| `mv_05_anime_style.jpg` | Anime Style |
| `mv_06_cinematic_movie.jpg` | Cinematic Movie |
| `mv_07_nature_earth.jpg` | Nature & Earth |
| `mv_08_dramatic_scene.jpg` | Dramatic Scene |
| `mv_09_urban_performer.jpg` | Urban Performer |
| `mv_10_monochrome.jpg` | Monochrome |
| `mv_11_halo.jpg` | Halo |
| `mv_12_Splash.jpg` | Splash |
| `mv_13_Urban Fashion.jpg` | Urban Fashion |
| `mv_14_Vintage Car.jpg` | Vintage Car |

### `videos/storyboard-clips/`
`clip_1.jpg` ～ `clip_19.jpg`（19 張分鏡場景截圖）

---

## 命名規範

### Icons
| 用途 | 命名格式 | 範例 |
|---|---|---|
| App Icon | `ic_app_ycm_[size].png` | `ic_app_ycm_512.png` |
| UI 通用 | `ic_[name].svg` | `ic_arrow_left.svg` |

### Images
| 用途 | 命名格式 | 範例 |
|---|---|---|
| 封面 / 專輯圖 | `album_[nn].jpg` | `album_01.jpg` |
| 示範人臉 | `Sample_P[n].jpg` | `Sample_P1.jpg` |
| 分鏡縮圖 | `storyboard_[nn].jpg` | `storyboard_01.jpg` |

### Songs
| 用途 | 格式 |
|---|---|
| 示範歌曲 | `.mp3` |

### Videos
| 用途 | 命名格式 | 範例 |
|---|---|---|
| Feature Intro | `feature_intro_ai_mv_[style]_WxH.mp4` | `feature_intro_ai_mv_singing_480x640.mp4` |
| MV 風格縮圖 | `mv_[nn]_[style-name].jpg` | `mv_01_cinematic_dark.jpg` |
| 分鏡截圖 | `clip_[n].jpg` | `clip_1.jpg` |

---

## 支援格式
- **Images** → `.jpg` `.png` `.webp`
- **Videos** → `.mp4` (H.264, max 720p for prototype)；縮圖用 `.jpg`
- **Songs** → `.mp3`
- **Icons** → `.svg` 優先，`.png` 備用

---

## 使用方式
1. 將 Figma 匯出的資產放到對應資料夾
2. 告訴 Claude：「幫我把 `assets/images/album-art/` 裡的圖片替換進 prototype」
3. Claude 會自動更新 `muse-prototype-v2.html` 中對應的 placeholder
