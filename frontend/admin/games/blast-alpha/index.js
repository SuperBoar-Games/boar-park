const contentSection = document.getElementById("content-section");
let initialLoad = true;

async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
  return await res.json();
}

function generateIndustryList(gameData) {
  const grouped = gameData.reduce((acc, hero) => {
    acc[hero.category] = acc[hero.category] || [];
    acc[hero.category].push(hero);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([industry, heroes]) => {
      const heroList = heroes
        .map((hero) => {
          const done = hero.total_movies - hero.pending_movies;
          const statusClass = done < 10 ? "incomplete" : "complete";
          return `
        <li class="${statusClass}" data-hero-id="${hero.id}">
          <span class="hero-name">${hero.name}</span>
          <span class="movie-count">${done}</span>
        </li>
      `;
        })
        .join("");

      return `
      <h3>${industry}</h3>
      <ul class="hero-sublist">${heroList}</ul>
    `;
    })
    .join("");
}

function generateMovieSection(moviesData, heroName) {
  if (!moviesData || !moviesData.length) {
    return "<p>No movies available for this hero.</p>";
  }

  return `
    <div class="movie-header">
      <h2>Movies of ${heroName}</h2>
      <button id="back-to-hero">Back to Hero</button>
    </div>
    <ul id="movie-list">
      ${moviesData
        .map(
          (movie) => `
        <li class="movie-card" data-movie-id="${movie.id}">
          <span class="movie-title">${movie.title || "Untitled Movie"}</span>
          <span class="movie-status ${(movie.status || "unknown").toLowerCase()}">${movie.status || "unknown"}</span>
        </li>
      `,
        )
        .join("")}
    </ul>
  `;
}

async function loadHeroDetails(heroId) {
  try {
    const moviesData = await fetchData(
      `/admin-proxy/games/blast-alpha/heroes/${heroId}`,
    );
    contentSection.innerHTML = generateMovieSection(moviesData, "name");

    document.querySelectorAll("#movie-list li[data-movie-id]").forEach((li) => {
      li.addEventListener("click", async () => {
        const movieId = li.getAttribute("data-movie-id");
        await loadMovieDetails(movieId, heroId);
        history.pushState(
          { section: "movie", movieId },
          `Movie ${movieId}`,
          `/admin/games/blast-alpha/?heroId=${heroId}&movieId=${movieId}`,
        );
      });
    });

    contentSection.setAttribute("data-section", "hero"); // Change data-section to 'hero'
    document.getElementById("back-to-hero")?.addEventListener("click", () => {
      history.pushState(
        { section: "game" },
        "Blast Alpha",
        "/admin/games/blast-alpha",
      );
      renderGameSection(); // Re-render the game section
    });
  } catch (error) {
    console.error("Error fetching hero section:", error);
    contentSection.innerHTML = `<p>Error loading hero details: ${error.message}</p>`;
  }
}

async function loadMovieDetails(movieId, heroId) {
  try {
    const movieDetails = await fetchData(
      `/admin-proxy/games/blast-alpha/heroes/${heroId}/movies/${movieId}`,
    );
    contentSection.innerHTML = generateMovieCards(movieDetails);
    contentSection.setAttribute("data-section", "movie");

    document.getElementById("back-to-movies")?.addEventListener("click", () => {
      history.pushState(
        { section: "game" },
        "Blast Alpha",
        `/admin/games/blast-alpha/?heroId=${heroId}`,
      );
      renderGameSection(); // Re-render the game section
    });

    document.querySelectorAll(".edit-movie").forEach((button) => {
      button.addEventListener("click", () => {
        console.log("Edit movie functionality");
        // Implement edit functionality here
      });
    });
  } catch (error) {
    console.error("Error fetching movie details:", error);
    contentSection.innerHTML = `<p>Error loading movie details: ${error.message}</p>`;
  }
}

function generateMovieCards(movieDetails) {
  const cards = movieDetails
    .map(
      (detail) => `
    <div class="movie-card-details">
      <div class="card-header">
        <span class="movie-type">${detail.type}</span>
        <button class="edit-movie">Edit</button>
      </div>
      <div class="card-body">
        <h1>${detail.name}</h1>
        <h4>Call Sign:</h4>
        <span class="call-sign-content">${detail.call_sign || "N/A"}</span>
        <h4>Ability:</h4>
        <span class="ability-content">${detail.ability_text || "No ability text available"}</span>
      </div>
    </div>
  `,
    )
    .join("");

  return `
    <div class="movie-header">
      <h2>Movie Details</h2>
      <button id="back-to-movies">Back to Movies</button>
    </div>
    <div class="movie-cards-container">
      ${cards}
    </div>
  `;
}

async function renderGameSection() {
  const urlParams = new URLSearchParams(window.location.search);
  const heroId = urlParams.get("heroId");
  const movieId = urlParams.get("movieId");

  if (movieId && heroId) {
    await loadMovieDetails(movieId, heroId);
  } else if (heroId) {
    await loadHeroDetails(heroId);
  } else {
    try {
      const gameData = await fetchData("/admin-proxy/games/blast-alpha/");
      const industryListHTML = generateIndustryList(gameData);
      contentSection.innerHTML = `
        <h2>Blast Alpha</h2>
        <section id="game-section">
          <ul id="industry-list">${industryListHTML}</ul>
        </section>
      `;
      contentSection.setAttribute("data-section", "game"); // Ensure we set this initially to 'game'

      if (initialLoad) {
        history.pushState(
          { section: "game" },
          "Blast Alpha",
          "/admin/games/blast-alpha",
        );
        initialLoad = false;
      }

      document
        .querySelectorAll("#industry-list li[data-hero-id]")
        .forEach((li) => {
          li.addEventListener("click", async () => {
            const heroId = li.getAttribute("data-hero-id");
            await loadHeroDetails(heroId);
            history.pushState(
              { section: "hero", heroId },
              `Hero ${heroId}`,
              `/admin/games/blast-alpha/?heroId=${heroId}`,
            );
          });
        });
    } catch (error) {
      console.error("Error fetching or rendering game data:", error);
      contentSection.innerHTML = "<p>Error loading game data.</p>";
    }
  }
}

// Initial load
renderGameSection();

// Handle browser navigation
window.addEventListener("popstate", async (event) => {
  const urlParams = new URLSearchParams(window.location.search);
  const heroId = urlParams.get("heroId");
  const movieId = urlParams.get("movieId");

  if (movieId && heroId) {
    await loadMovieDetails(movieId, heroId); // Load movie details if movieId and heroId are in the query string
  } else if (heroId) {
    await loadHeroDetails(heroId); // Load hero details if heroId is in the query string
  } else {
    renderGameSection(); // Otherwise, render the game section
  }
});
