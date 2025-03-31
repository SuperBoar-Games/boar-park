import { fetchData } from "../api.js";
import { loadMovieDetails } from "./movie.js";
import { renderGameSection } from "./game.js";

const contentSection = document.getElementById("content-section");

export async function loadHeroDetails(heroId, heroName) {
  try {
    const moviesData = await fetchData(
      `/admin-proxy/games/?gameSlug=blast-alpha&heroId=${heroId}`
    );

    contentSection.innerHTML = generateMovieSection(moviesData, heroName);
    contentSection.setAttribute("data-section", "hero");

    // Attach click handler to each movie
    document.querySelectorAll("#movie-list li[data-movie-id]").forEach((li) => {
      li.addEventListener("click", async () => {
        const movieId = li.getAttribute("data-movie-id");
        const movieTitle = li.querySelector(".movie-title").textContent;
        await loadMovieDetails(movieId, heroId);
        history.pushState(
          { section: "movie", movieId },
          `Movie ${movieId}`,
          `/admin/games/blast-alpha/?heroId=${heroId}&movieId=${movieId}`
        );
      });
    });

    document.querySelectorAll(".delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation(); // prevent parent click
        const movieId = btn.getAttribute("data-movie-id");
        const movieTitle = btn
          .closest("li")
          .querySelector(".movie-title").textContent;
        const confirmed = confirm(
          "Are you sure you want to delete the movie: " + movieTitle + "?"
        );
        if (!confirmed) return;

        // try {
        //   await deleteData(
        //     `/admin-proxy/games/?gameSlug=blast-alpha&heroId=${heroId}`
        //   );
        //   await renderGameSection(); // reload updated list
        // } catch (err) {
        //   console.error("Hero deletion failed:", err);
        //   alert("Failed to delete hero.");
        // }
      });
    });

    // Back button
    document.getElementById("back-to-hero")?.addEventListener("click", () => {
      history.pushState(
        { section: "game" },
        "Blast Alpha",
        "/admin/games/blast-alpha"
      );
      renderGameSection();
    });

    // Add Movie button
    document.getElementById("add-movie")?.addEventListener("click", () => {
      alert(`TODO: Open Add Movie modal for Hero: ${heroName} (ID: ${heroId})`);
      // e.g., openMovieModal(heroId);
    });
  } catch (error) {
    console.error("Error loading hero details:", error);
    contentSection.innerHTML = `<p>Error loading hero details: ${error.message}</p>`;
  }
}

function generateMovieSection(moviesData, heroName) {
  const sectionTitle = heroName ? `${heroName} Movies` : "Movies";

  if (!moviesData || !moviesData.length) {
    return `
      <div class="movie-header">
        <h2>${sectionTitle}</h2>
        <button id="back-to-hero">Back to Heroes</button>
        <button id="add-movie">Add Movie</button>
      </div>
      <p>No movies available for this hero.</p>`;
  }

  const movieList = moviesData
    .map(
      (movie) => `
      <li class="movie-card ${
        movie.status?.toLowerCase() || "unknown"
      }" data-movie-id="${movie.id}">
        <div class="movie-title-row">
          <span class="movie-title">${movie.title || "Untitled Movie"}</span>
        </div>
        <div class="card-actions">
          <button class="edit" data-movie-id="${
            movie.id
          }" title="Edit Movie">✏️</button>
          <button class="delete" data-movie-id="${
            movie.id
          }" title="Delete Movie">🗑️</button>
        </div>
      </li>
    `
    )
    .join("");

  return `
    <div class="movie-header">
      <h2>${sectionTitle}</h2>
      <button id="back-to-hero">Back to Heroes</button>
      <button id="add-movie">Add Movie</button>
    </div>
    <ul id="movie-list">${movieList}</ul>`;
}
