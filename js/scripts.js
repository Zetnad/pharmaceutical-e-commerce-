// Core UI helpers and AI example integration
function toggleNav() { document.querySelector('.nav-menu')?.classList.toggle('open'); }
function closeNav() { document.querySelector('.nav-menu.open')?.classList.remove('open'); }

// Normalize page id (simple utility)
function normalizeId(text) {
  if (!text) return '';
  const map = {
    'marketplace': 'market',
    'market': 'market',
    'ai checker': 'ai',
    'ai': 'ai',
    'for pharmacists': 'pharm',
    'pharmacists': 'pharm',
    'pharmacist portal': 'pharm',
    'pricing': 'price',
    'plans': 'price',
    'home': 'home'
  };
  const k = text.toString().trim().toLowerCase().replace(/[^a-z0-9\s]/g,'');
  return map[k] || k.replace(/\s+/g,'-');
}

// Create a lightweight placeholder page when a requested id is missing
function createPlaceholderPage(id) {
  if (!id) return null;
  if (document.getElementById(id)) return document.getElementById(id);
  // Special-case admin page: build a richer dashboard layout
  if (id === 'admin') return createAdminPage();

  const sec = document.createElement('section');
  sec.className = 'page';
  sec.id = id;
  sec.innerHTML = `
    <div class="section" style="min-height:calc(100vh - 70px);">
      <div class="section-label">${id}</div>
      <h2 class="section-title">${id.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ')}</h2>
      <p class="section-sub">This page is a placeholder. Content for "${id}" is not yet implemented.</p>
    </div>
  `;
  document.body.appendChild(sec);
  return sec;
}

// Create an admin dashboard DOM programmatically (pharmacist admin)
function createAdminPage() {
  if (document.getElementById('admin')) return document.getElementById('admin');
  const sec = document.createElement('section');
  sec.className = 'page';
  sec.id = 'admin';
  sec.innerHTML = `
    <div class="section" style="min-height:calc(100vh - 70px);">
      <div class="section-label">Admin</div>
      <h2 class="section-title">Pharmacist Admin Dashboard</h2>
      <p class="section-sub">Manage pharmacists, their plans & pricing, patient lists, and settings.</p>
      <div class="grid-2" style="margin-top:1.6rem;">
        <div style="min-width:260px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <input id="admin-search-pharm" placeholder="Search pharmacists..." style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);" />
          </div>
          <div id="pharm-list" style="display:flex;flex-direction:column;gap:8px;max-height:520px;overflow:auto;padding-right:6px;margin-top:8px;"></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
                    <h3 style="margin:0;font-size:1.05rem">Selected Pharmacist</h3>
                    <div style="display:flex;gap:8px;align-items:center">
                      <button id="btn-demo-login" class="btn-ghost">Demo Admin Login</button>
                      <button id="btn-edit-plan" class="btn-ghost">Edit Plan</button>
                      <button id="btn-save-plan" class="btn-primary">Save</button>
                    </div>
          </div>
          <div id="pharm-details" style="background:white;border:1px solid var(--border);padding:12px;border-radius:12px;">
            <div id="pharm-empty" style="color:var(--text-muted);">No pharmacist selected. Click a pharmacist to view details.</div>
          </div>
          <h4 style="margin-top:16px;margin-bottom:8px">Patients</h4>
          <div style="background:white;border:1px solid var(--border);border-radius:10px;padding:8px;max-height:320px;overflow:auto;">
            <table id="pharm-patients" style="width:100%;border-collapse:collapse;font-size:0.9rem;"></table>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(sec);

  // Wire up search and interactions
  document.getElementById('admin-search-pharm').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('#pharm-list .pharm-row').forEach(r => {
      const name = r.dataset.name || '';
      r.style.display = name.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // Load pharmacists list
  loadPharmacists();
  return sec;
}

// Robust navigation: if target id doesn't exist, create a placeholder instead of throwing
function go(id) {
  if (!id) return;
  closeNav();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  let el = document.getElementById(id);
  if (!el) {
    console.warn(`Page #${id} not found — creating placeholder.`);
    el = createPlaceholderPage(id);
  }
  if (el) {
    el.classList.add('active');
    window.scrollTo(0,0);
  }
}

