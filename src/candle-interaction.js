import * as THREE from "three";

const CANDLE_COUNT = 6;


export function createCandleInteraction({
  cakeModel,
  camera,
  canvas,
  flameController,
  onComplete = () => {},
}) {
  const pointer =
    new THREE.Vector2();

  const projectedPosition =
    new THREE.Vector3();

  const targets =
    [];

  for (let index = 0; index < CANDLE_COUNT; index += 1) {
    const candle =
      cakeModel.getObjectByName(
        `Candle_${index + 1}`
      );

    const flameTarget =
      flameController.getHitTarget(
        index
      );

    if (!candle || !flameTarget) {
      throw new Error(
        `Candle interaction target ${index + 1} was not found`
      );
    }

    targets.push(
      {
        index,
        candle,
        flameTarget,
      },
    );
  }

  let enabled = false;
  let completed = false;
  let resetVersion = 0;

  const extinguished =
    new Set();


  function updatePointer(event) {
    const bounds =
      canvas.getBoundingClientRect();

    pointer.set(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    );

    return bounds;
  }


  function getCandleAtPointer(event) {
    const bounds =
      updatePointer(event);

    cakeModel.updateWorldMatrix(
      true,
      true,
    );

    const hitRadius =
      Math.max(
        18,
        Math.min(
          bounds.width,
          bounds.height,
        ) * 0.045,
      );

    let closestIndex = null;
    let closestDistanceSquared =
      hitRadius * hitRadius;

    for (const {
      index,
      flameTarget,
    } of targets) {
      if (!flameController.isLit(index)) {
        continue;
      }

      flameTarget.getWorldPosition(
        projectedPosition
      );

      projectedPosition.project(
        camera
      );

      if (
        projectedPosition.z < -1
        || projectedPosition.z > 1
      ) {
        continue;
      }

      const screenX =
        (projectedPosition.x + 1)
        * 0.5
        * bounds.width;

      const screenY =
        (1 - projectedPosition.y)
        * 0.5
        * bounds.height;

      const distanceSquared =
        (
          (pointer.x - screenX) ** 2
        )
        + (
          (pointer.y - screenY) ** 2
        );

      if (distanceSquared < closestDistanceSquared) {
        closestDistanceSquared =
          distanceSquared;

        closestIndex =
          index;
      }
    }

    return closestIndex;
  }


  function handlePointerMove(event) {
    if (!enabled || completed) {
      canvas.style.cursor = "default";
      return;
    }

    canvas.style.cursor =
      getCandleAtPointer(event) !== null
        ? "pointer"
        : "default";
  }


  function handlePointerLeave() {
    canvas.style.cursor =
      "default";
  }


  function handlePointerUp(event) {
    if (
      !enabled
      || completed
      || event.button !== 0
    ) {
      return;
    }

    const index =
      getCandleAtPointer(
        event
      );

    if (index === null) return;

    const extinction =
      flameController.extinguish(
        index
      );

    if (!extinction) return;

    extinguished.add(
      index
    );

    if (extinguished.size < CANDLE_COUNT) {
      return;
    }

    completed = true;
    enabled = false;
    canvas.style.cursor = "default";

    const currentVersion =
      resetVersion;

    void extinction.then(() => {
      if (currentVersion !== resetVersion) {
        return;
      }

      onComplete();
    });
  }


  canvas.addEventListener(
    "pointermove",
    handlePointerMove,
  );

  canvas.addEventListener(
    "pointerleave",
    handlePointerLeave,
  );

  canvas.addEventListener(
    "pointerup",
    handlePointerUp,
  );


  return {
    enable() {
      if (!completed) {
        enabled = true;
      }
    },

    disable() {
      enabled = false;
      canvas.style.cursor = "default";
    },

    reset() {
      resetVersion += 1;
      enabled = false;
      completed = false;
      extinguished.clear();
      canvas.style.cursor = "default";

      flameController.reset();
    },
  };
}
