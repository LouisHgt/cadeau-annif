import * as THREE from "three";
import giftModelUrl from "./assets/models/gift-prepared.glb?url";
import cakeModelUrl from "./assets/models/cake.glb?url";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import "./style.css";

import {
  makeModelRetro,
  createRetroComposer,
} from "./retro-renderer.js";

import {
  playGiftDrop,
  playLidFall,
} from "./animations.js";

import {
  normalizeModel,
  getGiftParts,
} from "./utils.js";

import {
  createRibbonInteraction,
} from "./interactions.js";

const SHOWCASE_Y_ROTATION =
  Math.PI * 0.35;

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
    40,
    4 / 3,
    0.1,
    100,
  );

camera.position.set(
  3.3,
  4.8,
  5.2,
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


normalizeModel(
  giftModel,
  2.5,
);

makeModelRetro(
  giftModel
);

giftModel.traverse((object) => {
  if (!object.isMesh) return;

  const materials =
    Array.isArray(object.material)
      ? object.material
      : [object.material];

  for (const material of materials) {
    material.side =
      THREE.DoubleSide;

    material.needsUpdate = true;
  }
});

const giftRoot = new THREE.Group();

giftRoot.add(
  giftModel,
);

scene.add(
  giftRoot,
);

// =====================================================
// GÂTEAU
// =====================================================

const cake =
  await loader.loadAsync(
    cakeModelUrl
  );

const cakeModel =
  cake.scene;

makeModelRetro(
  cakeModel
);


// -----------------------------------------------------
// Dimensions de la boîte
// -----------------------------------------------------

giftRoot.updateMatrixWorld(true);

const boxBounds =
  new THREE.Box3()
    .setFromObject(
      giftParts.box
    );

const boxSize =
  boxBounds.getSize(
    new THREE.Vector3()
  );

const boxCenterWorld =
  boxBounds.getCenter(
    new THREE.Vector3()
  );


// -----------------------------------------------------
// Dimensions originales du gâteau
// -----------------------------------------------------

const cakeBounds =
  new THREE.Box3()
    .setFromObject(
      cakeModel
    );

const cakeSize =
  cakeBounds.getSize(
    new THREE.Vector3()
  );


// -----------------------------------------------------
// Taille du gâteau
//
// On lui donne environ 65 % de la largeur
// disponible dans la boîte.
// -----------------------------------------------------

const targetCakeWidth =
  Math.min(
    boxSize.x,
    boxSize.z
  ) * 0.65;

const cakeScale =
  targetCakeWidth /
  Math.max(
    cakeSize.x,
    cakeSize.z
  );

cakeModel.scale.setScalar(
  cakeScale
);


// Recalcul après scale
const scaledCakeBounds =
  new THREE.Box3()
    .setFromObject(
      cakeModel
    );

const scaledCakeCenter =
  scaledCakeBounds.getCenter(
    new THREE.Vector3()
  );


// -----------------------------------------------------
// Root du gâteau
// -----------------------------------------------------

const cakeRoot =
  new THREE.Group();

cakeRoot.add(
  cakeModel
);

giftRoot.add(
  cakeRoot
);


// Centre de la boîte dans l'espace du giftRoot
const boxCenterLocal =
  giftRoot.worldToLocal(
    boxCenterWorld.clone()
  );


// Centre horizontalement le gâteau
cakeModel.position.x -=
  scaledCakeCenter.x;

cakeModel.position.z -=
  scaledCakeCenter.z;


// Pour l'instant on le place en position FINALE
// volontairement visible au-dessus de la boîte.

cakeRoot.position.set(
  boxCenterLocal.x,
  boxBounds.max.y + 0.25,
  boxCenterLocal.z,
);
 

const ribbonInteraction =
  createRibbonInteraction({
    camera,

    canvas:
      renderer.domElement,

    pullTail:
      giftParts.pullTail,

    bow:
      giftParts.bow,

    maxPullDistance:
      1.2,

    onProgress(progress) {
      console.log(
        "Ribbon:",
        progress.toFixed(2)
      );
    },

    onComplete() {
      console.log(
        "Ruban entièrement tiré !"
      );

      playLidFall({
        lid: giftParts.lid,
        ribbonLid: giftParts.ribbonLid,
        bow: giftParts.bow,
        pullTail: giftParts.pullTail,
        scene,
        camera,
      });
    },
  });

// =====================================================
// ANIMATION INTRO
// =====================================================

const introTimeline =
  playGiftDrop(
    giftRoot,
    {
      finalYRotation:
        SHOWCASE_Y_ROTATION,
    }
  );


introTimeline.eventCallback(
  "onComplete",
  () => {
    ribbonInteraction.enable();

    console.log(
      "Ribbon interaction enabled"
    );
  }
);

// =====================================================
// DEBUG
// =====================================================


window.addEventListener(
  "keydown",
  (event) => {

    if (event.code === "KeyR") {
      ribbonInteraction.disable();
      ribbonInteraction.reset();

      const introTimeline =
        playGiftDrop(
          giftRoot,
          {
            finalYRotation:
              SHOWCASE_Y_ROTATION,
          }
        );

      introTimeline.eventCallback(
        "onComplete",
        () => {
          ribbonInteraction.enable();
        }
      );
    }


    if (event.code === "KeyD") {
      const uniform =
        ditherPass.material.uniforms
          .uDitherStrength;

      uniform.value =
        uniform.value > 0
          ? 0
          : 0.30;

      console.log(
        "Dithering:",
        uniform.value > 0
      );
    }


    if (event.code === "KeyQ") {
      ditherPass.enabled =
        !ditherPass.enabled;

      console.log(
        "PS1 color pass:",
        ditherPass.enabled
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

  composer.render();
}

const {
  composer,
  ditherPass,
} = createRetroComposer(
  renderer,
  scene,
  camera,
);

render();