document.querySelectorAll('.ftab').forEach(t => t.addEventListener('click', () => { document.querySelectorAll('.ftab').forEach(x => x.classList.remove('on')); t.classList.add('on'); }));

function fill(text) { document.getElementById('symp-in').value = text; }

function escape(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function addMsg(cont, html, role) {
  const t = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const d = document.createElement('div');
  d.className = `msg msg-${role}`;
  d.innerHTML = `<div class="bubble">${html}</div><div class="msg-time">${t}</div>`;
  cont.appendChild(d);
  cont.scrollTop = cont.scrollHeight;
}

async function send() {
  const inp = document.getElementById('symp-in');
  const text = inp.value.trim();
  if (!text) return;
  const cont = document.getElementById('msgs');
  addMsg(cont, escape(text), 'user');
  inp.value = '';

  const tid = 'tid' + Date.now();
  const td = document.createElement('div');
  td.className = 'msg msg-ai'; td.id = tid;
  td.innerHTML = '<div class="typing"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>';
  cont.appendChild(td); cont.scrollTop = cont.scrollHeight;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:1000,
        system:`You are MediHub's AI health assistant on a pharmaceutical SaaS platform in Africa. Analyze patient symptoms and:
1. Identify 2-3 possible conditions with confidence levels
2. Suggest appropriate OTC medications if safe
3. Clearly state when doctor visit is urgently needed
4. Always include a disclaimer

Format as HTML with inline styles matching a dark theme:
- Key terms: <strong style="color:#a7f3d0">term</strong>
- Medication block: <div style="background:rgba(13,158,110,0.1);border:1px solid rgba(13,158,110,0.3);border-radius:10px;padding:12px;margin:8px 0"><div style="font-size:0.78rem;color:#a7f3d0;font-weight:600;margin-bottom:8px;">💊 Suggested Medications:</div>• Drug name – dose – frequency<br>...</div>
- Disclaimer: <p style="color:#64748b;font-size:0.77rem;margin-top:10px">⚕️ Disclaimer: This is AI-generated guidance, not a medical diagnosis. Consult a licensed doctor or pharmacist.</p>

Be empathetic, concise, and professional. Use KSh pricing if relevant.`,
        messages:[{role:"user",content:text}]
      })
    });
    const data = await res.json();
    const reply = data.content?.[0]?.text || "Unable to analyze. Please consult a pharmacist directly.";
    document.getElementById(tid)?.remove();
    addMsg(cont, reply, 'ai');
  } catch(e) {
    document.getElementById(tid)?.remove();
    addMsg(cont, "⚠️ AI connection failed. Please try again or consult a pharmacist.", 'ai');
  }
}

document.getElementById('symp-in')?.addEventListener('keypress', e => { if(e.key==='Enter') send(); });

// Global click handler: convert plain anchor clicks into single-page navigation when possible
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a');
  if (!a) return;
  // If anchor already has an onclick or a real href to another page, skip
  const href = a.getAttribute('href');
  if (a.hasAttribute('onclick')) return;
  if (href && href !== '#' && !/^\s*$/.test(href) && !href.startsWith('javascript:')) return;

  // Try to map anchor text or data-route to a page id
  const route = a.dataset.route || normalizeId(a.dataset.page || a.textContent || a.innerText || '');
  if (!route) return;
  e.preventDefault();
  go(route);
});

// ==== backend integration script ====
const API_URL = 'http://localhost:5000/api';

// update tab behaviour to trigger product load
document.querySelectorAll('.ftab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.ftab').forEach(x => x.classList.remove('on'));
    t.classList.add('on');
    loadProducts();
  });
});

// (backend integration chat/send helpers are defined earlier; avoid duplicate definitions)

