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

  dnaGroup.position.set(0, 0, 0.25);
  dnaGroup.visible = false;
  cellGroup.add(dnaGroup);

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
        nucleusGlow.visible = false;
      } else {
        targetCameraZ = 8;
        dnaGroup.visible = false;
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

    nucleusGlow.scale.setScalar(1 + Math.sin(time * 2) * 0.025);

    camera.position.z += (targetCameraZ - camera.position.z) * 0.035;

    renderer.render(scene, camera);
  }

  animate();

  console.log("CELL INVASION 3D: Three.js simulation initialized.");
}
