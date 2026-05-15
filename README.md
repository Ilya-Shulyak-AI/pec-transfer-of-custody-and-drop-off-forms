# PEC Transfer of Custody

Public GitHub Pages project for the Precision E-Cycle Transfer of Custody (TOC) form.

## Live app

https://ilya-shulyak-ai.github.io/pec-transfer-of-custody/

## Purpose

This repository hosts a lightweight, local-first Transfer of Custody form for Precision E-Cycle. The app is designed for field use on desktop and iPhone, then printing or saving the completed custody record as a one-page Letter-size PDF.

## Current TOC workflow

1. Open the app and enter the TOC form number and date, or use the Today button to fill the date fields.
2. Enter the optional PO number.
3. Complete the Transferring Party information, including company, contact, address, phone, email, city, state, zip, and transfer method.
4. Review the Receiving Party section, which is prefilled for Precision E-Cycle. Select the receiving contact from the Received By dropdown, or choose Other to reveal a custom receiver-name field.
5. Complete Transfer Details:
   - Reason for Transfer dropdown, with an Other field when needed.
   - Certificate Required radio choice.
   - Estimated Total Weight dropdown, including Less than 100 lbs, 100-lb increments up to 10,000 lbs, and an Other/manual weight entry.
   - Total Units free-text summary.
6. Capture both signatures by tapping/clicking each signature box, drawing in the signature modal, and selecting Done.
7. Use Print to open browser print/PDF output, or use the Clear Saved Data reset flow after the record is complete to clear the device for the next TOC.

## Field behavior and validation

- The TOC Form Number is flexible text and must be entered by the user.
- The Today button updates the main form date and both signature dates.
- State input normalizes to two uppercase letters and validates against supported U.S. state abbreviations.
- Phone inputs format as U.S. 10-digit phone numbers.
- Email inputs validate as email fields.
- Required radio groups and signatures are checked before printing.
- If required information is missing or invalid when Print is selected, the app shows a validation banner and warning modal with options to keep editing or print anyway.

## Storage behavior

The app stores entered form data, the saved-at timestamp, and signatures locally in the browser on the device being used. They stay in that browser/device until the saved data is cleared. Signature images are stored separately in `localStorage` as cropped PNG data URLs.

The app does not use a backend database, cloud sync, or server-side customer-data storage, and it does not send customer form entries or signatures to a server. Data saved on one browser/device does not automatically appear on another browser/device.

Storage details:

- Current form payload key: `pec_toc_form_v8`.
- Older form keys are checked for compatibility and cleaned during reset.
- Signature keys use the `pec_toc_sig_` prefix.
- Local storage reads/writes are wrapped so the app can continue functioning if browser storage is unavailable, full, or blocked.
- If the browser cannot save because storage is blocked or full, the app shows a warning so the user can print or save a PDF before leaving the page.
- Corrupted stored form data is cleared and replaced with a fresh form.

### Clear Saved Data / New behavior

Use the app's Clear Saved Data reset flow only after the custody record has been printed, saved as a PDF, or otherwise finalized. The reset flow asks for confirmation, clears saved editable fields and signatures from browser storage, clears hidden Other values, clears validation/storage warnings, and scrolls back to the top so the device is ready for the next TOC.

Because the repository is public and the app is local-first, do not commit private customer data, credentials, API keys, or internal-only process details to the source code.

## Print/PDF workflow

Use the Print button in the toolbar to print or save as PDF. The app validates the form first; if required items are missing or invalid, the validation banner and print warning modal summarize what needs attention and let the user either continue editing or print the current information anyway.

Print behavior:

- The browser print dialog is launched with `window.print()`.
- Print-specific layout lives in `print.css` and is loaded only for print media.
- The toolbar, signature modal, print warning modal, validation banner, storage warning, local-data note, tap hints, clear-signature buttons, Today button, and screen-only footer are hidden in print.
- The target output is one Letter-size portrait page at normal/100% scale.
- Print CSS uses a fixed 8.5in by 11in page, compact typography, and explicit grid/table borders to preserve clear divider lines in the generated PDF.
- Signature previews print from the saved cropped PNG data URLs.

