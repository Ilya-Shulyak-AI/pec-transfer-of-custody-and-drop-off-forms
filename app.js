(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants and application configuration
  // ---------------------------------------------------------------------------

  const APP = {
    storage: {
      formKey: 'pec_toc_form_v6',
      oldFormKeys: ['pec_toc_form_v5', 'pec_toc_form_v4', 'pec_toc_form_v3', 'pec_toc_form_v2'],
      signatureKeyPrefix: 'pec_toc_sig_',
      payloadVersion: 6
    },
    get storageKey() { return this.storage.formKey; },
    get oldStorageKeys() { return this.storage.oldFormKeys; },
    get signatureKeyPrefix() { return this.storage.signatureKeyPrefix; },
    ids: {
      tocFormNumber: 'tocFormNumber',
      validationBanner: 'validationBanner',
      printWarningModal: 'printWarningModal',
      stateOptions: 'stateOptions',
      estimatedWeight: 'estimatedWeight',
      signatureModal: 'sigModal',
      signatureModalDone: 'sigModalDone',
      signatureModalSubtitle: 'sigModalSub',
      signatureModalWrap: 'sigModalWrap',
      signatureCanvas: 'sigCanvas',
      signaturePreviewPrefix: 'sigPreview',
      signatureBoxPrefix: 'sigBox',
      signatureDates: {
        1: 'transferSignatureDate',
        2: 'receiverSignatureDate'
      }
    },
    selectors: {
      fieldContainer: '.fld, .meta-item',
      missingField: '.field-missing',
      otherWrap: '.other-wrap',
      saveField: '[data-save="true"]',
      otherSelect: 'select[data-other-target]',
      formattedField: '[data-format]',
      action: '[data-action]',
      signatureBox: '[data-signature-box]'
    },
    actions: {
      newForm: 'new-form',
      print: 'print',
      forcePrint: 'force-print',
      continueEditing: 'continue-editing',
      today: 'today',
      clearSignature: 'clear-signature',
      modalClearSignature: 'modal-clear-signature',
      modalSaveSignature: 'modal-save-signature'
    },
    states: [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ],
    dateFields: ['formDate', 'transferSignatureDate', 'receiverSignatureDate'],
    signatureIds: ['1', '2'],
    radioGroups: ['dataDestruction', 'certificateRequired'],
    requiredFieldIds: [
      'tocFormNumber',
      'formDate',
      'fromCompanyName',
      'fromContactName',
      'fromAddress',
      'fromPhone',
      'fromEmail',
      'fromCity',
      'fromState',
      'fromZip',
      'transferMethod',
      'receiverContactName',
      'receivedBy',
      'reasonSelect',
      'estimatedWeight',
      'totalUnits',
      'transferSignatureDate',
      'receiverSignatureDate'
    ],
    optionalFieldIds: ['poNumber'],
    prefilledRequiredFieldIds: [
      'receiverCompanyName',
      'receiverAddress',
      'receiverEmail',
      'receiverCity',
      'receiverState',
      'receiverZip'
    ],
    conditionalRequiredFields: [
      { fieldId: 'transferMethodOther', controllerId: 'transferMethod', requiredValue: 'Other' },
      { fieldId: 'receiverContactNameOther', controllerId: 'receiverContactName', requiredValue: 'Other' },
      { fieldId: 'receivedByOther', controllerId: 'receivedBy', requiredValue: 'Other' },
      { fieldId: 'receiverPhone', controllerId: 'receiverContactName', requiredValue: 'Other' },
      { fieldId: 'reasonOther', controllerId: 'reasonSelect', requiredValue: 'Other' },
      { fieldId: 'estimatedWeightOther', controllerId: 'estimatedWeight', requiredValue: 'Other' }
    ],
    receiverPhoneByContact: {
      'Ilya Shulyak': '(402) 413-1267'
    },
    defaultReceiverPhone: '(402) 540-6965',
    requiredRadioGroups: { dataDestruction: 'Data Destruction Required', certificateRequired: 'Certificate Required' }
  };

  const APP = {
    ...CONFIG,
    storageKey: CONFIG.storage.formKey,
    oldStorageKeys: CONFIG.storage.oldFormKeys,
    signatureKeyPrefix: CONFIG.storage.signatureKeyPrefix,
    payloadVersion: CONFIG.storage.payloadVersion
  };

  const state = { sigCanvas: null, sigCtx: null, isSigning: false, hasMark: false, activeSig: '1', activePointerId: null, signatureStorageFailed: false };
  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function classifyStorageError(error) {
    if (!error) return 'unexpected';
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014) return 'quota';
    if (error.name === 'SecurityError' || error.name === 'NotAllowedError' || error.code === 18) return 'security';
    return 'unexpected';
  }
  function safeLocalStorage(action, fallback = null, details = {}) {
    try {
      return action(window.localStorage);
    } catch (error) {
      const failureType = classifyStorageError(error);
      const operation = details.operation || 'access local storage';
      console.warn(`Local storage ${failureType} failure during ${operation}:`, error);
      return fallback;
    }
  }
  function formatSavedAt(isoValue) {
    if (!isoValue) return 'Not saved yet';
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return 'Saved time unavailable';
    return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  }
  function setSavedAtDisplay(isoValue) { const el = $('savedAtStatus'); if (el) el.textContent = 'Last saved in this browser: ' + formatSavedAt(isoValue); }
  function showStorageWarning() { const el = $('storageWarning'); if (!el) return; el.textContent = 'Warning: This browser could not save the latest form data/signature. Print or save a PDF before leaving, then clear browser storage or try another browser/device.'; el.classList.add('show'); }
  function hideStorageWarning() { const el = $('storageWarning'); if (el) el.classList.remove('show'); }
  function formatDate() { const n = new Date(); return String(n.getMonth() + 1).padStart(2, '0') + ' / ' + String(n.getDate()).padStart(2, '0') + ' / ' + n.getFullYear(); }
  function formatDateCompact() { return formatDate().replace(/\s/g, ''); }
  function formatDateInputValue(value) { const digits = String(value || '').replace(/\D/g, '').slice(0, 8); if (digits.length > 4) return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4); if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2); return digits; }
  function isValidFormattedDate(value) { return /^(0[1-9]|1[0-2])\s*\/\s*(0[1-9]|[12]\d|3[01])\s*\/\s*\d{4}$/.test(String(value || '').trim()); }
  function setTodayAllDates() { const today = formatDate(); APP.dateFields.forEach((id) => { const el = $(id); if (el) el.value = today; }); saveToStorage(); }
  function getSignatureDateFieldId(signatureId) { const id = String(signatureId); if (id === '1') return 'transferSignatureDate'; if (id === '2') return 'receiverSignatureDate'; return ''; }
  function stampSignatureDate(signatureId) { const targetId = getSignatureDateFieldId(signatureId); const el = targetId ? $(targetId) : null; if (el && !String(el.value || '').trim()) el.value = formatDate(); }
  function clearSignatureDate(signatureId) { const targetId = getSignatureDateFieldId(signatureId); const el = targetId ? $(targetId) : null; if (el) { el.value = ''; setValidity(el, ''); markField(el, false); } }
  function formatPhoneValue(value) { let v = value.replace(/\D/g, '').substring(0, 10); if (v.length >= 6) return '(' + v.substring(0, 3) + ') ' + v.substring(3, 6) + '-' + v.substring(6); if (v.length >= 3) return '(' + v.substring(0, 3) + ') ' + v.substring(3); return v; }
  function formatManualWeightValue(value) { const digits = value.replace(/\D/g, ''); return digits ? Number(digits).toLocaleString('en-US') : ''; }
  function normalizeStateValue(value) { return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2); }
  function setValidity(el, message) { if (!el || typeof el.setCustomValidity !== 'function') return; el.setCustomValidity(message || ''); }
  function ensureTocFormNumber() {
    const el = $(APP.ids.tocFormNumber);
    if (el && !String(el.value || '').trim()) el.value = 'TOC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }
  function getRadioGroupValue(name) { const selected = document.querySelector(`input[name="${name}"]:checked`); return selected ? selected.value : ''; }
  function setRadioGroupValue(name, value) { $$(`input[name="${name}"]`).forEach((el) => { el.checked = el.value === value; }); }
  function findFieldContainer(el) { return el?.closest('.fld, .meta-item'); }
  function markField(el, isMissing) { const container = findFieldContainer(el); if (container) container.classList.toggle('field-missing', Boolean(isMissing)); }
  function clearMissingHighlights() { $$('.field-missing').forEach((el) => el.classList.remove('field-missing')); }
  function isHiddenByOtherWrap(el) { const wrap = el.closest('.other-wrap'); return wrap && getComputedStyle(wrap).display === 'none'; }
  function signatureIsMissing(id) { const preview = $('sigPreview' + id); return !preview || !preview.src || preview.style.display === 'none'; }
  function markSignatureBoxes(mark) { const missing = []; APP.signatureIds.forEach((id) => { const isMissing = signatureIsMissing(id); if (isMissing) missing.push(id); if (mark) $('sigBox' + id)?.classList.toggle('field-missing', isMissing); }); return missing; }
  function fieldIsListed(id, listName) { return APP[listName].includes(id); }
  function conditionalRuleApplies(rule) { const controller = $(rule.controllerId); return controller && controller.value === rule.requiredValue; }
  function isConditionallyRequired(id) { return APP.conditionalRequiredFields.some((rule) => rule.fieldId === id && conditionalRuleApplies(rule)); }
  function isRequiredField(el) {
    if (!el || !el.id || el.type === 'radio' || el.disabled) return false;
    if (fieldIsListed(el.id, 'optionalFieldIds')) return false;
    if (isHiddenByOtherWrap(el) && !isConditionallyRequired(el.id)) return false;
    return fieldIsListed(el.id, 'requiredFieldIds') || fieldIsListed(el.id, 'prefilledRequiredFieldIds') || isConditionallyRequired(el.id);
  }
  function isEmptyRequiredField(el) { return isRequiredField(el) && !String(el.value || '').trim(); }
  function isEmptyExpectedField(el) { return isEmptyRequiredField(el); }
  function fieldHasInvalidValue(el) {
    const value = String(el.value || '').trim();
    if (!value) return false;
    if (el.dataset.format === 'state') return !APP.states.includes(value.toUpperCase());
    if (el.dataset.format === 'date') return !isValidFormattedDate(value);
    if (el.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (el.type === 'tel') {
      const digits = value.replace(/\D/g, '');
      return digits.length > 0 && digits.length !== 10;
    }
    if (el.dataset.format === 'weight') return Number(value.replace(/\D/g, '')) <= 0;
    if (APP.dateFields.includes(el.id)) return !isValidFormattedDate(value);
    return false;
  }
  function validateRequiredRadioGroups(mark = false) { const missing = []; Object.entries(APP.requiredRadioGroups).forEach(([groupName, label]) => { const checked = Boolean(getRadioGroupValue(groupName)); if (!checked) missing.push(label); if (mark) $$(`input[name="${groupName}"]`).forEach((el) => markField(el, !checked)); }); return missing; }
  function validateField(el, mark = false) { if (!el || !el.id) return true; const missing = isEmptyRequiredField(el); const invalid = fieldHasInvalidValue(el); const message = APP.dateFields.includes(el.id) && invalid ? 'Use MM/DD/YYYY.' : 'Please check this field.'; setValidity(el, invalid ? message : ''); if (mark) markField(el, missing || invalid); return !missing && !invalid; }
  function validateAllFields(mark = false) { if (mark) clearMissingHighlights(); const fieldResults = getSaveFields().map((el) => validateField(el, mark)); const missingRadioGroups = validateRequiredRadioGroups(mark); const missingSignatures = markSignatureBoxes(mark); return { isValid: fieldResults.every(Boolean) && missingRadioGroups.length === 0 && missingSignatures.length === 0, missingRadioGroups, missingSignatures }; }
  function validateConditionalFieldsForController(controllerId, mark = false) { APP.conditionalRequiredFields.filter((rule) => rule.controllerId === controllerId).forEach((rule) => validateField($(rule.fieldId), mark)); }
  function showValidationBanner() { return; }
  function hideValidationBanner() { return; }
  function getFocusableElements(container) { return $$('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', container).filter((el) => !el.hidden && el.offsetParent !== null); }
  function focusElement(el) { if (el && typeof el.focus === 'function') el.focus({ preventScroll: true }); }
  function focusModal(modal) { if (!modal) return; const firstFocusable = getFocusableElements(modal)[0]; focusElement(firstFocusable || modal); }
  function restoreFocus(el) { if (document.contains(el)) focusElement(el); }
  function openPrintWarningModal(trigger = document.activeElement) { const modal = $('printWarningModal'); if (!modal) return; state.lastPrintTrigger = trigger; modal.classList.add('open'); requestAnimationFrame(() => focusModal(modal)); }
  function closePrintWarningModal() { $('printWarningModal')?.classList.remove('open'); restoreFocus(state.lastPrintTrigger); state.lastPrintTrigger = null; }
  function requestPrint(trigger = document.activeElement) { const result = validateAllFields(true); if (result.isValid) { clearMissingHighlights(); window.print(); } else { openPrintWarningModal(trigger); } }
  function printAnyway() { closePrintWarningModal(); clearMissingHighlights(); window.print(); }
  function formatDateInputValue(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
  }
  function formatFieldValue(el) { const type = el.dataset.format; if (type === 'phone') el.value = formatPhoneValue(el.value); if (type === 'weight') el.value = formatManualWeightValue(el.value); if (type === 'state') el.value = normalizeStateValue(el.value); if (type === 'date') el.value = formatDateInputValue(el.value); }
  function handleFormattedInput(el) { formatFieldValue(el); validateField(el, true); }
  function formatRestoredFields() { getSaveFields().forEach((el) => { if (el.dataset.format) formatFieldValue(el); }); }
  function toggleOtherForSelect(select) { const wrapId = select.dataset.otherTarget; if (!wrapId) return; const wrap = $(wrapId); if (!wrap) return; const show = select.value === 'Other'; wrap.style.display = show ? 'block' : 'none'; const input = wrap.querySelector('input'); if (!show && input) { input.value = ''; setValidity(input, ''); markField(input, false); } }
  function ensureTocFormNumber() { return; }
  function syncReceiverPhone() { const selectedContact = $('receivedBy')?.value || ''; const phone = $('receiverPhone'); if (!phone) return; const knownPhone = APP.receiverPhoneByContact[selectedContact]; if (knownPhone) { phone.value = knownPhone; phone.readOnly = true; } else if (selectedContact === 'Other') { if (phone.value === APP.defaultReceiverPhone || Object.values(APP.receiverPhoneByContact).includes(phone.value)) phone.value = ''; phone.readOnly = false; } else { phone.value = APP.defaultReceiverPhone; phone.readOnly = true; } findFieldContainer(phone)?.classList.toggle('pre-fill', phone.readOnly); setValidity(phone, ''); markField(phone, false); }
  function toggleAllOtherFields() { $$('select[data-other-target]').forEach(toggleOtherForSelect); }
  function applyReceiverContactWorkflow(options = {}) { const contact = $('receiverContactName'); const phone = $('receiverPhone'); if (!contact || !phone) return; const knownPhone = APP.receiverPhoneByContact[contact.value]; phone.readOnly = Boolean(knownPhone); if (knownPhone) phone.value = knownPhone; if ((contact.value === 'Other' || contact.value === '') && options.clearPhone) phone.value = ''; if (phone.dataset.format) formatFieldValue(phone); validateField(phone, false); }
  function populateStateOptions() { const list = $('stateOptions'); if (!list || list.children.length) return; APP.states.forEach((stateAbbr) => { const option = document.createElement('option'); option.value = stateAbbr; list.appendChild(option); }); }
  function populateWeightOptions() {
    const select = $(CONFIG.ids.estimatedWeight);
    if (!select || select.dataset.populated === 'true') return;

    const selectedValue = select.value;
    const optionLabels = [
      '— Select —',
      'Less than 100 lbs',
      ...Array.from({ length: 100 }, (_, index) => ((index + 1) * 100).toLocaleString('en-US') + ' lbs'),
      'Other'
    ];

    select.replaceChildren(...optionLabels.map((label) => {
      const option = document.createElement('option');
      option.value = label === '— Select —' ? '' : label;
      option.textContent = label;
      return option;
    }));
    if (optionLabels.includes(selectedValue)) select.value = selectedValue;
    select.dataset.populated = 'true';
  }
  function validateConditionalFieldsForController(controllerId, mark = false) {
    APP.conditionalRequiredFields
      .filter((rule) => rule.controllerId === controllerId)
      .forEach((rule) => validateField($(rule.fieldId), mark));
  }
  function ensureTocFormNumber() {
    const el = $(CONFIG.ids.tocFormNumber);
    if (!el || String(el.value || '').trim()) return;
    const date = new Date();
    const stamp = String(date.getFullYear()).slice(2) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
    el.value = 'O-' + stamp;
  }
  function getSaveFields() { return $$('[data-save="true"]').filter((el) => el.id); }
  function getFormData() { const data = {}; getSaveFields().forEach((el) => { if (el.type !== 'radio') data[el.id] = el.value; }); APP.radioGroups.forEach((groupName) => { data[groupName] = getRadioGroupValue(groupName); }); return data; }
  function saveToStorage() {
    const payload = { version: APP.storage.payloadVersion, savedAt: new Date().toISOString(), data: getFormData() };
    const saved = safeLocalStorage((storage) => { storage.setItem(APP.storage.formKey, JSON.stringify(payload)); return true; }, false, { operation: 'save form data' });
    if (saved) { if (!state.signatureStorageFailed) hideStorageWarning(); setSavedAtDisplay(payload.savedAt); } else { showStorageWarning(); }
    return saved;
  }
  function readStoredPayload() { return safeLocalStorage((storage) => { const current = storage.getItem(APP.storage.formKey); if (current) return current; for (const key of APP.storage.oldFormKeys) { const oldValue = storage.getItem(key); if (oldValue) return oldValue; } return null; }, null, { operation: 'read saved form data' }); }
  function loadFromStorage() { const saved = readStoredPayload(); if (!saved) { setTodayAllDates(); ensureTocFormNumber(); restoreSignatures(); toggleAllOtherFields(); saveToStorage(); return; } try { const parsed = JSON.parse(saved); const data = parsed && parsed.data ? parsed.data : parsed; if (parsed && parsed.savedAt) setSavedAtDisplay(parsed.savedAt); getSaveFields().forEach((el) => { if (el.type === 'radio') return; if (data[el.id] !== undefined) el.value = data[el.id]; }); APP.radioGroups.forEach((groupName) => { if (data[groupName]) setRadioGroupValue(groupName, data[groupName]); else $$(`input[name="${groupName}"]`).forEach((el) => { if (data[el.id]) el.checked = true; }); }); } catch (error) { console.warn('Stored form data could not be read. Clearing corrupted data.', error); clearStoredFormData(); setTodayAllDates(); } formatRestoredFields(); ensureTocFormNumber(); restoreSignatures(); toggleAllOtherFields(); validateAllFields(false); saveToStorage(); }
  function clearStoredFormData() { return safeLocalStorage((storage) => { storage.removeItem(APP.storage.formKey); APP.storage.oldFormKeys.forEach((key) => storage.removeItem(key)); APP.signatureIds.forEach((id) => storage.removeItem(APP.storage.signatureKeyPrefix + id)); return true; }, false, { operation: 'clear saved form data and signatures' }); }
  function resetForm() { if (!confirm('Clear saved form data and signatures from this browser, then start a new blank form?')) return; getSaveFields().forEach((el) => { if (el.type === 'radio') el.checked = false; else el.value = ''; setValidity(el, ''); }); APP.signatureIds.forEach(clearSigBox); state.signatureStorageFailed = false; clearStoredFormData(); clearMissingHighlights(); hideValidationBanner(); toggleAllOtherFields(); setTodayAllDates(); ensureTocFormNumber(); saveToStorage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function initSigCanvas() { if (!state.sigCanvas) state.sigCanvas = $('sigCanvas'); if (state.sigCanvas && !state.sigCtx) state.sigCtx = state.sigCanvas.getContext('2d', { willReadFrequently: true }); }
  function openSigModal(signatureId, trigger = document.activeElement) { initSigCanvas(); if (!state.sigCanvas || !state.sigCtx) return; state.activeSig = String(signatureId); state.lastSigTrigger = trigger; state.hasMark = false; const doneButton = $('sigModalDone'); doneButton?.classList.remove('ready'); if (doneButton) doneButton.disabled = true; const subtitle = $('sigModalSub'); if (subtitle) subtitle.textContent = state.activeSig === '1' ? 'Transferring Party' : 'Receiving Party'; const modal = $('sigModal'); modal?.classList.add('open'); requestAnimationFrame(() => { const wrap = $('sigModalWrap'); if (!wrap) return; const r = wrap.getBoundingClientRect(); const scale = window.devicePixelRatio || 1; state.sigCanvas.width = Math.max(300, Math.floor(r.width * scale)); state.sigCanvas.height = Math.max(200, Math.floor(r.height * scale)); state.sigCanvas.style.width = r.width + 'px'; state.sigCanvas.style.height = r.height + 'px'; state.sigCtx.setTransform(scale, 0, 0, scale, 0, 0); state.sigCtx.strokeStyle = '#1a1a1a'; state.sigCtx.lineWidth = 2.5; state.sigCtx.lineCap = 'round'; state.sigCtx.lineJoin = 'round'; focusModal(modal); }); }
  function closeSigModal() { $('sigModal')?.classList.remove('open'); restoreFocus(state.lastSigTrigger || $('sigBox' + state.activeSig)); state.lastSigTrigger = null; }
  function sigModalClear() { initSigCanvas(); if (!state.sigCtx || !state.sigCanvas) return; state.sigCtx.save(); state.sigCtx.setTransform(1, 0, 0, 1, 0, 0); state.sigCtx.clearRect(0, 0, state.sigCanvas.width, state.sigCanvas.height); state.sigCtx.restore(); state.hasMark = false; const doneButton = $('sigModalDone'); doneButton?.classList.remove('ready'); if (doneButton) doneButton.disabled = true; }
  function cropSigCanvas(srcCanvas) { const ctx = srcCanvas.getContext('2d', { willReadFrequently: true }); const pixels = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height); const data = pixels.data; let minX = srcCanvas.width, minY = srcCanvas.height, maxX = 0, maxY = 0; for (let y = 0; y < srcCanvas.height; y++) { for (let x = 0; x < srcCanvas.width; x++) { const alpha = data[(y * srcCanvas.width + x) * 4 + 3]; if (alpha > 0) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); } } } if (maxX <= minX || maxY <= minY) return srcCanvas.toDataURL('image/png'); const pad = 16; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(srcCanvas.width, maxX + pad); maxY = Math.min(srcCanvas.height, maxY + pad); const width = maxX - minX; const height = maxY - minY; const out = document.createElement('canvas'); out.width = width; out.height = height; out.getContext('2d').drawImage(srcCanvas, minX, minY, width, height, 0, 0, width, height); return out.toDataURL('image/png'); }
  function sigModalDone() { if (!state.hasMark || !state.sigCanvas) return; const dataURL = cropSigCanvas(state.sigCanvas); const preview = $('sigPreview' + state.activeSig); const box = $('sigBox' + state.activeSig); if (preview) { preview.src = dataURL; preview.style.display = 'block'; } if (box) box.classList.add('sig-has-data'); box?.classList.remove('field-missing'); stampSignatureDate(state.activeSig); const didSaveSignature = safeLocalStorage((storage) => { storage.setItem(APP.storage.signatureKeyPrefix + state.activeSig, dataURL); return true; }, false, { label: 'signature save' }); state.signatureStorageFailed = !didSaveSignature; if (!didSaveSignature) showStorageWarning(); saveToStorage(); $('sigModal')?.classList.remove('open'); }
  function clearSigBox(signatureId) { const id = String(signatureId); const preview = $('sigPreview' + id); if (preview) { preview.style.display = 'none'; preview.src = ''; } $('sigBox' + id)?.classList.remove('sig-has-data'); safeLocalStorage((storage) => { storage.removeItem(APP.storage.signatureKeyPrefix + id); return true; }, false, { label: 'signature clear' }); }
  function restoreSignatures() { APP.signatureIds.forEach((id) => { const sig = safeLocalStorage((storage) => storage.getItem(APP.storage.signatureKeyPrefix + id), null, { label: 'signature load' }); if (!sig) return; const preview = $('sigPreview' + id); const box = $('sigBox' + id); if (preview) { preview.src = sig; preview.style.display = 'block'; } if (box) box.classList.add('sig-has-data'); }); }
  function sigPos(e) { const r = state.sigCanvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function capturePointer(canvas, pointerId) { if (!canvas || pointerId == null || typeof canvas.setPointerCapture !== 'function') return; try { canvas.setPointerCapture(pointerId); } catch (error) { console.warn('Pointer capture unavailable:', error); } }
  function releasePointer(canvas, pointerId) { if (!canvas || pointerId == null || typeof canvas.releasePointerCapture !== 'function') return; try { if (typeof canvas.hasPointerCapture !== 'function' || canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId); } catch (error) { console.warn('Pointer release unavailable:', error); } }
  function shouldIgnorePointer(e, requirePrimaryButton = false) { return (requirePrimaryButton && typeof e.button === 'number' && e.button !== 0) || e.isPrimary === false || (state.activePointerId !== null && e.pointerId !== state.activePointerId); }
  function startSig(e) { if (shouldIgnorePointer(e, true)) return; e.preventDefault(); initSigCanvas(); if (!state.sigCtx || !state.sigCanvas) return; state.isSigning = true; state.activePointerId = e.pointerId; capturePointer(state.sigCanvas, e.pointerId); const p = sigPos(e); state.sigCtx.beginPath(); state.sigCtx.moveTo(p.x, p.y); }
  function moveSig(e) { if (!state.isSigning || !state.sigCtx || shouldIgnorePointer(e)) return; e.preventDefault(); const p = sigPos(e); state.sigCtx.lineTo(p.x, p.y); state.sigCtx.stroke(); state.hasMark = true; const doneButton = $('sigModalDone'); doneButton?.classList.add('ready'); if (doneButton) doneButton.disabled = false; }
  function endSig(e) { if (!state.isSigning || (e && shouldIgnorePointer(e))) return; if (e) e.preventDefault(); if (e?.type === 'pointerleave' && typeof state.sigCanvas?.hasPointerCapture === 'function' && state.sigCanvas.hasPointerCapture(e.pointerId)) return; releasePointer(state.sigCanvas, e?.pointerId); state.isSigning = false; state.activePointerId = null; }
  function bindSignatureCanvas() { const canvas = $('sigCanvas'); if (!canvas || canvas.dataset.bound === 'true') return; canvas.dataset.bound = 'true'; canvas.addEventListener('pointerdown', startSig); canvas.addEventListener('pointermove', moveSig); canvas.addEventListener('pointerup', endSig); canvas.addEventListener('pointercancel', endSig); canvas.addEventListener('pointerleave', endSig); }
  function handleClick(event) { const actionEl = event.target.closest('[data-action]'); if (actionEl) { const action = actionEl.dataset.action; if (action === 'new-form') resetForm(); if (action === 'print') requestPrint(); if (action === 'force-print') printAnyway(); if (action === 'continue-editing') closePrintWarningModal(); if (action === 'today') setTodayAllDates(); if (action === 'clear-signature') { event.stopPropagation(); clearSigBox(actionEl.dataset.signature); } if (action === 'modal-clear-signature') sigModalClear(); if (action === 'modal-save-signature') sigModalDone(); return; } const sigBox = event.target.closest('[data-signature-box]'); if (sigBox) openSigModal(sigBox.dataset.signatureBox); }
  function handleKeydown(event) { const sigBox = event.target.closest('[data-signature-box]'); if (!sigBox) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openSigModal(sigBox.dataset.signatureBox); } }
  function handleInput(event) { const el = event.target; if (el.matches('[data-format]')) handleFormattedInput(el); else validateField(el, true); saveToStorage(); }
  function handleChange(event) { const el = event.target; if (el.matches('select[data-other-target]')) toggleOtherForSelect(el); if (el.id === 'receiverContactName') applyReceiverContactWorkflow({ clearPhone: true }); validateField(el, true); validateConditionalFieldsForController(el.id, true); saveToStorage(); }
  function init() { populateStateOptions(); populateWeightOptions(); bindSignatureCanvas(); loadFromStorage(); document.addEventListener('click', handleClick); document.addEventListener('keydown', handleKeydown); document.addEventListener('input', handleInput); document.addEventListener('change', handleChange); }
  document.addEventListener('DOMContentLoaded', init);
})();
