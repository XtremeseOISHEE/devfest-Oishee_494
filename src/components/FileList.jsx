import { t } from '../i18n.js'

function FileList({ lang, files, onRemove }) {
  if (files.length === 0) {
    return <p className="empty">{t(lang, 'noFiles')}</p>
  }

  const number = new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
    maximumFractionDigits: 1,
  })

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return t(lang, 'sizeKb', { value: number.format(bytes / 1024) })
    return t(lang, 'sizeMb', { value: number.format(bytes / (1024 * 1024)) })
  }

  // A file is a duplicate when an earlier file in the list has the same hash.
  const firstByHash = new Map()
  for (const f of files) {
    if (!firstByHash.has(f.hash)) firstByHash.set(f.hash, f)
  }

  return (
    <ul className="file-list">
      {files.map((f) => {
        const original = firstByHash.get(f.hash)
        const isDuplicate = original.id !== f.id
        return (
          <li key={f.id} className="file-item">
            <div className="file-info">
              <span className="file-name">{f.name}</span>
              <span className="muted">
                {t(lang, 'pageCount', { count: number.format(f.pageCount) })} · {formatSize(f.size)}
              </span>
              {isDuplicate && (
                <span className="file-duplicate">
                  <span className="tag tag-duplicate">{t(lang, 'duplicate')}</span>{' '}
                  {t(lang, 'duplicateOf', { name: original.name })}
                </span>
              )}
            </div>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => onRemove(f.id)}
            >
              {t(lang, 'remove')}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default FileList
