/**
 * Guest "share your moment" photos — frontend only.
 *
 * Photos are resized in the browser and kept in this browser's IndexedDB, so they appear in the
 * gallery for the visitor who added them. They are NOT shared with other visitors: that needs a
 * server. To collect photos centrally, set VITE_GALLERY_UPLOAD_URL (see .env.example); each photo
 * is then also POSTed there as multipart/form-data { photo, name, caption }.
 */
const DB_NAME = 'wys-guest-moments';
const STORE = 'photos';
export const MAX_FILE_MB = 12;
export const MAX_PHOTOS = 12;
const UPLOAD_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GALLERY_UPLOAD_URL) || '';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('Storage is not available in this browser.'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const tx = (db, mode, fn) =>
  new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });

export async function listGuestPhotos() {
  try {
    const db = await openDb();
    const all = await tx(db, 'readonly', (s) => s.getAll());
    return (all || []).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function removeGuestPhoto(id) {
  const db = await openDb();
  await tx(db, 'readwrite', (s) => s.delete(id));
}

/** Resize to at most `max` px on the long edge and re-encode as JPEG (also strips location metadata). */
function resizeToBlob(file, max = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve({ blob: b, width: w, height: h }) : reject(new Error('Could not process this image.'))), 'image/jpeg', quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be read as an image.'));
    };
    img.src = url;
  });
}

export function validateFile(file) {
  if (!file) return 'Please choose a photo.';
  if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) return 'Please choose a JPG, PNG or WebP photo.';
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `That photo is larger than ${MAX_FILE_MB} MB. Please choose a smaller one.`;
  return '';
}

/** Saves the photo locally and (if configured) forwards it to the upload endpoint. */
export async function addGuestPhoto({ file, name, caption }) {
  const bad = validateFile(file);
  if (bad) throw new Error(bad);
  const existing = await listGuestPhotos();
  if (existing.length >= MAX_PHOTOS) throw new Error(`You can keep up to ${MAX_PHOTOS} photos on this device. Please remove one first.`);
  const { blob, width, height } = await resizeToBlob(file);
  const record = {
    id: `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    name: (name || '').trim().slice(0, 40),
    caption: (caption || '').trim().slice(0, 140),
    width,
    height,
    blob,
  };
  const db = await openDb();
  await tx(db, 'readwrite', (s) => s.put(record));

  let shared = false;
  if (UPLOAD_URL) {
    try {
      const fd = new FormData();
      fd.append('photo', blob, `${record.id}.jpg`);
      fd.append('name', record.name);
      fd.append('caption', record.caption);
      const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
      shared = res.ok;
    } catch {
      shared = false;
    }
  }
  return { record, shared, forwarded: Boolean(UPLOAD_URL) };
}
