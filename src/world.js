// The 3D scene: a road through space, one marker and one card per event, and a camera that
// glides along the road. Shapes and colours come from tokens.scene; nothing here knows the content.
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const UP = new THREE.Vector3(0, 1, 0);

export function createWorld({ webglHost, cssHost, tokens, cards, colors, reducedMotion }) {
  const S = tokens.scene;
  const n = cards.length;

  // ---- Renderers: WebGL for the world, CSS3D for crisp, accessible HTML cards ----
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  webglHost.appendChild(renderer.domElement);
  const cssRenderer = new CSS3DRenderer();
  cssHost.appendChild(cssRenderer.domElement);

  const scene = new THREE.Scene();
  const cssScene = new THREE.Scene();
  scene.background = new THREE.Color(S.fog.color);
  scene.fog = new THREE.Fog(S.fog.color, S.fog.near, S.fog.far);
  const camera = new THREE.PerspectiveCamera(S.camera.fov, 1, 0.1, 300);

  // ---- Glow: a bloom pass over the whole scene, and soft round sprites for every point ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), S.bloom.strength, S.bloom.radius, S.bloom.threshold);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const glow = glowTexture();

  // ---- The road: a smooth curve with one bend per event ----
  const segments = n + 1;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    points.push(new THREE.Vector3(
      Math.sin(i * S.path.wiggle) * S.path.swayX,
      Math.cos(i * S.path.wiggle * 0.7) * S.path.swayY,
      -i * S.path.spacing,
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const length = curve.getLength();
  const roadColor = new THREE.Color(S.road.color);

  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(800)),
    new THREE.LineBasicMaterial({ color: roadColor, transparent: true, opacity: S.road.opacity }),
  ));
  scene.add(new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(S.road.dots)),
    new THREE.PointsMaterial({ color: roadColor, size: S.road.dotSize, transparent: true, opacity: S.road.opacity * 1.5 }),
  ));

  // ---- Retro geometry: a wireframe floor under the road, and a few wireframe solids in space ----
  const floorY = -S.grid.depth;
  const gridSize = Math.ceil((length + 40) / S.grid.cell) * S.grid.cell;
  const grid = new THREE.GridHelper(gridSize, gridSize / S.grid.cell, S.grid.color, S.grid.color);
  grid.material.transparent = true;
  grid.material.opacity = S.grid.opacity;
  grid.position.set(0, floorY, -length / 2);
  scene.add(grid);

  const solids = [];
  const shapes = [
    new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0),
    new THREE.TetrahedronGeometry(1, 0), new THREE.BoxGeometry(1.4, 1.4, 1.4),
  ];
  for (let i = 0; i < S.solids.count; i++) {
    const t = (i + 0.5) / S.solids.count;
    const p = curve.getPointAt(t);
    const side = i % 2 ? 1 : -1;
    const mesh = new THREE.LineSegments(
      new THREE.EdgesGeometry(shapes[i % shapes.length]),
      new THREE.LineBasicMaterial({ color: S.solids.color, transparent: true, opacity: S.solids.opacity }),
    );
    mesh.position.set(p.x + side * (9 + Math.random() * 8), p.y + 2 + Math.random() * 6, p.z - Math.random() * 6);
    mesh.scale.setScalar(S.solids.size * (0.6 + Math.random() * 0.8));
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    scene.add(mesh);
    solids.push(mesh);
  }

  // ---- Stars around the road ----
  const stars = new Float32Array(S.stars.count * 3);
  for (let i = 0; i < S.stars.count; i++) {
    stars[i * 3] = (Math.random() - 0.5) * S.stars.spread * 2;
    stars[i * 3 + 1] = (Math.random() - 0.5) * S.stars.spread;
    stars[i * 3 + 2] = 15 - Math.random() * (length + 40);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: S.stars.color, size: S.stars.size, transparent: true, opacity: 0.7,
  })));

  // ---- Events: marker on the road, card beside it, a thin stem between them ----
  const tOf = (i) => (i + 1) / segments;   // where event i sits on the road, 0..1
  const focusOf = (i) => Math.max(0, tOf(i) - S.camera.distance / length);
  const rings = [];
  const cardObjs = [];

  cards.forEach((el, i) => {
    const t = tOf(i);
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3().crossVectors(tangent, UP).normalize();
    const color = new THREE.Color(colors[i] || S.road.color);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(S.marker.radius, 0.025, 8, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 }),
    );
    ring.position.copy(p);
    ring.lookAt(p.clone().add(tangent));
    scene.add(ring);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow, color, transparent: true, opacity: S.marker.halo, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    halo.position.copy(p);
    halo.scale.setScalar(S.marker.radius * 5);
    scene.add(halo);
    ring.userData.halo = halo;
    rings.push(ring);

    const cardPos = p.clone()
      .addScaledVector(side, (i % 2 ? 1 : -1) * S.card.offset)
      .addScaledVector(UP, S.card.height);
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([p, cardPos.clone().addScaledVector(UP, -1)]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 }),
    ));

    const obj = new CSS3DObject(el);
    obj.position.copy(cardPos);
    obj.scale.setScalar(S.card.scale);
    // Face the spot the camera stops at for this event.
    obj.lookAt(curve.getPointAt(focusOf(i)).addScaledVector(UP, S.camera.height));
    cssScene.add(obj);
    cardObjs.push({ el, t });
  });

  // ---- Pulses: small lights travelling down the road ----
  const pulseCount = reducedMotion ? 0 : S.pulses.count;
  const pulseT = Array.from({ length: pulseCount }, () => Math.random());
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pulseCount * 3), 3));
  scene.add(new THREE.Points(pulseGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: S.pulses.size, map: glow, transparent: true, depthWrite: false, opacity: 1,
    blending: THREE.AdditiveBlending,
  })));

  // ---- Camera state ----
  const min = 0, max = focusOf(n - 1);
  let progress = 0, target = focusOf(0), active = -1;
  const ease = reducedMotion ? 1 : S.camera.ease;
  const listeners = new Set();
  const clamp = (v) => Math.min(max, Math.max(min, v));

  function nearest() {
    let best = 0;
    for (let i = 1; i < n; i++) if (Math.abs(focusOf(i) - target) < Math.abs(focusOf(best) - target)) best = i;
    return best;
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    cssRenderer.setSize(w, h);
  }

  const look = new THREE.Vector3();
  let frame;
  function tick() {
    progress += (target - progress) * ease;
    if (Math.abs(target - progress) < 1e-5) progress = target;
    camera.position.copy(curve.getPointAt(progress)).addScaledVector(UP, S.camera.height);
    look.copy(curve.getPointAt(Math.min(1, progress + S.camera.lookAhead))).addScaledVector(UP, S.camera.height * 0.85);
    camera.lookAt(look);

    // Which event is the camera looking at?
    let now = 0;
    for (let i = 1; i < n; i++) if (Math.abs(focusOf(i) - progress) < Math.abs(focusOf(now) - progress)) now = i;
    if (now !== active) {
      active = now;
      rings.forEach((r, i) => {
        const on = i === active;
        r.material.opacity = on ? 1 : 0.45;
        r.scale.setScalar(on ? 1.35 : 1);
        r.userData.halo.material.opacity = on ? S.marker.halo * 2 : S.marker.halo;
      });
      listeners.forEach((fn) => fn(active));
    }

    // CSS3D has no fog: fade cards with distance, hide the ones already passed.
    for (const { el, t } of cardObjs) {
      const ahead = (t - progress) * length;
      const fade = ahead < 0 ? 0 : Math.max(0, Math.min(1, 1 - (ahead - S.camera.distance) / S.fog.far));
      el.style.setProperty('--fade', fade.toFixed(3));
      el.style.visibility = fade < 0.02 ? 'hidden' : '';
    }

    if (!reducedMotion) solids.forEach((m, i) => { m.rotation.y += 0.0015 * (i % 2 ? 1 : -1); m.rotation.x += 0.0008; });

    const pos = pulseGeo.attributes.position;
    for (let i = 0; i < pulseCount; i++) {
      pulseT[i] = (pulseT[i] + S.pulses.speed) % 1;
      const p = curve.getPointAt(pulseT[i]);
      // Hide a pulse while it passes right under the camera, where it would fill the screen.
      if (p.distanceTo(camera.position) < 4) p.y -= 1000;
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    pos.needsUpdate = true;

    composer.render();
    cssRenderer.render(cssScene, camera);
    frame = requestAnimationFrame(tick);
  }

  resize();
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    if (!document.hidden) frame = requestAnimationFrame(tick);
  });
  tick();

  return {
    goTo(i) { target = focusOf(Math.max(0, Math.min(n - 1, i))); },
    nudge(delta) { target = clamp(target + delta); },
    snap() { target = focusOf(nearest()); },
    get active() { return active; },
    onActive(fn) { listeners.add(fn); if (active >= 0) fn(active); },
  };
}

// A soft round dot, drawn once on a canvas: used for stars, road dots, pulses and halos.
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
