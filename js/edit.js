document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  let code = params.get('c');
  let token = params.get('k');

  // Move token to sessionStorage for security
  if (token) {
    sessionStorage.setItem('edit_token_' + code, token);
    window.history.replaceState({}, document.title, `edit.html?c=${code}`);
  } else {
    token = sessionStorage.getItem('edit_token_' + code);
  }

  if (!code || !token) {
    showError("Missing edit credentials. Please use the link provided in your WhatsApp message.");
    return;
  }

  let currentPlan = 1;
  let currentEditsMax = 3;
  let currentEditsUsed = 0;
  let totalEvents = 1;

  const EVENT_TYPES = ["Mehendi", "Mayoon", "Dholki", "Qawali Night", "Nikah", "Barat", "Valima"];

  // Initialize
  async function loadOrder() {
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ action: "get-for-edit", public_code: code, secret_token: token })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");

      currentPlan = json.plan;
      currentEditsMax = json.edits_max || 3;
      currentEditsUsed = json.edits_used || 0;
      
      // Plan 3 means 5 events, Plan 2 means 2, Plan 1 means 1
      totalEvents = currentPlan === 3 ? 7 : currentPlan;

      renderForm(json.data);
      updateBanner();

      document.getElementById('loadingState').style.display = 'none';
      document.getElementById('editContent').style.display = 'block';
      document.getElementById('openInviteLink').href = `/i.html?c=${code}`;

      if (currentEditsUsed >= currentEditsMax) disableSaving();

    } catch (err) {
      showError(err.message);
    }
  }

  function updateBanner() {
    const banner = document.getElementById('editBanner');
    const left = currentEditsMax - currentEditsUsed;
    
    if (left <= 0) {
      banner.textContent = "No edits left";
      banner.classList.add('disabled');
    } else {
      banner.textContent = `Edits left: ${left} of ${currentEditsMax}`;
      banner.classList.remove('disabled');
    }
  }

  function disableSaving() {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = "No edits left";
    document.getElementById('saveMsg').innerHTML = 'You have used all your edits. <a href="https://wa.me/923183040506" target="_blank" style="text-decoration:underline;">WhatsApp us</a> if you need help.';
    document.querySelectorAll('#editForm input, #editForm select, #editForm textarea').forEach(el => el.disabled = true);
  }

  function showError(msg) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMsg').textContent = msg;
  }

  function eventBlockHtml(prefix, title) {
    return `
      <section class="form-card" id="card_${prefix}">
        <h2>${title}</h2>
        <label class="field">
          <span>Event type *</span>
          <select id="${prefix}_type"></select>
        </label>
        <label class="field">
          <span>Event date *</span>
          <input type="date" id="${prefix}_date">
        </label>
        <label class="field">
          <span>Venue name *</span>
          <input type="text" id="${prefix}_venue_name" maxlength="80">
        </label>
        <label class="field">
          <span>Venue address *</span>
          <input type="text" id="${prefix}_venue_address" maxlength="140">
        </label>
        <label class="field">
          <span>Google Maps link (optional)</span>
          <input type="url" id="${prefix}_maps">
        </label>
        <div class="two-col">
          <label class="field">
            <span>Gathering time *</span>
            <input type="time" id="${prefix}_gathering">
          </label>
          <label class="field">
            <span>Dinner time (optional)</span>
            <input type="time" id="${prefix}_dinner">
          </label>
        </div>
        <label class="field" id="${prefix}_rukhsati_wrap" hidden>
          <span>Rukhsati time (optional — Barat only)</span>
          <input type="time" id="${prefix}_rukhsati">
        </label>
      </section>
    `;
  }

  function fillTypes(selectId, selectedVal, allSelectedTypes) {
    const select = document.getElementById(selectId);
    select.innerHTML = EVENT_TYPES.map(t => {
      // Agar type kisi aur event mein select ho chuka hai, toh usko disable karo
      const isUsed = allSelectedTypes.includes(t) && t !== selectedVal;
      return `<option value="${t}" ${isUsed ? 'disabled' : ''}>${t}${isUsed ? ' (Selected)' : ''}</option>`;
    }).join('');
    if (selectedVal) select.value = selectedVal;
  }

  function renderForm(data) {
    document.getElementById('bride_name').value = data.bride?.name || '';
    document.getElementById('bride_father').value = data.bride?.father || '';
    document.getElementById('groom_name').value = data.groom?.name || '';
    document.getElementById('groom_father').value = data.groom?.father || '';
    document.getElementById('rsvp_whatsapp').value = data.rsvpWhatsapp || '';
    document.getElementById('rsvp_deadline').value = data.rsvpDeadline || '';
    document.getElementById('note').value = data.note || '';

    const evs = data.events || [];
    
    // Clear existing slots
    const eventContainer = document.getElementById('eventSlots');
    if (eventContainer) eventContainer.innerHTML = '';
    
    // Render dynamic events based on plan
    for (let i = 1; i <= totalEvents; i++) {
      const prefix = 'e' + i;
      const wrapper = document.createElement('div');
      wrapper.innerHTML = eventBlockHtml(prefix, "Event " + i);
      
      if (eventContainer) eventContainer.appendChild(wrapper);
      else document.getElementById(`event${i}Slot`).innerHTML = eventBlockHtml(prefix, "Event " + i);

      // Setup logic for each event
      setTimeout(() => {
        const evData = evs[i-1] || {};
        const selectedTypes = evs.map(e => e.type);
        
        fillTypes(`${prefix}_type`, evData.type, selectedTypes);
        
        document.getElementById(`${prefix}_date`).value = evData.date || '';
        document.getElementById(`${prefix}_venue_name`).value = evData.venueName || '';
        document.getElementById(`${prefix}_venue_address`).value = evData.venueAddress || '';
        document.getElementById(`${prefix}_maps`).value = evData.mapsUrl || '';
        document.getElementById(`${prefix}_gathering`).value = evData.gatheringTime || '';
        document.getElementById(`${prefix}_dinner`).value = evData.dinnerTime || '';
        
        // Rukhsati logic
        const typeEl = document.getElementById(`${prefix}_type`);
        const wrapEl = document.getElementById(`${prefix}_rukhsati_wrap`);
        const inpEl = document.getElementById(`${prefix}_rukhsati`);
        
        const handleTypeChange = () => {
          if (typeEl.value === 'Barat') {
            wrapEl.hidden = false;
            if(!inpEl.value) inpEl.value = evData.rukhsatiTime || '';
          } else {
            wrapEl.hidden = true;
            inpEl.value = '';
          }
        };
        
        typeEl.addEventListener('change', handleTypeChange);
        handleTypeChange(); // Initial trigger
      }, 0);
    }
  }

  // --- Submit ---
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const left = currentEditsMax - currentEditsUsed;
    if (!confirm(`This uses 1 of your edits (${left} left). Continue?`)) return;

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = "Saving...";

    function getEvent(prefix) {
      const type = document.getElementById(`${prefix}_type`).value;
      return {
        type,
        date: document.getElementById(`${prefix}_date`).value,
        venueName: document.getElementById(`${prefix}_venue_name`).value.trim(),
        venueAddress: document.getElementById(`${prefix}_venue_address`).value.trim(),
        mapsUrl: document.getElementById(`${prefix}_maps`).value.trim() || null,
        gatheringTime: document.getElementById(`${prefix}_gathering`).value,
        dinnerTime: document.getElementById(`${prefix}_dinner`).value || null,
        rukhsatiTime: type === 'Barat' ? (document.getElementById(`${prefix}_rukhsati`).value || null) : null
      };
    }

    let eventsPayload = [];
    for(let i = 1; i <= totalEvents; i++) {
      eventsPayload.push(getEvent('e' + i));
    }

    const payloadData = {
      bride: { name: document.getElementById('bride_name').value.trim(), father: document.getElementById('bride_father').value.trim() },
      groom: { name: document.getElementById('groom_name').value.trim(), father: document.getElementById('groom_father').value.trim() },
      rsvpWhatsapp: document.getElementById('rsvp_whatsapp').value.trim(),
      note: document.getElementById('note').value.trim(),
      rsvpDeadline: document.getElementById('rsvp_deadline').value || null,
      events: eventsPayload
    };

    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ action: "save-edit", public_code: code, secret_token: token, data: payloadData })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");

      if (json.unchanged) {
        document.getElementById('saveMsg').innerHTML = '<span style="color:#2e7d32;">No changes were made. Your edit count was not affected.</span>';
        btn.disabled = false;
        btn.textContent = "Save Changes";
      } else {
        currentEditsUsed++;
        updateBanner();
        document.getElementById('saveMsg').innerHTML = '<span style="color:#2e7d32;">Successfully saved! Your invitation has been updated.</span>';
        btn.textContent = "Saved!";
        
        if (currentEditsUsed >= currentEditsMax) {
          disableSaving();
        } else {
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = "Save Changes";
            document.getElementById('saveMsg').innerHTML = ''; 
          }, 2000);
        }
      }

    } catch (err) {
      alert(err.message);
      btn.disabled = false;
      btn.textContent = "Save Changes";
    }
  });

  // Init
  loadOrder();
});