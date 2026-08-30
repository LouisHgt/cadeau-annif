import * as THREE from "three";
import { gsap } from "gsap";
import {
  retargetClip,
} from "three/examples/jsm/utils/SkeletonUtils.js";

import {
  makeModelRetro,
  makeTextureRetro,
} from "./retro-renderer.js";


const TARGET_HEIGHT = 1.65;

const FACE_WIDTH = 1.2;
const FACE_ASPECT = 1206 / 1102;

const BONE_NAMES = {
  LowerTorso:
    "mixamorigHips",

  LeftUpperLeg:
    "mixamorigLeftUpLeg",

  LeftLowerLeg:
    "mixamorigLeftLeg",

  LeftFoot:
    "mixamorigLeftFoot",

  RightUpperLeg:
    "mixamorigRightUpLeg",

  RightLowerLeg:
    "mixamorigRightLeg",

  RightFoot:
    "mixamorigRightFoot",

  UpperTorso:
    "mixamorigSpine2",

  Head:
    "mixamorigHead",

  LeftUpperArm:
    "mixamorigLeftArm",

  LeftLowerArm:
    "mixamorigLeftForeArm",

  LeftHand:
    "mixamorigLeftHand",

  RightUpperArm:
    "mixamorigRightArm",

  RightLowerArm:
    "mixamorigRightForeArm",

  RightHand:
    "mixamorigRightHand",
};


function findSkinnedMesh(model) {
  let skinnedMesh = null;

  model.traverse((object) => {
    if (
      !skinnedMesh
      && object.isSkinnedMesh
    ) {
      skinnedMesh = object;
    }
  });

  return skinnedMesh;
}


function getCharacterBounds(model) {
  const bounds =
    new THREE.Box3();

  model.updateMatrixWorld(true);

  model.traverse((object) => {
    if (
      !object.isSkinnedMesh
      || !object.name.endsWith("_Geo")
    ) {
      return;
    }

    bounds.union(
      new THREE.Box3()
        .setFromObject(
          object,
          true,
        )
    );
  });

  return bounds;
}


function normalizeCharacter(model) {
  let bounds =
    getCharacterBounds(model);

  if (bounds.isEmpty()) {
    bounds =
      new THREE.Box3()
        .setFromObject(
          model,
          true,
        );
  }

  const size =
    bounds.getSize(
      new THREE.Vector3()
    );

  model.scale.setScalar(
    TARGET_HEIGHT / size.y
  );

  bounds =
    getCharacterBounds(model);

  const center =
    bounds.getCenter(
      new THREE.Vector3()
    );

  model.position.x -=
    center.x;

  model.position.y -=
    bounds.min.y;

  model.position.z -=
    center.z;
}


function hideRigHelpers(model) {
  model.traverse((object) => {
    if (
      object.name.endsWith("_Att")
      || object.name.endsWith("_OuterCage")
    ) {
      object.visible = false;
    }

    if (object.isSkinnedMesh) {
      object.frustumCulled = false;
    }
  });
}


function attachFaceSprite({
  head,
  texture,
}) {
  texture.colorSpace =
    THREE.SRGBColorSpace;

  makeTextureRetro(
    texture
  );

  const material =
    new THREE.SpriteMaterial({
      map:
        texture,

      transparent:
        true,

      depthWrite:
        false,

      toneMapped:
        false,
    });

  const sprite =
    new THREE.Sprite(
      material
    );

  sprite.name =
    "CraneFaceSprite";

  sprite.position.set(
    0,
    0.59,
    0.64,
  );

  sprite.scale.set(
    FACE_WIDTH,
    FACE_WIDTH / FACE_ASPECT,
    1,
  );

  sprite.renderOrder = 12;

  head.add(
    sprite
  );

  return sprite;
}


