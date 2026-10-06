import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import { t } from './i18n.js'

// Thrown when a matched file cannot be loaded; carries the file name for the UI.
export class PackageFileError extends Error {
  constructor(fileName, cause) {
    super(`Could not load ${fileName}`, { cause })
    this.fileName = fileName
  }
}

const A4 = [595.28, 841.89]
const MARGIN = 56
const FOOTER_STRIP = 24
const FOOTER_SIZE = 9
const DARK = rgb(0.15, 0.15, 0.15)

// Builds the final package and returns its bytes (Uint8Array).
// The cover page is always English; lang is accepted for API symmetry.
export async function buildPackage({ tender, requirements, matches, files }) {
  const fileById = new Map(files.map((f) => [f.id, f]))
  const included = [...requirements]
    .sort((a, b) => a.order - b.order)
    .map((req) => ({ req, file: fileById.get(matches[req.id]) }))
    .filter((item) => item.file)

  // First pass: load every matched PDF so the total page count is known up front.
  const loaded = []
  for (const item of included) {
    // pdf-lib can accept a damaged file and only fail once its pages are read,
    // so loading and counting both count as "loading the file".
    let doc
    let pageCount
    try {
      doc = await PDFDocument.load(item.file.buffer)
      pageCount = doc.getPageCount()
    } catch (err) {
      throw new PackageFileError(item.file.name, err)
    }
    if (pageCount === 0) throw new PackageFileError(item.file.name)
    loaded.push({ ...item, doc, pageCount })
  }
  const totalPages = 1 + loaded.reduce((sum, item) => sum + item.pageCount, 0)

  const out = await PDFDocument.create()
  const regular = await out.embedFont(StandardFonts.Helvetica)
  const bold = await out.embedFont(StandardFonts.HelveticaBold)

  drawCover(out.addPage(A4), { tender, loaded, regular, bold })

  for (const item of loaded) {
    let pages
    try {
      pages = await out.copyPages(item.doc, item.doc.getPageIndices())
    } catch (err) {
      throw new PackageFileError(item.file.name, err)
    }
    pages.forEach((p) => out.addPage(p))
  }

  const pages = out.getPages()
  pages.forEach((page, i) => {
    const text = t('en', 'pdfFooter', { id: tender.tender_id, page: i + 1, total: totalPages })
    drawFooter(page, safeText(text, regular), regular)
  })

  return out.save()
}

function drawCover(page, { tender, loaded, regular, bold }) {
  const { width, height } = page.getSize()
  const maxWidth = width - MARGIN * 2
  let y = height - MARGIN

  const line = (text, font, size, gap = 6) => {
    for (const part of wrap(safeText(text, font), font, size, maxWidth)) {
      y -= size
      page.drawText(part, { x: MARGIN, y, size, font, color: DARK })
      y -= gap
    }
  }

  line(t('en', 'pdfCoverHeading'), bold, 20, 18)
  const details = [
    ['pdfTenderId', tender.tender_id],
    ['pdfTenderTitle', tender.title],
    ['pdfProcuringEntity', tender.procuring_entity],
    ['pdfBidder', tender.bidder],
    ['pdfDeadline', tender.submission_deadline],
    ['pdfGeneratedOn', todayIso()],
  ]
  for (const [key, value] of details) {
    line(`${t('en', key)}: ${value}`, regular, 11)
  }

  y -= 14
  line(t('en', 'pdfIncludedHeading'), bold, 14, 10)

  if (loaded.length === 0) {
    line(t('en', 'pdfNoDocuments'), regular, 11)
    return
  }

  // Shrink the list until it fits above the footer strip, so the cover stays one page.
  const bottom = FOOTER_STRIP + 16
  const items = loaded.map(({ req, file }) =>
    t('en', 'pdfIncludedItem', { order: req.order, title: req.title_en, file: file.name }),
  )
  let size = 11
  let wrapped
  for (;;) {
    wrapped = items.map((text) => wrap(safeText(text, regular), regular, size, maxWidth))
    const lineCount = wrapped.reduce((n, w) => n + w.length, 0)
    const needed = lineCount * (size + 3) + items.length * 3
    if (y - needed >= bottom || size <= 5) break
    size -= 0.5
  }
  for (const parts of wrapped) {
    for (const part of parts) {
      y -= size
      page.drawText(part, { x: MARGIN, y, size, font: regular, color: DARK })
      y -= 3
    }
    y -= 3
  }
}

// White strip along the visual bottom edge, then centred footer text on top.
// Handles rotated pages and crop boxes that do not start at the origin.
function drawFooter(page, text, font) {
  const { x, y, width, height } = page.getCropBox()
  const rotation = ((page.getRotation().angle % 360) + 360) % 360
  const tw = font.widthOfTextAtSize(text, FOOTER_SIZE)
  const pad = 8
  const white = { color: rgb(1, 1, 1) }
  const textOpts = { size: FOOTER_SIZE, font, color: DARK }

  if (rotation === 90) {
    page.drawRectangle({ x: x + width - FOOTER_STRIP, y, width: FOOTER_STRIP, height, ...white })
    page.drawText(text, { ...textOpts, x: x + width - pad, y: y + (height - tw) / 2, rotate: degrees(90) })
  } else if (rotation === 180) {
    page.drawRectangle({ x, y: y + height - FOOTER_STRIP, width, height: FOOTER_STRIP, ...white })
    page.drawText(text, { ...textOpts, x: x + (width + tw) / 2, y: y + height - pad, rotate: degrees(180) })
  } else if (rotation === 270) {
    page.drawRectangle({ x, y, width: FOOTER_STRIP, height, ...white })
    page.drawText(text, { ...textOpts, x: x + pad, y: y + (height + tw) / 2, rotate: degrees(270) })
  } else {
    page.drawRectangle({ x, y, width, height: FOOTER_STRIP, ...white })
    page.drawText(text, { ...textOpts, x: x + (width - tw) / 2, y: y + pad })
  }
}

// Standard fonts only cover Latin text; replace anything they cannot draw with '?'.
function safeText(text, font) {
  let out = ''
  for (const ch of String(text)) {
    try {
      font.widthOfTextAtSize(ch, 10)
      out += ch
    } catch {
      out += '?'
    }
  }
  return out
}

function wrap(text, font, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = word
    // Break a single word that is wider than the line (long file names).
    while (font.widthOfTextAtSize(current, size) > maxWidth) {
      let cut = current.length - 1
      while (cut > 1 && font.widthOfTextAtSize(current.slice(0, cut), size) > maxWidth) cut--
      lines.push(current.slice(0, cut))
      current = current.slice(cut)
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function todayIso() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Download name for the package, with characters that are unsafe in file names replaced.
export function packageFileName(tender) {
  const id = String(tender.tender_id).replace(/[\\/:*?"<>|]+/g, '-').trim()
  return `${id}_Package.pdf`
}
