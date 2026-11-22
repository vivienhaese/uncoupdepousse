const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  const fields = Array.from(contactForm.querySelectorAll("[data-label]"));
  const status = contactForm.querySelector("[role='status']");

  for (const field of fields) {
    field.addEventListener("input", () => {
      field.setCustomValidity("");
      status.textContent = "";
    });
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    for (const field of fields) {
      if (field.required && !field.value.trim()) {
        field.setCustomValidity(contactForm.dataset.emptyMessage);
        field.reportValidity();
        return;
      }
    }

    const body = fields
      .filter((field) => field.value.trim())
      .map((field) => {
        const value = field.value.trim().replace(/\r?\n/g, "\r\n");
        return field instanceof HTMLTextAreaElement
          ? `${field.dataset.label}\r\n${value}`
          : `${field.dataset.label} · ${value}`;
      })
      .join("\r\n\r\n");

    const subject = encodeURIComponent(contactForm.dataset.subject);
    const recipient = contactForm.getAttribute("action");
    status.textContent = status.dataset.composedMessage;
    window.location.href = `${recipient}?subject=${subject}&body=${encodeURIComponent(body)}`;
  });

  contactForm.hidden = false;
}
