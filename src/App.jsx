import { useState } from 'react'
import Header from './components/Header.jsx'
import RequirementsList from './components/RequirementsList.jsx'
import TenderDetails from './components/TenderDetails.jsx'
import FileUpload from './components/FileUpload.jsx'
import FileList from './components/FileList.jsx'
import { parseRequirements } from './requirements.js'
import StatusSummary from './components/StatusSummary.jsx'
import { readPdfFile } from './pdfReader.js'
import { computeAllStatuses } from './status.js'
import { t } from './i18n.js'

function omitKeys(obj, keys) {
  const next = { ...obj }
  for (const k of keys) delete next[k]
  return next
}

function App() {
  const [lang, setLang] = useState('bn')
  const [tender, setTender] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [files, setFiles] = useState([])
  const [matches, setMatches] = useState({})
  const [expiryDates, setExpiryDates] = useState({})
  const [loadErrors, setLoadErrors] = useState([])
  const [uploadErrors, setUploadErrors] = useState([])
  const [uploading, setUploading] = useState(false)

  const handleLoadRequirements = async (file) => {
    const result = parseRequirements(await file.text())
    if (!result.ok) {
      setLoadErrors(result.errors)
      return
    }
    setLoadErrors([])
    setTender(result.tender)
    setRequirements(result.requirements)
    setMatches({})
    setExpiryDates({})
  }

  const handleUpload = async (list) => {
    setUploading(true)
    const added = []
    const errors = []
    for (const file of list) {
      try {
        const result = await readPdfFile(file)
        if (result.ok) added.push(result.record)
        else errors.push(result.error)
      } catch {
        errors.push({ key: 'errPdfUnreadable', params: { name: file.name } })
      }
    }
    setFiles((prev) => [...prev, ...added])
    setUploadErrors(errors)
    setUploading(false)
  }

  const handleRemoveFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    const freed = Object.keys(matches).filter((reqId) => matches[reqId] === id)
    if (freed.length > 0) {
      setMatches((prev) => omitKeys(prev, freed))
      setExpiryDates((prev) => omitKeys(prev, freed))
    }
  }

  // A new or cleared match drops the old expiry date, since it belonged to the old file.
  const handleMatch = (reqId, fileId) => {
    if ((matches[reqId] ?? null) === fileId) return
    setMatches((prev) => (fileId ? { ...prev, [reqId]: fileId } : omitKeys(prev, [reqId])))
    setExpiryDates((prev) => omitKeys(prev, [reqId]))
  }

  const handleExpiryChange = (reqId, date) => {
    setExpiryDates((prev) => (date ? { ...prev, [reqId]: date } : omitKeys(prev, [reqId])))
  }

  const deadline = tender?.submission_deadline ?? ''
  const statuses = computeAllStatuses(requirements, files, matches, expiryDates, deadline)

  const toggleLang = () => setLang((l) => (l === 'bn' ? 'en' : 'bn'))

  return (
    <div className="app" lang={lang}>
      <Header
        lang={lang}
        onToggleLang={toggleLang}
        onLoadRequirements={handleLoadRequirements}
      />
      <main className="main">
        <div className="column">
          {loadErrors.length > 0 && (
            <div className="alert" role="alert">
              <strong>{t(lang, 'errorHeading')}</strong>
              <ul>
                {loadErrors.map((err, i) => (
                  <li key={i}>{t(lang, err.key, err.params)}</li>
                ))}
              </ul>
            </div>
          )}
          <TenderDetails lang={lang} tender={tender} />
          <StatusSummary
            lang={lang}
            requirements={requirements}
            statuses={statuses}
            expiryDates={expiryDates}
            deadline={deadline}
          />
          <RequirementsList
            lang={lang}
            requirements={requirements}
            files={files}
            matches={matches}
            expiryDates={expiryDates}
            statuses={statuses}
            onMatch={handleMatch}
            onExpiryChange={handleExpiryChange}
          />
        </div>
        <aside className="column">
          <section className="files">
            <h2>{t(lang, 'filesHeading')}</h2>
            <FileUpload lang={lang} busy={uploading} onUpload={handleUpload} />
            {uploadErrors.length > 0 && (
              <div className="alert" role="alert">
                <strong>{t(lang, 'uploadErrorHeading')}</strong>
                <ul>
                  {uploadErrors.map((err, i) => (
                    <li key={i}>{t(lang, err.key, err.params)}</li>
                  ))}
                </ul>
              </div>
            )}
            <FileList lang={lang} files={files} onRemove={handleRemoveFile} />
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App
