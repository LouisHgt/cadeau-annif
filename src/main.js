import * as THREE from "three";
import giftModelUrl from "./assets/models/gift-prepared.glb?url";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import "./style.css";

import {
  makeModelRetro,
} from "./retro-renderer.js";

import {
  playGiftDrop,
} from "./animations.js";

import {
  normalizeModel,
  getGiftParts,
} from "./utils.js";

// =====================================================
// SCÈNE
// =====================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(
  0x08070a,
);


// =====================================================
// CAMÉRA
// =====================================================

const camera =
  new THREE.PerspectiveCamera(
    42,
    4 / 3,
    0.1,
    100,
  );

camera.position.set(
  3.2,
  2.6,
  6,
);

camera.lookAt(
  0,
  0.9,
  0,
);


// =====================================================
// RENDERER
// =====================================================

const renderer =
  new THREE.WebGLRenderer({
    antialias: false,
  });

renderer.setPixelRatio(1);

renderer.setSize(
  320,
  240,
  false,
);

document
  .querySelector("#app")
  .appendChild(renderer.domElement);


// =====================================================
// ÉCLAIRAGE
// =====================================================

// Très peu d'éclairage volontairement.
// On ne veut pas un rendu PBR moderne.

const ambient =
  new THREE.AmbientLight(
    0x6f6680,
    1.2,
  );

scene.add(ambient);


const mainLight =
  new THREE.DirectionalLight(
    0xffd7aa,
    2.7,
  );

mainLight.position.set(
  3,
  5,
  4,
);

scene.add(mainLight);


// =====================================================
// SOL
// =====================================================

const floor =
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      20,
      20,
    ),

    new THREE.MeshLambertMaterial({
      color: 0x17131d,
    }),
  );

floor.rotation.x =
  -Math.PI / 2;

scene.add(floor);


// =====================================================
// CADEAU
// =====================================================

const loader = new GLTFLoader();

const gift = await loader.loadAsync(giftModelUrl);

const giftModel = gift.scene;

const giftParts = await getGiftParts(giftModel);

for (const [name, object] of Object.entries(giftParts)) {
  if (!object) {
    throw new Error(
      `Gift part "${name}" was not found in the GLB`
    );
  }
}


for (const [name, object] of Object.entries(giftParts)) {
  if (!object) {
    throw new Error(
      `Gift part "${name}" was not found in the GLB`
    );
  }
}

normalizeModel(
  giftModel,
  2.5,
);

makeModelRetro(
  giftModel
);

const giftRoot = new THREE.Group();

giftRoot.add(
  giftModel,
);

scene.add(
  giftRoot,
);
 
for (const object of Object.values(giftParts)) {
  object.userData.initialPosition =
    object.position.clone();

  object.userData.initialRotation =
    object.rotation.clone();

  object.userData.initialScale =
    object.scale.clone();
}

// =====================================================
// ANIMATION INTRO
// =====================================================

playGiftDrop(
  giftRoot,
);


// =====================================================
// DEBUG
// =====================================================

// R = rejouer la chute

window.addEventListener(
  "keydown",
  (event) => {
    if (event.code === "KeyR") {
      playGiftDrop(
        gift.scene,
      );
    }
  },
);


// =====================================================
// RENDER LOOP
// =====================================================

function render() {
  requestAnimationFrame(
    render,
  );

  renderer.render(
    scene,
    camera,
  );
}

render();