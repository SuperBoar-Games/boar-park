const BASE = "/api-proxy/games/?gameSlug=blast-alpha";

async function json(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export const api = {
  async getCards(heroId, movieId) {
    const res = await json(
      `${BASE}&queryKey=card&heroId=${heroId}&movieId=${movieId}`
    );
    return res.data || [];
  },

  async getTags() {
    const res = await json(`${BASE}&queryKey=tags`);
    return res.data || [];
  },

  async saveCard(payload, edit) {
    const res = await json(`${BASE}&queryKey=card`, {
      method: edit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteCard(cardId) {
    const res = await json(`${BASE}&queryKey=card`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
    return res.data;
  },

  async toggleReview(cardId, needReview) {
    const res = await json(`${BASE}&queryKey=card`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardId,
        need_review: needReview ? "F" : "T",
      }),
    });
    return res.data;
  },

  async setTags(cardId, tagIds) {
    const res = await json(`${BASE}&queryKey=setTagsForCard`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, tagIds }),
    });
    return res.data;
  },
};

