import { loadMovieDetails } from "./movie.js";
import { renderGameSection } from "./game.js";

const contentSection = document.getElementById("content-section");

export async function loadHeroDetails(heroId, heroName) {
  try {
    const res = await fetch(
      `/api/games/?gameSlug=blast-alpha&heroId=${heroId}`
    );

    if (!res.ok) {
      const message = `Error: ${res.status} - ${res.statusText}`;
      contentSection.innerHTML = `<li>${message}</li>`;
      return;
    }

    const { data: moviesData } = await res.json();

    contentSection.innerHTML = generateMovieSection(moviesData, heroName);
    contentSection.setAttribute("data-section", "hero");

    // Attach click handler to each movie
    document.querySelectorAll(".movie-clickable").forEach((li) => {
      li.addEventListener("click", async (e) => {
        // get movieId from the parent li
        const movieId = li.closest("li").getAttribute("data-movie-id");
        const movieTitle = li
          .querySelector(".movie-title-row")
          .textContent.trim();

        await loadMovieDetails(movieId, heroId);
        history.pushState(
          { section: "movie", movieId },
          `Movie ${movieId}`,
          `/admin/games/blast-alpha/?heroId=${heroId}&movieId=${movieId}`
        );
      });
    });

    // dropdown button
    document.querySelectorAll(".dropdown-button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();

        const dropdown = btn.closest(".dropdown");

        // Close all other dropdowns
        document.querySelectorAll(".dropdown.open").forEach((el) => {
          if (el !== dropdown) el.classList.remove("open");
        });

        // Toggle current one
        dropdown.classList.toggle("open");
      });
    });

    document.addEventListener("click", (e) => {
      document.querySelectorAll(".dropdown.open").forEach((dropdown) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("open");
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".dropdown.open").forEach((dropdown) => {
          dropdown.classList.remove("open");
        });
      }
    });

    // Delete Movie button
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

        // Call API to delete movie
        const response = await fetch(
          `/api/games/?gameSlug=blast-alpha&queryKey=movie`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: movieId }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          console.error("Failed to delete movie:", data.error);
          alert("Failed to delete movie.");
          return;
        }
        // Reload hero details after deletion
        await loadHeroDetails(heroId, heroName);
      });
    });

    // Review flag button
    document.querySelectorAll(".review-action").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation(); // prevent parent click
        const movieId = btn.closest("li").getAttribute("data-movie-id");
        const needReview = btn.getAttribute("data-need-review") === "true";

        // Call API to update review status
        const response = await fetch(
          `/api/games/?gameSlug=blast-alpha&queryKey=movie`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: movieId,
              title: undefined,
              need_review: !needReview ? "T" : "F",
              heroId: heroId,
            }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          console.error("Failed to update review status:", data.error);
          alert("Failed to update review status.");
          return;
        }
        // Update the review flag and review-action button text
        btn.setAttribute("data-need-review", !needReview);
        btn.textContent = !needReview ? "Mark Resolved" : "🚩 Mark for Review";
        const reviewFlag = btn.closest("li").querySelector(".review-flag");
        reviewFlag.style.display = !needReview ? "inline" : "none";

        // close the dropdown content
        const dropdown = btn.closest(".dropdown");
        if (dropdown) dropdown.classList.remove("open");
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

  console.log("Movies Data:", moviesData);

  const movieList = moviesData
    .map(
      (movie) => `
      <li class="movie-card ${
        movie.done === "T" ? "done" : "pending"
      }" data-movie-id="${movie.id}">
        <div class="movie-clickable">
          <h3 class="movie-title-row">${movie.title || "Untitled Movie"}</h3>
          <div class="movie-details">
            <h5># Total cards: ${movie.total_cards || 0}</h5>
            <h5># Cards needing review: ${
              movie.total_cards_need_review || 0
            }</h5>
          </div>
        </div>
        <div class="card-actions">
          <button class="review-flag" style="display: ${
            movie.need_review === "T" ? "inline" : "none"
          };" title="Needs Review">🚩</button>
          <button class="edit" data-movie-id="${
            movie.id
          }" title="Edit Movie">✏️</button>
          <div class="dropdown">
            <button class="dropdown-button">⋮</button>
            <div class="dropdown-content">
              <button class="review-action" data-card-id="${
                movie.id
              }" data-need-review="${movie.need_review === "T"}">${
        movie.need_review === "T" ? "Mark Resolved" : "🚩 Mark for Review"
      }</button>
              <button class="delete" data-movie-id="${
                movie.id
              }" title="Delete Card">🗑️ Delete</button>
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

  modal.querySelector("#movie-form").onsubmit = async function (e) {
    e.preventDefault();
    const movieTitle = e.target["movie-title"].value;

    if (editFlag) {
      // Call API to update movie
      const response = await fetch(
        `/api/games/?gameSlug=blast-alpha&queryKey=movie`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editData.id,
            title: movieTitle,
            need_review: undefined,
            heroId: heroId,
          }),
        }
      );
      const message = await response.json();
      if (!response.ok) {
        console.error("Failed to update movie:", message.error);
        alert("Failed to update movie.");
        return;
      }
      await loadHeroDetails(heroId, null);
    } else {
      // Call API to add new movie
      const response = await fetch(
        `/api/games/?gameSlug=blast-alpha&queryKey=movie`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: movieTitle,
            heroId: heroId,
          }),
        }
      );
      const message = await response.json();
      if (!response.ok) {
        console.error("Failed to add movie:", message.error);
        alert("Failed to add movie.");
        return;
      }
      await loadHeroDetails(heroId, null);
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
