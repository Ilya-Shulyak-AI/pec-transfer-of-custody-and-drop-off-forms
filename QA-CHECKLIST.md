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

- [ ] TOC Form Number allows letters, numbers, dashes, and symbols.
- [ ] Clear Saved Data clears the TOC Form Number after confirmation and does not repopulate it.
- [ ] Date fields can be entered manually in MM/DD/YYYY format.
- [ ] Today button updates the main date.
- [ ] Today button updates both signature dates.
- [ ] PO field works and may remain blank.
- [ ] Transferring Party fields save and restore.
- [ ] Receiving Party prefilled company/address/phone/email/city/state/zip fields remain readonly.
- [ ] Receiving Party Received By selection saves and restores.
- [ ] Transfer Details fields save and restore.

## Receiving Party workflow

- [ ] Contact Name is not shown in the Receiving Party section.
- [ ] Receiving Party phone is prefilled as (402) 540-6965 and remains read-only.
- [ ] Received By is the only editable control in the Receiving Party section.
- [ ] Selecting Other shows the manual receiver-name field beside the dropdown on desktop.
- [ ] Other receiver name persists after refresh when visible/relevant.

## Dropdowns and Other fields

- [ ] Transfer Method dropdown works.
- [ ] Transfer Method Other field appears only when Other is selected.
- [ ] Receiving Party / Received By dropdown includes Ilya Shulyak, Slavic Brychka, Roman Stepanyuk, Ilya Dubina, Phillip Popov, and Other.
- [ ] Receiving Party / Received By contact dropdown saves and restores the selected contact.
- [ ] Receiving Party / Received By Other field appears only when Other is selected.
- [ ] Receiving Party / Received By Other field clears when the dropdown changes away from Other.
- [ ] Reason for Transfer dropdown works.
- [ ] Reason Other field appears only when Other is selected.
- [ ] Reason Other field is required only when Reason for Transfer is Other.
- [ ] Estimated Weight dropdown includes Less than 100 lbs.
- [ ] Estimated Weight dropdown includes 100-lb increments through 10,000 lbs.
- [ ] Estimated Weight Other field appears only when Other is selected.
- [ ] Estimated Weight Other field is required only when Estimated Weight is Other.
- [ ] Manual weight formats correctly.

## Validation

- [ ] Empty required fields are highlighted when Print is selected.
- [ ] Missing signatures are highlighted when Print is selected.
- [ ] Missing Certificate Required choice is highlighted when Print is selected.
- [ ] State field accepts valid two-letter state abbreviations.
- [ ] State field uppercases entries.
- [ ] State field rejects invalid abbreviations.
- [ ] Phone fields format consistently.
- [ ] Email fields behave as email inputs.
- [ ] Date fields validate MM/DD/YYYY format.
- [ ] Radio button groups allow only one selected option.
- [ ] Print warning modal appears when required information is missing.
- [ ] Continue Editing closes the warning modal without printing.
- [ ] Print Anyway opens print despite missing information.

## Signatures

- [ ] Transferring Party signature modal opens.
- [ ] Receiving Party signature modal opens.
- [ ] Signature modal subtitle matches the active signature box.
- [ ] Signature can be drawn with mouse.
- [ ] Signature can be drawn with touch.
- [ ] Clear button removes signature.
- [ ] Clearing the Transferring Party signature removes its image and clears the Transferring Party signature date.
- [ ] After clearing the Transferring Party signature and refreshing, the Transferring Party signature image and date remain empty and `localStorage.pec_toc_sig_1` is absent.
- [ ] Clearing the Receiving Party signature removes its image and clears the Receiving Party signature date.
- [ ] After clearing the Receiving Party signature and refreshing, the Receiving Party signature image and date remain empty and `localStorage.pec_toc_sig_2` is absent.
- [ ] Done button saves signature.
- [ ] Signature date stamps when a signature is saved and the date field is blank.
- [ ] Saved signature persists after refresh.
- [ ] Clear Saved Data button clears both signatures.

## Local storage and reset

- [ ] Entered data persists after refresh.
- [ ] Signatures persist after refresh.
- [ ] Clear Saved Data confirmation mentions local saved form data and signatures.
- [ ] Clear Saved Data clears all editable fields.
- [ ] Clear Saved Data clears all hidden Other values.
- [ ] Clear Saved Data clears signatures.
- [ ] Local data note is visible and accurately explains local saved data behavior.
- [ ] Saved-at timestamp is visible and updates after a successful save.
- [ ] Visible warning appears when storage is blocked or full.
- [ ] Console logs storage failures without breaking the form workflow.
- [ ] No stale customer data reappears after reset.
- [ ] App recovers gracefully if stored JSON is corrupted where practical.

## Automated print validation

- [ ] Run `npm install` if Node dependencies are not already installed.
- [ ] Run `npx playwright install chromium` if the Playwright Chromium browser has not already been installed.
- [ ] Run `npm test` before deployment.
- [ ] Confirm the standalone Playwright checks report passing output.
- [ ] Review `test-results/print-validation/toc-print-validation.pdf` and `test-results/print-validation/toc-print-validation.png` if a visual spot-check is needed.

## Print/PDF

- [ ] Run `npm test` before merging print-related changes.
- [ ] Review `test-artifacts/print-output.pdf` or `test-artifacts/print-output.png` manually when border/divider quality changes.
- [ ] Print preview fits on one Letter page at 100% scale.
- [ ] Print preview does not require custom scaling.
- [ ] Printed/PDF output remains one page after all fields are completed.
- [ ] Header is centered and visually balanced.
- [ ] TOC/date row is visually separated from PO row.
- [ ] All boxes have clear divider lines.
- [ ] Border weight is consistent and visible in browser print preview.
- [ ] Border quality remains clean in saved PDF output.
- [ ] Receiving Party section has uniform boxes.
- [ ] Pre-filled Receiving Party fields are not blue-highlighted.
- [ ] Transfer Details section has proper divider lines.
- [ ] Signature section is clean and proportional.
- [ ] App toolbar does not print.
- [ ] Print warning modal does not print.
- [ ] Storage warning does not print.
- [ ] Local data note does not print.
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
