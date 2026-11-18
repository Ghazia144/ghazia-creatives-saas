document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('c');
  const container = document.getElementById('statusContainer');

  if (!code) { renderNotFound(); return; }

  let pollInterval = null; let pollCount = 0; const MAX_POLLS = 120;
  const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

  async function fetchStatus(isPolling = false) {
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_PUBLISHABLE_KEY, "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: "status", public_code: code })
      });
      if (res.status === 404) { renderNotFound(); if (pollInterval) clearInterval(pollInterval); return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load status");
      renderView(json, isPolling);
    } catch (err) {
      console.error(err);
      if (!isPolling) container.innerHTML = `<h1>Error</h1><p style="color: #B23A48; font-weight: 500;">${err.message}</p>`;
    }
  }

  function renderView(data, isPolling = false) {
    if (data.status === 'paid') { if (pollInterval) clearInterval(pollInterval); renderPaid(data); }
    else if (data.status === 'pending') { renderPending(); if (!isPolling && !pollInterval) startPolling(); }
    else if (data.status === 'draft') { if (pollInterval) clearInterval(pollInterval); renderDraft(data); }
    else renderNotFound();
  }

  function renderPending() {
    if (container.querySelector('.pulse-ring')) return;
    container.innerHTML = `
      <div class="pulse-ring" style="margin: 0 auto 20px auto;"></div>
      <h1>Verification in Progress</h1>
      <div class="code-badge">Order: ${code}</div>
      <p>Payment will be verified within 1 hour.</p>
      <p>Come back in a while. Your invitation will be delivered directly to your WhatsApp when ready.</p>
      <button onclick="location.reload()" class="btn btn-outline" style="margin-top: 20px;">Refresh Now</button>
    `;
  }

  function renderPaid(data) {
    const origin = window.location.origin;
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    // CLEAN URL LOGIC:
    const inviteUrl = isLocal ? `${origin}${basePath}/i.html?c=${code}` : `${SITE_URL}/i/${data.slug}`;
    const waMsg = encodeURIComponent(WHATSAPP_SHARE_MSG + inviteUrl);
    const waLink = `https://wa.me/?text=${waMsg}`;

    let editBtnHtml = `<p style="font-size: 13px; color: var(--muted); margin-top: 12px;">Open the edit link from our WhatsApp message.</p>`;
    try {
      const creds = JSON.parse(localStorage.getItem("gc_order_creds_v1") || "null");
      if (creds && creds.public_code === code && creds.secret_token) {
        if (data.edits_left > 0) editBtnHtml = `<a href="edit.html?c=${code}&k=${creds.secret_token}" class="btn btn-outline" style="margin-top: 12px;">Edit my invitation (${data.edits_left} of 3 left)</a>`;
        else editBtnHtml = `<a href="#" class="btn btn-outline" style="margin-top: 12px; opacity: 0.5; pointer-events: none;">No edits left</a>`;
      }
    } catch(e) {}

    container.innerHTML = `
      <h1 style="color: var(--maroon-dk); margin-bottom: 8px;">Payment Verified</h1>
      <p style="margin-bottom: 24px;">Your invitation is ready to be shared with your guests.</p>
      <div class="copy-box"><input type="text" id="inviteLink" value="${inviteUrl}" readonly><button class="copy-btn" id="copyBtn">Copy</button></div>
      <div class="btn-group">
        <a href="${inviteUrl}" class="btn btn-primary">Open My Invitation</a>
        <a href="${waLink}" target="_blank" class="btn btn-outline">Share on WhatsApp</a>
        ${editBtnHtml}
      </div>
    `;
    document.getElementById('copyBtn').addEventListener('click', () => {
      const input = document.getElementById('inviteLink'); input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.getElementById('copyBtn'); btn.textContent = 'Copied';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      });
    });
  }

  function renderDraft(data) {
    const payUrl = `payment.html?c=${code}`;
    let html = `<h1>Payment Not Submitted</h1><div class="code-badge">Order: ${code}</div><p>You have not submitted the payment screenshot yet.</p>`;
    if (data.admin_note) html = `<h1 style="color: #B23A48;">Verification Failed</h1><div class="code-badge">Order: ${code}</div><p>We could not verify your payment: <br><br><strong style="color: var(--ink); background: #fdf2f2; padding: 10px; display: block; border-radius: 4px;">"${data.admin_note}"</strong><br> Please submit it again.</p>`;
    html += `<div class="btn-group"><a href="${payUrl}" class="btn btn-primary">Submit Payment</a></div><a href="https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=Hi, I need help with order ${code}" class="help-link" target="_blank">Need help? WhatsApp us</a>`;
    container.innerHTML = html;
  }

  function renderNotFound() {
    container.innerHTML = `<h1>Order Not Found</h1><p>We couldn't find an order with this code. Please double-check the link.</p><div class="btn-group"><a href="https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=Hi, my order code is ${code || '(unknown)'}" target="_blank" class="btn btn-primary">WhatsApp Us</a></div>`;
  }

  function startPolling() {
    pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pollCount++;
        if (pollCount >= MAX_POLLS) { clearInterval(pollInterval); }
        else fetchStatus(true);
      }
    }, 15000);
  }
  fetchStatus();
});