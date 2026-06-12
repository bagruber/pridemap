// Lowercase, fold ß→ss and strip diacritics for accent-insensitive search
export function norm(s) {
  return (s ?? '').toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
