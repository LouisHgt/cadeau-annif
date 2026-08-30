import * as THREE from "three";
import {howl} from "howler";

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

export async function getGiftParts(giftModel) {
  // Fond de la boîte
  const box =
    giftModel.getObjectByName("Box");

  // Murs
  const boxFront =
    giftModel.getObjectByName("BoxFront");

  const boxBack =
    giftModel.getObjectByName("BoxBack");

  const boxLeft =
    giftModel.getObjectByName("BoxLeft");

  const boxRight =
    giftModel.getObjectByName("BoxRight");


  // Rubans des murs
  const ribbonBody =
    giftModel.getObjectByName("RibbonBody");

  const ribbonFront =
    giftModel.getObjectByName("RibbonFront");

  const ribbonBack =
    giftModel.getObjectByName("RibbonBack");

  const ribbonLeft =
    giftModel.getObjectByName("RibbonLeft");

  const ribbonRight =
    giftModel.getObjectByName("RibbonRight");


  // Couvercle
  const lid =
    giftModel.getObjectByName("Lid");

  const ribbonLid =
    giftModel.getObjectByName("RibbonLid");

  const bow =
    giftModel.getObjectByName("Bow");

  const pullTail =
    giftModel.getObjectByName("PullTail");


  return {
    box,

    boxFront,
    boxBack,
    boxLeft,
    boxRight,

    ribbonBody,

    ribbonFront,
    ribbonBack,
    ribbonLeft,
    ribbonRight,

    lid,
    ribbonLid,
    bow,
    pullTail,
  };
}

export async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}