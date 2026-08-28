import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  4/3,
  0.1,
  100
);

camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({
  antialias: false
});

renderer.setSize(320, 240, false);
renderer.setPixelRatio(1);

document.querySelector("#app").appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(3, 5, 4);
scene.add(directionalLight);

const loader = new GLTFLoader();

try {
  const gift = await loader.loadAsync("/assets/models/gift.glb");
  makeModelRetro(gift.scene);
  scene.add(gift.scene);
} catch (error) {
  console.error("Error loading the model:", error);
}

function render() {
  requestAnimationFrame(render);

  renderer.render(scene, camera);
}

render();