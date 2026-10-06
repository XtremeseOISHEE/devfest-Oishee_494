import { useState } from 'react'
import Header from './components/Header.jsx'
import RequirementsList from './components/RequirementsList.jsx'
import TenderDetails from './components/TenderDetails.jsx'
import FileUpload from './components/FileUpload.jsx'
import FileList from './components/FileList.jsx'
import { parseRequirements } from './requirements.js'
import { readPdfFile } from './pdfReader.js'
import { t } from './i18n.js'

function App() {
  const [lang, setLang] = useState('bn')
  const [tender, setTender] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [files, setFiles] = useState([])
  /* eslint-disable no-unused-vars -- read by the matching and expiry steps */
  const [matches, setMatches] = useState({})
  const [expiryDates, setExpiryDates] = useState({})
  /* eslint-enable no-unused-vars */
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
  }

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
          <RequirementsList lang={lang} requirements={requirements} />
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
