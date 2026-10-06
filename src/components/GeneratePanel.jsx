import { t } from '../i18n.js'
import { isBlocking } from '../status.js'

function GeneratePanel({ lang, requirements, statuses, generating, result, onGenerate }) {
  if (requirements.length === 0) return null

  const blocking = [...requirements]
    .sort((a, b) => a.order - b.order)
    .filter((r) => isBlocking(statuses[r.id]))
  const disabled = blocking.length > 0 || generating

  return (
    <section className="generate">
      <button type="button" className="button" disabled={disabled} onClick={onGenerate}>
        {t(lang, 'generateButton')}
      </button>
      {generating && (
        <span className="progress" role="status">
          <span className="spinner" aria-hidden="true" />
          {t(lang, 'generating')}
        </span>
      )}
      {blocking.length > 0 && (
        <p className="generate-blocked">
          {t(lang, 'generateBlocked', {
            list: blocking
              .map((r) => (lang === 'bn' ? r.title_bn : r.title_en))
              .join(t(lang, 'listSeparator')),
          })}
        </p>
      )}
      {result?.error && (
        <div className="alert" role="alert">
          {t(lang, result.error.key, result.error.params)}
        </div>
      )}
      {result?.done && <p className="generate-done">{t(lang, 'generateDone', { name: result.done })}</p>}
    </section>
  )
}

export default GeneratePanel
