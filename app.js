(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants and application configuration
  // ---------------------------------------------------------------------------

  const CONFIG = {
    storage: {
      formKey: 'pec_toc_form_v6',
      oldFormKeys: ['pec_toc_form_v5', 'pec_toc_form_v4', 'pec_toc_form_v3', 'pec_toc_form_v2'],
      signatureKeyPrefix: 'pec_toc_sig_',
      payloadVersion: 6
    },
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
    optionalEmptyFields: ['poNumber'],
    requiredRadioGroups: {
      dataDestruction: 'Data Destruction Required',
      certificateRequired: 'Certificate Required'
    }
  };

  const signatureState = {
    canvas: null,
    context: null,
    isSigning: false,
    hasMark: false,
    activeId: '1'
  };

  // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------

  function byId(id) {
    return document.getElementById(id);
  }

  function all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function idFromConfig(name) {
    return CONFIG.ids[name];
  }

  function signaturePreviewId(signatureId) {
    return CONFIG.ids.signaturePreviewPrefix + signatureId;
  }

  function signatureBoxId(signatureId) {
    return CONFIG.ids.signatureBoxPrefix + signatureId;
  }

  function getRadioGroupValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : '';
  }

  function setRadioGroupValue(name, value) {
    all(`input[name="${name}"]`).forEach((el) => {
      el.checked = el.value === value;
    });
  }

  function setValidity(el, message) {
    if (!el || typeof el.setCustomValidity !== 'function') {
      return;
    }

    el.setCustomValidity(message || '');
  }

  function findFieldContainer(el) {
    return el?.closest(CONFIG.selectors.fieldContainer);
  }

  function markField(el, isMissing) {
    const container = findFieldContainer(el);
    if (container) {
      container.classList.toggle('field-missing', Boolean(isMissing));
    }
  }

  function clearMissingHighlights() {
    all(CONFIG.selectors.missingField).forEach((el) => {
      el.classList.remove('field-missing');
    });
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  function formatDate() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${month} / ${day} / ${now.getFullYear()}`;
  }

  function formatDateCompact() {
    return formatDate().replace(/\s/g, '');
  }

  function generateTocNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const suffix = String(Math.floor(1000 + Math.random() * 9000));

    return `TOC-${year}${month}${day}-${suffix}`;
  }

  function formatPhoneValue(value) {
    const digits = value.replace(/\D/g, '').substring(0, 10);

    if (digits.length >= 6) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    }

    if (digits.length >= 3) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
    }

    return digits;
  }

  function formatManualWeightValue(value) {
    const digits = value.replace(/\D/g, '');
    return digits ? Number(digits).toLocaleString('en-US') : '';
  }

  function normalizeStateValue(value) {
    return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  }

  function formatFieldValue(el) {
    const type = el.dataset.format;

    if (type === 'phone') {
      el.value = formatPhoneValue(el.value);
    }

    if (type === 'weight') {
      el.value = formatManualWeightValue(el.value);
    }

    if (type === 'state') {
      el.value = normalizeStateValue(el.value);
    }
  }

  function handleFormattedInput(el) {
    formatFieldValue(el);
    validateField(el, true);
  }

  function formatRestoredFields() {
    getSaveFields().forEach((el) => {
      if (el.dataset.format) {
        formatFieldValue(el);
      }
    });
  }

  function ensureTocFormNumber() {
    const el = byId(idFromConfig('tocFormNumber'));
    if (el && !String(el.value || '').trim()) {
      el.value = generateTocNumber();
    }
  }

  function setTodayAllDates() {
    const today = formatDate();

    CONFIG.dateFields.forEach((id) => {
      const el = byId(id);
      if (el) {
        el.value = today;
      }
    });

    saveToStorage();
  }

  function stampSignatureDate(signatureId) {
    const targetId = CONFIG.ids.signatureDates[String(signatureId)];
    const el = byId(targetId);

    if (el && !String(el.value || '').trim()) {
      el.value = formatDateCompact();
    }
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function isHiddenByOtherWrap(el) {
    const wrap = el.closest(CONFIG.selectors.otherWrap);
    return wrap && getComputedStyle(wrap).display === 'none';
  }

  function signatureIsMissing(id) {
    const preview = byId(signaturePreviewId(id));
    return !preview || !preview.src || preview.style.display === 'none';
  }

  function markSignatureBoxes(mark) {
    const missing = [];

    CONFIG.signatureIds.forEach((id) => {
      const isMissing = signatureIsMissing(id);

      if (isMissing) {
        missing.push(id);
      }

      if (mark) {
        byId(signatureBoxId(id))?.classList.toggle('field-missing', isMissing);
      }
    });

    return missing;
  }

  function isEmptyExpectedField(el) {
    if (!el || !el.id) {
      return false;
    }

    if (CONFIG.optionalEmptyFields.includes(el.id)) {
      return false;
    }

    if (el.type === 'radio' || el.readOnly || el.disabled || isHiddenByOtherWrap(el)) {
      return false;
    }

    return !String(el.value || '').trim();
  }

  function fieldHasInvalidValue(el) {
    const value = String(el.value || '').trim();

    if (!value) {
      return false;
    }

    if (el.dataset.format === 'state') {
      return !CONFIG.states.includes(value.toUpperCase());
    }

    if (el.type === 'email') {
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    if (el.type === 'tel') {
      const digits = value.replace(/\D/g, '');
      return digits.length > 0 && digits.length !== 10;
    }

    if (el.dataset.format === 'weight') {
      return Number(value.replace(/\D/g, '')) <= 0;
    }

    return false;
  }

  function validateRequiredRadioGroups(mark = false) {
    const missing = [];

    Object.entries(CONFIG.requiredRadioGroups).forEach(([groupName, label]) => {
      const checked = Boolean(getRadioGroupValue(groupName));

      if (!checked) {
        missing.push(label);
      }

      if (mark) {
        all(`input[name="${groupName}"]`).forEach((el) => markField(el, !checked));
      }
    });

    return missing;
  }

  function validateField(el, mark = false) {
    if (!el || !el.id) {
      return true;
    }

    const missing = isEmptyExpectedField(el);
    const invalid = fieldHasInvalidValue(el);

    setValidity(el, invalid ? 'Please check this field.' : '');

    if (mark) {
      markField(el, missing || invalid);
    }

    return !missing && !invalid;
  }

  function validateAllFields(mark = false) {
    if (mark) {
      clearMissingHighlights();
    }

    const fieldResults = getSaveFields().map((el) => validateField(el, mark));
    const missingRadioGroups = validateRequiredRadioGroups(mark);
    const missingSignatures = markSignatureBoxes(mark);

    return {
      isValid: fieldResults.every(Boolean) && missingRadioGroups.length === 0 && missingSignatures.length === 0,
      missingRadioGroups,
      missingSignatures
    };
  }

  function showValidationBanner() {
    return;
  }

  function hideValidationBanner() {
    return;
  }

  // ---------------------------------------------------------------------------
  // Conditional fields
  // ---------------------------------------------------------------------------

  function toggleOtherForSelect(select) {
    const wrapId = select.dataset.otherTarget;
    if (!wrapId) {
      return;
    }

    const wrap = byId(wrapId);
    if (!wrap) {
      return;
    }

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
    all(CONFIG.selectors.otherSelect).forEach(toggleOtherForSelect);
  }

  function populateStateOptions() {
    const list = byId(idFromConfig('stateOptions'));
    if (!list || list.children.length) {
      return;
    }

    CONFIG.states.forEach((stateAbbr) => {
      const option = document.createElement('option');
      option.value = stateAbbr;
      list.appendChild(option);
    });
  }

  function populateWeightOptions() {
    const select = byId(idFromConfig('estimatedWeight'));
    if (!select || select.dataset.populated === 'true') {
      return;
    }

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

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------

  function safeLocalStorage(action, fallback = null) {
    try {
      return action(window.localStorage);
    } catch (error) {
      console.warn('Local storage unavailable:', error);
      return fallback;
    }
  }

  function getSaveFields() {
    return all(CONFIG.selectors.saveField).filter((el) => el.id);
  }

  function getFormData() {
    const data = {};

    getSaveFields().forEach((el) => {
      if (el.type !== 'radio') {
        data[el.id] = el.value;
      }
    });

    CONFIG.radioGroups.forEach((groupName) => {
      data[groupName] = getRadioGroupValue(groupName);
    });

    return data;
  }

  function saveToStorage() {
    const payload = {
      version: CONFIG.storage.payloadVersion,
      savedAt: new Date().toISOString(),
      data: getFormData()
    };

    safeLocalStorage((storage) => {
      storage.setItem(CONFIG.storage.formKey, JSON.stringify(payload));
    });
  }

  function readStoredPayload() {
    return safeLocalStorage((storage) => {
      const current = storage.getItem(CONFIG.storage.formKey);
      if (current) {
        return current;
      }

      for (const key of CONFIG.storage.oldFormKeys) {
        const oldValue = storage.getItem(key);
        if (oldValue) {
          return oldValue;
        }
      }

      return null;
    });
  }

  function loadRadioGroupData(data) {
    CONFIG.radioGroups.forEach((groupName) => {
      if (data[groupName]) {
        setRadioGroupValue(groupName, data[groupName]);
        return;
      }

      all(`input[name="${groupName}"]`).forEach((el) => {
        if (data[el.id]) {
          el.checked = true;
        }
      });
    });
  }

  function loadFromStorage() {
    const saved = readStoredPayload();

    if (!saved) {
      setTodayAllDates();
      ensureTocFormNumber();
      restoreSignatures();
      toggleAllOtherFields();
      saveToStorage();
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const data = parsed && parsed.data ? parsed.data : parsed;

      getSaveFields().forEach((el) => {
        if (el.type === 'radio') {
          return;
        }

        if (data[el.id] !== undefined) {
          el.value = data[el.id];
        }
      });

      loadRadioGroupData(data);
    } catch (error) {
      console.warn('Stored form data could not be read. Clearing corrupted data.', error);
      clearStoredFormData();
      setTodayAllDates();
    }

    formatRestoredFields();
    ensureTocFormNumber();
    restoreSignatures();
    toggleAllOtherFields();
    validateAllFields(false);
    saveToStorage();
  }

  function clearStoredFormData() {
    safeLocalStorage((storage) => {
      storage.removeItem(CONFIG.storage.formKey);
      CONFIG.storage.oldFormKeys.forEach((key) => storage.removeItem(key));
      CONFIG.signatureIds.forEach((id) => {
        storage.removeItem(CONFIG.storage.signatureKeyPrefix + id);
      });
    });
  }

  function resetForm() {
    if (!confirm('Clear this form and start a new one?')) {
      return;
    }

    getSaveFields().forEach((el) => {
      if (el.type === 'radio') {
        el.checked = false;
      } else {
        el.value = '';
      }

      setValidity(el, '');
    });

    CONFIG.signatureIds.forEach(clearSigBox);
    clearStoredFormData();
    clearMissingHighlights();
    hideValidationBanner();
    toggleAllOtherFields();
    setTodayAllDates();
    ensureTocFormNumber();
    saveToStorage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------------------
  // Signatures
  // ---------------------------------------------------------------------------

  function initSigCanvas() {
    if (!signatureState.canvas) {
      signatureState.canvas = byId(idFromConfig('signatureCanvas'));
    }

    if (signatureState.canvas && !signatureState.context) {
      signatureState.context = signatureState.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  function prepareSignatureCanvas() {
    const wrap = byId(idFromConfig('signatureModalWrap'));
    if (!wrap || !signatureState.canvas || !signatureState.context) {
      return;
    }

    const rect = wrap.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;

    signatureState.canvas.width = Math.max(300, Math.floor(rect.width * scale));
    signatureState.canvas.height = Math.max(200, Math.floor(rect.height * scale));
    signatureState.canvas.style.width = `${rect.width}px`;
    signatureState.canvas.style.height = `${rect.height}px`;

    signatureState.context.setTransform(scale, 0, 0, scale, 0, 0);
    signatureState.context.strokeStyle = '#1a1a1a';
    signatureState.context.lineWidth = 2.5;
    signatureState.context.lineCap = 'round';
    signatureState.context.lineJoin = 'round';
  }

  function openSigModal(signatureId) {
    initSigCanvas();
    if (!signatureState.canvas || !signatureState.context) {
      return;
    }

    signatureState.activeId = String(signatureId);
    signatureState.hasMark = false;
    byId(idFromConfig('signatureModalDone'))?.classList.remove('ready');

    const subtitle = byId(idFromConfig('signatureModalSubtitle'));
    if (subtitle) {
      subtitle.textContent = signatureState.activeId === '1' ? 'Transferring Party' : 'Receiving Party';
    }

    byId(idFromConfig('signatureModal'))?.classList.add('open');
    requestAnimationFrame(prepareSignatureCanvas);
  }

  function sigModalClear() {
    initSigCanvas();
    if (!signatureState.context || !signatureState.canvas) {
      return;
    }

    signatureState.context.save();
    signatureState.context.setTransform(1, 0, 0, 1, 0, 0);
    signatureState.context.clearRect(0, 0, signatureState.canvas.width, signatureState.canvas.height);
    signatureState.context.restore();

    signatureState.hasMark = false;
    byId(idFromConfig('signatureModalDone'))?.classList.remove('ready');
  }

  function cropSigCanvas(srcCanvas) {
    const context = srcCanvas.getContext('2d', { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
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

    if (maxX <= minX || maxY <= minY) {
      return srcCanvas.toDataURL('image/png');
    }

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
    if (!signatureState.hasMark || !signatureState.canvas) {
      return;
    }

    const dataURL = cropSigCanvas(signatureState.canvas);
    const preview = byId(signaturePreviewId(signatureState.activeId));
    const box = byId(signatureBoxId(signatureState.activeId));

    if (preview) {
      preview.src = dataURL;
      preview.style.display = 'block';
    }

    if (box) {
      box.classList.add('sig-has-data');
    }

    box?.classList.remove('field-missing');
    stampSignatureDate(signatureState.activeId);

    safeLocalStorage((storage) => {
      storage.setItem(CONFIG.storage.signatureKeyPrefix + signatureState.activeId, dataURL);
    });

    saveToStorage();
    byId(idFromConfig('signatureModal'))?.classList.remove('open');
  }

  function clearSigBox(signatureId) {
    const id = String(signatureId);
    const preview = byId(signaturePreviewId(id));

    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }

    byId(signatureBoxId(id))?.classList.remove('sig-has-data');

    safeLocalStorage((storage) => {
      storage.removeItem(CONFIG.storage.signatureKeyPrefix + id);
    });
  }

  function restoreSignatures() {
    CONFIG.signatureIds.forEach((id) => {
      const signature = safeLocalStorage((storage) => {
        return storage.getItem(CONFIG.storage.signatureKeyPrefix + id);
      });

      if (!signature) {
        return;
      }

      const preview = byId(signaturePreviewId(id));
      const box = byId(signatureBoxId(id));

      if (preview) {
        preview.src = signature;
        preview.style.display = 'block';
      }

      if (box) {
        box.classList.add('sig-has-data');
      }
    });
  }

  function sigPos(event) {
    const rect = signatureState.canvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;

    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top
    };
  }

  function startSig(event) {
    event.preventDefault();
    initSigCanvas();

    if (!signatureState.context) {
      return;
    }

    signatureState.isSigning = true;
    const point = sigPos(event);
    signatureState.context.beginPath();
    signatureState.context.moveTo(point.x, point.y);
  }

  function moveSig(event) {
    if (!signatureState.isSigning || !signatureState.context) {
      return;
    }

    event.preventDefault();

    const point = sigPos(event);
    signatureState.context.lineTo(point.x, point.y);
    signatureState.context.stroke();
    signatureState.hasMark = true;
    byId(idFromConfig('signatureModalDone'))?.classList.add('ready');
  }

  function endSig(event) {
    if (event) {
      event.preventDefault();
    }

    signatureState.isSigning = false;
  }

  function bindSignatureCanvas() {
    const canvas = byId(idFromConfig('signatureCanvas'));
    if (!canvas || canvas.dataset.bound === 'true') {
      return;
    }

    canvas.dataset.bound = 'true';
    canvas.addEventListener('mousedown', startSig);
    canvas.addEventListener('mousemove', moveSig);
    canvas.addEventListener('mouseup', endSig);
    canvas.addEventListener('mouseleave', endSig);
    canvas.addEventListener('touchstart', startSig, { passive: false });
    canvas.addEventListener('touchmove', moveSig, { passive: false });
    canvas.addEventListener('touchend', endSig, { passive: false });
  }

  // ---------------------------------------------------------------------------
  // Print
  // ---------------------------------------------------------------------------

  function openPrintWarningModal() {
    byId(idFromConfig('printWarningModal'))?.classList.add('open');
  }

  function closePrintWarningModal() {
    byId(idFromConfig('printWarningModal'))?.classList.remove('open');
  }

  function requestPrint() {
    const result = validateAllFields(true);

    if (result.isValid) {
      clearMissingHighlights();
      window.print();
      return;
    }

    openPrintWarningModal();
  }

  function printAnyway() {
    closePrintWarningModal();
    clearMissingHighlights();
    window.print();
  }

  // ---------------------------------------------------------------------------
  // Event binding
  // ---------------------------------------------------------------------------

  function handleActionClick(event, actionEl) {
    const action = actionEl.dataset.action;

    if (action === CONFIG.actions.newForm) {
      resetForm();
    }

    if (action === CONFIG.actions.print) {
      requestPrint();
    }

    if (action === CONFIG.actions.forcePrint) {
      printAnyway();
    }

    if (action === CONFIG.actions.continueEditing) {
      closePrintWarningModal();
    }

    if (action === CONFIG.actions.today) {
      setTodayAllDates();
    }

    if (action === CONFIG.actions.clearSignature) {
      event.stopPropagation();
      clearSigBox(actionEl.dataset.signature);
    }

    if (action === CONFIG.actions.modalClearSignature) {
      sigModalClear();
    }

    if (action === CONFIG.actions.modalSaveSignature) {
      sigModalDone();
    }
  }

  function handleClick(event) {
    const actionEl = event.target.closest(CONFIG.selectors.action);

    if (actionEl) {
      handleActionClick(event, actionEl);
      return;
    }

    const sigBox = event.target.closest(CONFIG.selectors.signatureBox);
    if (sigBox) {
      openSigModal(sigBox.dataset.signatureBox);
    }
  }

  function handleKeydown(event) {
    const sigBox = event.target.closest(CONFIG.selectors.signatureBox);
    if (!sigBox) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSigModal(sigBox.dataset.signatureBox);
    }
  }

  function handleInput(event) {
    const el = event.target;

    if (el.matches(CONFIG.selectors.formattedField)) {
      handleFormattedInput(el);
    } else {
      validateField(el, true);
    }

    saveToStorage();
  }

  function handleChange(event) {
    const el = event.target;

    if (el.matches(CONFIG.selectors.otherSelect)) {
      toggleOtherForSelect(el);
    }

    validateField(el, true);
    saveToStorage();
  }

  function bindEvents() {
    bindSignatureCanvas();
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleChange);
  }

  function init() {
    populateStateOptions();
    populateWeightOptions();
    bindEvents();
    loadFromStorage();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
