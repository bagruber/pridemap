// One slug function for page URLs, ICS file names and ids. ASCII only: a slug
// ends up in a path and a file name, where "kraków" survives neither.
//
// Vite-free so the build scripts can import it under plain Node.
const TRANSLIT = {
  ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss',
  å: 'a', ø: 'o', æ: 'ae', ð: 'd', þ: 'th',
  ł: 'l', đ: 'd', ħ: 'h', ı: 'i', œ: 'oe',
}

export function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[äöüßåøæðþłđħıœ]/g, m => TRANSLIT[m] ?? m)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
