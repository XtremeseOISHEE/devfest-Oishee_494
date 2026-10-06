// Pure status rules for requirements. No UI, no I/O, no pack-specific data.

export const STATUS = {
  MISSING: 'MISSING',
  EXPIRY_NEEDED: 'EXPIRY_NEEDED',
  EXPIRED: 'EXPIRED',
  NOT_PROVIDED: 'NOT_PROVIDED',
  OK: 'OK',
}

// Dates are YYYY-MM-DD strings, which sort correctly as plain strings,
// so no Date objects (and no timezone shifts) are involved.
export function computeStatus(requirement, matchedFile, expiryDate, submissionDeadline) {
  if (!matchedFile) {
    return requirement.mandatory ? STATUS.MISSING : STATUS.NOT_PROVIDED
  }
  if (!requirement.has_expiry) return STATUS.OK
  if (!expiryDate) return STATUS.EXPIRY_NEEDED
  if (expiryDate < submissionDeadline) return STATUS.EXPIRED
  return STATUS.OK
}

export function isBlocking(status) {
  return status === STATUS.MISSING || status === STATUS.EXPIRY_NEEDED || status === STATUS.EXPIRED
}

// Status for every requirement, keyed by requirement id.
// matches: { [requirementId]: fileId }, expiryDates: { [requirementId]: 'YYYY-MM-DD' }.
export function computeAllStatuses(requirements, files, matches, expiryDates, submissionDeadline) {
  const fileById = new Map(files.map((f) => [f.id, f]))
  const result = {}
  for (const req of requirements) {
    const file = fileById.get(matches[req.id]) ?? null
    result[req.id] = computeStatus(req, file, expiryDates[req.id] || '', submissionDeadline)
  }
  return result
}
