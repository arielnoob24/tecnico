const books = require("../data/books");

// Repository: es el único módulo que conoce la fuente de datos de los libros.
function findAll() {
  return books;
}

function findById(id) {
  return books.find((book) => book.id === id) || null;
}

module.exports = { findAll, findById };
