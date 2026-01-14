import { loadHeroDetails } from "./hero.js";
import { Icons } from "../../../../components/icons.js";

const contentSection = document.getElementById("content-section");

export async function loadMovieDetails(movieId, heroId) {
  try {
    const res = await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&queryKey=card&heroId=${heroId}&movieId=${movieId}`
    );

    if (!res.ok) {
      contentSection.innerHTML = `<p>Error loading movie details</p>`;
      return;
    }
    const { data: movieDetails } = await res.json();

    const tagsRes = await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&queryKey=tags`
    );
    
    if (!tagsRes.ok) {
      contentSection.innerHTML = `<p>Error loading tags</p>`;
      return;
    }
    const { data: rawTags } = await tagsRes.json();

    const allTags = rawTags.map(t => t.name);

    // Hard replace DOM (kills stale refs)
    contentSection.replaceChildren();
    contentSection.innerHTML = generateMovieCards(movieDetails);
    initMovieTags(contentSection, allTags);
    contentSection.setAttribute("data-section", "movie");

    /* ================= EVENT DELEGATION ================= */

    contentSection.onclick = async (e) => {
      const reviewBtn = e.target.closest(".review-action");
      const editBtn = e.target.closest(".edit");
      const deleteBtn = e.target.closest(".delete");
      const backBtn = e.target.closest("#back-to-movies");
      const addBtn = e.target.closest("#add-card");

      /* ---------- Back ---------- */
      if (backBtn) {
        history.pushState(
          { section: "hero", heroId },
          "",
          `/admin/games/blast-alpha/?heroId=${heroId}`
        );
        loadHeroDetails(heroId);
        return;
      }

      /* ---------- Add ---------- */
      if (addBtn) {
        addOrEditCardModal(false, null, movieId, heroId);
        return;
      }

      /* ---------- Review toggle ---------- */
      if (reviewBtn) {
        const cardEl = reviewBtn.closest(".movie-card-details");
        const cardId = cardEl.dataset.movieCardId;
        const needReview = reviewBtn.dataset.needReview === "true";

        const response = await fetch(
          `/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cardId,
              need_review: needReview ? "F" : "T",
            }),
          }
        );

        if (!response.ok) {
          alert("Failed to update review status");
          return;
        }

        reviewBtn.dataset.needReview = String(!needReview);
        reviewBtn.innerHTML = !needReview ? Icons.flagSolid : Icons.flagRegular;
        reviewBtn.title = !needReview
          ? "Mark as Resolved"
          : "Mark for Review";

       return;
      }

      /* ---------- Edit ---------- */
      if (editBtn) {
        e.stopPropagation();

        const cardEl = editBtn.closest(".movie-card-details");

        const spans = cardEl.querySelectorAll(".ability-content span");

        const cardData = {
          id: cardEl.dataset.movieCardId,
          name: cardEl.querySelector("h1")?.textContent.trim() || "",
          call_sign:
            cardEl.querySelector(".call-sign-content")?.textContent.trim() ||
            "",
          type: cardEl.querySelector(".card-type")?.textContent.trim() || "",
          ability_text: spans[0]?.textContent.replace(/^\d+\.\s*/, "").trim() || "",
          ability_text2: spans[1]?.textContent.replace(/^\d+\.\s*/, "").trim() || "",
        };

        addOrEditCardModal(true, cardData, movieId, heroId);
        return;
      }

      /* ---------- Delete ---------- */
      if (deleteBtn) {
        e.stopPropagation();

        const cardEl = deleteBtn.closest(".movie-card-details");
        const cardId = cardEl.dataset.movieCardId;
        const name = cardEl.querySelector("h1")?.textContent.trim();

        if (
          !confirm(
            `Are you sure you want to delete "${name}"? This cannot be undone.`
          )
        ) {
          return;
        }

        const response = await fetch(
          `/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardId }),
          }
        );

        if (!response.ok) {
          alert("Failed to delete card");
          return;
        }

        // Clean refresh
        await loadMovieDetails(movieId, heroId);
        return;
      }
    };
  } catch (err) {
    console.error(err);
    contentSection.innerHTML = `<p>Failed to load movie details</p>`;
  }
}

