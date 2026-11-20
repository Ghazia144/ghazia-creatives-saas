/* ============================================================
   GHAZIA CREATIVES — Order form (Unlimited Events for Plan 3)
   ============================================================ */

const VALID_DESIGN_IDS = [
  "royal-nikah", "enchanted-garden", "bunny", "royal-blush",
  "fairytale", "enchanted-rapunzel", "shaadi-festivities", "family-celebration", "green-magic"
];

const EVENT_TYPES = ["Mehendi", "Mayoon", "Dholki", "Qawali Night", "Nikah", "Barat", "Valima"];
const STORAGE_KEY = "gc_order_form_draft_v1";

// ==========================================
// AUTOMATIC RESET FOR TESTING
// Agar URL mein ?test=new ho, toh purana data clear karo
// ==========================================
if (window.location.search.includes('test=new')) {
  localStorage.removeItem("gc_order_creds_v1");      // Purana token/order ID hatao
  localStorage.removeItem("gc_order_form_draft_v1");  // Purana bhara hua form hatao
  console.log("🧹 Test mode: Purana data clear ho gaya!");
}

const CREDS_KEY = "gc_order_creds_v1";

const params = new URLSearchParams(window.location.search);
let DESIGN_ID = (params.get("design") || "").trim();
let PLAN = Number(params.get("plan"));

if (!VALID_DESIGN_IDS.includes(DESIGN_ID)) window.location.replace("index.html#designs");
if (![1, 2, 3].includes(PLAN)) window.location.replace("index.html#designs");

const $ = (id) => document.getElementById(id);
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// --- DYNAMIC EVENT COUNT ---
let TOTAL_EVENTS = PLAN === 1 ? 1 : (PLAN === 2 ? 2 : 7);
let activeEventPrefixes = [];

function normalizePkPhone(raw) {
  const s = String(raw || "").replace(/[\s\-()]/g, "");
  if (/^03\d{9}$/.test(s)) return "92" + s.slice(1);
  if (/^\+923\d{9}$/.test(s)) return s.slice(1);
  if (/^923\d{9}$/.test(s)) return s;
  return null;
}

function setErr(id, msg) {
  const el = $("err_" + id); if (el) el.textContent = msg || "";
  const input = $(id); if (input) input.classList.toggle("has-error", Boolean(msg));
}
function clearErrors() {
  document.querySelectorAll(".err").forEach((e) => (e.textContent = ""));
  document.querySelectorAll(".has-error").forEach((e) => e.classList.remove("has-error"));
}

function fillTypeSelect(select, excludeTypes = []) {
  const current = select.value;
  select.innerHTML = `<option value="">Select event type</option>` +
    EVENT_TYPES.filter((t) => !excludeTypes.includes(t)).map((t) => `<option value="${t}">${t}</option>`).join("");
  if (current && !excludeTypes.includes(current)) select.value = current;
}

function updateEventTypes() {
  for (let i = 1; i <= TOTAL_EVENTS; i++) {
    const currentSelect = $(`e${i}_type`);
    if (!currentSelect) continue;
    const currentVal = currentSelect.value;
    const excludeTypes = [];
    for (let j = 1; j <= TOTAL_EVENTS; j++) {
      if (i !== j) {
        const val = $(`e${j}_type`)?.value;
        if (val) excludeTypes.push(val);
      }
    }
    fillTypeSelect(currentSelect, excludeTypes);
    if (currentVal && !excludeTypes.includes(currentVal)) currentSelect.value = currentVal;
  }
}

function toggleRukhsati(prefix) {
  const type = $(prefix + "_type")?.value;
  const wrap = $(prefix + "_rukhsati_wrap");
  if (!wrap) return;
  const show = type === "Barat";
  wrap.hidden = !show;
  if (!show) { const input = $(prefix + "_rukhsati"); if (input) input.value = ""; }
}

