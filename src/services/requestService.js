const bookRepository = require("../repositories/bookRepository");
const requestRepository = require("../repositories/requestRepository");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Service Layer: aplica reglas de negocio y validación autoritativa en el servidor.
function create(input) {
  const data = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const note = typeof data.note === "string" ? data.note.trim() : "";
  const bookId = typeof data.bookId === "string" ? data.bookId : "";
  const errors = {};

  if (name.length < 2 || name.length > 80) errors.name = "Escribe un nombre de entre 2 y 80 caracteres.";
  if (email.length > 254 || !emailPattern.test(email)) errors.email = "Escribe un correo electrónico válido.";
  if (note.length > 500) errors.note = "El mensaje no puede superar los 500 caracteres.";
  if (!bookRepository.findById(bookId)) errors.bookId = "El libro seleccionado ya no está disponible.";
  if (Object.keys(errors).length) return { errors };

  return { request: requestRepository.create({ name, email, note, bookId }) };
}

module.exports = { create };
