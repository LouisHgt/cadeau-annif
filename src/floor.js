import * as THREE from "three";

export function createRetroFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;

  const context = canvas.getContext("2d");

  // fond plus lumineux et joyeux
  context.fillStyle = "#f4d7ff";
  context.fillRect(0, 0, 32, 32);

  // damier grossier
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      context.fillStyle =
        (x + y) % 2 === 0
          ? "#f7e6ff"
          : "#e8c6f8";

      context.fillRect(
        x * 8,
        y * 8,
        8,
        8,
      );
    }
  }

  // un peu de bruit / variations rétro
  for (let i = 0; i < 20; i += 1) {
    context.fillStyle =
      Math.random() > 0.5
        ? "#d9a8ff"
        : "#f9b7d8";

    context.fillRect(
      Math.floor(Math.random() * 32),
      Math.floor(Math.random() * 32),
      1,
      1,
    );
  }

  const texture = new THREE.CanvasTexture(canvas);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  return texture;
}