function eventBlockHtml(prefix, title, index) {
  const removeBtn = (PLAN === 3 && index > 3) 
    ? `<div style="text-align:right; margin-bottom:10px;"><button type="button" class="btn btn-outline" style="padding:4px 10px; font-size:12px; border-color:#B23A48; color:#B23A48;" onclick="removeEventBlock(${index})">Remove Event</button></div>` 
    : "";

  return `
    <section class="form-card" id="card_${prefix}">
      ${removeBtn}
      <h2>${title}</h2>
      <label class="field"><span>Event type *</span><select id="${prefix}_type" name="${prefix}_type"><option value="">Select event type</option></select><small class="err" id="err_${prefix}_type"></small></label>
      <label class="field"><span>Event date *</span><input type="date" id="${prefix}_date" name="${prefix}_date" min="${todayStr()}"><small class="err" id="err_${prefix}_date"></small></label>
      <label class="field"><span>Venue name *</span><input type="text" id="${prefix}_venue_name" name="${prefix}_venue_name" maxlength="80" placeholder="e.g. Pearl Continental"><small class="err" id="err_${prefix}_venue_name"></small></label>
      <label class="field"><span>Venue address *</span><input type="text" id="${prefix}_venue_address" name="${prefix}_venue_address" maxlength="140" placeholder="Street, area, city"><small class="err" id="err_${prefix}_venue_address"></small></label>
            <label class="field">
        <span style="display:flex; align-items:center; gap:6px;">
          Google Maps link (optional)
          <span class="tooltip-wrap">
            <span class="info-icon">?</span>
            <span class="tooltip-text">Open Google Maps > Search Venue > Tap Share > Copy Link</span>
          </span>
        </span>
        <input type="url" id="${prefix}_maps" name="${prefix}_maps" placeholder="Paste Google Maps link here...">
        <small class="err" id="err_${prefix}_maps"></small>
      </label>
      <div class="two-col">
          <label class="field"><span>Gathering time (Select AM/PM) *</span><input type="time" id="${prefix}_gathering" name="${prefix}_gathering"><small class="err" id="err_${prefix}_gathering"></small></label>
        <label class="field"><span>Dinner time (Select AM/PM)</span><input type="time" id="${prefix}_dinner" name="${prefix}_dinner"><small class="err" id="err_${prefix}_dinner"></small></label>
      </div>
      <label class="field" id="${prefix}_rukhsati_wrap" hidden><span>Rukhsati time (Select AM/PM)</span><input type="time" id="${prefix}_rukhsati" name="${prefix}_rukhsati"><small class="err" id="err_${prefix}_rukhsati"></small></label>
    </section>
  `;
}

function renderFormStructure() {
  let eventsHtml = "";
  for (let i = 1; i <= TOTAL_EVENTS; i++) {
    eventsHtml += eventBlockHtml("e" + i, "Event " + i, i);
  }
  $("eventSlots").innerHTML = eventsHtml;
  
  $("addEventBtn").style.display = (PLAN === 3) ? "inline-block" : "none";

  for (let i = 1; i <= TOTAL_EVENTS; i++) {
    const prefix = "e" + i;
    fillTypeSelect($(prefix + "_type"));
    $(prefix + "_type").addEventListener("change", () => {
      toggleRukhsati(prefix); updateEventTypes(); saveDraft(); updatePreview();
    });
    toggleRukhsati(prefix);
  }
}

// ADD/REMOVE logic for Plan 3
$("addEventBtn").addEventListener("click", () => {
  const draft = collectDraft();
  TOTAL_EVENTS++;
  renderFormStructure();
  restoreDraftData(draft); // Re-populate fields
});

window.removeEventBlock = function(index) {
  const draft = collectDraft();
  // Shift data up
  for (let i = index; i < TOTAL_EVENTS; i++) {
    const next = i + 1;
    ["type", "date", "venue_name", "venue_address", "maps", "gathering", "dinner", "rukhsati"].forEach(field => {
      draft["e" + i + "_" + field] = draft["e" + next + "_" + field];
    });
  }
  TOTAL_EVENTS--;
  renderFormStructure();
  restoreDraftData(draft);
};