function generateMovieCards(movieDetails = []) {
  const cards = movieDetails
    .map(
      (detail) => `
    <div class="movie-card-details" data-movie-card-id="${detail.id}">
      <div class="card-header">
        <span class="card-type">${detail.type}</span>

        <div class="card-actions">
          <button
            class="review-action"
            data-need-review="${detail.need_review === "T"}"
            title="${detail.need_review === "T" ? "Mark as Resolved" : "Mark for Review"}"
          >
            ${detail.need_review === "T" ? Icons.flagSolid : Icons.flagRegular}
          </button>

          <button class="edit" title="Edit Card">
            ${Icons.edit}
          </button>

          <button class="delete" title="Delete Card">
            ${Icons.delete}
          </button>

        </div>
      </div>

      <div class="card-body">
        <h1>${detail.name}</h1>

        <h4>Call Sign:</h4>
        <span class="call-sign-content">${detail.call_sign || ""}</span>

        <h4>Ability:</h4>
        <div class="ability-content">
          <span>1. ${detail.ability_text ?? "No ability text available"}</span>
          ${
            detail.ability_text2
              ? `<br /><span>2. ${detail.ability_text2}</span>`
              : ""
          }
        </div>
      
        <div class="card-footer">
          <div class="movie-tags" data-card-id="${detail.id}" data-tags="${detail.tags || ""}">
            <strong>Tags:</strong>
            <div class="tags-list"></div>
            <button class="add-tag-button">Add Tag</button>
          </div>
        </div>

      </div>
    </div>
  `
    )
    .join("");

  return `
    <div class="title-header">
      <h2>Movie Details</h2>
      <button id="back-to-movies">Back to Movies</button>
      <button id="add-card">Add Card</button>
    </div>

    <div class="movie-cards-container">
      ${cards || "<p>No movie cards found.</p>"}
    </div>
  `;
}


