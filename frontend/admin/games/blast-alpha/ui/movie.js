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
      alert(`TODO: Open Add Movie Card modal for movieId: ${movieId}`);
      // e.g., openCardModal(heroId, movieId);
    });

    document.querySelectorAll(".edit-movie").forEach((button) => {
      button.addEventListener("click", (e) => {
        const card = e.target.closest(".movie-card-details");
        const name = card.querySelector("h1").textContent.trim();
        const callSign = card
          .querySelector(".call-sign-content")
          .textContent.trim();
        const ability = card
          .querySelector(".ability-content")
          .textContent.trim();

        alert(`TODO: Open Edit modal for "${name}"`);
        // openEditModal(name, callSign, ability, onSaveCallback)
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
          <button class="edit" title="Edit Card">✏️</button>
          <button class="delete" title="Delete Card">🗑️</button>
        </div>
      </div>
      <div class="card-body">
        <h1>${detail.name}</h1>
        <h4>Call Sign:</h4>
        <span class="call-sign-content">${detail.call_sign || "N/A"}</span>
        <h4>Ability:</h4>
        <span class="ability-content">${
          detail.ability_text || "No ability text available"
        }</span>
      </div>
    </div>
  `
    )
    .join("");

  return `
    <div class="movie-header">
      <h2>Movie Details</h2>
      <button id="back-to-movies">Back to Movies</button>
      <button id="add-card">Add Card</button>
    </div>
    <div class="movie-cards-container">
      ${cards || "<p>No movie cards found.</p>"}
    </div>
  `;
}
