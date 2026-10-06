import { useState } from 'react'
import Header from './components/Header.jsx'
import RequirementsList from './components/RequirementsList.jsx'
import TenderDetails from './components/TenderDetails.jsx'
import { parseRequirements } from './requirements.js'
import { t } from './i18n.js'

function App() {
  const [lang, setLang] = useState('bn')
  const [tender, setTender] = useState(null)
  const [requirements, setRequirements] = useState([])
  /* eslint-disable no-unused-vars -- read by the upload, matching and expiry steps */
  const [files, setFiles] = useState([])
  const [matches, setMatches] = useState({})
  const [expiryDates, setExpiryDates] = useState({})
  /* eslint-enable no-unused-vars */
  const [loadErrors, setLoadErrors] = useState([])

  const handleLoadRequirements = async (file) => {
    const result = parseRequirements(await file.text())
    if (!result.ok) {
      setLoadErrors(result.errors)
      return
    }
    setLoadErrors([])
    setTender(result.tender)
    setRequirements(result.requirements)
    setFiles([])
    setMatches({})
    setExpiryDates({})
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
      </main>
    </div>
  )
}

export default App
