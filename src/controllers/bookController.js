const bookService = require("../services/bookService");

// MVC: el controlador traduce la petición HTTP a una operación del servicio.
function list(searchParams) {
  const filters = {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    language: searchParams.get("language") || "",
  };
  return { status: 200, body: { books: bookService.list(filters) } };
}

function get(id) {
  const book = bookService.getById(id);
  return book
    ? { status: 200, body: { book } }
    : { status: 404, body: { error: "No encontramos ese libro." } };
}

module.exports = { list, get };
