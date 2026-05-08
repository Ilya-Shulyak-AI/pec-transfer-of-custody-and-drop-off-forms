(() => {
  'use strict';

  const APP = {
    storageKey: 'pec_toc_form_v4',
    oldStorageKeys: ['pec_toc_form_v3', 'pec_toc_form_v2'],
    signatureKeyPrefix: 'pec_toc_sig_',
    states: [
      'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
      'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
      'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
      'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
      'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
    ],
    dateFields: ['formDate', 'transferSignatureDate', 'receiverSignatureDate'],
    signatureIds: ['1', '2']
  };

  const state = {
    sigCanvas: null,
    sigCtx: null,
    isSigning: false,
    hasMark: false,
    activeSig: '1'
  };

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function safeLocalStorage(action, fallback = null) {
    try {
      return action(window.localStorage);
    } catch (error) {
      console.warn('Local storage unavailable:', error);
      return fallback;
    }
  }

  function formatDate() {
    const n = new Date();
    return String(n.getMonth() + 1).padStart(2, '0') + ' / ' + String(n.getDate()).padStart(2, '0') + ' / ' + n.getFullYear();
  }

  function setTodayAllDates() {
    const today = formatDate();
    APP.dateFields.forEach((id) => {
      const el = $(id);
      if (el) el.value = today;
    });
    saveToStorage();
  }

  function formatPhoneValue(value) {
    let v = value.replace(/\D/g, '').substring(0, 10);
    if (v.length >= 6) return '(' + v.substring(0, 3) + ') ' + v.substring(3, 6) + '-' + v.substring(6);
    if (v.length >= 3) return '(' + v.substring(0, 3) + ') ' + v.substring(3);
    return v;
  }

  function formatManualWeightValue(value) {
    const digits = value.replace(/\D/g, '');
    return digits ? Number(digits).toLocaleString('en-US') : '';
  }

  function normalizeStateValue(value) {
    return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  }

  function handleFormattedInput(el) {
    const type = el.dataset.format;
    if (type === 'phone') el.value = formatPhoneValue(el.value);
    if (type === 'weight') el.value = formatManualWeightValue(el.value);
    if (type === 'state') {
      el.value = normalizeStateValue(el.value);
      if (el.value.length === 2 && !APP.states.includes(el.value)) {
        el.setCustomValidity('Use a valid 2-letter state abbreviation.');
      } else {
        el.setCustomValidity('');
      }
    }
  }

  function toggleOtherForSelect(select) {
    const wrapId = select.dataset.otherTarget;
    if (!wrapId) return;
    const wrap = $(wrapId);
    if (!wrap) return;
    const show = select.value === 'Other';
    wrap.style.display = show ? 'block' : 'none';
    const input = wrap.querySelector('input');
    if (!show && input) input.value = '';
  }

  function toggleAllOtherFields() {
    $$('select[data-other-target]').forEach(toggleOtherForSelect);
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
      const value = weight.toLocaleString('en-US') + ' lbs';
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

  function saveToStorage() {
    const data = {};
    getSaveFields().forEach((el) => {
      data[el.id] = el.type === 'radio' ? el.checked : el.value;
    });
    safeLocalStorage((storage) => storage.setItem(APP.storageKey, JSON.stringify({ version: 4, savedAt: new Date().toISOString(), data })));
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

  function loadFromStorage() {
    const saved = readStoredPayload();
    if (!saved) {
      setTodayAllDates();
      restoreSignatures();
      toggleAllOtherFields();
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const data = parsed && parsed.data ? parsed.data : parsed;
      getSaveFields().forEach((el) => {
        if (data[el.id] === undefined) return;
        if (el.type === 'radio') el.checked = Boolean(data[el.id]);
        else el.value = data[el.id];
      });
    } catch (error) {
      console.warn('Stored form data could not be read. Clearing corrupted data.', error);
      clearStoredFormData();
      setTodayAllDates();
    }

    restoreSignatures();
    toggleAllOtherFields();
  }

  function clearStoredFormData() {
    safeLocalStorage((storage) => {
      storage.removeItem(APP.storageKey);
      APP.oldStorageKeys.forEach((key) => storage.removeItem(key));
      APP.signatureIds.forEach((id) => storage.removeItem(APP.signatureKeyPrefix + id));
    });
  }

  function resetForm() {
    if (!confirm('Clear this form and start a new one?')) return;

    getSaveFields().forEach((el) => {
      if (el.type === 'radio') el.checked = false;
      else el.value = '';
      if (typeof el.setCustomValidity === 'function') el.setCustomValidity('');
    });

    APP.signatureIds.forEach(clearSigBox);
    clearStoredFormData();
    toggleAllOtherFields();
    setTodayAllDates();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initSigCanvas() {
    if (!state.sigCanvas) state.sigCanvas = $('sigCanvas');
    if (state.sigCanvas && !state.sigCtx) state.sigCtx = state.sigCanvas.getContext('2d');
  }

  function openSigModal(signatureId) {
    initSigCanvas();
    if (!state.sigCanvas || !state.sigCtx) return;

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
      state.sigCanvas.width = r.width || 300;
      state.sigCanvas.height = r.height || 300;
      state.sigCtx.strokeStyle = '#1a1a1a';
      state.sigCtx.lineWidth = 2.5;
      state.sigCtx.lineCap = 'round';
      state.sigCtx.lineJoin = 'round';
    });
  }

  function sigModalClear() {
    initSigCanvas();
    if (!state.sigCtx || !state.sigCanvas) return;
    state.sigCtx.clearRect(0, 0, state.sigCanvas.width, state.sigCanvas.height);
    state.hasMark = false;
    $('sigModalDone')?.classList.remove('ready');
  }

  function cropSigCanvas(srcCanvas) {
    return srcCanvas.toDataURL('image/png');
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
    if (box) box.classList.add('sig-has-data');
    safeLocalStorage((storage) => storage.setItem(APP.signatureKeyPrefix + state.activeSig, dataURL));
    $('sigModal')?.classList.remove('open');
  }

  function clearSigBox(signatureId) {
    const id = String(signatureId);
    const preview = $('sigPreview' + id);
    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
    $('sigBox' + id)?.classList.remove('sig-has-data');
    safeLocalStorage((storage) => storage.removeItem(APP.signatureKeyPrefix + id));
  }

  function restoreSignatures() {
    APP.signatureIds.forEach((id) => {
      const sig = safeLocalStorage((storage) => storage.getItem(APP.signatureKeyPrefix + id));
      if (!sig) return;
      const preview = $('sigPreview' + id);
      const box = $('sigBox' + id);
      if (preview) {
        preview.src = sig;
        preview.style.display = 'block';
      }
      if (box) box.classList.add('sig-has-data');
    });
  }

  function sigPos(e) {
    const r = state.sigCanvas.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return {
      x: (s.clientX - r.left) * (state.sigCanvas.width / r.width),
      y: (s.clientY - r.top) * (state.sigCanvas.height / r.height)
    };
  }

  function startSig(e) {
    e.preventDefault();
    initSigCanvas();
    if (!state.sigCtx) return;
    state.isSigning = true;
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
    if (e) e.preventDefault();
    state.isSigning = false;
  }

  function bindSignatureCanvas() {
    const canvas = $('sigCanvas');
    if (!canvas || canvas.dataset.bound === 'true') return;
    canvas.dataset.bound = 'true';
    canvas.addEventListener('mousedown', startSig);
    canvas.addEventListener('mousemove', moveSig);
    canvas.addEventListener('mouseup', endSig);
    canvas.addEventListener('mouseleave', endSig);
    canvas.addEventListener('touchstart', startSig, { passive: false });
    canvas.addEventListener('touchmove', moveSig, { passive: false });
    canvas.addEventListener('touchend', endSig, { passive: false });
  }

  function handleClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === 'new-form') resetForm();
      if (action === 'print') window.print();
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

  function handleInput(event) {
    const el = event.target;
    if (el.matches('[data-format]')) handleFormattedInput(el);
    saveToStorage();
  }

  function handleChange(event) {
    const el = event.target;
    if (el.matches('select[data-other-target]')) toggleOtherForSelect(el);
    saveToStorage();
  }

  function init() {
    populateStateOptions();
    populateWeightOptions();
    bindSignatureCanvas();
    loadFromStorage();
    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleChange);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
