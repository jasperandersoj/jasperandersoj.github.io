(() => {
  function fieldValue(record, field) {
    return field.split(".").reduce((value, part) => value && value[part], record);
  }

  function safeFragment(markup) {
    const template = document.createElement("template");
    template.innerHTML = markup;
    template.content.querySelectorAll("script, style, iframe, object, embed, form").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        const hasScheme = /^[a-z][a-z0-9+.-]*:/.test(value);
        const allowedScheme = name === "href"
          ? /^(https?:|mailto:|tel:)/
          : /^https?:/;
        if (
          name.startsWith("on")
          || name === "style"
          || name === "srcdoc"
          || name === "srcset"
          || ((name === "href" || name === "src") && hasScheme && !allowedScheme.test(value))
        ) {
          node.removeAttribute(attribute.name);
        }
      });
      if (node instanceof HTMLAnchorElement && node.target === "_blank") {
        node.rel = "noopener noreferrer";
      }
    });
    return template.content;
  }

  function setField(element, record) {
    const value = fieldValue(record, element.dataset.field);
    if (element.dataset.fieldType === "images") {
      element.replaceChildren();
      (Array.isArray(value) ? value : []).forEach((src) => {
        if (typeof src !== "string" || !src) {
          return;
        }
        const image = document.createElement("img");
        image.src = src;
        image.alt = record.title || "";
        image.loading = "lazy";
        element.appendChild(image);
      });
      element.hidden = element.childElementCount === 0;
      return;
    }

    if (value === undefined || value === null || value === "") {
      element.classList.add("w-dyn-bind-empty");
      element.hidden = true;
      if (element instanceof HTMLImageElement) {
        element.removeAttribute("src");
      } else {
        element.textContent = "";
      }
      return;
    }

    element.hidden = false;
    if (element instanceof HTMLImageElement) {
      element.src = String(value);
      element.alt = record.title || "";
    } else if (element.dataset.format === "html") {
      element.replaceChildren(safeFragment(String(value)));
    } else {
      element.textContent = String(value);
    }
    element.classList.remove("w-dyn-bind-empty");
  }

  function renderRepeats(record) {
    document.querySelectorAll("template[data-cms-repeat]").forEach((template) => {
      const key = template.dataset.cmsRepeat;
      const container = document.querySelector(`[data-cms-repeat-container="${key}"]`);
      const values = fieldValue(record, key);
      if (!container || !Array.isArray(values)) {
        return;
      }

      container.replaceChildren();
      values.filter((value) => value.enabled !== false).forEach((value) => {
        const fragment = template.content.cloneNode(true);
        fragment.querySelectorAll("[data-field]").forEach((element) => setField(element, value));
        container.appendChild(fragment);
      });
    });
  }

  function showState(content, state, message) {
    content.style.display = "none";
    state.textContent = message;
    state.hidden = false;
  }

  async function renderDetail() {
    const content = document.querySelector("[data-cms-detail-content]");
    const state = document.querySelector("[data-cms-not-found]");
    if (!content || !state) {
      return;
    }

    const slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) {
      showState(content, state, "Not found");
      return;
    }

    try {
      const response = await fetch(content.dataset.json);
      if (!response.ok) {
        throw new Error(`Could not load ${content.dataset.json}: ${response.status}`);
      }
      const records = await response.json();
      if (!Array.isArray(records)) {
        throw new Error(`${content.dataset.json} must contain a JSON array`);
      }
      const record = records.find((item) => item.slug === slug);
      if (!record) {
        showState(content, state, "Not found");
        return;
      }

      document.title = `${record.title || record.name || "Untitled"} | Jasper Anderson`;
      content.querySelectorAll("[data-field]").forEach((element) => setField(element, record));
      renderRepeats(record);
      state.hidden = true;
      content.style.display = "";
    } catch (error) {
      console.error("CMS detail rendering failed.", error);
      showState(content, state, "Unable to load this page.");
    }
  }

  renderDetail();
})();
