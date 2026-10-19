import { describe, it, expect } from 'vitest'
import { validate } from './validate.mjs'

const pride = extra => ({
  id: 'es-sevilla', name: 'Orgullo Sevilla', city: 'Sevilla', country: 'ES', lat: 37.39, lon: -5.98,
  website: null, instagram: null, editions: [{ year: 2026, date: '2026-06-27', status: 'unverified' }],
  ...extra,
})

describe('validate: todo', () => {
  it('accepts a link task with a date', () => {
    const { errors } = validate([pride({ todo: [{ task: 'link', since: '2026-10-19', note: 'Domain existiert nicht' }] })])
    expect(errors).toEqual([])
  })

  it('rejects an unknown task and a task without a date', () => {
    const { errors } = validate([pride({ todo: [{ task: 'linkk', since: '2026-10-19' }, { task: 'link' }] })])
    expect(errors).toEqual([
      'es-sevilla: todo "linkk" unbekannt',
      'es-sevilla: todo "link" ohne Datum (since)',
    ])
  })
})
