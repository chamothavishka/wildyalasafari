/**
 * Realistic Toyota Hilux Vigo (Champagne Bronze) and Toyota Land Cruiser 70 (Metallic Black)
 * Safari Conversion Vehicles for Wild Yala Safari.
 * Modeled directly from real Sri Lankan fleet photographs with authentic proportions,
 * signature over-cab / visor safari canopy architecture, door logos, and fleet details.
 *
 * Coordinates:
 *   +X = Front of vehicle (forward drive direction)
 *   +Y = Up (ground at Y = 0)
 *   +Z = Left side of vehicle (passenger side in RHD Sri Lanka)
 *   -Z = Right side of vehicle (driver side in RHD Sri Lanka)
 *
 * Returns { group, wheels, wheelRadius } where each road wheel spins about local Z.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/* =================================================================== MATERIALS */
function buildPalette(paintColor, { paintMetal = 0.28, paintRough = 0.22, clearcoat = 1.0, clearcoatRoughness = 0.04 } = {}) {
  return {
    paint: new THREE.MeshPhysicalMaterial({
      color: paintColor,
      metalness: paintMetal,
      roughness: paintRough,
      clearcoat,
      clearcoatRoughness,
      envMapIntensity: 1.4,
    }),
    paintDark: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(paintColor).multiplyScalar(0.72),
      metalness: paintMetal * 1.1,
      roughness: paintRough * 1.2,
      clearcoat: 0.5,
    }),
    chassis: new THREE.MeshStandardMaterial({
      color: 0x161616,
      metalness: 0.65,
      roughness: 0.6,
    }),
    trim: new THREE.MeshStandardMaterial({
      color: 0x1c1b19,
      metalness: 0.15,
      roughness: 0.65,
    }),
    plastic: new THREE.MeshStandardMaterial({
      color: 0x141312,
      metalness: 0.05,
      roughness: 0.85,
    }),
    lcBumper: new THREE.MeshStandardMaterial({
      color: 0x222426,
      metalness: 0.18,
      roughness: 0.48,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: 0xf5f7fa,
      metalness: 0.98,
      roughness: 0.08,
      envMapIntensity: 1.8,
    }),
    darkChrome: new THREE.MeshStandardMaterial({
      color: 0x3e4247,
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 1.4,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x0c1218,
      metalness: 0.1,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 1.25,
    }),
    windshieldGlass: new THREE.MeshPhysicalMaterial({
      color: 0x141f28,
      metalness: 0.08,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.84,
      envMapIntensity: 1.3,
    }),
    mirrorGlass: new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      metalness: 0.98,
      roughness: 0.02,
      envMapIntensity: 2.2,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x151514,
      metalness: 0.02,
      roughness: 0.94,
    }),
    alloySilver: new THREE.MeshStandardMaterial({
      color: 0xd6d9de,
      metalness: 0.85,
      roughness: 0.22,
      envMapIntensity: 1.5,
    }),
    steelBlack: new THREE.MeshStandardMaterial({
      color: 0x151617,
      metalness: 0.65,
      roughness: 0.35,
      envMapIntensity: 1.3,
    }),
    redRimStripe: new THREE.MeshStandardMaterial({
      color: 0xd61a1a,
      metalness: 0.4,
      roughness: 0.25,
      emissive: 0x8a0f0f,
      emissiveIntensity: 0.2,
    }),
    brakeRotor: new THREE.MeshStandardMaterial({
      color: 0x7c8085,
      metalness: 0.88,
      roughness: 0.32,
    }),
    brakeCaliper: new THREE.MeshStandardMaterial({
      color: 0xc42214,
      metalness: 0.35,
      roughness: 0.35,
    }),
    blackLeatherSeats: new THREE.MeshStandardMaterial({
      color: 0x181818,
      metalness: 0.05,
      roughness: 0.62,
    }),
    safariFrameOlive: new THREE.MeshStandardMaterial({
      color: 0x505642,
      metalness: 0.35,
      roughness: 0.48,
    }),
    safariFrameBlack: new THREE.MeshStandardMaterial({
      color: 0x1c1a18,
      metalness: 0.7,
      roughness: 0.3,
    }),
    canvasKhaki: new THREE.MeshStandardMaterial({
      color: 0x4e5440,
      metalness: 0.0,
      roughness: 0.94,
      side: THREE.DoubleSide,
    }),
    canvasBrown: new THREE.MeshStandardMaterial({
      color: 0x484238,
      metalness: 0.0,
      roughness: 0.94,
      side: THREE.DoubleSide,
    }),
    paddedSleeveOrange: new THREE.MeshStandardMaterial({
      color: 0xb55a22,
      metalness: 0.08,
      roughness: 0.82,
    }),
    ladderSilver: new THREE.MeshStandardMaterial({
      color: 0xcfd4dc,
      metalness: 0.9,
      roughness: 0.22,
      envMapIntensity: 1.6,
    }),
    checkerPlate: new THREE.MeshStandardMaterial({
      color: 0x888c92,
      metalness: 0.85,
      roughness: 0.35,
    }),
    lensClear: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.95,
      transparent: true,
      roughness: 0.04,
      ior: 1.5,
      envMapIntensity: 1.6,
    }),
    lensAmber: new THREE.MeshPhysicalMaterial({
      color: 0xff8c00,
      emissive: 0xcc6000,
      emissiveIntensity: 0.45,
      roughness: 0.06,
      transparent: true,
      opacity: 0.92,
    }),
    lensRed: new THREE.MeshPhysicalMaterial({
      color: 0xcc1111,
      emissive: 0x990808,
      emissiveIntensity: 0.4,
      roughness: 0.06,
      transparent: true,
      opacity: 0.92,
    }),
    headlightReflector: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.04,
      envMapIntensity: 2.4,
    }),
  };
}

/* =================================================================== PROCEDURAL TEXTURES */
function createTexture(w, h, draw) {
  if (typeof document === 'undefined') {
    const data = new Uint8Array(w * h * 4);
    data.fill(220);
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

function licensePlateTexture(province, reg) {
  return createTexture(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 10;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 50px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(province, 64, h / 2);

    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(116, 20);
    ctx.lineTo(116, h - 20);
    ctx.stroke();

    ctx.font = '900 86px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(reg, 318, h / 2 + 4);
  });
}

function emblemTexture() {
  return createTexture(512, 340, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;

    function strokeEllipse(x, y, rx, ry, lw, color) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.lineWidth = lw;
      ctx.strokeStyle = color;
      ctx.stroke();
    }

    strokeEllipse(cx, cy, 210, 135, 34, '#ffffff');
    strokeEllipse(cx, cy - 24, 76, 102, 28, '#ffffff');
    strokeEllipse(cx, cy - 42, 142, 48, 28, '#ffffff');
  });
}

function badgeTexture(text, { font = 'bold 100px Arial, sans-serif', spacing = 16 } = {}) {
  return createTexture(768, 180, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = `${spacing}px`;

    ctx.fillStyle = '#f0f3f6';
    ctx.fillText(text, w / 2, h / 2);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    ctx.strokeText(text, w / 2, h / 2);
  });
}

/** Official Wild Yala Safari Door Badge */
function doorLogoTexture(logoTexture) {
  if (logoTexture && logoTexture.isTexture) return logoTexture;
  return createTexture(512, 256, (ctx, w, h) => {
    // White enamel tour operator decal backing
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Dark outer border
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    // Inner safari gold accent border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Top text
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WILD YALA', w / 2, 68);

    // Prominent brand text
    ctx.fillStyle = '#d97706';
    ctx.font = '900 52px Arial, sans-serif';
    ctx.fillText('SAFARI', w / 2, 128);

    // Subtitle
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('YALA NATIONAL PARK', w / 2, 186);
  });
}

/* =================================================================== GEOMETRY HELPERS */
function rbox(x, y, z, r = 0.03, mat, s = 2) {
  const radius = Math.min(r, x / 2 - 0.001, y / 2 - 0.001, z / 2 - 0.001);
  const geo = new RoundedBoxGeometry(x, y, z, s, Math.max(0.001, radius));
  return new THREE.Mesh(geo, mat);
}

function cylGeo(rT, rB, h, seg = 20, open = false, thetaStart = 0, thetaLength = Math.PI * 2) {
  return new THREE.CylinderGeometry(rT, rB, h, seg, 1, open, thetaStart, thetaLength);
}

