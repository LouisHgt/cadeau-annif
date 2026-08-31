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

export function playGiftWiggle(gift, time = 2000) {
  gsap.killTweensOf(gift.rotation);
  gsap.killTweensOf(gift.position);

  const startRotation = {
    x: gift.rotation.x,
    y: gift.rotation.y,
    z: gift.rotation.z,
  };

  const startPosition = {
    x: gift.position.x,
    y: gift.position.y,
    z: gift.position.z,
  };

  const cycleDuration = 0.26;
  const totalDurationSeconds = Math.max(0.26, time / 1000);
  const repeatCount = Math.max(1, Math.ceil(totalDurationSeconds / cycleDuration) - 1);

  const tl = gsap.timeline({
    repeat: repeatCount,
    repeatDelay: 0,
    defaults: {
      duration: 0.04,
      ease: "sine.inOut",
    },
  });

  tl.to(gift.rotation, {
    x: startRotation.x + 0.10,
    y: startRotation.y + 0.12,
    z: startRotation.z + 0.06,
  });

  tl.to(gift.rotation, {
    x: startRotation.x - 0.12,
    y: startRotation.y - 0.10,
    z: startRotation.z - 0.08,
  });

  tl.to(gift.rotation, {
    x: startRotation.x + 0.08,
    y: startRotation.y + 0.14,
    z: startRotation.z + 0.05,
  });

  tl.to(gift.rotation, {
    x: startRotation.x - 0.06,
    y: startRotation.y - 0.08,
    z: startRotation.z - 0.04,
  });

  tl.to(gift.rotation, {
    x: startRotation.x,
    y: startRotation.y,
    z: startRotation.z,
    duration: 0.08,
    ease: "power2.out",
  });

  tl.to(gift.position, {
    x: startPosition.x + 0.04,
    y: startPosition.y + 0.02,
    z: startPosition.z - 0.04,
    duration: 0.02,
    ease: "sine.inOut",
  }, 0);

  tl.to(gift.position, {
    x: startPosition.x,
    y: startPosition.y,
    z: startPosition.z,
    duration: 0.12,
    ease: "power2.out",
  }, ">-0.02");

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

export function playBoxOpen({
  box,

  boxFront,
  boxBack,
  boxLeft,
  boxRight,

  ribbonFront,
  ribbonBack,
  ribbonLeft,
  ribbonRight,
}) {
  // ==================================================
  // CENTRE DE LA BOÎTE
  // ==================================================

  const boxCenterWorld =
    new THREE.Box3()
      .setFromObject(box)
      .getCenter(
        new THREE.Vector3()
      );


  // ==================================================
  // TIMELINE
  // ==================================================

  const tl =
    gsap.timeline({
      // Petite respiration après
      // la chute du couvercle.
      delay: 0.18,
    });


  // ==================================================
  // DÉTERMINE COMMENT UN MUR DOIT TOMBER
  // ==================================================

  function getOpeningDirection(wall) {
    /*
      Le pivot du mur est déjà situé
      au milieu de son arête inférieure.

      On cherche seulement de quel côté
      du centre de la boîte il se trouve.
    */

    const parent =
      wall.parent;

    const centerLocal =
      parent.worldToLocal(
        boxCenterWorld.clone()
      );

    const offset =
      wall.position
        .clone()
        .sub(centerLocal);


    /*
      Mur situé principalement devant/derrière :

      son déplacement horizontal principal
      est sur Z.

      Sa charnière est donc parallèle à X.
    */

    if (
      Math.abs(offset.z)
      >= Math.abs(offset.x)
    ) {
      return {
        axis: "x",

        angle:
          Math.sign(offset.z || 1)
          * Math.PI / 2,
      };
    }


    /*
      Mur situé principalement à gauche/droite :

      son déplacement principal est sur X.

      Sa charnière est donc parallèle à Z.
    */

    return {
      axis: "z",

      angle:
        -Math.sign(offset.x || 1)
        * Math.PI / 2,
    };
  }


  // ==================================================
  // ANIMATION D'UN MUR + SON RUBAN
  // ==================================================

  function animateWall({
    wall,
    ribbon,
    start,
  }) {
    const {
      axis,
      angle,
    } =
      getOpeningDirection(wall);

    const initialWallRotation =
      wall.rotation[axis];

    const initialRibbonRotation =
      ribbon.rotation[axis];


    /*
      On ne va jamais jusqu'à 90° pile.

      0.975 * 90° ≈ 87.75°.

      Visuellement c'est posé au sol,
      mais ça évite que la géométrie
      traverse le floor.
    */
    const restingAngle =
      angle * 0.975;


    /*
      Premier impact légèrement AVANT
      la position finale.

      Surtout pas au-delà de 90°.
    */
    const impactAngle =
      angle * 0.955;


    /*
      Petit rebond vers le haut.
    */
    const bounceAngle =
      angle * 0.91;


    // ----------------------------------------------
    // CHUTE PRINCIPALE
    // ----------------------------------------------

    tl.to(
      wall.rotation,
      {
        [axis]:
          initialWallRotation
          + impactAngle,

        duration: 0.58,
        ease: "power2.in",
      },
      start
    );

    tl.to(
      ribbon.rotation,
      {
        [axis]:
          initialRibbonRotation
          + impactAngle,

        duration: 0.58,
        ease: "power2.in",
      },
      start
    );


    // ----------------------------------------------
    // PETIT REBOND
    // ----------------------------------------------

    tl.to(
      wall.rotation,
      {
        [axis]:
          initialWallRotation
          + bounceAngle,

        duration: 0.11,
        ease: "power2.out",
      }
    );

    tl.to(
      ribbon.rotation,
      {
        [axis]:
          initialRibbonRotation
          + bounceAngle,

        duration: 0.11,
        ease: "power2.out",
      },
      "<"
    );


    // ----------------------------------------------
    // RETOMBE À SA POSITION FINALE
    // ----------------------------------------------

    tl.to(
      wall.rotation,
      {
        [axis]:
          initialWallRotation
          + restingAngle,

        duration: 0.16,
        ease: "power2.in",
      }
    );

    tl.to(
      ribbon.rotation,
      {
        [axis]:
          initialRibbonRotation
          + restingAngle,

        duration: 0.16,
        ease: "power2.in",
      },
      "<"
    );
  }


  // ==================================================
  // OUVERTURE DES 4 CÔTÉS
  // ==================================================

  /*
    Pas parfaitement simultanés.

    Ça évite l'effet mécanique où les
    quatre murs font exactement la même chose.
  */

  animateWall({
    wall: boxFront,
    ribbon: ribbonFront,
    start: 0,
  });


  animateWall({
    wall: boxRight,
    ribbon: ribbonRight,
    start: 0.05,
  });


  animateWall({
    wall: boxLeft,
    ribbon: ribbonLeft,
    start: 0.10,
  });


  animateWall({
    wall: boxBack,
    ribbon: ribbonBack,
    start: 0.15,
  });


  return tl;
}

export function playCakeReveal(
  cakeRoot
) {
  gsap.killTweensOf(
    cakeRoot.position
  );

  const startY =
    cakeRoot.position.y;

  const tl =
    gsap.timeline({
      delay: 0.12,
    });


  // -----------------------------
  // Petit saut
  // -----------------------------

  tl.to(
    cakeRoot.position,
    {
      y:
        startY + 0.22,

      duration: 0.22,

      ease: "power2.out",
    }
  );


  // -----------------------------
  // Retombe à sa place
  // -----------------------------

  tl.to(
    cakeRoot.position,
    {
      y:
        startY,

      duration: 0.28,

      ease: "bounce.out",
    }
  );


  return tl;
}