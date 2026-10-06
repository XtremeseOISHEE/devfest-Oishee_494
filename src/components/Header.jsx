import { t } from '../i18n.js'

function Header({ lang, onToggleLang, onLoadRequirements, tender }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) onLoadRequirements(file)
    e.target.value = ''
  }

  const tenderName = tender
    ? (lang === 'bn' ? tender.title_bn ?? tender.title_en : tender.title_en ?? tender.title_bn) ?? tender.id
    : null

  return (
    <header className="header">
      <div className="header-title">
        <h1>{t(lang, 'appTitle')}</h1>
        {tenderName && (
          <p className="header-tender">
            {t(lang, 'tenderLabel')}: {tenderName}
          </p>
        )}
      </div>
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
