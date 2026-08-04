import Card from '../../components/Card/Card'

function CardShowcase() {
  return (
    <section className="components-page__component">
      <h2 className="components-page__component-name type-title-l">Card</h2>
      <p className="components-page__hint type-caption-m">
        封面圖片尚未提供，目前用純色佔位；等您把圖丟進 src/assets/covers/ 之後就能換成真實素材。頭像預設顯示通用圖示，只有使用者有上傳頭像時才會換成照片。
      </p>

      <div className="components-page__size-group">
        <h3 className="components-page__size-title type-title-xs">Video — 3:4</h3>
        <div className="components-page__card-grid">
          <Card type="Video" ratio="3:4" title="Cinematic Dark" subtitle="Storytelling | 2-3 min" badge="NEW" />
          <Card
            type="Video"
            ratio="3:4"
            community
            title="Cinematic Dark"
            username="Username"
            likes={38}
            badge="HOT"
          />
          <Card type="Video" ratio="3:4" community title="Cinematic Dark" username="Username" likes={38} />
        </div>
      </div>

      <div className="components-page__size-group">
        <h3 className="components-page__size-title type-title-xs">Video — 4:3</h3>
        <div className="components-page__card-grid">
          <Card type="Video" ratio="4:3" community title="Cinematic Dark" username="Username" likes={38} />
        </div>
      </div>

      <div className="components-page__size-group">
        <h3 className="components-page__size-title type-title-xs">Song — 1:1</h3>
        <div className="components-page__card-grid">
          <Card type="Song" title="Pop Anthem" subtitle="3 min | Upbeat" badge="HOT" />
          <Card type="Song" community title="Pop Anthem" username="Username" likes={38} />
        </div>
      </div>
    </section>
  )
}

export default CardShowcase
