import IconButton from '../../components/IconButton/IconButton'
import type { IconButtonSize, IconButtonVariant } from '../../components/IconButton/IconButton'
import icAdd from '../../assets/icons/ic_add.svg'

const SIZES: IconButtonSize[] = ['Large', 'Medium', 'Small', 'XSmall']
const VARIANTS: IconButtonVariant[] = ['Primary', 'Secondary', 'Tertiary', 'Ghost']

function IconButtonShowcase() {
  return (
    <section className="components-page__component">
      <h2 className="components-page__component-name type-title-l">Icon Button</h2>
      <p className="components-page__hint type-caption-m">Hover 滑鼠到 Active 按鈕上可即時看到 Hover 效果。</p>

      {SIZES.map((size) => (
        <div key={size} className="components-page__size-group">
          <h3 className="components-page__size-title type-title-xs">{size}</h3>

          <div className="components-page__rows">
            {VARIANTS.map((variant) => (
              <div key={variant} className="components-page__row">
                <span className="components-page__variant-label type-caption-m">{variant}</span>

                <div className="components-page__cell">
                  <IconButton size={size} variant={variant} icon={icAdd} label={`${variant} ${size} add`} />
                </div>

                <div className="components-page__cell">
                  <IconButton
                    size={size}
                    variant={variant}
                    icon={icAdd}
                    label={`${variant} ${size} add disabled`}
                    disabled
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

export default IconButtonShowcase
