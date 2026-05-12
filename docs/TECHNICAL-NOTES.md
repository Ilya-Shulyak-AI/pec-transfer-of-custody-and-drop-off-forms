# Technical Notes

## Project purpose

This application is a lightweight browser-based Transfer of Custody (TOC) form for Precision E-Cycle.

Primary goals:

- Mobile-first workflow for desktop and iPhone field use.
- Fast local entry with no backend dependency.
- Local-only browser storage of customer-entered form data and signatures.
- Printable one-page Letter PDF output.
- iPhone Home Screen compatibility through PWA metadata.

## Current stack

- Static HTML.
- CSS split by purpose.
- Vanilla JavaScript in a single deferred script.
- GitHub Pages hosting.
- Browser `localStorage` persistence.
- Canvas-based signatures saved as PNG data URLs.

No build step, backend service, service worker, or external runtime dependency is currently required. Node/Playwright dependencies are used only for repeatable print regression checks.

## Current file/module structure

The app is still intentionally small and uses file-level separation instead of JavaScript modules:

- `index.html`
  - Document shell, PWA/iOS metadata, toolbar, TOC form sections, signature modal, and print warning modal.
  - Asset references include query-string cache busters.
- `base.css`
  - Placeholder for the stylesheet split. It is intentionally minimal today.
- `styles.css`
  - Screen-only application styling, responsive layout, toolbar, field grids, signature modal, print warning modal, and mobile adjustments.
- `print.css`
  - Print-only render layer loaded with `media="print"`.
  - Owns one-page Letter sizing, compact print typography, print-only borders, hidden screen controls, and page-break avoidance.
- `app.js`
  - Single IIFE module that owns constants, state, helpers, validation, storage, reset, generated dropdown options, print gating, signatures, and event delegation.
- `manifest.webmanifest`
  - PWA/Home Screen metadata for the GitHub Pages path.
- `icon.svg`
  - Application icon.

## JavaScript organization inside `app.js`

Although `app.js` is not split into separate files, it is organized around these responsibilities:

- App constants:
  - Current storage key: `pec_toc_form_v7`.
  - Backward-compatible old storage keys.
  - Signature key prefix.
  - Supported state abbreviations.
  - Date fields, signature IDs, radio groups, optional fields, and required radio labels.
- Initialization:
  - Populates the state select options.
  - Generates estimated-weight dropdown options from 100 lbs through 10,000 lbs.
  - Binds the reusable signature canvas once.
  - Loads stored form/signature data.
  - Registers document-level event delegation for clicks, keyboard activation, input, and change events.
- Validation:
  - Required editable fields are identified from `[data-save="true"]` except optional, readonly, disabled, radio, and hidden Other fields.
  - State, phone, email, manual weight, required radio groups, and signatures are validated before normal print.
  - Missing/invalid fields are highlighted when validation is run with marking enabled, and the validation banner/modal summarize the issues before printing.
- Storage:
  - Editable fields and radio group values are serialized into a versioned payload.
  - Signatures are stored separately by signature ID.
  - Storage calls are wrapped to tolerate blocked/unavailable `localStorage`.
  - Corrupted stored JSON is cleared and replaced with a fresh form.
- Signatures:
  - One modal/canvas is reused for both signature boxes.
  - Canvas size accounts for `devicePixelRatio`.
  - Mouse and touch drawing are supported.
  - Saved signatures are cropped before being written to preview images and storage.
  - Signature date fields are stamped only when blank; clearing a saved signature also clears that signature date.
- Print gating:
  - Print validates the form first.
  - Valid forms call `window.print()` immediately.
  - Incomplete or invalid forms show a validation banner and open a modal with Continue Editing and Print Anyway actions.

## Receiving Party contact behavior

The Receiving Party section is prefilled for Precision E-Cycle and includes a `Received By` contact dropdown. The dropdown currently includes Ilya Shulyak, Slavic Brychka, and Other.

When Other is selected, the custom receiver-name field is displayed. When the dropdown changes away from Other, that custom field is hidden, cleared, and its validation/highlight state is reset. Both the selected contact and the custom Other value participate in local storage when visible/relevant.

## Storage model

Form data is stored in browser `localStorage` only. There is no backend database or cross-device synchronization.

Current keys:

- `pec_toc_form_v7` for the versioned form payload.
- `pec_toc_sig_1` for the Transferring Party signature image.
- `pec_toc_sig_2` for the Receiving Party signature image.

Compatibility/reset behavior:

- Older form keys from v2 through v6 are checked during load.
- Reset removes the current key, known old form keys, and signature keys.
- Reset confirms destructive clearing, removes locally saved data/signatures, clears editable fields, and leaves date and TOC fields blank for the next record.
- The app logs storage errors to the console but avoids breaking the UI when storage is unavailable.

## Print-only render layer

`print.css` is the dedicated print-only render layer. It is deliberately separate from screen styling so screen/mobile adjustments do not accidentally change the PDF output.

Current print design:

- `@page` targets Letter portrait with zero browser page margin.
- `.page` is fixed at 8.5in by 11in with internal padding.
- Screen-only controls and modals are hidden with print-specific rules.
- Form sections use compact grid layouts and explicit borders.
- Borders/dividers are set in print styles to keep the saved PDF visually scannable.
- Sections and signature panels opt out of internal page breaks where supported.
- Signature preview images are constrained to the signature box and print from stored PNG data URLs.

Important QA expectations:

- Print preview should fit on one Letter page at 100% scale.
- Saved PDF output should remain one page.
- Borders should be consistent, visible, and clean in both print preview and saved PDF output.
- Browser print settings can still affect output, so final manual print/PDF review is required before release.

## PWA behavior

The app includes PWA metadata but does not currently include a service worker.

Current PWA characteristics:

- Manifest name: `PEC Transfer of Custody`.
- Short name: `PEC TOC`.
- Start URL/scope: `/pec-transfer-of-custody/`.
- Display mode: `standalone`.
- Orientation: `portrait`.
- Theme/background colors are defined in the manifest and HTML metadata.
- iOS-specific Home Screen meta tags are present in `index.html`.

Because no service worker is registered, offline behavior should not be treated as guaranteed. The app should be tested from the live GitHub Pages URL and from iPhone Home Screen standalone mode.

## Future architecture improvements

Potential improvements if the app grows:

- Split `app.js` into focused JavaScript modules:
  - `constants.js`
  - `storage.js`
  - `validation.js`
  - `dropdowns.js`
  - `signatures.js`
  - `print.js`
  - `app.js` initializer
- Add automated browser checks for storage, validation, and print gating.
- Add an optional service worker only if offline behavior becomes a requirement.
- Add a print fixture or screenshot/PDF comparison process for border and one-page checks.
- Consider moving generated dropdown data into explicit constants if staff/contact lists change more often.

## GitHub workflow

Recommended workflow:

1. Create a focused feature branch.
2. Make changes.
3. Test against `QA-CHECKLIST.md`.
4. Verify print preview/PDF output manually for one-page layout and border quality.
5. Merge into `main` only after validation.