async function addOrEditCardModal(editFlag, editData = {}, movieId, heroId) {
  editData = editData || {};

  const modal = document.createElement("div");
  modal.className = "modal";
  // 1. Allow the modal div to receive focus programmatically
  modal.setAttribute("tabindex", "-1");

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${editFlag ? "Edit" : "Add"} Card</h2>

      <form id="card-form">
        <label>
          Type
          <select name="type" required>
            <option value="">Select type</option>
            <option value="HERO" ${editData.type === "HERO" ? "selected" : ""}>HERO</option>
            <option value="VILLAIN" ${editData.type === "VILLAIN" ? "selected" : ""}>VILLAIN</option>
            <option value="SR1" ${editData.type === "SR1" ? "selected" : ""}>SR1</option>
            <option value="SR2" ${editData.type === "SR2" ? "selected" : ""}>SR2</option>
            <option value="WC" ${editData.type === "WC" ? "selected" : ""}>WC</option>
          </select>
        </label>

        <label>
          Name
          <input name="name" required value="${editData.name ?? ""}">
        </label>

        <label>
          Call Sign
          <input name="call_sign" value="${editData.call_sign ?? ""}">
        </label>

        <label>
          Ability
          <textarea name="ability_text" class="autogrow" required>${editData.ability_text ?? ""}</textarea>
        </label>

        <label>
          Ability 2
          <textarea name="ability_text2" class="autogrow">${editData.ability_text2 ?? ""}</textarea>
        </label>

        <span class="error-text"></span>

        <button type="submit">${editFlag ? "Update" : "Add"} Card</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector("#card-form");
  const errorEl = modal.querySelector(".error-text");

  // --- Setup cleanup controller ---
  const controller = new AbortController();

  const closeModal = () => {
    if (modal.isConnected) modal.remove();
    controller.abort(); // Removes the window listener
  };

  // auto-grow textareas
  modal.querySelectorAll("textarea.autogrow").forEach((ta) => {
    autoGrowTextarea(ta);
    ta.addEventListener("input", () => autoGrowTextarea(ta));
  });

  // Close on X
  modal.querySelector(".close").onclick = () => closeModal();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const type = fd.get("type");
    const name = fd.get("name");

    if (!type || type === "NONE") {
      errorEl.textContent = "Card Type cannot be NONE.";
      return;
    }
    if (!name) {
      errorEl.textContent = "Name is required.";
      return;
    }

    const payload = {
      cardId: editFlag ? editData.id : undefined,
      movieId: movieId,
      heroId,
      type,
      name,
      call_sign: fd.get("call_sign") || "",
      ability_text: fd.get("ability_text") || "",
      ability_text2: fd.get("ability_text2") || "",
    };

    const response = await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`,
      {
        method: editFlag ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const msg = await response.json();
      console.error("Card save failed:", msg);
      errorEl.textContent = "Failed to save card.";
      return;
    }

    await loadMovieDetails(movieId, heroId);
    closeModal();
  };

  // Close on click outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // --- Window Listener ---
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") {
        // Prevent default browser actions (like blurring a field)
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    },
    { capture: true, signal: controller.signal }
  );

  modal.focus(); 

  return modal;
}


function autoGrowTextarea(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function initMovieTags(root, allTags) {
  root.querySelectorAll(".movie-tags").forEach(container => {
    if (!container.dataset.tags) {
      container.dataset.tags = "";
    }
    renderTags(container);
  });

  root.addEventListener("click", e => {
    /* ---------- Remove tag ---------- */
    const removeBtn = e.target.closest(".remove-tag");
    if (removeBtn) {
      const container = removeBtn.closest(".movie-tags");
      const tag = removeBtn.dataset.tag;
      updateTags(container, t => t.filter(x => x !== tag));
      return;
    }

    /* ---------- Add tag ---------- */
    const addBtn = e.target.closest(".add-tag-button");
    if (!addBtn) return;

    const container = addBtn.closest(".movie-tags");
    if (container.querySelector(".tag-input-wrapper")) return;

    /* ---------- Wrapper ---------- */

    const wrapper = document.createElement("div");
    wrapper.className = "tag-input-wrapper";

    /* ---------- Input ---------- */

    const input = document.createElement("input");
    input.className = "tag-input";

    /* ---------- Dropdown ---------- */

    const dropdown = document.createElement("div");
    dropdown.className = "tag-suggestions";

    wrapper.append(input, dropdown);
    container.append(wrapper);

    // --- unified close + cleanup ---
    const ac = new AbortController();
    const { signal } = ac;

    const close = () => {
      if (!wrapper.isConnected) return;
      wrapper.remove();
      ac.abort(); // removes ALL listeners registered with { signal }
    };
    
    // Escape: capture phase, stop immediately (prevents "needs 2 Esc" + blur weirdness)
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        close();
      },
      { capture: true, signal }
    );

    // Also allow Esc when input handler is doing arrows/enter logic
    input.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          close();
          return;
        }
      },
      { signal }
    );

    // Outside click closes
    setTimeout(() => {
      document.addEventListener(
        "mousedown",
        (e) => {
          if (!wrapper.contains(e.target)) close();
        },
        { signal }
      );
    });

    // If input loses focus completely (tab away), close
    input.addEventListener(
      "blur",
      () => {
        // if focus moves into dropdown, don't close
        setTimeout(() => {
          if (!wrapper.contains(document.activeElement)) close();
        }, 0);
      },
      { signal }
    );
    
    let index = -1;

    const getTags = () =>
      (container.dataset.tags || "").split(",").filter(Boolean);

    const setSuggestions = () => {
      const value = input.value.toLowerCase();
      const existing = getTags();

      const matches = allTags
        .filter(t =>
          typeof t === "string" &&
          t.toLowerCase().includes(value) &&
          !existing.includes(t)
        )
        .slice(0, 6);

      dropdown.innerHTML = matches
        .map((t, i) => `<div data-i="${i}">${t}</div>`)
        .join("");

      index = -1;
    };

    const commit = (tag) => {
      updateTags(container, t => [...t, tag]);
      wrapper.remove();
    };

    /* ---------- Events ---------- */

    input.addEventListener("input", setSuggestions);
    input.addEventListener("focus", setSuggestions);

    input.addEventListener("keydown", e => {
      const items = dropdown.children;
      console.log(e.key)

      if (e.key === "ArrowDown") {
        e.preventDefault();
        index = Math.min(index + 1, items.length - 1);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        index = Math.max(index - 1, 0);
      }

      if (e.key === "Enter" && index >= 0) {
        e.preventDefault();
        commit(items[index].textContent);
        return;
      }

      [...items].forEach((el, i) =>
        el.classList.toggle("active", i === index)
      );
    });

    dropdown.addEventListener("mousedown", e => {
      if (e.target.dataset.i) {
        e.preventDefault(); // prevents input blur race
        commit(e.target.textContent);
      }
    });

    /* ---------- Outside click ---------- */

    setTimeout(() => {
      const outside = (e) => {
        if (!wrapper.contains(e.target)) {
          wrapper.remove();
          document.removeEventListener("mousedown", outside);
        }
      };
      document.addEventListener("mousedown", outside);
    });

    input.focus();

  });
}

function renderTags(container) {
  const list = container.querySelector(".tags-list");

  const raw = container.dataset.tags || "";
  const tags = raw
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  list.innerHTML = tags.length
    ? tags.map(t => `
        <span class="tag">
          ${t}
          <button class="remove-tag" data-tag="${t}"><i class="fa-solid fa-x"></i></button>
        </span>
      `).join("")
    : `<span class="tag muted">No tags</span>`;
}


function updateTags(container, updater) {
  const tags = updater(
    container.dataset.tags.split(",").filter(Boolean)
  );

  container.dataset.tags = tags.join(",");
  renderTags(container);

  // Persist to backend
  const cardId = container.dataset.cardId;

  fetch(
    `/api-proxy/games/?gameSlug=blast-alpha&queryKey=setTagsForCard`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId,
        tags,
      }),
    }
  ).then(res => {
    if (!res.ok) {
      alert("Failed to update tags");
    }
  }).catch(err => {
    console.error("Tag update error:", err);
    alert("Failed to update tags");
  });
}

