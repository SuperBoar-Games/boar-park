const gameList = document.getElementById("games-list");

async function loadGames() {
    try {
        const res = await fetch("/admin-proxy/games");
        const gamesRes = await res.json();

        gameList.innerHTML = "";

        gamesRes.forEach((game) => {
            const li = document.createElement("li");
            li.innerHTML = `
              <strong>${game.name}</strong>
              <a  href="/admin/games/${game.slug}">Enter</a>
            `;
            gameList.appendChild(li);
        });
    } catch (err) {
        console.error("Failed to load games:", err);
        gameList.innerHTML = "<li>Error loading data</li>";
    }
}

loadGames();
