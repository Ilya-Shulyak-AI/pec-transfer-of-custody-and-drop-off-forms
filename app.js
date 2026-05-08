const STORAGE_KEY = 'pec_toc_form_v3';
const SIGNATURE_KEY_PREFIX = 'pec_toc_sig_';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

function fmtPhone(el) {
  let v = el.value.replace(/\D/g, '').substring(0, 10);
  if (v.length >= 6) v = '(' + v.substring(0, 3) + ') ' + v.substring(3, 6) + '-' + v.substring(6);
  else if (v.length >= 3) v = '(' + v.substring(0, 3) + ') ' + v.substring(3);
  el.value = v;
}

function formatDate() {
  const n = new Date();
  return String(n.getMonth() + 1).padStart(2, '0') + ' / ' + String(n.getDate()).padStart(2, '0') + ' / ' + n.getFullYear();
}

function setTodayAllDates() {
  const today = formatDate();
  ['formDate', 'transferSignatureDate', 'receiverSignatureDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
  saveToStorage();
}

function toggleOther(selectId, wrapId) {
  const sel = document.getElementById(selectId);
  const wrap = document.getElementById(wrapId);
  if (!sel || !wrap) return;
  const show = sel.value === 'Other';
  wrap.style.display = show ? 'block' : 'none';
  const input = wrap.querySelector('input');
  if (!show && input) input.value = '';
}

function toggleAllOtherFields() {
  toggleOther('transferMethod', 'transferMethodOtherWrap');
  toggleOther('receivedBy', 'receivedByOtherWrap');
  toggleOther('reasonSelect', 'reasonOtherWrap');
  toggleOther('estimatedWeight', 'estimatedWeightOtherWrap');
}

function normalizeState(el) {
  el.value = el.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  if (el.value.length === 2 && !US_STATES.includes(el.value)) {
    el.setCustomValidity('Use a valid 2-letter state abbreviation.');
  } else {
    el.setCustomValidity('');
  }
}

function formatManualWeight(el) {
  const digits = el.value.replace(/\D/g, '');
  el.value = digits ? Number(digits).toLocaleString('en-US') : '';
}

function populateStateOptions() {
  const list = document.getElementById('stateOptions');
  if (!list || list.children.length) return;
  US_STATES.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    list.appendChild(option);
  });
}

