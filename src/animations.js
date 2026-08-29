import * as THREE from "three";
import { gsap } from "gsap";

export function playGiftDrop(
  gift,
  {
    finalYRotation = Math.PI * 0.35,
  } = {}
) {
  gsap.killTweensOf(gift.position);
  gsap.killTweensOf(gift.rotation);

  // Position / orientation de départ
  gift.position.set(0, 7, 0);

  // On arrive déjà légèrement incliné,
  // avec une rotation plus importante que l'angle final,
  // pour donner une vraie impression de mouvement.
  gift.rotation.set(
    0.16,
    finalYRotation - Math.PI * 1.35,
    0.32,
  );

  const tl = gsap.timeline();

  // ---------------------------------------
  // Chute principale + rotation
  // ---------------------------------------

  tl.to(
    gift.position,
    {
      y: 0,
      duration: 1.8,
      ease: "power4.in",
    },
    0
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation + 0.15,
      x: 0.08,
      z: -0.24,
      duration: 1.8,
      ease: "power2.in",
    },
    0
  );

  // ---------------------------------------
  // Premier rebond
  // ---------------------------------------

  tl.to(
    gift.position,
    {
      y: 0.3,
      duration: 0.18,
      ease: "power2.out",
    }
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation - 0.2,
      x: -0.03,
      z: 0.2,
      duration: 0.18,
      ease: "sine.out",
    },
    "<"
  );

  tl.to(
    gift.position,
    {
      y: 0,
      duration: 0.22,
      ease: "power2.in",
    }
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation - 0.2 ,
      x: 0.03,
      z: -0.10,
      duration: 0.22,
      ease: "sine.inOut",
    },
    "<"
  );

  // ---------------------------------------
  // Deuxième petit rebond
  // ---------------------------------------

  tl.to(
    gift.position,
    {
      y: 0.12,
      duration: 0.22,
      ease: "power1.out",
    }
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation - 0.2,
      x: -0.01,
      z: 0.10,
      duration: 0.22,
      ease: "sine.out",
    },
    "<"
  );

  tl.to(
    gift.position,
    {
      y: 0,
      duration: 0.2,
      ease: "power1.in",
    }
  );

  // ---------------------------------------
  // Stabilisation finale
  // ---------------------------------------

  tl.to(
    gift.rotation,
    {
      x: 0,
      y: finalYRotation - 0.2,
      z: 0,
      duration: 0.2,
      ease: "power2.out",
    },
    "<"
  );

  return tl;
}

export function playLidFall({
  lid,
  bow,
  pullTail = null,
  ribbonLid = null,
  scene,
  camera,
}) {
  const carriedObjects = [
    lid,
    bow,
    pullTail,
    ribbonLid,
  ].filter(Boolean);

  // Centre du couvercle pour créer le pivot commun
  const lidBox =
    new THREE.Box3()
      .setFromObject(lid);

  const lidCenter =
    lidBox.getCenter(
      new THREE.Vector3()
    );

  const lidRig =
    new THREE.Group();

  lidRig.position.copy(
    lidCenter
  );

  scene.add(lidRig);

  for (const object of carriedObjects) {
    lidRig.attach(object);
  }

  // Direction arrière + droite par rapport à la caméra
  const cameraForward =
    new THREE.Vector3();

  camera.getWorldDirection(
    cameraForward
  );

  cameraForward.y = 0;
  cameraForward.normalize();

  const cameraRight =
    new THREE.Vector3()
      .setFromMatrixColumn(
        camera.matrixWorld,
        0
      );

  cameraRight.y = 0;
  cameraRight.normalize();

  const startPosition =
    lidRig.position.clone();

  const apexPosition =
    startPosition
      .clone()
      .addScaledVector(
        cameraForward,
        0.55
      )
      .addScaledVector(
        cameraRight,
        0.50
      );

  apexPosition.y += 0.55;

  const finalPosition =
    startPosition
      .clone()
      .addScaledVector(
        cameraForward,
        1.8
      )
      .addScaledVector(
        cameraRight,
        1.35
      );

  finalPosition.y = 0.14;

  const tl = gsap.timeline();

  // Petit saut au départ
  tl.to(
    lidRig.position,
    {
      x: apexPosition.x,
      y: apexPosition.y,
      z: apexPosition.z,
      duration: 0.26,
      ease: "power2.out",
    },
    0
  );

  tl.to(
    lidRig.rotation,
    {
      x: -0.35,
      y: 0.30,
      z: 0.22,
      duration: 0.26,
      ease: "power2.out",
    },
    0
  );

  // Chute derrière à droite
  tl.to(
    lidRig.position,
    {
      x: finalPosition.x,
      y: finalPosition.y,
      z: finalPosition.z,
      duration: 0.72,
      ease: "power2.in",
    },
    0.24
  );

  tl.to(
    lidRig.rotation,
    {
      x: Math.PI * 2 + 0.08,
      y: Math.PI * 0.45,
      z: -Math.PI * 2 - 0.05,
      duration: 0.82,
      ease: "none",
    },
    0.18
  );

  // Rebond
  tl.to(
    lidRig.position,
    {
      y: 0.25,
      duration: 0.10,
      ease: "power2.out",
    }
  );

  tl.to(
    lidRig.rotation,
    {
      x: Math.PI * 2 - 0.04,
      y: Math.PI * 0.47,
      z: -Math.PI * 2 + 0.04,
      duration: 0.10,
      ease: "sine.out",
    },
    "<"
  );

  tl.to(
    lidRig.position,
    {
      y: 0.14,
      duration: 0.14,
      ease: "power2.in",
    }
  );

  tl.to(
    lidRig.rotation,
    {
      x: Math.PI * 2 + 0.02,
      y: Math.PI * 0.48,
      z: -Math.PI * 2 + 0.01,
      duration: 0.14,
      ease: "power2.out",
    },
    "<"
  );

  return tl;
}