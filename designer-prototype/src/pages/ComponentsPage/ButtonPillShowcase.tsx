import Button from '../../components/Button/Button'
import type { ButtonSize, ButtonVariant } from '../../components/Button/Button'
import icDownload from '../../assets/icons/ic_download.svg'
import icEdit from '../../assets/icons/ic_edit.svg'
import icCredit from '../../assets/icons/ic_credit.svg'

const VARIANTS_BY_SIZE: Record<ButtonSize, ButtonVariant[]> = {
  Large: ['Primary', 'PrimaryPayg', 'Secondary', 'Tertiary', 'Ghost'],
  Medium: ['Primary', 'Secondary', 'Tertiary', 'Ghost'],
  Small: ['Primary', 'Secondary', 'Tertiary', 'Ghost'],
}

const VARIANT_LABEL: Record<ButtonVariant, string> = {
  Primary: 'Primary',
  PrimaryPayg: 'Primary - PAYG',
  Secondary: 'Secondary',
  Tertiary: 'Tertiary',
  Ghost: 'Ghost',
}

function getLabel(size: ButtonSize, variant: ButtonVariant) {
  if (variant === 'PrimaryPayg') return 'Create'
  if (size === 'Medium') return 'Label Text'
  if (size === 'Small') return 'Label text'

  switch (variant) {
    case 'Secondary':
      return 'Done'
    case 'Tertiary':
      return 'Cancel'
    case 'Ghost':
      return 'Skip'
    default:
      return 'Create MV'
  }
}

// Matches the icons actually shown in the Figma Button/Pill component set:
// Medium Primary/Secondary use the download icon, Medium Tertiary/Ghost use the edit icon.
function getLeadingIcon(size: ButtonSize, variant: ButtonVariant) {
  if (size !== 'Medium') return undefined
  if (variant === 'Primary' || variant === 'Secondary') return icDownload
  if (variant === 'Tertiary' || variant === 'Ghost') return icEdit
  return undefined
}

function ButtonPillShowcase() {
  const sizes: ButtonSize[] = ['Large', 'Medium', 'Small']

  return (
    <section className="components-page__component">
      <h2 className="components-page__component-name type-title-l">Button / Pill</h2>

      {sizes.map((size) => (
        <div key={size} className="components-page__size-group">
          <h3 className="components-page__size-title type-title-xs">{size}</h3>

          <div className="components-page__rows">
            {VARIANTS_BY_SIZE[size].map((variant) => (
              <div key={variant} className="components-page__row">
                <span className="components-page__variant-label type-caption-m">
                  {VARIANT_LABEL[variant]}
                </span>

                <div className="components-page__cell">
                  <Button
                    size={size}
                    variant={variant}
                    leadingIcon={getLeadingIcon(size, variant)}
                    creditsIcon={variant === 'PrimaryPayg' ? icCredit : undefined}
                    credits={variant === 'PrimaryPayg' ? 4 : undefined}
                  >
                    {getLabel(size, variant)}
                  </Button>
                </div>

                <div className="components-page__cell">
                  <Button
                    size={size}
                    variant={variant}
                    disabled
                    leadingIcon={getLeadingIcon(size, variant)}
                    creditsIcon={variant === 'PrimaryPayg' ? icCredit : undefined}
                    credits={variant === 'PrimaryPayg' ? 4 : undefined}
                  >
                    {getLabel(size, variant)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

export default ButtonPillShowcase
