import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import giftModelUrl from "./assets/models/gift.glb?url";

import "./style.css";

import {
  makeModelRetro,
} from "./retro-renderer.js";

import {
  playGiftDrop,
} from "./animations.js";

import {
  normalizeModel,
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

makeModelRetro(
  gift.scene,
);

normalizeModel(
  gift.scene,
  2.5,
);

scene.add(
  gift.scene,
);

console.log(gift.scene);

gift.scene.traverse((object) => {
  if (!object.isMesh) return;

  const geometry = object.geometry;

  const vertices =
    geometry.attributes.position?.count ?? 0;

  const triangles = geometry.index
    ? geometry.index.count / 3
    : vertices / 3;

  const materials = Array.isArray(object.material)
    ? object.material
    : [object.material];

  console.log({
    name: object.name,
    type: object.type,
    vertices,
    triangles,
    materialCount: materials.length,
    materials: materials.map((material) => ({
      name: material.name,
      type: material.type,
      hasTexture: Boolean(material.map),
      color: material.color?.getHexString(),
    })),
  });
});

function printHierarchy(object, depth = 0) {
  const indent = "  ".repeat(depth);

  console.log(
    `${indent}${object.name || "(sans nom)"} [${object.type}]`
  );

  object.children.forEach((child) => {
    printHierarchy(child, depth + 1);
  });
}

printHierarchy(gift.scene);

gift.scene.traverse((object) => {
  if (!object.isMesh) return;

  const material = object.material;
  const texture = material.map;

  if (!texture) return;

  console.log({
    width: texture.image?.width,
    height: texture.image?.height,
    colorSpace: texture.colorSpace,
    magFilter: texture.magFilter,
    minFilter: texture.minFilter,
  });
});

// =====================================================
// ANIMATION INTRO
// =====================================================

playGiftDrop(
  gift.scene,
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