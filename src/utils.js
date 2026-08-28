import * as THREE from "three";

export function normalizeModel(model, targetHeight = 2.5) {
  const box = new THREE.Box3().setFromObject(model);

  const size = new THREE.Vector3();
  box.getSize(size);

  const scale = targetHeight / size.y;

  model.scale.setScalar(scale);

  // recalcul après scale
  box.setFromObject(model);

  const center = new THREE.Vector3();
  box.getCenter(center);

  // centre horizontalement
  model.position.x -= center.x;
  model.position.z -= center.z;

  // pose le modèle sur le sol
  model.position.y -= box.min.y;
}
