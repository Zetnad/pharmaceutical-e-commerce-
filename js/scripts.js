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
});
