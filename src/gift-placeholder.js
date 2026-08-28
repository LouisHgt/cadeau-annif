import * as THREE from "three";

export function createGiftPlaceholder() {
  const gift = new THREE.Group();
  gift.name = "Gift";

  const boxMaterial = new THREE.MeshLambertMaterial({
    color: 0x9b263c,
  });

  const ribbonMaterial = new THREE.MeshLambertMaterial({
    color: 0xe8c76d,
  });

  // -----------------------
  // BOÎTE
  // -----------------------

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.4, 2),
    boxMaterial,
  );

  box.position.y = 0.7;
  box.name = "Box";

  gift.add(box);

  // -----------------------
  // COUVERCLE
  // -----------------------

  const lid = new THREE.Group();
  lid.name = "Lid";

  const lidBox = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.22, 2.15),
    boxMaterial,
  );

  lidBox.position.y = 1.51;

  lid.add(lidBox);

  gift.add(lid);

  // -----------------------
  // RUBANS AUTOUR DE LA BOÎTE
  // -----------------------

  const ribbonGroup = new THREE.Group();
  ribbonGroup.name = "Ribbon";

  const ribbonFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 1.45, 2.04),
    ribbonMaterial,
  );

  ribbonFront.position.y = 0.73;

  const ribbonSide = new THREE.Mesh(
    new THREE.BoxGeometry(2.04, 1.45, 0.28),
    ribbonMaterial,
  );

  ribbonSide.position.y = 0.73;

  ribbonGroup.add(ribbonFront);
  ribbonGroup.add(ribbonSide);

  // -----------------------
  // RUBAN SUR LE COUVERCLE
  // -----------------------

  const lidRibbon1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.24, 2.18),
    ribbonMaterial,
  );

  lidRibbon1.position.y = 1.52;

  const lidRibbon2 = new THREE.Mesh(
    new THREE.BoxGeometry(2.18, 0.24, 0.3),
    ribbonMaterial,
  );

  lidRibbon2.position.y = 1.52;

  ribbonGroup.add(lidRibbon1);
  ribbonGroup.add(lidRibbon2);

  // -----------------------
  // NŒUD
  // -----------------------

  const bow = new THREE.Group();
  bow.name = "Bow";

  const knot = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16, 0),
    ribbonMaterial,
  );

  knot.position.y = 1.82;

  bow.add(knot);

  const leftLoop = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.27,
      0.07,
      3,
      6,
    ),
    ribbonMaterial,
  );

  leftLoop.scale.set(1.15, 0.7, 0.7);
  leftLoop.position.set(-0.32, 1.84, 0);
  leftLoop.rotation.z = 0.35;

  const rightLoop = leftLoop.clone();

  rightLoop.position.x = 0.32;
  rightLoop.rotation.z = -0.35;

  bow.add(leftLoop);
  bow.add(rightLoop);

  ribbonGroup.add(bow);

  gift.add(ribbonGroup);

  return {
    root: gift,
    box,
    lid,
    ribbon: ribbonGroup,
    bow,
  };
}