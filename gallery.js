(() => {
  const interval = 4000;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const labels = {
    fr: {
      pause: "Mettre en pause",
      resume: "Reprendre",
      role: "carrousel",
      position: (index, total) => `Photo ${index} sur ${total}`,
    },
    ca: {
      pause: "Posa en pausa",
      resume: "Reprèn",
      role: "carrusel",
      position: (index, total) => `Foto ${index} de ${total}`,
    },
    en: {
      pause: "Pause",
      resume: "Resume",
      role: "carousel",
      position: (index, total) => `Photo ${index} of ${total}`,
    },
  };
  const language = document.documentElement.lang.toLowerCase().split("-")[0];
  const text = labels[language] ?? labels.fr;

  for (const gallery of document.querySelectorAll("[data-gallery]")) {
    const photos = gallery.querySelector(".gallery-photos");
    const slides = Array.from(gallery.querySelectorAll(".gallery-slide"));
    const controls = gallery.querySelector(".gallery-controls");
    const toggle = gallery.querySelector("[data-gallery-toggle]");
    const previous = gallery.querySelector("[data-gallery-previous]");
    const next = gallery.querySelector("[data-gallery-next]");
    const count = gallery.querySelector("[data-gallery-count]");
    const announcement = gallery.querySelector("[data-gallery-announcement]");

    let current = 0;
    let playing = !reducedMotion.matches;
    let hovering = false;
    let inView = true;
    let timer;
    let swipeStart;

    function show(index, announce = false) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, position) => {
        slide.hidden = position !== current;
      });
      count.textContent = `${current + 1} / ${slides.length}`;
      if (announce) {
        const description = slides[current].querySelector("img").alt;
        announcement.textContent = `${text.position(current + 1, slides.length)}. ${description}`;
      }
    }

    function schedule() {
      window.clearTimeout(timer);
      if (!playing || hovering || !inView || document.hidden) {
        return;
      }
      timer = window.setTimeout(() => {
        show(current + 1);
        schedule();
      }, interval);
    }

    function setPlaying(value) {
      playing = value;
      toggle.textContent = playing ? text.pause : text.resume;
      schedule();
    }

    function move(offset) {
      setPlaying(false);
      show(current + offset, true);
    }

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    toggle.addEventListener("click", () => setPlaying(!playing));

    gallery.addEventListener("focusin", (event) => {
      if (!gallery.contains(event.relatedTarget) && event.target.matches(":focus-visible")) {
        setPlaying(false);
      }
    });
    gallery.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    });
    photos.addEventListener("pointermove", (event) => {
      if (event.pointerType === "mouse" && !hovering) {
        hovering = true;
        schedule();
      }
    });
    photos.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") {
        hovering = false;
        schedule();
      }
    });

    photos.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" && event.isPrimary) {
        swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }
    });
    photos.addEventListener("pointerup", (event) => {
      if (!swipeStart || swipeStart.id !== event.pointerId) {
        return;
      }
      const distanceX = event.clientX - swipeStart.x;
      const distanceY = event.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(distanceX) > 50 && Math.abs(distanceX) > Math.abs(distanceY) * 1.4) {
        move(distanceX < 0 ? 1 : -1);
      }
    });
    photos.addEventListener("pointercancel", () => { swipeStart = null; });

    function respectMotionPreference(event) {
      if (event.matches) {
        setPlaying(false);
      }
    }

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", respectMotionPreference);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(respectMotionPreference);
    }

    show(0);
    gallery.dataset.galleryReady = "";
    gallery.setAttribute("aria-roledescription", text.role);
    controls.hidden = false;
    photos.removeAttribute("tabindex");
    photos.removeAttribute("role");
    photos.removeAttribute("aria-label");
    document.addEventListener("visibilitychange", schedule);
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        schedule();
      });
      observer.observe(photos);
    }

    setPlaying(playing);
  }
})();
