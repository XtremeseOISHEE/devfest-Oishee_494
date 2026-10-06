// Parses and validates the contents of a requirements.json file.
// Returns { ok: true, tender, requirements } or { ok: false, errors: [{ key, params }] }.
// Error keys map to strings in i18n.js.
export function parseRequirements(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return fail([{ key: 'errNotJson' }])
  }

  let tender = null
  let list
  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === 'object' && Array.isArray(data.requirements)) {
    list = data.requirements
    if (data.tender !== undefined) {
      if (!data.tender || typeof data.tender !== 'object' || Array.isArray(data.tender)) {
        return fail([{ key: 'errTender' }])
      }
      tender = data.tender
    }
  } else {
    return fail([{ key: 'errRoot' }])
  }

  if (list.length === 0) return fail([{ key: 'errEmpty' }])

  const errors = []
  const ids = new Set()
  const orders = new Set()
  const requirements = []

  list.forEach((item, i) => {
    const index = i + 1
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push({ key: 'errItemNotObject', params: { index } })
      return
    }
    const hasId = (typeof item.id === 'string' && item.id.trim() !== '') || Number.isFinite(item.id)
    if (!hasId) {
      errors.push({ key: 'errMissingId', params: { index } })
      return
    }
    const id = String(item.id)
    if (ids.has(id)) errors.push({ key: 'errDuplicateId', params: { id } })
    ids.add(id)

    if (!Number.isFinite(item.order)) {
      errors.push({ key: 'errOrder', params: { id } })
    } else if (orders.has(item.order)) {
      errors.push({ key: 'errDuplicateOrder', params: { order: item.order } })
    } else {
      orders.add(item.order)
    }
    if (typeof item.title_bn !== 'string' || item.title_bn.trim() === '') {
      errors.push({ key: 'errTitleBn', params: { id } })
    }
    if (typeof item.title_en !== 'string' || item.title_en.trim() === '') {
      errors.push({ key: 'errTitleEn', params: { id } })
    }
    if (typeof item.mandatory !== 'boolean') {
      errors.push({ key: 'errMandatory', params: { id } })
    }
    requirements.push({ ...item, id })
  })

  if (errors.length > 0) return fail(errors)
  return { ok: true, tender, requirements }
}

function fail(errors) {
  return { ok: false, errors }
}
