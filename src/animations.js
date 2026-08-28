import { gsap } from "gsap";

export function playGiftDrop(
  gift,
  {
    finalYRotation = -Math.PI * 0.22,
  } = {}
) {
  gsap.killTweensOf(gift.position);
  gsap.killTweensOf(gift.rotation);

  // Position / orientation de départ
  gift.position.set(0, 7, 0);

  // On arrive déjà légèrement incliné,
  // avec une rotation plus importante que l'angle final,
  // pour donner une vraie impression de mouvement.
  gift.rotation.set(
    0.16,
    finalYRotation - Math.PI * 1.35,
    0.32,
  );

  const tl = gsap.timeline();

  // ---------------------------------------
  // Chute principale + rotation
  // ---------------------------------------

  tl.to(
    gift.position,
    {
      y: 0,
      duration: 0.82,
      ease: "power4.in",
    },
    0
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation + 0.15,
      x: 0.08,
      z: -0.24,
      duration: 0.82,
      ease: "power2.in",
    },
    0
  );

  // ---------------------------------------
  // Premier rebond
  // ---------------------------------------

  tl.to(
    gift.position,
    {
      y: 0.34,
      duration: 0.14,
      ease: "power2.out",
    }
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation - 0.08,
      x: -0.03,
      z: 0.18,
      duration: 0.16,
      ease: "sine.out",
    },
    "<"
  );

  tl.to(
    gift.position,
    {
      y: 0,
      duration: 0.15,
      ease: "power2.in",
    }
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation + 0.05,
      x: 0.03,
      z: -0.10,
      duration: 0.18,
      ease: "sine.inOut",
    },
    "<"
  );

  // ---------------------------------------
  // Deuxième petit rebond
  // ---------------------------------------

  tl.to(
    gift.position,
    {
      y: 0.12,
      duration: 0.09,
      ease: "power1.out",
    }
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation - 0.02,
      x: -0.01,
      z: 0.05,
      duration: 0.11,
      ease: "sine.out",
    },
    "<"
  );

  tl.to(
    gift.position,
    {
      y: 0,
      duration: 0.11,
      ease: "power1.in",
    }
  );

  // ---------------------------------------
  // Stabilisation finale
  // ---------------------------------------

  tl.to(
    gift.rotation,
    {
      x: 0,
      y: finalYRotation,
      z: 0,
      duration: 0.28,
      ease: "power2.out",
    },
    "<"
  );

  return tl;
}