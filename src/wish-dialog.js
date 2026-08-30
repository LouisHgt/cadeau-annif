const TITLE =
  "FAIS UN VŒU";

const MAX_WISH_LENGTH = 120;
const TYPEWRITER_DELAY = 48;
const CONFIRMATION_DURATION = 700;
const DIALOG_TRANSITION_DURATION = 220;


export async function submitWish(
  wishText,
  {
    signal,
  } = {},
) {
  const normalizedWish =
    wishText.trim();

  if (
    !normalizedWish
    || normalizedWish.length > MAX_WISH_LENGTH
  ) {
    throw new TypeError(
      `A wish must contain between 1 and ${MAX_WISH_LENGTH} characters`
    );
  }

  const response =
    await fetch(
      "/api/wishes",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify({
            wish:
              normalizedWish,
          }),

        signal,
      },
    );

  let result = null;

  if (
    response.headers
      .get("content-type")
      ?.includes("application/json")
  ) {
    result =
      await response.json();
  }

  if (
    !response.ok
    || result?.success === false
  ) {
    throw new Error(
      "The wish could not be saved"
    );
  }

  return result ?? {
    success: true,
  };
}


export function createWishDialog({
  element,
  onComplete = () => {},
}) {
  if (!element) {
    throw new Error(
      "The wish dialog element was not found"
    );
  }

  const form =
    element.querySelector(
      "[data-wish-form]"
    );

  const editor =
    element.querySelector(
      "[data-wish-editor]"
    );

  const title =
    element.querySelector(
      "[data-wish-title]"
    );

  const input =
    element.querySelector(
      "[data-wish-input]"
    );

  const counter =
    element.querySelector(
      "[data-wish-counter]"
    );

  const submitButton =
    element.querySelector(
      "[data-wish-submit]"
    );

  const status =
    element.querySelector(
      "[data-wish-status]"
    );

  const confirmation =
    element.querySelector(
      "[data-wish-confirmation]"
    );

  const requiredElements = {
    form,
    editor,
    title,
    input,
    counter,
    submitButton,
    status,
    confirmation,
  };

  for (const [name, requiredElement]
    of Object.entries(requiredElements)) {
    if (!requiredElement) {
      throw new Error(
        `Wish dialog element "${name}" was not found`
      );
    }
  }

  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

  const timers =
    new Set();

  let requestController = null;
  let isSubmitting = false;
  let showAnimationFrame = null;


  function schedule(
    callback,
    delay,
  ) {
    const timer =
      window.setTimeout(
        () => {
          timers.delete(
            timer
          );

          callback();
        },
        delay,
      );

    timers.add(
      timer
    );

    return timer;
  }


  function clearTimers() {
    for (const timer of timers) {
      window.clearTimeout(
        timer
      );
    }

    timers.clear();
  }


  function updateCounter() {
    counter.textContent =
      `${input.value.length}/${MAX_WISH_LENGTH}`;
  }


  function focusInput() {
    input.focus({
      preventScroll: true,
    });
  }


  function finishTitle() {
    element.dataset.state =
      "editing";

    input.disabled = false;
    submitButton.disabled = false;

    focusInput();
  }


  function typeTitle(
    characters,
    index = 0,
  ) {
    if (index >= characters.length) {
      finishTitle();
      return;
    }

    title.textContent +=
      characters[index];

    schedule(
      () => {
        typeTitle(
          characters,
          index + 1,
        );
      },
      TYPEWRITER_DELAY,
    );
  }


  function startTitle() {
    const characters =
      Array.from(
        TITLE
      );

    element.dataset.state =
      "typing";

    if (reducedMotion.matches) {
      title.textContent = TITLE;
      finishTitle();
      return;
    }

    typeTitle(
      characters
    );
  }


  function resetContent() {
    form.reset();

    title.textContent = "";
    status.textContent = "";
    confirmation.textContent = "";

    editor.hidden = false;
    confirmation.hidden = true;

    input.disabled = true;
    submitButton.disabled = true;

    updateCounter();
  }


  function hideAfterSuccess() {
    element.classList.remove(
      "is-visible"
    );

    element.setAttribute(
      "aria-hidden",
      "true",
    );

    schedule(
      () => {
        element.hidden = true;

        element.dataset.state =
          "hidden";

        onComplete();
      },
      DIALOG_TRANSITION_DURATION,
    );
  }


  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const wishText =
      input.value.trim();

    if (!wishText) {
      status.textContent =
        "ÉCRIS D'ABORD TON VŒU T'ES BETE OU QUOI";

      focusInput();
      return;
    }

    isSubmitting = true;

    input.disabled = true;
    submitButton.disabled = true;
    input.value = "";

    status.textContent = "";
    editor.hidden = true;
    confirmation.hidden = false;
    confirmation.textContent =
      "✦ ENREGISTREMENT...";

    element.dataset.state =
      "sending";

    requestController =
      new AbortController();

    try {
      await submitWish(
        wishText,
        {
          signal:
            requestController.signal,
        },
      );

      requestController = null;

      element.dataset.state =
        "success";

      confirmation.textContent =
        "✓ VAS Y NICKEL TKT J'AI PAS ENREGISTRÉ";

      schedule(
        hideAfterSuccess,
        CONFIRMATION_DURATION,
      );
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      requestController = null;
      isSubmitting = false;

      element.dataset.state =
        "editing";

      confirmation.hidden = true;
      editor.hidden = false;

      input.value = wishText;
      input.disabled = false;
      submitButton.disabled = false;

      status.textContent =
        "ÉCHEC DE L'ENVOI — RÉESSAIE.";

      updateCounter();
      focusInput();
    }
  }


  function show({
    delay = 0,
  } = {}) {
    clearTimers();

    if (showAnimationFrame !== null) {
      window.cancelAnimationFrame(
        showAnimationFrame
      );

      showAnimationFrame = null;
    }

    requestController?.abort();
    requestController = null;
    isSubmitting = false;

    resetContent();

    element.dataset.state =
      "waiting";

    schedule(
      () => {
        element.hidden = false;

        element.setAttribute(
          "aria-hidden",
          "false",
        );

        showAnimationFrame =
          window.requestAnimationFrame(
            () => {
              showAnimationFrame = null;

              element.classList.add(
                "is-visible"
              );

              startTitle();
            }
          );
      },
      delay,
    );
  }


  function reset() {
    clearTimers();

    if (showAnimationFrame !== null) {
      window.cancelAnimationFrame(
        showAnimationFrame
      );

      showAnimationFrame = null;
    }

    requestController?.abort();
    requestController = null;
    isSubmitting = false;

    element.classList.remove(
      "is-visible"
    );

    element.hidden = true;
    element.dataset.state = "hidden";

    element.setAttribute(
      "aria-hidden",
      "true",
    );

    resetContent();
  }


  input.addEventListener(
    "input",
    () => {
      status.textContent = "";
      updateCounter();
    },
  );

  form.addEventListener(
    "submit",
    handleSubmit,
  );

  resetContent();

  return {
    show,
    reset,
  };
}
