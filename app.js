const cfg = window.XIN_CONFIG || {};
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let agentHistory = [];

function waLink(text = "Hola XIN, quisiera realizar una consulta.") {
  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`;
}

["#topWhatsApp", "#waFloat"].forEach(id => {
  const el = $(id);
  if (el) el.href = waLink();
});

$("#menuBtn")?.addEventListener("click", () =>
  $("#navlinks").classList.toggle("open")
);

const shell = $("#agentShell");

function openAgent(prefill = "") {
  shell?.classList.add("open");
  shell?.setAttribute("aria-hidden", "false");

  if (prefill) {
    $("#agentInput").value = prefill;
    setTimeout(() => $("#agentInput").focus(), 150);
  }
}

function closeAgent() {
  shell?.classList.remove("open");
  shell?.setAttribute("aria-hidden", "true");
}

$$("[data-open-agent]").forEach(b =>
  b.addEventListener("click", () => openAgent())
);

$("#closeAgent")?.addEventListener("click", closeAgent);

shell?.addEventListener("click", e => {
  if (e.target === shell) closeAgent();
});

$$("[data-topic]").forEach(btn =>
  btn.addEventListener("click", () =>
    openAgent(`Necesito ayuda con ${btn.dataset.topic}. `)
  )
);

$$(".service-card").forEach(card => {
  const button = card.querySelector("button");
  button?.addEventListener("click", () =>
    openAgent(`Quiero consultar sobre ${card.dataset.service}. `)
  );
});

$$(".planBtn").forEach(btn =>
  btn.addEventListener("click", () =>
    openAgent(`Me interesa el plan ${btn.dataset.plan}. `)
  )
);

function addMsg(text, type = "bot") {
  const d = document.createElement("div");
  d.className = `msg ${type}`;
  d.textContent = text;

  $("#agentMessages")?.appendChild(d);

  if ($("#agentMessages")) {
    $("#agentMessages").scrollTop =
      $("#agentMessages").scrollHeight;
  }

  return d;
}

function addWhatsAppHandoff(lastMessage = "") {
  const messages = $("#agentMessages");
  if (!messages) return;

  if (messages.querySelector(".xin-wa-handoff")) return;

  const a = document.createElement("a");
  a.className = "xin-wa-handoff";
  a.href = waLink(
    `Hola XIN. Estuve conversando con el Agente XIN y necesito continuar mi consulta.\n\nMi caso: ${lastMessage}`
  );
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = "Continuar con XIN por WhatsApp →";

  a.style.cssText = `
    display:inline-block;
    margin:6px 0 12px;
    padding:10px 14px;
    border-radius:10px;
    background:#10233f;
    color:#ffffff;
    font-weight:800;
    text-decoration:none;
  `;

  messages.appendChild(a);
  messages.scrollTop = messages.scrollHeight;
}

$$("[data-agent-topic]").forEach(btn =>
  btn.addEventListener("click", () => {
    const text = btn.textContent.trim();

    addMsg(text, "user");

    agentHistory.push({
      role: "user",
      content: text
    });

    addMsg(
      "Perfecto. Cuéntame brevemente qué ocurrió, qué documento recibiste o qué necesitas hacer."
    );
  })
);

$("#agentForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const input = $("#agentInput");
  const text = input.value.trim();

  if (!text) return;

  addMsg(text, "user");
  input.value = "";

  agentHistory.push({
    role: "user",
    content: text
  });

  if (!cfg.aiEndpoint) {
    addMsg(
      "Para continuar necesito conectarte con XIN. Puedes enviarnos tu consulta directamente por WhatsApp."
    );
    addWhatsAppHandoff(text);
    return;
  }

  const loading = addMsg("XIN está revisando tu consulta…");

  try {
    const r = await fetch(cfg.aiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        history: agentHistory.slice(-10)
      })
    });

    const data = await r.json();

    loading?.remove();

    if (!r.ok) {
      throw new Error(data.error || "Error de conexión");
    }

    const reply =
      data.reply ||
      "Gracias. Un especialista XIN puede continuar contigo.";

    addMsg(reply);

    agentHistory.push({
      role: "assistant",
      content: reply
    });

    const normalized = reply.toLowerCase();

    if (
      normalized.includes("whatsapp") ||
      normalized.includes("especialista") ||
      normalized.includes("revisión") ||
      normalized.includes("revision") ||
      normalized.includes("cotización") ||
      normalized.includes("cotizacion") ||
      normalized.includes("contratar") ||
      normalized.includes("consulta especializada")
    ) {
      addWhatsAppHandoff(text);
    }
  } catch (error) {
    loading?.remove();

    addMsg(
      "No pude conectar con el servicio en este momento. Puedes continuar directamente con XIN por WhatsApp."
    );

    addWhatsAppHandoff(text);
  }
});

$("#leadForm")?.addEventListener("submit", e => {
  e.preventDefault();

  const fd = new FormData(e.currentTarget);

  const name = fd.get("name");
  const phone = fd.get("phone");
  const service = fd.get("service");
  const message = fd.get("message");

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

function showToast(t) {
  const x = $("#toast");
  if (!x) return;

  x.textContent = t;
  x.classList.add("show");

  setTimeout(() => x.classList.remove("show"), 3200);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
    }
  });
}, {
  threshold: 0.12
});

$$(".reveal").forEach(el => observer.observe(el));
