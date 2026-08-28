import { gsap } from "gsap";

export function playGiftDrop(
  gift,
  {
    finalYRotation = Math.PI * 0.35,
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
      duration: 1.8,
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
      duration: 1.8,
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
      y: 0.3,
      duration: 0.18,
      ease: "power2.out",
    }
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation - 0.2,
      x: -0.03,
      z: 0.2,
      duration: 0.18,
      ease: "sine.out",
    },
    "<"
  );

  tl.to(
    gift.position,
    {
      y: 0,
      duration: 0.22,
      ease: "power2.in",
    }
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation - 0.2 ,
      x: 0.03,
      z: -0.10,
      duration: 0.22,
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
      duration: 0.22,
      ease: "power1.out",
    }
  );

  tl.to(
    gift.rotation,
    {
      y: finalYRotation - 0.2,
      x: -0.01,
      z: 0.10,
      duration: 0.22,
      ease: "sine.out",
    },
    "<"
  );

  tl.to(
    gift.position,
    {
      y: 0,
      duration: 0.2,
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
      y: finalYRotation - 0.2,
      z: 0,
      duration: 0.2,
      ease: "power2.out",
    },
    "<"
  );

  return tl;
}