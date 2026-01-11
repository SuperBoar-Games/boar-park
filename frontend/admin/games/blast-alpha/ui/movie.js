import { loadHeroDetails } from "./hero.js";
import { Icons } from "../../../../components/icons.js";

const contentSection = document.getElementById("content-section");

/* ================= STATE ================= */
const movieCardStore = new Map();

/* ================= LOAD MOVIE DETAILS ================= */

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

    // cache cards
    movieCardStore.clear();
    movieDetails.forEach((card) =>
      movieCardStore.set(String(card.id), card)
    );

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

      /* ---------- Dropdown ---------- */
      if (dropdownBtn) {
        e.stopPropagation();
        const dropdown = dropdownBtn.closest(".dropdown");

        contentSection
          .querySelectorAll(".dropdown.open")
          .forEach((d) => d !== dropdown && d.classList.remove("open"));

        dropdown.classList.toggle("open");
        return;
      }

      /* ---------- Review Toggle ---------- */
      if (reviewBtn) {
        e.stopPropagation();

        const cardEl = reviewBtn.closest(".movie-card-details");
        const cardId = cardEl.dataset.movieCardId;
        const card = movieCardStore.get(cardId);
        const needReview = card.need_review === "T";

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

        // update store
        card.need_review = needReview ? "F" : "T";

        // update UI
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
        const cardId = cardEl.dataset.movieCardId;
        const cardData = movieCardStore.get(cardId);

        if (!cardData) {
          alert("Card data not found");
          return;
        }

        addOrEditCardModal(true, cardData, movieId, heroId);
        return;
      }

      /* ---------- Delete ---------- */
      if (deleteBtn) {
        e.stopPropagation();

        const cardEl = deleteBtn.closest(".movie-card-details");
        const cardId = cardEl.dataset.movieCardId;
        const card = movieCardStore.get(cardId);

        if (
          !confirm(
            `Are you sure you want to delete "${card?.name}"? This cannot be undone.`
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

        await loadMovieDetails(movieId, heroId);
      }
    };
  } catch (err) {
    console.error(err);
    contentSection.innerHTML = `<p>Failed to load movie details</p>`;
  }
}

/* ================= UI ================= */

function generateMovieCards(movieDetails = []) {
  const cards = movieDetails
    .map(
      (detail) => `
    <div class="movie-card-details" data-movie-card-id="${detail.id}">
      <div class="card-header">
        <span class="card-type">${detail.type}</span>
        <div class="card-actions">
          <button class="review-flag" style="display:${
            detail.need_review === "T" ? "inline" : "none"
          }" title="Needs Review">${Icons.review}</button>
          <button class="edit">${Icons.edit}</button>
          <div class="dropdown">
            <button class="dropdown-button">⋮</button>
            <div class="dropdown-content">
              <button class="review-action" data-need-review="${
                detail.need_review === "T"
              }">
                ${
                  detail.need_review === "T"
                    ? "Mark Resolved"
                    : `${Icons.review} Mark for Review`
                }
              </button>
              <button class="delete">${Icons.delete} Delete</button>
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
          <span>1. ${detail.ability_text || "No ability text available"}</span>
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

/* ================= MODAL ================= */

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
            ${["HERO","VILLAIN","SR1","SR2","WC"]
              .map(
                (t) =>
                  `<option value="${t}" ${
                    editData.type === t ? "selected" : ""
                  }>${t}</option>`
              )
              .join("")}
          </select>
        </label>

        <label>Name <input name="name" required value="${editData.name || ""}"></label>
        <label>Call Sign <input name="call_sign" value="${editData.call_sign || ""}"></label>
        <label>Ability <textarea name="ability_text" required>${editData.ability_text || ""}</textarea></label>
        <label>Ability 2 <textarea name="ability_text2">${editData.ability_text2 || ""}</textarea></label>

        <span class="error-text"></span>
        <button type="submit">${editFlag ? "Update" : "Add"} Card</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close").onclick = () => modal.remove();
  modal.addEventListener("click", (e) => e.target === modal && modal.remove());

  modal.querySelector("#card-form").onsubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.target);

    const payload = {
      cardId: editFlag ? editData.id : undefined,
      movieId,
      heroId,
      type: fd.get("type"),
      name: fd.get("name"),
      call_sign: fd.get("call_sign") || "",
      ability_text: fd.get("ability_text") || "",
      ability_text2: fd.get("ability_text2") || "",
    };

    const res = await fetch(
      `/api-proxy/games/?gameSlug=blast-alpha&queryKey=card`,
      {
        method: editFlag ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      modal.querySelector(".error-text").textContent =
        "Failed to save card.";
      return;
    }

    await loadMovieDetails(movieId, heroId);
    modal.remove();
  };
}

