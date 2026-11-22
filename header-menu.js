(() => {
  const header = document.querySelector(".header-inner");
  if (!header) return;

  const controls = header.querySelector(".header-mobile-actions");
  const toggle = header.querySelector(".header-menu-toggle");
  if (!controls || !toggle) return;

  function setOpen(open) {
    header.dataset.menuOpen = String(open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  header.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true" || !toggle.getClientRects().length) return;
    event.preventDefault();
    setOpen(false);
    toggle.focus();
  });

  setOpen(false);
  controls.hidden = false;
})();
