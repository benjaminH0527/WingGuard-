/* ============================================================
   WingGuard · scroll-driven migration GLOBE
   A 3D Earth is the centrepiece. As the visitor scrolls, a
   glowing flyway arc draws from Australia and a real bird
   traces it north — finally the camera dives into Shenzhen Bay.
   ============================================================ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const R = 2;                 // globe radius
const TEX = '/textures/';
const MODEL_URL = '/models/Stork.glb';

// key waypoints on the East Asian–Australasian Flyway (lat, lon)
const AU = { lat: -12.4, lon: 132.9 };  // Kakadu, Australia
const SZ = { lat: 22.52, lon: 114.06 }; // Shenzhen Bay

function llToVec(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}
function smoothstep(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

async function boot() {
  const mount = document.getElementById('globe');
  if (!mount) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 300);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;   // a touch darker / moodier
  mount.appendChild(renderer.domElement);

  /* ---------- lights (moody, but night side still readable) ---------- */
  scene.add(new THREE.AmbientLight(0x8296a6, 1.0));
  scene.add(new THREE.HemisphereLight(0xcfe0ee, 0x1a2530, 0.65));
  const sun = new THREE.DirectionalLight(0xfff4e2, 2.5);
  sun.position.set(-4, 2.5, 6);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xaac2d6, 0.7); // gently lifts the shadowed hemisphere
  fill.position.set(5, -1, 4);
  scene.add(fill);

  /* ---------- earth + oceans (4K + anisotropic filtering for sharpness) ---------- */
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const loader2D = new THREE.TextureLoader();
  function tex(name, srgb) { const t = loader2D.load(TEX + name); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; }
  const earthMap = tex('earth_day_4k.jpg', true);
  const specMap  = tex('earth_water_4k.png', false);
  const cloudMap = tex('earth_clouds_1024.png', true); // clouds stay soft — no need for 4K

  const globe = new THREE.Group();
  scene.add(globe);

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(R, 128, 128),
    new THREE.MeshPhongMaterial({
      map: earthMap, specularMap: specMap, specular: 0x3a5566, shininess: 18,
      emissive: 0xffffff, emissiveMap: earthMap, emissiveIntensity: 0.14 // keeps the night side readable
    })
  );
  globe.add(earth);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.012, 96, 96),
    new THREE.MeshPhongMaterial({ map: cloudMap, transparent: true, opacity: 0.45, depthWrite: false })
  );
  globe.add(clouds);

  /* ---------- atmosphere rim glow ---------- */
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.19, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(0x6fd8c6) } },
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 glowColor; varying vec3 vN; void main(){ float i = pow(0.62 - dot(vN, vec3(0.0,0.0,1.0)), 4.0); gl_FragColor = vec4(glowColor, 1.0) * clamp(i,0.0,1.0); }',
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    })
  );
  globe.add(atmosphere);

  /* ---------- starfield (round stars, two layers, gentle twinkle) ---------- */
  function dotTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.4, 'rgba(255,255,255,0.55)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(16, 16, 16, 0, Math.PI * 2); g.fill();
    return new THREE.CanvasTexture(c);
  }
  const starTex = dotTexture();
  const starField = new THREE.Group();
  scene.add(starField);
  function makeStars(count, size, color, opacity) {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(48 + Math.random() * 80);
      arr[i*3] = v.x; arr[i*3+1] = v.y; arr[i*3+2] = v.z;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const m = new THREE.PointsMaterial({ map: starTex, color, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
    const p = new THREE.Points(g, m); starField.add(p); return p;
  }
  makeStars(2400, 0.30, 0xcfe6ff, 0.55);   // dim dust
  const starBright = makeStars(460, 0.62, 0xffffff, 0.95); // bright twinklers

  /* ---------- flyway arc (great circle, lifted) ---------- */
  const dirAU = llToVec(AU.lat, AU.lon, 1);
  const dirSZ = llToVec(SZ.lat, SZ.lon, 1);
  const SEG = 160;
  const arcPts = [];
  for (let i = 0; i <= SEG; i++) {
    const u = i / SEG;
    const dir = new THREE.Vector3().copy(dirAU).lerp(dirSZ, u).normalize(); // approx great-circle
    const lift = R * (1 + 0.16 * Math.sin(Math.PI * u));
    arcPts.push(dir.multiplyScalar(lift));
  }
  const arcCurve = new THREE.CatmullRomCurve3(arcPts);
  const arcGeom = new THREE.BufferGeometry().setFromPoints(arcPts);
  const arcLine = new THREE.Line(arcGeom, new THREE.LineBasicMaterial({ color: 0xF0C674, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }));
  arcGeom.setDrawRange(0, 0);
  globe.add(arcLine);

  // soft ROUND glow texture — so sprites are dots, never white squares
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0.0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.5)');
    grd.addColorStop(1.0, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 32, 0, Math.PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const glowTex = glowTexture();

  function marker(dir, color, size) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.95 }));
    s.position.copy(dir.clone().multiplyScalar(R * 1.01));
    s.scale.setScalar(size);
    globe.add(s); return s;
  }
  marker(dirAU, 0xF0C674, 0.22);
  const szMarker = marker(dirSZ, 0x7FE9D6, 0.26);

  // soft warm glow riding just behind the bird
  const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xFFE7B0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 }));
  head.scale.setScalar(0.3);
  globe.add(head);

  /* ---------- the real bird on the arc ---------- */
  const birdRoot = new THREE.Group();
  const birdPivot = new THREE.Group();
  birdPivot.rotation.y = Math.PI / 2; // Stork nose (+Z) → pivot +X
  birdRoot.add(birdPivot);
  birdRoot.visible = false;
  globe.add(birdRoot);
  let mixer = null;

  new GLTFLoader().load(MODEL_URL, (gltf) => {
    const m = gltf.scene;
    const box = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3(); box.getSize(size);
    const c = new THREE.Vector3(); box.getCenter(c);
    const s = 0.75 / Math.max(size.x, size.y, size.z); // larger — reads clearly as a bird
    m.scale.setScalar(s);
    m.position.sub(c.multiplyScalar(s));
    m.traverse(o => {
      if (o.isMesh) {
        o.frustumCulled = false;
        if (o.material) {
          o.material.side = THREE.DoubleSide;
          if ('emissive' in o.material) { o.material.emissive = new THREE.Color(0x556673); o.material.emissiveIntensity = 0.5; }
          o.material.needsUpdate = true;
        }
      }
    });
    birdPivot.add(m);
    if (gltf.animations?.length) { mixer = new THREE.AnimationMixer(m); mixer.clipAction(gltf.animations[0]).play(); }
  });

  /* ---------- camera framing ---------- */
  const midDir = new THREE.Vector3().copy(dirAU).lerp(dirSZ, 0.5).normalize();
  const overviewPos = midDir.clone().multiplyScalar(R * 3.0).add(new THREE.Vector3(0, R * 0.35, 0));
  const szPoint = dirSZ.clone().multiplyScalar(R);
  const closeupPos = dirSZ.clone().multiplyScalar(R * 1.72).add(dirSZ.clone().cross(new THREE.Vector3(0,1,0)).normalize().multiplyScalar(0.18));
  const tmpTarget = new THREE.Vector3();

  /* ---------- scroll progress ---------- */
  let targetT = 0, curT = 0;
  const read = () => { targetT = Math.min(scrollY / (innerHeight * 3.6), 1); };
  read();
  addEventListener('scroll', read, { passive: true });
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  const caption = document.getElementById('skyCaption');
  const STAGES = [
    [0.00, '澳大利亚 · 卡卡杜湿地 — 迁徙起点'],
    [0.30, '跨越赤道 · 印度尼西亚群岛'],
    [0.55, '中南半岛 · 湿地补给驿站'],
    [0.78, '南海之滨 · 逼近深圳湾'],
    [0.94, '深圳湾 · 万里归途的终点'],
  ];
  let lastStage = -1;
  function setCaption(frac) {
    let idx = 0;
    for (let i = 0; i < STAGES.length; i++) if (frac >= STAGES[i][0]) idx = i;
    if (idx !== lastStage && caption) {
      caption.style.opacity = '0';
      setTimeout(() => { caption.textContent = STAGES[idx][1]; caption.style.opacity = '1'; }, 260);
      lastStage = idx;
    }
  }

  const clock = new THREE.Clock();
  const xAxis = new THREE.Vector3(1, 0, 0);
  const q = new THREE.Quaternion();
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), fwd = new THREE.Vector3();

  function render() {
    const dt = clock.getDelta();
    curT += (targetT - curT) * 0.07;
    const t = curT;
    if (mixer) mixer.update(dt);

    clouds.rotation.y += dt * 0.008;
    atmosphere.rotation.y += dt * 0.004;

    // living starfield: slow drift + gentle twinkle
    starField.rotation.y += dt * 0.006;
    starBright.material.opacity = 0.72 + Math.sin(clock.elapsedTime * 1.6) * 0.22;

    // arc draw + bird along path (migration over the first 40% of scroll)
    const draw = Math.min(t / 0.40, 1);
    arcGeom.setDrawRange(0, Math.floor((SEG + 1) * draw));
    const headU = Math.max(0.0001, Math.min(draw, 0.999));
    arcCurve.getPointAt(headU, pA);
    head.position.copy(pA);
    head.material.opacity = draw > 0.001 && draw < 0.999 ? 0.9 : 0.0;

    if (birdRoot.visible || draw > 0.02) {
      birdRoot.visible = true;
      arcCurve.getPointAt(headU, pA);
      arcCurve.getPointAt(Math.min(headU + 0.01, 1), pB);
      birdRoot.position.copy(pA);
      fwd.subVectors(pB, pA).normalize();
      q.setFromUnitVectors(xAxis, fwd);
      birdRoot.quaternion.slerp(q, 0.3);
      if (draw >= 0.999) birdRoot.visible = false; // landed
    }

    // pulse the Shenzhen marker
    szMarker.scale.setScalar(0.16 + Math.sin(clock.elapsedTime * 2) * 0.03);

    // camera: overview → dive into Shenzhen Bay
    const zoom = smoothstep(0.40, 0.64, t);
    camera.position.copy(overviewPos).lerp(closeupPos, zoom);
    tmpTarget.copy(new THREE.Vector3(0, 0, 0)).lerp(szPoint, zoom);
    camera.lookAt(tmpTarget);
    camera.fov = 42 - 9 * zoom;
    camera.updateProjectionMatrix();

    setCaption(draw);
    renderer.render(scene, camera);
    if (!REDUCED) requestAnimationFrame(render);
  }

  if (REDUCED) { curT = 0; render(); }
  else render();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
