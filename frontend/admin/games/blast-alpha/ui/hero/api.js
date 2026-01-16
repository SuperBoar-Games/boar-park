const BASE = "/api-proxy/games/?gameSlug=blast-alpha";

async function jsonRequest(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error("Request failed");
  return res.json().catch(() => ({}));
}

export const api = {
  async getHeroDataset(viewMode, heroId) {
    const queryKey = viewMode === "movies" ? "movie" : "cardsByHero";
    return jsonRequest(`${BASE}&queryKey=${queryKey}&heroId=${heroId}`);
  },

  async getMoviesForHero(heroId) {
    return jsonRequest(`${BASE}&queryKey=movie&heroId=${heroId}`);
  },

  async getTags() {
    return jsonRequest(`${BASE}&queryKey=tags`);
  },

  async setTagsForCard(cardId, tagIds) {
    const res = await fetch(
      "/api-proxy/games/?gameSlug=blast-alpha&queryKey=setTagsForCard",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, tagIds }),
      }
    );

    if (!res.ok) throw new Error("Tag update failed");
    return res.json().catch(() => ({}));
  },

  async saveMovie({ id, title, heroId }, edit) {
    return jsonRequest(`${BASE}&queryKey=movie`, {
      method: edit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: edit ? id : undefined, title, heroId }),
    });
  },

  async deleteMovie(id) {
    return jsonRequest(`${BASE}&queryKey=movie`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  },

  async toggleMovieReview({ id, heroId, need_review }) {
    return jsonRequest(`${BASE}&queryKey=movie`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, heroId, need_review }),
    });
  },

  async saveCard(payload, edit) {
    return jsonRequest(`${BASE}&queryKey=card`, {
      method: edit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async deleteCard(cardId) {
    return jsonRequest(`${BASE}&queryKey=card`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
  },

  async toggleCardReview({ cardId, need_review }) {
    return jsonRequest(`${BASE}&queryKey=card`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, need_review }),
    });
  },
};

