const cfg = window.XIN_CONFIG || {};
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let xinCase = {
  area: "",
  entity: "",
  document: "",
  date: "",
  urgency: "",
  description: ""
};

let step = 0;

function waLink(text = "Hola XIN, quisiera realizar una consulta.") {
  return `https://wa.me/${cfg.whatsapp || "51963762075"}?text=${encodeURIComponent(text)}`;
}

["#topWhatsApp", "#waFloat"].forEach(id => {
  const el = $(id);
  if (el) el.href = waLink();
});

$("#menuBtn")?.addEventListener("click", () => {
  $("#navlinks")?.classList.toggle("open");
});

const shell = $("#agentShell");

function openAgent(prefill = "") {
  shell?.classList.add("open");
  shell?.setAttribute("aria-hidden", "false");

  if (prefill && $("#agentInput")) {
    $("#agentInput").value = prefill;
    setTimeout(() => $("#agentInput")?.focus(), 100);
  }
}

function closeAgent() {
  shell?.classList.remove("open");
  shell?.setAttribute("aria-hidden", "true");
}

$$("[data-open-agent]").forEach(btn => {
  btn.addEventListener("click", () => openAgent());
});

$("#closeAgent")?.addEventListener("click", closeAgent);

shell?.addEventListener("click", e => {
  if (e.target === shell) closeAgent();
});

function addMsg(text, type = "bot") {
  const messages = $("#agentMessages");
  if (!messages) return;

  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.textContent = text;

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function detectArea(text) {
  const t = text.toLowerCase();

  if (
    t.includes("sunat") ||
    t.includes("tribut") ||
    t.includes("impuesto") ||
    t.includes("multa") ||
    t.includes("fiscalización") ||
    t.includes("fiscalizacion") ||
    t.includes("resolución") ||
    t.includes("resolucion") ||
    t.includes("coactiva") ||
    t.includes("orden de pago")
  ) {
    return "XIN TAX";
  }

  if (
    t.includes("contabilidad") ||
    t.includes("contador") ||
    t.includes("declaración") ||
    t.includes("declaracion") ||
    t.includes("libros contables") ||
    t.includes("ruc")
  ) {
    return "XIN ACCOUNTING";
  }

  if (
    t.includes("sunarp") ||
    t.includes("registro") ||
    t.includes("partida") ||
    t.includes("título") ||
    t.includes("titulo") ||
    t.includes("observación registral") ||
    t.includes("observacion registral")
  ) {
    return "XIN REGISTRY";
  }

  if (
    t.includes("inmueble") ||
    t.includes("propiedad") ||
    t.includes("predio") ||
    t.includes("terreno") ||
    t.includes("casa") ||
    t.includes("departamento") ||
    t.includes("posesión") ||
    t.includes("posesion")
  ) {
    return "XIN REAL ESTATE";
  }

  if (
    t.includes("empresa") ||
    t.includes("mype") ||
    t.includes("negocio") ||
    t.includes("sociedad") ||
    t.includes("constitución") ||
    t.includes("constitucion")
  ) {
    return "XIN BUSINESS";
  }

  return "";
}

function areaIntro(area) {
  const messages = {
    "XIN TAX":
      "Tu consulta corresponde inicialmente a XIN TAX. Vamos a ordenar la información principal de tu caso tributario.",

    "XIN ACCOUNTING":
      "Tu consulta corresponde inicialmente a XIN ACCOUNTING. Vamos a identificar qué necesitas en materia contable o tributaria.",

    "XIN REGISTRY":
      "Tu consulta corresponde inicialmente a XIN REGISTRY. Vamos a identificar el trámite o problema registral.",

    "XIN REAL ESTATE":
      "Tu consulta corresponde inicialmente a XIN REAL ESTATE. Vamos a ordenar los datos principales de tu inmueble o patrimonio.",

    "XIN BUSINESS":
      "Tu consulta corresponde inicialmente a XIN BUSINESS. Vamos a identificar qué necesita tu empresa o emprendimiento."
  };

  return messages[area] ||
    "Voy a ayudarte a ordenar tu consulta para identificar el área adecuada de XIN.";
}

function resetCase() {
  xinCase = {
    area: "",
    entity: "",
    document: "",
    date: "",
    urgency: "",
    description: ""
  };

  step = 0;
}

function buildSummary() {
  return `
Hola XIN. He realizado una orientación inicial en la web.

Área: ${xinCase.area || "Por determinar"}
Entidad: ${xinCase.entity || "No indicada"}
Documento o trámite: ${xinCase.document || "No indicado"}
Fecha de notificación o hecho: ${xinCase.date || "No indicada"}
Urgencia: ${xinCase.urgency || "No indicada"}

Descripción inicial:
${xinCase.description || "No indicada"}

Quisiera continuar con la evaluación de mi caso.
  `.trim();
}

function addWhatsAppButton() {
  const messages = $("#agentMessages");
  if (!messages) return;

  messages.querySelectorAll(".xin-wa-handoff").forEach(el => el.remove());

  const a = document.createElement("a");
  a.className = "xin-wa-handoff";
  a.href = waLink(buildSummary());
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = "Continuar con XIN por WhatsApp →";

  a.style.cssText = `
    display:inline-block;
    margin:10px 0 14px;
    padding:12px 16px;
    border-radius:10px;
    background:#10233f;
    color:#ffffff;
    font-weight:800;
    text-decoration:none;
  `;

  messages.appendChild(a);
  messages.scrollTop = messages.scrollHeight;
}

function processXinMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (step === 0) {
    xinCase.description = trimmed;
    xinCase.area = detectArea(trimmed);

    addMsg(areaIntro(xinCase.area));

    if (xinCase.area === "XIN TAX") {
      addMsg(
        "¿La consulta es sobre SUNAT, una municipalidad, el Tribunal Fiscal u otra entidad tributaria?"
      );
    } else if (xinCase.area === "XIN REGISTRY") {
      addMsg(
        "¿Tu caso está relacionado con SUNARP u otra entidad registral?"
      );
    } else {
      addMsg(
        "¿Qué entidad, empresa o institución está involucrada en tu caso?"
      );
    }

    step = 1;
    return;
  }

  if (step === 1) {
    xinCase.entity = trimmed;

    addMsg(
      "¿Qué documento, resolución, notificación, trámite o problema tienes? Si no existe documento, describe brevemente qué ocurrió."
    );

    step = 2;
    return;
  }

  if (step === 2) {
    xinCase.document = trimmed;

    addMsg(
      "¿En qué fecha recibiste la notificación o cuándo ocurrió el hecho?"
    );

    step = 3;
    return;
  }

  if (step === 3) {
    xinCase.date = trimmed;

    addMsg(
      "¿Qué tan urgente es tu caso? Puedes responder: muy urgente, esta semana o sin urgencia inmediata."
    );

    step = 4;
    return;
  }

  if (step === 4) {
    xinCase.urgency = trimmed;

    addMsg(
      "Gracias. Ya tengo la información principal de tu consulta."
    );

    if (xinCase.area === "XIN TAX") {
      addMsg(
        "En casos tributarios conviene revisar el documento y la fecha exacta de notificación antes de presentar una respuesta, reclamación, apelación u otro escrito."
      );
    } else if (xinCase.area === "XIN REGISTRY") {
      addMsg(
        "En casos registrales conviene revisar la partida, título, esquela de observación o documento relacionado antes de definir el siguiente trámite."
      );
    } else if (xinCase.area === "XIN REAL ESTATE") {
      addMsg(
        "En asuntos inmobiliarios conviene revisar la documentación del predio, titularidad y antecedentes antes de tomar una decisión."
      );
    } else {
      addMsg(
        "Por la naturaleza de tu caso, es recomendable revisar los documentos antes de definir una acción concreta."
      );
    }

    addMsg(
      "Si deseas, puedes continuar con XIN por WhatsApp. Tu consulta inicial ya estará resumida automáticamente."
    );

    addWhatsAppButton();

    step = 5;
    return;
  }

  if (step >= 5) {
    const lower = trimmed.toLowerCase();

    if (
      lower.includes("nuevo") ||
      lower.includes("otra consulta") ||
      lower.includes("reiniciar")
    ) {
      resetCase();

      addMsg(
        "Perfecto. Empecemos una nueva consulta. Cuéntame brevemente qué problema tienes."
      );

      return;
    }

    addMsg(
      "Tu orientación inicial ya está lista. Para continuar con la revisión del caso, puedes comunicarte con XIN por WhatsApp."
    );

    addWhatsAppButton();
  }
}

