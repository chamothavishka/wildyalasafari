/**
 * Imperative Three.js stage for the safari vehicle viewer.
 * Loaded lazily (dynamic import) so three.js never blocks first paint.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildHilux, buildCruiser } from './vehicles.js';

/**
 * Optional real models. Put .glb files in /public/models and set `url`
 * (e.g. './models/hilux.glb'). Models are auto-centred and scaled to `length` metres
 * with the front facing +X after `rotationY` is applied. Meshes whose names contain
 * "wheel" will spin during drive animations.
 */
export const VEHICLE_MODELS = {
  // Drop licensed photoreal files at these paths and they are used automatically (see public/models/README.txt).
  // If a file is missing, the detailed procedural Toyota model below is used instead.
  hilux: { url: './models/hilux.glb', rotationY: 0, length: 5.33 },
  cruiser: { url: './models/landcruiser.glb', rotationY: 0, length: 5.1 },
};

const BASE_ANGLE = -0.62; // three-quarter front view
const ARC = Math.PI / 2; // ±90° => 180° total
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeInQuad = (t) => t * t;

export class VehicleStage {
  constructor(container, { compact = false, lowPower = false, reducedMotion = false } = {}) {
    this.container = container;
    this.compact = compact;
    this.reduced = reducedMotion;
    this.vehicles = {};
    this.current = null;
    this.currentId = null;
    this.angle = BASE_ANGLE;
    this.targetAngle = BASE_ANGLE;
    this.interacting = false;
    this.lastInteraction = 0;
    this.animations = [];
    this.visible = true;
    this.disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'vstage__canvas';
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(this._studioEnvironment(), 0.03).texture;
    scene.environmentIntensity = 1.05;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(compact ? 30 : 28, 1, 0.1, 100);
    this.camBase = compact ? new THREE.Vector3(7.6, 3.4, 8.8) : new THREE.Vector3(7.4, 3.2, 8.6);
    camera.position.copy(this.camBase);
    this.lookAt = new THREE.Vector3(0, compact ? 1.65 : 1.15, 0);
    camera.lookAt(this.lookAt);
    this.camera = camera;

    // Lighting: warm key, amber rim, soft fill
    scene.add(new THREE.HemisphereLight(0xfff1dc, 0x2a1a10, 0.55));
    const key = new THREE.DirectionalLight(0xffe2bd, 2.4);
    key.position.set(5, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff9a3c, 2.2);
    rim.position.set(-7, 4, -6);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffb070, 8, 14, 2);
    fill.position.set(-2, 2.5, 5);
    scene.add(fill);

