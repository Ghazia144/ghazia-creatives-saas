/* ============================================================
   GHAZIA CREATIVES — Order Page
   Reads ?design=<id>; shows plan picker or "Coming soon".
   Depends on js/data.js (designs + PRICING globals).
   ============================================================ */

const WHATSAPP_NUMBER = "923183040506";

function formatPKR(amount){
  return "Rs " + Number(amount).toLocaleString("en-US");
}

function redirectToDesigns(){
  window.location.replace("index.html#designs");
}

function getDesignFromQuery(){
  const id = new URLSearchParams(window.location.search).get("design");
  if(!id) return null;
  return designs.find(d => d.id === id) || null;
}

function comingSoonHtml(design){
  const waText = encodeURIComponent(
    `Hi! I'm interested in the "${design.name}" invitation. When will it be available?`
  );
  return `
    <div class="order-card">
      <div class="order-thumb">
        <img src="${design.image}" alt="${design.name} invitation"
             width="600" height="600" loading="lazy"
             onerror="this.style.display='none'">
      </div>
      <div class="order-content">
        <span class="order-eyebrow">Coming soon</span>
        <h1 class="order-title">${design.name}</h1>
        <p class="order-text">
          This design is being perfected right now. Check back soon —
          or message us and we'll let you know the moment it's ready.
        </p>
        <div class="order-actions">
          <a href="index.html#designs" class="btn btn-primary btn-block">Back to designs</a>
        </div>
        <p class="order-subtle">
          Want it sooner?
          <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${waText}"
             target="_blank" rel="noopener">WhatsApp us</a>
        </p>
      </div>
    </div>
  `;
}

function planPickerHtml(design){
  const maxPlan = design.maxPlan || 3;
  const category = design.category || "standard";
  
  // Prices get from data.js
  const prices = PRICING[category];
  
  const plans = [1, 2, 3].filter(p => p <= maxPlan);
  
  const cards = plans.map(p => {
    let label, example;
       if (p === 1) { label = "1 Event"; example = "(e.g. Nikah only)"; }
    else if (p === 2) { label = "2 Events"; example = "(e.g. Barat + Walima)"; }
    else { label = "2+ Events"; example = "(e.g. Mehendi + Barat + Walima...)"; }
    
    return `
      <a class="plan-card" href="form.html?design=${encodeURIComponent(design.id)}&plan=${p}">
        <span class="plan-label">${label}</span>
        <span class="plan-price">Rs ${prices[p].toLocaleString('en-US')}</span>
        <span class="plan-example">${example}</span>
      </a>
    `;
  }).join("");

  return `
    <div class="order-card order-card-picker">
      <div class="order-thumb">
        <img src="${design.image}" alt="${design.name} invitation"
             width="600" height="600" loading="lazy"
             onerror="this.style.display='none'">
      </div>
      <div class="order-content">
        <a href="index.html#designs" class="order-back">← Choose a different design</a>
        <h1 class="order-title">${design.name}</h1>
        <h2 class="order-subtitle">How many events?</h2>
        <div class="plan-grid" style="grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));">${cards}</div>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const design = getDesignFromQuery();
  if(!design){ redirectToDesigns(); return; }

  const root = document.getElementById("order-root");
  if(!root) return;

  root.innerHTML = design.dynamic
    ? planPickerHtml(design)
    : comingSoonHtml(design);
});