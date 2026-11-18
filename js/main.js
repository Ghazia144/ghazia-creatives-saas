/* ============================================================
   GHAZIA CREATIVES — Main JS
   Depends on js/data.js (must load first)
   ============================================================ */

// ⚠️ APNA WHATSAPP NUMBER YAHAN DAALO
// Country code ke saath, bina +, bina space, bina dash
// Example: 03001234567 → 923001234567
const WHATSAPP_NUMBER = "923183040506";

// ============================================================
// DESIGNS RENDER
// ============================================================
function renderDesigns(){
  renderGrid("premiumGrid", "premium");
  renderGrid("standardGrid", "standard");
}

function renderGrid(gridId, category){
  const grid = document.getElementById(gridId);
  if(!grid) return;

  grid.innerHTML = designs.filter(d => d.category === category).map(d => {
    const imageHtml = d.image
      ? `<img src="${d.image}" alt="${d.name} invitation design" loading="lazy" width="600" height="600"
             onerror="this.style.display='none'; this.parentElement.insertAdjacentHTML('beforeend', '<span class=\\'placeholder-text\\'>${d.name}<br>image coming soon</span>');">`
      : `<span class="placeholder-text">${d.name}<br>image coming soon</span>`;

    const overlayHtml = d.liveUrl
      ? `<div class="design-overlay">
            <a href="${d.liveUrl}" target="_blank" rel="noopener" class="btn btn-outline-light btn-sm">See Live Preview</a>
          </div>`
      : "";

    const liveBtn = d.liveUrl
      ? `<a href="${d.liveUrl}" target="_blank" rel="noopener" class="btn btn-outline">See Live</a>`
      : "";

    return `
      <article class="design-card ${d.category === "premium" ? "design-card-premium" : ""}">
        <div class="design-image">
          <span class="design-badge ${d.category === "premium" ? "design-badge-premium" : ""}">${d.badge}</span>
          ${imageHtml}
          ${overlayHtml}
        </div>
        <div class="design-body">
          <div class="design-head">
            <h3>${d.name}</h3>
          </div>
          <p class="design-desc">${d.desc}</p>
          <div class="design-meta">
            <span class="design-meta-item">✦ Vibe: ${d.vibe}</span>
            <span class="design-meta-item">✦ Delivery: ${d.delivery || "24 hours"}</span>
          </div>
          <div class="design-actions">
            ${liveBtn}
            <a href="order.html?design=${encodeURIComponent(d.id)}"
               class="btn btn-primary">Order</a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// ============================================================
// FAQ ACCORDION
// ============================================================
function initFaq(){
  document.querySelectorAll(".faq-q").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
      if(!isOpen) item.classList.add("open");
    });
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  renderDesigns();
  initFaq();
});
