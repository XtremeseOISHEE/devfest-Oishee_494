// Parses and validates the contents of a requirements.json file.
// Returns { ok: true, tender, requirements } or { ok: false, errors: [{ key, params }] }.
// Error keys map to strings in i18n.js.
const TENDER_FIELDS = ['tender_id', 'title', 'procuring_entity', 'bidder', 'submission_deadline']

export function parseRequirements(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return fail([{ key: 'errNotJson' }])
  }

  if (!isObject(data)) return fail([{ key: 'errRoot' }])

  const errors = []

  if (!isObject(data.tender)) {
    errors.push({ key: 'errTender' })
  } else {
    for (const field of TENDER_FIELDS) {
      if (!isNonEmptyString(data.tender[field])) {
        errors.push({ key: 'errTenderField', params: { field } })
      }
    }
    const deadline = data.tender.submission_deadline
    if (isNonEmptyString(deadline) && !isIsoDate(deadline)) {
      errors.push({ key: 'errDeadline' })
    }
  }

  if (!Array.isArray(data.requirements)) {
    errors.push({ key: 'errRequirements' })
    return fail(errors)
  }
  if (data.requirements.length === 0) {
    errors.push({ key: 'errEmpty' })
    return fail(errors)
  }

  const ids = new Set()
  const requirements = []

  data.requirements.forEach((item, i) => {
    const index = i + 1
    if (!isObject(item)) {
      errors.push({ key: 'errItemNotObject', params: { index } })
      return
    }
    const hasId = isNonEmptyString(item.id) || Number.isFinite(item.id)
    if (!hasId) {
      errors.push({ key: 'errMissingId', params: { index } })
      return
    }
    const id = String(item.id)
    if (ids.has(id)) errors.push({ key: 'errDuplicateId', params: { id } })
    ids.add(id)

    if (!Number.isFinite(item.order)) errors.push({ key: 'errOrder', params: { id } })
    if (!isNonEmptyString(item.title_en)) errors.push({ key: 'errTitleEn', params: { id } })
    if (!isNonEmptyString(item.title_bn)) errors.push({ key: 'errTitleBn', params: { id } })
    if (typeof item.mandatory !== 'boolean') errors.push({ key: 'errMandatory', params: { id } })
    if (typeof item.has_expiry !== 'boolean') errors.push({ key: 'errHasExpiry', params: { id } })

    requirements.push({ ...item, id })
  })

  if (errors.length > 0) return fail(errors)
  return { ok: true, tender: data.tender, requirements }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

// Accepts only real calendar dates written as YYYY-MM-DD.
function isIsoDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
}

function fail(errors) {
  return { ok: false, errors }
}
