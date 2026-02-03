import { renderGameSection } from "./ui/game.js";
import { loadHeroDetails } from "./ui/hero.js";
import { loadMovieDetails } from "./ui/movie.js";
import { getMovieById } from "./api.js";

const contentSection = document.getElementById("content-section");
const logoutButton = document.getElementById("logout-button");

async function renderBasedOnURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const heroId = urlParams.get("heroId");
  const movieId = urlParams.get("movieId");

  if (movieId && heroId) {
    // Fetch movie details first to get title and locked status
    const movie = await getMovieById(heroId, movieId);
    await loadMovieDetails(movieId, heroId, movie?.title, movie?.locked);
  } else if (heroId) {
    await loadHeroDetails(heroId);
  } else {
    await renderGameSection();
  }
}

renderBasedOnURL();

window.addEventListener("popstate", renderBasedOnURL);

// Logout button handler
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    window.location.href =
      "http://super-boar.cloudflareaccess.com/cdn-cgi/access/logout?returnTo=https://superboar.com";
  });
} else {
  console.error("Logout button not found.  Check the HTML.");
}
