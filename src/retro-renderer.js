import * as THREE from "three";

const RETRO_WIDTH = 320;
const RETRO_HEIGHT = 240;

export function makeTextureRetro(texture) {
  if (!texture) return;

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 1;
  texture.needsUpdate = true;
}

function addVertexJitter(material, intensity = 1) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRetroResolution = {
      value: new THREE.Vector2(RETRO_WIDTH, RETRO_HEIGHT),
    };

    shader.uniforms.uJitterIntensity = {
      value: intensity,
    };

    shader.vertexShader = `
      uniform vec2 uRetroResolution;
      uniform float uJitterIntensity;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `
      #include <project_vertex>

      vec2 ndc = gl_Position.xy / gl_Position.w;

      vec2 grid =
        (uRetroResolution * 0.5)
        / uJitterIntensity;

      ndc = floor(ndc * grid + 0.5) / grid;

      gl_Position.xy = ndc * gl_Position.w;
      `,
    );
  };

  material.customProgramCacheKey = () =>
    `ps1-jitter-${intensity}`;
}

export function makeModelRetro(model) {
  model.traverse((object) => {
    if (!object.isMesh) return;

    const oldMaterials =
      Array.isArray(object.material)
        ? object.material
        : [object.material];

    const retroMaterials =
      oldMaterials.map((oldMaterial) => {
        const material =
          convertToRetroMaterial(
            oldMaterial
          );

        makeTextureRetro(
          material.map
        );

        addVertexJitter(
          material,
          1
        );

        material.needsUpdate = true;

        return material;
      });

    object.material =
      Array.isArray(object.material)
        ? retroMaterials
        : retroMaterials[0];
  });
}

function convertToRetroMaterial(oldMaterial) {
  const material =
    new THREE.MeshLambertMaterial({
      color:
        oldMaterial.color?.clone()
        ?? new THREE.Color(0xffffff),

      map:
        oldMaterial.map ?? null,

      transparent:
        oldMaterial.transparent,

      opacity:
        oldMaterial.opacity,

      alphaTest:
        oldMaterial.alphaTest,

      side:
        oldMaterial.side,
    });

  material.name =
    oldMaterial.name;

  material.flatShading = true;

  return material;
}