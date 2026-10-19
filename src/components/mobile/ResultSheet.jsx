import { useEffect } from 'react'
import { useLang } from '../../contexts/LangContext.jsx'
import { t, tf } from '../../utils/i18n.js'
import { useSheetDrag } from '../../hooks/useSheetDrag.js'
import ColoredTitle from '../ColoredTitle.jsx'
import LegendBar from './LegendBar.jsx'
import FilterChips from './FilterChips.jsx'
import FilterPanel from './FilterPanel.jsx'
import ResultList from './ResultList.jsx'
import { track } from '../../utils/track.js'

export const SHEET_STOPS = [180, 470, 776]

/**
 * The bottom sheet on mobile. It is the results, the filters and the legend in
 * one surface — there used to be a map/list switch, a filter drawer and a
 * separate legend that was hidden on phones altogether.
 */
export default function ResultSheet({
  parades, filters, onChange, allCountries, countryCounts, totalCount, openCount,
  today, view, onViewChange, clusteringEnabled, onClusteringChange,
  onSelect, onAboutClick, onReset, isoSlot, panel, onPanel, onHeightChange,
}) {
  const { lang } = useLang()
  const stops = SHEET_STOPS.map(h => Math.min(h, typeof window !== 'undefined' ? window.innerHeight - 68 : h))
  const sheet = useSheetDrag(stops, 0)

  useEffect(() => { onHeightChange?.(sheet.height) }, [sheet.height, onHeightChange])

  // Picking a chip needs room for its options
  const pickPanel = key => {
    onPanel(key)
    if (key) {
      track(`filter/${key}`)
      if (sheet.index === 0) sheet.setIndex(1)
    }
  }

  const dated = totalCount - openCount

  return (
    <section
      className={`sheet ${sheet.dragging ? 'is-dragging' : ''}`}
      style={{ height: sheet.height }}
      aria-label={t('listView', lang)}
    >
      <button
        type="button"
        className="sheet-grab"
        aria-label={t('listView', lang)}
        aria-expanded={sheet.index > 0}
        {...sheet.handlers}
      >
        <span className="sheet-grab-bar" />
      </button>

      <div className="sheet-head">
        <ColoredTitle className="app-title sheet-wordmark" today={today} />
        <span className="sheet-count">
          {tf(dated === 1 ? 'countDatesOne' : 'countDates', lang, { dated, open: openCount })}
        </span>
      </div>

      <FilterChips filters={filters} active={panel} onPick={pickPanel} onReset={onReset} />

      {panel ? (
        <FilterPanel
          which={panel}
          filters={filters}
          onChange={onChange}
          allCountries={allCountries}
          countryCounts={countryCounts}
          totalCount={totalCount}
          view={view}
          onViewChange={onViewChange}
          clusteringEnabled={clusteringEnabled}
          onClusteringChange={onClusteringChange}
          isoSlot={isoSlot}
          onClose={() => onPanel(null)}
          onReset={onReset}
        />
      ) : (
        <>
          <LegendBar />
          <div className="sheet-scroll">
            <ResultList parades={parades} onSelect={onSelect} />
            <div className="sheet-foot">
              <span>{t('missingParade', lang)}</span>{' '}
              <a href="https://forms.gle/oo6vk3QfANXskXku8" target="_blank" rel="noopener noreferrer">
                {t('suggestOne', lang)}
              </a>
              <button type="button" className="sheet-about" onClick={onAboutClick}>
                {t('about', lang)}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
