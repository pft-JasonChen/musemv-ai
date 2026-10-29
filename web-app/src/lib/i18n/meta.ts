import type { Metadata } from "next";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

// Per-page SEO <title> + meta description for each locale.
// Source: YouCam Muse Web meta localization sheet (localizer-checked, 2026-10-29).
// English (enu) is the source of truth AND the fallback: a locale or page missing
// here (e.g. chs, which is not in the sheet yet) renders the English copy.

export type MetaPage =
  | "home"
  | "mvRoom"
  | "songCreate"
  | "exploreMvs"
  | "exploreSongs"
  | "faq";

type MetaEntry = { title: string; description: string };

const META: Partial<Record<Locale, Record<MetaPage, MetaEntry>>> = {
  enu: {
    home: {
      title: "YouCam Muse – AI Music Video & Song Generator",
      description: "Turn your ideas into original songs and music videos with AI. Pick a style, generate in minutes, and share your creations with YouCam Muse.",
    },
    mvRoom: {
      title: "AI Music Video Maker: Create Music Videos | YouCam Muse",
      description: "Create AI music videos online. Choose a template, add your music or an AI-generated song, and generate a shareable video in minutes.",
    },
    songCreate: {
      title: "AI Song Generator: Create Original Songs | YouCam Muse",
      description: "Generate original songs with AI. Describe your idea, choose a genre and mood, and get a full track you can turn into a music video.",
    },
    exploreMvs: {
      title: "Explore AI Music Videos | YouCam Muse",
      description: "Watch trending AI-generated music videos from the YouCam Muse community and get inspired to create your own.",
    },
    exploreSongs: {
      title: "Explore AI-Generated Songs | YouCam Muse",
      description: "Listen to top picks and newly released AI songs from the YouCam Muse community.",
    },
    faq: {
      title: "YouCam Muse FAQ: Plans, Credits, Music Videos & Songs",
      description: "Answers about creating Music Videos and Songs, publishing to the community, your account, and billing.",
    },
  },
  deu: {
    home: {
      title: "YouCam Muse – KI-Musikvideo- & Song-Generator",
      description: "Verwandle deine Ideen mit KI in eigene Songs und Musikvideos. Stil wählen, in Minuten erstellen und mit YouCam Muse teilen.",
    },
    mvRoom: {
      title: "KI-Musikvideo erstellen: Musikvideo-Maker | YouCam Muse",
      description: "Erstelle KI-Musikvideos online. Wähle eine Vorlage, füge deine Musik oder einen KI-Song hinzu und generiere in Minuten ein teilbares Video.",
    },
    songCreate: {
      title: "KI-Song-Generator: Eigene Songs erstellen | YouCam Muse",
      description: "Erstelle eigene Songs mit KI. Beschreibe deine Idee, wähle Genre und Stimmung und erhalte einen kompletten Track für dein Musikvideo.",
    },
    exploreMvs: {
      title: "KI-Musikvideos entdecken | YouCam Muse",
      description: "Sieh dir angesagte KI-Musikvideos der YouCam-Muse-Community an und lass dich für deine eigenen Videos inspirieren.",
    },
    exploreSongs: {
      title: "KI-generierte Songs entdecken | YouCam Muse",
      description: "Höre Top-Auswahl und neu veröffentlichte KI-Songs aus der YouCam-Muse-Community.",
    },
    faq: {
      title: "YouCam Muse FAQ: Tarife, Credits, Musikvideos & Songs",
      description: "Antworten zum Erstellen von Musikvideos und Songs, Veröffentlichen in der Community, zu deinem Konto und zur Abrechnung.",
    },
  },
  esp: {
    home: {
      title: "YouCam Muse: Crear canciones con IA y videos musicales",
      description: "Crea canciones con IA y videos musicales originales. Escribe tus letras, genera música y crea videoclips para compartir con YouCam Muse.",
    },
    mvRoom: {
      title: "Crear videos musicales con IA | YouCam Muse",
      description: "Crea videos musicales con IA online. Elige una plantilla, añade música o una canción generada con IA y crea un video para compartir.",
    },
    songCreate: {
      title: "Generador de canciones con IA | YouCam Muse",
      description: "Crea canciones con IA a partir de tus ideas. Escribe letras, elige el género y el estado de ánimo, y genera música original en minutos.",
    },
    exploreMvs: {
      title: "Explorar videos musicales con IA | YouCam Muse",
      description: "Descubre videos musicales con IA de la comunidad de YouCam Muse. Inspírate con otras creaciones y crea tus propios videoclips.",
    },
    exploreSongs: {
      title: "Explorar canciones creadas con IA | YouCam Muse",
      description: "Escucha canciones creadas con IA y descubre los temas destacados de la comunidad de YouCam Muse. Inspírate para crear tu propia música.",
    },
    faq: {
      title: "FAQ de YouCam Muse: planes, créditos, videos y canciones",
      description: "Resuelve tus dudas sobre cómo crear canciones y videos musicales con IA, los planes, los créditos, la publicación de contenido y la facturación",
    },
  },
  fra: {
    home: {
      title: "YouCam Muse : Clips Musicaux et Chansons IA",
      description: "Transformez vos idées en chansons et clips musicaux grâce à l'IA. Choisissez un style, générez rapidement et partagez vos créations sur YouCam Muse.",
    },
    mvRoom: {
      title: "Créateur de clips musicaux IA | YouCam Muse",
      description: "Créez des clips musicaux avec l'IA. Choisissez un modèle, ajoutez votre musique ou une chanson IA et générez une vidéo à partager en quelques minutes.",
    },
    songCreate: {
      title: "Générateur de chansons IA | YouCam Muse",
      description: "Générez des chansons originales avec l'IA. Décrivez votre idée, choisissez un genre et une ambiance, et obtenez un titre complet à transformer en clip.",
    },
    exploreMvs: {
      title: "Découvrir des clips musicaux IA | YouCam Muse",
      description: "Regardez les clips musicaux IA tendance de la communauté YouCam Muse et inspirez-vous pour créer les vôtres.",
    },
    exploreSongs: {
      title: "Découvrir des chansons créées par IA | YouCam Muse",
      description: "Écoutez les sélections du moment et les dernières chansons IA de la communauté YouCam Muse.",
    },
    faq: {
      title: "FAQ YouCam Muse : forfaits, crédits, clips et chansons",
      description: "Réponses sur la création de clips musicaux et de chansons, la publication dans la communauté, votre compte et la facturation.",
    },
  },
  hi: {
    home: {
      title: "YouCam Muse – AI म्यूज़िक वीडियो और गाना जनरेटर",
      description: "AI की मदद से अपने आइडिया को ओरिजिनल गानों और म्यूज़िक वीडियो में बदलें। स्टाइल चुनें, मिनटों में बनाएँ और YouCam Muse पर शेयर करें।",
    },
    mvRoom: {
      title: "AI म्यूज़िक वीडियो मेकर | YouCam Muse",
      description: "ऑनलाइन AI म्यूज़िक वीडियो बनाएँ। टेम्पलेट चुनें, अपना म्यूज़िक या AI गाना जोड़ें और मिनटों में शेयर करने लायक वीडियो पाएँ।",
    },
    songCreate: {
      title: "AI गाना जनरेटर: ओरिजिनल गाने बनाएँ | YouCam Muse",
      description: "AI से ओरिजिनल गाने बनाएँ। अपना आइडिया बताएँ, जॉनर और मूड चुनें और पूरा ट्रैक पाएँ, जिसे आप म्यूज़िक वीडियो में बदल सकते हैं।",
    },
    exploreMvs: {
      title: "AI म्यूज़िक वीडियो देखें | YouCam Muse",
      description: "YouCam Muse कम्युनिटी के ट्रेंडिंग AI म्यूज़िक वीडियो देखें और अपना वीडियो बनाने की प्रेरणा पाएँ।",
    },
    exploreSongs: {
      title: "AI से बने गाने सुनें | YouCam Muse",
      description: "YouCam Muse कम्युनिटी के टॉप पिक्स और नए रिलीज़ हुए AI गाने सुनें।",
    },
    faq: {
      title: "YouCam Muse FAQ: प्लान, क्रेडिट, म्यूज़िक वीडियो और गाने",
      description: "म्यूज़िक वीडियो और गाने बनाने, कम्युनिटी में पब्लिश करने, आपके अकाउंट और बिलिंग से जुड़े सवालों के जवाब।",
    },
  },
  id: {
    home: {
      title: "YouCam Muse – Generator Video Musik & Lagu AI",
      description: "Ubah idemu jadi lagu dan video musik orisinal dengan AI. Pilih gaya, buat dalam hitungan menit, dan bagikan karyamu di YouCam Muse.",
    },
    mvRoom: {
      title: "Pembuat Video Musik AI Online | YouCam Muse",
      description: "Buat video musik AI secara online. Pilih template, tambahkan musikmu atau lagu AI, lalu hasilkan video siap dibagikan dalam hitungan menit.",
    },
    songCreate: {
      title: "Generator Lagu AI: Buat Lagu Orisinal | YouCam Muse",
      description: "Buat lagu orisinal dengan AI. Jelaskan idemu, pilih genre dan suasana, lalu dapatkan lagu utuh yang bisa dijadikan video musik.",
    },
    exploreMvs: {
      title: "Jelajahi Video Musik AI | YouCam Muse",
      description: "Tonton video musik AI yang sedang tren dari komunitas YouCam Muse dan dapatkan inspirasi untuk membuat karyamu sendiri.",
    },
    exploreSongs: {
      title: "Jelajahi Lagu Buatan AI | YouCam Muse",
      description: "Dengarkan pilihan teratas dan lagu AI terbaru dari komunitas YouCam Muse.",
    },
    faq: {
      title: "FAQ YouCam Muse: Paket, Kredit, Video Musik & Lagu",
      description: "Jawaban seputar membuat video musik dan lagu, memublikasikan ke komunitas, akunmu, dan penagihan.",
    },
  },
  jpn: {
    home: {
      title: "YouCam Muse｜AI音楽・MV・作曲ジェネレーター",
      description: "AIでアイデアをオリジナル曲やミュージックビデオに。スタイルを選んで数分で作成し、YouCam Museでシェアしよう。",
    },
    mvRoom: {
      title: "AIミュージックビデオメーカー｜YouCam Muse",
      description: "AIでミュージックビデオをオンライン作成。テンプレートを選び、手持ちの音楽やAI生成曲を追加すれば、シェアできる動画が数分で完成します。",
    },
    songCreate: {
      title: "AI作曲ジェネレーター｜オリジナル曲作成｜YouCam Muse",
      description: "AIでオリジナル曲を生成。アイデアを入力し、ジャンルとムードを選ぶだけで、ミュージックビデオにも使えるフルトラックが完成します。",
    },
    exploreMvs: {
      title: "AIミュージックビデオを探す｜YouCam Muse",
      description: "YouCam Museコミュニティで人気のAIミュージックビデオをチェックして、あなたの作品づくりのヒントに。",
    },
    exploreSongs: {
      title: "AI生成の楽曲を探す｜YouCam Muse",
      description: "YouCam Museコミュニティのおすすめ曲や最新のAI楽曲を聴いてみよう。",
    },
    faq: {
      title: "YouCam Muse よくある質問｜プラン・クレジット・楽曲",
      description: "ミュージックビデオや楽曲の作成、コミュニティへの公開、アカウント、お支払いに関するご案内です。",
    },
  },
  kor: {
    home: {
      title: "YouCam Muse – AI 뮤직비디오 & 노래 생성기",
      description: "AI로 아이디어를 오리지널 노래와 뮤직비디오로 만들어 보세요. 스타일을 고르면 몇 분 만에 완성되고, YouCam Muse에서 바로 공유할 수 있어요.",
    },
    mvRoom: {
      title: "AI 뮤직비디오 메이커 | YouCam Muse",
      description: "온라인에서 AI 뮤직비디오를 만들어 보세요. 템플릿을 고르고 내 음악이나 AI 노래를 추가하면 공유할 수 있는 영상이 몇 분 만에 완성돼요.",
    },
    songCreate: {
      title: "AI 노래 생성기: 오리지널 곡 만들기 | YouCam Muse",
      description: "AI로 오리지널 노래를 만들어 보세요. 아이디어를 입력하고 장르와 분위기를 고르면 뮤직비디오로 만들 수 있는 완성곡이 나와요.",
    },
    exploreMvs: {
      title: "AI 뮤직비디오 둘러보기 | YouCam Muse",
      description: "YouCam Muse 커뮤니티에서 인기 있는 AI 뮤직비디오를 감상하고 나만의 영상을 만들 영감을 얻어 보세요.",
    },
    exploreSongs: {
      title: "AI로 만든 노래 둘러보기 | YouCam Muse",
      description: "YouCam Muse 커뮤니티의 추천곡과 새로 공개된 AI 노래를 들어 보세요.",
    },
    faq: {
      title: "YouCam Muse FAQ: 요금제, 크레딧, 뮤직비디오 & 노래",
      description: "뮤직비디오와 노래 만들기, 커뮤니티 게시, 계정 및 결제에 대한 궁금증을 해결해 드려요.",
    },
  },
  ptg: {
    home: {
      title: "Gerador de músicas e videoclipes com IA | YouCam Muse",
      description: "Crie músicas e videoclipes com IA no YouCam Muse. Transforme suas ideias em composições originais, escolha um estilo e compartilhe suas criações.",
    },
    mvRoom: {
      title: "Criador de videoclipes com IA online | YouCam Muse",
      description: "Crie videoclipes com IA online. Escolha um modelo, adicione sua música ou uma canção criada com IA e transforme o áudio em vídeo em minutos.",
    },
    songCreate: {
      title: "Gerador de Músicas com IA | YouCam Muse",
      description: "Crie músicas originais com IA. Descreva sua ideia, escolha o gênero musical e a atmosfera e transforme a música completa em um videoclipe.",
    },
    exploreMvs: {
      title: "Explore Videoclipes Feitos com IA | YouCam Muse",
      description: "Assista aos videoclipes com IA em alta na comunidade YouCam Muse e inspire-se para criar os seus.",
    },
    exploreSongs: {
      title: "Explore Músicas Criadas com IA | YouCam Muse",
      description: "Ouça as músicas em destaque e os lançamentos mais recentes feitos com IA na comunidade YouCam Muse.",
    },
    faq: {
      title: "YouCam Muse: dúvidas sobre planos, créditos e músicas",
      description: "Tire suas dúvidas sobre como criar músicas e videoclipes com IA, publicar na comunidade YouCam Muse, gerenciar sua conta e consultar cobranças.",
    },
  },
  cht: {
    home: {
      title: "玩美 Muse｜AI 音樂影片與歌曲生成器",
      description: "用 AI 把靈感變成原創歌曲與音樂影片。選擇風格、幾分鐘內完成，並在玩美 Muse (YouCam Muse) 分享你的作品。",
    },
    mvRoom: {
      title: "AI 音樂影片製作｜線上生成 MV｜玩美 Muse",
      description: "線上製作 AI 音樂影片。選擇範本、加入你的音樂或 AI 歌曲，幾分鐘就能生成可分享的影片。",
    },
    songCreate: {
      title: "AI 歌曲生成器｜創作原創歌曲｜玩美 Muse",
      description: "用 AI 生成原創歌曲。輸入你的想法、選擇曲風與情緒，即可作曲獲得完整歌曲，還能轉成音樂影片。",
    },
    exploreMvs: {
      title: "探索 AI 音樂影片｜玩美 Muse",
      description: "欣賞玩美 Muse 社群中熱門的 AI 音樂影片，為你的創作找靈感。",
    },
    exploreSongs: {
      title: "探索 AI 生成歌曲｜玩美 Muse",
      description: "聆聽玩美 Muse 社群的精選歌曲與最新發行的 AI 歌曲。",
    },
    faq: {
      title: "玩美 Muse 常見問題｜方案、點數、音樂影片與歌曲",
      description: "解答音樂影片與歌曲製作、發布到社群、帳號與帳務等常見問題。",
    },
  },
};

/** Metadata for a page in a locale; falls back to English. */
export function pageMetadata(locale: Locale, page: MetaPage): Metadata {
  const entry = META[locale]?.[page] ?? META[DEFAULT_LOCALE]![page];
  return {
    title: entry.title,
    description: entry.description,
    openGraph: { title: entry.title, description: entry.description },
  };
}
