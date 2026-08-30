import {
  Howl,
} from "howler";

import fallingSoundUrl
  from "./assets/sounds/falling-cropped.mp3?url";

import backgroundMusicUrl
  from "./assets/sounds/background-cropped.mp3?url";

import openingMusicUrl
  from "./assets/sounds/opening-cropped-sped.mp3?url";

import {
  sleep,
} from "./utils.js";

const fallingSound =
  new Howl({
    src: [fallingSoundUrl],
    loop: false,
    volume: 0.5,
    preload: true,
  });

const backgroundAudio =
  new Howl({
    src: [backgroundMusicUrl],
    loop: true,
    volume: 0.5,
    html5: true,
    preload: false,
  });

const openingAudio =
  new Howl({
    src: [openingMusicUrl],
    loop: false,
    volume: 0.5,
  });


export async function playFallingSound() {
  fallingSound.stop();
  await sleep(500);

  return fallingSound.play();
}


export function playOpeningSound() {
  return openingAudio.play();
}


export function playBackgroundSound() {
  return backgroundAudio.play();
}


export function fadeOutBackgroundSound() {
  backgroundAudio.fade(
    backgroundAudio.volume(),
    0,
    1000,
  );
}


export function fadeInBackgroundSound() {
  backgroundAudio.fade(
    backgroundAudio.volume(),
    1,
    1000,
  );
}
