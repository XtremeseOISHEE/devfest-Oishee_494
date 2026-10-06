import { t } from '../i18n.js'

function RequirementsList({ lang, requirements }) {
  if (requirements.length === 0) {
    return <p className="empty">{t(lang, 'noRequirements')}</p>
  }

  const sorted = [...requirements].sort((a, b) => a.order - b.order)

  return (
    <section className="requirements">
      <div className="requirements-head">
        <h2>{t(lang, 'requirementsHeading')}</h2>
        <span className="muted">{t(lang, 'loadedCount', { count: requirements.length })}</span>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>{t(lang, 'colOrder')}</th>
            <th>{t(lang, 'colDocument')}</th>
            <th>{t(lang, 'colType')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((req) => (
            <tr key={req.id}>
              <td>{req.order}</td>
              <td>{lang === 'bn' ? req.title_bn : req.title_en}</td>
              <td>
                <span className={req.mandatory ? 'tag tag-mandatory' : 'tag tag-optional'}>
                  {t(lang, req.mandatory ? 'mandatory' : 'optional')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default RequirementsList
