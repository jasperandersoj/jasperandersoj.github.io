(() => {
  const dataCache = new Map();

  function loadRecords(path) {
    if (!dataCache.has(path)) {
      dataCache.set(path, fetch(path).then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${path}: ${response.status}`);
        }
        return response.json();
      }).then((records) => {
        if (!Array.isArray(records)) {
          throw new Error(`${path} must contain a JSON array`);
        }
        return records;
      }));
    }
    return dataCache.get(path);
  }

  function fieldValue(record, field) {
    return field.split(".").reduce((value, part) => value && value[part], record);
  }

  function setField(element, record, list) {
    const field = element.dataset.field;
    if (field === "link" && element instanceof HTMLAnchorElement) {
      const target = list.dataset.detailPage;
      if (!target || !record.slug) {
        element.classList.add("w-dyn-bind-empty");
        return;
      }
      element.href = `${target}?slug=${encodeURIComponent(record.slug)}`;
      element.classList.remove("w-dyn-bind-empty");
      return;
    }

    const value = fieldValue(record, field);
    if (value === undefined || value === null || value === "") {
      element.classList.add("w-dyn-bind-empty");
      if (element instanceof HTMLImageElement) {
        element.removeAttribute("src");
      } else if (element instanceof HTMLAnchorElement) {
        element.removeAttribute("href");
      } else {
        element.textContent = "";
      }
      return;
    }

    if (element instanceof HTMLImageElement) {
      element.src = String(value);
      element.alt = record.imageAlt || record.title || "";
    } else {
      element.textContent = String(value);
    }
    element.classList.remove("w-dyn-bind-empty");
  }

  function filterRecords(records, list) {
    const currentSlug = new URLSearchParams(window.location.search).get("slug");
    const filterField = list.dataset.filterField;
    const filterValue = list.dataset.filterValue === "current-slug"
      ? currentSlug
      : list.dataset.filterValue;

    return records.filter((record) => {
      if (list.dataset.excludeCurrent === "true" && currentSlug && record.slug === currentSlug) {
        return false;
      }
      if (!filterField || filterValue === undefined || filterValue === null) {
        return true;
      }
      return String(fieldValue(record, filterField)).toLowerCase() === filterValue.toLowerCase();
    });
  }

  async function renderList(list) {
    const items = list.querySelector(".w-dyn-items");
    const empty = list.querySelector("[data-cms-empty]");
    const template = items && items.querySelector(".w-dyn-item");
    if (!items || !template || !list.dataset.json) {
      throw new Error("CMS list requires a JSON path and a .w-dyn-item template");
    }

    const templateClone = template.cloneNode(true);
    items.replaceChildren();
    if (empty) {
      empty.style.display = "none";
    }

    try {
      const records = filterRecords(await loadRecords(list.dataset.json), list);
      if (records.length === 0) {
        if (empty) {
          empty.style.display = "";
        }
        return;
      }

      records.forEach((record) => {
        const item = templateClone.cloneNode(true);
        item.querySelectorAll("[data-field]").forEach((element) => setField(element, record, list));
        items.appendChild(item);
      });
    } catch (error) {
      console.error("CMS list rendering failed.", error);
      if (empty) {
        const message = empty.querySelector("[data-cms-empty-message]");
        if (message) {
          message.textContent = "Unable to load items.";
        }
        empty.style.display = "";
      }
    }
  }

  document.querySelectorAll("[data-cms-list]").forEach((list) => {
    renderList(list);
  });
})();
