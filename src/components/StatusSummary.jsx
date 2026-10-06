import { t } from '../i18n.js'
import { isBlocking, STATUS } from '../status.js'

function StatusSummary({ lang, requirements, statuses, expiryDates, deadline }) {
  if (requirements.length === 0) return null

  const sorted = [...requirements].sort((a, b) => a.order - b.order)
  const okCount = sorted.filter((r) => statuses[r.id] === STATUS.OK).length
  const blocking = sorted.filter((r) => isBlocking(statuses[r.id]))

  const reasonFor = (req) =>
    t(lang, `reason${statuses[req.id]}`, { date: expiryDates[req.id], deadline })

  return (
    <div className={blocking.length > 0 ? 'summary summary-blocking' : 'summary summary-clear'}>
      <div className="summary-counts">
        <span className="status status-ok">{t(lang, 'summaryOk', { count: okCount })}</span>
        <span className={blocking.length > 0 ? 'status status-blocking' : 'status status-neutral'}>
          {t(lang, 'summaryBlocking', { count: blocking.length })}
        </span>
      </div>
      {blocking.length === 0 ? (
        <p>{t(lang, 'summaryAllClear')}</p>
      ) : (
        <div>
          <strong>{t(lang, 'summaryBlockingHeading')}</strong>
          <ul>
            {blocking.map((req) => (
              <li key={req.id}>
                {t(lang, 'summaryBlockingItem', {
                  title: lang === 'bn' ? req.title_bn : req.title_en,
                  reason: reasonFor(req),
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default StatusSummary
