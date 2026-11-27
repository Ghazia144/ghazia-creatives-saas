// SECURITY: order ka koi bhi data HTML mein dalne se pehle escape karo (naam, venue waghera customer likhta hai)
function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const supabaseClient = supabase.createClient(SUPABASE_FUNCTIONS_URL.replace('/functions/v1', ''), SUPABASE_PUBLISHABLE_KEY);
const ADMIN_FUNC_URL = `${SUPABASE_FUNCTIONS_URL}/admin`;
let currentFilter = 'all'; let currentOrderIdToReject = null;
const $ = (id) => document.getElementById(id);

async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) showDashboard(); else { $('loginSection').style.display = 'block'; $('dashboardSection').style.display = 'none'; }
}

$('loginBtn').addEventListener('click', async () => {
  const email = $('adminEmail').value.trim(); const password = $('adminPassword').value;
  $('loginError').textContent = '';
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { $('loginError').textContent = error.message; return; }
  showDashboard();
});

$('logoutBtn').addEventListener('click', async () => { await supabaseClient.auth.signOut(); location.reload(); });

async function showDashboard() {
  $('loginSection').style.display = 'none';
  $('dashboardSection').style.display = 'block';
  await loadOrders();
  const o = new URLSearchParams(location.search).get('o');
  if (o) openOrder(o);
}

async function callAdminApi(action, payload = {}) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return null;
  const res = await fetch(ADMIN_FUNC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ action, ...payload })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "API Error");
  return json;
}

async function loadOrders() {
  $('orderList').innerHTML = '<p style="text-align:center; color: var(--muted);">Loading...</p>';
  try { const data = await callAdminApi('list', { filter: currentFilter }); renderOrders(data.orders); }
  catch (err) { $('orderList').innerHTML = `<p style="color: red;">${esc(err.message)}</p>`; }
}