function cyl(rT, rB, h, seg = 20, mat, open = false) {
  return new THREE.Mesh(cylGeo(rT, rB, h, seg, open), mat);
}

function rod(mat, p1, p2, r = 0.03, seg = 14) {
  const v1 = new THREE.Vector3(...p1);
  const v2 = new THREE.Vector3(...p2);
  const len = v1.distanceTo(v2);
  if (len < 0.001) return new THREE.Group();

  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  mesh.position.copy(v1).add(v2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.sub(v1).normalize());
  return mesh;
}

function curvedTube(mat, points, r = 0.03, radialSeg = 10, tubSeg = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, tubSeg, r, radialSeg, false);
  return new THREE.Mesh(geo, mat);
}

function badge(texture, w = 0.3, h = 0.15, facing = 1, depthTest = true) {
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    metalness: 0.7,
    roughness: 0.25,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    depthTest,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2;
  mesh.renderOrder = 4;
  return mesh;
}

function licensePlateMesh(texture, w = 0.36, h = 0.12, facing = 1) {
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0.2,
    roughness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2;
  return mesh;
}

/** Adds Wild Yala Safari door logo decal to BOTH sides with correct orientation (no horizontal mirroring) */
function addDoorLogos(group, logoTexture, x = 0.38, y = 0.98, halfW = 0.92, w = 0.36, h = 0.18) {
  const tex = doorLogoTexture(logoTexture);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.25,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });

  // Left door (+Z)
  const leftGeo = new THREE.PlaneGeometry(w, h);
  const leftMesh = new THREE.Mesh(leftGeo, mat);
  leftMesh.position.set(x, y, halfW + 0.015);
  group.add(leftMesh);

  // Right door (-Z): inverts UV.x so logo text is NOT mirrored backwards
  const rightGeo = new THREE.PlaneGeometry(w, h);
  const uvAttr = rightGeo.attributes.uv;
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setX(i, 1 - uvAttr.getX(i));
  }
  uvAttr.needsUpdate = true;

  const rightMesh = new THREE.Mesh(rightGeo, mat);
  rightMesh.position.set(x, y, -(halfW + 0.015));
  rightMesh.rotation.y = Math.PI;
  group.add(rightMesh);
}

function finish(g) {
  g.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
}

/* =================================================================== UNDERCARRIAGE */
function buildChassis(g, m, { length = 5.2, frontAxle = 1.54, rearAxle = -1.58, track = 1.54, groundY = 0.36, isSolidFront = false }) {
  const chassis = new THREE.Group();

  // Steel ladder frame rails
  [-0.48, 0.48].forEach((z) => {
    const rail = rbox(length - 0.3, 0.14, 0.09, 0.02, m.chassis, 1);
    rail.position.set((frontAxle + rearAxle) / 2, groundY + 0.07, z);
    chassis.add(rail);
  });

  // Heavy cross-members
  [-1.8, -0.9, 0.0, 0.9, 1.8].forEach((x) => {
    const cross = rbox(0.1, 0.1, 0.96, 0.015, m.chassis, 1);
    cross.position.set(x, groundY + 0.07, 0);
    chassis.add(cross);
  });

  // Front suspension
  if (isSolidFront) {
    const axleTube = cyl(0.048, 0.048, track + 0.06, 16, m.chassis);
    axleTube.rotation.x = Math.PI / 2;
    axleTube.position.set(frontAxle, groundY, 0);
    chassis.add(axleTube);

    const diff = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), m.chassis);
    diff.scale.set(1.15, 0.98, 0.98);
    diff.position.set(frontAxle - 0.03, groundY - 0.02, -0.2);
    chassis.add(diff);

    [-0.42, 0.42].forEach((z) => {
      const arm = rod(m.chassis, [frontAxle + 0.05, groundY, z], [frontAxle - 0.65, groundY + 0.06, z], 0.026);
      chassis.add(arm);
    });
  } else {
    [-1, 1].forEach((side) => {
      const armLower = rbox(0.28, 0.05, 0.36, 0.015, m.chassis, 1);
      armLower.position.set(frontAxle, groundY - 0.02, side * 0.54);
      chassis.add(armLower);

      const armUpper = rbox(0.22, 0.04, 0.3, 0.015, m.chassis, 1);
      armUpper.position.set(frontAxle, groundY + 0.12, side * 0.52);
      chassis.add(armUpper);
    });
    const frontDiff = rbox(0.28, 0.2, 0.28, 0.04, m.chassis, 1);
    frontDiff.position.set(frontAxle - 0.04, groundY + 0.02, 0);
    chassis.add(frontDiff);
  }

  // Rear live axle & differential pumpkin
  const rearAxleTube = cyl(0.054, 0.054, track + 0.06, 16, m.chassis);
  rearAxleTube.rotation.x = Math.PI / 2;
  rearAxleTube.position.set(rearAxle, groundY + 0.02, 0);
  chassis.add(rearAxleTube);

  const rearDiff = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), m.chassis);
  rearDiff.scale.set(1.2, 1.0, 1.0);
  rearDiff.position.set(rearAxle - 0.02, groundY + 0.01, 0);
  chassis.add(rearDiff);

  // Rear leaf spring packs
  [-0.52, 0.52].forEach((z) => {
    const leaf = rbox(1.15, 0.05, 0.07, 0.01, m.chassis, 1);
    leaf.position.set(rearAxle, groundY - 0.04, z);
    leaf.rotation.z = 0.03;
    chassis.add(leaf);
  });

  // Stainless steel exhaust system
  const muffler = rbox(0.7, 0.2, 0.26, 0.06, m.darkChrome, 1);
  muffler.position.set(-0.6, groundY + 0.06, 0.32);
  chassis.add(muffler);

  const tailpipe = rod(m.darkChrome, [-0.95, groundY + 0.06, 0.32], [-1.85, groundY + 0.02, 0.62], 0.03);
  chassis.add(tailpipe);

  // Front skid plate
  const skid = rbox(0.65, 0.04, 0.76, 0.02, m.darkChrome, 1);
  skid.position.set(frontAxle + 0.44, groundY - 0.04, 0);
  skid.rotation.z = -0.22;
  chassis.add(skid);

  g.add(chassis);
}

/* =================================================================== WHEELS */
function tireGeometry(R, w) {
  const rIn = R * 0.63;
  const pts = [
    [rIn, -w / 2],
    [R * 0.85, -w / 2],
    [R * 0.95, -w / 2 + 0.02],
    [R * 0.99, -w / 2 + 0.05],
    [R, -w / 2 + 0.09],
    [R, w / 2 - 0.09],
    [R * 0.99, w / 2 - 0.05],
    [R * 0.95, w / 2 - 0.02],
    [R * 0.85, w / 2],
    [rIn, w / 2],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 40);
  g.rotateX(Math.PI / 2);
  return g;
}

