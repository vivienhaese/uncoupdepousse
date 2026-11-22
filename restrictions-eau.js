(() => {
  "use strict";

  const banner = document.querySelector("[data-water-banner]");
  if (!banner) return;

  const details = banner.querySelector("details");
  const commune = banner.querySelector("[data-water-commune]");
  const resource = banner.querySelector("[data-water-resource]");
  const controls = banner.querySelector("[data-water-controls]");
  const status = banner.querySelector("[data-water-status]");
  const results = banner.querySelector("[data-water-results]");
  const checked = banner.querySelector("[data-water-checked]");
  if (!details || !commune || !resource || !controls || !status || !results || !checked) return;

  const endpoint = "https://api.vigieau.gouv.fr/api/zones";
  const refreshInterval = 15 * 60 * 1000;
  const levels = new Map([
    ["vigilance", "Vigilance"],
    ["alerte", "Alerte"],
    ["alerte_renforcee", "Alerte renforcée"],
    ["crise", "Crise"],
  ]);
  const resourceTypes = new Set(["AEP", "SOU", "SUP"]);
  const dateFormat = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });
  let pending;
  let lastAttempt = 0;
  let lastSuccess;

  function appendText(parent, tag, value, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value;
    parent.append(element);
    return element;
  }

  function officialOrderLink(order) {
    if (typeof order?.cheminFichier !== "string") return null;
    try {
      const url = new URL(order.cheminFichier);
      if (url.protocol === "https:" && !url.username && !url.password) return url.href;
    } catch {
      return null;
    }
    return null;
  }

  function isGardenWatering(usage) {
    return usage?.thematique === "Arroser" &&
      usage.concerneParticulier !== false &&
      typeof usage.nom === "string" &&
      /\b(jardins?|pelouses?|massifs?|potagers?)\b/i.test(usage.nom) &&
      typeof usage.description === "string" &&
      usage.description.trim();
  }

  function renderZones(zones) {
    const list = document.createElement("ul");
    list.className = "water-zone-list";

    for (const zone of zones) {
      const item = document.createElement("li");
      const title = appendText(item, "p", "");
      const level = levels.get(zone.niveauGravite);
      const name = typeof zone.nom === "string" ? zone.nom.trim() : "";
      appendText(title, "strong", name ? `${name} · ${level}` : level);

      if (Array.isArray(zone.usages)) {
        for (const usage of zone.usages.filter(isGardenWatering)) {
          const heading = appendText(item, "p", "");
          appendText(heading, "strong", usage.nom);
          appendText(item, "p", usage.description.trim(), "water-rule-description");
        }
      }

      const orderLink = officialOrderLink(zone.arrete);
      if (orderLink) {
        const link = appendText(item, "a", "Consulter l’arrêté indiqué par VigiEau");
        link.href = orderLink;
      }
      list.append(item);
    }
    results.replaceChildren(list);
  }

  async function refresh() {
    const code = commune.value;
    const type = resource.value;
    const key = `${code}:${type}`;
    if (pending?.key === key) return;

    pending?.controller.abort();
    const controller = new AbortController();
    pending = { key, controller };
    lastAttempt = Date.now();

    const scope = [commune.selectedOptions[0]?.textContent.trim(), resource.selectedOptions[0]?.textContent.trim()]
      .filter(Boolean)
      .join(" · ");
    const updateStatus = (message) => {
      status.textContent = scope ? `${scope} · ${message}` : message;
    };
    const previousCheck = lastSuccess?.key === key ? lastSuccess.date : null;
    checked.textContent = previousCheck
      ? `Dernière consultation réussie le ${dateFormat.format(previousCheck)} (heure de Paris).`
      : "";
    checked.hidden = !previousCheck;
    results.replaceChildren();

    if (!/^\d{5}$/.test(code) || !resourceTypes.has(type)) {
      updateStatus("Choisissez une commune et un type d’eau");
      pending = null;
      return;
    }

    updateStatus("Consultation de VigiEau…");
    const url = new URL(endpoint);
    url.search = new URLSearchParams({ commune: code, profil: "particulier", zoneType: type });
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
      });
      if (pending?.controller !== controller) return;
      if (response.status === 409) {
        updateStatus("Vérifiez votre adresse sur VigiEau");
        return;
      }
      if (!response.ok) {
        updateStatus("Données VigiEau indisponibles");
        return;
      }

      const data = await response.json();
      if (pending?.controller !== controller) return;
      const zones = Array.isArray(data)
        ? data.filter((zone) => zone?.type === type && levels.has(zone.niveauGravite))
        : [];
      if (!zones.length) {
        updateStatus("Données VigiEau indisponibles");
        return;
      }

      const labels = [...new Set(zones.map((zone) => levels.get(zone.niveauGravite)))];
      renderZones(zones);
      const date = new Date();
      lastSuccess = { key, date };
      checked.textContent = `VigiEau consulté le ${dateFormat.format(date)} (heure de Paris).`;
      checked.hidden = false;
      updateStatus(labels.join(" / "));
    } catch {
      if (pending?.controller === controller) updateStatus("Données VigiEau indisponibles");
    } finally {
      window.clearTimeout(timeout);
      if (pending?.controller === controller) pending = null;
    }
  }

  controls.hidden = false;
  details.addEventListener("toggle", () => {
    if (details.open) refresh();
  });
  commune.addEventListener("change", refresh);
  resource.addEventListener("change", refresh);

  window.setInterval(() => {
    if (!document.hidden) refresh();
  }, refreshInterval);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - lastAttempt >= refreshInterval) refresh();
  });

  if (!document.hidden) refresh();
})();
