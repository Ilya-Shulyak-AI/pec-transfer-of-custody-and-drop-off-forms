(() => {
  'use strict';

  const APP = {
    storageKey: 'pec_toc_form_v7',
    oldStorageKeys: ['pec_toc_form_v6', 'pec_toc_form_v5', 'pec_toc_form_v4', 'pec_toc_form_v3', 'pec_toc_form_v2'],
    signatureKeyPrefix: 'pec_toc_sig_',
    payloadVersion: 7,
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
    requiredRadioGroups: {
      dataDestruction: 'Data Destruction Required',
      certificateRequired: 'Certificate Required'
    },
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
      'receiverPhone',
      'receivedBy',
      'reasonSelect',
      'estimatedWeight',
      'totalUnits',
      'transferSignatureDate',
      'receiverSignatureDate'
    ],
    optionalFieldIds: ['poNumber'],
    conditionalRequiredFields: [
      { fieldId: 'transferMethodOther', controllerId: 'transferMethod', requiredValue: 'Other' },
      { fieldId: 'receiverContactNameOther', controllerId: 'receiverContactName', requiredValue: 'Other' },
      { fieldId: 'receivedByOther', controllerId: 'receivedBy', requiredValue: 'Other' },
      { fieldId: 'reasonOther', controllerId: 'reasonSelect', requiredValue: 'Other' },
      { fieldId: 'estimatedWeightOther', controllerId: 'estimatedWeight', requiredValue: 'Other' }
    ],
    receiverPhoneByContact: {
      'Elliot Shuliak': '(402) 413-1267'
    }
  };

  const state = {
    activePointerId: null,
    activeSig: '1',
    hasMark: false,
    isSigning: false,
    lastPrintTrigger: null,
    lastSigTrigger: null,
    sigCanvas: null,
    sigCtx: null,
    signatureStorageFailed: false
  };

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function safeLocalStorage(action, fallback = null, details = {}) {
    try {
      return action(window.localStorage);
    } catch (error) {
      const operation = details.operation || 'access local storage';
      console.warn(`Could not ${operation}:`, error);
      return fallback;
    }
  }

  function formatSavedAt(isoValue) {
    if (!isoValue) return 'Not saved yet';
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return 'Saved time unavailable';
    return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  }

  function setSavedAtDisplay(isoValue) {
    const el = $('savedAtStatus');
    if (el) el.textContent = 'Last saved in this browser: ' + formatSavedAt(isoValue);
  }

  function showStorageWarning() {
    const el = $('storageWarning');
    if (!el) return;
    el.textContent = 'Warning: This browser could not save the latest form data/signature. Print or save a PDF before leaving, then clear browser storage or try another browser/device.';
    el.classList.add('show');
  }

  function hideStorageWarning() {
    $('storageWarning')?.classList.remove('show');
  }

  function todayString() {
    const now = new Date();
    return [String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0'), now.getFullYear()].join('/');
  }

  function formatDateInputValue(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
  }

  function isValidFormattedDate(value) {
    return /^(0[1-9]|1[0-2])\s*\/\s*(0[1-9]|[12]\d|3[01])\s*\/\s*\d{4}$/.test(String(value || '').trim());
  }

  function setTodayAllDates() {
    const today = todayString();
    APP.dateFields.forEach((id) => {
      const el = $(id);
      if (el) {
        el.value = today;
        setValidity(el, '');
        markField(el, false);
      }
    });
    saveToStorage();
  }

  function formatPhoneValue(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
    if (digits.length > 6) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length > 3) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length === 3) return `(${digits}) `;
    return digits;
  }

  function formatManualWeightValue(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits ? Number(digits).toLocaleString('en-US') : '';
  }

  function normalizeStateValue(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  }

  function setValidity(el, message) {
    if (el && typeof el.setCustomValidity === 'function') el.setCustomValidity(message || '');
  }

  function getSaveFields() {
    return $$('[data-save="true"]').filter((el) => el.id);
  }

  function findFieldContainer(el) {
    return el?.closest('.fld, .meta-item');
  }

  function markField(el, isMissing) {
    findFieldContainer(el)?.classList.toggle('field-missing', Boolean(isMissing));
  }

  function clearMissingHighlights() {
    $$('.field-missing').forEach((el) => el.classList.remove('field-missing'));
  }

  function getRadioGroupValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || '';
  }

  function setRadioGroupValue(name, value) {
    $$(`input[name="${name}"]`).forEach((el) => {
      el.checked = el.value === value;
    });
  }

  function conditionalRuleApplies(rule) {
    return $(rule.controllerId)?.value === rule.requiredValue;
  }

  function isConditionallyRequired(id) {
    return APP.conditionalRequiredFields.some((rule) => rule.fieldId === id && conditionalRuleApplies(rule));
  }

  function isHiddenByOtherWrap(el) {
    const wrap = el?.closest('.other-wrap');
    return Boolean(wrap && getComputedStyle(wrap).display === 'none');
  }

  function isRequiredField(el) {
    if (!el || !el.id || el.type === 'radio' || el.disabled) return false;
    if (APP.optionalFieldIds.includes(el.id)) return false;
    if (isHiddenByOtherWrap(el) && !isConditionallyRequired(el.id)) return false;
    return APP.requiredFieldIds.includes(el.id) || isConditionallyRequired(el.id);
  }

  function fieldHasInvalidValue(el) {
    const value = String(el?.value || '').trim();
    if (!value) return false;
    if (el.dataset.format === 'state') return !APP.states.includes(value.toUpperCase());
    if (el.dataset.format === 'date' || APP.dateFields.includes(el.id)) return !isValidFormattedDate(value);
    if (el.dataset.format === 'weight') return Number(value.replace(/\D/g, '')) <= 0;
    if (el.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (el.type === 'tel') return value.replace(/\D/g, '').length !== 10;
    return false;
  }

  function validateField(el, mark = false) {
    if (!el || !el.id) return true;
    const missing = isRequiredField(el) && !String(el.value || '').trim();
    const invalid = fieldHasInvalidValue(el);
    const message = invalid && (el.dataset.format === 'date' || APP.dateFields.includes(el.id)) ? 'Use MM/DD/YYYY.' : 'Please check this field.';
    setValidity(el, invalid ? message : '');
    if (mark) markField(el, missing || invalid);
    return !missing && !invalid;
  }

  function validateRequiredRadioGroups(mark = false) {
    const missing = [];
    Object.entries(APP.requiredRadioGroups).forEach(([groupName, label]) => {
      const isMissing = !getRadioGroupValue(groupName);
      if (isMissing) missing.push(label);
      if (mark) $$(`input[name="${groupName}"]`).forEach((el) => markField(el, isMissing));
    });
    return missing;
  }

  function signatureIsMissing(id) {
    const preview = $('sigPreview' + id);
    return !preview || !preview.src || preview.style.display === 'none';
  }

  function markSignatureBoxes(mark = false) {
    const missing = [];
    APP.signatureIds.forEach((id) => {
      const isMissing = signatureIsMissing(id);
      if (isMissing) missing.push(id);
      if (mark) $('sigBox' + id)?.classList.toggle('field-missing', isMissing);
    });
    return missing;
  }

  function validateAllFields(mark = false) {
    if (mark) clearMissingHighlights();
    const fieldsValid = getSaveFields().map((el) => validateField(el, mark)).every(Boolean);
    const radiosMissing = validateRequiredRadioGroups(mark);
    const signaturesMissing = markSignatureBoxes(mark);
    return {
      isValid: fieldsValid && radiosMissing.length === 0 && signaturesMissing.length === 0,
      radiosMissing,
      signaturesMissing
    };
  }

  function validateConditionalFieldsForController(controllerId, mark = false) {
    APP.conditionalRequiredFields
      .filter((rule) => rule.controllerId === controllerId)
      .forEach((rule) => validateField($(rule.fieldId), mark));
  }

  function formatFieldValue(el) {
    if (!el?.dataset?.format) return;
    if (el.dataset.format === 'phone') el.value = formatPhoneValue(el.value);
    if (el.dataset.format === 'weight') el.value = formatManualWeightValue(el.value);
    if (el.dataset.format === 'state') el.value = normalizeStateValue(el.value);
    if (el.dataset.format === 'date') el.value = formatDateInputValue(el.value);
  }

  function formatRestoredFields() {
    getSaveFields().forEach(formatFieldValue);
  }

  function getFocusableElements(container) {
    return $$('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
      .filter((el) => !el.hidden && el.offsetParent !== null);
  }

  function focusElement(el) {
    if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
  }

  function focusModal(modal) {
    if (!modal) return;
    focusElement(getFocusableElements(modal)[0] || modal);
  }

  function restoreFocus(el) {
    if (el && document.contains(el)) focusElement(el);
  }

  function openPrintWarningModal(trigger = document.activeElement) {
    const modal = $('printWarningModal');
    if (!modal) return;
    state.lastPrintTrigger = trigger;
    modal.classList.add('open');
    requestAnimationFrame(() => focusModal(modal));
  }

  function closePrintWarningModal() {
    $('printWarningModal')?.classList.remove('open');
    restoreFocus(state.lastPrintTrigger);
    state.lastPrintTrigger = null;
  }

  function requestPrint(trigger = document.activeElement) {
    const result = validateAllFields(true);
    if (result.isValid) {
      clearMissingHighlights();
      window.print();
      return;
    }
    openPrintWarningModal(trigger);
  }

  function printAnyway() {
    closePrintWarningModal();
    clearMissingHighlights();
    window.print();
  }

  function toggleOtherForSelect(select) {
    const wrap = select?.dataset?.otherTarget ? $(select.dataset.otherTarget) : null;
    if (!wrap) return;
    const show = select.value === 'Other';
    wrap.style.display = show ? 'block' : 'none';
    select.closest('.select-other-row')?.classList.toggle('other-visible', show);
    const input = wrap.querySelector('input');
    if (!show && input) {
      input.value = '';
      setValidity(input, '');
      markField(input, false);
    }
  }

  function toggleAllOtherFields() {
    $$('select[data-other-target]').forEach(toggleOtherForSelect);
  }

  function applyReceiverContactWorkflow(options = {}) {
    const contact = $('receiverContactName');
    const phone = $('receiverPhone');
    if (!contact || !phone) return;

    const knownPhone = APP.receiverPhoneByContact[contact.value];
    const phoneContainer = findFieldContainer(phone);
    if (knownPhone) {
      phone.value = knownPhone;
      phone.readOnly = true;
      phoneContainer?.classList.add('pre-fill');
    } else {
      phone.readOnly = false;
      phoneContainer?.classList.remove('pre-fill');
      if (options.clearPhone || contact.value === '') phone.value = '';
    }

    formatFieldValue(phone);
    setValidity(phone, '');
    markField(phone, false);
  }

  function populateStateOptions() {
    const select = $('fromState');
    if (!select || select.dataset.populated === 'true') return;
    APP.states.forEach((stateAbbr) => {
      select.appendChild(new Option(stateAbbr, stateAbbr));
    });
    select.dataset.populated = 'true';
  }

  function populateWeightOptions() {
    const select = $('estimatedWeight');
    if (!select || select.dataset.populated === 'true') return;
    for (let weight = 100; weight <= 10000; weight += 100) {
      const value = weight.toLocaleString('en-US') + ' lbs';
      select.appendChild(new Option(value, value));
    }
    select.appendChild(new Option('Other', 'Other'));
    select.dataset.populated = 'true';
  }

  function getFormData() {
    const data = {};
    getSaveFields().forEach((el) => {
      if (el.type !== 'radio') data[el.id] = el.value;
    });
    APP.radioGroups.forEach((groupName) => {
      data[groupName] = getRadioGroupValue(groupName);
    });
    return data;
  }

  function saveToStorage() {
    const payload = { version: APP.payloadVersion, savedAt: new Date().toISOString(), data: getFormData() };
    const saved = safeLocalStorage((storage) => {
      storage.setItem(APP.storageKey, JSON.stringify(payload));
      return true;
    }, false, { operation: 'save form data' });
    if (saved) {
      if (!state.signatureStorageFailed) hideStorageWarning();
      setSavedAtDisplay(payload.savedAt);
    } else {
      showStorageWarning();
    }
    return saved;
  }

  function readStoredPayload() {
    return safeLocalStorage((storage) => {
      const current = storage.getItem(APP.storageKey);
      if (current) return current;
      for (const key of APP.oldStorageKeys) {
        const oldValue = storage.getItem(key);
        if (oldValue) return oldValue;
      }
      return null;
    }, null, { operation: 'read saved form data' });
  }

  function clearStoredFormData() {
    return safeLocalStorage((storage) => {
      storage.removeItem(APP.storageKey);
      APP.oldStorageKeys.forEach((key) => storage.removeItem(key));
      APP.signatureIds.forEach((id) => storage.removeItem(APP.signatureKeyPrefix + id));
      return true;
    }, false, { operation: 'clear saved form data and signatures' });
  }

  function loadFromStorage() {
    const saved = readStoredPayload();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const data = parsed?.data || parsed || {};
        getSaveFields().forEach((el) => {
          if (el.type !== 'radio' && data[el.id] !== undefined) el.value = data[el.id];
        });
        APP.radioGroups.forEach((groupName) => setRadioGroupValue(groupName, data[groupName] || ''));
        if (parsed?.savedAt) setSavedAtDisplay(parsed.savedAt);
      } catch (error) {
        console.warn('Stored form data could not be read. Clearing corrupted data.', error);
        clearStoredFormData();
      }
    }
    formatRestoredFields();
    restoreSignatures();
    toggleAllOtherFields();
    applyReceiverContactWorkflow({ clearPhone: false });
    validateAllFields(false);
  }

  function resetForm() {
    getSaveFields().forEach((el) => {
      if (el.type === 'radio') el.checked = false;
      else el.value = '';
      setValidity(el, '');
    });
    APP.radioGroups.forEach((groupName) => setRadioGroupValue(groupName, ''));
    APP.signatureIds.forEach(clearSigBox);
    state.signatureStorageFailed = false;
    clearStoredFormData();
    clearMissingHighlights();
    closePrintWarningModal();
    hideStorageWarning();
    toggleAllOtherFields();
    applyReceiverContactWorkflow({ clearPhone: true });
    setSavedAtDisplay('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initSigCanvas() {
    if (!state.sigCanvas) state.sigCanvas = $('sigCanvas');
    if (state.sigCanvas && !state.sigCtx) state.sigCtx = state.sigCanvas.getContext('2d', { willReadFrequently: true });
  }

  function sigModalClear() {
    initSigCanvas();
    if (!state.sigCtx || !state.sigCanvas) return;
    state.sigCtx.save();
    state.sigCtx.setTransform(1, 0, 0, 1, 0, 0);
    state.sigCtx.clearRect(0, 0, state.sigCanvas.width, state.sigCanvas.height);
    state.sigCtx.restore();
    state.hasMark = false;
    const doneButton = $('sigModalDone');
    doneButton?.classList.remove('ready');
    if (doneButton) doneButton.disabled = true;
  }

  function openSigModal(signatureId, trigger = document.activeElement) {
    initSigCanvas();
    if (!state.sigCanvas || !state.sigCtx) return;
    state.activeSig = String(signatureId);
    state.lastSigTrigger = trigger;
    const subtitle = $('sigModalSub');
    if (subtitle) subtitle.textContent = state.activeSig === '1' ? 'Transferring Party' : 'Receiving Party';
    const modal = $('sigModal');
    modal?.classList.add('open');
    requestAnimationFrame(() => {
      const wrap = $('sigModalWrap');
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      state.sigCanvas.width = Math.max(300, Math.floor(rect.width * scale));
      state.sigCanvas.height = Math.max(200, Math.floor(rect.height * scale));
      state.sigCanvas.style.width = rect.width + 'px';
      state.sigCanvas.style.height = rect.height + 'px';
      state.sigCtx.setTransform(scale, 0, 0, scale, 0, 0);
      state.sigCtx.lineCap = 'round';
      state.sigCtx.lineJoin = 'round';
      state.sigCtx.lineWidth = 2.5;
      state.sigCtx.strokeStyle = '#1a1a1a';
      sigModalClear();
      focusModal(modal);
    });
  }

  function closeSigModal() {
    $('sigModal')?.classList.remove('open');
    restoreFocus(state.lastSigTrigger || $('sigBox' + state.activeSig));
    state.lastSigTrigger = null;
  }

  function cropSigCanvas(srcCanvas) {
    const ctx = srcCanvas.getContext('2d', { willReadFrequently: true });
    const pixels = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    const data = pixels.data;
    let minX = srcCanvas.width;
    let minY = srcCanvas.height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < srcCanvas.height; y += 1) {
      for (let x = 0; x < srcCanvas.width; x += 1) {
        if (data[(y * srcCanvas.width + x) * 4 + 3] > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX <= minX || maxY <= minY) return srcCanvas.toDataURL('image/png');
    const pad = 16;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(srcCanvas.width, maxX + pad);
    maxY = Math.min(srcCanvas.height, maxY + pad);
    const width = maxX - minX;
    const height = maxY - minY;
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    out.getContext('2d').drawImage(srcCanvas, minX, minY, width, height, 0, 0, width, height);
    return out.toDataURL('image/png');
  }

  function getSignatureDateFieldId(signatureId) {
    return signatureId === '1' ? 'transferSignatureDate' : 'receiverSignatureDate';
  }

  function stampSignatureDate(signatureId) {
    const el = $(getSignatureDateFieldId(String(signatureId)));
    if (el && !String(el.value || '').trim()) {
      el.value = todayString();
      markField(el, false);
      setValidity(el, '');
    }
  }

  function sigModalDone() {
    if (!state.hasMark || !state.sigCanvas) return;
    const dataURL = cropSigCanvas(state.sigCanvas);
    const preview = $('sigPreview' + state.activeSig);
    const box = $('sigBox' + state.activeSig);
    if (preview) {
      preview.src = dataURL;
      preview.style.display = 'block';
    }
    box?.classList.add('sig-has-data');
    box?.classList.remove('field-missing');
    stampSignatureDate(state.activeSig);
    const saved = safeLocalStorage((storage) => {
      storage.setItem(APP.signatureKeyPrefix + state.activeSig, dataURL);
      return true;
    }, false, { operation: 'save signature' });
    state.signatureStorageFailed = !saved;
    if (!saved) showStorageWarning();
    saveToStorage();
    closeSigModal();
  }

  function clearSigBox(signatureId) {
    const id = String(signatureId);
    const preview = $('sigPreview' + id);
    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
    $('sigBox' + id)?.classList.remove('sig-has-data', 'field-missing');
    safeLocalStorage((storage) => {
      storage.removeItem(APP.signatureKeyPrefix + id);
      return true;
    }, false, { operation: 'clear signature' });
  }

  function restoreSignatures() {
    APP.signatureIds.forEach((id) => {
      const sig = safeLocalStorage((storage) => storage.getItem(APP.signatureKeyPrefix + id), null, { operation: 'load signature' });
      if (!sig) return;
      const preview = $('sigPreview' + id);
      const box = $('sigBox' + id);
      if (preview) {
        preview.src = sig;
        preview.style.display = 'block';
      }
      box?.classList.add('sig-has-data');
    });
  }

  function sigPos(event) {
    const rect = state.sigCanvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function shouldIgnorePointer(event, requirePrimaryButton = false) {
    return (requirePrimaryButton && typeof event.button === 'number' && event.button !== 0)
      || event.isPrimary === false
      || (state.activePointerId !== null && event.pointerId !== state.activePointerId);
  }

  function startSig(event) {
    if (shouldIgnorePointer(event, true)) return;
    event.preventDefault();
    initSigCanvas();
    if (!state.sigCtx) return;
    state.isSigning = true;
    state.activePointerId = event.pointerId;
    try { state.sigCanvas.setPointerCapture(event.pointerId); } catch (error) { console.warn('Pointer capture unavailable:', error); }
    const point = sigPos(event);
    state.sigCtx.beginPath();
    state.sigCtx.moveTo(point.x, point.y);
  }

  function moveSig(event) {
    if (!state.isSigning || !state.sigCtx || shouldIgnorePointer(event)) return;
    event.preventDefault();
    const point = sigPos(event);
    state.sigCtx.lineTo(point.x, point.y);
    state.sigCtx.stroke();
    state.hasMark = true;
    const doneButton = $('sigModalDone');
    doneButton?.classList.add('ready');
    if (doneButton) doneButton.disabled = false;
  }

  function endSig(event) {
    if (!state.isSigning || (event && shouldIgnorePointer(event))) return;
    event?.preventDefault();
    if (event?.type === 'pointerleave' && typeof state.sigCanvas?.hasPointerCapture === 'function' && state.sigCanvas.hasPointerCapture(event.pointerId)) return;
    try {
      if (event && (typeof state.sigCanvas?.hasPointerCapture !== 'function' || state.sigCanvas.hasPointerCapture(event.pointerId))) {
        state.sigCanvas.releasePointerCapture(event.pointerId);
      }
    } catch (error) {
      console.warn('Pointer release unavailable:', error);
    }
    state.isSigning = false;
    state.activePointerId = null;
  }

  function bindSignatureCanvas() {
    const canvas = $('sigCanvas');
    if (!canvas || canvas.dataset.bound === 'true') return;
    canvas.dataset.bound = 'true';
    canvas.addEventListener('pointerdown', startSig);
    canvas.addEventListener('pointermove', moveSig);
    canvas.addEventListener('pointerup', endSig);
    canvas.addEventListener('pointercancel', endSig);
    canvas.addEventListener('pointerleave', endSig);
  }

  function handleInput(event) {
    const el = event.target;
    if (!el.matches?.('[data-save="true"]')) return;
    formatFieldValue(el);
    validateField(el, true);
    saveToStorage();
  }

  function handleChange(event) {
    const el = event.target;
    if (!el.matches?.('[data-save="true"]')) return;
    if (el.matches('select[data-other-target]')) toggleOtherForSelect(el);
    if (el.id === 'receiverContactName') applyReceiverContactWorkflow({ clearPhone: true });
    formatFieldValue(el);
    validateField(el, true);
    validateConditionalFieldsForController(el.id, true);
    if (el.type === 'radio') validateRequiredRadioGroups(true);
    saveToStorage();
  }

  function handleClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === 'new-form') resetForm();
      if (action === 'print') requestPrint(actionEl);
      if (action === 'force-print') printAnyway();
      if (action === 'continue-editing') closePrintWarningModal();
      if (action === 'today') setTodayAllDates();
      if (action === 'clear-signature') {
        event.stopPropagation();
        clearSigBox(actionEl.dataset.signature);
        saveToStorage();
      }
      if (action === 'modal-clear-signature') sigModalClear();
      if (action === 'modal-save-signature') sigModalDone();
      return;
    }

    const sigBox = event.target.closest('[data-signature-box]');
    if (sigBox) openSigModal(sigBox.dataset.signatureBox, sigBox);
  }

  function handleKeydown(event) {
    const sigBox = event.target.closest?.('[data-signature-box]');
    if (sigBox && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openSigModal(sigBox.dataset.signatureBox, sigBox);
    }
    if (event.key === 'Escape') {
      if ($('sigModal')?.classList.contains('open')) closeSigModal();
      if ($('printWarningModal')?.classList.contains('open')) closePrintWarningModal();
    }
  }

  function init() {
    populateStateOptions();
    populateWeightOptions();
    bindSignatureCanvas();
    loadFromStorage();
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleChange);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
