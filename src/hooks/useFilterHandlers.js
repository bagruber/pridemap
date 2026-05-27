export function useFilterHandlers(filters, onChange) {
  const toggleCountry = code => onChange({
    ...filters,
    countries: filters.countries.includes(code)
      ? filters.countries.filter(c => c !== code)
      : [...filters.countries, code],
  })

  const toggleSize = size => onChange({
    ...filters,
    sizes: filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size],
  })

  const setTimeframe = value => onChange({
    ...filters,
    timeframe: filters.timeframe === value ? 'upcoming' : value,
  })

  return { toggleCountry, toggleSize, setTimeframe }
}
