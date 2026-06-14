/* =====================================================================
   TRADUCTOR — lógica (app.js)
   API: MyMemory — gratis, sin clave, funciona directamente en el navegador.
   ===================================================================== */

/* Idiomas disponibles. Añade o quita lo que quieras: { código MyMemory, nombre }. */
const IDIOMAS = [
  { code: "ar",    nombre: "Árabe" },
  { code: "bg",    nombre: "Búlgaro" },
  { code: "ca",    nombre: "Catalán" },
  { code: "cs",    nombre: "Checo" },
  { code: "da",    nombre: "Danés" },
  { code: "de",    nombre: "Alemán" },
  { code: "el",    nombre: "Griego" },
  { code: "en",    nombre: "Inglés" },
  { code: "es",    nombre: "Español" },
  { code: "et",    nombre: "Estonio" },
  { code: "fi",    nombre: "Finés" },
  { code: "fr",    nombre: "Francés" },
  { code: "he",    nombre: "Hebreo" },
  { code: "hi",    nombre: "Hindi" },
  { code: "hr",    nombre: "Croata" },
  { code: "hu",    nombre: "Húngaro" },
  { code: "id",    nombre: "Indonesio" },
  { code: "it",    nombre: "Italiano" },
  { code: "ja",    nombre: "Japonés" },
  { code: "ko",    nombre: "Coreano" },
  { code: "lt",    nombre: "Lituano" },
  { code: "lv",    nombre: "Letón" },
  { code: "nl",    nombre: "Neerlandés" },
  { code: "no",    nombre: "Noruego" },
  { code: "pl",    nombre: "Polaco" },
  { code: "pt",    nombre: "Portugués" },
  { code: "ro",    nombre: "Rumano" },
  { code: "ru",    nombre: "Ruso" },
  { code: "sk",    nombre: "Eslovaco" },
  { code: "sl",    nombre: "Esloveno" },
  { code: "sv",    nombre: "Sueco" },
  { code: "th",    nombre: "Tailandés" },
  { code: "tr",    nombre: "Turco" },
  { code: "uk",    nombre: "Ucraniano" },
  { code: "vi",    nombre: "Vietnamita" },
  { code: "zh-CN", nombre: "Chino (simplificado)" },
];

/* MyMemory acepta como máximo 500 caracteres por petición en el plan gratuito. */
const MAX_CHARS = 500;
const PLACEHOLDER = "La traducción aparecerá aquí.";

/* Referencias al DOM */
const $ = (id) => document.getElementById(id);
const texto      = $("texto");
const desde      = $("desde");
const hacia      = $("hacia");
const boton      = $("boton");
const resultado  = $("resultado");
const contador   = $("contador");
const calidad    = $("calidad");
const copiar     = $("copiar");
const swap       = $("swap");
const emailInput = $("email");
const usageText  = $("usage-text");
const usageFill  = $("usage-fill");


/* ---------- Arranque (init() se llama al final, cuando ya está todo declarado) ---------- */
function init() {
  // Ordenar idiomas por nombre y rellenar los dos selectores
  const ordenados = [...IDIOMAS].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  ordenados.forEach((l) => {
    desde.add(new Option(l.nombre, l.code));
    hacia.add(new Option(l.nombre, l.code));
  });
  desde.value = "es";
  hacia.value = "en";

  actualizarContador();
  actualizarMedidor();

  // Eventos
  texto.addEventListener("input", actualizarContador);
  boton.addEventListener("click", traducir);
  copiar.addEventListener("click", copiarResultado);
  swap.addEventListener("click", intercambiar);
  emailInput.addEventListener("input", actualizarMedidor); // el límite cambia según el email

  // Atajo de teclado: Ctrl/Cmd + Enter para traducir
  texto.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") traducir();
  });
}


/* ---------- Interfaz ---------- */
function actualizarContador() {
  const n = texto.value.length;
  contador.textContent = n + " / " + MAX_CHARS;
  contador.classList.toggle("over", n > MAX_CHARS);
}

function intercambiar() {
  // Intercambia los idiomas
  const tmp = desde.value;
  desde.value = hacia.value;
  hacia.value = tmp;

  // Si ya había una traducción válida, la pasa a la entrada y limpia la salida
  const out = resultado.dataset.texto;
  if (out) {
    texto.value = out;
    actualizarContador();
    resetSalida();
  }
}

function copiarResultado() {
  navigator.clipboard.writeText(resultado.dataset.texto || "");
  copiar.textContent = "¡Copiado!";
  setTimeout(() => (copiar.textContent = "Copiar"), 1200);
}

function resetSalida() {
  resultado.classList.remove("error");
  resultado.classList.add("placeholder");
  resultado.textContent = PLACEHOLDER;
  resultado.dataset.texto = "";
  calidad.textContent = "";
  copiar.hidden = true;
}

