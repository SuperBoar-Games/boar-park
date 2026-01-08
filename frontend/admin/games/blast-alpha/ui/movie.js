import { loadHeroDetails } from "./hero.js";
import { Icons } from "../../../../components/icons.js";

const contentSection = document.getElementById("content-section");

export async function loadMovieDetails(movieId, heroId) {
  try {
    const res = await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&heroId=${heroId}&movieId=${movieId}`
    );

    if (!res.ok) {
      contentSection.innerHTML = `<p>Error loading movie details</p>`;
      return;
    }

    const { data: movieDetails } = await res.json();

    // Hard replace DOM (kills stale refs)
    contentSection.replaceChildren();
    contentSection.innerHTML = generateMovieCards(movieDetails);
    contentSection.setAttribute("data-section", "movie");

    /* ================= EVENT DELEGATION ================= */

    contentSection.onclick = async (e) => {
      const dropdownBtn = e.target.closest(".dropdown-button");
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

      /* ---------- Dropdown toggle ---------- */
      if (dropdownBtn) {
        e.stopPropagation();
        const dropdown = dropdownBtn.closest(".dropdown");

        contentSection
          .querySelectorAll(".dropdown.open")
          .forEach((d) => d !== dropdown && d.classList.remove("open"));

        dropdown.classList.toggle("open");
        return;
      }

      /* ---------- Review toggle ---------- */
      if (reviewBtn) {
        e.stopPropagation();

        const cardEl = reviewBtn.closest(".movie-card-details");
        const cardId = cardEl.dataset.movieCardId;
        const needReview = reviewBtn.dataset.needReview === "true";

        const response = await fetch(
          `/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cardId: cardId,
              need_review: needReview ? "F" : "T",
            }),
          }
        );

        if (!response.ok) {
          alert("Failed to update review status");
          return;
        }

        // Update UI locally
        reviewBtn.dataset.needReview = String(!needReview);
        reviewBtn.textContent = !needReview
          ? "Mark Resolved"
          : "Mark for Review";

        cardEl.querySelector(".review-flag").style.display =
          !needReview ? "inline" : "none";

        cardEl.querySelector(".dropdown")?.classList.remove("open");
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
          <button class="review-flag" style="display: ${
            detail.need_review === "T" ? "inline" : "none"
          };" title="Needs Review">${Icons.review}</button>
          <button class="edit" title="Edit Card">${Icons.edit}</button>
          <div class="dropdown">
            <button class="dropdown-button">⋮</button>
            <div class="dropdown-content">
              <button class="review-action" data-card-id="${
                detail.id
              }" data-need-review="${detail.need_review === "T"}">${
        detail.need_review === "T" ? "Mark Resolved" : `${Icons.review} Mark for Review`
      }</button>
              <button class="delete" data-movie-id="${
                detail.id
              }" title="Delete Card">${Icons.delete} Delete</button>
            </div>
          </div>
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

const cardTypes = ["NONE", "HERO", "VILLAIN", "SR1", "SR2", "WC"];

async function addOrEditCardModal(editFlag, editData = {}, movieId, heroId) {
  editData = editData || {};

  const modal = document.createElement("div");
  modal.className = "modal";

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

  // auto-grow textareas
  modal.querySelectorAll("textarea.autogrow").forEach((ta) => {
    autoGrowTextarea(ta);
    ta.addEventListener("input", () => autoGrowTextarea(ta));
  });

  modal.querySelector(".close").onclick = () => modal.remove();

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
    modal.remove();
  };

  // click outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  // escape key (scoped + cleaned)
  const escHandler = (e) => {
    if (e.key === "Escape") {
      modal.remove();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);

  // focus first field
  modal.querySelector("select[name='type']").focus();

  return modal;
}


function autoGrowTextarea(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

