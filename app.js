(() => {
  'use strict';

  const APP = {
    storageKey: 'pec_toc_form_v6',
    oldStorageKeys: ['pec_toc_form_v5', 'pec_toc_form_v4', 'pec_toc_form_v3', 'pec_toc_form_v2'],
    signatureKeyPrefix: 'pec_toc_sig_',
    states: ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'],
    dateFields: ['formDate', 'transferSignatureDate', 'receiverSignatureDate'],
    signatureIds: ['1', '2'],
    radioGroups: ['dataDestruction', 'certificateRequired'],
    optionalEmptyFields: ['poNumber'],
    requiredRadioGroups: { dataDestruction: 'Data Destruction Required', certificateRequired: 'Certificate Required' },
    receiverContacts: { ilya: { name: 'Ilya Shulyak', phone: '(402) 413-1267' } }
  };

  const state = { sigCanvas: null, sigCtx: null, isSigning: false, hasMark: false, activeSig: '1' };
  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function safeLocalStorage(action, fallback = null) { try { return action(window.localStorage); } catch (error) { console.warn('Local storage unavailable:', error); return fallback; } }
  function formatDate() { const n = new Date(); return String(n.getMonth() + 1).padStart(2, '0') + ' / ' + String(n.getDate()).padStart(2, '0') + ' / ' + n.getFullYear(); }
  function formatDateCompact() { return formatDate().replace(/\s/g, ''); }
  function generateTocNumber() { const n = new Date(); const y = n.getFullYear(); const m = String(n.getMonth() + 1).padStart(2, '0'); const d = String(n.getDate()).padStart(2, '0'); const suffix = String(Math.floor(1000 + Math.random() * 9000)); return 'TOC-' + y + m + d + '-' + suffix; }
  function ensureTocFormNumber() { const el = $('tocFormNumber'); if (el && !String(el.value || '').trim()) el.value = generateTocNumber(); }
  function setTodayAllDates() { const today = formatDate(); APP.dateFields.forEach((id) => { const el = $(id); if (el) el.value = today; }); saveToStorage(); }
  function stampSignatureDate(signatureId) { const targetId = String(signatureId) === '1' ? 'transferSignatureDate' : 'receiverSignatureDate'; const el = $(targetId); if (el && !String(el.value || '').trim()) el.value = formatDateCompact(); }
  function formatPhoneValue(value) { let v = value.replace(/\D/g, '').substring(0, 10); if (v.length >= 6) return '(' + v.substring(0, 3) + ') ' + v.substring(3, 6) + '-' + v.substring(6); if (v.length >= 3) return '(' + v.substring(0, 3) + ') ' + v.substring(3); return v; }
  function formatManualWeightValue(value) { const digits = value.replace(/\D/g, ''); return digits ? Number(digits).toLocaleString('en-US') : ''; }
  function normalizeStateValue(value) { return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2); }
  function setValidity(el, message) { if (!el || typeof el.setCustomValidity !== 'function') return; el.setCustomValidity(message || ''); }
  function getRadioGroupValue(name) { const selected = document.querySelector(`input[name="${name}"]:checked`); return selected ? selected.value : ''; }
  function setRadioGroupValue(name, value) { $$(`input[name="${name}"]`).forEach((el) => { el.checked = el.value === value; }); }
  function findFieldContainer(el) { return el?.closest('.fld, .meta-item'); }
  function markField(el, isMissing) { const container = findFieldContainer(el); if (container) container.classList.toggle('field-missing', Boolean(isMissing)); }
  function clearMissingHighlights() { $$('.field-missing').forEach((el) => el.classList.remove('field-missing')); }
  function isHiddenByOtherWrap(el) { const wrap = el.closest('.other-wrap'); return wrap && getComputedStyle(wrap).display === 'none'; }
  function signatureIsMissing(id) { const preview = $('sigPreview' + id); return !preview || !preview.src || preview.style.display === 'none'; }
  function markSignatureBoxes(mark) { const missing = []; APP.signatureIds.forEach((id) => { const isMissing = signatureIsMissing(id); if (isMissing) missing.push(id); if (mark) $('sigBox' + id)?.classList.toggle('field-missing', isMissing); }); return missing; }
  function isEmptyExpectedField(el) { if (!el || !el.id || APP.optionalEmptyFields.includes(el.id) || el.type === 'radio' || el.readOnly || el.disabled || isHiddenByOtherWrap(el)) return false; return !String(el.value || '').trim(); }
  function fieldHasInvalidValue(el) {
    const value = String(el.value || '').trim();
    if (!value) return false;
    if (el.dataset.format === 'state') return !APP.states.includes(value.toUpperCase());
    if (el.type === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (el.type === 'tel') { const digits = value.replace(/\D/g, ''); return digits.length > 0 && digits.length !== 10; }
    if (el.dataset.format === 'weight') return Number(value.replace(/\D/g, '')) <= 0;
    return false;
  }
  function validateRequiredRadioGroups(mark = false) { const missing = []; Object.entries(APP.requiredRadioGroups).forEach(([groupName, label]) => { const checked = Boolean(getRadioGroupValue(groupName)); if (!checked) missing.push(label); if (mark) $$(`input[name="${groupName}"]`).forEach((el) => markField(el, !checked)); }); return missing; }
  function validateField(el, mark = false) { if (!el || !el.id) return true; const missing = isEmptyExpectedField(el); const invalid = fieldHasInvalidValue(el); setValidity(el, invalid ? 'Please check this field.' : ''); if (mark) markField(el, missing || invalid); return !missing && !invalid; }
  function validateAllFields(mark = false) { if (mark) clearMissingHighlights(); const fieldResults = getSaveFields().map((el) => validateField(el, mark)); const missingRadioGroups = validateRequiredRadioGroups(mark); const missingSignatures = markSignatureBoxes(mark); return { isValid: fieldResults.every(Boolean) && missingRadioGroups.length === 0 && missingSignatures.length === 0, missingRadioGroups, missingSignatures }; }
  function showValidationBanner() { return; }
  function hideValidationBanner() { return; }
  function openPrintWarningModal() { $('printWarningModal')?.classList.add('open'); }
  function closePrintWarningModal() { $('printWarningModal')?.classList.remove('open'); }
  function requestPrint() { const result = validateAllFields(true); if (result.isValid) { clearMissingHighlights(); window.print(); } else { openPrintWarningModal(); } }
  function printAnyway() { closePrintWarningModal(); clearMissingHighlights(); window.print(); }
  function formatFieldValue(el) { const type = el.dataset.format; if (type === 'phone') el.value = formatPhoneValue(el.value); if (type === 'weight') el.value = formatManualWeightValue(el.value); if (type === 'state') el.value = normalizeStateValue(el.value); }
  function handleFormattedInput(el) { formatFieldValue(el); validateField(el, true); }
  function formatRestoredFields() { getSaveFields().forEach((el) => { if (el.dataset.format) formatFieldValue(el); }); }
  function toggleOtherForSelect(select) { const wrapId = select.dataset.otherTarget; if (!wrapId) return; const wrap = $(wrapId); if (!wrap) return; const show = select.value === 'Other'; wrap.style.display = show ? 'block' : 'none'; wrap.closest('.select-other-row')?.classList.toggle('other-visible', show); const input = wrap.querySelector('input'); if (!show && input) { input.value = ''; setValidity(input, ''); markField(input, false); } }
  function toggleAllOtherFields() { $$('select[data-other-target]').forEach(toggleOtherForSelect); }
  function applyReceiverContactWorkflow(options = {}) { const contact = $('receiverContactName'); const phone = $('receiverPhone'); if (!contact || !phone) return; phone.readOnly = false; if (contact.value === APP.receiverContacts.ilya.name) phone.value = APP.receiverContacts.ilya.phone; if ((contact.value === 'Other' || contact.value === '') && options.clearPhone) phone.value = ''; if (phone.dataset.format) formatFieldValue(phone); validateField(phone, false); }
  function populateStateOptions() { const list = $('stateOptions'); if (!list || list.children.length) return; APP.states.forEach((stateAbbr) => { const option = document.createElement('option'); option.value = stateAbbr; list.appendChild(option); }); }
  function populateWeightOptions() { const select = $('estimatedWeight'); if (!select || select.dataset.populated === 'true') return; for (let weight = 100; weight <= 10000; weight += 100) { const value = weight.toLocaleString('en-US') + ' lbs'; const option = document.createElement('option'); option.value = value; option.textContent = value; select.appendChild(option); } const other = document.createElement('option'); other.value = 'Other'; other.textContent = 'Other'; select.appendChild(other); select.dataset.populated = 'true'; }
  function getSaveFields() { return $$('[data-save="true"]').filter((el) => el.id); }
  function getFormData() { const data = {}; getSaveFields().forEach((el) => { if (el.type !== 'radio') data[el.id] = el.value; }); APP.radioGroups.forEach((groupName) => { data[groupName] = getRadioGroupValue(groupName); }); return data; }
  function saveToStorage() { const payload = { version: 6, savedAt: new Date().toISOString(), data: getFormData() }; safeLocalStorage((storage) => storage.setItem(APP.storageKey, JSON.stringify(payload))); }
  function readStoredPayload() { return safeLocalStorage((storage) => { const current = storage.getItem(APP.storageKey); if (current) return current; for (const key of APP.oldStorageKeys) { const oldValue = storage.getItem(key); if (oldValue) return oldValue; } return null; }); }
  function loadFromStorage() { const saved = readStoredPayload(); if (!saved) { setTodayAllDates(); ensureTocFormNumber(); restoreSignatures(); toggleAllOtherFields(); applyReceiverContactWorkflow(); saveToStorage(); return; } try { const parsed = JSON.parse(saved); const data = parsed && parsed.data ? parsed.data : parsed; getSaveFields().forEach((el) => { if (el.type === 'radio') return; if (data[el.id] !== undefined) el.value = data[el.id]; }); APP.radioGroups.forEach((groupName) => { if (data[groupName]) setRadioGroupValue(groupName, data[groupName]); else $$(`input[name="${groupName}"]`).forEach((el) => { if (data[el.id]) el.checked = true; }); }); } catch (error) { console.warn('Stored form data could not be read. Clearing corrupted data.', error); clearStoredFormData(); setTodayAllDates(); } formatRestoredFields(); ensureTocFormNumber(); restoreSignatures(); toggleAllOtherFields(); applyReceiverContactWorkflow(); validateAllFields(false); saveToStorage(); }
  function clearStoredFormData() { safeLocalStorage((storage) => { storage.removeItem(APP.storageKey); APP.oldStorageKeys.forEach((key) => storage.removeItem(key)); APP.signatureIds.forEach((id) => storage.removeItem(APP.signatureKeyPrefix + id)); }); }
  function resetForm() { if (!confirm('Clear this form and start a new one?')) return; getSaveFields().forEach((el) => { if (el.type === 'radio') el.checked = false; else el.value = ''; setValidity(el, ''); }); APP.signatureIds.forEach(clearSigBox); clearStoredFormData(); clearMissingHighlights(); hideValidationBanner(); toggleAllOtherFields(); applyReceiverContactWorkflow(); setTodayAllDates(); ensureTocFormNumber(); saveToStorage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function initSigCanvas() { if (!state.sigCanvas) state.sigCanvas = $('sigCanvas'); if (state.sigCanvas && !state.sigCtx) state.sigCtx = state.sigCanvas.getContext('2d', { willReadFrequently: true }); }
  function openSigModal(signatureId) { initSigCanvas(); if (!state.sigCanvas || !state.sigCtx) return; state.activeSig = String(signatureId); state.hasMark = false; $('sigModalDone')?.classList.remove('ready'); const subtitle = $('sigModalSub'); if (subtitle) subtitle.textContent = state.activeSig === '1' ? 'Transferring Party' : 'Receiving Party'; $('sigModal')?.classList.add('open'); requestAnimationFrame(() => { const wrap = $('sigModalWrap'); if (!wrap) return; const r = wrap.getBoundingClientRect(); const scale = window.devicePixelRatio || 1; state.sigCanvas.width = Math.max(300, Math.floor(r.width * scale)); state.sigCanvas.height = Math.max(200, Math.floor(r.height * scale)); state.sigCanvas.style.width = r.width + 'px'; state.sigCanvas.style.height = r.height + 'px'; state.sigCtx.setTransform(scale, 0, 0, scale, 0, 0); state.sigCtx.strokeStyle = '#1a1a1a'; state.sigCtx.lineWidth = 2.5; state.sigCtx.lineCap = 'round'; state.sigCtx.lineJoin = 'round'; }); }
  function sigModalClear() { initSigCanvas(); if (!state.sigCtx || !state.sigCanvas) return; state.sigCtx.save(); state.sigCtx.setTransform(1, 0, 0, 1, 0, 0); state.sigCtx.clearRect(0, 0, state.sigCanvas.width, state.sigCanvas.height); state.sigCtx.restore(); state.hasMark = false; $('sigModalDone')?.classList.remove('ready'); }
  function cropSigCanvas(srcCanvas) { const ctx = srcCanvas.getContext('2d', { willReadFrequently: true }); const pixels = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height); const data = pixels.data; let minX = srcCanvas.width, minY = srcCanvas.height, maxX = 0, maxY = 0; for (let y = 0; y < srcCanvas.height; y++) { for (let x = 0; x < srcCanvas.width; x++) { const alpha = data[(y * srcCanvas.width + x) * 4 + 3]; if (alpha > 0) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); } } } if (maxX <= minX || maxY <= minY) return srcCanvas.toDataURL('image/png'); const pad = 16; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(srcCanvas.width, maxX + pad); maxY = Math.min(srcCanvas.height, maxY + pad); const width = maxX - minX; const height = maxY - minY; const out = document.createElement('canvas'); out.width = width; out.height = height; out.getContext('2d').drawImage(srcCanvas, minX, minY, width, height, 0, 0, width, height); return out.toDataURL('image/png'); }
  function sigModalDone() { if (!state.hasMark || !state.sigCanvas) return; const dataURL = cropSigCanvas(state.sigCanvas); const preview = $('sigPreview' + state.activeSig); const box = $('sigBox' + state.activeSig); if (preview) { preview.src = dataURL; preview.style.display = 'block'; } if (box) box.classList.add('sig-has-data'); box?.classList.remove('field-missing'); stampSignatureDate(state.activeSig); safeLocalStorage((storage) => storage.setItem(APP.signatureKeyPrefix + state.activeSig, dataURL)); saveToStorage(); $('sigModal')?.classList.remove('open'); }
  function clearSigBox(signatureId) { const id = String(signatureId); const preview = $('sigPreview' + id); if (preview) { preview.style.display = 'none'; preview.src = ''; } $('sigBox' + id)?.classList.remove('sig-has-data'); safeLocalStorage((storage) => storage.removeItem(APP.signatureKeyPrefix + id)); }
  function restoreSignatures() { APP.signatureIds.forEach((id) => { const sig = safeLocalStorage((storage) => storage.getItem(APP.signatureKeyPrefix + id)); if (!sig) return; const preview = $('sigPreview' + id); const box = $('sigBox' + id); if (preview) { preview.src = sig; preview.style.display = 'block'; } if (box) box.classList.add('sig-has-data'); }); }
  function sigPos(e) { const r = state.sigCanvas.getBoundingClientRect(); const s = e.touches ? e.touches[0] : e; return { x: s.clientX - r.left, y: s.clientY - r.top }; }
  function startSig(e) { e.preventDefault(); initSigCanvas(); if (!state.sigCtx) return; state.isSigning = true; const p = sigPos(e); state.sigCtx.beginPath(); state.sigCtx.moveTo(p.x, p.y); }
  function moveSig(e) { if (!state.isSigning || !state.sigCtx) return; e.preventDefault(); const p = sigPos(e); state.sigCtx.lineTo(p.x, p.y); state.sigCtx.stroke(); state.hasMark = true; $('sigModalDone')?.classList.add('ready'); }
  function endSig(e) { if (e) e.preventDefault(); state.isSigning = false; }
  function bindSignatureCanvas() { const canvas = $('sigCanvas'); if (!canvas || canvas.dataset.bound === 'true') return; canvas.dataset.bound = 'true'; canvas.addEventListener('mousedown', startSig); canvas.addEventListener('mousemove', moveSig); canvas.addEventListener('mouseup', endSig); canvas.addEventListener('mouseleave', endSig); canvas.addEventListener('touchstart', startSig, { passive: false }); canvas.addEventListener('touchmove', moveSig, { passive: false }); canvas.addEventListener('touchend', endSig, { passive: false }); }
  function handleClick(event) { const actionEl = event.target.closest('[data-action]'); if (actionEl) { const action = actionEl.dataset.action; if (action === 'new-form') resetForm(); if (action === 'print') requestPrint(); if (action === 'force-print') printAnyway(); if (action === 'continue-editing') closePrintWarningModal(); if (action === 'today') setTodayAllDates(); if (action === 'clear-signature') { event.stopPropagation(); clearSigBox(actionEl.dataset.signature); } if (action === 'modal-clear-signature') sigModalClear(); if (action === 'modal-save-signature') sigModalDone(); return; } const sigBox = event.target.closest('[data-signature-box]'); if (sigBox) openSigModal(sigBox.dataset.signatureBox); }
  function handleKeydown(event) { const sigBox = event.target.closest('[data-signature-box]'); if (!sigBox) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openSigModal(sigBox.dataset.signatureBox); } }
  function handleInput(event) { const el = event.target; if (el.matches('[data-format]')) handleFormattedInput(el); else validateField(el, true); saveToStorage(); }
  function handleChange(event) { const el = event.target; if (el.matches('select[data-other-target]')) toggleOtherForSelect(el); if (el.id === 'receiverContactName') applyReceiverContactWorkflow({ clearPhone: el.value === 'Other' || el.value === '' }); validateField(el, true); saveToStorage(); }
  function init() { populateStateOptions(); populateWeightOptions(); bindSignatureCanvas(); loadFromStorage(); document.addEventListener('click', handleClick); document.addEventListener('keydown', handleKeydown); document.addEventListener('input', handleInput); document.addEventListener('change', handleChange); }
  document.addEventListener('DOMContentLoaded', init);
})();
