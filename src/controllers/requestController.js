const requestService = require("../services/requestService");

// MVC: este controlador entrega al servicio los datos validados estructuralmente por la API.
function create(body) {
  const result = requestService.create(body);
  if (result.errors) {
    return { status: 400, body: { errors: result.errors } };
  }
  return { status: 201, body: { request: result.request } };
}

module.exports = { create };
