const bookController = require("./controllers/bookController");
const requestController = require("./controllers/requestController");

async function handle(method, url, body) {
  if (method === "GET" && url.pathname === "/api/books") {
    return bookController.list(url.searchParams);
  }

  const bookMatch = url.pathname.match(/^\/api\/books\/([a-z0-9-]+)$/);
  if (method === "GET" && bookMatch) {
    return bookController.get(bookMatch[1]);
  }

  if (method === "POST" && url.pathname === "/api/requests") {
    return requestController.create(body);
  }

  return { status: 404, body: { error: "Ruta no encontrada." } };
}

module.exports = { handle };