// marketplace loader
async function loadProducts() {
  const grid = document.querySelector('#market .grid-4');
  if (!grid) return;
  const searchInput = document.querySelector('#market .search-row input');
  const query = searchInput?.value.trim() ? `?search=${encodeURIComponent(searchInput.value.trim())}` : '';
  const activeTab = document.querySelector('.ftab.on');
  let category = '';
  if (activeTab && !/All Products/i.test(activeTab.textContent)) {
    category = activeTab.textContent.replace(/[💊🤧🫀🧴🍼💉🧠]/g,'').trim().toLowerCase();
  }
  const catParam = category ? `&category=${encodeURIComponent(category)}` : '';
  try {
    const res = await fetch(`${API_URL}/products${query}${catParam}`);
    const products = await res.json();
    grid.innerHTML = '';
    products.forEach(p => {
      const card = document.createElement('div');
      card.className='product-card';
      card.innerHTML = `
        <div class="prod-img">
          ${p.type === 'Rx' ? '🩺' : '💊'}
          <div class="prod-badge ${p.type === 'Rx' ? 'badge-rx' : 'badge-otc'}">${p.type}</div>
        </div>
        <div class="prod-info">
          <div class="prod-pharm">${p.pharmacistName || 'Unknown'} ⭐${p.rating || '0.0'}</div>
          <div class="prod-name">${p.name}</div>
          <div class="prod-desc">${p.description}</div>
          <div class="prod-foot">
            <div class="prod-price">KSh ${p.price}</div>
            <button class="add-btn">+</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch(err) {
    console.error('product fetch failed', err);
    grid.innerHTML = '<p style="color:red;">Failed to load products</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  const searchInput = document.querySelector('#market .search-row input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchInput._debounce);
      searchInput._debounce = setTimeout(loadProducts, 300);
    });
  }
  // detect demo mode from backend health and show banner in admin if demo
  (async function checkDemo() {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (!res.ok) return;
      const h = await res.json();
      if (h && h.demo) {
        // create a small banner element
        const b = document.createElement('div');
        b.id = 'demo-banner';
        b.style = 'position:fixed;top:64px;right:16px;background:#fffbeb;color:#92400e;border:1px solid #f59e0b;padding:8px 12px;border-radius:8px;z-index:1200;font-weight:600;font-size:0.9rem;box-shadow:0 4px 10px rgba(0,0,0,0.06)';
        b.textContent = 'Demo mode: data is local and for testing only';
        document.body.appendChild(b);
        // remove after 12s
        setTimeout(() => b.remove(), 12000);
      }
    } catch (e) {}
  })();
});

/* ---------------- Admin dashboard data & rendering ---------------- */
async function loadPharmacists() {
  const list = document.getElementById('pharm-list');
  if (!list) return;
  list.innerHTML = '<p style="color:var(--text-muted)">Loading pharmacists…</p>';
  try {
    const res = await fetch(`${API_URL}/pharmacists`);
    if (!res.ok) throw new Error('Network response not ok');
    const data = await res.json();
    // backend returns { success, message, pharmacists, total }
    const pharms = Array.isArray(data) ? data : (data.pharmacists || []);
    renderPharmacistList(pharms);
  } catch (err) {
    // fallback demo data
    console.warn('pharmacists fetch failed, using demo data', err);
    const demo = [
      { _id: 'p1', name: 'PharmaCare Nairobi', plans: [{name:'Starter', price:0},{name:'Growth', price:4500}], patientsCount:312 },
      { _id: 'p2', name: 'MediPlus Pharmacy', plans: [{name:'Starter', price:0},{name:'Growth', price:4500}], patientsCount:128 }
    ];
    renderPharmacistList(demo);
  }
}

function renderPharmacistList(pharms) {
  const list = document.getElementById('pharm-list');
  if (!list) return;
  list.innerHTML = '';
  pharms.forEach(p => {
    const row = document.createElement('div');
    row.className = 'pharm-row';
    row.dataset.id = p._id || p.id || '';
    // normalize display name (backend uses pharmacyName)
    const displayName = p.name || p.pharmacyName || (p.user && (p.user.name || p.user.email)) || 'Unknown';
    row.dataset.name = displayName;
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;">
        <div>
          <div style="font-weight:600;color:var(--navy);">${displayName}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);">${p.patientsCount || p.totalPatients || 0} patients</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn-ghost" data-id="${p._id}">View</button>
        </div>
      </div>
    `;
    row.querySelector('button')?.addEventListener('click', () => selectPharmacist(p));
    list.appendChild(row);
  });
}

async function selectPharmacist(p) {
  const details = document.getElementById('pharm-details');
  const table = document.getElementById('pharm-patients');
  if (!details || !table) return;
  // store selected pharmacist globally for edit actions
  window._selectedPharmacist = p;
  details.innerHTML = '<h4 style="margin-top:0">' + (p.name || 'Pharmacist') + '</h4>';
  // show plans
  const currentPlan = p.plan || (p.plans && p.plans[0] && p.plans[0].name) || 'starter';
  const planHtml = `
    <div style="margin-top:8px">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <div style="font-weight:600">Current plan:</div>
        <div style="padding:6px 10px;border-radius:8px;background:var(--muted);font-weight:600">${currentPlan}</div>
      </div>
      <div id="plan-edit-row" style="display:flex;gap:8px;align-items:center;">
        <select id="admin-plan-select" style="padding:8px;border-radius:8px;border:1px solid var(--border);">
          <option value="starter">starter</option>
          <option value="growth">growth</option>
          <option value="enterprise">enterprise</option>
        </select>
        <button id="admin-plan-save" class="btn-primary">Save plan</button>
      </div>
    </div>`;
  details.innerHTML += planHtml;
  // pre-select current plan if available
  const sel = document.getElementById('admin-plan-select');
  if (sel) sel.value = currentPlan;
  document.getElementById('admin-plan-save')?.addEventListener('click', async () => {
    const newPlan = document.getElementById('admin-plan-select').value;
    await savePharmacistPlan(p._id, newPlan);
  });
  // demo admin login hook
  document.getElementById('btn-demo-login')?.addEventListener('click', async () => {
    try {
      const pass = prompt('Enter demo admin password (default: demo123)');
      const res = await fetch(`${API_URL}/auth/demo-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'demo@local', password: pass }) });
      const d = await res.json();
      if (!res.ok) return alert(d.message || 'Demo login failed');
      window._demoAdminToken = d.token;
      alert('Demo admin login successful — token stored for this session.');
    } catch (e) {
      console.error(e); alert('Demo login failed');
    }
  });
  // load patients
  table.innerHTML = '<tr><th style="text-align:left;padding:8px">Patient</th><th style="text-align:left;padding:8px">Contact</th><th style="padding:8px">Actions</th></tr>';
  try {
    const res = await fetch(`${API_URL}/pharmacists/${p._id}/patients`);
    if (!res.ok) throw new Error('No patients endpoint');
    const pdata = await res.json();
    // backend returns { success, message, patients }
    const patients = Array.isArray(pdata) ? pdata : (pdata.patients || []);
    renderPatients(patients, table);
  } catch (err) {
    console.warn('patients fetch failed, using demo patients', err);
    const demoPatients = [
      { id: 'u1', name: 'Amina Khalid', phone: '+254700111222', lastVisit: '2026-02-20' },
      { id: 'u2', name: 'Samuel Waweru', phone: '+254700333444', lastVisit: '2026-02-10' }
    ];
    renderPatients(demoPatients, table);
  }
}

function renderPatients(patients, table) {
  patients.forEach(pt => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:8px">${pt.name}</td>
      <td style="padding:8px">${pt.phone || '—'}</td>
      <td style="padding:8px;text-align:center"><button class="btn-ghost">View</button> <button class="btn-primary">Message</button></td>
    `;
    table.appendChild(tr);
  });
}

// Inject Admin link into nav if missing (helps on corrupted HTML)
function ensureAdminNavLink() {
  const nav = document.querySelector('.nav-links');
  if (!nav) return;
  const has = Array.from(nav.querySelectorAll('a')).some(a => (a.textContent||'').toLowerCase().includes('admin'));
  if (!has) {
    const li = document.createElement('li');
    li.innerHTML = `<a onclick="go('admin')">Admin Dashboard</a>`;
    nav.appendChild(li);
  }
}

ensureAdminNavLink();

async function savePharmacistPlan(id, newPlan) {
  if (!id) return alert('No pharmacist selected.');
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (window._demoAdminToken) headers['Authorization'] = 'Bearer ' + window._demoAdminToken;
    const res = await fetch(`${API_URL}/pharmacists/${id}/plan`, {
      method: 'PUT', headers, body: JSON.stringify({ plan: newPlan })
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('Plan update failed', txt);
      return alert('Plan update failed. Check console for details.');
    }
    const data = await res.json();
    alert('Plan updated successfully');
    // re-render with updated data
    if (data.pharmacist) selectPharmacist(data.pharmacist);
  } catch (e) {
    console.error(e);
    alert('Plan update failed (network).');
  }
}
