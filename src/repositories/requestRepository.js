const { randomUUID } = require("node:crypto");
const requests = require("../data/requests");

// Repository: encapsula la escritura en la colección simulada de solicitudes.
function create(data) {
  const request = { id: randomUUID(), ...data, createdAt: new Date().toISOString() };
  requests.push(request);
  return request;
}

module.exports = { create };
