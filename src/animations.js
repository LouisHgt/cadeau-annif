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
  ribbonLid,
  bow,
  pullTail,
  scene,
  camera,
}) {
  // ==================================================
  // GROUPE COUVERCLE
  // Lid + RibbonLid + Bow restent solidaires
  // ==================================================

  const lidBox =
    new THREE.Box3()
      .setFromObject(lid);

  const lidCenter =
    lidBox.getCenter(
      new THREE.Vector3()
    );

  const lidSize =
    lidBox.getSize(
      new THREE.Vector3()
    );

  const lidRig =
    new THREE.Group();

  lidRig.position.copy(
    lidCenter
  );

  scene.add(
    lidRig
  );

  // attach() conserve la position monde actuelle.
  lidRig.attach(lid);
  lidRig.attach(ribbonLid);
  lidRig.attach(bow);


  // ==================================================
  // LANGUETTE
  // Elle ne suit PAS le couvercle.
  // Elle tombe depuis la position où l'utilisateur
  // vient de la tirer.
  // ==================================================

  scene.attach(
    pullTail
  );


  // ==================================================
  // DIRECTIONS PAR RAPPORT À LA CAMÉRA
  // ==================================================

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


  // ==================================================
  // TRAJECTOIRE DU COUVERCLE
  // ==================================================

  const startPosition =
    lidRig.position.clone();


  // Petit saut initial
  const apexPosition =
    startPosition
      .clone()
      .addScaledVector(
        cameraForward,
        0.45
      )
      .addScaledVector(
        cameraRight,
        0.45
      );

  apexPosition.y += 0.60;


  // Position finale :
  // derrière + à droite de la boîte.
  const finalPosition =
    startPosition
      .clone()
      .addScaledVector(
        cameraForward,
        1.75
      )
      .addScaledVector(
        cameraRight,
        1.30
      );

  // Comme le pivot est au centre du couvercle,
  // on utilise environ la moitié de son épaisseur
  // pour qu'il repose sur le sol.
  const lidGroundY =
    Math.max(
      0.06,
      lidSize.y * 0.5 + 0.02
    );

  finalPosition.y =
    lidGroundY;


  // ==================================================
  // TRAJECTOIRE DE LA LANGUETTE
  // ==================================================

  const tailBox =
    new THREE.Box3()
      .setFromObject(pullTail);

  /*
    Distance entre l'origine de l'objet
    et son point le plus bas.

    Ça permet de le poser sur le sol
    sans valeur Y arbitraire.
  */
  const tailBottomOffset =
    pullTail.position.y
    - tailBox.min.y;


  const tailFinalPosition =
    pullTail.position
      .clone()
      // Elle continue légèrement dans le sens
      // où elle venait d'être tirée.
      .addScaledVector(
        cameraForward,
        -0.30
      )
      .addScaledVector(
        cameraRight,
        -0.12
      );

  tailFinalPosition.y =
    Math.max(
      0.02,
      tailBottomOffset + 0.01
    );


  // ==================================================
  // TIMELINE
  // ==================================================

  const tl =
    gsap.timeline();


  // --------------------------------------------------
  // 1 — La languette échappe de la main
  // --------------------------------------------------

  tl.to(
    pullTail.position,
    {
      x: tailFinalPosition.x,
      y: tailFinalPosition.y,
      z: tailFinalPosition.z,

      duration: 0.55,
      ease: "power2.in",
    },
    0
  );


  tl.to(
    pullTail.rotation,
    {
      x: `+=${Math.PI * 0.65}`,
      y: `+=${Math.PI * 0.30}`,
      z: `-=${Math.PI * 0.55}`,

      duration: 0.58,
      ease: "none",
    },
    0
  );


  // --------------------------------------------------
  // 2 — Le couvercle décolle
  // --------------------------------------------------

  tl.to(
    lidRig.position,
    {
      x: apexPosition.x,
      y: apexPosition.y,
      z: apexPosition.z,

      duration: 0.27,
      ease: "power2.out",
    },
    0.08
  );


  tl.to(
    lidRig.rotation,
    {
      x: -0.32,
      y: 0.25,
      z: 0.20,

      duration: 0.27,
      ease: "power2.out",
    },
    0.08
  );


  // --------------------------------------------------
  // 3 — Il part derrière à droite
  // --------------------------------------------------

  tl.to(
    lidRig.position,
    {
      x: finalPosition.x,
      y: finalPosition.y,
      z: finalPosition.z,

      duration: 0.72,
      ease: "power2.in",
    },
    0.32
  );


  // Rotation pendant le vol
  tl.to(
    lidRig.rotation,
    {
      x:
        Math.PI * 2 + 0.08,

      y:
        Math.PI * 0.45,

      z:
        -Math.PI * 2 - 0.05,

      duration: 0.78,
      ease: "none",
    },
    0.25
  );


  // --------------------------------------------------
  // 4 — Impact du couvercle
  // --------------------------------------------------

  tl.to(
    lidRig.position,
    {
      y:
        lidGroundY + 0.12,

      duration: 0.10,
      ease: "power2.out",
    }
  );


  tl.to(
    lidRig.rotation,
    {
      x:
        Math.PI * 2 - 0.04,

      y:
        Math.PI * 0.47,

      z:
        -Math.PI * 2 + 0.04,

      duration: 0.10,
      ease: "sine.out",
    },
    "<"
  );


  // --------------------------------------------------
  // 5 — Petit rebond final
  // --------------------------------------------------

  tl.to(
    lidRig.position,
    {
      y:
        lidGroundY,

      duration: 0.14,
      ease: "power2.in",
    }
  );


  tl.to(
    lidRig.rotation,
    {
      x:
        Math.PI * 2 + 0.02,

      y:
        Math.PI * 0.48,

      z:
        -Math.PI * 2 + 0.01,

      duration: 0.14,
      ease: "power2.out",
    },
    "<"
  );


  return tl;
}