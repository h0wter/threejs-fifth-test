import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
// import GUI from "lil-gui";

/**
 * Debug
 */
// const gui = new GUI();

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
let activeMesh = null;

//Editor
const propertiesContainer = document.querySelector(".properties");
const modelInput = document.querySelector("#file");
const envMapInput = document.querySelector("#env");
const colorContainer = document.querySelector(".color");
const colorInput = document.querySelector("#color");
const opacityContainer = document.querySelector(".opacity");
const opacityInput = document.querySelector("#opacity");
const metalnessContainer = document.querySelector(".metalness");
const metalnessInput = document.querySelector("#metalness");
const roughnessContainer = document.querySelector(".roughness");
const roughnessInput = document.querySelector("#roughness");
const mapContainer = document.querySelector(".map");
const mapInput = document.querySelector("#map");
const normalMapContainer = document.querySelector(".normalMap");
const normalMapInput = document.querySelector("#normalMap");
const envMaterialMapContainer = document.querySelector(".envMap");
const envMaterialMapInput = document.querySelector("#envMap");
let boxHelper = null;

const addModel = (gltf) => {
  // const mesh = gltf.scene.children[0];
  const mesh = gltf.scene;

  scene.add(mesh);
  // showHelper(mesh);
  objectsToIntersect.push(mesh);
};

const showHelper = (object) => {
  if (boxHelper) {
    removeHelper();
  }

  if (object) {
    boxHelper = new THREE.BoxHelper(object);
    scene.add(boxHelper);
    transformControls.attach(object);
  }
};

const removeHelper = () => {
  if (boxHelper) {
    scene.remove(boxHelper);
    boxHelper.dispose();
    boxHelper = null;
  }
  transformControls.detach();
};

const addProperties = (object) => {
  if (!object) {
    propertiesContainer.classList.add("hidden");

    return;
  }

  const { color, opacity, metalness, roughness, map, normalMap, envMap } =
    object.material;

  propertiesContainer.classList.remove("hidden");

  if (color !== undefined) {
    colorContainer.classList.remove("hidden");
  } else {
    colorContainer.classList.add("hidden");
  }

  if (opacity !== undefined) {
    opacityContainer.classList.remove("hidden");
    opacityInput.value = opacity;
  } else {
    opacityContainer.classList.add("hidden");
  }

  if (metalness !== undefined) {
    metalnessContainer.classList.remove("hidden");
    metalnessInput.value = metalness;
  } else {
    metalnessContainer.classList.add("hidden");
  }

  if (roughness !== undefined) {
    roughnessContainer.classList.remove("hidden");
    roughnessInput.value = roughness;
  } else {
    roughnessContainer.classList.add("hidden");
  }

  if (map !== undefined) {
    mapContainer.classList.remove("hidden");
  } else {
    mapContainer.classList.add("hidden");
  }

  if (normalMap !== undefined) {
    normalMapContainer.classList.remove("hidden");
  } else {
    normalMapContainer.classList.add("hidden");
  }

  if (envMap !== undefined) {
    envMaterialMapContainer.classList.remove("hidden");
  } else {
    envMaterialMapContainer.classList.add("hidden");
  }
};

colorInput.addEventListener("input", (e) => {
  if (activeMesh) {
    activeMesh.material.color.set(e.target.value);
  }
});

opacityInput.addEventListener("input", (e) => {
  if (activeMesh) {
    // activeMesh.material.format = THREE.RGBAFormat;
    // activeMesh.material.transparent = true;
    activeMesh.material.opacity = e.target.value;
  }
});

metalnessInput.addEventListener("input", (e) => {
  if (activeMesh) {
    activeMesh.material.metalness = e.target.value;
  }
});

roughnessInput.addEventListener("input", (e) => {
  if (activeMesh) {
    activeMesh.material.roughness = e.target.value;
  }
});

mapInput.addEventListener("input", (e) => {
  const textureFile = e.target.files[0];

  if (textureFile && activeMesh) {
    const mapTexture = textureLoader.load(URL.createObjectURL(textureFile));
    activeMesh.material.map = mapTexture;
    activeMesh.material.needsUpdate = true;
  }
});

normalMapInput.addEventListener("input", (e) => {
  const textureFile = e.target.files[0];

  if (textureFile && activeMesh) {
    const normalTexture = textureLoader.load(URL.createObjectURL(textureFile));
    activeMesh.material.normalMap = normalTexture;
    activeMesh.material.needsUpdate = true;
  }
});

const setEnvMap = (object) => (event) => {
  const textureFile = event.target.files[0];
  const nameArray = textureFile.name.split(".");

  if (textureFile && nameArray[nameArray.length - 1] === "jpg") {
    const envMap = textureLoader.load(URL.createObjectURL(textureFile));
    envMap.colorSpace = THREE.SRGBColorSpace;

    envMap.mapping = THREE.EquirectangularReflectionMapping;

    if (object.type === "Mesh") {
      object.material.envMap = envMap;
    } else {
      object.background = envMap;
      object.environment = envMap;
    }
  } else if (textureFile && nameArray[nameArray.length - 1] === "hdr") {
    rgbeLoader.load(URL.createObjectURL(textureFile), (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      object.background = texture;
      object.environment = texture;
    });
  }
};

envMapInput.addEventListener("input", setEnvMap(scene));

envMaterialMapInput.addEventListener("input", (e) => {
  setEnvMap(activeMesh)(e);
});

//Sidebar
const gltfLoader = new GLTFLoader();

modelInput.addEventListener("input", (e) => {
  const file = modelInput.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const contents = event.target.result;

      gltfLoader.parse(contents, "", addModel);
    };

    reader.readAsArrayBuffer(file);
  } else {
    showHelper();
  }
});

//Raycasting
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const objectsToIntersect = [];

const handleCanvasClick = (e) => {
  pointer.x = (e.clientX / canvas.width) * 2 - 1;
  pointer.y = -(e.clientY / canvas.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(objectsToIntersect);

  if (intersects.length > 0) {
    activeMesh = intersects[0].object;
    showHelper(activeMesh);
    addProperties(activeMesh);
  } else {
    activeMesh = null;
    removeHelper();
    addProperties();
  }
};

canvas.addEventListener("click", handleCanvasClick);

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const rgbeLoader = new RGBELoader();

/**
 * Floor
 */

const material = new THREE.MeshStandardMaterial({
  color: "#777777",
  transparent: true,
  envMapIntensity: 0.5,
});

const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), material);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
// scene.add(floor);
scene.add(new THREE.GridHelper(30, 20, 0x888888, 0x444444));

const sphere = new THREE.Mesh(new THREE.SphereGeometry(2, 30, 30), material);
sphere.castShadow = true;
sphere.position.set(5, 2, 0);
scene.add(sphere);

const box = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshBasicMaterial({
    color: "#777777",
    transparent: true,
    opacity: 0.5,
  })
);
box.position.set(-5, 1, 0);
scene.add(box);
objectsToIntersect.push(box);
// objectsToIntersect.push(floor);
objectsToIntersect.push(sphere);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth - 250,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(1, 3, 10);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const transformControls = new TransformControls(camera, canvas);
scene.add(transformControls);

transformControls.addEventListener("change", () => {
  // boxHelper.update();
  renderer.render(scene, camera);
});

transformControls.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value;
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
