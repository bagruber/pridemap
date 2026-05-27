const COUNTRY_NAMES = {
  AL:'Albania', AD:'Andorra', AT:'Austria', BE:'Belgium', BA:'Bosnia & Herz.',
  BG:'Bulgaria', HR:'Croatia', CY:'Cyprus', CZ:'Czechia', DK:'Denmark',
  EE:'Estonia', FI:'Finland', FR:'France', DE:'Germany', GR:'Greece',
  HU:'Hungary', IS:'Iceland', IE:'Ireland', IT:'Italy', XK:'Kosovo',
  LV:'Latvia', LI:'Liechtenstein', LT:'Lithuania', LU:'Luxembourg',
  MT:'Malta', MD:'Moldova', MC:'Monaco', ME:'Montenegro', NL:'Netherlands',
  MK:'North Macedonia', NO:'Norway', PL:'Poland', PT:'Portugal', RO:'Romania',
  RU:'Russia', SM:'San Marino', RS:'Serbia', SK:'Slovakia', SI:'Slovenia',
  ES:'Spain', SE:'Sweden', CH:'Switzerland', TR:'Turkey', UA:'Ukraine',
  GB:'United Kingdom', GE:'Georgia', AM:'Armenia', AZ:'Azerbaijan', BY:'Belarus',
}

const FLAG_EMOJI = {
  AL:'🇦🇱', AD:'🇦🇩', AT:'🇦🇹', BE:'🇧🇪', BA:'🇧🇦', BG:'🇧🇬', HR:'🇭🇷',
  CY:'🇨🇾', CZ:'🇨🇿', DK:'🇩🇰', EE:'🇪🇪', FI:'🇫🇮', FR:'🇫🇷', DE:'🇩🇪',
  GR:'🇬🇷', HU:'🇭🇺', IS:'🇮🇸', IE:'🇮🇪', IT:'🇮🇹', XK:'🇽🇰', LV:'🇱🇻',
  LI:'🇱🇮', LT:'🇱🇹', LU:'🇱🇺', MT:'🇲🇹', MD:'🇲🇩', MC:'🇲🇨', ME:'🇲🇪',
  NL:'🇳🇱', MK:'🇲🇰', NO:'🇳🇴', PL:'🇵🇱', PT:'🇵🇹', RO:'🇷🇴', RU:'🇷🇺',
  SM:'🇸🇲', RS:'🇷🇸', SK:'🇸🇰', SI:'🇸🇮', ES:'🇪🇸', SE:'🇸🇪', CH:'🇨🇭',
  TR:'🇹🇷', UA:'🇺🇦', GB:'🇬🇧', GE:'🇬🇪', AM:'🇦🇲', AZ:'🇦🇿', BY:'🇧🇾',
  GG:'🇬🇬',
}

const SIZES = ['small', 'medium', 'large']
const TIMEFRAMES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'all', label: 'All' },
  { value: 'past', label: 'Past' },
]

export default function FilterSidebar({ filters, onChange, allCountries, totalCount, view, onViewChange }) {
  const toggleCountry = (code) => {
    const next = filters.countries.includes(code)
      ? filters.countries.filter(c => c !== code)
      : [...filters.countries, code]
    onChange({ ...filters, countries: next })
  }

  const toggleSize = (size) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size]
    onChange({ ...filters, sizes: next })
  }

  return (
    <div className="filter-sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">Pride Map<br />2026</h1>
        <div className="view-toggle">
          {[{ value: 'europe', label: '🌍 Europe' }, { value: 'dach', label: '🇩🇪 DACH' }].map(v => (
            <button
              key={v.value}
              className={`view-btn ${view === v.value ? 'active' : ''}`}
              onClick={() => onViewChange(v.value)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="sidebar-count">
          Showing <strong>{totalCount}</strong> events
        </div>
      </div>

      <div className="sidebar-body">
        <div className="filter-group">
          <div className="filter-label">Time</div>
          <div className="toggle-group">
            {TIMEFRAMES.map(t => (
              <button
                key={t.value}
                className={`toggle-btn ${filters.timeframe === t.value ? 'active' : ''}`}
                onClick={() => onChange({ ...filters, timeframe: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Size</span>
            {filters.sizes.length > 0 && (
              <button className="clear-btn" onClick={() => onChange({ ...filters, sizes: [] })}>
                clear
              </button>
            )}
          </div>
          <div className="toggle-group">
            {SIZES.map(s => (
              <button
                key={s}
                className={`toggle-btn ${filters.sizes.includes(s) ? 'active' : ''}`}
                onClick={() => toggleSize(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Country</span>
            {filters.countries.length > 0 && (
              <button className="clear-btn" onClick={() => onChange({ ...filters, countries: [] })}>
                clear {filters.countries.length}
              </button>
            )}
          </div>
          <div className="country-list">
            {allCountries.map(code => (
              <div
                key={code}
                className={`country-item ${filters.countries.includes(code) ? 'selected' : ''}`}
                onClick={() => toggleCountry(code)}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={filters.countries.includes(code)}
                />
                <span className="country-flag">{FLAG_EMOJI[code] ?? '🏳'}</span>
                <span className="country-name">{COUNTRY_NAMES[code] ?? code}</span>
                <span className="country-code">{code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