function createRetargetedDance({
  characterModel,
  danceModel,
  sourceClip,
}) {
  const targetMesh =
    characterModel.getObjectByName(
      "Head_Geo"
    )
    ?? findSkinnedMesh(
      characterModel
    );

  const sourceMesh =
    findSkinnedMesh(
      danceModel
    );

  if (!targetMesh) {
    throw new Error(
      "No skinned mesh was found in character.glb"
    );
  }

  if (!sourceMesh) {
    throw new Error(
      "No skinned mesh was found in dance.glb"
    );
  }

  if (!sourceClip) {
    throw new Error(
      "No animation clip was found in dance.glb"
    );
  }

  const clip =
    retargetClip(
      targetMesh,
      sourceMesh,
      sourceClip,
      {
        names:
          BONE_NAMES,

        hip:
          "mixamorigHips",

        hipInfluence:
          new THREE.Vector3(
            0,
            1,
            0,
          ),

        useFirstFramePosition:
          true,

        preserveBonePositions:
          true,
      }
    );

  clip.name =
    "DanceRetargeted";

  if (clip.tracks.length === 0) {
    throw new Error(
      "The dance could not be retargeted to the character"
    );
  }

  targetMesh.skeleton.pose();
  characterModel.updateMatrixWorld(true);

  return {
    targetMesh,
    clip,
  };
}


export async function createDancingCharacter({
  scene,
  camera,
  loader,
  characterUrl,
  danceUrl,
  faceTextureUrl,
}) {
  const textureLoader =
    new THREE.TextureLoader();

  const [
    character,
    dance,
    faceTexture,
  ] =
    await Promise.all([
      loader.loadAsync(
        characterUrl
      ),

      loader.loadAsync(
        danceUrl
      ),

      textureLoader.loadAsync(
        faceTextureUrl
      ),
    ]);

  const characterModel =
    character.scene;

  hideRigHelpers(
    characterModel
  );

  normalizeCharacter(
    characterModel
  );

  makeModelRetro(
    characterModel
  );

  const head =
    characterModel.getObjectByName(
      "Head"
    );

  if (!head?.isBone) {
    throw new Error(
      'The bone "Head" was not found in character.glb'
    );
  }

  attachFaceSprite({
    head,
    texture:
      faceTexture,
  });

  const {
    targetMesh,
    clip,
  } =
    createRetargetedDance({
      characterModel,
      danceModel:
        dance.scene,
      sourceClip:
        dance.animations[0],
    });

  const root =
    new THREE.Group();

  root.name =
    "DancingCharacter";

  root.visible = false;

  root.add(
    characterModel
  );

  scene.add(
    root
  );

  const mixer =
    new THREE.AnimationMixer(
      targetMesh
    );

  const action =
    mixer.clipAction(
      clip
    );

  action.setLoop(
    THREE.LoopRepeat,
    Infinity,
  );

  const anchorPosition =
    new THREE.Vector3();

  const cameraRight =
    new THREE.Vector3();

  const towardCamera =
    new THREE.Vector3();

  let active = false;
  let previousTime = null;


  function placeAtCake(anchor) {
    anchor.updateWorldMatrix(
      true,
      false,
    );

    anchor.getWorldPosition(
      anchorPosition
    );

    camera.updateMatrixWorld(true);

    cameraRight
      .setFromMatrixColumn(
        camera.matrixWorld,
        0,
      )
      .setY(0)
      .normalize();

    towardCamera
      .subVectors(
        camera.position,
        anchorPosition,
      )
      .setY(0)
      .normalize();

    root.position
      .copy(anchorPosition)
      .addScaledVector(
        cameraRight,
        1.45,
      )
      .addScaledVector(
        towardCamera,
        0.35,
      );

    root.position.y = 0;

    root.rotation.set(
      0,
      Math.atan2(
        camera.position.x
          - root.position.x,

        camera.position.z
          - root.position.z,
      ),
      0,
    );
  }


  function show(anchor) {
    placeAtCake(
      anchor
    );

    gsap.killTweensOf(
      root.scale
    );

    root.scale.setScalar(
      0.01
    );

    root.visible = true;
    active = true;
    previousTime = null;

    action
      .reset()
      .fadeIn(0.08)
      .play();

    mixer.update(0);

    gsap.to(
      root.scale,
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.38,
        ease: "back.out(1.7)",
      }
    );
  }


  function update(elapsedTime) {
    if (!active) return;

    if (previousTime === null) {
      previousTime = elapsedTime;
      return;
    }

    const deltaTime =
      THREE.MathUtils.clamp(
        elapsedTime - previousTime,
        0,
        0.05,
      );

    previousTime = elapsedTime;

    mixer.update(
      deltaTime
    );
  }


  function reset() {
    gsap.killTweensOf(
      root.scale
    );

    active = false;
    previousTime = null;

    action.stop();
    targetMesh.skeleton.pose();

    root.scale.setScalar(1);
    root.visible = false;
  }


  return {
    show,
    update,
    reset,
  };
}
