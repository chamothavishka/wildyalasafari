import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { JEEPS } from '../lib/pricing.js';
import { isLowPower, prefersReducedMotion, webglAvailable } from '../lib/env.js';
import Icon from './Icon.jsx';

/**
 * Interactive 3D vehicle viewer. three.js is loaded lazily the first time the
 * viewer approaches the viewport. The container has a fixed aspect ratio so the
 * canvas never causes layout shift.
 */
const VehicleViewer = forwardRef(function VehicleViewer({ jeepId, compact = false, className = '' }, ref) {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const jeepRef = useRef(jeepId);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | fallback
  const [hintHidden, setHintHidden] = useState(false);

  jeepRef.current = jeepId;

  useImperativeHandle(ref, () => ({
    driveForward: () => (stageRef.current ? stageRef.current.driveForward() : Promise.resolve()),
  }));

  // Lazy init when near the viewport
  useEffect(() => {
    const el = wrapRef.current;
    if (!webglAvailable()) {
      setStatus('fallback');
      return undefined;
    }
    let cancelled = false;
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || stageRef.current) return;
        io.disconnect();
        setStatus('loading');
        try {
          const { VehicleStage } = await import('../three/VehicleStage.js');
          if (cancelled) return;
          const stage = new VehicleStage(el.querySelector('.vstage__gl'), {
            compact,
            lowPower: isLowPower(),
            reducedMotion: prefersReducedMotion(),
          });
          stageRef.current = stage;
          await stage.setVehicle(jeepRef.current);
          if (!cancelled) setStatus('ready');
        } catch (err) {
          console.error(err);
          if (!cancelled) setStatus('fallback');
        }
      },
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      if (stageRef.current) {
        stageRef.current.dispose();
        stageRef.current = null;
      }
    };
  }, [compact]);

  // Switch model when the jeep category changes
  useEffect(() => {
    if (stageRef.current) stageRef.current.setVehicle(jeepId);
  }, [jeepId]);

  // Drag / swipe — restricted to a 180° arc inside the stage
  useEffect(() => {
    if (compact) return undefined;
    const el = wrapRef.current;
    let dragging = false;
    let lastX = 0;
    let startY = 0;
    let decided = false;
    let horizontal = false;
    const down = (e) => {
      if (!stageRef.current) return;
      dragging = true;
      decided = e.pointerType === 'mouse';
      horizontal = e.pointerType === 'mouse';
      lastX = e.clientX;
      startY = e.clientY;
      if (horizontal) {
        el.setPointerCapture(e.pointerId);
        stageRef.current.setInteracting(true);
      }
    };
    const move = (e) => {
      if (!dragging || !stageRef.current) return;
      if (!decided) {
        const dx = Math.abs(e.clientX - lastX);
        const dy = Math.abs(e.clientY - startY);
        if (dx + dy < 6) return;
        decided = true;
        horizontal = dx > dy;
        if (!horizontal) {
          dragging = false;
          return;
        }
        el.setPointerCapture(e.pointerId);
        stageRef.current.setInteracting(true);
      }
      stageRef.current.dragBy(e.clientX - lastX);
      lastX = e.clientX;
      setHintHidden(true);
    };
    const up = () => {
      if (dragging && stageRef.current) stageRef.current.setInteracting(false);
      dragging = false;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [compact]);

  const onKeyDown = (e) => {
    if (!stageRef.current) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stageRef.current.rotateStep(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stageRef.current.rotateStep(1);
    } else if (e.key === 'Home') {
      stageRef.current.resetView();
    }
  };

  const jeep = JEEPS[jeepId];

  return (
    <div
      ref={wrapRef}
      className={`vstage ${compact ? 'vstage--compact' : ''} vstage--${status} ${className}`}
      tabIndex={compact ? -1 : 0}
      role={compact ? 'img' : 'application'}
      aria-roledescription={compact ? undefined : '3D vehicle viewer'}
      aria-label={compact ? `3D model of the ${jeep.name}` : `3D model of the ${jeep.name}. Drag, swipe or use the left and right arrow keys to rotate.`}
      onKeyDown={onKeyDown}
    >
      <div className="vstage__gl" />
      {status !== 'ready' && status !== 'fallback' ? (
        <div className="vstage__loader" aria-hidden="true">
          <span className="vstage__spinner" />
          <span>Preparing your jeep…</span>
        </div>
      ) : null}
      {status === 'fallback' ? (
        <div className="vstage__fallback">
          <Icon name="jeep" size={72} strokeWidth={1} />
          <span>{jeep.name}</span>
        </div>
      ) : null}
      {!compact && status === 'ready' ? (
        <div className={`vstage__hint ${hintHidden ? 'is-hidden' : ''}`} aria-hidden="true">
          <Icon name="rotate" size={15} /> Drag to rotate · 180°
        </div>
      ) : null}
    </div>
  );
});

export default VehicleViewer;