$("#agentForm")?.addEventListener("submit", e => {
  e.preventDefault();

  const input = $("#agentInput");
  const text = input?.value.trim();

  if (!text) return;

  addMsg(text, "user");
  input.value = "";

  setTimeout(() => {
    processXinMessage(text);
  }, 150);
});

$$("[data-agent-topic]").forEach(btn => {
  btn.addEventListener("click", () => {
    resetCase();

    const text = btn.textContent.trim();

    addMsg(text, "user");

    xinCase.description = text;
    xinCase.area = detectArea(text);

    addMsg(areaIntro(xinCase.area));

    addMsg(
      "Para orientarte mejor, dime qué entidad está involucrada."
    );

    step = 1;
  });
});

$$("[data-topic]").forEach(btn => {
  btn.addEventListener("click", () => {
    resetCase();
    openAgent(`Necesito ayuda con ${btn.dataset.topic}. `);
  });
});

$$(".service-card").forEach(card => {
  const button = card.querySelector("button");

  button?.addEventListener("click", () => {
    resetCase();
    openAgent(`Quiero consultar sobre ${card.dataset.service}. `);
  });
});

$$(".planBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    resetCase();
    openAgent(`Me interesa el plan ${btn.dataset.plan}. `);
  });
});

$("#leadForm")?.addEventListener("submit", e => {
  e.preventDefault();

  const fd = new FormData(e.currentTarget);

  const name = fd.get("name") || "";
  const phone = fd.get("phone") || "";
  const service = fd.get("service") || "";
  const message = fd.get("message") || "";

  const text =
    `Hola XIN. Quiero realizar una consulta.\n\n` +
    `Nombre: ${name}\n` +
    `WhatsApp: ${phone}\n` +
    `Servicio: ${service}\n` +
    `Consulta: ${message}`;

  window.open(
    waLink(text),
    "_blank",
    "noopener"
  );

  showToast("Abriendo WhatsApp para continuar tu consulta.");
});

function showToast(text) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, {
  threshold: 0.12
});

$$(".reveal").forEach(el => observer.observe(el));