function validateEvent(prefix) {
  let ok = true;
  const type = $(prefix + "_type").value;
  const date = $(prefix + "_date").value;
  const venueName = $(prefix + "_venue_name").value.trim();
  const venueAddress = $(prefix + "_venue_address").value.trim();
  const maps = $(prefix + "_maps").value.trim();
  const gathering = $(prefix + "_gathering").value;

  if (!type) { setErr(prefix + "_type", "Please choose an event type."); ok = false; }
  if (!date) { setErr(prefix + "_date", "Please choose a date."); ok = false; }
  else if (date < todayStr()) { setErr(prefix + "_date", "Date cannot be in the past."); ok = false; }
  if (!venueName) { setErr(prefix + "_venue_name", "Venue name is required."); ok = false; }
  if (!venueAddress) { setErr(prefix + "_venue_address", "Venue address is required."); ok = false; }
  if (maps && !/^https:\/\//i.test(maps)) { setErr(prefix + "_maps", "Maps link must start with https://"); ok = false; }
  if (!gathering) { setErr(prefix + "_gathering", "Gathering time is required."); ok = false; }
  return ok;
}

function validateForm() {
  clearErrors();
  let ok = true;
  if (!$("bride_name").value.trim()) { setErr("bride_name", "Required."); ok = false; }
  if (!$("bride_father").value.trim()) { setErr("bride_father", "Required."); ok = false; }
  if (!$("groom_name").value.trim()) { setErr("groom_name", "Required."); ok = false; }
  if (!$("groom_father").value.trim()) { setErr("groom_father", "Required."); ok = false; }
  
  for (let i = 1; i <= TOTAL_EVENTS; i++) { 
    if (!validateEvent("e" + i)) ok = false; 
  }
  
  if (!normalizePkPhone($("rsvp_whatsapp").value)) { setErr("rsvp_whatsapp", "Invalid number."); ok = false; }
  if (!normalizePkPhone($("customer_whatsapp").value)) { setErr("customer_whatsapp", "Invalid number."); ok = false; }
  return ok;
}

function eventData(prefix) {
  const type = $(prefix + "_type").value;
  const isBarat = type === "Barat";
  return {
    type,
    date: $(prefix + "_date").value,
    venueName: $(prefix + "_venue_name").value.trim(),
    venueAddress: $(prefix + "_venue_address").value.trim(),
    mapsUrl: $(prefix + "_maps").value.trim() || null,
    gatheringTime: $(prefix + "_gathering").value,
    dinnerTime: $(prefix + "_dinner").value || null,
    rukhsatiTime: isBarat ? ($(prefix + "_rukhsati")?.value || null) : null
  };
}

function getFormData() {
  const events = [];
  for (let i = 1; i <= TOTAL_EVENTS; i++) events.push(eventData("e" + i));
  return {
    bride: { name: $("bride_name").value.trim(), father: $("bride_father").value.trim() },
    groom: { name: $("groom_name").value.trim(), father: $("groom_father").value.trim() },
    rsvpWhatsapp: normalizePkPhone($("rsvp_whatsapp").value) || "",
    note: $("note").value.trim(),
    rsvpDeadline: $("rsvp_deadline").value || null,
    audio_track: document.querySelector('input[name="audio_track"]:checked')?.value || "nasheed-1",
    events
  };
}
window.getFormData = getFormData;

function collectDraft() {
  const draft = {};
  document.querySelectorAll("#orderForm input, #orderForm select, #orderForm textarea").forEach((el) => {
    if (!el.name || el.name === "website") return;
    if (el.type === "checkbox") draft[el.name] = el.checked;
        else if (el.type === "radio") { if (el.checked) draft[el.name] = el.value; }
    else draft[el.name] = el.value;
  
  });
  return draft;
}
function restoreDraftData(draft) {
  Object.keys(draft).forEach((name) => {
    const el = document.querySelector(`[name="${name}"]`); if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(draft[name]); 
    else if (el.type === "radio") { el.checked = (el.value === draft[name]); }
    else el.value = draft[name];
    
  });
  for (let i = 1; i <= TOTAL_EVENTS; i++) toggleRukhsati("e" + i);
  updateEventTypes();
}
function saveDraft() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collectDraft())); } catch (_) {} }
function restoreDraft() {
  let raw; try { raw = localStorage.getItem(STORAGE_KEY); } catch (_) { return; }
  if (!raw) return;
  let draft; try { draft = JSON.parse(raw); } catch (_) { return; }
  restoreDraftData(draft);
  const same = $("same_as_rsvp");
  if (same && same.checked) { $("customer_whatsapp").value = $("rsvp_whatsapp").value; $("customer_whatsapp").disabled = true; }
}

