import * as THREE from "three";
import { gsap } from "gsap";


export function createRibbonInteraction({
  camera,
  canvas,
  pullTail,
  bow,

  maxPullDistance = 1.2,

  onProgress = null,
  onComplete = null,
}) {
  const raycaster =
    new THREE.Raycaster();

  const pointer =
    new THREE.Vector2();


  // Plan invisible sur lequel on projette
  // les mouvements de souris.
  const dragPlane =
    new THREE.Plane();

  const dragStart =
    new THREE.Vector3();

  const currentPoint =
    new THREE.Vector3();


  // Direction du tirage.
  const pullDirection =
    new THREE.Vector3();

  const cameraDirection =
    new THREE.Vector3();


  let enabled = false;
  let dragging = false;
  let completed = false;

  let pullProgress = 0;


  // ==============================================
  // ÉTAT INITIAL
  // ==============================================

  const initialTailPosition =
    pullTail.position.clone();

  const initialTailRotation =
    pullTail.rotation.clone();

  const initialBowScale =
    bow.scale.clone();

  const initialBowRotation =
    bow.rotation.clone();


  // ==============================================
  // UTILS
  // ==============================================

  function updatePointer(event) {
    const rect =
      canvas.getBoundingClientRect();

    pointer.x =
      ((event.clientX - rect.left)
        / rect.width) * 2 - 1;

    pointer.y =
      -(
        (event.clientY - rect.top)
        / rect.height
      ) * 2 + 1;
  }


  function getCenter(object) {
    const box =
      new THREE.Box3()
        .setFromObject(object);

    return box.getCenter(
      new THREE.Vector3()
    );
  }


  // ==============================================
  // DIRECTION NATURELLE DU RUBAN
  // ==============================================

  function calculatePullDirection() {
    const bowCenter =
      getCenter(bow);

    const tailCenter =
      getCenter(pullTail);


    pullDirection
      .subVectors(
        tailCenter,
        bowCenter,
      );


    // Le drag se fait sur un plan face caméra.
    // On enlève donc la composante qui partirait
    // vers ou depuis la caméra.

    camera.getWorldDirection(
      cameraDirection
    );

    pullDirection.addScaledVector(
      cameraDirection,
      -pullDirection.dot(
        cameraDirection
      )
    );

    pullDirection.normalize();
  }


  // ==============================================
  // PLAN DE DRAG
  // ==============================================

  function prepareDragPlane() {
    camera.getWorldDirection(
      cameraDirection
    );

    const tailCenter =
      getCenter(pullTail);

    dragPlane.setFromNormalAndCoplanarPoint(
      cameraDirection,
      tailCenter
    );
  }


  function intersectPointerWithPlane(
    event,
    target,
  ) {
    updatePointer(event);

    raycaster.setFromCamera(
      pointer,
      camera
    );

    return raycaster.ray.intersectPlane(
      dragPlane,
      target
    );
  }


  // ==============================================
  // HIT TEST
  // ==============================================

  function isPointerOnPullTail(event) {
    updatePointer(event);

    raycaster.setFromCamera(
      pointer,
      camera
    );

    const hits =
      raycaster.intersectObject(
        pullTail,
        true
      );

    return hits.length > 0;
  }


  // ==============================================
  // HOVER / MOVE
  // ==============================================

  function handlePointerMove(event) {
    if (!enabled || completed) {
      canvas.style.cursor =
        "default";

      return;
    }


    if (dragging) {
      handleDrag(event);
      return;
    }


    canvas.style.cursor =
      isPointerOnPullTail(event)
        ? "grab"
        : "default";
  }


  // ==============================================
  // START
  // ==============================================

  function handlePointerDown(event) {
    if (!enabled || completed) {
      return;
    }

    if (!isPointerOnPullTail(event)) {
      return;
    }


    dragging = true;

    canvas.style.cursor =
      "grabbing";


    canvas.setPointerCapture(
      event.pointerId
    );


    calculatePullDirection();

    prepareDragPlane();


    intersectPointerWithPlane(
      event,
      dragStart
    );
  }


  // ==============================================
  // DRAG
  // ==============================================

  function handleDrag(event) {
    if (!dragging) {
      return;
    }


    const intersection =
      intersectPointerWithPlane(
        event,
        currentPoint
      );

    if (!intersection) {
      return;
    }


    const movement =
      currentPoint
        .clone()
        .sub(dragStart);


    // On garde uniquement le déplacement
    // dans la direction naturelle du ruban.

    const distance =
      THREE.MathUtils.clamp(
        movement.dot(
          pullDirection
        ),

        0,
        maxPullDistance
      );


    pullProgress =
      distance /
      maxPullDistance;


    updateVisuals(
      pullProgress
    );


    if (onProgress) {
      onProgress(
        pullProgress
      );
    }


    if (
      pullProgress >= 0.98
      && !completed
    ) {
      complete();
    }
  }


  // ==============================================
  // VISUEL
  // ==============================================

  function updateVisuals(progress) {
    /*
      Pour le premier test, on ne cherche
      PAS encore une déformation parfaite.

      On veut simplement vérifier que
      l'interaction est naturelle.
    */


    // ------------------------------------------
    // La queue sort progressivement du nœud
    // ------------------------------------------

    const worldOffset =
      pullDirection
        .clone()
        .multiplyScalar(
          maxPullDistance
          * progress
          * 0.65
        );


    /*
      pullDirection est une direction WORLD.

      pullTail.position est en LOCAL.

      On convertit donc un déplacement monde
      vers l'espace du parent.
    */

    const startWorld =
      pullTail.parent.localToWorld(
        initialTailPosition.clone()
      );

    const targetWorld =
      startWorld
        .clone()
        .add(worldOffset);

    const targetLocal =
      pullTail.parent.worldToLocal(
        targetWorld
      );


    pullTail.position.copy(
      targetLocal
    );


    // ------------------------------------------
    // Le nœud se contracte
    // ------------------------------------------

    const squeeze =
      THREE.MathUtils.lerp(
        1,
        0.78,
        progress
      );

    bow.scale.set(
      initialBowScale.x
        * squeeze,

      initialBowScale.y,

      initialBowScale.z
        * squeeze,
    );


    // ------------------------------------------
    // Un peu d'asymétrie
    // ------------------------------------------

    bow.rotation.z =
      initialBowRotation.z
      - progress * 0.08;


    pullTail.rotation.z =
      initialTailRotation.z
      - progress * 0.06;
  }


  // ==============================================
  // RELEASE
  // ==============================================

  function handlePointerUp(event) {
    if (!dragging) {
      return;
    }


    dragging = false;

    canvas.style.cursor =
      "grab";


    if (
      canvas.hasPointerCapture(
        event.pointerId
      )
    ) {
      canvas.releasePointerCapture(
        event.pointerId
      );
    }


    // Si on n'a pas suffisamment tiré :
    // retour en place.

    if (!completed) {
      reset();
    }
  }


  // ==============================================
  // RESET
  // ==============================================

  function reset() {
    pullProgress = 0;


    gsap.to(
      pullTail.position,
      {
        x: initialTailPosition.x,
        y: initialTailPosition.y,
        z: initialTailPosition.z,

        duration: 0.3,
        ease: "power2.out",
      }
    );


    gsap.to(
      pullTail.rotation,
      {
        x: initialTailRotation.x,
        y: initialTailRotation.y,
        z: initialTailRotation.z,

        duration: 0.3,
        ease: "power2.out",
      }
    );


    gsap.to(
      bow.scale,
      {
        x: initialBowScale.x,
        y: initialBowScale.y,
        z: initialBowScale.z,

        duration: 0.3,
        ease: "power2.out",
      }
    );


    gsap.to(
      bow.rotation,
      {
        x: initialBowRotation.x,
        y: initialBowRotation.y,
        z: initialBowRotation.z,

        duration: 0.3,
        ease: "power2.out",
      }
    );


    if (onProgress) {
      onProgress(0);
    }
  }


  // ==============================================
  // COMPLETE
  // ==============================================

  function complete() {
    completed = true;
    dragging = false;

    pullProgress = 1;

    canvas.style.cursor =
      "default";


    if (onComplete) {
      onComplete();
    }
  }


  // ==============================================
  // ENABLE / DISABLE
  // ==============================================

  function enable() {
    enabled = true;
  }


  function disable() {
    enabled = false;

    canvas.style.cursor =
      "default";
  }


  // ==============================================
  // EVENTS
  // ==============================================

  canvas.addEventListener(
    "pointermove",
    handlePointerMove
  );

  canvas.addEventListener(
    "pointerdown",
    handlePointerDown
  );

  canvas.addEventListener(
    "pointerup",
    handlePointerUp
  );

  canvas.addEventListener(
    "pointercancel",
    handlePointerUp
  );


  return {
    enable,
    disable,
    reset,

    get progress() {
      return pullProgress;
    },
  };
}