function renderOrders(orders) {
  if (!orders || orders.length === 0) { $('orderList').innerHTML = '<p style="text-align:center; color: var(--muted);">No orders found.</p>'; return; }
  $('orderList').innerHTML = orders.map(o => {
    const time = new Date(o.created_at).toLocaleString();
    return `
      <div class="order-card">
        <div class="order-card-header">
          <div><span class="order-code">${esc(o.public_code)}</span><span style="margin-left: 10px; font-weight: 600; text-transform: capitalize; color: ${o.status === 'paid' ? '#2e7d32' : (o.status === 'pending' ? '#e65100' : 'var(--muted)')}">${esc(o.status)}</span></div>
          <div class="order-time">${time}</div>
        </div>
        <div class="order-grid">
          <div>Design<strong>${esc(String(o.design_id).replace(/-/g, ' '))}</strong></div>
          <div>Plan<strong>${o.plan === 1 ? '1 Event' : (o.plan === 2 ? '2 Events' : '2+ Events')}</strong></div>
          <div>Amount<strong>Rs ${esc(o.amount)}</strong></div>
          <div>Method<strong style="text-transform:uppercase;">${esc(o.payment_method || 'N/A')}</strong></div>
          <div>Txn ID<strong>${esc(o.txn_id || 'N/A')}</strong></div>
          <div>Customer WhatsApp<strong>${esc(o.customer_whatsapp)}</strong></div>
          <div>Edits<strong>${esc(o.edits_used)} / ${esc(o.edits_max)}</strong></div>
        </div>
        <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 16px;">
          <div class="btn-group" style="flex-direction:row; gap: 8px;">
            <button class="btn btn-outline" onclick="openOrder('${esc(o.id)}')" style="padding: 8px 12px; font-size: 12px;">View Details</button>
            <button class="btn btn-outline" onclick="grantEdit('${esc(o.id)}')" style="padding: 8px 12px; font-size: 12px;">+1 Edit</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function openOrder(orderId) {
  try {
    const data = await callAdminApi('get', { order_id: orderId });
    const o = data.order;
    
    const baseUrl = typeof SITE_URL !== 'undefined' ? SITE_URL : 'https://ghaziacreatives.com';
    const inviteUrl = o.slug ? `${baseUrl}/i/${o.slug}` : `${baseUrl}/i.html?c=${o.public_code}`;
    const statusUrl = `${baseUrl}/status.html?c=${o.public_code}`;
    const editUrl = `${baseUrl}/edit.html?c=${o.public_code}&k=${o.secret_token}`;
    
    let waMsg = typeof ADMIN_APPROVE_MSG !== 'undefined' 
      ? ADMIN_APPROVE_MSG.replace(/{INVITE_URL}/g, inviteUrl).replace(/{STATUS_URL}/g, statusUrl).replace(/{EDIT_URL}/g, editUrl)
      : `Your invite is ready! Link: ${inviteUrl}`;
    const waLink = `https://wa.me/${o.customer_whatsapp}?text=${encodeURIComponent(waMsg)}`;

    // ---- POPUP CODE ----
    const modalHTML = `
      <div id="superModalOverlay" style="position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0,0,0,0.85) !important; z-index: 2147483647 !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 15px !important; box-sizing: border-box !important;">
        <div style="background: #fff !important; width: 100% !important; max-width: 500px !important; max-height: 90vh !important; overflow-y: auto !important; border-radius: 8px !important; padding: 20px !important; box-sizing: border-box !important; text-align: left !important;">
          
          <h3 style="text-align:center; margin-bottom: 15px; font-size: 18px; color: #000;">Order ${esc(o.public_code)}</h3>
          
          ${data.duplicate_txn ? '<div style="text-align:center; margin-bottom:16px; padding: 8px; background: #fdf2f2; color: red; font-weight: bold;">⚠️ DUPLICATE TXN ID</div>' : ''}
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 14px; color: #000;">
              <div><span style="color: #888;">Bride</span><br><strong>${esc(o.data?.bride?.name)}</strong></div>
              <div><span style="color: #888;">Groom</span><br><strong>${esc(o.data?.groom?.name)}</strong></div>
          </div>
          
          ${data.screenshot_url ? `<div style="margin-bottom: 15px;"><p style="font-size: 12px; color: #888; margin-bottom: 5px;">Screenshot:</p><img src="${esc(data.screenshot_url)}" style="width: 100%; max-height: 250px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;"></div>` : '<p>No screenshot.</p>'}
          
          <div style="display:flex; flex-direction: column; gap: 10px; margin-top: 20px;">
            ${o.status === 'pending' ? `
              <button onclick="approveOrder('${esc(o.id)}')" style="width: 100%; background: #2e7d32; color: white; padding: 12px; border: none; border-radius: 4px; font-weight: bold; font-size: 15px; cursor: pointer;">Approve Payment</button>
              <button onclick="promptReject('${esc(o.id)}')" style="width: 100%; background: #B23A48; color: white; padding: 12px; border: none; border-radius: 4px; font-weight: bold; font-size: 15px; cursor: pointer;">Reject Payment</button>
            ` : ''}
            
            ${o.status === 'paid' ? `
              <a href="${esc(waLink)}" target="_blank" style="display: block; width: 100%; text-align: center; background: #25D366; color: white; padding: 12px; border-radius: 4px; text-decoration: none; font-weight: bold; box-sizing: border-box;">Send WhatsApp Link</a>
            ` : ''}
            
            <button onclick="document.getElementById('superModalOverlay').remove()" style="width: 100%; background: #eee; color: #333; padding: 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 15px; cursor: pointer; margin-top: 5px;">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
  } catch (err) { 
    alert("Error: " + err.message); 
  }
}

window.approveOrder = async function(orderId) {
  if (!confirm("Are you sure you want to approve this payment?")) return;
  try { await callAdminApi('approve', { order_id: orderId }); alert("Approved!"); location.reload(); } catch (err) { alert(err.message); }
}

window.grantEdit = async function(orderId) {
  if (!confirm("Grant 1 extra edit?")) return;
  try { await callAdminApi('grant-edit', { order_id: orderId }); alert("Edit granted!"); location.reload(); } catch (err) { alert(err.message); }
}

window.promptReject = function(orderId) { currentOrderIdToReject = orderId; $('rejectModal').style.display = 'flex'; $('rejectReasonSelect').value = "Screenshot is blurry or unreadable."; $('rejectReasonCustom').style.display = 'none'; $('rejectReasonCustom').value = ''; }

$('rejectReasonSelect').addEventListener('change', (e) => { $('rejectReasonCustom').style.display = e.target.value === 'custom' ? 'block' : 'none'; });
$('cancelReject').addEventListener('click', () => $('rejectModal').style.display = 'none');
$('confirmReject').addEventListener('click', async () => {
  let reason = $('rejectReasonSelect').value; if (reason === 'custom') reason = $('rejectReasonCustom').value.trim();
  if (!reason) return alert("Please enter a reason.");
  try { await callAdminApi('reject', { order_id: currentOrderIdToReject, reason }); $('rejectModal').style.display = 'none'; location.reload(); } catch (err) { alert(err.message); }
});

window.zoomImg = function(src) { $('zoomedImg').src = src; $('imgModal').style.display = 'flex'; $('imgModal').addEventListener('click', () => $('imgModal').style.display = 'none', { once: true }); }

document.querySelectorAll('.tab').forEach(tab => { tab.addEventListener('click', (e) => { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); e.target.classList.add('active'); currentFilter = e.target.dataset.filter; loadOrders(); }); });

checkAuth();