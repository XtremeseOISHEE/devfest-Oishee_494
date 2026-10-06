import { t } from '../i18n.js'

function Header({ lang, onToggleLang, onLoadRequirements }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) onLoadRequirements(file)
    e.target.value = ''
  }

  return (
    <header className="header">
      <h1>{t(lang, 'appTitle')}</h1>
      <div className="header-actions">
        <label className="button">
          {t(lang, 'loadRequirements')}
          <input type="file" accept=".json,application/json" onChange={handleFile} hidden />
        </label>
        <button
          type="button"
          className="button button-secondary"
          onClick={onToggleLang}
          aria-label={t(lang, 'languageToggleLabel')}
        >
          {t(lang, 'languageToggle')}
        </button>
      </div>
    </header>
  )
}

export default Header
