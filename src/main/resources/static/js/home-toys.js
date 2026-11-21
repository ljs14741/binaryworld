// 홈 첫 화면 3D 장난감. 서비스마다 장난감 하나씩 떠다니고, 누르면 그 서비스로 감
const stage = document.getElementById('bw-stage');
const canvas = document.getElementById('bw-toys');
const label = document.getElementById('bw-toy-label');
const hint = document.getElementById('bw-hero-hint');

const TOYS = [
  { key: 'vote', label: '익명 투표 →', href: 'https://vote.binaryworld.kr', color: '#3b82f6' },
  { key: 'game', label: '미니게임 →', href: 'https://game.binaryworld.kr', color: '#f8fafc' },
  { key: 'star', label: '별말씀 →', href: 'https://star.binaryworld.kr', color: '#fbbf24', newTab: true },
  { key: 'heart', label: '무료 청첩장 →', href: 'https://wedding.binaryworld.kr', color: '#f43f5e', newTab: true },
  { key: 'donut', label: '점심 메뉴 추천 →', href: 'https://food.binaryworld.kr', color: '#e9b27c' },
  { key: 'quiz', label: '상식 테스트 →', href: 'https://quiz.binaryworld.kr', color: '#8b5cf6' },
  { key: 'face', label: 'AI 외모 평가 →', href: 'https://face.binaryworld.kr', color: '#facc15' },
  { key: 'pin', label: '짝꿍지도 →', href: 'https://map.binaryworld.kr', color: '#ef4444' },
];

function fallback() {
  stage.classList.add('is-fallback');
  if (hint) hint.hidden = true;
}

function webglOk() {
  try {
    const test = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (test.getContext('webgl2') || test.getContext('webgl')));
  } catch {
    return false;
  }
}

