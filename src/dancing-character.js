import * as THREE from "three";
import { gsap } from "gsap";

import {
  makeModelRetro,
  makeTextureRetro,
} from "./retro-renderer.js";


const TARGET_HEIGHT = 1.65;

const FACE_WIDTH = 1.34;
const FACE_ASPECT = 1206 / 1102;

const MODEL_YAW_OFFSET =
  -Math.PI * 0.12;

const MIRRORED_ARM_BONES =
  new Set([
    "LeftUpperArm",
    "LeftLowerArm",
    "LeftHand",
    "RightUpperArm",
    "RightLowerArm",
    "RightHand",
  ]);

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
  let result = null;

  model.traverse((object) => {
    if (
      !result
      && object.isSkinnedMesh
    ) {
      result = object;
    }
  });

  return result;
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

  if (bounds.isEmpty()) {
    bounds.setFromObject(
      model,
      true,
    );
  }

  return bounds;
}


function normalizeCharacter(model) {
  let bounds =
    getCharacterBounds(model);

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


function captureBonePose(bones) {
  return bones.map(
    (bone) => ({
      bone,

      position:
        bone.position.clone(),

      quaternion:
        bone.quaternion.clone(),

      scale:
        bone.scale.clone(),
    })
  );
}


function restoreBonePose({
  pose,
  model,
}) {
  for (const transform of pose) {
    transform.bone.position.copy(
      transform.position
    );

    transform.bone.quaternion.copy(
      transform.quaternion
    );

    transform.bone.scale.copy(
      transform.scale
    );

    transform.bone.updateMatrix();
  }

  model.updateMatrixWorld(true);
}


function getBoneDepth(bone) {
  let depth = 0;
  let parent = bone.parent;

  while (parent) {
    depth += 1;
    parent = parent.parent;
  }

  return depth;
}


function createRetargetedDance({
  characterModel,
  danceModel,
  sourceClip,
}) {
  const targetMesh =
    characterModel.getObjectByName(
      "LowerTorso_Geo"
    )
    ?? findSkinnedMesh(
      characterModel
    );

  if (!targetMesh) {
    throw new Error(
      "No skinned mesh was found in character.glb"
    );
  }

  if (!sourceClip) {
    throw new Error(
      "No animation clip was found in dance.glb"
    );
  }

  const targetPose =
    captureBonePose(
      targetMesh.skeleton.bones
    );

  const mappedBones =
    Object.entries(BONE_NAMES)
      .map(([
        targetName,
        sourceName,
      ]) => {
        const targetBone =
          characterModel.getObjectByName(
            targetName
          );

        const sourceBone =
          danceModel.getObjectByName(
            sourceName
          );

        if (!targetBone?.isBone) {
          throw new Error(
            `The target bone "${targetName}" was not found`
          );
        }

        if (!sourceBone?.isBone) {
          throw new Error(
            `The source bone "${sourceName}" was not found`
          );
        }

        return {
          targetName,
          targetBone,
          sourceBone,
          targetRestWorld:
            new THREE.Quaternion(),
          sourceRestWorldInverse:
            new THREE.Quaternion(),
        };
      })
      .sort(
        (left, right) =>
          getBoneDepth(left.targetBone)
          - getBoneDepth(right.targetBone)
      );

  restoreBonePose({
    pose:
      targetPose,
    model:
      characterModel,
  });

  danceModel.updateMatrixWorld(true);

  for (const mapping of mappedBones) {
    mapping.targetBone.getWorldQuaternion(
      mapping.targetRestWorld
    );

    mapping.sourceBone.getWorldQuaternion(
      mapping.sourceRestWorldInverse
    );

    mapping.sourceRestWorldInverse.invert();
  }

  const targetBounds =
    getCharacterBounds(
      characterModel
    );

  const danceBounds =
    new THREE.Box3()
      .setFromObject(
        danceModel,
        true,
      );

  const targetHeight =
    targetBounds.getSize(
      new THREE.Vector3()
    ).y;

  const danceHeight =
    danceBounds.getSize(
      new THREE.Vector3()
    ).y;

  const translationScale =
    targetHeight / danceHeight;

  const frameCount =
    Math.max(
      ...sourceClip.tracks.map(
        (track) =>
          track.times.length
      )
    );

  const times =
    new Float32Array(
      frameCount
    );

  const quaternionValues =
    new Map(
      mappedBones.map(
        ({ targetName }) => [
          targetName,
          new Float32Array(
            frameCount * 4
          ),
        ]
      )
    );

  const hipsPositionValues =
    new Float32Array(
      frameCount * 3
    );

  const sourceMixer =
    new THREE.AnimationMixer(
      danceModel
    );

  sourceMixer
    .clipAction(sourceClip)
    .play();

  sourceMixer.setTime(0);
  danceModel.updateMatrixWorld(true);

  const sourceHips =
    danceModel.getObjectByName(
      BONE_NAMES.LowerTorso
    );

  const targetHips =
    characterModel.getObjectByName(
      "LowerTorso"
    );

  const sourceHipsStart =
    sourceHips.getWorldPosition(
      new THREE.Vector3()
    );

  const targetHipsStart =
    targetPose.find(
      ({ bone }) =>
        bone === targetHips
    ).position.clone();

  const sourceWorld =
    new THREE.Quaternion();

  const worldDelta =
    new THREE.Quaternion();

  const desiredWorld =
    new THREE.Quaternion();

  const parentWorldInverse =
    new THREE.Quaternion();

  const localQuaternion =
    new THREE.Quaternion();

  const previousQuaternion =
    new THREE.Quaternion();

  const sourceHipsPosition =
    new THREE.Vector3();

  for (
    let frame = 0;
    frame < frameCount;
    frame += 1
  ) {
    const time =
      frameCount === 1
        ? 0
        : sourceClip.duration
          * frame
          / (frameCount - 1);

    times[frame] = time;

    sourceMixer.setTime(time);
    danceModel.updateMatrixWorld(true);

    restoreBonePose({
      pose:
        targetPose,
      model:
        characterModel,
    });

    sourceHips.getWorldPosition(
      sourceHipsPosition
    );

    targetHips.position.copy(
      targetHipsStart
    );

    targetHips.position.y +=
      (
        sourceHipsPosition.y
        - sourceHipsStart.y
      )
      * translationScale;

    targetHips.updateMatrix();
    characterModel.updateMatrixWorld(true);

    targetHips.position.toArray(
      hipsPositionValues,
      frame * 3,
    );

    for (const mapping of mappedBones) {
      mapping.sourceBone.getWorldQuaternion(
        sourceWorld
      );

      worldDelta
        .copy(sourceWorld)
        .multiply(
          mapping.sourceRestWorldInverse
        );

      /*
        Les deux rigs ont des conventions avant/arrière
        opposées pour les bras. Cette réflexion sur Z inverse
        leur flexion sans échanger le côté gauche et le droit.
      */
      if (
        MIRRORED_ARM_BONES.has(
          mapping.targetName
        )
      ) {
        worldDelta.set(
          -worldDelta.x,
          -worldDelta.y,
          worldDelta.z,
          worldDelta.w,
        );
      }

      desiredWorld
        .copy(worldDelta)
        .multiply(
          mapping.targetRestWorld
        );

      mapping.targetBone.parent
        .getWorldQuaternion(
          parentWorldInverse
        );

      parentWorldInverse.invert();

      localQuaternion
        .copy(parentWorldInverse)
        .multiply(desiredWorld)
        .normalize();

      const values =
        quaternionValues.get(
          mapping.targetName
        );

      if (frame > 0) {
        previousQuaternion.fromArray(
          values,
          (frame - 1) * 4,
        );

        if (
          previousQuaternion.dot(
            localQuaternion
          ) < 0
        ) {
          localQuaternion.set(
            -localQuaternion.x,
            -localQuaternion.y,
            -localQuaternion.z,
            -localQuaternion.w,
          );
        }
      }

      mapping.targetBone.quaternion.copy(
        localQuaternion
      );

      mapping.targetBone.updateMatrix();
      mapping.targetBone.updateMatrixWorld(true);

      localQuaternion.toArray(
        values,
        frame * 4,
      );
    }
  }

  sourceMixer.stopAllAction();

  restoreBonePose({
    pose:
      targetPose,
    model:
      characterModel,
  });

  const tracks = [
    new THREE.VectorKeyframeTrack(
      ".bones[LowerTorso].position",
      times,
      hipsPositionValues,
    ),

    ...mappedBones.map(
      ({ targetName }) =>
        new THREE.QuaternionKeyframeTrack(
          `.bones[${targetName}].quaternion`,
          times,
          quaternionValues.get(
            targetName
          ),
        )
    ),
  ];

  return {
    targetMesh,
    targetPose,
    clip:
      new THREE.AnimationClip(
        "DanceRetargeted",
        sourceClip.duration,
        tracks,
      ),
  };
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

      depthTest:
        false,

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

  sprite.renderOrder = 30;

  head.add(
    sprite
  );
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

  const {
    targetMesh,
    targetPose,
    clip,
  } =
    createRetargetedDance({
      characterModel,
      danceModel:
        dance.scene,
      sourceClip:
        dance.animations[0],
    });

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

  normalizeCharacter(
    characterModel
  );

  makeModelRetro(
    characterModel
  );

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
      ) + MODEL_YAW_OFFSET,
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

    restoreBonePose({
      pose:
        targetPose,
      model:
        characterModel,
    });

    root.scale.setScalar(1);
    root.visible = false;
  }


  return {
    show,
    update,
    reset,
  };
}
