import * as THREE from "three";

const FLAME_COUNT = 6;

const ATLAS_COLUMNS = 4;
const ATLAS_ROWS = 3;

// Chaque bougie utilise une cellule différente du GIF 4 x 3.
const FLAME_TILES = [
  0,
  1,
  2,
  8,
  9,
  10,
];

const GOLDEN_ANGLE =
  Math.PI * (3 - Math.sqrt(5));

const corner =
  new THREE.Vector3();


function getBoundsInModelSpace(
  object,
  model,
) {
  model.updateWorldMatrix(
    true,
    true,
  );

  const worldToModel =
    model.matrixWorld
      .clone()
      .invert();

  const childToModel =
    new THREE.Matrix4();

  const bounds =
    new THREE.Box3()
      .makeEmpty();

  object.traverse((child) => {
    const geometry =
      child.geometry;

    if (!geometry) return;

    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }

    const childBounds =
      geometry.boundingBox;

    if (!childBounds) return;

    childToModel.multiplyMatrices(
      worldToModel,
      child.matrixWorld,
    );

    for (let x = 0; x < 2; x += 1) {
      for (let y = 0; y < 2; y += 1) {
        for (let z = 0; z < 2; z += 1) {
          corner
            .set(
              x === 0
                ? childBounds.min.x
                : childBounds.max.x,

              y === 0
                ? childBounds.min.y
                : childBounds.max.y,

              z === 0
                ? childBounds.min.z
                : childBounds.max.z,
            )
            .applyMatrix4(
              childToModel
            );

          bounds.expandByPoint(
            corner
          );
        }
      }
    }
  });

  if (bounds.isEmpty()) {
    throw new Error(
      `Cake flame marker "${object.name}" has no geometry`
    );
  }

  return bounds;
}


function prepareFlameTexture(
  texture,
) {
  texture.colorSpace =
    THREE.SRGBColorSpace;

  texture.magFilter =
    THREE.NearestFilter;

  texture.minFilter =
    THREE.NearestFilter;

  texture.generateMipmaps = false;
  texture.anisotropy = 1;
  texture.needsUpdate = true;
}


function createAtlasTexture(
  sourceTexture,
  tileIndex,
) {
  const texture =
    sourceTexture.clone();

  const column =
    tileIndex % ATLAS_COLUMNS;

  const row =
    Math.floor(
      tileIndex / ATLAS_COLUMNS
    );

  texture.repeat.set(
    1 / ATLAS_COLUMNS,
    1 / ATLAS_ROWS,
  );

  texture.offset.set(
    column / ATLAS_COLUMNS,
    1 - ((row + 1) / ATLAS_ROWS),
  );

  texture.needsUpdate = true;

  return texture;
}


function createGlowTexture() {
  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 64;
  canvas.height = 64;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Could not create the cake flame glow texture"
    );
  }

  const gradient =
    context.createRadialGradient(
      32,
      32,
      0,
      32,
      32,
      32,
    );

  gradient.addColorStop(
    0,
    "rgba(255, 255, 255, 1)"
  );

  gradient.addColorStop(
    0.25,
    "rgba(255, 255, 255, 0.75)"
  );

  gradient.addColorStop(
    0.6,
    "rgba(255, 255, 255, 0.18)"
  );

  gradient.addColorStop(
    1,
    "rgba(255, 255, 255, 0)"
  );

  context.fillStyle = gradient;

  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  texture.magFilter =
    THREE.LinearFilter;

  texture.minFilter =
    THREE.LinearFilter;

  texture.generateMipmaps = false;

  return texture;
}


