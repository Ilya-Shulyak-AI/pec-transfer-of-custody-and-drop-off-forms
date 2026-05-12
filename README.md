# PEC Transfer of Custody

Public GitHub Pages project for the Precision E-Cycle Transfer of Custody form.

## Live app

https://ilya-shulyak-ai.github.io/pec-transfer-of-custody/

## Purpose

This repository holds the working code for Precision E-Cycle's Transfer of Custody form app.

## Use on iPhone

1. Open the live app link in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Open the app from the Home Screen.

## Data storage

The form stores entered data and signatures locally in the browser on the device being used. It does not use a backend database.

Use the New button after finishing a form to clear local form data and signatures before starting another form. The New button does not create a TOC number; the TOC Form # is intentionally entered manually.

## Form behavior

- TOC Form # starts blank and must be entered manually.
- The main Date and both signature dates use MM/DD/YYYY.
- Receiving Party Contact Name is selected from a dropdown.
- Selecting Ilya Shulyak fills the Receiving Party phone as `(402) 413-1267`.
- Selecting Other exposes a manual contact-name field and leaves the phone field editable.

## Printing

Use the Print button to print or save as PDF. Before printing, the app renders a print-only version of the form so the PDF does not depend on browser-native input and select control rendering.

The print layout is controlled by `print.css`, uses Letter portrait paper with a safe page margin, and is intended to fit on one page at 100% scale.

## Current app status

The current app is the Transfer of Custody form. The Drop-Off form / multi-form selection page is not currently present in this repository.

## Current architecture

- `index.html` contains the screen form, modal structure, and print-only container.
- `styles.css` controls screen/app styling.
- `print.css` controls print/PDF styling.
- `app.js` controls form behavior, local storage, validation, print rendering, and signatures.
- `manifest.webmanifest` controls PWA/Home Screen metadata.
- `icon.svg` provides the app icon.

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

## Notes

This repository is public so GitHub Pages can host the app on a free personal GitHub account. Do not add private customer data, credentials, API keys, or internal-only process details to the source code.
