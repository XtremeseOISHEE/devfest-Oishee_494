import { useState } from 'react'
import { t } from '../i18n.js'

function FileUpload({ lang, busy, onUpload }) {
  const [dragging, setDragging] = useState(false)

  const handleInput = (e) => {
    const list = Array.from(e.target.files ?? [])
    if (list.length > 0) onUpload(list)
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const list = Array.from(e.dataTransfer?.files ?? [])
    if (list.length > 0) onUpload(list)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!dragging) setDragging(true)
  }

  return (
    <div
      className={dragging ? 'dropzone dropzone-active' : 'dropzone'}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <p>{t(lang, 'dropPdfs')}</p>
      <label className="button">
        {t(lang, 'choosePdfs')}
        <input
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleInput}
          hidden
        />
      </label>
      {busy && <p className="muted">{t(lang, 'readingFiles')}</p>}
    </div>
  )
}

export default FileUpload