    // Platform
    const platform = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(3.7, 3.8, 0.12, 96),
      new THREE.MeshStandardMaterial({ color: 0x1a120c, metalness: 0.35, roughness: 0.55 })
    );
    disc.position.y = -0.06;
    disc.receiveShadow = true;
    platform.add(disc);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.75, 0.025, 8, 160),
      new THREE.MeshStandardMaterial({ color: 0xf68f2f, emissive: 0xf68f2f, emissiveIntensity: 2.2 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.0;
    platform.add(ring);
    const inner = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 2.63, 128),
      new THREE.MeshBasicMaterial({ color: 0xf68f2f, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.005;
    platform.add(inner);
    const shadowCatcher = new THREE.Mesh(new THREE.CircleGeometry(3.7, 64), new THREE.ShadowMaterial({ opacity: 0.55 }));
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = 0.006;
    shadowCatcher.receiveShadow = true;
    platform.add(shadowCatcher);
    // glow beneath
    const glowTex = this._radialTexture();
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 11),
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.13;
    platform.add(glow);
    scene.add(platform);
    this.platform = platform;
    this.ring = ring;

    this.pivot = new THREE.Group();
    scene.add(this.pivot);

    this.logoTexture = null;
    this.logoReady = new Promise((resolve) => {
      new THREE.TextureLoader().load(
        './brand/logo-480.webp',
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          this.logoTexture = tex;
          resolve();
        },
        undefined,
        () => resolve()
      );
    });

    this._onResize = () => this.resize();
    this.ro = new ResizeObserver(this._onResize);
    this.ro.observe(container);
    this.resize();

    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.kick();
    });
    this.io.observe(container);

    this.clock = new THREE.Clock();
    this.raf = 0;
    this.kick();
  }

  /** Dark studio with long soft-boxes: gives paint and glass the bright reflection streaks real car renders have. */
  _studioEnvironment() {
    const env = new RoomEnvironment();
    const panel = (w, h, x, y, z, ry, rx, intensity, color = 0xfff0dc) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, 0);
      env.add(mesh);
    };
    panel(16, 1.6, 0, 9, 0, 0, Math.PI / 2, 2.6); // overhead strip
    panel(14, 1.2, -9, 5, 0, Math.PI / 2, 0, 2.2, 0xffc88a); // warm side strip
    panel(14, 1.2, 9, 5, 2, -Math.PI / 2, 0, 1.6); // cool-ish opposite strip
    panel(10, 0.8, 0, 3, -9, 0, 0, 1.4, 0xffa850); // amber back rim
    return env;
  }

  _radialTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(246,143,47,0.55)');
    g.addColorStop(0.45, 'rgba(246,143,47,0.18)');
    g.addColorStop(1, 'rgba(246,143,47,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the vehicle framed on narrow viewports
    const narrow = w / h < 1.15;
    this.camera.fov = (this.compact ? 30 : 28) * (narrow ? 1.28 : 1);
    this.camera.updateProjectionMatrix();
    this.kick();
  }

  async _getVehicle(id) {
    if (this.vehicles[id]) return this.vehicles[id];
    await this.logoReady;
    const cfg = VEHICLE_MODELS[id];
    let built = null;
    if (cfg && cfg.url && (await this._modelExists(cfg.url))) {
      try {
        built = await this._loadModel(cfg);
      } catch (err) {
        console.warn(`[VehicleStage] Could not load ${cfg.url}, using procedural model.`, err);
      }
    }
    if (!built) built = id === 'cruiser' ? buildCruiser(this.logoTexture) : buildHilux(this.logoTexture);
    built.id = id;
    this.vehicles[id] = built;
    return built;
  }

  /** True only if the file really is there (dev servers answer unknown paths with an HTML page). */
  async _modelExists(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const type = res.headers.get('content-type') || '';
      return res.ok && !type.includes('text/html');
    } catch {
      return false;
    }
  }

  _loadModel(cfg) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        cfg.url,
        (gltf) => {
          const model = gltf.scene;
          model.rotation.y = cfg.rotationY || 0;
          const wrapper = new THREE.Group();
          wrapper.add(model);
          const box = new THREE.Box3().setFromObject(wrapper);
          const size = box.getSize(new THREE.Vector3());
          const scale = (cfg.length || 5) / Math.max(size.x, size.z);
          model.scale.setScalar(scale);
          const box2 = new THREE.Box3().setFromObject(wrapper);
          const center = box2.getCenter(new THREE.Vector3());
          model.position.x -= center.x;
          model.position.z -= center.z;
          model.position.y -= box2.min.y;
          const wheels = [];
          wrapper.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
              (Array.isArray(o.material) ? o.material : [o.material]).forEach((mat) => {
                if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 1.3;
              });
            }
            if (/wheel|tyre|tire|rim/i.test(o.name) && !wheels.includes(o.parent)) wheels.push(o);
          });
          let wheelRadius = 0.4;
          if (wheels.length) {
            const wb = new THREE.Box3().setFromObject(wheels[0]).getSize(new THREE.Vector3());
            wheelRadius = Math.max(0.25, Math.max(wb.y, wb.x) / 2);
          }
          resolve({ group: wrapper, wheels, wheelRadius });
        },
        undefined,
        reject
      );
    });
  }

  /** Show a vehicle. The first call places it; later calls drive the old one out and the new one in. */
  async setVehicle(id) {
    if (this.pending === id || (this.currentId === id && !this.pending)) return;
    this.pending = id;
    const next = await this._getVehicle(id);
    if (this.disposed || this.pending !== id) return;
    this.pending = null;
    const prev = this.current;
    this.current = next;
    this.currentId = id;
    next.group.position.set(0, 0, 0);
    next.group.scale.setScalar(1);
    this.pivot.add(next.group);

    if (!prev || this.reduced) {
      if (prev) this.pivot.remove(prev.group);
      this.kick();
      return;
    }
    // Drive the previous jeep out (forward, along its local +X) and the new one in from behind.
    const outDist = 11;
    this._animate(900, (t) => {
      const e = easeInQuad(t);
      prev.group.position.x = e * outDist;
      this._spin(prev, (e * outDist) / prev.wheelRadius);
    }, () => this.pivot.remove(prev.group));
    next.group.position.x = -outDist;
    this._animate(1100, (t) => {
      const e = easeOutCubic(t);
      next.group.position.x = -outDist * (1 - e);
      this._spin(next, (-outDist * (1 - e)) / next.wheelRadius);
      this.ring.material.emissiveIntensity = 2.2 + Math.sin(t * Math.PI) * 2.5;
    }, null, 180);
  }

  _spin(v, angle) {
    v.wheels.forEach((w) => {
      w.rotation.z = -angle;
    });
  }

  _animate(duration, update, done, delay = 0) {
    const start = performance.now() + delay;
    return new Promise((resolve) => {
      this.animations.push({ start, duration, update, done: () => { done && done(); resolve(); } });
      this.kick();
    });
  }

  // --- interaction (restricted to a 180° arc) ---
  dragBy(dxPixels) {
    const w = this.container.clientWidth || 600;
    this.targetAngle = THREE.MathUtils.clamp(this.targetAngle + (dxPixels / w) * Math.PI * 1.4, BASE_ANGLE - ARC, BASE_ANGLE + ARC);
    this.lastInteraction = performance.now();
    this.kick();
  }

  rotateStep(dir) {
    this.targetAngle = THREE.MathUtils.clamp(this.targetAngle + dir * 0.35, BASE_ANGLE - ARC, BASE_ANGLE + ARC);
    this.lastInteraction = performance.now();
    this.kick();
  }

  setInteracting(v) {
    this.interacting = v;
    this.lastInteraction = performance.now();
    this.kick();
  }

  resetView() {
    this.targetAngle = BASE_ANGLE;
    this.kick();
  }

  /** Cinematic "drive towards the camera" used before navigating to the booking page. */
  driveForward() {
    if (!this.current || this.reduced) return Promise.resolve();
    const v = this.current;
    // Turn so the vehicle's front faces the camera, then accelerate towards it.
    const camAngle = Math.atan2(this.camBase.z, this.camBase.x); // angle of camera in XZ
    const faceAngle = -camAngle + 0; // local +X towards camera
    const startAngle = this.angle;
    this.locked = true;
    const turn = this._animate(650, (t) => {
      this.angle = startAngle + (faceAngle - startAngle) * easeInOutCubic(t);
      this.targetAngle = this.angle;
    });
    return turn.then(() =>
      this._animate(1050, (t) => {
        const e = t ** 2.2;
        v.group.position.x = e * 9.5;
        this._spin(v, (e * 9.5) / v.wheelRadius);
        this.camera.fov = 28 + e * 22;
        this.camera.position.y = this.camBase.y + Math.sin(t * 40) * 0.02 * t;
        this.camera.updateProjectionMatrix();
      })
    );
  }

  kick() {
    if (!this.raf && !this.disposed) this.raf = requestAnimationFrame((t) => this._tick(t));
  }

  _tick(now) {
    this.raf = 0;
    if (this.disposed) return;
    // run animations
    let animating = false;
    this.animations = this.animations.filter((a) => {
      if (now < a.start) {
        animating = true;
        return true;
      }
      const t = Math.min(1, (now - a.start) / a.duration);
      a.update(t);
      if (t >= 1) {
        a.done();
        return false;
      }
      animating = true;
      return true;
    });

    // idle sway when the user is not interacting
    const idleFor = now - this.lastInteraction;
    let sway = 0;
    if (!this.locked && !this.reduced && !this.interacting && idleFor > 2500) {
      sway = Math.sin(now * 0.00045) * 0.22;
      if (!this.compact && idleFor > 6000) this.targetAngle += (BASE_ANGLE - this.targetAngle) * 0.01;
    }
    if (!this.locked) this.angle += (this.targetAngle + sway - this.angle) * 0.085;
    this.pivot.rotation.y = this.angle;
    if (!this.locked) this.camera.lookAt(this.lookAt);

    this.renderer.render(this.scene, this.camera);

    const settling = Math.abs(this.targetAngle + sway - this.angle) > 0.0005;
    const idleAnimating = !this.reduced && !this.interacting && idleFor > 2500;
    if (this.visible && (animating || settling || idleAnimating || this.interacting)) this.kick();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