let previewTimeout;
function updatePreview() {
  clearTimeout(previewTimeout);
  previewTimeout = setTimeout(() => {
    if (!PREVIEW_READY.includes(DESIGN_ID)) return;
    const data = getFormData();
    // Desktop aur mobile (drawer) dono iframes ko data bhejo
    document.querySelectorAll("#desktopPhoneFrame iframe, #mobileIframeContainer iframe").forEach(iframe => {
      if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'invite-data', data }, location.origin);
    });
  }, 250);
}

// Desktop preview panel sirf 960px+ par dikhta hai (CSS). Mobile par heavy invite load karna bekar hai.
function isDesktopView() { return window.matchMedia("(min-width: 960px)").matches; }

function renderPreviewPanel() {
  const isReady = PREVIEW_READY.includes(DESIGN_ID);
  const designObj = designs.find(d => d.id === DESIGN_ID) || {};
  const thumb = designObj.image || 'images/design-1.webp';
  const desktopFrame = $("desktopPhoneFrame");
  if (isReady) {
    if (isDesktopView()) {
      desktopFrame.innerHTML = `<iframe id="previewIframe" src="t/${DESIGN_ID}/index.html?preview=order" title="Live Preview"></iframe>`;
      $("previewIframe").addEventListener("load", updatePreview);
    } else {
      desktopFrame.innerHTML = ""; // mobile: preview "Show preview" button dabane par hi load hoga
    }
  } else {
    desktopFrame.innerHTML = `<div class="coming-soon-placeholder"><img src="${thumb}" alt="Design thumbnail" loading="lazy"><h3>Preview coming soon</h3></div>`;
  }
  $("mobileIframeContainer").innerHTML = "";
}

function initPreview() {
  renderPreviewPanel(); renderSwitcher();
  const form = $("orderForm");
  form.addEventListener("input", updatePreview); form.addEventListener("change", updatePreview);
  $("toggleSizeBtn").addEventListener("click", () => $("desktopPhoneFrame").classList.toggle("wide"));
  // Screen bari ho jaye (rotate / resize) to desktop preview ab bana do
  const mq = window.matchMedia("(min-width: 960px)");
  const onMq = (e) => { if (e.matches && PREVIEW_READY.includes(DESIGN_ID) && !$("previewIframe")) renderPreviewPanel(); };
  if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  $("showMobilePreview").addEventListener("click", () => {
    const container = $("mobileIframeContainer");
    if (PREVIEW_READY.includes(DESIGN_ID) && !container.querySelector("iframe")) {
      container.innerHTML = `<iframe src="t/${DESIGN_ID}/index.html?preview=order" title="Mobile Preview"></iframe>`;
      container.querySelector("iframe").addEventListener("load", updatePreview);
    } else {
      updatePreview(); // drawer dobara khula: latest details bhej do
    }
    $("mobileDrawer").classList.add("open"); document.body.style.overflow = "hidden";
  });
  $("closeMobilePreview").addEventListener("click", () => { $("mobileDrawer").classList.remove("open"); document.body.style.overflow = ""; });
}