export async function createCakeFlames({
  cakeModel,
  textureUrl,
}) {
  const markers =
    Array.from(
      {
        length: FLAME_COUNT,
      },

      (_, index) => {
        const name =
          `Flame_${index + 1}`;

        const marker =
          cakeModel.getObjectByName(
            name
          );

        if (!marker) {
          throw new Error(
            `Cake object "${name}" was not found in the GLB`
          );
        }

        return marker;
      },
    );

  const markerData =
    markers.map((marker) => {
      const bounds =
        getBoundsInModelSpace(
          marker,
          cakeModel,
        );

      return {
        marker,

        center:
          bounds.getCenter(
            new THREE.Vector3()
          ),

        size:
          bounds.getSize(
            new THREE.Vector3()
          ),
      };
    });

  const markerSizes =
    markerData
      .map(({ size }) =>
        Math.max(
          size.x,
          size.y,
          size.z,
        )
      )
      .sort((a, b) => a - b);

  const referenceSize =
    markerSizes[
      Math.floor(
        markerSizes.length / 2
      )
    ];

  // Une cellule 16 x 16 est surtout transparente : le quad doit
  // être plus grand que l'ancienne géométrie pour garder une
  // flamme lisible dans le rendu rétro 320 x 240.
  const flameSize =
    referenceSize * 4;

  const glowSize =
    flameSize * 1.6;

  const sourceTexture =
    await new THREE.TextureLoader()
      .loadAsync(
        textureUrl
      );

  prepareFlameTexture(
    sourceTexture
  );

  const glowTexture =
    createGlowTexture();

  const animatedTextures = [];

  const flames =
    markerData.map(
      (
        {
          marker,
          center,
          size,
        },
        index,
      ) => {
        marker.visible = false;

        const rig =
          new THREE.Group();

        rig.name =
          `FlameSpriteRig_${index + 1}`;

        rig.position.copy(
          center
        );

        const flameTexture =
          createAtlasTexture(
            sourceTexture,
            FLAME_TILES[index],
          );

        animatedTextures.push(
          flameTexture
        );

        const glowMaterial =
          new THREE.SpriteMaterial({
            map:
              glowTexture,

            color:
              0xff6a18,

            transparent:
              true,

            opacity:
              0.34,

            blending:
              THREE.AdditiveBlending,

            depthWrite:
              false,

            toneMapped:
              false,
          });

        const flameMaterial =
          new THREE.SpriteMaterial({
            map:
              flameTexture,

            color:
              0xffffff,

            transparent:
              true,

            alphaTest:
              0.01,

            depthWrite:
              false,

            toneMapped:
              false,
          });

        const glow =
          new THREE.Sprite(
            glowMaterial
          );

        glow.name =
          `FlameGlow_${index + 1}`;

        glow.scale.set(
          glowSize,
          glowSize,
          1,
        );

        glow.renderOrder = 10;

        const flame =
          new THREE.Sprite(
            flameMaterial
          );

        flame.name =
          `FlameSprite_${index + 1}`;

        flame.scale.set(
          flameSize,
          flameSize,
          1,
        );

        flame.renderOrder = 11;

        rig.add(
          glow,
          flame,
        );

        cakeModel.add(
          rig
        );

        return {
          rig,
          flame,
          glow,
          glowMaterial,

          baseY:
            center.y,

          // Environ 2 à 3 pixels de débattement total à l'écran.
          verticalAmplitude:
            Math.max(
              size.y,
              referenceSize,
            ) * 0.42,

          phase:
            index * GOLDEN_ANGLE,

          speed:
            4.6 + (index * 0.23),
        };
      },
    );

  return {
    update(elapsedTime) {
      // Un GIF dans une texture WebGL doit être renvoyé au GPU
      // pour que le navigateur affiche sa frame courante.
      for (const texture of animatedTextures) {
        texture.needsUpdate = true;
      }

      for (const {
        rig,
        flame,
        glow,
        glowMaterial,
        baseY,
        verticalAmplitude,
        phase,
        speed,
      } of flames) {
        const wave =
          Math.sin(
            (elapsedTime * speed)
            + phase
          );

        const flutter =
          Math.sin(
            (elapsedTime * speed * 1.73)
            + (phase * 0.71)
          );

        const drift =
          Math.sin(
            (elapsedTime * speed * 0.57)
            + (phase * 1.31)
          );

        const width =
          flameSize
          * (
            1
            + (wave * 0.055)
            + (flutter * 0.025)
          );

        const height =
          flameSize
          * (
            1
            + (drift * 0.07)
            + (flutter * 0.035)
          );

        rig.position.y =
          baseY
          + (
            verticalAmplitude
            * (
              (drift * 0.7)
              + (flutter * 0.3)
            )
          );

        flame.scale.set(
          width,
          height,
          1,
        );

        const glowPulse =
          1
          + (wave * 0.07)
          + (flutter * 0.04);

        glow.scale.set(
          glowSize * glowPulse,
          glowSize * glowPulse,
          1,
        );

        glowMaterial.opacity =
          0.31
          + ((wave + 1) * 0.035);
      }
    },
  };
}
