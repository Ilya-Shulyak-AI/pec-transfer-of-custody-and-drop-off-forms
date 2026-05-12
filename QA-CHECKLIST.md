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
- [ ] Date field populates correctly.
- [ ] Today button updates the main date.
- [ ] Today button updates both signature dates.
- [ ] PO field works.
- [ ] Blank PO field remains valid and does not block print.
- [ ] Transferring Party fields save and restore.
- [ ] Receiving Party fields save and restore.
- [ ] Transfer Details fields save and restore.

## Dropdowns and Other fields

- [ ] Transfer Method dropdown works.
- [ ] Transfer Method Other field appears only when Other is selected.
- [ ] Transfer Method Other field is required only when Transfer Method is Other.
- [ ] Received By dropdown works.
- [ ] Received By Other field appears only when Other is selected.
- [ ] Received By Other field is required only when Received By is Other.
- [ ] Receiver phone is prefilled/read-only for listed contacts.
- [ ] Receiver phone is editable and required when Received By is Other.
- [ ] Reason for Transfer dropdown works.
- [ ] Reason Other field appears only when Other is selected.
- [ ] Reason Other field is required only when Reason for Transfer is Other.
- [ ] Estimated Weight dropdown includes Less than 100 lbs.
- [ ] Estimated Weight dropdown includes 100-lb increments through 10,000 lbs.
- [ ] Estimated Weight Other field appears only when Other is selected.
- [ ] Estimated Weight Other field is required only when Estimated Weight is Other.
- [ ] Manual weight formats correctly.

## Validation

- [ ] Print warns when any explicitly required blank field is empty.
- [ ] Blank optional fields do not trigger required-field warnings.
- [ ] Prefilled/read-only Precision E-Cycle fields remain populated and validate intentionally.
- [ ] State field accepts valid two-letter state abbreviations.
- [ ] State field uppercases entries.
- [ ] State field rejects invalid abbreviations.
- [ ] Phone fields format consistently.
- [ ] Email fields behave as email inputs.
- [ ] Radio button groups allow only one selected option.

## Signatures

- [ ] Transferring Party signature modal opens.
- [ ] Receiving Party signature modal opens.
- [ ] Signature can be drawn with mouse.
- [ ] Signature can be drawn with touch.
- [ ] Clear button removes signature.
- [ ] Done button saves signature.
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
