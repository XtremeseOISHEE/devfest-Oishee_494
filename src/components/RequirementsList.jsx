import { t } from '../i18n.js'
import { isBlocking, STATUS } from '../status.js'

function RequirementsList({
  lang,
  requirements,
  files,
  matches,
  expiryDates,
  statuses,
  onMatch,
  onExpiryChange,
}) {
  if (requirements.length === 0) {
    return <p className="empty">{t(lang, 'noRequirements')}</p>
  }

  const sorted = [...requirements].sort((a, b) => a.order - b.order)
  const titleOf = (req) => (lang === 'bn' ? req.title_bn : req.title_en)
  const reqById = new Map(requirements.map((r) => [r.id, r]))
  const fileById = new Map(files.map((f) => [f.id, f]))

  // Which requirement each file is matched to, and which requirements use each hash.
  const reqByFile = new Map()
  const reqsByHash = new Map()
  for (const [reqId, fileId] of Object.entries(matches)) {
    const file = fileById.get(fileId)
    if (!file) continue
    reqByFile.set(fileId, reqId)
    if (!reqsByHash.has(file.hash)) reqsByHash.set(file.hash, [])
    reqsByHash.get(file.hash).push({ reqId, fileId })
  }

  let anyDisabled = false

  const optionsFor = (req) => {
    const options = []
    for (const f of files) {
      const usedBy = reqByFile.get(f.id)
      if (usedBy && usedBy !== req.id) continue
      const dupUse = (reqsByHash.get(f.hash) ?? []).find(
        (u) => u.reqId !== req.id && u.fileId !== f.id,
      )
      if (dupUse) {
        anyDisabled = true
        options.push(
          <option key={f.id} value={f.id} disabled>
            {t(lang, 'duplicateMatchedElsewhere', {
              name: f.name,
              requirement: titleOf(reqById.get(dupUse.reqId)),
            })}
          </option>,
        )
      } else {
        options.push(
          <option key={f.id} value={f.id}>
            {f.name}
          </option>,
        )
      }
    }
    return options
  }

  const optionsByReq = new Map(sorted.map((req) => [req.id, optionsFor(req)]))

  return (
    <section className="requirements">
      <div className="requirements-head">
        <h2>{t(lang, 'requirementsHeading')}</h2>
        <span className="muted">{t(lang, 'loadedCount', { count: requirements.length })}</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t(lang, 'colOrder')}</th>
              <th>{t(lang, 'colDocument')}</th>
              <th>{t(lang, 'colFile')}</th>
              <th>{t(lang, 'colExpiry')}</th>
              <th>{t(lang, 'colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((req) => {
              const matchedId = fileById.has(matches[req.id]) ? matches[req.id] : ''
              const status = statuses[req.id]
              return (
                <tr key={req.id}>
                  <td>{req.order}</td>
                  <td>
                    <div className="doc-title">{titleOf(req)}</div>
                    <span className={req.mandatory ? 'tag tag-mandatory' : 'tag tag-optional'}>
                      {t(lang, req.mandatory ? 'mandatory' : 'optional')}
                    </span>
                  </td>
                  <td>
                    {files.length === 0 ? (
                      <span className="muted">{t(lang, 'noFilesToMatch')}</span>
                    ) : (
                      <select
                        className="select"
                        value={matchedId}
                        aria-label={`${t(lang, 'colFile')}: ${titleOf(req)}`}
                        onChange={(e) => onMatch(req.id, e.target.value || null)}
                      >
                        <option value="">{t(lang, 'noMatch')}</option>
                        {optionsByReq.get(req.id)}
                      </select>
                    )}
                  </td>
                  <td>
                    {req.has_expiry && matchedId ? (
                      <input
                        type="date"
                        className="date-input"
                        value={expiryDates[req.id] ?? ''}
                        aria-label={t(lang, 'expiryLabel', { title: titleOf(req) })}
                        onChange={(e) => onExpiryChange(req.id, e.target.value)}
                      />
                    ) : (
                      <span className="muted">{t(lang, 'expiryNotNeeded')}</span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${statusClass(status)}`}>
                      {t(lang, `status${status}`)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {anyDisabled && <p className="muted hint">{t(lang, 'duplicateHint')}</p>}
    </section>
  )
}

function statusClass(status) {
  if (isBlocking(status)) return 'status-blocking'
  if (status === STATUS.NOT_PROVIDED) return 'status-neutral'
  return 'status-ok'
}

export default RequirementsList
