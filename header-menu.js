(() => {
  const header = document.querySelector(".header-inner");
  if (!header) return;

  const controls = header.querySelector(".header-mobile-actions");
  const toggle = header.querySelector(".header-menu-toggle");
  const navigation = header.querySelector(".header-nav");
  const reviews = header.querySelector(".header-google-reviews");
  if (!controls || !toggle || !navigation || !reviews) return;

  const mobile = window.matchMedia("(max-width: 767px)");

  function placeReviews() {
    const alreadyBeforeNavigation = reviews.nextElementSibling === navigation;
    if (mobile.matches === alreadyBeforeNavigation) return;

    const focusedReview = reviews.contains(document.activeElement) ? document.activeElement : null;
    if (mobile.matches) navigation.before(reviews);
    else navigation.after(reviews);
    focusedReview?.focus({ preventScroll: true });
  }

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

  placeReviews();
  if (typeof mobile.addEventListener === "function") {
    mobile.addEventListener("change", placeReviews);
  } else if (typeof mobile.addListener === "function") {
    mobile.addListener(placeReviews);
  }

  setOpen(false);
  controls.hidden = false;
})();
