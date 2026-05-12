(() => {
  'use strict';

  const APP = {
    storageKey: 'pec_toc_form_v7',
    oldStorageKeys: ['pec_toc_form_v6', 'pec_toc_form_v5', 'pec_toc_form_v4', 'pec_toc_form_v3', 'pec_toc_form_v2'],
    signatureKeyPrefix: 'pec_toc_sig_',
    receiverDefaultPhone: '(402) 413-1267',
    states: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    dateFields: ['formDate', 'transferSignatureDate', 'receiverSignatureDate'],
    signatureIds: ['1', '2'],
    radioGroups: ['dataDestruction', 'certificateRequired'],
    requiredFields: [
      'tocFormNumber', 'formDate',
      'fromCompanyName', 'fromContactName', 'fromAddress', 'fromPhone', 'fromEmail', 'fromCity', 'fromState', 'fromZip', 'transferMethod',
      'receiverContactName', 'receiverPhone', 'receivedBy',
      'reasonSelect', 'estimatedWeight', 'totalUnits',
      'transferSignatureDate', 'receiverSignatureDate'
    ],
    requiredRadioGroups: {
      dataDestruction: 'Data Destruction Required',
      certificateRequired: 'Certificate Required'
    },
    fieldLabels: {
      tocFormNumber: 'TOC Form #',
      formDate: 'Date',
      fromCompanyName: 'Transferring Company Name',
      fromContactName: 'Transferring Contact Name',
      fromAddress: 'Transferring Address',
      fromPhone: 'Transferring Phone',
      fromEmail: 'Transferring Email',
      fromCity: 'Transferring City',
      fromState: 'Transferring State',
      fromZip: 'Transferring Zip',
      transferMethod: 'Transfer Method',
      transferMethodOther: 'Transfer Method Other',
      receiverContactName: 'Receiving Contact Name',
      receiverContactNameOther: 'Receiving Contact Name Other',
      receiverPhone: 'Receiving Phone',
      receivedBy: 'Received By',
      receivedByOther: 'Received By Other',
      reasonSelect: 'Reason for Transfer',
      reasonOther: 'Reason for Transfer Other',
      estimatedWeight: 'Estimated Total Weight',
      estimatedWeightOther: 'Estimated Weight Other',
      totalUnits: 'Total Units',
      transferSignatureDate: 'Transferring Signature Date',
      receiverSignatureDate: 'Receiving Signature Date'
    }
  };

  const state = {
    sigCanvas: null,
    sigCtx: null,
    isSigning: false,
    hasMark: false,
    activeSig: '1',
    lastFocus: null
  };

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function safeLocalStorage(action, fallback = null) {
    try {
      return action(window.localStorage);
    } catch (error) {
      console.warn('Local storage unavailable:', error);
      showValidationBanner(['This browser could not save the form locally. Please print or save the form before leaving this page.']);
      return fallback;
    }
  }

  function formatDate() {
    const n = new Date();
    return `${String(n.getMonth() + 1).padStart(2, '0')}/${String(n.getDate()).padStart(2, '0')}/${n.getFullYear()}`;
  }

  function formatPhoneValue(value) {
    const v = String(value || '').replace(/\D/g, '').substring(0, 10);
    if (v.length >= 6) return `(${v.substring(0, 3)}) ${v.substring(3, 6)}-${v.substring(6)}`;
    if (v.length >= 3) return `(${v.substring(0, 3)}) ${v.substring(3)}`;
    return v;
  }

  function formatManualWeightValue(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits ? Number(digits).toLocaleString('en-US') : '';
  }

  function normalizeStateValue(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  }

  function formatDateValue(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length >= 5) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  function setValidity(el, message) {
    if (!el || typeof el.setCustomValidity !== 'function') return;
    el.setCustomValidity(message || '');
  }

  function getRadioGroupValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : '';
  }

  function setRadioGroupValue(name, value) {
    $$(`input[name="${name}"]`).forEach((el) => {
      el.checked = el.value === value;
    });
  }

  function findFieldContainer(el) {
    return el?.closest('.fld, .meta-item, .sig-canvas-wrap');
  }

  function markField(el, isMissing) {
    const container = findFieldContainer(el);
    if (container) container.classList.toggle('field-missing', Boolean(isMissing));
  }

  function clearMissingHighlights() {
    $$('.field-missing').forEach((el) => el.classList.remove('field-missing'));
  }

  function isHiddenByOtherWrap(el) {
    const wrap = el.closest('.other-wrap');
    return wrap && getComputedStyle(wrap).display === 'none';
  }

  function fieldLabel(id) {
    return APP.fieldLabels[id] || id;
  }

  function isRequiredField(el) {
    if (!el || !el.id || el.type === 'radio' || el.disabled || isHiddenByOtherWrap(el)) return false;
    if (el.id === 'receiverContactNameOther') return $('receiverContactName')?.value === 'Other';
    if (el.id === 'transferMethodOther') return $('transferMethod')?.value === 'Other';
    if (el.id === 'receivedByOther') return $('receivedBy')?.value === 'Other';
    if (el.id === 'reasonOther') return $('reasonSelect')?.value === 'Other';
    if (el.id === 'estimatedWeightOther') return $('estimatedWeight')?.value === 'Other';
    return APP.requiredFields.includes(el.id);
  }

  function fieldHasInvalidValue(el) {
    const value = String(el.value || '').trim();
    if (!value) return false;
    if (el.dataset.format === 'state') return !APP.states.includes(value.toUpperCase());
    if (el.dataset.format === 'date') return !/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/.test(value);
    if (el.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (el.type === 'tel') {
      const digits = value.replace(/\D/g, '');
      return digits.length > 0 && digits.length !== 10;
    }
    if (el.dataset.format === 'weight') return Number(value.replace(/\D/g, '')) <= 0;
    return false;
  }

  function validateField(el, mark = false) {
    if (!el || !el.id) return { valid: true };
    const missing = isRequiredField(el) && !String(el.value || '').trim();
    const invalid = fieldHasInvalidValue(el);
    setValidity(el, invalid ? 'Please check this field.' : '');
    if (mark) markField(el, missing || invalid);
    return {
      valid: !missing && !invalid,
      missing,
      invalid,
      label: fieldLabel(el.id)
    };
  }

  function validateRequiredRadioGroups(mark = false) {
    const missing = [];
    Object.entries(APP.requiredRadioGroups).forEach(([groupName, label]) => {
      const checked = Boolean(getRadioGroupValue(groupName));
      if (!checked) missing.push(label);
      if (mark) $$(`input[name="${groupName}"]`).forEach((el) => markField(el, !checked));
    });
    return missing;
  }

  function signatureIsMissing(id) {
    const preview = $(`sigPreview${id}`);
    return !preview || !preview.src || preview.style.display === 'none';
  }

  function markSignatureBoxes(mark) {
    const missing = [];
    APP.signatureIds.forEach((id) => {
      const isMissing = signatureIsMissing(id);
      if (isMissing) missing.push(id === '1' ? 'Transferring Party Signature' : 'Receiving Party Signature');
      if (mark) $(`sigBox${id}`)?.classList.toggle('field-missing', isMissing);
    });
    return missing;
  }

  function validateAllFields(mark = false) {
    if (mark) clearMissingHighlights();
    const missingFields = [];
    const invalidFields = [];
    getSaveFields().forEach((el) => {
      const result = validateField(el, mark);
      if (result.missing) missingFields.push(result.label);
      if (result.invalid) invalidFields.push(result.label);
    });
    const missingRadioGroups = validateRequiredRadioGroups(mark);
    const missingSignatures = markSignatureBoxes(mark);
    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0 && missingRadioGroups.length === 0 && missingSignatures.length === 0,
      missingFields,
      invalidFields,
      missingRadioGroups,
      missingSignatures
    };
  }

  function buildValidationMessages(result) {
    const messages = [];
    if (result.missingFields?.length) messages.push(`Missing: ${result.missingFields.slice(0, 8).join(', ')}${result.missingFields.length > 8 ? '…' : ''}`);
    if (result.invalidFields?.length) messages.push(`Check: ${result.invalidFields.join(', ')}`);
    if (result.missingRadioGroups?.length) messages.push(`Select: ${result.missingRadioGroups.join(', ')}`);
    if (result.missingSignatures?.length) messages.push(`Sign: ${result.missingSignatures.join(', ')}`);
    return messages;
  }

  function showValidationBanner(messages) {
    const banner = $('validationBanner');
    if (!banner) return;
    banner.textContent = Array.isArray(messages) && messages.length ? messages.join(' • ') : '';
    banner.classList.toggle('show', Boolean(banner.textContent));
  }

  function hideValidationBanner() {
    const banner = $('validationBanner');
    if (!banner) return;
    banner.textContent = '';
    banner.classList.remove('show');
  }

  function openPrintWarningModal(result) {
    const body = $('printWarningBody');
    const messages = buildValidationMessages(result || {});
    if (body) {
      body.textContent = messages.length
        ? `${messages.join(' ')} You can continue filling out the form, or print it with the information currently entered.`
        : 'You can continue filling out the form, or print it with the information currently entered.';
    }
    state.lastFocus = document.activeElement;
    $('printWarningModal')?.classList.add('open');
    $('printWarningModal')?.querySelector('button')?.focus();
  }

  function closePrintWarningModal() {
    $('printWarningModal')?.classList.remove('open');
    state.lastFocus?.focus?.();
  }

  function requestPrint() {
    const result = validateAllFields(true);
    renderPrintPage();
    if (result.isValid) {
      clearMissingHighlights();
      hideValidationBanner();
      window.print();
    } else {
      showValidationBanner(buildValidationMessages(result));
      openPrintWarningModal(result);
    }
  }

  function printAnyway() {
    closePrintWarningModal();
    clearMissingHighlights();
    hideValidationBanner();
    renderPrintPage();
    window.print();
  }

  function formatFieldValue(el) {
    const type = el.dataset.format;
    if (type === 'phone') el.value = formatPhoneValue(el.value);
    if (type === 'weight') el.value = formatManualWeightValue(el.value);
    if (type === 'state') el.value = normalizeStateValue(el.value);
    if (type === 'date') el.value = formatDateValue(el.value);
  }

  function handleFormattedInput(el) {
    formatFieldValue(el);
    validateField(el, true);
  }

  function formatRestoredFields() {
    getSaveFields().forEach((el) => {
      if (el.dataset.format) formatFieldValue(el);
    });
  }

  function toggleOtherForSelect(select) {
    const wrapId = select.dataset.otherTarget;
    if (!wrapId) return;
    const wrap = $(wrapId);
    if (!wrap) return;
    const show = select.value === 'Other';
    wrap.style.display = show ? 'block' : 'none';
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

  function syncReceiverContact() {
    const select = $('receiverContactName');
    const phone = $('receiverPhone');
    if (!select || !phone) return;
    toggleOtherForSelect(select);
    if (select.value === 'Ilya Shulyak') {
      phone.value = APP.receiverDefaultPhone;
      phone.readOnly = true;
      phone.closest('.fld')?.classList.add('pre-fill');
    } else if (select.value === 'Other') {
      if (phone.value === APP.receiverDefaultPhone) phone.value = '';
      phone.readOnly = false;
      phone.closest('.fld')?.classList.remove('pre-fill');
    } else {
      if (phone.value === APP.receiverDefaultPhone) phone.value = '';
      phone.readOnly = false;
    }
    validateField(phone, false);
  }

  function populateStateOptions() {
    const list = $('stateOptions');
    if (!list || list.children.length) return;
    APP.states.forEach((stateAbbr) => {
      const option = document.createElement('option');
      option.value = stateAbbr;
      list.appendChild(option);
    });
  }

  function populateWeightOptions() {
    const select = $('estimatedWeight');
    if (!select || select.dataset.populated === 'true') return;
    for (let weight = 100; weight <= 10000; weight += 100) {
      const value = `${weight.toLocaleString('en-US')} lbs`;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }
    const other = document.createElement('option');
    other.value = 'Other';
    other.textContent = 'Other';
    select.appendChild(other);
    select.dataset.populated = 'true';
  }

  function getSaveFields() {
    return $$('[data-save="true"]').filter((el) => el.id);
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
    const payload = { version: 7, savedAt: new Date().toISOString(), data: getFormData() };
    safeLocalStorage((storage) => storage.setItem(APP.storageKey, JSON.stringify(payload)));
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
    });
  }

  function restoreFormData(data) {
    getSaveFields().forEach((el) => {
      if (el.type === 'radio') return;
      if (data[el.id] !== undefined) el.value = data[el.id];
    });

    const receiverSelect = $('receiverContactName');
    const knownReceiver = receiverSelect && Array.from(receiverSelect.options).some((option) => option.value === data.receiverContactName);
    if (data.receiverContactName && receiverSelect && !knownReceiver) {
      receiverSelect.value = 'Other';
      $('receiverContactNameOther').value = data.receiverContactName;
    }

    APP.radioGroups.forEach((groupName) => {
      if (data[groupName]) setRadioGroupValue(groupName, data[groupName]);
      else $$(`input[name="${groupName}"]`).forEach((el) => {
        if (data[el.id]) el.checked = true;
      });
    });
  }

  function loadFromStorage() {
    const saved = readStoredPayload();
    if (!saved) {
      setTodayAllDates(false);
      syncReceiverContact();
      restoreSignatures();
      toggleAllOtherFields();
      saveToStorage();
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const data = parsed && parsed.data ? parsed.data : parsed;
      restoreFormData(data || {});
    } catch (error) {
      console.warn('Stored form data could not be read. Clearing corrupted data.', error);
      clearStoredFormData();
      setTodayAllDates(false);
    }

    formatRestoredFields();
    syncReceiverContact();
    restoreSignatures();
    toggleAllOtherFields();
    validateAllFields(false);
    saveToStorage();
  }

  function clearStoredFormData() {
    safeLocalStorage((storage) => {
      storage.removeItem(APP.storageKey);
      APP.oldStorageKeys.forEach((key) => storage.removeItem(key));
      APP.signatureIds.forEach((id) => storage.removeItem(APP.signatureKeyPrefix + id));
    });
  }

  function setTodayAllDates(shouldSave = true) {
    const today = formatDate();
    APP.dateFields.forEach((id) => {
      const el = $(id);
      if (el) el.value = today;
    });
    if (shouldSave) saveToStorage();
  }

  function resetForm() {
    if (!confirm('Clear this form and local saved form data/signatures before starting a new one?')) return;
    getSaveFields().forEach((el) => {
      if (el.type === 'radio') el.checked = false;
      else el.value = '';
      setValidity(el, '');
    });
    APP.signatureIds.forEach((id) => clearSigBox(id, false));
    clearStoredFormData();
    clearMissingHighlights();
    hideValidationBanner();
    toggleAllOtherFields();
    setTodayAllDates(false);
    syncReceiverContact();
    saveToStorage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initSigCanvas() {
    if (state.sigCanvas) return;
    state.sigCanvas = $('sigCanvas');
    state.sigCtx = state.sigCanvas?.getContext('2d', { willReadFrequently: true }) || null;
  }

  function openSigModal(signatureId) {
    initSigCanvas();
    if (!state.sigCanvas || !state.sigCtx) return;
    state.lastFocus = document.activeElement;
    state.activeSig = String(signatureId);
    state.hasMark = false;
    $('sigModalDone')?.classList.remove('ready');
    const subtitle = $('sigModalSub');
    if (subtitle) subtitle.textContent = state.activeSig === '1' ? 'Transferring Party' : 'Receiving Party';
    $('sigModal')?.classList.add('open');

    requestAnimationFrame(() => {
      const wrap = $('sigModalWrap');
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      state.sigCanvas.width = Math.max(300, Math.floor(r.width * scale));
      state.sigCanvas.height = Math.max(200, Math.floor(r.height * scale));
      state.sigCanvas.style.width = `${r.width}px`;
      state.sigCanvas.style.height = `${r.height}px`;
      state.sigCtx.setTransform(scale, 0, 0, scale, 0, 0);
      state.sigCtx.strokeStyle = '#1a1a1a';
      state.sigCtx.lineWidth = 2.5;
      state.sigCtx.lineCap = 'round';
      state.sigCtx.lineJoin = 'round';
      state.sigCanvas.focus?.();
    });
  }

  function closeSigModal() {
    $('sigModal')?.classList.remove('open');
    state.lastFocus?.focus?.();
  }

  function sigModalClear() {
    initSigCanvas();
    if (!state.sigCtx || !state.sigCanvas) return;
    state.sigCtx.save();
    state.sigCtx.setTransform(1, 0, 0, 1, 0, 0);
    state.sigCtx.clearRect(0, 0, state.sigCanvas.width, state.sigCanvas.height);
    state.sigCtx.restore();
    state.hasMark = false;
    $('sigModalDone')?.classList.remove('ready');
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
        const alpha = data[(y * srcCanvas.width + x) * 4 + 3];
        if (alpha > 0) {
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

  function sigModalDone() {
    if (!state.hasMark || !state.sigCanvas) return;
    const dataURL = cropSigCanvas(state.sigCanvas);
    const preview = $(`sigPreview${state.activeSig}`);
    const box = $(`sigBox${state.activeSig}`);
    if (preview) {
      preview.src = dataURL;
      preview.style.display = 'block';
    }
    if (box) box.classList.add('sig-has-data');
    box?.classList.remove('field-missing');
    const dateId = state.activeSig === '1' ? 'transferSignatureDate' : 'receiverSignatureDate';
    const dateEl = $(dateId);
    if (dateEl && !String(dateEl.value || '').trim()) dateEl.value = formatDate();
    safeLocalStorage((storage) => storage.setItem(APP.signatureKeyPrefix + state.activeSig, dataURL));
    saveToStorage();
    closeSigModal();
  }

  function clearSigBox(signatureId, shouldSave = true) {
    const id = String(signatureId);
    const preview = $(`sigPreview${id}`);
    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
    $(`sigBox${id}`)?.classList.remove('sig-has-data', 'field-missing');
    const dateId = id === '1' ? 'transferSignatureDate' : 'receiverSignatureDate';
    const dateEl = $(dateId);
    if (dateEl) dateEl.value = '';
    safeLocalStorage((storage) => storage.removeItem(APP.signatureKeyPrefix + id));
    if (shouldSave) saveToStorage();
  }

  function restoreSignatures() {
    APP.signatureIds.forEach((id) => {
      const sig = safeLocalStorage((storage) => storage.getItem(APP.signatureKeyPrefix + id));
      if (!sig) return;
      const preview = $(`sigPreview${id}`);
      const box = $(`sigBox${id}`);
      if (preview) {
        preview.src = sig;
        preview.style.display = 'block';
      }
      if (box) box.classList.add('sig-has-data');
    });
  }

  function sigPos(e) {
    const r = state.sigCanvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function startSig(e) {
    e.preventDefault();
    initSigCanvas();
    if (!state.sigCtx) return;
    state.isSigning = true;
    state.sigCanvas.setPointerCapture?.(e.pointerId);
    const p = sigPos(e);
    state.sigCtx.beginPath();
    state.sigCtx.moveTo(p.x, p.y);
  }

  function moveSig(e) {
    if (!state.isSigning || !state.sigCtx) return;
    e.preventDefault();
    const p = sigPos(e);
    state.sigCtx.lineTo(p.x, p.y);
    state.sigCtx.stroke();
    state.hasMark = true;
    $('sigModalDone')?.classList.add('ready');
  }

  function endSig(e) {
    if (e) {
      e.preventDefault();
      state.sigCanvas?.releasePointerCapture?.(e.pointerId);
    }
    state.isSigning = false;
  }

  function bindSignatureCanvas() {
    const canvas = $('sigCanvas');
    if (!canvas || canvas.dataset.bound === 'true') return;
    canvas.dataset.bound = 'true';
    canvas.tabIndex = 0;
    canvas.addEventListener('pointerdown', startSig);
    canvas.addEventListener('pointermove', moveSig);
    canvas.addEventListener('pointerup', endSig);
    canvas.addEventListener('pointercancel', endSig);
    canvas.addEventListener('pointerleave', endSig);
  }

  function fieldValue(id) {
    return String($(id)?.value || '').trim();
  }

  function selectedOrOther(selectId, otherId) {
    const selected = fieldValue(selectId);
    if (selected === 'Other') return fieldValue(otherId) || 'Other';
    return selected;
  }

  function signatureData(id) {
    const preview = $(`sigPreview${id}`);
    return preview && preview.src && preview.style.display !== 'none' ? preview.src : '';
  }

  function printCell(label, value, extraClass = '') {
    const safeValue = value || '';
    return `<div class="print-cell ${extraClass}"><div class="print-label">${escapeHtml(label)}</div><div class="print-value">${escapeHtml(safeValue)}</div></div>`;
  }

  function printSection(title) {
    return `<div class="print-section-title">${escapeHtml(title)}</div>`;
  }

  function printSignature(title, date, src) {
    const image = src ? `<img src="${src}" alt="${escapeHtml(title)} signature">` : '';
    return `<div class="print-signature-panel"><div class="print-signature-title">${escapeHtml(title)}</div><div class="print-signature-date"><span>Date:</span> ${escapeHtml(date || '')}</div><div class="print-signature-label">Signature</div><div class="print-signature-box">${image}</div></div>`;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderPrintPage() {
    const printPage = $('printPage');
    if (!printPage) return;
    const receiverContact = selectedOrOther('receiverContactName', 'receiverContactNameOther');
    const rows = [
      '<div class="print-header"><div class="print-brand">Precision E-Cycle</div><div class="print-subtitle">Transfer of Custody</div><div class="print-note">Secure IT recycling, electronics recycling, and data destruction documentation</div></div>',
      `<div class="print-row cols-2 meta-print-row">${printCell('TOC Form #', fieldValue('tocFormNumber'))}${printCell('Date', fieldValue('formDate'))}</div>`,
      `<div class="print-row cols-1 po-print-row">${printCell('PO #', fieldValue('poNumber'))}</div>`,
      printSection('Transferring Party (From)'),
      `<div class="print-row cols-2">${printCell('Company Name', fieldValue('fromCompanyName'))}${printCell('Contact Name', fieldValue('fromContactName'))}</div>`,
      `<div class="print-row cols-3">${printCell('Address', fieldValue('fromAddress'))}${printCell('Phone', fieldValue('fromPhone'))}${printCell('Email', fieldValue('fromEmail'))}</div>`,
      `<div class="print-row cols-city">${printCell('City', fieldValue('fromCity'))}${printCell('State', fieldValue('fromState'))}${printCell('Zip', fieldValue('fromZip'))}${printCell('Transfer Method', selectedOrOther('transferMethod', 'transferMethodOther'))}</div>`,
      printSection('Receiving Party (To) — Precision E-Cycle'),
      `<div class="print-row cols-2">${printCell('Company Name', 'Precision E-Cycle')}${printCell('Contact Name', receiverContact)}</div>`,
      `<div class="print-row cols-3">${printCell('Address', '4100 Industrial Ave, STE D')}${printCell('Phone', fieldValue('receiverPhone'))}${printCell('Email', 'info@precisionecycle.com')}</div>`,
      `<div class="print-row cols-city">${printCell('City', 'Lincoln')}${printCell('State', 'NE')}${printCell('Zip', '68504')}${printCell('Received By', selectedOrOther('receivedBy', 'receivedByOther'))}</div>`,
      printSection('Transfer Details'),
      `<div class="print-row cols-2">${printCell('Reason for Transfer', selectedOrOther('reasonSelect', 'reasonOther'))}${printCell('Data Destruction Required', getRadioGroupValue('dataDestruction'))}</div>`,
      `<div class="print-row cols-3">${printCell('Certificate Required', getRadioGroupValue('certificateRequired'))}${printCell('Est. Total Weight (lbs)', selectedOrOther('estimatedWeight', 'estimatedWeightOther'))}${printCell('Total Units', fieldValue('totalUnits'))}</div>`,
      '<div class="print-note-box">* See attached appendix for serialized audit report.</div>',
      `<div class="print-signature-row">${printSignature('Transferring Party', fieldValue('transferSignatureDate'), signatureData('1'))}${printSignature('Receiving Party — Precision E-Cycle', fieldValue('receiverSignatureDate'), signatureData('2'))}</div>`
    ];
    printPage.innerHTML = rows.join('');
  }

  function trapModalFocus(event) {
    if (event.key !== 'Tab') return;
    const modal = $('.sig-modal.open, .print-warning-modal.open');
    if (!modal) return;
    const focusable = $$('button, [href], input, select, textarea, canvas, [tabindex]:not([tabindex="-1"])', modal)
      .filter((el) => !el.disabled && getComputedStyle(el).display !== 'none');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === 'new-form') resetForm();
      if (action === 'print') requestPrint();
      if (action === 'force-print') printAnyway();
      if (action === 'continue-editing') closePrintWarningModal();
      if (action === 'today') setTodayAllDates();
      if (action === 'clear-signature') {
        event.stopPropagation();
        clearSigBox(actionEl.dataset.signature);
      }
      if (action === 'modal-clear-signature') sigModalClear();
      if (action === 'modal-save-signature') sigModalDone();
      return;
    }

    const sigBox = event.target.closest('[data-signature-box]');
    if (sigBox) openSigModal(sigBox.dataset.signatureBox);
  }

  function handleKeydown(event) {
    trapModalFocus(event);
    if (event.key === 'Escape') {
      if ($('printWarningModal')?.classList.contains('open')) closePrintWarningModal();
      if ($('sigModal')?.classList.contains('open')) closeSigModal();
    }
    const sigBox = event.target.closest('[data-signature-box]');
    if (!sigBox) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSigModal(sigBox.dataset.signatureBox);
    }
  }

  function handleInput(event) {
    const el = event.target;
    if (el.matches('[data-format]')) handleFormattedInput(el);
    else validateField(el, true);
    saveToStorage();
  }

  function handleChange(event) {
    const el = event.target;
    if (el.matches('select[data-other-target]')) toggleOtherForSelect(el);
    if (el.id === 'receiverContactName') syncReceiverContact();
    if (el.matches('[data-format]')) formatFieldValue(el);
    validateField(el, true);
    saveToStorage();
  }

  function init() {
    populateStateOptions();
    populateWeightOptions();
    bindSignatureCanvas();
    loadFromStorage();
    renderPrintPage();
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleChange);
    window.addEventListener('beforeprint', renderPrintPage);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
