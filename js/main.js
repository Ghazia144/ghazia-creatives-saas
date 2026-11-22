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
            <span class="design-meta-item">✦ Delivery: ${d.delivery || "within few minutes"}</span>
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


(function () {
  'use strict';

  var MSG = "🚫 Screenshot and Screen Recording isn't allowed";
  var hideTimer = null;

  // ---------- Overlay + blur styles ----------
  var style = document.createElement('style');
  style.textContent =
    '#ss-block{position:fixed;inset:0;z-index:2147483647;display:none;' +
    'align-items:center;justify-content:center;text-align:center;padding:24px;' +
    'background:rgba(0,0,0,.92);color:#fff;font:600 18px/1.5 system-ui,sans-serif;' +
    '-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);}' +
    '#ss-block.show{display:flex;}' +
    'body.ss-hide > *:not(#ss-block){filter:blur(25px)!important;}' +
    '*{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;}' +
    'input,textarea{-webkit-user-select:text;user-select:text;}' +
    '@media print{body{display:none!important;}}';
  document.head.appendChild(style);

  var box = document.createElement('div');
  box.id = 'ss-block';
  box.textContent = MSG;
  document.body.appendChild(box);

  // ---------- Show / hide ----------
  function block(permanentUntilFocus) {
    box.textContent = MSG;
    box.classList.add('show');
    document.body.classList.add('ss-hide');
    try { navigator.clipboard && navigator.clipboard.writeText(''); } catch (e) {}
    clearTimeout(hideTimer);
    if (!permanentUntilFocus) {
      hideTimer = setTimeout(unblock, 3000);
    }
  }

  function unblock() {
    if (document.visibilityState === 'hidden') return;
    box.classList.remove('show');
    document.body.classList.remove('ss-hide');
  }

  // ---------- Keyboard (Desktop) ----------
  function handleKey(e) {
    var k = (e.key || '').toLowerCase();
    var code = e.code || '';
    var ctrl = e.ctrlKey, meta = e.metaKey, shift = e.shiftKey;

    var isPrintScreen = k === 'printscreen' || code === 'PrintScreen' || e.keyCode === 44;
    var winSnip = meta && shift && k === 's';                       // Win+Shift+S
    var macShot = meta && shift && ['3', '4', '5', '6'].indexOf(k) > -1; // Cmd+Shift+3/4/5
    var macShotCode = meta && shift && /^Digit[3-6]$/.test(code);
    var ctrlShiftS = ctrl && shift && k === 's';
    var saveOrPrint = (ctrl || meta) && (k === 's' || k === 'p' || k === 'u');
    var devtools = k === 'f12' || ((ctrl || meta) && shift && ['i', 'j', 'c'].indexOf(k) > -1);
    var gameBar = meta && (k === 'g' || (e.altKey && (k === 'r' || code === 'KeyR'))); // Win+G, Win+Alt+R

    if (isPrintScreen || winSnip || macShot || macShotCode || ctrlShiftS || saveOrPrint || devtools || gameBar) {
      e.preventDefault();
      e.stopPropagation();
      block();
      return false;
    }
  }
  document.addEventListener('keydown', handleKey, true);
  document.addEventListener('keyup', handleKey, true); // PrintScreen aksar sirf keyup pe aata hai

  // ---------- Window focus / tab change (Mobile + Desktop) ----------
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      block(true);
    } else {
      setTimeout(unblock, 300);
    }
  });
  window.addEventListener('blur', function () { block(true); });
  window.addEventListener('focus', function () { setTimeout(unblock, 300); });
  window.addEventListener('pagehide', function () { block(true); });
  window.addEventListener('pageshow', function () { setTimeout(unblock, 300); });

  // ---------- Print ----------
  window.addEventListener('beforeprint', function () { block(true); });
  window.addEventListener('afterprint', function () { setTimeout(unblock, 300); });

  // ---------- Right click / long press / drag / copy ----------
  ['contextmenu', 'dragstart', 'copy', 'cut', 'selectstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    }, true);
  });

  // ---------- Screen capture API (agar isi site se capture ho) ----------
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      var orig = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = function () {
        block();
        return Promise.reject(new DOMException('Not allowed', 'NotAllowedError'));
      };
    }
  } catch (e) {}

  // ---------- Overlay hataya jaye to wapas laga do ----------
  new MutationObserver(function () {
    if (!document.getElementById('ss-block')) document.body.appendChild(box);
  }).observe(document.body, { childList: true });
})();

// 3-finger gesture pe blur
function threeFinger(e) {
  if (e.touches && e.touches.length >= 3) {
    e.preventDefault();
    block();
  }
}
document.addEventListener('touchstart', threeFinger, { passive: false, capture: true });
document.addEventListener('touchmove', threeFinger, { passive: false, capture: true });





(function(){
  var v=document.getElementById('howVideo'), b=document.getElementById('howSound');
  if(!v) return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if('IntersectionObserver' in window && !reduce){
    new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); }
        else { v.pause(); }
      });
    },{threshold:0.4}).observe(v);
  } else { v.controls=true; if(b) b.style.display='none'; }
  if(b) b.addEventListener('click',function(){
    v.muted=!v.muted;
    b.classList.toggle('on',!v.muted);
    b.setAttribute('aria-label',v.muted?'Turn sound on':'Turn sound off');
    if(v.paused){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); }
  });
})();
