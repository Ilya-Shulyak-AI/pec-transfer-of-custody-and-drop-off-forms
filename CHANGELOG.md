# Changelog

All notable changes to this project should be documented in this file.

## [Unreleased]

### Added
- QA checklist for regression testing.
- Stabilization and hardening branch structure.
- Backup branch before major architecture cleanup.
- Technical notes document.
- PWA manifest.
- Cache-busted asset links.
- Placeholder base and print stylesheets for CSS extraction.

### Changed
- Removed inline JavaScript handlers from HTML.
- Converted HTML behavior wiring to data attributes.
- Refactored JavaScript into centralized event delegation.
- Added storage versioning and compatibility handling.
- Hardened localStorage reads/writes.
- Added corrupted-storage recovery behavior.
- Added centralized validation rules for state, email, phone, and manual weight.
- Improved signature canvas scaling.
- Added signature cropping.
- Improved reset behavior.

### Remaining
- Fully extract print CSS into dedicated print stylesheet.
- Rebuild print layout cleanly.
- Reduce monolithic CSS.
- Add real app icons.
- Add PR and issue templates.
- Final QA pass before merging.
