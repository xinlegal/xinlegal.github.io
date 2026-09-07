const cfg = window.XIN_CONFIG || {};
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function waLink(text="Hola XIN, quisiera realizar una consulta.") {
  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(text)}`;
}

["#topWhatsApp","#waFloat"].forEach(id => {
  const el=$(id); if(el) el.href=waLink();
});

$("#menuBtn")?.addEventListener("click",()=>$("#navlinks").classList.toggle("open"));

const shell=$("#agentShell");
function openAgent(prefill=""){
  shell.classList.add("open");
  shell.setAttribute("aria-hidden","false");
  if(prefill){$("#agentInput").value=prefill;setTimeout(()=>$("#agentInput").focus(),150)}
}
function closeAgent(){shell.classList.remove("open");shell.setAttribute("aria-hidden","true")}
$$("[data-open-agent]").forEach(b=>b.addEventListener("click",()=>openAgent()));
$("#closeAgent")?.addEventListener("click",closeAgent);
shell?.addEventListener("click",e=>{if(e.target===shell)closeAgent()});

$$("[data-topic]").forEach(btn=>btn.addEventListener("click",()=>openAgent(`Necesito ayuda con ${btn.dataset.topic}. `)));
$$(".service-card").forEach(card=>{
  card.querySelector("button").addEventListener("click",()=>openAgent(`Quiero consultar sobre ${card.dataset.service}. `));
});
$$(".planBtn").forEach(btn=>btn.addEventListener("click",()=>openAgent(`Me interesa el plan ${btn.dataset.plan}. `)));

function addMsg(text,type="bot"){
  const d=document.createElement("div");
  d.className=`msg ${type}`; d.textContent=text;
  $("#agentMessages").appendChild(d);
  $("#agentMessages").scrollTop=$("#agentMessages").scrollHeight;
}
$$("[data-agent-topic]").forEach(btn=>btn.addEventListener("click",()=>{
  addMsg(btn.textContent,"user");
  setTimeout(()=>addMsg("Perfecto. Cuéntame brevemente qué ocurrió, qué documento recibiste o qué necesitas hacer."),350);
}));

$("#agentForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const input=$("#agentInput"), text=input.value.trim();
  if(!text)return;
  addMsg(text,"user"); input.value="";
  if(!cfg.aiEndpoint){
    setTimeout(()=>{
      addMsg("Gracias. Para una orientación inicial, indícame si ya tienes un documento, la entidad involucrada y la fecha de notificación. También puedo derivarte directamente a WhatsApp.");
      const a=document.createElement("a");
      a.href=waLink(`Hola XIN. Mi consulta es: ${text}`);
      a.target="_blank"; a.rel="noopener";
      a.textContent="Continuar por WhatsApp →";
      a.style.cssText="display:inline-block;margin:4px 0 10px;color:#8b6529;font-weight:800;text-decoration:none";
      $("#agentMessages").appendChild(a);
    },450);
    return;
  }
  try{
    const r=await fetch(cfg.aiEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text})});
    const data=await r.json();
    addMsg(data.reply||"Gracias. Un especialista XIN puede continuar contigo.");
  }catch{
    addMsg("No pude conectar en este momento. Puedes continuar tu consulta por WhatsApp.");
  }
});

$("#leadForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const name=fd.get("name"), phone=fd.get("phone"), service=fd.get("service"), message=fd.get("message");
  const text=`Hola XIN. Quiero realizar una consulta.%0A%0ANombre: ${name}%0AWhatsApp: ${phone}%0AServicio: ${service}%0AConsulta: ${message}`;
  window.open(`https://wa.me/${cfg.whatsapp}?text=${text}`,"_blank","noopener");
  showToast("Abriendo WhatsApp para continuar tu consulta.");
});

function showToast(t){
  const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),3200);
}

const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")});
},{threshold:.12});
$$(".reveal").forEach(el=>observer.observe(el));