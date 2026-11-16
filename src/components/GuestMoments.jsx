import { useEffect, useRef, useState } from 'react';
import { CONTACT, whatsappLink, mailtoLink } from '../data/content.js';
import { addGuestPhoto, listGuestPhotos, removeGuestPhoto, validateFile, MAX_FILE_MB } from '../lib/guestPhotos.js';
import { Modal, CloseButton, Field } from './ui.jsx';
import Icon from './Icon.jsx';

/** "Share your moment" button + modal, and the strip of photos this visitor has added. */
export default function GuestMoments() {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [urls, setUrls] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const inputRef = useRef(null);

  const refresh = async () => {
    const list = await listGuestPhotos();
    setPhotos(list);
  };
  useEffect(() => {
    refresh();
  }, []);

  // object URLs for stored blobs
  useEffect(() => {
    const next = {};
    photos.forEach((p) => {
      next[p.id] = URL.createObjectURL(p.blob);
    });
    setUrls(next);
    return () => Object.values(next).forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const reset = () => {
    setFile(null);
    setName('');
    setCaption('');
    setError('');
    setDone(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const close = () => {
    if (busy) return;
    setOpen(false);
    reset();
  };

  const onPick = (e) => {
    const f = e.target.files && e.target.files[0];
    const bad = validateFile(f);
    setError(bad);
    setFile(bad ? null : f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a photo first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await addGuestPhoto({ file, name, caption });
      await refresh();
      setDone(res);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await removeGuestPhoto(id);
    refresh();
  };

  const shareText = `Hello Wild Yala Safari! I would like to share my safari photo${name ? ` (from ${name})` : ''}.${caption ? ` ${caption}` : ''}`;

  return (
    <>
      <div className="guestbar" data-reveal="up">
        <div className="guestbar__text">
          <p className="eyebrow">Your Experience</p>
          <p className="guestbar__lead">Been on safari with us? Share your favourite moment from the wild.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setOpen(true)}>
          <Icon name="plus" size={18} />
          <span className="btn__label">Share Your Photo</span>
        </button>
      </div>

      {photos.length ? (
        <div className="guestgrid" aria-label="Photos you have added on this device">
          <p className="guestgrid__note">Your photos · visible on this device</p>
          <ul>
            {photos.map((p) => (
              <li key={p.id} className="guestcard">
                {urls[p.id] ? <img src={urls[p.id]} alt={p.caption || 'Your safari photo'} width={p.width} height={p.height} loading="lazy" /> : null}
                <span className="guestcard__cap">
                  {p.caption ? <strong>{p.caption}</strong> : null}
                  {p.name ? <em>— {p.name}</em> : null}
                </span>
                <button type="button" className="guestcard__del" onClick={() => remove(p.id)} aria-label="Remove this photo">
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Modal open={open} onClose={close} labelledBy="share-title" variant="center" className="share">
        <div className="modal__head">
          <div>
            <h3 id="share-title">Share Your Moment</h3>
            <p className="share__sub">Add a photo from your Yala safari.</p>
          </div>
          <CloseButton onClick={close} />
        </div>

        {done ? (
          <div className="share__done" role="status">
            <span className="checkout__tick">
              <svg viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" />
                <path d="M15 27l7 7 15-16" />
              </svg>
            </span>
            <strong>Thank you for sharing!</strong>
            <p>
              Your photo now appears under “Moments from the Wild” on this device.
              {done.shared ? ' We have also received a copy.' : ' To have it featured on our website for everyone, send it to us:'}
            </p>
            {!done.shared ? (
              <div className="share__send">
                <a className="btn btn--primary" href={whatsappLink(shareText)} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={18} />
                  <span className="btn__label">Send on WhatsApp</span>
                </a>
                <a className="btn btn--ghost" href={mailtoLink('My Yala safari photo', `${shareText}\n\n(Please attach your photo to this email.)`)}>
                  <Icon name="mail" size={18} />
                  <span className="btn__label">Send by Email</span>
                </a>
              </div>
            ) : null}
            <button type="button" className="btn btn--ghost" onClick={close}>
              <span className="btn__label">Close</span>
            </button>
          </div>
        ) : (
          <form className="share__form" onSubmit={submit} noValidate>
            <label className={`dropzone ${preview ? 'has-preview' : ''}`}>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={onPick} />
              {preview ? (
                <img src={preview} alt="Preview of your photo" />
              ) : (
                <span className="dropzone__hint">
                  <Icon name="expand" size={26} />
                  <strong>Choose a photo</strong>
                  <small>JPG, PNG or WebP · up to {MAX_FILE_MB} MB</small>
                </span>
              )}
            </label>
            <div className="form-row">
              <Field id="sh-name" label="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="name" />
              <Field id="sh-cap" label="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={140} />
            </div>
            {error ? (
              <p className="share__error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn btn--primary btn--block" disabled={busy || !file}>
              <span className="btn__label">{busy ? 'Adding…' : 'Add to Gallery'}</span>
            </button>
            <p className="form-fine">
              Photos are saved on this device and resized to protect your privacy. To appear for all visitors, we’ll invite you to send it to {CONTACT.email}.
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}
