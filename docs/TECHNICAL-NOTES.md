# Technical Notes

## Project purpose

This application is a lightweight browser-based Transfer of Custody form for Precision E-Cycle.

Primary goals:
- Mobile-first workflow.
- Fast in-field use.
- Local-only storage of customer data.
- Printable one-page PDF output.
- iPhone Home Screen compatibility.

## Current architecture

Current application stack:
- Static HTML
- CSS
- Vanilla JavaScript
- GitHub Pages hosting
- LocalStorage persistence

Current files:
- `index.html` provides the data-entry form, print container, and modals.
- `styles.css` provides screen/mobile styling.
- `print.css` provides the Letter-size print stylesheet.
- `app.js` provides constants, formatting, validation, storage, conditional fields, signatures, modal handling, and print rendering.

## Storage model

Form data is stored in browser LocalStorage only. There is no backend database.

The current storage key is `pec_toc_form_v7`. Older `pec_toc_form_v2` through `pec_toc_form_v6` payloads are read as fallbacks for continuity.

Signatures are stored separately under the `pec_toc_sig_` key prefix.

## Form workflow

The TOC Form # is intentionally manual. The app no longer generates a TOC number.

Receiving Party Contact Name is a dropdown:
- `Ilya Shulyak` auto-fills `(402) 413-1267` and makes the phone field read-only.
- `Other` shows a manual contact-name field and leaves the phone field editable.

## Signature handling

Signature capture uses a canvas modal and Pointer Events for mouse, touch, and stylus support. Saved signatures are cropped before being stored as Base64 PNG data in LocalStorage.

Clearing a signature removes the stored image and clears the related signature date.

## Validation

Required-field validation is centralized in `app.js`. Conditional Other fields are required only when their related dropdown is set to Other.

Before printing, missing fields, invalid fields, missing radio groups, and missing signatures are highlighted. A visible validation banner and print-warning modal summarize the issues while still allowing Print Anyway.

## Print system

The app renders a dedicated print-only document into `#printPage` before printing and on the browser `beforeprint` event.

The print layer uses plain text and signature images instead of browser-native input/select controls. This keeps print output more stable and avoids control-rendering differences between browsers.

`print.css` uses Letter portrait paper with a safe page margin and a single table-like border system for cleaner dividers.

## Future improvements

Potential next improvements:
1. Add automated Playwright/Puppeteer PDF regression checks.
2. Add PNG PWA icons for stronger iPhone Home Screen support.
3. Consider self-hosting fonts or using a full system-font stack for better offline/print consistency.
4. Split `app.js` into separate modules if the app grows beyond this single-form workflow.

## GitHub workflow

Recommended workflow:
1. Create feature branch.
2. Make changes.
3. Test against `QA-CHECKLIST.md`.
4. Merge into main only after validation.
