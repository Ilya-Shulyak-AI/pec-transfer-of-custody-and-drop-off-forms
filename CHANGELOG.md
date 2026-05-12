# Changelog

All notable changes to this project should be documented in this file.

## [Current]

### Form and print cleanup

- Changed the TOC label to TOC Form # and removed automatic TOC number generation.
- Added Receiving Party Contact Name dropdown workflow with Ilya Shulyak autofill and Other/manual phone behavior.
- Added a visible validation banner and more detailed pre-print validation summary.
- Standardized dates to MM/DD/YYYY.
- Reworked signature input to Pointer Events and improved signature clear behavior.
- Added a dedicated print-only render layer so PDFs use stable text/images instead of native form controls.
- Rebuilt `print.css` into a readable Letter-page stylesheet with safer margins and consistent borders.
- Removed blue pre-fill highlighting from Receiving Party fields.
- Reformatted core HTML, CSS, and JavaScript for maintainability.
- Updated README, QA checklist, and technical notes to match current behavior.

## [Previous hardening]

- Removed inline JavaScript handlers.
- Centralized event delegation.
- Added storage versioning and compatibility handling.
- Hardened localStorage reads/writes.
- Added corrupted-storage recovery behavior.
- Added centralized validation rules.
- Improved signature canvas scaling.
- Added signature cropping.
- Improved reset behavior.
- Added PWA manifest support.
- Added cache-busted asset loading.
- Separated print CSS from screen CSS.
- Added QA documentation.
- Added technical documentation.
- Added version tracking.
- Added accessibility improvements.
- Added app icon support.

## [Future improvements]

- Add automated PDF regression testing.
- Add PNG PWA and Apple touch icons.
- Optional offline service worker support.
- Optional multi-form support.
- Optional backend/email integration.
