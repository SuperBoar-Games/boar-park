const gameList = document.getElementById("games-list");
const logoutButton = document.getElementById("logout-button");

export async function loadGames() {
  try {
    const res = await fetch("/api/games");

    if (!res.ok) {
      const message = `Error: ${res.status} - ${res.statusText}`;
      gameList.innerHTML = `<li>${message}</li>`;
      return;
    }

    const { data: games } = await res.json();

    if (!games?.length) {
      gameList.innerHTML = "<li>No games available.</li>";
      return;
    }

    gameList.innerHTML = games
      .map(
        (game) => `
        <li>
          <strong>${game.name}</strong>
          <a href="/admin/games/${game.slug}">Enter</a>
        </li>
      `
      )
      .join("");
  } catch (err) {
    console.error("Failed to load games:", err);
    gameList.innerHTML = `<li>${err.message || "Error loading data"}</li>`;
  }
}

// Load games on page load
loadGames();

// Logout button handler
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    window.location.href =
      "http://super-boar.cloudflareaccess.com/cdn-cgi/access/logout?returnTo=https://superboar.com";
  });
} else {
  console.error("Logout button not found.  Check the HTML.");
}
