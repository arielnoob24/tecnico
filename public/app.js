const app = document.querySelector("#app");
const BASE_PATH = document.querySelector('meta[name="app-base"]').content.replace(/\/$/, "");
const STATIC_MODE = BASE_PATH !== "";

const state = {
  books: [],
  filters: { search: "", category: "", language: "" },
  searchTimer: null,
};

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

async function api(path, options = {}) {
  const response = await fetch(`${BASE_PATH}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || "No se pudo completar la solicitud.");
    error.payload = payload;
    throw error;
  }
  return payload;
}

function cover(book, extraClass = "") {
  return `<div class="book-cover ${escapeHTML(book.cover)} ${extraClass}" aria-hidden="true">
    <span class="cover-mark">${escapeHTML(book.coverMark)}</span>
    <span class="cover-cover-title">${escapeHTML(book.title)}</span>
    <span class="cover-cover-author">${escapeHTML(book.author)}</span>
  </div>`;
}

function bookCard(book, index = 0) {
  return `<article class="book-card">
    <a class="book-card-link" href="${routeUrl(`/libros/${encodeURIComponent(book.id)}`)}" data-link aria-label="Ver detalle de ${escapeHTML(book.title)}">
      ${cover(book)}
      <div class="book-card-copy">
        <div class="book-card-meta"><span>${escapeHTML(book.category)}</span><span>${book.available ? "Disponible" : "En préstamo"}</span></div>
        <h3>${escapeHTML(book.title)}</h3>
        <p>${escapeHTML(book.author)}</p>
      </div>
    </a>
  </article>`;
}

function bookGrid(books) {
  if (!books.length) {
    return `<div class="empty-state"><span aria-hidden="true">⌕</span><h3>No encontramos ese libro</h3><p>Prueba con otro título, autora o filtro. ¡La próxima historia puede estar a un cambio de búsqueda!</p></div>`;
  }
  return `<div class="book-grid">${books.map(bookCard).join("")}</div>`;
}

function routeUrl(path) {
  return `${BASE_PATH}${path}`;
}

function filterBooks(books, filters) {
  const normalize = (value) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
  const search = normalize(filters.search);
  return books.filter((book) =>
    (!search || normalize(`${book.title} ${book.author} ${book.category} ${book.description}`).includes(search))
    && (!filters.category || normalize(book.category) === normalize(filters.category))
    && (!filters.language || normalize(book.language) === normalize(filters.language)));
}

function homePage(books) {
  const featured = books.slice(0, 3);
  return `<section class="hero">
    <div class="hero-content">
      <p class="eyebrow"><span class="eyebrow-line"></span> Una biblioteca para encontrarnos</p>
      <h1>Las historias<br>nos <em>acercan.</em></h1>
      <p class="hero-description">Un espacio hecho por y para la comunidad. Descubre tu próxima lectura, compártela y deja que viaje de mano en mano.</p>
      <div class="hero-actions"><a class="button button-dark" href="${routeUrl("/catalogo")}" data-link>Explorar la biblioteca <span aria-hidden="true">↗</span></a><span class="member-note"><span class="member-avatars" aria-hidden="true">M&nbsp; A&nbsp; L</span> Un rincón de lectura para todos</span></div>
    </div>
    <div class="hero-art" aria-label="Libros que hacen crecer una comunidad">
      <span class="art-sun" aria-hidden="true"></span>
      <span class="art-spark art-spark-one" aria-hidden="true">✳</span><span class="art-spark art-spark-two" aria-hidden="true">✧</span>
      <div class="art-book art-book-one"><span>una historia<br>compartida</span><b>✳</b></div>
      <div class="art-book art-book-two"><span>el placer<br>de leer</span><b>❋</b></div>
      <div class="art-book art-book-three"><span>páginas<br>por descubrir</span><b>✦</b></div>
      <span class="art-caption">Cada libro abre un mundo.</span>
    </div>
    <div class="hero-index"><span>01 — 03</span><span>↓</span><span>DESLIZA PARA DESCUBRIR</span></div>
  </section>
  <section class="featured-section section-wrap">
    <div class="section-heading">
      <div><p class="eyebrow"><span class="eyebrow-line"></span> Algo bueno te espera</p><h2>Lecturas que <em>circulan.</em></h2></div>
      <a class="text-link" href="${routeUrl("/catalogo")}" data-link>Ver todos los libros <span aria-hidden="true">↗</span></a>
    </div>
    ${bookGrid(featured)}
  </section>
  <section class="community-banner section-wrap">
    <span class="community-spark" aria-hidden="true">✳</span>
    <div><p class="eyebrow">Una comunidad, muchas historias</p><h2>Tu próxima lectura está<br>más cerca de lo que crees.</h2></div>
    <a class="button button-light" href="${routeUrl("/catalogo")}" data-link>Ir al catálogo <span aria-hidden="true">↗</span></a>
  </section>`;
}

function catalogPage(books) {
  const categories = [...new Set(books.map((book) => book.category))].sort();
  const languages = [...new Set(books.map((book) => book.language))].sort();
  return `<section class="catalog-page section-wrap">
    <div class="page-intro"><p class="eyebrow"><span class="eyebrow-line"></span> Todas las historias, aquí</p><h1>La biblioteca<br><em>te espera.</em></h1><p>Busca por título o autor, o encuentra algo nuevo en nuestras estanterías compartidas.</p></div>
    <form class="filter-panel" id="filter-form" role="search">
      <label class="search-field"><span class="sr-only">Buscar título, autora o tema</span><span aria-hidden="true">⌕</span><input id="search-input" name="search" type="search" placeholder="¿Qué te gustaría leer?" value="${escapeHTML(state.filters.search)}" autocomplete="off"><button type="button" class="clear-search" aria-label="Limpiar búsqueda" ${state.filters.search ? "" : "hidden"}>×</button></label>
      <label class="filter-select"><span class="sr-only">Filtrar por género</span><select name="category"><option value="">Todos los géneros</option>${categories.map((category) => `<option value="${escapeHTML(category)}" ${state.filters.category === category ? "selected" : ""}>${escapeHTML(category)}</option>`).join("")}</select></label>
      <label class="filter-select"><span class="sr-only">Filtrar por idioma</span><select name="language"><option value="">Todos los idiomas</option>${languages.map((language) => `<option value="${escapeHTML(language)}" ${state.filters.language === language ? "selected" : ""}>${escapeHTML(language)}</option>`).join("")}</select></label>
    </form>
    <div class="results-heading"><p id="results-count" aria-live="polite">${books.length} ${books.length === 1 ? "libro" : "libros"} para descubrir</p><span>Hechos para compartirse <span aria-hidden="true">♡</span></span></div>
    <div id="book-results">${bookGrid(books)}</div>
  </section>`;
}

function detailPage(book) {
  return `<section class="detail-page section-wrap">
    <a class="back-link" href="${routeUrl("/catalogo")}" data-link><span aria-hidden="true">←</span> Volver a la biblioteca</a>
    <div class="detail-layout">
      <div class="detail-cover-wrap">${cover(book, "detail-cover")}<span class="detail-cover-note">Una historia compartida<br>vale por dos.</span></div>
      <div class="detail-copy">
        <p class="eyebrow"><span class="eyebrow-line"></span> ${escapeHTML(book.category)} · ${escapeHTML(book.language)}</p>
        <h1>${escapeHTML(book.title)}</h1><p class="detail-author">por <span>${escapeHTML(book.author)}</span></p>
        <p class="detail-description">${escapeHTML(book.description)}</p>
        <dl class="book-facts"><div><dt>Publicado</dt><dd>${book.year}</dd></div><div><dt>Páginas</dt><dd>${book.pages}</dd></div><div><dt>Estado</dt><dd><span class="availability-dot ${book.available ? "" : "is-unavailable"}"></span>${book.available ? "Disponible" : "En préstamo"}</dd></div></dl>
        <div class="request-box"><p class="eyebrow">¿Te gustaría leerlo?</p><h2>Hagamos que llegue a ti.</h2>
          ${book.available ? `<form id="request-form" novalidate>
            <input type="hidden" name="bookId" value="${escapeHTML(book.id)}">
            <label for="request-name">Tu nombre</label><input id="request-name" name="name" type="text" minlength="2" maxlength="80" autocomplete="name" required>
            <span class="field-error" data-error="name"></span>
            <label for="request-email">Tu correo electrónico</label><input id="request-email" name="email" type="email" maxlength="254" autocomplete="email" required>
            <span class="field-error" data-error="email"></span>
            <label for="request-note">Un mensaje <span class="optional">(opcional)</span></label><textarea id="request-note" name="note" rows="3" maxlength="500" placeholder="¿Algo que quieras contarnos?"></textarea>
            <span class="field-error" data-error="note"></span>
            <button class="button button-dark request-submit" type="submit">Solicitar este libro <span aria-hidden="true">↗</span></button>
            <p class="form-feedback" id="form-feedback" role="status" aria-live="polite"></p>
          </form>` : `<p class="unavailable-note">Este libro está viajando con otra persona. Vuelve pronto para ver si ya regresó a la biblioteca.</p>`}
        </div>
      </div>
    </div>
  </section>`;
}

function showError(message) {
  app.innerHTML = `<section class="error-page section-wrap"><p class="eyebrow">Un pequeño tropiezo</p><h1>${escapeHTML(message)}</h1><a class="button button-dark" href="${routeUrl("/catalogo")}" data-link>Volver a la biblioteca</a></section>`;
}

async function loadBooks() {
  const query = new URLSearchParams(Object.entries(state.filters).filter(([, value]) => value));
  if (STATIC_MODE) {
    const response = await fetch(`${BASE_PATH}/data/books.json`);
    if (!response.ok) throw new Error("No se pudo cargar el catálogo de la biblioteca.");
    state.books = filterBooks(await response.json(), state.filters);
  } else {
    const payload = await api(`/api/books${query.size ? `?${query}` : ""}`);
    state.books = payload.books;
  }
  return state.books;
}

async function render() {
  const pathname = BASE_PATH && window.location.pathname.startsWith(BASE_PATH)
    ? window.location.pathname.slice(BASE_PATH.length) || "/"
    : window.location.pathname;
  try {
    if (pathname === "/catalogo") {
      const params = new URLSearchParams(window.location.search);
      state.filters = {
        search: params.get("search") || "",
        category: params.get("category") || "",
        language: params.get("language") || "",
      };
      await loadBooks();
      app.innerHTML = catalogPage(state.books);
      bindFilters();
      return;
    }
    if (pathname.startsWith("/libros/")) {
      const id = decodeURIComponent(pathname.slice("/libros/".length));
      let book;
      if (STATIC_MODE) {
        const response = await fetch(`${BASE_PATH}/data/books.json`);
        if (!response.ok) throw new Error("No se pudo cargar el catálogo de la biblioteca.");
        book = (await response.json()).find((item) => item.id === id);
      } else {
        const payload = await api(`/api/books/${encodeURIComponent(id)}`);
        book = payload.book;
      }
      if (!book) {
        showError("No encontramos ese libro.");
        return;
      }
      app.innerHTML = detailPage(book);
      bindRequestForm();
      return;
    }
    state.filters = { search: "", category: "", language: "" };
    const books = await loadBooks();
    app.innerHTML = homePage(books);
  } catch (error) {
    showError(error.message === "Failed to fetch" ? "No pudimos conectar con la biblioteca. Inténtalo de nuevo." : error.message);
  }
}

function navigate(url) {
  const target = new URL(url, window.location.href);
  if (BASE_PATH && target.pathname !== BASE_PATH && !target.pathname.startsWith(`${BASE_PATH}/`)) {
    target.pathname = `${BASE_PATH}${target.pathname}`;
  }
  const destination = `${target.pathname}${target.search}${target.hash}`;
  if (window.location.pathname + window.location.search + window.location.hash === destination) return;
  window.history.pushState({}, "", destination);
  window.scrollTo(0, 0);
  render();
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-link]");
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(link.getAttribute("href"));
});

window.addEventListener("popstate", render);

function bindFilters() {
  const form = document.querySelector("#filter-form");
  const search = document.querySelector("#search-input");
  const clear = document.querySelector(".clear-search");
  const update = async () => {
    const values = new FormData(form);
    state.filters = {
      search: String(values.get("search") || "").trim(),
      category: String(values.get("category") || ""),
      language: String(values.get("language") || ""),
    };
    const query = new URLSearchParams(Object.entries(state.filters).filter(([, value]) => value));
    window.history.replaceState({}, "", `${routeUrl("/catalogo")}${query.size ? `?${query}` : ""}`);
    try {
      const books = await loadBooks();
      document.querySelector("#book-results").innerHTML = bookGrid(books);
      document.querySelector("#results-count").textContent = `${books.length} ${books.length === 1 ? "libro" : "libros"} para descubrir`;
      clear.hidden = !search.value;
    } catch (error) {
      document.querySelector("#book-results").innerHTML = `<p class="inline-error" role="alert">${escapeHTML(error.message)}</p>`;
    }
  };
  search.addEventListener("input", () => {
    clear.hidden = !search.value;
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(update, 180);
  });
  form.querySelectorAll("select").forEach((select) => select.addEventListener("change", update));
  clear.addEventListener("click", () => {
    search.value = "";
    search.focus();
    update();
  });
  form.addEventListener("submit", (event) => event.preventDefault());
}

function bindRequestForm() {
  const form = document.querySelector("#request-form");
  if (!form) return;
  form.addEventListener("input", (event) => {
    const error = form.querySelector(`[data-error="${event.target.name}"]`);
    if (error) error.textContent = "";
    event.target.removeAttribute("aria-invalid");
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const feedback = document.querySelector("#form-feedback");
    feedback.textContent = "";
    form.querySelectorAll(".field-error").forEach((item) => { item.textContent = ""; });
    form.querySelectorAll("[aria-invalid]").forEach((item) => item.removeAttribute("aria-invalid"));

    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    try {
      if (STATIC_MODE) {
        const response = await fetch(`${BASE_PATH}/data/books.json`);
        if (!response.ok) throw new Error("No se pudo comprobar el catálogo.");
        const books = await response.json();
        if (!books.some((book) => book.id === data.bookId && book.available)) {
          throw new Error("Este libro ya no está disponible.");
        }
        feedback.textContent = "Formulario validado. Esta versión de GitHub Pages es una demostración: no envía datos a la biblioteca.";
      } else {
        await api("/api/requests", { method: "POST", body: JSON.stringify(data) });
        feedback.textContent = "¡Solicitud recibida! Nos pondremos en contacto contigo pronto.";
      }
      form.reset();
    } catch (error) {
      if (error.payload && error.payload.errors) {
        for (const [field, message] of Object.entries(error.payload.errors)) {
          const input = form.elements.namedItem(field);
          const errorElement = form.querySelector(`[data-error="${field}"]`);
          if (input && errorElement) {
            input.setAttribute("aria-invalid", "true");
            errorElement.textContent = message;
            input.focus();
          }
        }
      } else {
        feedback.textContent = error.message;
      }
    } finally {
      submit.disabled = false;
    }
  });
}

render();
