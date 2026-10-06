import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfjsWorker

// Reads one uploaded File in the browser.
// Returns { ok: true, record } or { ok: false, error: { key, params } }.
// Error keys map to strings in i18n.js.
export async function readPdfFile(file) {
  const name = file.name
  if (!name.toLowerCase().endsWith('.pdf')) {
    return { ok: false, error: { key: 'errNotPdf', params: { name } } }
  }

  let buffer
  try {
    buffer = await file.arrayBuffer()
  } catch {
    return { ok: false, error: { key: 'errPdfUnreadable', params: { name } } }
  }
  if (!startsWithPdfHeader(buffer)) {
    return { ok: false, error: { key: 'errNotPdf', params: { name } } }
  }

  let pageCount
  try {
    pageCount = await countPages(buffer)
  } catch (err) {
    const key = err?.name === 'PasswordException' ? 'errPdfPassword' : 'errPdfUnreadable'
    return { ok: false, error: { key, params: { name } } }
  }

  const hash = await sha256(buffer)
  return {
    ok: true,
    record: { id: crypto.randomUUID(), name, size: file.size, pageCount, hash, buffer },
  }
}

function startsWithPdfHeader(buffer) {
  const head = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength))
  return String.fromCharCode(...head) === '%PDF'
}

async function countPages(buffer) {
  // pdf.js transfers the bytes it is given to its worker, so hand it a copy
  // and keep the original buffer intact for packaging later.
  const task = getDocument({ data: new Uint8Array(buffer.slice(0)) })
  try {
    const doc = await task.promise
    return doc.numPages
  } finally {
    await task.destroy()
  }
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