function renderSwitcher() {
  const list = $("switcherList"); list.innerHTML = "";
  designs.forEach(d => {
    const item = document.createElement("div");
    item.className = `switcher-item ${d.id === DESIGN_ID ? 'active' : ''}`;
    item.innerHTML = `<img src="${d.image}" alt="${d.name}"><span>${d.name}</span>`;
    item.addEventListener("click", () => switchDesign(d.id));
    list.appendChild(item);
  });
}

async function switchDesign(newId) {
  if (newId === DESIGN_ID) return;
  DESIGN_ID = newId;
  const newUrl = new URL(window.location); newUrl.searchParams.set("design", newId); window.history.pushState({}, '', newUrl);
  $("designName").textContent = designs.find(d => d.id === newId)?.name || newId;
  renderSwitcher(); renderPreviewPanel(); updatePreview();
}

let slowSaveTimer;
function setSubmitting(on) {
  const btn = $("submitBtn"); if (!btn) return;
  clearTimeout(slowSaveTimer);
  btn.disabled = on; btn.textContent = on ? "Saving…" : "Save & continue";
  if (on) slowSaveTimer = setTimeout(() => { btn.textContent = "Still saving… please wait"; }, 6000);
}

async function submitOrder() {
  if (!validateForm()) {
    const firstErr = document.querySelector(".has-error");
    if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  setSubmitting(true);
  try {
    const creds = JSON.parse(localStorage.getItem(CREDS_KEY) || "null");
    const isUpdate = Boolean(creds && creds.public_code && creds.secret_token);
    const payload = {
      action: isUpdate ? "update" : "create",
      design_id: DESIGN_ID,
      plan: PLAN,
      data: getFormData(),
      customer_whatsapp: normalizePkPhone($("customer_whatsapp").value)
    };
    if (isUpdate) { payload.public_code = creds.public_code; payload.secret_token = creds.secret_token; }

    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_PUBLISHABLE_KEY, "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Could not save your order.");

    if (!isUpdate) localStorage.setItem(CREDS_KEY, JSON.stringify({ public_code: json.public_code, secret_token: json.secret_token }));
    window.location.href = `payment.html?c=${encodeURIComponent(json.public_code || creds.public_code)}`;
  } catch (err) {
    setErr("submit", err.message || "Something went wrong."); setSubmitting(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("designName").textContent = designs.find(d => d.id === DESIGN_ID)?.name || DESIGN_ID;
  const planLabels = { 1: "1 Event", 2: "2 Events", 3: "2+ Events" };
  $("planLabel").textContent = planLabels[PLAN] || "Plan";
  renderFormStructure(); restoreDraft(); initPreview();

  const form = $("orderForm");
  form.addEventListener("input", saveDraft); form.addEventListener("change", saveDraft);

  $("same_as_rsvp").addEventListener("change", (e) => {
    const customer = $("customer_whatsapp");
    if (e.target.checked) { customer.value = $("rsvp_whatsapp").value; customer.disabled = true; }
    else customer.disabled = false;
    saveDraft(); updatePreview();
  });
  $("rsvp_whatsapp").addEventListener("input", () => { if ($("same_as_rsvp").checked) $("customer_whatsapp").value = $("rsvp_whatsapp").value; });

  const note = $("note"); const counter = $("noteCount");
  const updateCounter = () => (counter.textContent = `${note.value.length}/400`);
  note.addEventListener("input", updateCounter); updateCounter();
  $("submitBtn").addEventListener("click", submitOrder);

  document.querySelectorAll('input[type="date"]').forEach((el) => { if (el.id !== "rsvp_deadline") el.min = todayStr(); });
  const deadline = $("rsvp_deadline"); if (deadline) deadline.min = todayStr();
});