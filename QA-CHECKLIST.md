# QA Checklist

Use this checklist before merging any meaningful change into `main`.

## Basic app loading

- [ ] App opens from the live GitHub Pages URL.
- [ ] No visible browser errors.
- [ ] Toolbar displays correctly.
- [ ] Form displays correctly on desktop.
- [ ] Form displays correctly on iPhone Safari.

## Form fields

- [ ] TOC Form Number starts with a generated value on a fresh form.
- [ ] TOC Form Number allows letters, numbers, dashes, and symbols.
- [ ] Date field populates correctly.
- [ ] Today button updates the main date.
- [ ] Today button updates both signature dates.
- [ ] PO field works and may remain blank.
- [ ] Transferring Party fields save and restore.
- [ ] Receiving Party prefilled company/address/phone/email/city/state/zip fields remain readonly.
- [ ] Receiving Party contact fields save and restore.
- [ ] Transfer Details fields save and restore.

## Dropdowns and Other fields

- [ ] Transfer Method dropdown works.
- [ ] Transfer Method Other field appears only when Other is selected.
- [ ] Receiving Party / Received By contact dropdown includes Ilya Shulyak, Slavic Brychka, and Other.
- [ ] Receiving Party / Received By contact dropdown saves and restores the selected contact.
- [ ] Receiving Party / Received By Other field appears only when Other is selected.
- [ ] Receiving Party / Received By Other field clears when the dropdown changes away from Other.
- [ ] Reason for Transfer dropdown works.
- [ ] Reason Other field appears only when Other is selected.
- [ ] Estimated Weight dropdown includes Less than 100 lbs.
- [ ] Estimated Weight dropdown includes 100-lb increments through 10,000 lbs.
- [ ] Estimated Weight Other field appears only when Other is selected.
- [ ] Manual weight formats correctly.

## Validation

- [ ] Empty required fields are highlighted when Print is selected.
- [ ] Missing signatures are highlighted when Print is selected.
- [ ] Missing Data Destruction Required choice is highlighted when Print is selected.
- [ ] Missing Certificate Required choice is highlighted when Print is selected.
- [ ] State field accepts valid two-letter state abbreviations.
- [ ] State field uppercases entries.
- [ ] State field rejects invalid abbreviations.
- [ ] Phone fields format consistently.
- [ ] Email fields behave as email inputs.
- [ ] Radio button groups allow only one selected option.
- [ ] Print warning modal appears when required information is missing.
- [ ] Continue Filling Out closes the warning modal without printing.
- [ ] Print Anyway opens print despite missing information.

## Signatures

- [ ] Transferring Party signature modal opens.
- [ ] Receiving Party signature modal opens.
- [ ] Signature modal subtitle matches the active signature box.
- [ ] Signature can be drawn with mouse.
- [ ] Signature can be drawn with touch.
- [ ] Clear button removes signature.
- [ ] Done button saves signature.
- [ ] Signature date stamps when a signature is saved and the date field is blank.
- [ ] Saved signature persists after refresh.
- [ ] New button clears both signatures.

## Local storage and reset

- [ ] Entered data persists after refresh.
- [ ] Stored signatures persist after refresh.
- [ ] New button asks for confirmation.
- [ ] New button clears all editable fields.
- [ ] New button clears all hidden Other values.
- [ ] New button clears signatures.
- [ ] New button repopulates today’s date fields.
- [ ] New button generates a fresh TOC Form Number.
- [ ] No stale customer data reappears after reset.
- [ ] App recovers gracefully if stored JSON is corrupted.

## Print/PDF

- [ ] Print preview fits on one Letter page at 100% scale.
- [ ] Print preview does not require custom scaling.
- [ ] Printed/PDF output remains one page after all fields are completed.
- [ ] Header is centered and visually balanced.
- [ ] All boxes have clear divider lines.
- [ ] Border weight is consistent and visible in browser print preview.
- [ ] Border quality remains clean in saved PDF output.
- [ ] Receiving Party section has uniform boxes.
- [ ] Transfer Details section has proper divider lines.
- [ ] Signature section is clean and proportional.
- [ ] App toolbar does not print.
- [ ] Print warning modal does not print.
- [ ] Signature modal does not print.
- [ ] Tap hints and clear-signature controls do not print.
- [ ] Empty signature boxes print cleanly.
- [ ] Completed signature images print cleanly.

## iPhone / PWA

- [ ] App can be added to iPhone Home Screen.
- [ ] Home Screen app opens the correct page.
- [ ] Form remains usable in standalone mode.
- [ ] Signatures work in standalone mode.
- [ ] Local data persists in standalone mode.
- [ ] App remains portrait-oriented in normal field use.
- [ ] Expected behavior is documented that offline use is not guaranteed because no service worker is registered.

## Final review

- [ ] README is still accurate.
- [ ] Technical notes are still accurate.
- [ ] Final QA status note is current.
- [ ] No private customer data, credentials, or internal-only secrets are in source code.
- [ ] Changes were made on a branch.
- [ ] PR description explains what changed.
- [ ] Print was tested before merge.