// 1. Toyota Hilux 6-Spoke Silver Alloy Wheel
function buildHiluxWheel(m, R = 0.46, w = 0.285) {
  const wheelGroup = new THREE.Group();
  wheelGroup.name = 'wheel_hilux';

  const tireMesh = new THREE.Mesh(tireGeometry(R, w), m.rubber);
  wheelGroup.add(tireMesh);

  // 3D All-terrain tread blocks
  const nLugs = 30;
  const lugGeo = new RoundedBoxGeometry(0.075, 0.024, w * 0.38, 1, 0.008);
  for (let i = 0; i < nLugs; i++) {
    const th = (i / nLugs) * Math.PI * 2;
    const staggered = (i % 2) * (w * 0.28) - w * 0.14;
    const lug = new THREE.Mesh(lugGeo, m.rubber);
    lug.position.set(Math.cos(th) * (R + 0.008), Math.sin(th) * (R + 0.008), staggered);
    lug.rotation.z = th + Math.PI / 2;
    wheelGroup.add(lug);
  }

  // Silver alloy rim
  const rimOuter = cyl(R * 0.65, R * 0.65, w - 0.02, 28, m.alloySilver);
  rimOuter.rotation.x = Math.PI / 2;
  wheelGroup.add(rimOuter);

  const rimLip = cyl(R * 0.64, R * 0.61, 0.04, 28, m.alloySilver);
  rimLip.rotation.x = Math.PI / 2;
  rimLip.position.z = w / 2 - 0.02;
  wheelGroup.add(rimLip);

  // 6 Silver Alloy Spokes
  const spokeGeo = new RoundedBoxGeometry(0.042, R * 0.42, 0.035, 1, 0.008);
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const spoke = new THREE.Mesh(spokeGeo, m.alloySilver);
    spoke.position.set(Math.cos(angle) * (R * 0.28), Math.sin(angle) * (R * 0.28), w / 2 - 0.03);
    spoke.rotation.z = angle + Math.PI / 2;
    wheelGroup.add(spoke);
  }

  // Center hub & lug nuts
  const hub = cyl(0.065, 0.065, 0.045, 20, m.alloySilver);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = w / 2 - 0.015;
  wheelGroup.add(hub);

  const cap = cyl(0.036, 0.036, 0.015, 18, m.chrome);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = w / 2 + 0.005;
  wheelGroup.add(cap);

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const nut = cyl(0.01, 0.01, 0.02, 6, m.chrome);
    nut.rotation.x = Math.PI / 2;
    nut.position.set(Math.cos(angle) * 0.046, Math.sin(angle) * 0.046, w / 2);
    wheelGroup.add(nut);
  }

  // Ventilated brake disc & red caliper
  const rotor = cyl(R * 0.46, R * 0.46, 0.016, 24, m.brakeRotor);
  rotor.rotation.x = Math.PI / 2;
  rotor.position.z = 0.02;
  wheelGroup.add(rotor);

  const caliper = rbox(0.12, 0.07, 0.05, 0.012, m.brakeCaliper);
  caliper.position.set(0, R * 0.32, 0.03);
  wheelGroup.add(caliper);

  return wheelGroup;
}

// 2. Toyota Land Cruiser Modular Black Steel Wheel with Red Rim Stripe
function buildCruiserWheel(m, isFront = true, R = 0.49, w = 0.30, isSpare = false) {
  const wheelGroup = new THREE.Group();
  wheelGroup.name = isSpare ? 'spare_assembly' : 'wheel_landcruiser';

  const tireMesh = new THREE.Mesh(tireGeometry(R, w), m.rubber);
  wheelGroup.add(tireMesh);

  // Aggressive mud-terrain tread lugs
  const nLugs = 28;
  const lugGeo = new RoundedBoxGeometry(0.085, 0.03, w * 0.42, 1, 0.01);
  for (let i = 0; i < nLugs; i++) {
    const th = (i / nLugs) * Math.PI * 2;
    const staggered = (i % 2) * (w * 0.26) - w * 0.13;
    const lug = new THREE.Mesh(lugGeo, m.rubber);
    lug.position.set(Math.cos(th) * (R + 0.01), Math.sin(th) * (R + 0.01), staggered);
    lug.rotation.z = th + Math.PI / 2;
    wheelGroup.add(lug);
  }

  // Deep-dish modular black steel rim
  const rimOuter = cyl(R * 0.64, R * 0.64, w - 0.02, 28, m.steelBlack);
  rimOuter.rotation.x = Math.PI / 2;
  wheelGroup.add(rimOuter);

  const dish = cyl(R * 0.63, R * 0.44, 0.08, 28, m.steelBlack, true);
  dish.rotation.x = Math.PI / 2;
  dish.position.z = w / 2 - 0.045;
  wheelGroup.add(dish);

  // DISTINCTIVE RED PINSTRIPE ACCENT RING (Exact match to reference photo!)
  const redRing = new THREE.Mesh(new THREE.TorusGeometry(R * 0.635, 0.009, 8, 36), m.redRimStripe);
  redRing.position.z = w / 2 - 0.005;
  wheelGroup.add(redRing);

  // Modular circular cutouts (8 round holes)
  const holeGeo = cylGeo(0.028, 0.028, 0.04, 16);
  holeGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const holePlug = new THREE.Mesh(holeGeo, m.plastic);
    holePlug.position.set(Math.cos(angle) * (R * 0.38), Math.sin(angle) * (R * 0.38), w / 2 - 0.06);
    wheelGroup.add(holePlug);
  }

  // Center hub & heavy 5-stud Land Cruiser wheel bolts
  const hubRadius = isFront ? 0.075 : 0.065;
  const hubHeight = isFront ? 0.07 : 0.045;
  const hub = cyl(hubRadius, hubRadius + 0.01, hubHeight, 20, m.steelBlack);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = w / 2 - 0.06 + hubHeight / 2;
  wheelGroup.add(hub);

  if (isFront) {
    const dial = cyl(0.042, 0.042, 0.02, 18, m.darkChrome);
    dial.rotation.x = Math.PI / 2;
    dial.position.z = w / 2 + 0.015;
    wheelGroup.add(dial);
  }

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const nut = cyl(0.011, 0.011, 0.025, 6, m.chrome);
    nut.rotation.x = Math.PI / 2;
    nut.position.set(Math.cos(angle) * 0.052, Math.sin(angle) * 0.052, w / 2 - 0.02);
    wheelGroup.add(nut);
  }

  // Ventilated brake disc & caliper
  const rotor = cyl(R * 0.48, R * 0.48, 0.018, 24, m.brakeRotor);
  rotor.rotation.x = Math.PI / 2;
  rotor.position.z = 0.015;
  wheelGroup.add(rotor);

  const caliper = rbox(0.14, 0.08, 0.055, 0.014, m.brakeCaliper);
  caliper.position.set(0, R * 0.32, 0.025);
  wheelGroup.add(caliper);

  return wheelGroup;
}