function mostrarResultado(textoTraducido, match) {
  resultado.classList.remove("placeholder", "error");
  resultado.dataset.texto = textoTraducido;
  resultado.textContent = textoTraducido;   // textContent = seguro frente a inyección
  copiar.hidden = false;

  // MyMemory devuelve un 'match' (0–1) con la calidad de la coincidencia
  calidad.textContent = (match > 0) ? "Coincidencia " + Math.round(match * 100) + "%" : "";
}

function mostrarError(msg) {
  resultado.classList.remove("placeholder");
  resultado.classList.add("error");
  resultado.textContent = msg;
  resultado.dataset.texto = "";
  calidad.textContent = "";
  copiar.hidden = true;
}


/* ---------- Medidor de uso (estimación local) ----------
   MyMemory NO devuelve cuánto límite te queda: su API solo avisa
   (quotaFinished) cuando ya se ha agotado. Por eso llevamos una
   estimación local: contamos los caracteres traducidos en este
   navegador y los guardamos por día. Es aproximado, porque el límite
   real lo cuenta MyMemory por dirección IP, no por navegador.
   Plan gratuito: ~5.000 caracteres/día sin email, ~50.000 con email. */
const LIMITE_SIN_EMAIL = 5000;
const LIMITE_CON_EMAIL = 50000;
const STORAGE_KEY = "traductor_uso";

let usoMemoria = 0; // respaldo por si el navegador no permite almacenamiento

function hoy() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function limiteActual() {
  return emailInput.value.includes("@") ? LIMITE_CON_EMAIL : LIMITE_SIN_EMAIL;
}

function leerUso() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d.fecha === hoy()) return d.usado || 0;   // solo cuenta lo de hoy
    }
  } catch (_) { /* sin almacenamiento: tiramos de memoria */ }
  return usoMemoria;
}

function guardarUso(usado) {
  usoMemoria = usado;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fecha: hoy(), usado: usado }));
  } catch (_) { /* sin almacenamiento: queda solo en esta sesión */ }
}

function sumarUso(caracteres) {
  guardarUso(leerUso() + caracteres);
  actualizarMedidor();
}

function actualizarMedidor() {
  const usado  = leerUso();
  const limite = limiteActual();
  const pct    = Math.min(100, Math.round((usado / limite) * 100));

  usageText.textContent = usado.toLocaleString("es") + " / " + limite.toLocaleString("es");
  usageFill.style.width = pct + "%";
  usageFill.classList.toggle("warn", pct >= 75 && pct < 100);
  usageFill.classList.toggle("full", pct >= 100);
}


/* ---------- Traducción (la 'carnecita') ---------- */
async function traducir() {
  const q = texto.value.trim();
  const source = desde.value;
  const target = hacia.value;

  // Validaciones previas
  if (!q) return mostrarError("Escribe algún texto primero.");
  if (source === target) return mostrarError("Elige dos idiomas distintos.");
  if (q.length > MAX_CHARS) {
    return mostrarError("Máximo " + MAX_CHARS + " caracteres por traducción. Acorta el texto e inténtalo de nuevo.");
  }

  // Estado "cargando"
  boton.disabled = true;
  resultado.classList.remove("placeholder", "error");
  resultado.textContent = "Traduciendo...";
  calidad.textContent = "";
  copiar.hidden = true;

  try {
    // 1. Construir la URL de MyMemory
    let url = "https://api.mymemory.translated.net/get"
            + "?q=" + encodeURIComponent(q)
            + "&langpair=" + encodeURIComponent(source) + "|" + encodeURIComponent(target);

    // 2. Email opcional → multiplica ×10 el límite diario gratuito
    const email = emailInput.value.trim();
    if (email.includes("@")) {
      url += "&de=" + encodeURIComponent(email);
    }

    // 3. Llamada a la API
    const res  = await fetch(url);
    const data = await res.json();

    // 4. Comprobar estado
    if (Number(data.responseStatus) !== 200) {
      throw new Error(data.responseDetails || "No se pudo traducir.");
    }

    const texto_traducido = data.responseData.translatedText || "";

    // MyMemory devuelve un aviso (no un error) cuando se agota el límite del día
    if (/MYMEMORY WARNING/i.test(texto_traducido)) {
      guardarUso(limiteActual());   // refleja "agotado" en el medidor
      actualizarMedidor();
      throw new Error("Has agotado el límite gratuito de hoy. Añade tu email en Opciones para ×10, o inténtalo mañana.");
    }

    mostrarResultado(texto_traducido, Number(data.responseData.match));
    sumarUso(q.length);   // suma a la estimación de uso del día

  } catch (e) {
    mostrarError("Error: " + e.message);
  } finally {
    boton.disabled = false;
  }
}


/* Arranca la app una vez definido todo lo anterior */
init();
