import { t } from '../i18n.js'

const FIELDS = [
  ['tender_id', 'tenderId'],
  ['title', 'tenderTitle'],
  ['procuring_entity', 'procuringEntity'],
  ['bidder', 'bidder'],
  ['submission_deadline', 'submissionDeadline'],
]

function TenderDetails({ lang, tender }) {
  if (!tender) return null

  return (
    <section className="tender">
      <h2>{t(lang, 'tenderDetailsHeading')}</h2>
      <dl className="tender-grid">
        {FIELDS.map(([field, labelKey]) => (
          <div key={field} className="tender-item">
            <dt>{t(lang, labelKey)}</dt>
            <dd>{tender[field]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default TenderDetails
