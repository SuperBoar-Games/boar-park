export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname === "/api/hello") {
            return new Response("Hello from boar-park worker");
        }

        return new Response("not found", {status: 404});
    },
};
