const gameList = document.getElementById("games-list");

async function loadGames() {
  try {
    const res = await fetch("/admin-proxy/games");

    // Attempt to read the response body
    let responseBody;
    try {
      responseBody = await res.text(); // Read as text
    } catch (err) {
      console.error("Failed to read response body:", err);
    }

    // Handle non-OK responses
    if (!res.ok) {
      let errorMessage = `Error: ${res.status} - ${res.responseBody}`;

      // Display the error message in the UI
      gameList.innerHTML = `<li>${errorMessage}</li>`;
      return;
    }

    // Parse the response body as JSON for successful responses
    let games;
    try {
      games = JSON.parse(responseBody); // Parse the text as JSON
    } catch (jsonErr) {
      console.error("Failed to parse response as JSON:", jsonErr);
      gameList.innerHTML = `<li>Error parsing game data</li>`;
      return;
    }

    // Handle empty game list
    if (!games.length) {
      gameList.innerHTML = "<li>No games available.</li>";
      return;
    }

    // Render the game list
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
    // Handle unexpected errors
    console.error("Failed to load games:", err);
    gameList.innerHTML = `<li>${err.message || "Error loading data"}</li>`;
  }
}

// Load games on page load
loadGames();
