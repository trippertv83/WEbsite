/**
 * Schritt 3: Dokumenten-Upload mit Drag & Drop.
 */

import { AppConfig } from '../../config.example.js';
import { getState, setDocuments } from './state.js';
import { validateDocuments, isEmpty } from './validation.js';
import {
  collectAllFiles,
  createFileRecord,
  simulateProgress,
  validateFile,
  validateTotalSize,
} from './upload.js';
import { qs, showToast } from './utils.js';

const CATEGORIES = [
  {
    id: 'heatingBills',
    title: 'Heizkostenabrechnungen',
    hint: 'Mindestens eine PDF. Alle Abrechnungsjahre dürfen in einer Datei liegen.',
    required: true,
  },
  {
    id: 'floorPlan',
    title: 'Grundriss (optional)',
    hint: 'PDF, falls vorhanden.',
    required: false,
  },
  {
    id: 'heatingPhoto',
    title: 'Foto Heizung (optional)',
    hint: 'Als PDF (Scan).',
    required: false,
  },
  {
    id: 'other',
    title: 'Sonstige Dokumente',
    hint: 'Weitere Nachweise als PDF.',
    required: false,
  },
];

function renderList(category) {
  const files = getState().documents[category];
  if (!files.length) return '<p class="field__hint">Noch keine Datei.</p>';
  return `<ul class="file-list">${files
    .map(
      (f) => `<li class="file-item">
        <div class="file-item__icon">PDF</div>
        <div>
          <div class="file-item__name">${f.name}</div>
          <div class="file-item__meta">${f.sizeLabel}</div>
          <div class="progress" aria-hidden="true"><span style="width:${f.progress}%"></span></div>
        </div>
        <button class="btn btn--ghost" type="button" data-remove="${f.id}" data-cat="${category}">Löschen</button>
      </li>`
    )
    .join('')}</ul>`;
}

export function renderDocuments() {
  const root = qs('#documents-root');
  root.innerHTML = CATEGORIES.map(
    (cat) => `<section class="doc-section" data-cat="${cat.id}">
      <h2 style="margin:0 0 0.35rem;font-size:1.1rem">${cat.title}</h2>
      <p class="field__hint">${cat.hint}</p>
      <div class="dropzone" tabindex="0" data-drop="${cat.id}">
        <div class="dropzone__icon" aria-hidden="true">↑</div>
        <p>PDF hierher ziehen oder <strong>auswählen</strong></p>
        <input class="visually-hidden" type="file" accept="application/pdf,.pdf" multiple data-file="${cat.id}" />
      </div>
      <div data-list="${cat.id}">${renderList(cat.id)}</div>
      <span class="field__error" data-error-for="${cat.id}"></span>
    </section>`
  ).join('');
}

async function addFiles(category, fileList) {
  const incoming = [...fileList];
  const nextDocs = { ...getState().documents };
  for (const file of incoming) {
    const error = validateFile(file);
    if (error) {
      showToast(error);
      continue;
    }
    const record = createFileRecord(file, category);
    nextDocs[category] = [...nextDocs[category], record];
    const totalError = validateTotalSize(collectAllFiles(nextDocs).map((r) => r.file));
    if (totalError) {
      nextDocs[category] = nextDocs[category].filter((r) => r.id !== record.id);
      showToast(totalError);
      continue;
    }
    setDocuments(nextDocs);
    renderDocuments();
    await simulateProgress((value) => {
      const docs = getState().documents;
      const updated = docs[category].map((r) =>
        r.id === record.id ? { ...r, progress: value } : r
      );
      setDocuments({ ...docs, [category]: updated });
      const bar = document.querySelector(`[data-list="${category}"]`);
      if (bar) bar.innerHTML = renderList(category);
    });
  }
}

export function bindDocuments() {
  renderDocuments();
  const root = qs('#documents-root');

  root.addEventListener('click', (event) => {
    const drop = event.target.closest('.dropzone');
    if (drop && !event.target.closest('[data-remove]') && !event.target.closest('input')) {
      drop.querySelector('input[type="file"]').click();
    }
    const remove = event.target.closest('[data-remove]');
    if (remove) {
      const cat = remove.dataset.cat;
      const docs = getState().documents;
      setDocuments({
        ...docs,
        [cat]: docs[cat].filter((f) => f.id !== remove.dataset.remove),
      });
      renderDocuments();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('input[type="file"]')) {
      addFiles(input.dataset.file, input.files);
      input.value = '';
    }
  });

  root.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.target.closest('.dropzone')?.classList.add('is-active');
  });
  root.addEventListener('dragleave', (event) => {
    event.target.closest('.dropzone')?.classList.remove('is-active');
  });
  root.addEventListener('drop', (event) => {
    event.preventDefault();
    const zone = event.target.closest('.dropzone');
    if (!zone) return;
    zone.classList.remove('is-active');
    addFiles(zone.dataset.drop, event.dataTransfer.files);
  });
}

export function validateStepDocuments() {
  const errors = validateDocuments(getState().documents, AppConfig.minHeatingBills);
  const root = qs('#documents-root');
  const el = root.querySelector('[data-error-for="heatingBills"]');
  if (el) el.textContent = errors.heatingBills || '';
  return isEmpty(errors);
}