async function start() {
  if (!stage || !canvas || !webglOk()) {
    fallback();
    return;
  }

  let THREE, RoundedBoxGeometry, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js'));
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (err) {
    console.error(err);
    fallback();
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 폰·저사양은 가볍게 그림 (해상도·재질·장식 줄임)
  const lowEnd = window.matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const maxRatio = Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2);
  let pixelRatio = maxRatio;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowEnd, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    console.error(err);
    fallback();
    return;
  }
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 8);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const world = new THREE.Group();
  scene.add(world);

  // ---------- 재질 ----------
  // 저사양은 코팅(clearcoat) 없는 가벼운 재질
  const Plastic = lowEnd ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial;
  function plastic(color, extra = {}) {
    if (lowEnd) {
      delete extra.clearcoat;
      delete extra.clearcoatRoughness;
      return new Plastic({ color, roughness: 0.3, metalness: 0, ...extra });
    }
    return new Plastic({
      color,
      roughness: 0.32,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      ...extra,
    });
  }
  const dark = plastic('#1f2430', { roughness: 0.5, clearcoat: 0.4 });
  const white = plastic('#fbfbf8');

  // ---------- 장난감 모양 ----------
  function centered(geo) {
    geo.computeBoundingBox();
    const c = new THREE.Vector3();
    geo.boundingBox.getCenter(c);
    geo.translate(-c.x, -c.y, -c.z);
    return geo;
  }

  const builders = {
    // 주사위
    game(t) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new RoundedBoxGeometry(1.15, 1.15, 1.15, 5, 0.2), plastic(t.color)));
      const pip = new THREE.SphereGeometry(0.1, 16, 12);
      const red = plastic('#ef4444');
      const h = 0.575;
      const d = 0.28;
      const faces = [
        { n: 1, pos: (u, v) => [u, v, h] },
        { n: 6, pos: (u, v) => [u, v, -h] },
        { n: 2, pos: (u, v) => [h, u, v] },
        { n: 5, pos: (u, v) => [-h, u, v] },
        { n: 3, pos: (u, v) => [u, h, v] },
        { n: 4, pos: (u, v) => [u, -h, v] },
      ];
      const layouts = {
        1: [[0, 0]],
        2: [[-d, -d], [d, d]],
        3: [[-d, -d], [0, 0], [d, d]],
        4: [[-d, -d], [d, -d], [-d, d], [d, d]],
        5: [[-d, -d], [d, -d], [0, 0], [-d, d], [d, d]],
        6: [[-d, -d], [-d, 0], [-d, d], [d, -d], [d, 0], [d, d]],
      };
      faces.forEach(({ n, pos }) => {
        layouts[n].forEach(([u, v]) => {
          const m = new THREE.Mesh(pip, n === 1 ? red : dark);
          m.position.set(...pos(u, v));
          if (n === 1) m.scale.setScalar(1.6);
          g.add(m);
        });
      });
      return g;
    },

    // 별
    star(t) {
      const s = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 0.85 : 0.38;
        const a = Math.PI / 2 + (i * Math.PI) / 5;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      }
      s.closePath();
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 6 });
      return new THREE.Mesh(centered(geo), plastic(t.color, { emissive: '#7a4a00', emissiveIntensity: 0.15 }));
    },

    // 하트
    heart(t) {
      const s = new THREE.Shape();
      s.moveTo(0, -0.75);
      s.bezierCurveTo(-0.25, -0.5, -0.9, -0.2, -0.9, 0.25);
      s.bezierCurveTo(-0.9, 0.62, -0.62, 0.82, -0.42, 0.82);
      s.bezierCurveTo(-0.2, 0.82, -0.05, 0.68, 0, 0.55);
      s.bezierCurveTo(0.05, 0.68, 0.2, 0.82, 0.42, 0.82);
      s.bezierCurveTo(0.62, 0.82, 0.9, 0.62, 0.9, 0.25);
      s.bezierCurveTo(0.9, -0.2, 0.25, -0.5, 0, -0.75);
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.12, bevelSegments: 8, curveSegments: 24 });
      return new THREE.Mesh(centered(geo), plastic(t.color));
    },

    // 지도 핀
    pin(t) {
      const g = new THREE.Group();
      // 위는 둥글고 아래는 뾰족한 물방울 단면
      const pts = [new THREE.Vector2(0.0001, -0.9)];
      const from = THREE.MathUtils.degToRad(-48);
      for (let i = 0; i <= 28; i++) {
        const a = from + (i / 28) * (Math.PI / 2 - from);
        pts.push(new THREE.Vector2(Math.max(0.55 * Math.cos(a), 0.0001), 0.3 + 0.55 * Math.sin(a)));
      }
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), plastic(t.color));
      g.add(body);
      const hole = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), white);
      hole.position.set(0, 0.32, 0.42);
      g.add(hole);
      return g;
    },

    // 투표함
    vote(t) {
      const g = new THREE.Group();
      const box = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.95, 0.95, 5, 0.14), plastic(t.color));
      box.position.y = -0.2;
      g.add(box);
      const slot = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.06, 0.14, 2, 0.03), dark);
      slot.position.set(0, 0.28, 0);
      g.add(slot);
      const paper = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.62, 0.03, 2, 0.015), white);
      paper.position.set(0, 0.55, 0);
      paper.rotation.z = 0.08;
      g.add(paper);
      const tick = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 20, Math.PI * 0.9), plastic('#10b981'));
      tick.position.set(0, 0.6, 0.03);
      tick.rotation.z = Math.PI * 1.15;
      g.add(tick);
      return g;
    },

    // 도넛
    donut(t) {
      const g = new THREE.Group();
      const dough = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.25, 24, 48), plastic(t.color, { clearcoat: 0.3, roughness: 0.6 }));
      g.add(dough);
      const icing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.24, 24, 48), plastic('#f472b6'));
      icing.scale.set(1.02, 1.02, 0.62);
      icing.position.z = 0.09;
      g.add(icing);
      const sprinkleGeo = new THREE.CapsuleGeometry(0.025, 0.09, 4, 8);
      const colors = ['#fde047', '#38bdf8', '#ffffff', '#4ade80'];
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2 + (i % 3) * 0.2;
        const r = 0.48 + ((i * 37) % 7 - 3) * 0.045;
        const s = new THREE.Mesh(sprinkleGeo, plastic(colors[i % colors.length]));
        s.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.25);
        s.rotation.z = i * 1.7;
        s.rotation.x = Math.PI / 2;
        g.add(s);
      }
      return g;
    },

    // 물음표
    quiz(t) {
      const g = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.42, 0.45, 0),
        new THREE.Vector3(-0.3, 0.78, 0),
        new THREE.Vector3(0, 0.9, 0),
        new THREE.Vector3(0.34, 0.76, 0),
        new THREE.Vector3(0.4, 0.45, 0),
        new THREE.Vector3(0.18, 0.18, 0),
        new THREE.Vector3(0.02, 0.0, 0),
        new THREE.Vector3(0.0, -0.22, 0),
      ]);
      const mat = plastic(t.color);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.14, 16, false), mat));
      const capA = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), mat);
      capA.position.set(-0.42, 0.45, 0);
      const capB = capA.clone();
      capB.position.set(0, -0.22, 0);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), mat);
      dot.position.set(0, -0.62, 0);
      g.add(capA, capB, dot);
      g.position.y = -0.05;
      const wrap = new THREE.Group();
      wrap.add(g);
      return wrap;
    },

    // 웃는 얼굴
    face(t) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.66, 40, 28), plastic(t.color)));
      const eyeGeo = new THREE.CapsuleGeometry(0.06, 0.1, 4, 10);
      [-0.22, 0.22].forEach((x) => {
        const eye = new THREE.Mesh(eyeGeo, dark);
        eye.position.set(x, 0.14, 0.62);
        g.add(eye);
      });
      const smile = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 10, 32, Math.PI), dark);
      smile.rotation.z = Math.PI;
      smile.position.set(0, -0.04, 0.6);
      g.add(smile);
      const blush = plastic('#fb7185', { transparent: true, opacity: 0.7 });
      [-0.42, 0.42].forEach((x) => {
        const b = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), blush);
        b.position.set(x, -0.08, 0.53);
        b.lookAt(x * 3, -0.24, 3);
        g.add(b);
      });
      return g;
    },
  };

  // ---------- 장난감 배치 ----------
  const toys = TOYS.map((t, i) => {
    const mesh = builders[t.key](t);
    const holder = new THREE.Group();
    holder.add(mesh);
    holder.traverse((o) => { o.userData.toy = i; });
    world.add(holder);
    return {
      ...t,
      holder,
      mesh,
      base: new THREE.Vector3(),
      offset: new THREE.Vector3(),
      spin: new THREE.Vector3(0.15 + (i % 3) * 0.08, 0.35 + (i % 4) * 0.07, 0.05),
      phase: i * 1.37,
      wobble: !['game', 'donut'].includes(t.key),
      twirl: 0,
      hover: 0,
      pop: 0,
      appear: 0,
    };
  });

  // 장식용 쇠구슬·동전 (누를 수 없음)
  const chrome = new THREE.MeshStandardMaterial({ color: '#dfe6ee', metalness: 1, roughness: 0.12 });
  const gold = new THREE.MeshStandardMaterial({ color: '#f5b941', metalness: 1, roughness: 0.25 });
  const coinGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.06, 40);
  const ballGeo = new THREE.SphereGeometry(1, 32, 20);
  const bits = [];
  for (let i = 0; i < (lowEnd ? 5 : 9); i++) {
    const isCoin = i % 3 === 0;
    const m = new THREE.Mesh(isCoin ? coinGeo : ballGeo, isCoin ? gold : chrome);
    if (!isCoin) m.scale.setScalar(0.1 + (i % 4) * 0.05);
    world.add(m);
    bits.push({ m, seed: i * 2.11, base: new THREE.Vector3() });
  }

  let isMobile = false;

  function layout() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfW = halfH * camera.aspect;
    isMobile = w <= 760;

    // 데스크톱은 오른쪽 절반, 모바일은 가운데
    const cx = isMobile ? 0 : halfW * 0.42;
    const rx = isMobile ? Math.min(halfW * 0.7, 3.2) : Math.min(halfW * 0.4, 3.6);
    const ry = Math.min(halfH * 0.62, isMobile ? 2.1 : 2.7);
    const s = isMobile ? THREE.MathUtils.clamp(rx / 2.6, 0.7, 1) : THREE.MathUtils.clamp(ry / 2.5, 0.8, 1.15);

    toys.forEach((toy, i) => {
      if (i === 0) {
        toy.base.set(cx, isMobile ? 0 : 0.1, 0.8);
      } else {
        const a = ((i - 1) / (toys.length - 1)) * Math.PI * 2 + 0.55;
        toy.base.set(cx + Math.cos(a) * rx, Math.sin(a) * ry, ((i * 53) % 5) * 0.25 - 0.5);
      }
      toy.scale = s;
    });

    bits.forEach((b, i) => {
      const a = b.seed * 1.9;
      b.base.set(cx + Math.cos(a) * rx * (0.55 + (i % 3) * 0.35), Math.sin(a * 1.3) * ry * 1.05, -1.5 - (i % 3));
    });
  }

  // ---------- 마우스·터치 ----------
  const pointer = new THREE.Vector2(9, 9);
  const parallax = new THREE.Vector2();
  const pointerWorld = new THREE.Vector3(999, 999, 0);
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  let hovered = -1;

  function setPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, pointerWorld);
    const hits = raycaster.intersectObjects(toys.map((t) => t.holder), true);
    return hits.length ? hits[0].object.userData.toy : -1;
  }

  // 글자 위에서는 캔버스가 아니라 전체 영역 기준으로 시차만 줌
  window.addEventListener('pointermove', (event) => {
    parallax.set(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  const hero = stage.closest('.bw-hero');
  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    setPointer(event);
    const next = pick();
    if (next !== hovered) {
      hovered = next;
      hero.style.cursor = hovered >= 0 ? 'pointer' : '';
      label.classList.toggle('is-on', hovered >= 0);
      if (hovered >= 0) label.textContent = toys[hovered].label;
    }
  });

  hero.addEventListener('pointerleave', () => {
    pointer.set(9, 9);
    pointerWorld.set(999, 999, 0);
    hovered = -1;
    hero.style.cursor = '';
    label.classList.remove('is-on');
  });

  hero.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) return;
    setPointer(event);
    const idx = pick();
    if (idx < 0) return;
    const toy = toys[idx];
    toy.pop = 1;
    if (typeof gtag === 'function') {
      gtag('event', 'home_toy_click', { toy: toy.key });
    }
    // 터치는 한 번 눌러 이름 보여주고, 한 번 더 누르면 이동
    if (event.pointerType && event.pointerType !== 'mouse' && hovered !== idx) {
      hovered = idx;
      label.textContent = toy.label;
      label.classList.add('is-on');
      return;
    }
    setTimeout(() => {
      if (toy.newTab) {
        window.open(toy.href, '_blank', 'noopener');
      } else {
        window.location.href = toy.href;
      }
    }, 220);
  });

  // ---------- 그리기 ----------
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  let running = false;
  let visible = true;
  let introStart = -1;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);

    const raw = clock.getDelta();
    const dt = Math.min(raw, 0.05);
    adaptQuality(raw);
    const t = clock.elapsedTime;
    if (introStart < 0) introStart = t;
    const motion = reduceMotion ? 0 : 1;

    world.rotation.y += ((parallax.x * 0.35) * motion - world.rotation.y) * 0.05;
    world.rotation.x += ((parallax.y * 0.2) * motion - world.rotation.x) * 0.05;

    toys.forEach((toy, i) => {
      // 차례로 튀어나옴
      const since = t - introStart - i * 0.09;
      const targetAppear = reduceMotion || since > 0 ? 1 : 0;
      toy.appear += (targetAppear - toy.appear) * (reduceMotion ? 1 : 0.09);
      const elastic = toy.appear >= 0.999 ? 1 : 1 - Math.pow(1 - toy.appear, 3) * Math.cos(toy.appear * 9);

      // 마우스 근처면 살짝 밀려남
      tmp.copy(toy.base).sub(pointerWorld);
      tmp.z = 0;
      const dist = tmp.length();
      const push = dist < 2.4 && i !== hovered ? (2.4 - dist) * 0.22 * motion : 0;
      tmp.normalize().multiplyScalar(push);
      toy.offset.lerp(tmp, 0.08);

      const target = i === hovered ? 1 : 0;
      toy.hover += (target - toy.hover) * 0.15;
      toy.pop *= 0.88;

      const h = toy.holder;
      h.position.set(
        toy.base.x + toy.offset.x,
        toy.base.y + toy.offset.y + Math.sin(t * 0.9 + toy.phase) * 0.18 * motion,
        toy.base.z + toy.hover * 0.8
      );
      h.scale.setScalar(toy.scale * elastic * (1 + toy.hover * 0.22 + toy.pop * 0.3));

      const speed = (1 + toy.hover * 3) * motion;
      if (toy.wobble) {
        // 납작한 건 앞면이 보이게 좌우로만 흔들림, 올리면 한 바퀴 돎
        toy.twirl += (toy.hover > 0.5 ? dt * 6 : 0) * motion;
        if (toy.hover <= 0.5) toy.twirl += (Math.round(toy.twirl / (Math.PI * 2)) * Math.PI * 2 - toy.twirl) * 0.08;
        toy.mesh.rotation.y = Math.sin(t * 0.8 + toy.phase) * 0.55 * motion + toy.twirl;
        toy.mesh.rotation.x = Math.sin(t * 0.55 + toy.phase) * 0.18 * motion;
      } else {
        toy.mesh.rotation.x += toy.spin.x * dt * speed;
        toy.mesh.rotation.y += toy.spin.y * dt * speed;
      }
      toy.mesh.rotation.z = Math.sin(t * 0.6 + toy.phase) * 0.2 * motion;
    });

    bits.forEach((b) => {
      b.m.position.set(
        b.base.x + Math.sin(t * 0.5 + b.seed) * 0.3 * motion,
        b.base.y + Math.cos(t * 0.7 + b.seed) * 0.25 * motion,
        b.base.z
      );
      b.m.rotation.x = t * 0.8 + b.seed;
      b.m.rotation.y = t * 0.5;
    });

    // 이름표를 장난감 위에 붙임
    if (hovered >= 0) {
      const toy = toys[hovered];
      tmp.copy(toy.holder.position);
      tmp.y += 0.7 * toy.scale;
      world.localToWorld(tmp);
      tmp.project(camera);
      label.style.left = ((tmp.x + 1) / 2) * stage.clientWidth + 'px';
      label.style.top = ((1 - tmp.y) / 2) * stage.clientHeight + 'px';
    }

    renderer.render(scene, camera);
  }

  // 60프레임 평균이 느리면(45fps 미만) 해상도를 한 단계씩 낮춤 (최저 1배)
  let slowSum = 0;
  let slowCount = 0;
  function adaptQuality(delta) {
    if (delta <= 0 || delta > 0.5) return;
    slowSum += delta;
    slowCount++;
    if (slowCount < 60) return;
    const avg = slowSum / slowCount;
    slowSum = 0;
    slowCount = 0;
    if (avg > 1 / 45 && pixelRatio > 1) {
      pixelRatio = Math.max(1, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      layout();
    }
  }

  function updateRunning() {
    const next = visible && !document.hidden;
    if (next && !running) {
      running = true;
      clock.getDelta();
      frame();
    } else if (!next) {
      running = false;
    }
  }

  // 테마 바뀌면 빛 세기만 맞춤
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    renderer.toneMappingExposure = isDark ? 0.95 : 1.05;
    key.intensity = isDark ? 1.9 : 1.6;
  }
  const themeLink = document.getElementById('theme-style');
  applyTheme(themeLink && (themeLink.getAttribute('href') || '').includes('dark') ? 'dark' : 'light');
  document.addEventListener('bw:theme-change', (event) => applyTheme(event.detail && event.detail.theme));

  layout();
  new ResizeObserver(layout).observe(stage);

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    updateRunning();
  }).observe(stage);
  document.addEventListener('visibilitychange', updateRunning);

  if (hint && window.matchMedia('(hover: none)').matches) {
    hint.textContent = '장난감을 눌러 보세요';
  }

  // 보여 주기 전에 셰이더를 미리 만들어 첫 프레임 멈칫을 줄임
  try {
    renderer.compile(scene, camera);
  } catch {
    // ignore
  }
  stage.classList.add('is-ready');
  updateRunning();
}

start();