/* =================================================================== 1. TOYOTA HILUX VIGO (CHAMPAGNE BRONZE) */
export function buildHilux(logoTexture) {
  const m = buildPalette(0x9e8f7c, { paintMetal: 0.36, paintRough: 0.24, clearcoat: 1.0, clearcoatRoughness: 0.04 });
  const g = new THREE.Group();
  g.name = 'toyota_hilux_vigo_safari';

  const W = 1.84;
  const halfW = W / 2;
  const frontAxle = 1.52;
  const rearAxle = -1.56;
  const R = 0.46;
  const track = 1.56;

  // Undercarriage ladder frame & suspension
  buildChassis(g, m, { length: 5.25, frontAxle, rearAxle, track, groundY: 0.36, isSolidFront: false });

  // -------------------------------------------------------------
  // FULL-BODY CONTINUOUS LOWER SHELL (EXTRA-CAB PROFILE)
  // Continuous from rocker panel (Y = 0.58) to beltline (Y = 1.22)
  // -------------------------------------------------------------
  const lowerCab = new THREE.Group();
  lowerCab.position.set(0.42, 0.90, 0);

  // Solid cab core
  const cabCore = rbox(1.36, 0.64, W - 0.04, 0.05, m.paint);
  lowerCab.add(cabCore);

  // Full-depth doors on left (+Z) and right (-Z)
  [-1, 1].forEach((side) => {
    const doorSkin = rbox(1.34, 0.62, 0.08, 0.04, m.paint);
    doorSkin.position.set(0, 0, side * (halfW - 0.03));
    lowerCab.add(doorSkin);

    // Lower rocker sill panel
    const rocker = rbox(1.40, 0.12, 0.12, 0.03, m.paintDark);
    rocker.position.set(0, -0.28, side * (halfW - 0.04));
    lowerCab.add(rocker);

    // Chrome door handle with recessed pocket
    const handlePocket = rbox(0.18, 0.06, 0.02, 0.01, m.plastic);
    handlePocket.position.set(0.18, 0.14, side * (halfW + 0.01));
    lowerCab.add(handlePocket);

    const handleBar = rbox(0.14, 0.028, 0.035, 0.01, m.chrome);
    handleBar.position.set(0.18, 0.14, side * (halfW + 0.02));
    lowerCab.add(handleBar);

    // Aluminum side step running boards with anti-slip rubber pads
    const stepBar = rod(m.alloySilver, [-0.68, -0.38, side * (halfW + 0.06)], [0.65, -0.38, side * (halfW + 0.06)], 0.032);
    lowerCab.add(stepBar);

    const stepTread = rbox(1.24, 0.02, 0.13, 0.008, m.plastic);
    stepTread.position.set(-0.01, -0.35, side * (halfW + 0.06));
    lowerCab.add(stepTread);
  });

  g.add(lowerCab);

  // WILD YALA SAFARI LOGO ON BOTH DOORS (Matching user's fleet!)
  addDoorLogos(g, logoTexture, 0.44, 0.98, halfW, 0.38, 0.18);

  // -------------------------------------------------------------
  // CONTINUOUS FRONT FENDERS (SEALS THE ENGINE BAY & WHEEL WELLS)
  // -------------------------------------------------------------
  [-1, 1].forEach((side) => {
    const fz = side * (halfW - 0.05);

    const fenderTop = rbox(1.42, 0.22, 0.20, 0.05, m.paint);
    fenderTop.position.set(1.72, 1.15, fz);
    g.add(fenderTop);

    const fenderRear = rbox(0.36, 0.60, 0.18, 0.04, m.paint);
    fenderRear.position.set(1.16, 0.88, fz);
    g.add(fenderRear);

    const fenderFront = rbox(0.50, 0.44, 0.18, 0.04, m.paint);
    fenderFront.position.set(2.18, 0.84, fz);
    g.add(fenderFront);

    // Flared aerodynamic wheel arch
    const flare = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.052, 8, 28, Math.PI), m.paint);
    flare.rotation.y = side > 0 ? 0 : Math.PI;
    flare.position.set(frontAxle, R + 0.02, side * (halfW + 0.01));
    g.add(flare);

    // Inner wheelhouse liner
    const linerGeo = cylGeo(0.50, 0.50, 0.22, 22, true, -Math.PI / 2, Math.PI);
    linerGeo.rotateX(-Math.PI / 2);
    const liner = new THREE.Mesh(linerGeo, m.plastic);
    liner.position.set(frontAxle, R + 0.02, side * (halfW - 0.10));
    g.add(liner);

    // Front mudflap
    const mudflap = rbox(0.025, 0.28, 0.22, 0.01, m.rubber);
    mudflap.position.set(frontAxle - 0.48, R - 0.12, side * (halfW - 0.03));
    g.add(mudflap);
  });

  // -------------------------------------------------------------
  // AERODYNAMIC VIGO FRONT BUMPER & FOG LIGHTS
  // Full-width wrap-around composite bumper
  // -------------------------------------------------------------
  const bumper = new THREE.Group();
  bumper.position.set(2.44, 0.70, 0);

  const bumperMain = rbox(0.28, 0.38, W + 0.02, 0.07, m.paint);
  bumper.add(bumperMain);

  const lowerIntake = rbox(0.05, 0.15, 0.90, 0.02, m.plastic);
  lowerIntake.position.set(0.125, -0.07, 0);
  bumper.add(lowerIntake);

  // Front License Plate: WP LG-3446 (matching reference photo!)
  const plate = licensePlateMesh(licensePlateTexture('WP', 'LG-3446'), 0.34, 0.11, 1);
  plate.position.set(0.16, -0.07, 0);
  bumper.add(plate);

  // Integrated circular fog lights in molded pods
  [-0.66, 0.66].forEach((z) => {
    const bezel = cyl(0.054, 0.054, 0.04, 18, m.plastic);
    bezel.rotation.z = Math.PI / 2;
    bezel.position.set(0.12, -0.04, z);
    bumper.add(bezel);

    const fogLens = cyl(0.042, 0.042, 0.02, 18, m.lensClear);
    fogLens.rotation.z = Math.PI / 2;
    fogLens.position.set(0.14, -0.04, z);
    bumper.add(fogLens);
  });

  g.add(bumper);

  // -------------------------------------------------------------
  // HILUX VIGO CHROME GRILLE & TOYOTA EMBLEM
  // -------------------------------------------------------------
  const grille = new THREE.Group();
  grille.position.set(2.43, 1.04, 0);

  const meshBack = rbox(0.05, 0.28, 1.08, 0.02, m.plastic);
  grille.add(meshBack);

  // Wide chrome center bar
  const chromeBar = rbox(0.055, 0.072, 1.06, 0.02, m.chrome);
  chromeBar.position.set(0.025, 0.01, 0);
  grille.add(chromeBar);

  const topLip = rbox(0.04, 0.026, 1.08, 0.01, m.chrome);
  topLip.position.set(0.02, 0.13, 0);
  grille.add(topLip);

  const emblemMesh = badge(emblemTexture(), 0.22, 0.145, 1);
  emblemMesh.position.set(0.06, 0.01, 0);
  grille.add(emblemMesh);

  g.add(grille);

  // -------------------------------------------------------------
  // SWEPT-BACK VIGO HEADLIGHTS
  // -------------------------------------------------------------
  [-1, 1].forEach((side) => {
    const hz = side * 0.72;
    const hGroup = new THREE.Group();
    hGroup.position.set(2.36, 1.05, hz);

    const housing = rbox(0.24, 0.22, 0.32, 0.04, m.trim);
    hGroup.add(housing);

    [-0.06, 0.06].forEach((zOff) => {
      const reflector = cyl(0.055, 0.03, 0.05, 18, m.headlightReflector);
      reflector.rotation.z = Math.PI / 2;
      reflector.position.set(0.1, 0.01, zOff);
      hGroup.add(reflector);
    });

    const amber = rbox(0.04, 0.16, 0.06, 0.015, m.lensAmber);
    amber.position.set(0.08, 0.01, side > 0 ? 0.13 : -0.13);
    hGroup.add(amber);

    const lens = rbox(0.02, 0.2, 0.3, 0.035, m.lensClear);
    lens.position.set(0.125, 0, 0);
    hGroup.add(lens);

    g.add(hGroup);
  });

  // -------------------------------------------------------------
  // SLOPING HOOD & RECTANGULAR INTERCOOLER SCOOP
  // -------------------------------------------------------------
  const hood = new THREE.Group();
  hood.position.set(1.78, 1.25, 0);

  const hoodMain = rbox(1.28, 0.10, 1.54, 0.04, m.paint);
  hoodMain.rotation.z = -0.065;
  hood.add(hoodMain);

  const scoop = rbox(0.40, 0.065, 0.34, 0.02, m.paint);
  scoop.position.set(0.06, 0.075, 0);
  scoop.rotation.z = -0.065;
  hood.add(scoop);

  const scoopIntake = rbox(0.03, 0.035, 0.28, 0.01, m.plastic);
  scoopIntake.position.set(0.25, 0.075, 0);
  scoopIntake.rotation.z = -0.065;
  hood.add(scoopIntake);

  g.add(hood);

  // Auxiliary fender mirror on left front corner
  const fenderMirror = new THREE.Group();
  fenderMirror.position.set(2.26, 1.28, 0.82);
  const fmStalk = rod(m.paint, [0, 0, 0], [0.03, 0.08, 0.04], 0.012);
  fenderMirror.add(fmStalk);
  const fmHead = rbox(0.06, 0.08, 0.05, 0.015, m.paint);
  fmHead.position.set(0.03, 0.08, 0.04);
  fenderMirror.add(fmHead);
  const fmGlass = rbox(0.005, 0.06, 0.04, 0.008, m.mirrorGlass);
  fmGlass.position.set(0.0, 0.08, 0.04);
  fenderMirror.add(fmGlass);
  g.add(fenderMirror);

  // -------------------------------------------------------------
  // UPPER CABIN, EXTRA-CAB QUARTER WINDOWS & WINDSHIELD
  // -------------------------------------------------------------
  const upperCab = new THREE.Group();
  upperCab.position.set(0.42, 1.56, 0);

  // Raked aerodynamic windshield
  const ws = new THREE.Group();
  ws.position.set(0.50, 0.06, 0);

  const wsGlass = rbox(0.04, 0.62, 1.44, 0.02, m.windshieldGlass);
  wsGlass.rotation.z = 0.58;
  ws.add(wsGlass);

  const frit = rbox(0.045, 0.60, 1.46, 0.015, m.trim);
  frit.rotation.z = 0.58;
  frit.scale.set(0.99, 0.98, 0.98);
  ws.add(frit);

  [-1, 1].forEach((side) => {
    const aPillar = rod(m.paint, [0.20, -0.24, side * 0.74], [-0.16, 0.34, side * 0.68], 0.044);
    ws.add(aPillar);
  });

  [-0.34, 0.28].forEach((wz) => {
    const wiperArm = rod(m.plastic, [0.26, -0.24, wz - 0.18], [0.09, -0.07, wz + 0.18], 0.009);
    ws.add(wiperArm);
  });
  upperCab.add(ws);

  // Aerodynamic cab roof
  const roof = rbox(0.98, 0.07, 1.44, 0.03, m.paint);
  roof.position.set(-0.06, 0.36, 0);
  upperCab.add(roof);

  // Side door windows & Extra-Cab quarter windows
  [-1, 1].forEach((side) => {
    const swz = side * (halfW - 0.02);

    // Front door glass
    const frontDoorGlass = rbox(0.56, 0.44, 0.03, 0.02, m.glass);
    frontDoorGlass.position.set(0.12, 0.12, swz);
    upperCab.add(frontDoorGlass);

    // Extended Extra-Cab rear quarter window (characteristic Hilux Vigo!)
    const extraCabGlass = rbox(0.28, 0.38, 0.03, 0.02, m.glass);
    extraCabGlass.position.set(-0.36, 0.12, swz);
    upperCab.add(extraCabGlass);

    // B-pillar divider
    const bPillar = rbox(0.06, 0.46, 0.04, 0.01, m.trim);
    bPillar.position.set(-0.20, 0.12, swz);
    upperCab.add(bPillar);

    // Chrome mirror
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(0.44, 0.06, side * halfW);

    const stalk = rod(m.plastic, [0, 0, 0], [-0.02, 0.02, side * 0.1], 0.018);
    mirrorGroup.add(stalk);

    const housing = rbox(0.12, 0.16, 0.18, 0.035, m.chrome);
    housing.position.set(-0.01, 0.03, side * 0.14);
    housing.rotation.y = side * 0.12;
    mirrorGroup.add(housing);

    const glass = rbox(0.008, 0.13, 0.15, 0.01, m.mirrorGlass);
    glass.position.set(-0.065, 0.03, side * 0.14);
    glass.rotation.y = side * 0.12;
    mirrorGroup.add(glass);

    upperCab.add(mirrorGroup);
  });

  // Rear cab window
  const rearCabGlass = rbox(0.03, 0.40, 1.20, 0.015, m.glass);
  rearCabGlass.position.set(-0.54, 0.14, 0);
  upperCab.add(rearCabGlass);

  g.add(upperCab);

  // -------------------------------------------------------------
  // CONTINUOUS PICKUP BED & REAR TAILGATE
  // -------------------------------------------------------------
  const bed = new THREE.Group();
  bed.position.set(-1.32, 0.90, 0);

  const bedFloor = rbox(2.36, 0.06, W - 0.06, 0.02, m.checkerPlate);
  bedFloor.position.set(0, 0.22, 0);
  bed.add(bedFloor);

  [-1, 1].forEach((side) => {
    const wall = rbox(2.40, 0.64, 0.09, 0.03, m.paint);
    wall.position.set(0, 0.04, side * (halfW - 0.04));
    bed.add(wall);

    const rearFlare = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.048, 8, 28, Math.PI), m.paint);
    rearFlare.rotation.y = side > 0 ? 0 : Math.PI;
    rearFlare.position.set(rearAxle - bed.position.x, R + 0.02 - bed.position.y, side * (halfW + 0.01));
    bed.add(rearFlare);

    const linerGeo = cylGeo(0.50, 0.50, 0.20, 20, true, -Math.PI / 2, Math.PI);
    linerGeo.rotateX(-Math.PI / 2);
    const liner = new THREE.Mesh(linerGeo, m.plastic);
    liner.position.set(rearAxle - bed.position.x, R + 0.02 - bed.position.y, side * (halfW - 0.09));
    bed.add(liner);

    const rearMudflap = rbox(0.02, 0.28, 0.22, 0.01, m.rubber);
    rearMudflap.position.set(rearAxle - bed.position.x - 0.54, R - 0.12 - bed.position.y, side * (halfW - 0.02));
    bed.add(rearMudflap);

    const tailGroup = new THREE.Group();
    tailGroup.position.set(-1.20, 0.12, side * (halfW - 0.05));

    const redLens = rbox(0.04, 0.22, 0.12, 0.02, m.lensRed);
    redLens.position.y = 0.10;
    tailGroup.add(redLens);

    const amberLens = rbox(0.04, 0.10, 0.12, 0.015, m.lensAmber);
    amberLens.position.y = -0.06;
    tailGroup.add(amberLens);

    const whiteLens = rbox(0.04, 0.08, 0.12, 0.015, m.lensClear);
    whiteLens.position.y = -0.15;
    tailGroup.add(whiteLens);

    bed.add(tailGroup);
  });

  const tailgate = rbox(0.08, 0.60, W - 0.14, 0.03, m.paint);
  tailgate.position.set(-1.20, 0.04, 0);
  bed.add(tailgate);

  const tHandle = rbox(0.03, 0.08, 0.22, 0.015, m.chrome);
  tHandle.position.set(-1.25, 0.20, 0);
  bed.add(tHandle);

  const badgeToyota = badge(badgeTexture('TOYOTA', { spacing: 22 }), 0.58, 0.14, -1);
  badgeToyota.position.set(-1.245, 0.08, 0);
  bed.add(badgeToyota);

  const rearBumper = rbox(0.18, 0.15, W - 0.04, 0.04, m.chrome);
  rearBumper.position.set(-1.32, -0.26, 0);
  bed.add(rearBumper);

  g.add(bed);

  // -------------------------------------------------------------
  // SIGNATURE OVER-CAB SAFARI CANOPY & PADDED ORANGE SLEEVES
  // Exactly matching the photo: elevated safari roof covers the whole vehicle!
  // -------------------------------------------------------------
  const safari = new THREE.Group();
  const x0 = -2.54;
  const x1 = 0.08;
  const canopyFrontX = 0.86; // Extends all the way over the cab!
  const deckY = 1.25;
  const roofY = 2.48;
  const seatWidth = halfW * 2 - 0.26;

  // 3-Tier Safari Stadium Seating
  const seatRows = [
    { x: x1 - 0.44, rise: 0.0 },
    { x: (x0 + x1) / 2 - 0.05, rise: 0.14 },
    { x: x0 + 0.52, rise: 0.28 },
  ];

  seatRows.forEach(({ x, rise }) => {
    const rowGroup = new THREE.Group();
    rowGroup.position.set(x, deckY + rise, 0);

    const pedestal = rbox(0.44, 0.22 + rise, seatWidth * 0.96, 0.02, m.trim);
    pedestal.position.set(0, -(0.22 + rise) / 2, 0);
    rowGroup.add(pedestal);

    const cushion = rbox(0.48, 0.12, seatWidth, 0.035, m.blackLeatherSeats);
    cushion.position.set(0, 0.06, 0);
    rowGroup.add(cushion);

    const backrest = rbox(0.10, 0.54, seatWidth, 0.035, m.blackLeatherSeats);
    backrest.position.set(-0.21, 0.36, 0);
    backrest.rotation.z = -0.12;
    rowGroup.add(backrest);

    [-seatWidth * 0.25, seatWidth * 0.25].forEach((hz) => {
      const headrest = rbox(0.08, 0.18, 0.28, 0.03, m.blackLeatherSeats);
      headrest.position.set(-0.27, 0.74, hz);
      headrest.rotation.z = -0.12;
      rowGroup.add(headrest);
    });

    safari.add(rowGroup);
  });

  // Roll cage framework with padded protective sleeves on vertical posts
  const postsX = [x0 + 0.08, (x0 + x1) / 2 - 0.15, x1 - 0.06];
  const postZ = halfW - 0.05;

  postsX.forEach((px) => {
    [-1, 1].forEach((s) => {
      const upright = rod(m.safariFrameBlack, [px, deckY, s * postZ], [px, roofY - 0.02, s * postZ], 0.032);
      safari.add(upright);

      // DISTINCTIVE BROWN/ORANGE PADDED PROTECTIVE SLEEVE (matching reference photo!)
      const sleeve = cyl(0.054, 0.054, roofY - deckY - 0.35, 16, m.paddedSleeveOrange);
      sleeve.position.set(px, (deckY + roofY) / 2 - 0.10, s * postZ);
      safari.add(sleeve);
    });
  });

  // Cab roof forward support stanchions connecting canopy to cab roof
  [-1, 1].forEach((s) => {
    const cabPost = rod(m.safariFrameBlack, [canopyFrontX - 0.12, 1.95, s * postZ * 0.9], [canopyFrontX - 0.12, roofY - 0.02, s * postZ * 0.9], 0.028);
    safari.add(cabPost);
  });

  // Perimeter waist safety rails & top roof rails running full length over cab
  [-1, 1].forEach((s) => {
    const roofRail = rod(m.safariFrameBlack, [x0 + 0.06, roofY - 0.02, s * postZ], [canopyFrontX, roofY - 0.02, s * postZ], 0.032);
    safari.add(roofRail);

    const waistRail = rod(m.safariFrameBlack, [x0 + 0.08, deckY + 0.62, s * postZ], [x1 - 0.06, deckY + 0.62, s * postZ], 0.026);
    safari.add(waistRail);
  });

  // FULL OVER-CAB CANVAS CANOPY ROOF (Iconic Sri Lankan safari roof architecture!)
  const canopyLen = canopyFrontX - x0 + 0.12;
  const canopy = rbox(canopyLen, 0.05, halfW * 2 + 0.04, 0.025, m.canvasBrown);
  canopy.position.set((x0 + canopyFrontX) / 2 + 0.06, roofY + 0.03, 0);
  safari.add(canopy);

  // Front sun visor flap angling forward over the windshield
  const visor = rbox(0.36, 0.04, halfW * 2 + 0.02, 0.02, m.canvasBrown);
  visor.position.set(canopyFrontX + 0.16, roofY - 0.02, 0);
  visor.rotation.z = 0.28;
  safari.add(visor);

  g.add(safari);

  // -------------------------------------------------------------
  // ROAD WHEELS (4 ROAD WHEELS THAT SPIN ABOUT LOCAL Z)
  // -------------------------------------------------------------
  const wheels = [];
  [
    { x: frontAxle, z: track / 2 },
    { x: frontAxle, z: -track / 2 },
    { x: rearAxle, z: track / 2 },
    { x: rearAxle, z: -track / 2 },
  ].forEach(({ x, z }) => {
    const wheel = buildHiluxWheel(m, R, 0.285);
    wheel.position.set(x, R + 0.02, z);
    if (z < 0) wheel.rotation.y = Math.PI;
    g.add(wheel);
    wheels.push(wheel);
  });

  finish(g);
  return { group: g, wheels, wheelRadius: R + 0.02 };
}

