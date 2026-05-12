# QA Checklist

Use this checklist before merging any meaningful change into `main`.

## Basic app loading

- [ ] App opens from the live GitHub Pages URL.
- [ ] No visible browser errors.
- [ ] Toolbar displays correctly.
- [ ] Form displays correctly on desktop.
- [ ] Form displays correctly on iPhone Safari.

## Form fields

- [ ] TOC Form Number starts blank.
- [ ] TOC Form Number allows letters, numbers, dashes, and symbols.
- [ ] Date field populates in `MM/DD/YYYY` format.
- [ ] Main date field auto-formats typed digits as `MM/DD/YYYY`.
- [ ] Main date field rejects invalid dates.
- [ ] Today button updates the main date in `MM/DD/YYYY` format.
- [ ] Today button updates both signature dates in `MM/DD/YYYY` format.
- [ ] PO field works.
- [ ] Transferring Party fields save and restore.
- [ ] Receiving Party fields save and restore.
- [ ] Transfer Details fields save and restore.

## Dropdowns and Other fields

- [ ] Transfer Method dropdown works.
- [ ] Transfer Method Other field appears only when Other is selected.
- [ ] Received By dropdown works.
- [ ] Received By Other field appears only when Other is selected.
- [ ] Reason for Transfer dropdown works.
- [ ] Reason Other field appears only when Other is selected.
- [ ] Estimated Weight dropdown includes Less than 100 lbs.
- [ ] Estimated Weight dropdown includes 100-lb increments through 10,000 lbs.
- [ ] Estimated Weight Other field appears only when Other is selected.
- [ ] Manual weight formats correctly.

## Validation

- [ ] State field accepts valid two-letter state abbreviations.
- [ ] State field uppercases entries.
- [ ] State field rejects invalid abbreviations.
- [ ] Phone fields format consistently.
- [ ] Email fields behave as email inputs.
- [ ] Radio button groups allow only one selected option.
- [ ] Signature date fields auto-format typed digits as `MM/DD/YYYY`.
- [ ] Signature date fields reject invalid dates.

## Signatures

- [ ] Transferring Party signature modal opens.
- [ ] Receiving Party signature modal opens.
- [ ] Signature can be drawn with mouse.
- [ ] Signature can be drawn with touch.
- [ ] Clear button removes signature.
- [ ] Done button saves signature.
- [ ] Done button stamps a blank signature date as `MM/DD/YYYY`.
- [ ] Saved signature persists after refresh.
- [ ] New button clears both signatures.

## Local storage and reset

- [ ] Entered data persists after refresh.
- [ ] New button asks for confirmation.
- [ ] New button clears all fields.
- [ ] New button clears all hidden Other values.
- [ ] New button clears signatures.
- [ ] New button repopulates today’s date fields.
- [ ] No stale customer data reappears after reset.

## Print/PDF

- [ ] Print preview fits on one Letter page at 100% scale.
- [ ] Print preview does not require custom scaling.
- [ ] Header is centered and visually balanced.
- [ ] All boxes have clear divider lines.
- [ ] Receiving Party section has uniform boxes.
- [ ] Transfer Details section has proper divider lines.
- [ ] Signature section is clean and proportional.
- [ ] App toolbar does not print.
- [ ] Empty signature boxes print cleanly.
- [ ] Completed signature images print cleanly.

## iPhone / PWA

- [ ] App can be added to iPhone Home Screen.
- [ ] Home Screen app opens the correct page.
- [ ] Form remains usable in standalone mode.
- [ ] Signatures work in standalone mode.
- [ ] Local data persists in standalone mode.

## Final review

- [ ] README is still accurate.
- [ ] No private customer data, credentials, or internal-only secrets are in source code.
- [ ] Changes were made on a branch.
- [ ] PR description explains what changed.
- [ ] Print was tested before merge.
