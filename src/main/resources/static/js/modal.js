// Modal (overlay): shows content on top of the page without leaving it.
// It closes with: the X button, the "Back" button, the Escape key,
// or a click on the dark background.

let activeModal = null; // only one modal can be open at a time

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function openModal({ label = "Details" } = {}) {
  closeModal();
  const previousFocus = document.activeElement; // to give the focus back when closing

  const overlay = el("div", "modal-overlay"); // the dark background
  const dialog = el("div", "modal");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", label);
  dialog.tabIndex = -1;

  const closeButton = el("button", "modal__close", "×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close");
  const bar = el("div", "modal__bar");
  bar.append(closeButton);

  const body = el("div", "modal__body"); // the content goes here
  dialog.append(bar, body);
  overlay.append(dialog);
  document.body.append(overlay);
  document.body.classList.add("modal-open"); // blocks the scroll of the page behind
  dialog.focus();

  function handleKeydown(event) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;

    // Focus trap: Tab keeps cycling inside the modal and never reaches the page behind
    const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((item) => item.offsetParent !== null);
    if (items.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!dialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function close() {
    if (activeModal !== modal) return;
    activeModal = null;
    document.removeEventListener("keydown", handleKeydown);
    overlay.remove();
    document.body.classList.remove("modal-open");
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  }

  // Click on the dark background closes the modal (but not when the user
  // starts selecting text inside the modal and releases the mouse outside)
  let pressedOnBackground = false;
  overlay.addEventListener("mousedown", (event) => (pressedOnBackground = event.target === overlay));
  overlay.addEventListener("click", (event) => {
    if (pressedOnBackground && event.target === overlay) close();
  });
  closeButton.addEventListener("click", close);
  document.addEventListener("keydown", handleKeydown);

  // isOpen() lets async code check that the modal was not closed while waiting for a response.
  // requestId lets it ignore old responses when a newer request was started.
  const modal = { body, close, requestId: 0, isOpen: () => activeModal === modal };
  activeModal = modal;
  return modal;
}

function closeModal() {
  if (activeModal) activeModal.close();
}

// "← Back" button: closes the modal
function createBackButton(modal) {
  const button = el("button", "btn btn--ghost btn--push", "← Back");
  button.type = "button";
  button.addEventListener("click", modal.close);
  return button;
}

function createLoading(text) {
  const box = el("div", "status");
  const spinner = el("span", "spinner");
  spinner.setAttribute("aria-hidden", "true");
  box.append(spinner, el("span", null, text));
  return box;
}