Always review print preview before finalizing a record. In addition to content accuracy, check border quality/divider visibility and confirm that the output remains on one page without custom scaling.

## PWA / iPhone Home Screen behavior

The app includes PWA metadata through `manifest.webmanifest` and iOS Home Screen meta tags in `index.html`.

To use on iPhone:

1. Open the live app link in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Open the app from the Home Screen.

Expected PWA behavior:

- The Home Screen app opens the GitHub Pages app path defined in the manifest.
- The display mode is standalone.
- The app is portrait-oriented.
- Local form data persists in the same Safari/Home Screen storage context when storage is available.
- No service worker is currently registered, so offline caching is not guaranteed.

### Repeatable print regression check

Run the standalone Playwright print checks before merging print-related changes:

```sh
npm install
npx playwright install chromium
npm test
```

The tests load the local static `index.html`, fill representative values including long names, Other fields, radio buttons, manual weight, and signatures, then generate Letter-size PDFs and assert that they have exactly one page. They also write `test-artifacts/print-output.pdf`, `test-artifacts/print-output.png`, `test-results/print-validation/toc-print-validation.pdf`, and `test-results/print-validation/toc-print-validation.png` for optional manual review of borders and divider quality.

## Automated print validation

Run the lightweight Playwright print regression check before deployment:

```sh
npm install
npx playwright install chromium
npm test
```

The test opens `index.html` locally, fills representative long values, selects active Other fields, checks radio buttons, draws both signatures, and generates a PDF at Letter format with 100% scale. Expected output is passing standalone Playwright checks. The generated PDF must contain exactly one page with Letter portrait media size (612 × 792 points).

For visual review, the test writes artifacts to:

- `test-results/print-validation/toc-print-validation.pdf`
- `test-results/print-validation/toc-print-validation.png`

## Current app status

The current app is the Transfer of Custody form only. The Drop-Off form and any multi-form selection page are not currently present in this repository.

## Current architecture

- `index.html` contains the form markup, modals, PWA/iOS metadata, and cache-busted asset references.
- `base.css` is currently a placeholder for the stylesheet split.
- `styles.css` controls screen/app styling and responsive behavior.
- `print.css` controls the print-only render layer for the one-page Letter PDF output.
- `app.js` controls form initialization, event delegation, generated dropdown options, validation, local storage, reset behavior, print gating, and signatures.
- `manifest.webmanifest` controls PWA/Home Screen metadata.
- `icon.svg` provides the SVG favicon.
- Embedded 192x192 and 512x512 PNG data icons in `manifest.webmanifest` provide installable app icons without adding binary files.
- The embedded 180x180 PNG data icon in `index.html` provides the iPhone/iPad Home Screen icon without adding binary files.

## Credit and starting point

Credit to Slavic Brychka for creating and sharing the initial `index.html` code used as the starting point for this project.

The source code provided by Slavic was the version shared on May 7, 2026. This repository was created and work began on May 8, 2026.

This repository was created separately because the original GitHub repository was not publicly accessible or available to fork at the time. Slavic shared the standalone code directly, so this repo is being used as a working copy for continued PEC-specific adjustments.

## Development workflow

- Keep `main` clean and stable.
- Use focused feature branches for meaningful changes.
- Test against `QA-CHECKLIST.md` before merging.
- Preserve mobile/iPhone behavior carefully.
- Keep print styles isolated in `print.css`.
- Keep screen styles isolated in `styles.css`.
- Prefer simple, static, local-first implementation unless more complexity is clearly needed.

## GitHub Pages recovery

If the live link shows a GitHub Pages 404 after a repository rename, re-save the Pages setting under **Settings → Pages** using:

- Source: Deploy from a branch
- Branch: main
- Folder: / root
