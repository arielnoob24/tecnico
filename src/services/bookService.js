const bookRepository = require("../repositories/bookRepository");

function normalize(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
}

// Service Layer: centraliza los filtros del catálogo y desacopla las reglas del controlador.
function list(filters = {}) {
  const search = normalize(filters.search || "");
  const category = normalize(filters.category || "");
  const language = normalize(filters.language || "");

  return bookRepository.findAll().filter((book) => {
    const searchableText = normalize(`${book.title} ${book.author} ${book.category} ${book.description}`);
    return (!search || searchableText.includes(search))
      && (!category || normalize(book.category) === category)
      && (!language || normalize(book.language) === language);
  });
}

function getById(id) {
  return bookRepository.findById(id);
}

module.exports = { list, getById };
