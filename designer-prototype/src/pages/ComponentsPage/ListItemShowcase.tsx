import ListItem from '../../components/ListItem/ListItem'
import { SONGS } from '../../data/songs'

const SAMPLE_SONGS = SONGS.slice(0, 2)

function ListItemShowcase() {
  return (
    <section className="components-page__component">
      <h2 className="components-page__component-name type-title-l">List Item</h2>
      <p className="components-page__hint type-caption-m">
        Figma "List/List Item/dt" (node 1270:21039). Community 的版面會依照這個元件實際渲染出來的寬度自動切換（用 CSS
        container query，不是看螢幕寬度）——同一個元件放進較窄的側欄和較寬的清單，即使在同一個螢幕尺寸下也會長得不一樣，這裡故意用兩種容器寬度
        來示範差異。
      </p>

      <div className="components-page__size-group">
        <h3 className="components-page__size-title type-title-xs">Song — cta=off（點擊查看，My Creations 用這個）</h3>
        <div className="components-page__list-demo">
          {SAMPLE_SONGS.map((song) => (
            <ListItem key={song.id} variant="song" title={song.title} subtitle="AI Song" coverImage={song.cover} />
          ))}
        </div>
      </div>

      <div className="components-page__size-group">
        <h3 className="components-page__size-title type-title-xs">Song — cta=on（"Create" 按鈕取代箭頭）</h3>
        <div className="components-page__list-demo">
          {SAMPLE_SONGS.map((song) => (
            <ListItem key={song.id} variant="song" cta title={song.title} subtitle="AI Song" coverImage={song.cover} />
          ))}
        </div>
      </div>

      <div className="components-page__size-group">
        <h3 className="components-page__size-title type-title-xs">
          Community — 窄容器（&lt;560px，例如 432px 側欄）：標題／使用者／數據 全部堆疊
        </h3>
        <div className="components-page__list-demo components-page__list-demo--narrow">
          {SAMPLE_SONGS.map((song, index) => (
            <ListItem
              key={song.id}
              title={song.title}
              coverImage={song.cover}
              username="Username"
              plays={108}
              likes={38}
              shares={15}
              cta={index === 1}
            />
          ))}
        </div>
      </div>

      <div className="components-page__size-group">
        <h3 className="components-page__size-title type-title-xs">
          Community — 寬容器（&ge;560px）：標題＋使用者 一組，數據獨立成一欄
        </h3>
        <div className="components-page__list-demo">
          {SAMPLE_SONGS.map((song, index) => (
            <ListItem
              key={song.id}
              title={song.title}
              coverImage={song.cover}
              username="Username"
              plays={108}
              likes={38}
              shares={15}
              cta={index === 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ListItemShowcase
