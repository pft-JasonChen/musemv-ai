import Badge, { type BadgeStatus } from '../../components/Badge/Badge'

const STATUSES: BadgeStatus[] = ['Purple', 'Gold', 'Done', 'Failed', 'Processing', 'New', 'Hot', 'Sale', 'Popular']

function BadgeShowcase() {
  return (
    <section>
      <h2 className="components-page__component-name type-title-l">Badge</h2>
      <p className="components-page__hint type-body-s">Figma Badge status and promotional variants.</p>
      <div className="components-page__row components-page__row--badges">
        {STATUSES.map((status) => <Badge key={status} status={status} />)}
      </div>
    </section>
  )
}

export default BadgeShowcase
