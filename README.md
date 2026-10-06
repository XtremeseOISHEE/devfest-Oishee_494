# Tender Document Package Builder

A browser-only React app that checks a bidder's PDFs against a tender's `requirements.json` and combines them into one submission-ready PDF package.

## Participant

- **Name:** Asma-Ul-Husna Oishee
- **Registration number:** 20210652868

## Live link

https://aidevfestoishee.netlify.app

## How to run

Requires Node.js and npm.

```bash
npm install
npm run dev
npm run build
```

`npm run dev` starts the Vite dev server (by default at http://localhost:5173). `npm run build` writes a static production build to `dist/`.

Everything runs in the browser. There is no backend, no network request to any server and no API key. The only runtime libraries besides React are `pdf-lib` (building the package) and `pdfjs-dist` (reading uploaded PDFs).

## Deliverables in this repository

- `output/T-2026-0417_Package.pdf`: the package generated from the sample pack.
- `screenshots/document-statuses.png`: the app after matching the sample pack, showing every document's status.

## Implemented main tasks

### 4.1 Load the list

The **Load requirements.json** button reads the file in the browser and validates it before showing anything.

- **Tender:** a `tender` object must exist with non-empty `tender_id`, `title`, `procuring_entity`, `bidder` and `submission_deadline`. The deadline must be a real date written as `YYYY-MM-DD`.
- **Requirements:** a non-empty `requirements` array, where every item has:
  - a unique `id`
  - a numeric `order`
  - non-empty `title_en` and `title_bn`
  - boolean `mandatory` and `has_expiry`

If anything is wrong, every problem is listed in the current language and nothing is loaded. If the file is valid, a tender details panel shows the five tender fields, and the required documents table is sorted by `order`, with a Mandatory or Optional tag on each row.

### 4.2 Upload files

The right-hand panel has a file picker that accepts many files at once, plus a drag-and-drop area.

- **Accepted files:** each file must end in `.pdf` and its bytes must start with `%PDF`. Anything else is rejected with a message naming the file.
- **Reading:** accepted files are opened with pdf.js to count their pages.
- **File list:** shows each file's name, page count and size, with a **Remove** button on every file.

### 4.3 Match files

Each row of the requirements table has a dropdown of uploaded files, plus an empty option that removes the match.

- A file already matched to another document doesn't appear in the other rows, so one file goes to at most one document and one document holds at most one file.
- Changing or clearing a match takes effect immediately.
- Removing a file also clears any match that used it, along with that row's expiry date.

### 4.4 Enter expiry dates

When a document has `has_expiry: true` and a file is matched, a date input appears in that row. The date is stored per requirement. Changing or clearing the match clears the date, because it belonged to the previous file.

### 4.5 Check everything

Every row shows a status, worked out from the current state on every render, so it updates immediately after any change.

- **Colours:** red for blocking statuses, grey for Not provided, green for OK.
- **Summary bar** (above the table): shows how many documents are OK, how many are blocking, and lists each blocking document with its reason.

### 4.6 Find duplicates

Every uploaded file gets a SHA-256 hash of its bytes, computed in the browser with `crypto.subtle.digest`. Files with the same hash count as duplicates even if their names differ.

- **Marking:** in the file list, each later copy gets a **Duplicate** tag naming the file it copies. The first-uploaded copy is treated as the original and isn't tagged.
- **Matching:** once one copy is matched, the other copies are disabled in every other row's dropdown, with a note naming the document that already uses that content. Duplicates therefore can't be matched to different documents.

### 4.7 Make the package

The **Generate package PDF** button stays disabled while any document is blocking, and a line below it lists the blocking documents. When nothing is blocking, clicking it builds one combined PDF with `pdf-lib`, showing a progress indicator while it works.

### 4.8 Download

The finished PDF downloads through a Blob and a temporary link as `<tender_id>_Package.pdf`. If `tender_id` contains characters that aren't allowed in file names (`\ / : * ? " < > |`), they're replaced with `-`.

### 4.9 Two languages

The **English / বাংলা** button switches the whole interface between Bangla (the default) and English. All interface text comes from `src/i18n.js`. Document names come from `title_bn` or `title_en` in the loaded file. Tender details are shown exactly as written in the file.

### 5 Status rules

`src/status.js` holds pure functions that don't depend on any particular sample pack.

| Situation | Status | Blocks? |
|---|---|---|
| No file, mandatory | Missing | Yes |
| No file, optional | Not provided | No |
| File matched, needs expiry, no date entered | Expiry date needed | Yes |
| File matched, needs expiry, date before the deadline | Expired | Yes |
| File matched, needs expiry, date on or after the deadline | OK | No |
| File matched, no expiry needed | OK | No |

Dates are compared as plain `YYYY-MM-DD` text, so time zones can't shift them. A document that expires on the deadline day is OK.

## Package rules

- **6.1 Cover page:** page 1 is an English cover drawn with the standard Helvetica font. It shows the heading TENDER DOCUMENT PACKAGE, then Tender ID, Tender title, Procuring entity, Bidder, Submission deadline, and Package generated on (today's local date as `YYYY-MM-DD`). Below that, an "Included documents" list shows each included document's order number, English title and file name. Long lines wrap, and the list text shrinks if needed so the cover stays one page.
- **6.2 Document order:** documents follow the cover in requirement `order`. All pages of each file are copied in their original order with `copyPages`. Optional documents with no file are skipped.
- **6.3 Footer:** every page, including the cover, gets the footer `<tender_id> | Page X of Y`, centred at the bottom. Every matched file is loaded and its pages counted before anything is drawn, so `Y` is the real total: 1 cover page plus every included page.
- **6.4 Readable footer:** a white filled strip, 24 points tall, is drawn across the bottom of the page, and the footer text goes on top of it in small dark text. This keeps the footer readable on any background. For rotated pages, and pages whose visible area doesn't start at the corner, the code places the strip along the edge that appears at the bottom when viewed. Rotated pages were only checked by reading back the PDF's text, not visually. See Known issues for what this strip covers.

## Bonus implemented

**Safe handling of damaged and password-protected PDFs:**

- **On upload:** a PDF that pdf.js can't open is rejected with a message naming the file, either "damaged and could not be read" or "password-protected and could not be read". The app keeps working.
- **During packaging:** if any matched file fails to load in pdf-lib, the build stops with a message naming the file, and no PDF is downloaded.

## Known issues

- **Mixed digits in Bangla mode.** The file list shows Bangla digits (২ পৃষ্ঠা). The summary counts, table order numbers and dates show Western digits (8টি). Bangla ৪ means 4 but looks like an 8, which can make counts look wrong at a glance.
- **Matching is manual.** The app doesn't suggest or auto-match files to requirements.
- **Bangla on the cover becomes `?`.** The cover uses a standard font that can't draw Bangla script, so any such characters, for example in a file name, are printed as `?`.
- **Expiry dates are entered by hand.** The app doesn't read dates from the PDFs.
- **Nothing is saved.** All state lives in memory and is lost when the page reloads.
- **No automated tests.** The status rules and the packager were checked with one-off scripts during development, and the interface was checked by hand. No test suite is included.
- **The footer strip covers the bottom 24 points of every page.** It avoids covering normal content, but anything a document has printed in that bottom strip, for example its own page numbers or a footer line, is hidden underneath.

## AI tools used

- **Claude Code** (Anthropic), used to write and change the code from prompts. Each commit message records the prompt behind it.

## Most useful prompt

The status engine prompt. It spelled out every status rule, the same-day-is-OK case and the plain-text date comparison, so the logic came out as small pure functions that were easy to check. Item 1 is quoted in full; items 2 to 6 are shortened.

> Add matching, expiry dates and the status engine. This is the core of the problem.
> 1. src/status.js — a pure function computeStatus(requirement, matchedFile, expiryDate, submissionDeadline) returning exactly one of: MISSING, EXPIRY_NEEDED, EXPIRED, NOT_PROVIDED, OK. Rules, exactly as the spec states: No file matched and mandatory is true → MISSING (blocking). No file matched and mandatory is false → NOT_PROVIDED (not blocking). File matched, has_expiry is true, no expiry date entered → EXPIRY_NEEDED (blocking). File matched, has_expiry is true, expiry date is before the submission deadline → EXPIRED (blocking). File matched, has_expiry is true, expiry date is on or after the deadline → OK. File matched and has_expiry is false → OK. A document expiring on the same day as the deadline is OK, not expired. Compare the dates as plain YYYY-MM-DD strings, not as Date objects, to avoid timezone bugs. Also export isBlocking(status) returning true for MISSING, EXPIRY_NEEDED and EXPIRED. Nothing in this file may reference the sample pack — judges use an unseen pack.
> 2. Matching UI — each row gets a dropdown listing uploaded files that are not already matched to another requirement, plus an empty option to unmatch. One file maps to at most one requirement, one requirement holds at most one file. Duplicates may not be matched to different requirements.
> 3. Expiry date input when has_expiry is true and a file is matched. 4. Status column with translated names and colours. 5. Summary bar with OK and blocking counts and the blocking reasons. 6. Removing a file clears its match and expiry date.

## License

MIT. See [LICENSE](LICENSE).
