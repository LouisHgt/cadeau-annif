import { gsap } from "gsap";

export function playGiftDrop(gift) {
  gift.position.set(0, 6, 0);

  gift.rotation.set(
    -0.15,
    0.2,
    0.1,
  );

  const timeline = gsap.timeline();

  timeline
    .to(gift.position, {
      y: 0,
      duration: 0.72,
      ease: "power3.in",
    })

    // premier rebond
    .to(gift.position, {
      y: 0.32,
      duration: 0.12,
      ease: "power2.out",
    })

    .to(gift.position, {
      y: 0,
      duration: 0.14,
      ease: "power2.in",
    })

    // deuxième petit rebond
    .to(gift.position, {
      y: 0.11,
      duration: 0.08,
      ease: "power1.out",
    })

    .to(gift.position, {
      y: 0,
      duration: 0.1,
      ease: "power1.in",
    })

    // remise droite
    .to(
      gift.rotation,
      {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.3,
        ease: "power2.out",
      },
      "-=0.2",
    );

  return timeline;
}