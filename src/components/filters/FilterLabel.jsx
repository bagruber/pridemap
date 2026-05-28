import { useLang } from '../../contexts/LangContext.jsx'
import { t } from '../../utils/i18n.js'

export default function FilterLabel({ children, onClear, clearCount }) {
  const { lang } = useLang()
  return (
    <div className={`filter-label ${onClear ? 'filter-label--with-clear' : ''}`}>
      <span>{children}</span>
      {onClear && (
        <button className="clear-btn" onClick={onClear}>
          {t('clear', lang)}{clearCount ? ` ${clearCount}` : ''}
        </button>
      )}
    </div>
  )
}
