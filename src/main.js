import * as THREE from "three";
import giftModelUrl from "./assets/models/gift-prepared.glb?url";
import cakeModelUrl from "./assets/models/cake-prepared.glb?url";
import flameTextureUrl from "./assets/models/flames.gif?url";
import characterModelUrl from "./assets/models/character.glb?url";
import danceModelUrl from "./assets/models/dance.glb?url";
import faceTextureUrl from "./assets/models/crane.png?url";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import "./style.css";

import {
  makeModelRetro,
  createRetroComposer,
} from "./retro-renderer.js";

import {
  createRetroFloorTexture,
} from "./floor.js";

import {
  playGiftDrop,
  playGiftWiggle,
  playLidFall,
  playBoxOpen,
  playCakeReveal,
} from "./animations.js";

import {
  normalizeModel,
  getGiftParts,
} from "./utils.js";

import {
  createRibbonInteraction,
} from "./interactions.js";

import {
  createCakeFlames,
} from "./cake-flames.js";

import {
  createWishDialog,
} from "./wish-dialog.js";

import {
  createCandleInteraction,
} from "./candle-interaction.js";

import {
  createConfetti,
} from "./confetti.js";

import {
  createDancingCharacter,
} from "./dancing-character.js";

import {
  playFallingSound,
  playOpeningSound,
  getOpeningSoundDuration,
  fadeInBackgroundSound,
} from "./audio.js";

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

const floorTexture = createRetroFloorTexture();

const floor =
  new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshLambertMaterial({
      map: floorTexture,
      color: 0xffffff,
    }),
  );

floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.001;

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

console.log(
  "===== STRUCTURE CAKE ====="
);

cakeModel.traverse(
  (object) => {
    console.log(
      object.name,
      object.type
    );
  }
);


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


// -----------------------------------------------------
// Centre du fond de la boîte
// -----------------------------------------------------

const boxCenterLocal =
  giftRoot.worldToLocal(
    boxCenterWorld.clone()
  );


// Position du dessus du fond de la boîte
const boxTopWorld =
  new THREE.Vector3(
    boxCenterWorld.x,
    boxBounds.max.y,
    boxCenterWorld.z,
  );

const boxTopLocal =
  giftRoot.worldToLocal(
    boxTopWorld
  );


// -----------------------------------------------------
// Recentrage du modèle du gâteau
// -----------------------------------------------------

cakeModel.position.x -=
  scaledCakeCenter.x;

cakeModel.position.z -=
  scaledCakeCenter.z;

/*
  On place le point le plus bas du gâteau
  exactement sur y = 0 de cakeRoot.
*/
cakeModel.position.y -=
  scaledCakeBounds.min.y;


const cakeFlames =
  await createCakeFlames({
    cakeModel,
    textureUrl:
      flameTextureUrl,
  });


// -----------------------------------------------------
// Position finale du gâteau
// -----------------------------------------------------

cakeRoot.position.set(
  boxCenterLocal.x,

  boxTopLocal.y + 0.025,

  boxCenterLocal.z,
);


const confetti =
  createConfetti({
    scene,
  });

const dancingCharacter =
  await createDancingCharacter({
    scene,
    camera,
    loader,
    characterUrl:
      characterModelUrl,
    danceUrl:
      danceModelUrl,
    faceTextureUrl,
  });

const confettiOrigin =
  new THREE.Vector3();

const candleInteraction =
  createCandleInteraction({
    cakeModel,
    camera,
    canvas:
      renderer.domElement,
    flameController:
      cakeFlames,

    onComplete() {
      confettiOrigin.set(
        0,
        0.28,
        0,
      );

      cakeModel.localToWorld(
        confettiOrigin
      );

      confetti.burst(
        confettiOrigin
      );

      dancingCharacter.show(
        cakeModel
      );
    },
  });

const wishDialog =
  createWishDialog({
    element:
      document.querySelector(
        "[data-wish-dialog]"
      ),

    onComplete() {
      candleInteraction.enable();
    },
  });


 

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

    /*
    onProgress(progress) {
      console.log(
        "Ribbon:",
        progress.toFixed(2)
      );
    },
    */

    onComplete() {
      console.log(
        "Ruban entièrement tiré !"
      );

      playOpeningSound();

      const wiggleTimeline =
        playGiftWiggle(
          giftRoot,
          getOpeningSoundDuration() - 2000,
        );

      wiggleTimeline.eventCallback(
        "onComplete",
        () => {
          fadeInBackgroundSound();

          const lidTimeline =
            playLidFall({
              lid:
                giftParts.lid,

              ribbonLid:
                giftParts.ribbonLid,

              bow:
                giftParts.bow,

              pullTail:
                giftParts.pullTail,

              scene,

              camera,
            });

          lidTimeline.eventCallback(
            "onComplete",
            () => {
              const boxTimeline =
                playBoxOpen({
                  box:
                    giftParts.box,

                  boxFront:
                    giftParts.boxFront,

                  boxBack:
                    giftParts.boxBack,

                  boxLeft:
                    giftParts.boxLeft,

                  boxRight:
                    giftParts.boxRight,

                  ribbonFront:
                    giftParts.ribbonFront,

                  ribbonBack:
                    giftParts.ribbonBack,

                  ribbonLeft:
                    giftParts.ribbonLeft,

                  ribbonRight:
                    giftParts.ribbonRight,
                });

              boxTimeline.eventCallback(
                "onComplete",
                () => {
                  const cakeTimeline =
                    playCakeReveal(
                      cakeRoot
                    );

                  cakeTimeline.eventCallback(
                    "onComplete",
                    () => {
                      wishDialog.show({
                        delay: 400,
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
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

introTimeline.pause(0);


introTimeline.eventCallback(
  "onComplete",
  () => {
    ribbonInteraction.enable();

    console.log(
      "Ribbon interaction enabled"
    );
  }
);

const startScreen =
  document.querySelector(
    "[data-start-screen]"
  );

const startButton =
  document.querySelector(
    "[data-start-button]"
  );

if (!startScreen || !startButton) {
  throw new Error(
    "The start screen is missing from index.html"
  );
}

let hasStarted = false;

startButton.textContent =
  "[ COMMENCER ▶ ]";

startButton.disabled = false;

startButton.addEventListener(
  "click",
  () => {
    hasStarted = true;
    startButton.disabled = true;

    playFallingSound();
    introTimeline.play(0);

    startScreen.classList.add(
      "is-leaving"
    );

    startScreen.setAttribute(
      "aria-hidden",
      "true",
    );

    window.setTimeout(
      () => {
        startScreen.hidden = true;
      },
      180,
    );
  },
  {
    once: true,
  },
);

startButton.focus({
  preventScroll: true,
});

// =====================================================
// DEBUG
// =====================================================


window.addEventListener(
  "keydown",
  (event) => {
    if (
      event.target instanceof HTMLInputElement
      || event.target instanceof HTMLTextAreaElement
      || event.target?.isContentEditable
    ) {
      return;
    }

    if (!hasStarted) {
      return;
    }

    if (event.code === "KeyR") {
      ribbonInteraction.disable();
      ribbonInteraction.reset();
      wishDialog.reset();
      candleInteraction.reset();
      confetti.reset();
      dancingCharacter.reset();

      playFallingSound();

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

function render(time = 0) {
  requestAnimationFrame(
    render,
  );

  cakeFlames.update(
    time * 0.001
  );

  confetti.update(
    time * 0.001
  );

  dancingCharacter.update(
    time * 0.001
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
