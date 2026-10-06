Project rules — follow for every change.

- React + Vite, plain JavaScript. Plain CSS in src/styles.css only.
  No Tailwind, no UI library, no CDN scripts.
- Allowed npm packages: pdf-lib, pdfjs-dist. Ask before adding any other.
- All state lives in App.jsx and is passed down as props.
- Every user-facing string comes from src/i18n.js with bn and en keys.
  Never hardcode visible text in a component.
  Document titles come from the dataset (title_bn / title_en), not i18n.
- Frontend only. No backend, no fetch to any server. No API keys.
  All PDF processing happens in the browser.
- Status logic lives in src/status.js as pure functions.
  PDF building lives in src/packager.js.
  Never hardcode anything from the sample pack — judges use an unseen pack.
- Commit message format:
  <short note of what changed>
  Prompt: <the prompt I gave you, plain text, no quote marks>
- Do not use escaped double quotes inside commit messages.
- Never force push, rebase, or rewrite history.
