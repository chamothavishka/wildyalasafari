/**
 * Progressive image-sequence loader + canvas renderer.
 *
 * - Loads frames coarse-to-fine (every 8th, 4th, 2nd, then all) so scrubbing works
 *   almost immediately while the rest streams in.
 * - Draws with cover-fit, a virtual camera (zoom / pan) and a crossfade between
 *   neighbouring frames for smooth motion from a reduced frame set.
 */
import { isMobileViewport } from './env.js';

export const FRAME_SETS = {
  desktop: { count: 120, path: (i) => `./frames/desktop/${String(i).padStart(3, '0')}.webp` },
  mobile: { count: 80, path: (i) => `./frames/mobile/${String(i).padStart(3, '0')}.webp` },
};

export function pickFrameSet() {
  return isMobileViewport() ? FRAME_SETS.mobile : FRAME_SETS.desktop;
}

function loadOrder(count) {
  const order = [];
  const seen = new Set();
  [8, 4, 2, 1].forEach((step) => {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  });
  if (!seen.has(count - 1)) order.splice(1, 0, count - 1);
  return order;
}

export class FrameSequence {
  constructor(set, { range = null, concurrency = 6 } = {}) {
    this.set = set;
    this.start = range ? range[0] : 0;
    this.end = range ? range[1] : set.count - 1;
    this.count = this.end - this.start + 1;
    this.images = new Array(this.count).fill(null);
    this.loaded = new Array(this.count).fill(false);
    this.loadedCount = 0;
    this.concurrency = concurrency;
    this.listeners = new Set();
    this.aborted = false;
  }

  onProgress(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  load() {
    if (this._loading) return this._loading;
    const queue = loadOrder(this.count);
    const next = () => {
      if (this.aborted || !queue.length) return Promise.resolve();
      const idx = queue.shift();
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        const done = () => {
          if (img.naturalWidth) {
            this.images[idx] = img;
            this.loaded[idx] = true;
            this.loadedCount += 1;
            this.listeners.forEach((fn) => fn(this.loadedCount / this.count, idx));
          }
          resolve();
        };
        img.onload = () => {
          (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(done);
        };
        img.onerror = () => resolve();
        img.src = this.set.path(this.start + idx + 1);
      }).then(next);
    };
    this._loading = Promise.all(Array.from({ length: this.concurrency }, next));
    return this._loading;
  }

  abort() {
    this.aborted = true;
  }

  nearestLoaded(i) {
    if (this.loaded[i]) return i;
    for (let d = 1; d < this.count; d += 1) {
      if (i - d >= 0 && this.loaded[i - d]) return i - d;
      if (i + d < this.count && this.loaded[i + d]) return i + d;
    }
    return -1;
  }

  /**
   * Draw a fractional frame position onto a 2D context.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} pos fractional frame index (0..count-1)
   * @param {{w:number,h:number,zoom?:number,panX?:number,panY?:number,focusX?:number,focusY?:number}} view
   */
  draw(ctx, pos, view) {
    const p = Math.min(this.count - 1, Math.max(0, pos));
    const i0 = Math.floor(p);
    const t = p - i0;
    const a = this.nearestLoaded(i0);
    if (a < 0) return false;
    const b = t > 0.02 && i0 + 1 < this.count ? this.nearestLoaded(i0 + 1) : a;
    ctx.globalAlpha = 1;
    this._blit(ctx, this.images[a], view);
    if (b !== a && b >= 0) {
      ctx.globalAlpha = t;
      this._blit(ctx, this.images[b], view);
      ctx.globalAlpha = 1;
    }
    return true;
  }

  _blit(ctx, img, { w, h, zoom = 1, panX = 0, panY = 0, focusX = 0.5, focusY = 0.5 }) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(w / iw, h / ih) * zoom;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (w - dw) * focusX + panX;
    const dy = (h - dh) * focusY + panY;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
}
