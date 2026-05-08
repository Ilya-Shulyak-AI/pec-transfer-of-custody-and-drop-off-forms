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

## Planned architecture improvements

### JavaScript modularization

Planned modules:
- app.js
- constants.js
- storage.js
- validation.js
- signatures.js
- print.js

## Storage model

Form data is currently stored in browser LocalStorage only.

No backend database exists.

## Signature handling

Current implementation uses canvas-based signatures stored locally as Base64 image data.

Planned improvements:
- Cropping
- Better scaling
- Better mobile touch handling
- Improved print rendering
- Better cleanup/reset handling

## Print system

Current print layout relies on dedicated print CSS.

Planned improvements:
- Separate print stylesheet
- Uniform field sizing
- Stable one-page Letter layout
- Cleaner typography hierarchy
- Better divider rendering

## GitHub workflow

Planned workflow:
1. Create feature branch.
2. Make changes.
3. Test with QA checklist.
4. Merge into main only after validation.
