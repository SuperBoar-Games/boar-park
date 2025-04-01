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
        const movieTitle = li.querySelector(".movie-title-row").textContent;
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
          .querySelector(".movie-title-row").textContent;
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

    // Edit Movie button (not implemented)
    document.querySelectorAll(".edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent parent click
        const movieId = btn.getAttribute("data-movie-id");
        const movieTitle = btn
          .closest("li")
          .querySelector(".movie-title-row")
          .textContent.trim();

        addOrEditMovieModal(true, { id: movieId, title: movieTitle }, heroId);
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
      addOrEditMovieModal(false, null, heroId);
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
      <div class="title-header">
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
        <h3 class="movie-title-row">${movie.title || "Untitled Movie"}</h3>
        <div class="movie-details">
          <h5># Cards: ${movie.cards || 0}</h5>
        </div>
        <div class="card-actions">
          <button class="review-flag" style="display: ${
            movie.needsReview ? "inline" : "none"
          };" title="Needs Review">🚩</button>
          <button class="edit" data-movie-id="${
            movie.id
          }" title="Edit Movie">✏️</button>
          <div class="dropdown">
            <button class="dropdown-button">⋮</button>
            <div class="dropdown-content">
              <a href="#" class="review-action" data-card-id="${
                movie.id
              }" data-needs-review="${movie.needsReview}">${
        movie.needsReview ? "Mark Resolved" : "🚩 Mark for Review"
      }</a>
              <a href="#" class="delete" data-movie-id="${
                movie.id
              }" title="Delete Card">🗑️ Delete</a>
            </div>
          </div>
        </div>
      </li>
    `
    )
    .join("");

  return `
    <div class="title-header">
      <h2>${sectionTitle}</h2>
      <button id="back-to-hero">Back to Heroes</button>
      <button id="add-movie">Add Movie</button>
    </div>
    <ul id="movie-list">${movieList}</ul>`;
}

function addOrEditMovieModal(editFlag, editData = null, heroId) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>${editFlag ? "Edit" : "Add"} Movie</h2>
      <form id="movie-form">
        <label for="movie-title">Movie Title:</label>
        <input type="text" id="movie-title" name="movie-title" required value="${
          editFlag ? editData.title : ""
        }">
        <button type="submit">${editFlag ? "Update" : "Add"} Movie</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".close").onclick = function () {
    modal.remove();
  };

  modal.querySelector("#movie-form").onsubmit = function (e) {
    e.preventDefault();
    const movieTitle = e.target["movie-title"].value;

    if (editFlag) {
      // Call API to update movie
      console.log(`Updating movie: ${editData.id}, Title: ${movieTitle}`);
    } else {
      // Call API to add new movie
      console.log(`Adding new movie: Title: ${movieTitle}, Hero ID: ${heroId}`);
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

  modal.querySelector("#movie-title").focus();
  modal.querySelector("#movie-title").select();
  document.body.style.overflow = "hidden"; // Prevent background scrolling
  modal.scrollIntoView({ behavior: "smooth" });
  document.body.style.overflow = ""; // Restore background scrolling
  return modal;
}
