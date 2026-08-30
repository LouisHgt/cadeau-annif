import * as THREE from "three";

const CONFETTI_COUNT = 110;
const CONFETTI_DURATION = 4;
const GRAVITY = 3.2;

const CONFETTI_COLORS = [
  0xff5ca8,
  0xffd84a,
  0xff7a30,
  0x4aa8ff,
];

const dummy =
  new THREE.Object3D();


function randomBetween(
  minimum,
  maximum,
) {
  return minimum
    + (Math.random() * (maximum - minimum));
}


export function createConfetti({
  scene,
}) {
  const geometry =
    new THREE.PlaneGeometry(
      1,
      1,
    );

  const material =
    new THREE.MeshBasicMaterial({
      side:
        THREE.DoubleSide,

      transparent:
        true,

      depthWrite:
        false,

      toneMapped:
        false,
    });

  const mesh =
    new THREE.InstancedMesh(
      geometry,
      material,
      CONFETTI_COUNT,
    );

  mesh.name = "BirthdayConfetti";
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 20;

  mesh.instanceMatrix.setUsage(
    THREE.DynamicDrawUsage
  );

  const particles =
    Array.from(
      {
        length: CONFETTI_COUNT,
      },

      (_, index) => {
        mesh.setColorAt(
          index,
          new THREE.Color(
            CONFETTI_COLORS[
              index % CONFETTI_COLORS.length
            ]
          ),
        );

        return {
          position:
            new THREE.Vector3(),

          velocity:
            new THREE.Vector3(),

          rotation:
            new THREE.Euler(),

          angularVelocity:
            new THREE.Vector3(),

          scale:
            new THREE.Vector3(),
        };
      },
    );

  mesh.instanceColor.needsUpdate = true;

  scene.add(
    mesh
  );

  let active = false;
  let startedAt = 0;
  let previousTime = 0;


  function updateMatrices() {
    particles.forEach(
      (particle, index) => {
        dummy.position.copy(
          particle.position
        );

        dummy.rotation.copy(
          particle.rotation
        );

        dummy.scale.copy(
          particle.scale
        );

        dummy.updateMatrix();

        mesh.setMatrixAt(
          index,
          dummy.matrix,
        );
      },
    );

    mesh.instanceMatrix.needsUpdate = true;
  }


  function burst(origin) {
    particles.forEach((particle) => {
      particle.position
        .copy(origin)
        .add(
          new THREE.Vector3(
            randomBetween(-0.22, 0.22),
            randomBetween(-0.05, 0.18),
            randomBetween(-0.18, 0.18),
          )
        );

      particle.velocity.set(
        randomBetween(-1.65, 1.65),
        randomBetween(2.4, 4.3),
        randomBetween(-1.35, 1.35),
      );

      particle.rotation.set(
        randomBetween(0, Math.PI * 2),
        randomBetween(0, Math.PI * 2),
        randomBetween(0, Math.PI * 2),
      );

      particle.angularVelocity.set(
        randomBetween(-8, 8),
        randomBetween(-8, 8),
        randomBetween(-8, 8),
      );

      const size =
        randomBetween(0.065, 0.11);

      particle.scale.set(
        size,
        size * randomBetween(0.38, 0.62),
        1,
      );
    });

    active = true;
    startedAt = 0;
    previousTime = 0;

    material.opacity = 1;
    mesh.visible = true;

    updateMatrices();
  }


  function update(elapsedTime) {
    if (!active) return;

    if (startedAt === 0) {
      startedAt = elapsedTime;
      previousTime = elapsedTime;
    }

    const age =
      elapsedTime - startedAt;

    const deltaTime =
      Math.min(
        elapsedTime - previousTime,
        0.05,
      );

    previousTime = elapsedTime;

    for (const particle of particles) {
      particle.velocity.y -=
        GRAVITY * deltaTime;

      particle.position.addScaledVector(
        particle.velocity,
        deltaTime,
      );

      particle.rotation.x +=
        particle.angularVelocity.x
        * deltaTime;

      particle.rotation.y +=
        particle.angularVelocity.y
        * deltaTime;

      particle.rotation.z +=
        particle.angularVelocity.z
        * deltaTime;
    }

    material.opacity =
      THREE.MathUtils.clamp(
        (CONFETTI_DURATION - age) / 0.7,
        0,
        1,
      );

    updateMatrices();

    if (age >= CONFETTI_DURATION) {
      active = false;
      mesh.visible = false;
    }
  }


  function reset() {
    active = false;
    mesh.visible = false;
    material.opacity = 1;
  }


  return {
    burst,
    update,
    reset,
  };
}
