import * as THREE from "three";

import { EffectComposer }
  from "three/addons/postprocessing/EffectComposer.js";

import { RenderPass }
  from "three/addons/postprocessing/RenderPass.js";

import { ShaderPass }
  from "three/addons/postprocessing/ShaderPass.js";

import { OutputPass }
  from "three/addons/postprocessing/OutputPass.js";

const RETRO_WIDTH = 320;
const RETRO_HEIGHT = 240;

const PS1DitherShader = {
  uniforms: {
    tDiffuse: {
      value: null,
    },

    // 5 bits = 32 valeurs possibles
    // donc 31 intervalles entre 0 et 1.
    uColorLevels: {
      value: 38,
    },

    // 0 = pas de dithering
    // 1 = Bayer complet
    uDitherStrength: {
      value: 0.3,
    },
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;

    uniform float uColorLevels;
    uniform float uDitherStrength;

    varying vec2 vUv;


    // Matrice Bayer 4x4 :
    //
    //  0  8  2 10
    // 12  4 14  6
    //  3 11  1  9
    // 15  7 13  5

    float bayer4x4(vec2 position) {
      int x = int(mod(position.x, 4.0));
      int y = int(mod(position.y, 4.0));

      float value = 0.0;

      if (y == 0) {
        if (x == 0) value = 0.0;
        else if (x == 1) value = 8.0;
        else if (x == 2) value = 2.0;
        else value = 10.0;
      }

      else if (y == 1) {
        if (x == 0) value = 12.0;
        else if (x == 1) value = 4.0;
        else if (x == 2) value = 14.0;
        else value = 6.0;
      }

      else if (y == 2) {
        if (x == 0) value = 3.0;
        else if (x == 1) value = 11.0;
        else if (x == 2) value = 1.0;
        else value = 9.0;
      }

      else {
        if (x == 0) value = 15.0;
        else if (x == 1) value = 7.0;
        else if (x == 2) value = 13.0;
        else value = 5.0;
      }

      // Valeur entre 0 et presque 1.
      return (value + 0.5) / 16.0;
    }


    void main() {
      vec4 texel =
        texture2D(tDiffuse, vUv);

      vec3 color =
        texel.rgb;


      // -------------------------
      // DITHERING
      // -------------------------

      float bayer =
        bayer4x4(gl_FragCoord.xy);

      // Sans dithering, on utilise 0.5 :
      // cela revient à arrondir normalement.
      //
      // Avec dithering, cette valeur dépend
      // de la position du pixel.

      float threshold =
        mix(
          0.5,
          bayer,
          uDitherStrength
        );


      // -------------------------
      // COLOR QUANTIZATION
      // -------------------------

      color =
        floor(
          color * uColorLevels
          + threshold
        )
        / uColorLevels;


      color =
        clamp(
          color,
          0.0,
          1.0
        );


      gl_FragColor =
        vec4(
          color,
          texel.a
        );
    }
  `,
};

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

export function createRetroComposer(
  renderer,
  scene,
  camera,
) {
  const composer =
    new EffectComposer(
      renderer
    );

  composer.setPixelRatio(1);

  composer.setSize(
    RETRO_WIDTH,
    RETRO_HEIGHT,
  );


  // -------------------------
  // SCÈNE NORMALE
  // -------------------------

  const renderPass =
    new RenderPass(
      scene,
      camera,
    );

  composer.addPass(
    renderPass
  );


  // -------------------------
  // PS1 COLOR + DITHER
  // -------------------------

  const ditherPass =
    new ShaderPass(
      PS1DitherShader
    );

  composer.addPass(
    ditherPass
  );


  // -------------------------
  // COLOR SPACE OUTPUT
  // -------------------------

  const outputPass =
    new OutputPass();

  composer.addPass(
    outputPass
  );


  return {
    composer,
    ditherPass,
  };
}