function populateWeightOptions() {
  const select = document.getElementById('estimatedWeight');
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

let sigCanvas = null;
let sigCtx = null;
let isSigning = false;
let hasMark = false;
let activeSig = 1;

function initSigCanvas() {
  if (!sigCanvas) sigCanvas = document.getElementById('sigCanvas');
  if (sigCanvas && !sigCtx) sigCtx = sigCanvas.getContext('2d');
}

function openSigModal(n) {
  initSigCanvas();
  if (!sigCanvas || !sigCtx) return;
  activeSig = n;
  hasMark = false;
  document.getElementById('sigModalDone').classList.remove('ready');
  document.getElementById('sigModalSub').textContent = n === 1 ? 'Transferring Party' : 'Receiving Party';
  document.getElementById('sigModal').classList.add('open');
  requestAnimationFrame(() => {
    const wrap = document.getElementById('sigModalWrap');
    const r = wrap.getBoundingClientRect();
    sigCanvas.width = r.width || 300;
    sigCanvas.height = r.height || 300;
    sigCtx.strokeStyle = '#1a1a1a';
    sigCtx.lineWidth = 2.5;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
  });
}

function sigModalClear() {
  if (!sigCtx || !sigCanvas) return;
  sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  hasMark = false;
  document.getElementById('sigModalDone').classList.remove('ready');
}

function cropSigCanvas(srcCanvas) {
  return srcCanvas.toDataURL('image/png');
}

function sigModalDone() {
  if (!hasMark) return;
  const dataURL = cropSigCanvas(sigCanvas);
  const preview = document.getElementById('sigPreview' + activeSig);
  preview.src = dataURL;
  preview.style.display = 'block';
  document.getElementById('sigBox' + activeSig).classList.add('sig-has-data');
  localStorage.setItem(SIGNATURE_KEY_PREFIX + activeSig, dataURL);
  document.getElementById('sigModal').classList.remove('open');
}

function clearSigBox(n) {
  const preview = document.getElementById('sigPreview' + n);
  if (preview) {
    preview.style.display = 'none';
    preview.src = '';
  }
  const box = document.getElementById('sigBox' + n);
  if (box) box.classList.remove('sig-has-data');
  localStorage.removeItem(SIGNATURE_KEY_PREFIX + n);
}

function sigPos(e) {
  const r = sigCanvas.getBoundingClientRect();
  const s = e.touches ? e.touches[0] : e;
  return {
    x: (s.clientX - r.left) * (sigCanvas.width / r.width),
    y: (s.clientY - r.top) * (sigCanvas.height / r.height)
  };
}

function startSig(e) {
  e.preventDefault();
  initSigCanvas();
  if (!sigCtx) return;
  isSigning = true;
  const p = sigPos(e);
  sigCtx.beginPath();
  sigCtx.moveTo(p.x, p.y);
}

function moveSig(e) {
  if (!isSigning || !sigCtx) return;
  e.preventDefault();
  const p = sigPos(e);
  sigCtx.lineTo(p.x, p.y);
  sigCtx.stroke();
  hasMark = true;
  document.getElementById('sigModalDone').classList.add('ready');
}

function endSig(e) {
  if (e) e.preventDefault();
  isSigning = false;
}

function bindSignatureCanvas() {
  const canvas = document.getElementById('sigCanvas');
  if (!canvas || canvas.dataset.bound === 'true') return;
  canvas.dataset.bound = 'true';
  canvas.addEventListener('mousedown', startSig);
  canvas.addEventListener('mousemove', moveSig);
  canvas.addEventListener('mouseup', endSig);
  canvas.addEventListener('mouseleave', endSig);
  canvas.addEventListener('touchstart', startSig, { passive:false });
  canvas.addEventListener('touchmove', moveSig, { passive:false });
  canvas.addEventListener('touchend', endSig, { passive:false });
}

function saveToStorage() {
  const data = {};
  document.querySelectorAll('[data-save="true"]').forEach(el => {
    if (!el.id) return;
    data[el.id] = el.type === 'radio' ? el.checked : el.value;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      document.querySelectorAll('[data-save="true"]').forEach(el => {
        if (!el.id || data[el.id] === undefined) return;
        if (el.type === 'radio') el.checked = data[el.id];
        else el.value = data[el.id];
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setTodayAllDates();
    }
  } else {
    setTodayAllDates();
  }

  toggleAllOtherFields();

  [1, 2].forEach(n => {
    const sig = localStorage.getItem(SIGNATURE_KEY_PREFIX + n);
    if (sig) {
      const preview = document.getElementById('sigPreview' + n);
      preview.src = sig;
      preview.style.display = 'block';
      document.getElementById('sigBox' + n).classList.add('sig-has-data');
    }
  });
}

function newForm() {
  if (!confirm('Clear this form and start a new one?')) return;
  document.querySelectorAll('[data-save="true"]').forEach(el => {
    if (el.type === 'radio') el.checked = false;
    else el.value = '';
  });
  clearSigBox(1);
  clearSigBox(2);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SIGNATURE_KEY_PREFIX + '1');
  localStorage.removeItem(SIGNATURE_KEY_PREFIX + '2');
  toggleAllOtherFields();
  setTodayAllDates();
  window.scrollTo({ top:0, behavior:'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
  populateStateOptions();
  populateWeightOptions();
  bindSignatureCanvas();
  loadFromStorage();
  document.addEventListener('input', saveToStorage);
  document.addEventListener('change', saveToStorage);
});