/* =================================================================== 2. TOYOTA LAND CRUISER 70 (METALLIC BLACK) */
export function buildCruiser(logoTexture) {
  const m = buildPalette(0x1a1c1e, { paintMetal: 0.28, paintRough: 0.22, clearcoat: 1.0, clearcoatRoughness: 0.04 });
  const g = new THREE.Group();
  g.name = 'toyota_landcruiser_79_safari';

  const W = 1.86;
  const halfW = W / 2;
  const frontAxle = 1.56;
  const rearAxle = -1.60;
  const R = 0.49;
  const track = 1.58;

  // Solid front axle undercarriage
  buildChassis(g, m, { length: 5.2, frontAxle, rearAxle, track, groundY: 0.38, isSolidFront: true });

  // -------------------------------------------------------------
  // FULL-BODY CONTINUOUS LOWER SHELL (CABIN, DOORS, SILLS, FLOOR)
  // -------------------------------------------------------------
  const lowerCab = new THREE.Group();
  lowerCab.position.set(0.40, 0.95, 0);

  const cabCore = rbox(1.18, 0.66, W - 0.04, 0.04, m.paint);
  lowerCab.add(cabCore);

  [-1, 1].forEach((side) => {
    const doorSkin = rbox(1.16, 0.64, 0.08, 0.03, m.paint);
    doorSkin.position.set(0, 0, side * (halfW - 0.03));
    lowerCab.add(doorSkin);

    const doorCrease = rbox(1.14, 0.024, 0.02, 0.008, m.paintDark);
    doorCrease.position.set(0, 0.06, side * (halfW + 0.005));
    lowerCab.add(doorCrease);

    const handle = rbox(0.16, 0.04, 0.03, 0.01, m.darkChrome);
    handle.position.set(0.08, 0.16, side * (halfW + 0.015));
    lowerCab.add(handle);

    const rocker = rbox(1.22, 0.14, 0.12, 0.03, m.paintDark);
    rocker.position.set(0, -0.30, side * (halfW - 0.04));
    lowerCab.add(rocker);

    // Rock slider / tubular side step
    const slider = rod(m.chassis, [-0.58, -0.42, side * (halfW + 0.07)], [0.56, -0.42, side * (halfW + 0.07)], 0.038);
    lowerCab.add(slider);

    const stepPlate = rbox(0.85, 0.025, 0.14, 0.01, m.checkerPlate);
    stepPlate.position.set(0, -0.38, side * (halfW + 0.07));
    lowerCab.add(stepPlate);
  });

  g.add(lowerCab);

  // WILD YALA SAFARI LOGO ON BOTH DOORS (Matching user's fleet!)
  addDoorLogos(g, logoTexture, 0.42, 1.05, halfW, 0.38, 0.18);

  // -------------------------------------------------------------
  // CONTINUOUS FRONT FENDERS (SEALS THE ENGINE BAY & WHEEL WELLS)
  // -------------------------------------------------------------
  [-1, 1].forEach((side) => {
    const fz = side * (halfW - 0.05);

    const fenderTop = rbox(1.48, 0.24, 0.20, 0.04, m.paint);
    fenderTop.position.set(1.78, 1.20, fz);
    g.add(fenderTop);

    const fenderRear = rbox(0.38, 0.64, 0.18, 0.04, m.paint);
    fenderRear.position.set(1.18, 0.92, fz);
    g.add(fenderRear);

    const fenderFront = rbox(0.52, 0.46, 0.18, 0.04, m.paint);
    fenderFront.position.set(2.22, 0.88, fz);
    g.add(fenderFront);

    // Stamped LC79 wheel flare
    const flare = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.054, 8, 28, Math.PI), m.paint);
    flare.rotation.y = side > 0 ? 0 : Math.PI;
    flare.position.set(frontAxle, R + 0.03, side * (halfW + 0.01));
    g.add(flare);

    // Inner wheel liner
    const linerGeo = cylGeo(0.53, 0.53, 0.22, 22, true, -Math.PI / 2, Math.PI);
    linerGeo.rotateX(-Math.PI / 2);
    const liner = new THREE.Mesh(linerGeo, m.plastic);
    liner.position.set(frontAxle, R + 0.03, side * (halfW - 0.10));
    g.add(liner);

    // Mudflap
    const mudflap = rbox(0.025, 0.30, 0.24, 0.01, m.rubber);
    mudflap.position.set(frontAxle - 0.50, R - 0.14, side * (halfW - 0.03));
    g.add(mudflap);

    // Chrome "LAND CRUISER" script badge
    const sideBadge = badge(badgeTexture('LAND CRUISER', { font: '700 85px Montserrat, Arial', spacing: 10 }), 0.38, 0.08, side > 0 ? 1 : -1);
    sideBadge.rotation.y = side > 0 ? 0 : Math.PI;
    sideBadge.position.set(1.15, 1.15, side * (halfW + 0.015));
    g.add(sideBadge);
  });

  // -------------------------------------------------------------
  // FACTORY MODERN LC79 COMPOSITE BUMPER & FOG LIGHTS
  // -------------------------------------------------------------
  const bumper = new THREE.Group();
  bumper.position.set(2.46, 0.74, 0);

  const bBar = rbox(0.30, 0.36, W + 0.04, 0.06, m.lcBumper);
  bumper.add(bBar);

  const plateRecess = rbox(0.05, 0.16, 0.42, 0.02, m.lcBumper);
  plateRecess.position.set(0.155, -0.02, 0);
  bumper.add(plateRecess);

  // Front License Plate: WP DAG 3897 (matching Land Cruiser reference photo!)
  const plate = licensePlateMesh(licensePlateTexture('WP', 'DAG 3897'), 0.34, 0.11, 1);
  plate.position.set(0.185, -0.02, 0);
  bumper.add(plate);

  // Round integrated fog lights
  [-0.68, 0.68].forEach((z) => {
    const bezel = cyl(0.055, 0.055, 0.04, 18, m.plastic);
    bezel.rotation.z = Math.PI / 2;
    bezel.position.set(0.13, -0.05, z);
    bumper.add(bezel);

    const fog = cyl(0.044, 0.044, 0.02, 18, m.lensClear);
    fog.rotation.z = Math.PI / 2;
    fog.position.set(0.15, -0.05, z);
    bumper.add(fog);
  });

  g.add(bumper);

  // -------------------------------------------------------------
  // MODERN LC79 HORIZONTAL SLATTED GRILLE & TOYOTA EMBLEM
  // -------------------------------------------------------------
  const grille = new THREE.Group();
  grille.position.set(2.42, 1.14, 0);

  const gFrame = rbox(0.06, 0.34, 1.08, 0.025, m.lcBumper);
  grille.add(gFrame);

  const gBack = rbox(0.04, 0.30, 1.02, 0.015, m.plastic);
  gBack.position.set(-0.01, 0, 0);
  grille.add(gBack);

  [-0.09, -0.03, 0.03, 0.09].forEach((yOff) => {
    const slat = rbox(0.025, 0.022, 0.98, 0.008, m.trim);
    slat.position.set(0.02, yOff, 0);
    grille.add(slat);
  });

  const badgeMesh = badge(emblemTexture(), 0.24, 0.16, 1);
  badgeMesh.position.set(0.045, 0.01, 0);
  grille.add(badgeMesh);

  g.add(grille);

  // -------------------------------------------------------------
  // MODERN CLEAR COMPOSITE HEADLIGHTS WITH AMBER CORNERS
  // -------------------------------------------------------------
  [-1, 1].forEach((side) => {
    const hz = side * 0.72;
    const hGroup = new THREE.Group();
    hGroup.position.set(2.36, 1.14, hz);

    const housing = rbox(0.18, 0.30, 0.32, 0.03, m.trim);
    hGroup.add(housing);

    const lampBucket = rbox(0.04, 0.22, 0.20, 0.02, m.headlightReflector);
    lampBucket.position.set(0.08, 0, -side * 0.04);
    hGroup.add(lampBucket);

    const projector = cyl(0.055, 0.055, 0.03, 18, m.lensClear);
    projector.rotation.z = Math.PI / 2;
    projector.position.set(0.105, 0, -side * 0.04);
    hGroup.add(projector);

    const amber = rbox(0.05, 0.22, 0.08, 0.015, m.lensAmber);
    amber.position.set(0.08, 0, side * 0.11);
    hGroup.add(amber);

    const lens = rbox(0.02, 0.26, 0.28, 0.02, m.lensClear);
    lens.position.set(0.115, 0, 0);
    hGroup.add(lens);

    g.add(hGroup);
  });

  // -------------------------------------------------------------
  // RAISED HOOD WITH PROMINENT TURBO-DIESEL INTERCOOLER SCOOP
  // -------------------------------------------------------------
  const hood = new THREE.Group();
  hood.position.set(1.75, 1.36, 0);

  const hoodMain = rbox(1.36, 0.09, 1.56, 0.03, m.paint);
  hoodMain.rotation.z = -0.02;
  hood.add(hoodMain);

  const bulge = rbox(1.05, 0.06, 0.64, 0.025, m.paint);
  bulge.position.set(0.05, 0.05, 0);
  bulge.rotation.z = -0.02;
  hood.add(bulge);

  // Large forward-facing V8 turbo-diesel intercooler scoop
  const scoop = rbox(0.48, 0.08, 0.38, 0.02, m.paint);
  scoop.position.set(0.24, 0.095, 0);
  hood.add(scoop);

  const scoopMouth = rbox(0.04, 0.045, 0.32, 0.01, m.plastic);
  scoopMouth.position.set(0.48, 0.095, 0);
  hood.add(scoopMouth);

  g.add(hood);

  // -------------------------------------------------------------
  // MATTE BLACK A-PILLAR SNORKEL (Right side, matching photo!)
  // -------------------------------------------------------------
  const snorkel = new THREE.Group();
  const sz = -(halfW + 0.07);

  const sLower = rod(m.plastic, [1.90, 1.18, sz], [1.12, 1.36, sz], 0.052);
  snorkel.add(sLower);

  const sUpright = rod(m.plastic, [1.12, 1.36, sz], [0.86, 2.10, sz], 0.052);
  snorkel.add(sUpright);

  const sHead = rbox(0.24, 0.14, 0.15, 0.04, m.plastic);
  sHead.position.set(0.90, 2.16, sz);
  snorkel.add(sHead);

  const sMouth = rbox(0.03, 0.09, 0.12, 0.01, m.trim);
  sMouth.position.set(1.02, 2.16, sz);
  snorkel.add(sMouth);

  g.add(snorkel);

  // -------------------------------------------------------------
  // UPPER CABIN, UPRIGHT WINDSHIELD & STEEL ROOF
  // -------------------------------------------------------------
  const upperCab = new THREE.Group();
  upperCab.position.set(0.40, 1.64, 0);

  const ws = new THREE.Group();
  ws.position.set(0.50, 0.10, 0);

  const wsGlass = rbox(0.03, 0.64, 1.48, 0.015, m.windshieldGlass);
  wsGlass.rotation.z = 0.32;
  ws.add(wsGlass);

  const wsGasket = rbox(0.035, 0.66, 1.50, 0.01, m.trim);
  wsGasket.rotation.z = 0.32;
  wsGasket.scale.set(0.99, 0.98, 0.98);
  ws.add(wsGasket);

  [-1, 1].forEach((side) => {
    const aPillar = rod(m.paint, [0.18, -0.26, side * 0.77], [-0.14, 0.34, side * 0.74], 0.048);
    ws.add(aPillar);
  });
  upperCab.add(ws);

  const roof = rbox(0.88, 0.08, 1.52, 0.025, m.paint);
  roof.position.set(-0.06, 0.42, 0);
  upperCab.add(roof);

  [-1, 1].forEach((side) => {
    const gutter = rod(m.paint, [0.36, 0.45, side * 0.77], [-0.50, 0.45, side * 0.77], 0.016, 6);
    upperCab.add(gutter);

    const sideGlass = rbox(0.66, 0.48, 0.03, 0.02, m.glass);
    sideGlass.position.set(0.02, 0.14, side * (halfW - 0.02));
    upperCab.add(sideGlass);

    // Vertical truck-style side view mirror
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(0.42, 0.08, side * halfW);

    const stalkTop = rod(m.plastic, [0, 0.08, 0], [0, 0.12, side * 0.12], 0.018);
    mirrorGroup.add(stalkTop);

    const stalkBot = rod(m.plastic, [0, -0.10, 0], [0, -0.06, side * 0.12], 0.018);
    mirrorGroup.add(stalkBot);

    const housing = rbox(0.09, 0.26, 0.16, 0.03, m.plastic);
    housing.position.set(0, 0.03, side * 0.14);
    mirrorGroup.add(housing);

    const glass = rbox(0.008, 0.22, 0.13, 0.01, m.mirrorGlass);
    glass.position.set(-0.05, 0.03, side * 0.14);
    mirrorGroup.add(glass);

    upperCab.add(mirrorGroup);
  });

  const rearCabGlass = rbox(0.03, 0.42, 1.20, 0.015, m.glass);
  rearCabGlass.position.set(-0.52, 0.16, 0);
  upperCab.add(rearCabGlass);

  g.add(upperCab);

  // -------------------------------------------------------------
  // DROP-SIDE REAR UTILITY BED WITH HORIZONTAL SWAGE RIBS
  // -------------------------------------------------------------
  const bed = new THREE.Group();
  bed.position.set(-1.36, 0.95, 0);

  const bedFloor = rbox(2.48, 0.06, W - 0.06, 0.02, m.checkerPlate);
  bedFloor.position.set(0, 0.26, 0);
  bed.add(bedFloor);

  [-1, 1].forEach((side) => {
    const wall = rbox(2.50, 0.66, 0.09, 0.025, m.paint);
    wall.position.set(0, 0.06, side * (halfW - 0.04));
    bed.add(wall);

    // Stamped horizontal swage ribs along the side panel (seen in photo!)
    [-0.10, 0.10, 0.26].forEach((ry) => {
      const rib = rbox(2.46, 0.026, 0.022, 0.008, m.paint);
      rib.position.set(0, ry, side * (halfW + 0.005));
      bed.add(rib);
    });

    const rearFlare = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.052, 8, 28, Math.PI), m.paint);
    rearFlare.rotation.y = side > 0 ? 0 : Math.PI;
    rearFlare.position.set(rearAxle - bed.position.x, R + 0.03 - bed.position.y, side * (halfW + 0.01));
    bed.add(rearFlare);

    const linerGeo = cylGeo(0.53, 0.53, 0.20, 20, true, -Math.PI / 2, Math.PI);
    linerGeo.rotateX(-Math.PI / 2);
    const liner = new THREE.Mesh(linerGeo, m.plastic);
    liner.position.set(rearAxle - bed.position.x, R + 0.03 - bed.position.y, side * (halfW - 0.09));
    bed.add(liner);

    const rearMudflap = rbox(0.025, 0.32, 0.24, 0.01, m.rubber);
    rearMudflap.position.set(rearAxle - bed.position.x - 0.56, R - 0.14 - bed.position.y, side * (halfW - 0.02));
    bed.add(rearMudflap);

    const tailLight = new THREE.Group();
    tailLight.position.set(-1.26, 0.08, side * (halfW - 0.06));

    const red = rbox(0.04, 0.16, 0.12, 0.015, m.lensRed);
    red.position.y = 0.07;
    tailLight.add(red);

    const amber = rbox(0.04, 0.08, 0.12, 0.01, m.lensAmber);
    amber.position.y = -0.05;
    tailLight.add(amber);

    bed.add(tailLight);
  });

  const tailgate = rbox(0.08, 0.62, W - 0.14, 0.025, m.paint);
  tailgate.position.set(-1.26, 0.06, 0);
  bed.add(tailgate);

  const bToyota = badge(badgeTexture('TOYOTA', { spacing: 22 }), 0.54, 0.13, -1);
  bToyota.position.set(-1.305, 0.18, 0);
  bed.add(bToyota);

  const bCruiser = badge(badgeTexture('LAND CRUISER', { font: '700 90px Montserrat, Arial', spacing: 14 }), 0.48, 0.11, -1);
  bCruiser.position.set(-1.305, 0.02, 0);
  bed.add(bCruiser);

  const rearBumper = rbox(0.20, 0.16, W, 0.035, m.lcBumper);
  rearBumper.position.set(-1.38, -0.26, 0);
  bed.add(rearBumper);

  g.add(bed);

  // -------------------------------------------------------------
  // SAFARI CONVERSION: OLIVE TUBULAR FRAME, LADDER & CANOPY
  // -------------------------------------------------------------
  const safari = new THREE.Group();
  const x0 = -2.60;
  const x1 = 0.06;
  const canopyOverhangX = 0.28; // Extends over the rear half of the single-cab roof!
  const deckY = 1.35;
  const roofY = 2.56;
  const seatWidth = halfW * 2 - 0.26;

  // 3-Tier Black Leather High-Back Bucket Seats
  const seatRows = [
    { x: x1 - 0.44, rise: 0.0 },
    { x: (x0 + x1) / 2 - 0.05, rise: 0.14 },
    { x: x0 + 0.52, rise: 0.28 },
  ];

  seatRows.forEach(({ x, rise }) => {
    const rowGroup = new THREE.Group();
    rowGroup.position.set(x, deckY + rise, 0);

    const pedestal = rbox(0.44, 0.22 + rise, seatWidth * 0.96, 0.02, m.trim);
    pedestal.position.set(0, -(0.22 + rise) / 2, 0);
    rowGroup.add(pedestal);

    const cushion = rbox(0.48, 0.12, seatWidth, 0.035, m.blackLeatherSeats);
    cushion.position.set(0, 0.06, 0);
    rowGroup.add(cushion);

    const backrest = rbox(0.10, 0.54, seatWidth, 0.035, m.blackLeatherSeats);
    backrest.position.set(-0.21, 0.36, 0);
    backrest.rotation.z = -0.12;
    rowGroup.add(backrest);

    [-seatWidth * 0.25, seatWidth * 0.25].forEach((hz) => {
      const headrest = rbox(0.08, 0.18, 0.28, 0.03, m.blackLeatherSeats);
      headrest.position.set(-0.27, 0.74, hz);
      headrest.rotation.z = -0.12;
      rowGroup.add(headrest);
    });

    safari.add(rowGroup);
  });

  // Olive-Green Heavy-Duty Tubular Steel Safari Roll Cage
  const postsX = [x0 + 0.08, (x0 + x1) / 2 - 0.20, x1 - 0.06];
  const postZ = halfW - 0.05;

  postsX.forEach((px) => {
    [-1, 1].forEach((s) => {
      const upright = rod(m.safariFrameOlive, [px, deckY - 0.04, s * postZ], [px, roofY - 0.02, s * postZ], 0.036);
      safari.add(upright);
    });
  });

  [-1, 1].forEach((s) => {
    const roofRail = rod(m.safariFrameOlive, [x0 + 0.06, roofY - 0.02, s * postZ], [canopyOverhangX + 0.08, roofY - 0.02, s * postZ], 0.036);
    safari.add(roofRail);

    const waistRail = rod(m.safariFrameOlive, [x0 + 0.08, deckY + 0.62, s * postZ], [x1 - 0.06, deckY + 0.62, s * postZ], 0.028);
    safari.add(waistRail);
  });

  postsX.concat([canopyOverhangX]).forEach((px) => {
    const bowPoints = [
      [px, roofY - 0.02, -postZ],
      [px, roofY + 0.07, -postZ * 0.5],
      [px, roofY + 0.10, 0],
      [px, roofY + 0.07, postZ * 0.5],
      [px, roofY - 0.02, postZ],
    ];
    safari.add(curvedTube(m.safariFrameOlive, bowPoints, 0.028, 8, 20));
  });

  // Galvanized/Silver Side Boarding Ladder (mounted on passenger side behind cab, seen in photo!)
  const ladderX = x1 - 0.15;
  const ladderZ = halfW + 0.04;
  const ladderWidth = 0.26;

  [-ladderWidth / 2, ladderWidth / 2].forEach((off) => {
    const sideRail = rod(m.ladderSilver, [ladderX + off, deckY - 0.52, ladderZ], [ladderX + off, deckY + 0.45, ladderZ], 0.018);
    safari.add(sideRail);
  });
  for (let s = 0; s < 4; s++) {
    const sy = deckY - 0.44 + s * 0.26;
    const rung = rod(m.ladderSilver, [ladderX - ladderWidth / 2, sy, ladderZ], [ladderX + ladderWidth / 2, sy, ladderZ], 0.014);
    safari.add(rung);
  }

  // Dark Canvas Safari Canopy Roof
  const canopyLen = canopyOverhangX - x0 + 0.12;
  const canopy = rbox(canopyLen, 0.05, halfW * 2 + 0.04, 0.025, m.canvasKhaki);
  canopy.position.set((x0 + canopyOverhangX) / 2 + 0.06, roofY + 0.06, 0);
  safari.add(canopy);

  // Front sun visor flap
  const visor = rbox(0.34, 0.04, halfW * 2 + 0.02, 0.02, m.canvasKhaki);
  visor.position.set(canopyOverhangX + 0.18, roofY + 0.01, 0);
  visor.rotation.z = 0.24;
  safari.add(visor);

  g.add(safari);

  // -------------------------------------------------------------
  // ROAD WHEELS (4 ROAD WHEELS THAT SPIN ABOUT LOCAL Z)
  // Deep-dish black modular rims with red pinstripe lip
  // -------------------------------------------------------------
  const wheels = [];
  [
    { x: frontAxle, z: track / 2, isFront: true },
    { x: frontAxle, z: -track / 2, isFront: true },
    { x: rearAxle, z: track / 2, isFront: false },
    { x: rearAxle, z: -track / 2, isFront: false },
  ].forEach(({ x, z, isFront }) => {
    const wheel = buildCruiserWheel(m, isFront, R, 0.30, false);
    wheel.position.set(x, R + 0.02, z);
    if (z < 0) wheel.rotation.y = Math.PI;
    g.add(wheel);
    wheels.push(wheel);
  });

  finish(g);
  return { group: g, wheels, wheelRadius: R + 0.02 };
}
