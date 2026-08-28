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

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      if (!material) continue;

      material.flatShading = true;

      makeTextureRetro(material.map);
      makeTextureRetro(material.normalMap);
      makeTextureRetro(material.roughnessMap);

      addVertexJitter(material, 1);

      material.needsUpdate = true;
    }
  });
}