import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const sceneElement = document.getElementById("scene");
const oldCell = document.getElementById("cell");

if (!sceneElement || !oldCell) {
  console.error("CELL INVASION: Required scene elements not found.");
} else {
  oldCell.style.visibility = "hidden";

  const canvas = document.createElement("canvas");
  canvas.id = "cell3D";
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:3;cursor:grab;touch-action:pan-y;";
  sceneElement.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  const light = new THREE.PointLight(0x63eee0, 35, 20);
  light.position.set(4, 5, 6);
  scene.add(light);

  const purpleLight = new THREE.PointLight(0xa47bff, 25, 15);
  purpleLight.position.set(-4, -3, 3);
  scene.add(purpleLight);

  const cellGroup = new THREE.Group();
  scene.add(cellGroup);

  // Transparent 3D cell membrane
  const membrane = new THREE.Mesh(
    new THREE.SphereGeometry(2.25, 64, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x51dcca,
      transparent: true,
      opacity: 0.13,
      roughness: 0.2,
      metalness: 0.05,
      transmission: 0.2,
      side: THREE.DoubleSide
    })
  );
  cellGroup.add(membrane);

  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(2.27, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0x63eee0,
      wireframe: true,
      transparent: true,
      opacity: 0.13
    })
  );
  cellGroup.add(wire);

  // Nucleus
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 48, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x9870f5,
      emissive: 0x321568,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.1
    })
  );
  nucleus.position.set(0, 0, 0.25);
  nucleus.userData.name = "Nucleus";
  cellGroup.add(nucleus);

  const nucleusGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.84, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xa47bff,
      transparent: true,
      opacity: 0.12,
      wireframe: true
    })
  );
  nucleusGlow.position.copy(nucleus.position);
  cellGroup.add(nucleusGlow);

  // Mitochondria
  const mitochondria = [];

  function makeMito(x, y, z, rotation) {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 32, 24),
      new THREE.MeshStandardMaterial({
        color: 0xff956b,
        roughness: 0.35,
        emissive: 0x542015
      })
    );
    body.scale.set(1.5, 0.65, 0.7);
    group.add(body);

    const inner = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.035, 8, 32),
      new THREE.MeshStandardMaterial({color: 0xffd19b})
    );
    inner.scale.set(1.15, 0.6, 1);
    group.add(inner);

    group.position.set(x, y, z);
    group.rotation.z = rotation;
    group.userData.name = "Mitochondrion";
    cellGroup.add(group);
    mitochondria.push(group);
  }

  makeMito(-1.25, 0.75, 0.35, 0.5);
  makeMito(1.25, -0.9, 0.1, -0.6);
  makeMito(-0.85, -1.35, -0.4, 0.9);

  // Golgi apparatus
  const golgi = new THREE.Group();

  for (let i = 0; i < 5; i++) {
    const layer = new THREE.Mesh(
      new THREE.TorusGeometry(0.38 + i * 0.045, 0.055, 12, 40),
      new THREE.MeshStandardMaterial({
        color: 0x52cce9,
        emissive: 0x103b58
      })
    );
    layer.rotation.x = Math.PI / 2.7;
    layer.position.y = i * 0.13;
    golgi.add(layer);
  }

  golgi.position.set(-1.1, -0.55, 0.65);
  golgi.userData.name = "Golgi apparatus";
  cellGroup.add(golgi);

  // Ribosomes
  const ribosomes = [];
  const ribosomeMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6a8ff,
    emissive: 0x7144a5,
    emissiveIntensity: 0.6
  });

  for (let i = 0; i < 22; i++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 12),
      ribosomeMaterial
    );

    const angle = i * 2.399;
    const radius = 0.9 + (i % 4) * 0.25;

    ball.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      Math.sin(i * 2.1) * 0.8
    );

    ball.userData.name = "Ribosome";
    cellGroup.add(ball);
    ribosomes.push(ball);
  }

  // Floating cytoplasm particles
  const particles = [];

  for (let i = 0; i < 45; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.025 + Math.random() * 0.025, 8, 8),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x63eee0 : 0xa47bff,
        transparent: true,
        opacity: 0.7
      })
    );

    particle.position.set(
      (Math.random() - 0.5) * 3.7,
      (Math.random() - 0.5) * 3.7,
      (Math.random() - 0.5) * 3
    );

    cellGroup.add(particle);
    particles.push(particle);
  }

  // DNA double helix inside nucleus
  const dnaGroup = new THREE.Group();
  const dnaMaterials = [
    new THREE.MeshStandardMaterial({color: 0x63eee0, emissive: 0x155b59}),
    new THREE.MeshStandardMaterial({color: 0xa47bff, emissive: 0x38205f})
  ];

  for (let i = 0; i < 34; i++) {
    const y = -0.7 + i * 0.043;
    const angle = i * 0.55;
    const radius = 0.18;

    const a = new THREE.Vector3(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );

    const b = new THREE.Vector3(
      Math.cos(angle + Math.PI) * radius,
      y,
      Math.sin(angle + Math.PI) * radius
    );

    for (const [point, material] of [
      [a, dnaMaterials[0]],
      [b, dnaMaterials[1]]
    ]) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 10, 10),
        material
      );
      sphere.position.copy(point);
      dnaGroup.add(sphere);
    }

    const direction = new THREE.Vector3().subVectors(b, a);
    const rung = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, direction.length(), 6),
      new THREE.MeshStandardMaterial({color: 0xd6eaff})
    );

    rung.position.copy(a).add(b).multiplyScalar(0.5);
    rung.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    dnaGroup.add(rung);
  }

  // CINEMATIC DNA COSMIC CORE
  const cosmicCore = new THREE.Group();
  const orbitRings = [];

  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.95 + i * 0.12, 0.012, 8, 100),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x63eee0 : 0xa47bff,
        transparent: true,
        opacity: 0.65
      })
    );

    ring.rotation.set(
      Math.PI / 2 + i * 0.45,
      i * 0.7,
      i * 0.35
    );

    cosmicCore.add(ring);
    orbitRings.push(ring);
  }

  // Molecular star field
  const cosmicParticles = [];

  for (let i = 0; i < 120; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.012 + Math.random() * 0.025, 8, 8),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xffffff : (i % 2 ? 0x63eee0 : 0xa47bff),
        transparent: true,
        opacity: 0.8
      })
    );

    const angle = Math.random() * Math.PI * 2;
    const radius = 0.65 + Math.random() * 0.9;

    particle.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 2.4,
      Math.sin(angle) * radius
    );

    cosmicCore.add(particle);
    cosmicParticles.push(particle);
  }

  const coreLight = new THREE.PointLight(0x63eee0, 3, 5);
  coreLight.position.set(0, 0, 0.5);
  cosmicCore.add(coreLight);

  cosmicCore.position.set(0, 0, 0.25);
  cosmicCore.visible = false;
  cellGroup.add(cosmicCore);
  dnaGroup.position.set(0, 0, 0.25);
  dnaGroup.visible = false;
  cellGroup.add(dnaGroup);

  // LIVING CELL ANIMATION UPGRADE

  // Moving 3D transport vesicles
  const vesicles = [];

  for (let i = 0; i < 12; i++) {
    const vesicle = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 20, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0x63eee0,
        emissive: 0x126b70,
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.15
      })
    );

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 20, 16),
      new THREE.MeshBasicMaterial({
        color: 0xa47bff,
        transparent: true,
        opacity: 0.22,
        wireframe: true
      })
    );

    vesicle.add(core);
    vesicle.add(shell);
    cellGroup.add(vesicle);

    vesicles.push({
      group: vesicle,
      phase: i * (Math.PI * 2 / 12),
      radius: 1.35 + (i % 3) * 0.18,
      speed: 0.35 + (i % 4) * 0.09,
      height: Math.sin(i * 2) * 0.75
    });
  }

  // Soft membrane glow
  const membraneGlow = new THREE.Mesh(
    new THREE.SphereGeometry(2.30, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0x63eee0,
      transparent: true,
      opacity: 0.045,
      wireframe: true
    })
  );

  cellGroup.add(membraneGlow);

  // End of living cell animation upgrade
  // ADVANCED CELL SYSTEMS

  // Endoplasmic Reticulum: branching membrane network
  const erGroup = new THREE.Group();

  const erMaterial = new THREE.MeshStandardMaterial({
    color: 0x48a9d8,
    emissive: 0x123c68,
    emissiveIntensity: 0.8,
    roughness: 0.3
  });

  for (let i = 0; i < 7; i++) {
    const points = [];

    for (let j = 0; j < 18; j++) {
      const t = j / 17;
      const angle = t * Math.PI * 2 + i * 0.85;

      points.push(new THREE.Vector3(
        Math.cos(angle) * (0.85 + i * 0.045),
        Math.sin(angle * 1.7 + i) * 0.55,
        Math.sin(angle) * (0.85 + i * 0.045)
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points);

    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.025, 8, false),
      erMaterial
    );

    erGroup.add(tube);
  }

  erGroup.position.set(0, 0, 0.15);
  erGroup.userData.name = "Endoplasmic Reticulum";
  cellGroup.add(erGroup);

  // Lysosomes
  const lysosomes = [];

  for (let i = 0; i < 5; i++) {
    const lysosome = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 24, 20),
      new THREE.MeshPhysicalMaterial({
        color: 0xb879ff,
        emissive: 0x5720a0,
        emissiveIntensity: 1.1,
        roughness: 0.25,
        transparent: true,
        opacity: 0.9
      })
    );

    const angle = i * Math.PI * 0.4;

    lysosome.position.set(
      Math.cos(angle) * 1.35,
      Math.sin(angle) * 1.1,
      Math.sin(i * 2) * 0.5
    );

    lysosome.userData.name = "Lysosome";
    cellGroup.add(lysosome);
    lysosomes.push(lysosome);
  }

  // Cell membrane receptors
  const receptors = [];

  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI * 2 / 10;
    const direction = new THREE.Vector3(
      Math.cos(angle),
      Math.sin(angle),
      Math.sin(i * 1.7) * 0.35
    ).normalize();

    const receptor = new THREE.Group();

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 0.22, 12),
      new THREE.MeshStandardMaterial({
        color: 0x63eee0,
        emissive: 0x17665d
      })
    );

    stem.position.y = 0.08;
    receptor.add(stem);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xa47bff,
        emissive: 0x5420a0,
        emissiveIntensity: 1
      })
    );

    head.position.y = 0.21;
    receptor.add(head);

    receptor.position.copy(direction.clone().multiplyScalar(2.18));
    receptor.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    );

    receptor.userData.name = "Cell Membrane Receptor";
    cellGroup.add(receptor);
    receptors.push(receptor);
  }

  // Signal transmission waves
  const signalWaves = [];

  for (let i = 0; i < 3; i++) {
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.012, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0x63eee0,
        transparent: true,
        opacity: 0.65
      })
    );

    wave.position.set(0, 0, 0.4);
    wave.visible = false;
    cellGroup.add(wave);
    signalWaves.push(wave);
  }

  // End of advanced cell systems
  // Mouse interaction and rotation
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let dragging = false;
  let previousX = 0;
  let previousY = 0;
  let rotationX = 0;
  let rotationY = 0;
  let targetCameraZ = 8;

  canvas.addEventListener("pointerdown", event => {
    dragging = true;
    previousX = event.clientX;
    previousY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", event => {
    if (dragging) {
      rotationY += (event.clientX - previousX) * 0.008;
      rotationX += (event.clientY - previousY) * 0.008;
      rotationX = Math.max(-1.1, Math.min(1.1, rotationX));
      previousX = event.clientX;
      previousY = event.clientY;
    }
  });

  function stopDrag() {
    dragging = false;
    canvas.style.cursor = "grab";
  }

  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);

  canvas.addEventListener("click", event => {
    const rect = canvas.getBoundingClientRect();

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(cellGroup.children, true);

    if (hits.length) {
      let object = hits[0].object;

      while (object && !object.userData.name && object.parent !== cellGroup) {
        object = object.parent;
      }

      const name = object?.userData.name;

      if (name && typeof window.explore === "function") {
        window.explore(name);
      }
    }
  });

  // Connect existing nucleus button
  const enterButton = document.getElementById("enterBtn");

  if (enterButton) {
    enterButton.addEventListener("click", () => {
      const entering = enterButton.textContent.includes("ENTER");

      if (entering) {
        targetCameraZ = 3.8;
        dnaGroup.visible = true;
        cosmicCore.visible = true;
        nucleusGlow.visible = false;
      } else {
        targetCameraZ = 8;
        dnaGroup.visible = false;
        cosmicCore.visible = false;
        nucleusGlow.visible = true;
      }
    });
  }

  const resetButton = document.getElementById("resetBtn");

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      targetCameraZ = 8;
      rotationX = 0;
      rotationY = 0;
      dnaGroup.visible = false;
      nucleusGlow.visible = true;
    });
  }

  function resize() {
    const width = sceneElement.clientWidth;
    const height = sceneElement.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  new ResizeObserver(resize).observe(sceneElement);
  resize();

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    cellGroup.rotation.y += dragging ? 0 : 0.0015;
    cellGroup.rotation.y += (rotationY - cellGroup.rotation.y) * 0.025;
    cellGroup.rotation.x += (rotationX - cellGroup.rotation.x) * 0.025;

    mitochondria.forEach((item, i) => {
      item.rotation.y = time * 0.35 + i;
      item.position.y += Math.sin(time * 1.2 + i) * 0.0008;
    });

    particles.forEach((item, i) => {
      item.position.y += Math.sin(time + i) * 0.0005;
    });

    dnaGroup.rotation.y = time * 0.5;
    cosmicCore.rotation.y = time * 0.18;
    cosmicCore.rotation.z = Math.sin(time * 0.4) * 0.12;
    orbitRings.forEach((ring, i) => {
      ring.rotation.z += 0.003 * (i + 1);
    });
    cosmicParticles.forEach((p, i) => {
      p.position.y += Math.sin(time + i) * 0.0008;
    });
    coreLight.intensity = 2.5 + Math.sin(time * 2) * 1.2;

    // Breathing cell membrane
    const breath = 1 + Math.sin(time * 1.4) * 0.018;
    membrane.scale.setScalar(breath);
    membraneGlow.scale.setScalar(breath * 1.025);

    // Mitochondrial energy pulses
    mitochondria.forEach((item, i) => {
      const pulse = 1 + Math.sin(time * 2.5 + i * 2) * 0.045;
      item.scale.setScalar(pulse);
    });

    // Vesicles travelling through the cytoplasm
    vesicles.forEach((v, i) => {
      const angle = time * v.speed + v.phase;

      v.group.position.set(
        Math.cos(angle) * v.radius,
        Math.sin(angle * 0.8) * 0.8 + v.height * 0.25,
        Math.sin(angle) * v.radius * 0.65
      );

      const pulse = 1 + Math.sin(time * 3 + i) * 0.18;
      v.group.scale.setScalar(pulse);
      v.group.rotation.y = angle;
    });
    // ER gentle movement
    erGroup.rotation.y = Math.sin(time * 0.25) * 0.08;
    erGroup.rotation.z = Math.sin(time * 0.35) * 0.035;

    // Lysosome pulsing
    lysosomes.forEach((item, i) => {
      const pulse = 1 + Math.sin(time * 2.2 + i) * 0.12;
      item.scale.setScalar(pulse);
    });

    // Receptor glow animation
    receptors.forEach((item, i) => {
      item.children[1].material.emissiveIntensity =
        0.6 + (Math.sin(time * 2 + i) + 1) * 0.7;
    });

    // Expanding signal waves
    signalWaves.forEach((wave, i) => {
      const phase = (time * 0.45 + i / 3) % 1;
      wave.visible = true;
      wave.scale.setScalar(0.5 + phase * 4);
      wave.material.opacity = 0.55 * (1 - phase);
      wave.rotation.z = time * 0.15 + i;
    });
    nucleusGlow.scale.setScalar(1 + Math.sin(time * 2) * 0.025);

    camera.position.z += (targetCameraZ - camera.position.z) * 0.035;

    renderer.render(scene, camera);
  }

  animate();

  console.log("CELL INVASION 3D: Three.js simulation initialized.");
}



