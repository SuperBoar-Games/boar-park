import { fetchData } from "../api.js";
import { loadHeroDetails } from "./hero.js";

const contentSection = document.getElementById("content-section");

export async function loadMovieDetails(movieId, heroId) {
  try {
    const movieDetails = await fetchData(
      `/admin-proxy/games/?gameSlug=blast-alpha&heroId=${heroId}&movieId=${movieId}`
    );

    contentSection.innerHTML = generateMovieCards(movieDetails);
    contentSection.setAttribute("data-section", "movie");

    document.getElementById("back-to-movies")?.addEventListener("click", () => {
      history.pushState(
        { section: "hero", heroId },
        `Hero ${heroId}`,
        `/admin/games/blast-alpha/?heroId=${heroId}`
      );
      loadHeroDetails(heroId);
    });

    document.getElementById("add-card")?.addEventListener("click", () => {
      addOrEditCardModal(false, null, movieId, heroId);
    });

    document.querySelectorAll(".edit").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = e.target.closest(".movie-card-details");
        const cardId = card.getAttribute("data-movie-card-id");
        const name = card.querySelector("h1").textContent.trim();
        const callSign = card
          .querySelector(".call-sign-content")
          .textContent.trim();
        const ability1 = card
          .querySelector(".ability-content")
          .textContent.split("<br>")[0]
          .replace("1. ", "")
          .trim();
        const ability2 = card
          .querySelector(".ability-content")
          .textContent.split("<br>")[1]
          ?.replace("2. ", "")
          .trim();
        const type = card.querySelector(".card-type").textContent.trim();

        addOrEditCardModal(
          true,
          {
            id: cardId,
            name,
            call_sign: callSign,
            ability_text: ability1,
            ability_text2: ability2,
            type,
          },
          movieId,
          heroId
        );
      });
    });

    document.querySelectorAll(".delete").forEach((button) => {
      button.addEventListener("click", (e) => {
        const card = e.target.closest(".movie-card-details");
        const cardId = card.getAttribute("data-movie-card-id");
        const name = card.querySelector("h1").textContent.trim();

        alert(`TODO: Confirm & delete card "${name}"`);
        // confirmDeleteCard(heroId, movieId, cardId)
      });
    });
  } catch (error) {
    console.error("Error loading movie details:", error);
    contentSection.innerHTML = `<p>Error loading movie details: ${error.message}</p>`;
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
            detail.needsReview ? "inline" : "none"
          };" title="Needs Review">🚩</button>
          <button class="edit" title="Edit Card">✏️</button>
          <div class="dropdown">
            <button class="dropdown-button">⋮</button>
            <div class="dropdown-content">
              <a href="#" class="review-action" data-card-id="${
                detail.id
              }" data-needs-review="${detail.needsReview}">${
        detail.needsReview ? "Mark Resolved" : "🚩 Mark for Review"
      }</a>
              <a href="#" class="delete" title="Delete Card">🗑️ Delete</a>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <h1>${detail.name}</h1>
        <h4>Call Sign:</h4>
        <span class="call-sign-content">${detail.call_sign || ""}</span>
        <h4>Ability:</h4>
        <span class="ability-content">
          1. ${detail.ability_text ?? "No ability text available"}
          ${detail.ability_text2 ? `<br>2. ${detail.ability_text2}` : ""}
        </span>
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

function addOrEditCardModal(editFlag, editData = null, movieId, heroId) {
  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${editFlag ? "Edit" : "Add"} Movie Card</h2>
      <form id="movie-card-form">
        <label for="card-type">Card Type:</label>
        <select id="card-type" name="card-type" required>
          ${cardTypes
            .map(
              (type) =>
                `<option value="${type}" ${
                  editFlag
                    ? editData.type === type
                      ? "selected"
                      : ""
                    : type === "NONE"
                    ? "selected"
                    : ""
                }>${type}</option>`
            )
            .join("")}
        </select>
        <label for="card-name">Card Name:</label>
        <input type="text" id="card-name" name="card-name" required value="${
          editFlag ? editData.name || "" : ""
        }">
        <label for="call-sign">Call Sign (Optional):</label>
        <input type="text" id="call-sign" name="call-sign" value="${
          editFlag ? editData.call_sign || "" : ""
        }">
        <label for="ability1">Ability 1:</label>
        <input type="text" id="ability1" name="ability1" required value="${
          editFlag ? editData.ability_text || "" : ""
        }">
        <label for="ability2">Ability 2 (Optional):</label>
        <input type="text" id="ability2" name="ability2" value="${
          editFlag ? editData.ability_text2 || "" : ""
        }">
        <span id="card-type-error" style="color: red;"></span>
        <button type="submit">${editFlag ? "Update" : "Add"} Card</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close").onclick = function () {
    modal.remove();
  };

  modal.querySelector("#movie-card-form").onsubmit = function (e) {
    e.preventDefault();
    const cardType = e.target["card-type"].value;
    const cardName = e.target["card-name"].value;
    const callSign = e.target["call-sign"].value;
    const ability1 = e.target["ability1"].value;
    const ability2 = e.target["ability2"]?.value || ""; // Get ability2 value, if it exists

    if (cardType === "NONE") {
      const errorSpan = modal.querySelector("#card-type-error");
      errorSpan.textContent = "Card Type cannot be NONE.";
      return;
    }

    if (editFlag) {
      // Call API to update card
      console.log(
        `Updating card: ${editData.id}, Type: ${cardType}, Name: ${cardName}, Call Sign: ${callSign}, Ability 1: ${ability1}, Ability 2: ${ability2}`
      );
    } else {
      // Call API to add new card
      console.log(
        `Adding new card: Type: ${cardType}, Name: ${cardName}, Call Sign: ${callSign}, Ability 1: ${ability1}, Ability 2: ${ability2}, Movie ID: ${movieId}, Hero ID: ${heroId}`
      );
    }
    modal.remove();
  };

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.remove();
    }
  });

  // Add event listener for Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (document.body.contains(modal)) {
        modal.remove();
      }
    }
  });

  // Set focus on the first input
  modal.querySelector("#card-type").focus();

  document.body.style.overflow = "hidden"; // Prevent background scrolling
  modal.scrollIntoView({ behavior: "smooth" });
  document.body.style.overflow = ""; // Restore background scrolling
  return modal;
}
