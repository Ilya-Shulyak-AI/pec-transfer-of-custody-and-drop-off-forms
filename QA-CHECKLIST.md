# QA Checklist

Use this checklist before merging any meaningful change into `main`.

## Basic app loading

- [ ] App opens from the live GitHub Pages URL.
- [ ] No visible browser errors.
- [ ] Toolbar displays correctly.
- [ ] Form displays correctly on desktop.
- [ ] Form displays correctly on iPhone Safari.
- [ ] Validation banner is hidden until validation is needed.

## Form fields

- [ ] TOC Form # starts blank on a fresh form.
- [ ] TOC Form # is not auto-generated.
- [ ] TOC Form # allows letters, numbers, dashes, and symbols.
- [ ] Date field populates correctly as MM/DD/YYYY.
- [ ] Today button updates the main date.
- [ ] Today button updates both signature dates.
- [ ] PO field works and remains optional.
- [ ] Transferring Party fields save and restore.
- [ ] Receiving Party fields save and restore.
- [ ] Transfer Details fields save and restore.

## Receiving Party contact workflow

- [ ] Contact Name is a dropdown.
- [ ] Selecting Ilya Shulyak fills Receiving Party phone as (402) 413-1267.
- [ ] Selecting Ilya Shulyak makes the Receiving Party phone read-only.
- [ ] Selecting Other shows the manual contact-name field beside the dropdown on desktop.
- [ ] Selecting Other clears the default phone and allows manual phone entry.
- [ ] Other contact name and manual phone persist after refresh.

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

- [ ] Required blank fields are highlighted before printing.
- [ ] Validation banner summarizes missing and invalid fields.
- [ ] Print warning modal allows continuing to edit.
- [ ] Print warning modal allows printing anyway.
- [ ] State field accepts valid two-letter state abbreviations.
- [ ] State field uppercases entries.
- [ ] State field rejects invalid abbreviations.
- [ ] Phone fields format consistently.
- [ ] Email fields behave as email inputs.
- [ ] Date fields validate MM/DD/YYYY format.
- [ ] Radio button groups allow only one selected option.

## Signatures

- [ ] Transferring Party signature modal opens.
- [ ] Receiving Party signature modal opens.
- [ ] Signature can be drawn with mouse.
- [ ] Signature can be drawn with touch.
- [ ] Clear button removes signature.
- [ ] Clear button clears the related signature date.
- [ ] Done button saves signature.
- [ ] Saved signature persists after refresh.
- [ ] New button clears both signatures.
- [ ] Escape closes open modals.

## Local storage and reset

- [ ] Entered data persists after refresh.
- [ ] New button asks for confirmation.
- [ ] New button clears all fields.
- [ ] New button clears all hidden Other values.
- [ ] New button clears signatures.
- [ ] New button repopulates today’s date fields.
- [ ] New button does not repopulate TOC Form #.
- [ ] No stale customer data reappears after reset.

## Print/PDF

- [ ] Print preview fits on one Letter page at 100% scale.
- [ ] Print preview does not require custom scaling.
- [ ] Header is centered and visually balanced.
- [ ] TOC/date row is visually separated from PO row.
- [ ] All boxes have clear divider lines.
- [ ] Receiving Party section has uniform boxes.
- [ ] Pre-filled Receiving Party fields are not blue-highlighted.
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
