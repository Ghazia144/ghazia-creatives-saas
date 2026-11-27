/* ============================================================
   GHAZIA CREATIVES — Payment page
   URL: payment.html?c=<public_code>
   Requires: js/config.js, js/payment-config.js
   ============================================================ */

const CREDS_KEY = "gc_order_creds_v1";
const params = new URLSearchParams(window.location.search);
const PUBLIC_CODE = (params.get("c") || "").trim();
const WHATSAPP_NUMBER = "923183040506";

const $ = (id) => document.getElementById(id);

let orderSummary = null;
let selectedMethod = "bank";
let selectedFile = null;
let resizedBlob = null;
let previewUrl = null;
let pendingUpload = null; // { blob, promise } - screenshot background mein upload hota hai

function setErr(id, msg) {
  const el = $("err_" + id);
  if (el) el.textContent = msg || "";
  const input = $(id);
  if (input) input.classList.toggle("has-error", Boolean(msg));
}

function clearErrors() {
  document.querySelectorAll(".err").forEach((e) => (e.textContent = ""));
  document.querySelectorAll(".has-error").forEach((e) => e.classList.remove("has-error"));
}

function getCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (!c.public_code || !c.secret_token) return null;
    return c;
  } catch (_) {
    return null;
  }
}

function showMissingToken() {
  const creds = getCreds();
  const hasToken = Boolean(creds && creds.secret_token);
  $("payContainer").innerHTML = `
    <div class="pay-card pay-missing">
      <h1>Open this on the same device</h1>
      <p>Please open this link on the device where you filled the form, or WhatsApp us and we'll help you complete the payment.</p>
      <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Hi! I need help with payment for order ${PUBLIC_CODE || "(no code)"}.`
      )}" target="_blank" class="btn btn-primary">WhatsApp us</a>
      <p class="pay-note" style="margin-top:18px;">${hasToken ? "" : "Your secret token was not found in this browser."}</p>
    </div>
  `;
}

// ---------- Image resize ----------
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1600;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not process image."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.8
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    img.src = url;
  });
}

// ---------- UI render ----------
function renderPaymentForm() {
  const amountText = `Rs ${Number(orderSummary.amount).toLocaleString("en-US")}`;
  const designName = orderSummary.design_name || orderSummary.design_id || "Design";
  const methodKeys = Object.keys(PAYMENT_METHODS);
  const showTabs = methodKeys.length > 1;

  $("payContainer").innerHTML = `
    <div class="pay-card">
      <h1>Complete payment</h1>
      <p class="pay-note">Order code: <strong>${escapeAttr(PUBLIC_CODE)}</strong></p>

      <div class="pay-summary">
        <div><strong>Design:</strong> ${designName}</div>
        <div><strong>Plan:</strong> ${orderSummary.plan === 1 ? "1 Event" : (orderSummary.plan === 2 ? "2 Events" : "2+ Events")}</div>
      </div>

      <div class="pay-amount">
        <div class="label">Amount to pay</div>
        <div class="value">${amountText}</div>
      </div>

      ${showTabs ? `
        <div class="pay-tabs" id="methodTabs">
          ${methodKeys.map((key) => `
            <button type="button" class="pay-tab ${key === selectedMethod ? "active" : ""}" data-method="${key}">
              ${PAYMENT_METHODS[key].label}
            </button>
          `).join("")}
        </div>
      ` : ""}

      <div class="pay-details" id="methodDetails"></div>

      <p class="pay-instruction">
        Send the exact amount, then enter the Transaction ID and upload the screenshot below.
      </p>

      <!-- Honeypot -->
      <input type="text" id="website" name="website" class="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">

      <label class="field">
        <span>Transaction ID *</span>
        <input type="text" id="txn_id" name="txn_id" maxlength="24" placeholder="6–24 letters or digits" autocomplete="off">
        <small class="err" id="err_txn_id"></small>
      </label>

      <label class="field">
        <span>Screenshot *</span>
        <div class="file-row">
          <input type="file" id="screenshot" accept="image/*">
          <img id="thumb" class="thumb" alt="Screenshot preview">
        </div>
        <small class="err" id="err_screenshot"></small>
      </label>

      <div class="progress-wrap" id="progressWrap">
        <div class="progress-bar" id="progressBar"></div>
      </div>

      <div class="submit-row">
        <button type="button" class="btn btn-primary" id="submitBtn">Submit payment</button>
        <small class="err" id="err_submit"></small>
      </div>

      <p class="pay-note">Your payment will be verified by our team. You'll be redirected after submitting. By submitting, you agree to our <a href="terms.html" target="_blank" rel="noopener" style="text-decoration:underline;">Terms &amp; Refund Policy</a>.</p>
    </div>
  `;

  renderMethodDetails();
  bindFormEvents();
}

function renderMethodDetails() {
  const details = PAYMENT_METHODS[selectedMethod];
  if (!details) {
    $("methodDetails").innerHTML = "";
    return;
  }
  const rows = [];
  for (const key of Object.keys(details)) {
    if (key === "label") continue;
    const value = details[key];
    if (!value) continue;
    rows.push(`
      <div class="row">
        <span>${value}</span>
        <button type="button" class="copy-btn" data-copy="${escapeAttr(value)}">Copy</button>
      </div>
    `);
  }
  $("methodDetails").innerHTML = rows.join("");
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy"), 1200);
      } catch (_) {
        btn.textContent = "Copy failed";
      }
    });
  });
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function bindFormEvents() {
  const tabs = $("methodTabs");
  if (tabs) {
    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".pay-tab");
      if (!btn) return;
      selectedMethod = btn.dataset.method;
      document.querySelectorAll(".pay-tab").forEach((b) => b.classList.toggle("active", b === btn));
      renderMethodDetails();
    });
  }

  $("screenshot").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    setErr("screenshot", "");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErr("screenshot", "Please choose an image file.");
      return;
    }

    selectedFile = file;
    try {
      resizedBlob = await resizeImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(resizedBlob);
      const thumb = $("thumb");
      thumb.src = previewUrl;
      thumb.style.display = "block";
      // Submit dabane se pehle hi upload shuru kar do
      const creds = getCreds();
      pendingUpload = creds ? startUpload(creds, resizedBlob) : null;
    } catch (err) {
      setErr("screenshot", err.message || "Could not process image.");
      resizedBlob = null;
      pendingUpload = null;
    }
  });

  $("submitBtn").addEventListener("click", submitPayment);
}

// ---------- Background upload (screenshot chunne ke foran baad upload shuru) ----------
function startUpload(creds, blob) {
  const promise = (async () => {
    const upload = await api("upload-url", {
      public_code: creds.public_code,
      secret_token: creds.secret_token
    });
    const putRes = await fetch(upload.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: blob
    });
    if (!putRes.ok) throw new Error("Could not upload screenshot. Please try again.");
    return upload.path;
  })();
  promise.catch(() => {}); // asli error submit par handle hota hai
  return { blob, promise };
}

// ---------- API calls ----------
async function api(action, payload) {
  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
    },
    body: JSON.stringify({ action, ...payload })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Request failed.");
  }
  return json;
}

async function loadSummary() {
  const creds = getCreds();
  if (!creds) {
    showMissingToken();
    return;
  }

  try {
    const data = await api("get", {
      public_code: creds.public_code,
      secret_token: creds.secret_token
    });

    if (data.status !== "draft") {
      window.location.replace(`status.html?c=${encodeURIComponent(creds.public_code)}`);
      return;
    }

     orderSummary = data;
    renderPaymentForm();
  } catch (err) {
    const msg = String(err && err.message || "");
    if (/failed to fetch|network|load failed/i.test(msg)) {
      $("payContainer").innerHTML = `<div class="pay-card pay-missing"><h1>Connection problem</h1><p>Internet slow lag raha hai. Please dobara try karein.</p><button type="button" class="btn btn-primary" onclick="location.reload()">Retry</button></div>`;
    } else {
      showMissingToken();
    }
  }
}

function setSubmitting(on) {
  const btn = $("submitBtn");
  if (!btn) return;
  btn.disabled = on;
  btn.textContent = on ? "Submitting…" : "Submit payment";
}

function validatePaymentForm() {
  clearErrors();
  let ok = true;

  const txn = $("txn_id").value.trim();
  if (!/^[A-Za-z0-9]{6,24}$/.test(txn)) {
    setErr("txn_id", "Enter a valid Transaction ID (6–24 letters or digits).");
    ok = false;
  }

  if (!resizedBlob) {
    setErr("screenshot", "Please upload a screenshot of your payment.");
    ok = false;
  }

  if ($("website").value) {
    setErr("submit", "Invalid request.");
    ok = false;
  }

  return ok;
}

async function submitPayment() {
  if (!validatePaymentForm()) return;

  const creds = getCreds();
  if (!creds) {
    showMissingToken();
    return;
  }

  setSubmitting(true);
  setErr("submit", "");

  try {
    const txn = $("txn_id").value.trim();

    // 1+2) Screenshot upload (aksar pehle hi ho chuka hota hai)
    let screenshotPath = null;
    if (pendingUpload && pendingUpload.blob === resizedBlob) {
      try { screenshotPath = await pendingUpload.promise; } catch (_) { screenshotPath = null; }
    }
    if (!screenshotPath) {
      pendingUpload = startUpload(creds, resizedBlob);
      screenshotPath = await pendingUpload.promise;
    }

    // 3) Submit the payment
    await api("submit-payment", {
      public_code: creds.public_code,
      secret_token: creds.secret_token,
      method: selectedMethod,
      txn_id: txn,
      screenshot_path: screenshotPath
    });

    window.location.href = `status.html?c=${encodeURIComponent(creds.public_code)}`;
  } catch (err) {
    setErr("submit", err.message || "Something went wrong. Please try again.");
    setSubmitting(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!PUBLIC_CODE) {
    window.location.replace("index.html#designs");
    return;
  }
  loadSummary();
});