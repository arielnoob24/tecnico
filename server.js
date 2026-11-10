const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const routes = require("./src/routes");

const PORT = Number(process.env.PORT) || 3000;
const publicDirectory = path.resolve(__dirname, "public");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > 10_000) {
        reject(Object.assign(new Error("El cuerpo de la solicitud es demasiado grande."), { status: 413 }));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(Object.assign(new Error("El JSON enviado no es válido."), { status: 400 }));
      }
    });
    request.on("error", reject);
  });
}

function serveStatic(request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Método no permitido." });
    return;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendJson(response, 400, { error: "La ruta no es válida." });
    return;
  }

  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const filePath = path.resolve(publicDirectory, `.${requestedPath}`);
  if (!filePath.startsWith(`${publicDirectory}${path.sep}`)) {
    sendJson(response, 403, { error: "Acceso denegado." });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT" && !path.extname(requestedPath)) {
        serveStatic(request, response, "/index.html");
        return;
      }
      sendJson(response, error.code === "ENOENT" ? 404 : 500, { error: "No se pudo cargar el recurso." });
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  });
}

const server = http.createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'");

  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (!url.pathname.startsWith("/api/")) {
    serveStatic(request, response, url.pathname);
    return;
  }

  try {
    const result = await routes.handle(request.method, url, request.method === "POST" ? await readJson(request) : null);
    sendJson(response, result.status, result.body);
  } catch (error) {
    if (error.status) {
      sendJson(response, error.status, { error: error.message });
      return;
    }
    console.error("Error interno al atender una solicitud:", error);
    sendJson(response, 500, { error: "Ocurrió un error interno. Inténtalo de nuevo." });
  }
});

server.listen(PORT, () => {
  console.log(`Biblioteca digital disponible en http://localhost:${PORT}`);
});
