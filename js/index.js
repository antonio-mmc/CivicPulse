// ── Smooth scroll (event delegation — catches dynamically injected links too) ──
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href === '#') { e.preventDefault(); smoothScrollTo(0, 900); return; }
  const target = document.querySelector(href);
  if (!target) return;
  e.preventDefault();
  const navH = document.querySelector('nav').offsetHeight;
  smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - navH - 12, 900);
});

function smoothScrollTo(targetY, duration) {
  const startY = window.scrollY;
  const diff = targetY - startY;
  let start = null;
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    window.scrollTo(0, startY + diff * ease(p));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Filter pills ───────────────────────────────────────────────────────────
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});


// ── Navbar scroll shadow ───────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.querySelector('nav').style.boxShadow =
    window.scrollY > 20
      ? '0 4px 24px rgba(15,45,110,.12)'
      : '0 1px 12px rgba(15,45,110,.07)';
});

// ── Scroll-reveal — IntersectionObserver ──────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target); // fire once
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
  '.reveal, .reveal-left, .reveal-right, .reveal-scale'
).forEach(el => revealObserver.observe(el));

// ── Progress bar animation on scroll ──────────────────────────────────────
const barObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = e.target.getAttribute('data-width') || e.target.style.width;
      e.target.style.width = '0';
      requestAnimationFrame(() => {
        setTimeout(() => { e.target.style.width = target; }, 80);
      });
      barObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.progress-fill').forEach(el => {
  el.setAttribute('data-width', el.style.width);
  el.style.width = '0';
  barObserver.observe(el);
});

// ── Steps-3col progressive animation ─────────────────────────────────────
const stepObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      stepObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.25 });

document.querySelectorAll('.steps-3col').forEach(el => stepObserver.observe(el));


const scrollCue = document.querySelector('.hero-scroll-cue');
if (scrollCue) {
  window.addEventListener('scroll', () => {
    scrollCue.style.opacity = window.scrollY > 80 ? '0' : '';
    scrollCue.style.transition = 'opacity .4s ease';
  }, { passive: true });
}


// ══════════════════════════════════════════════════════════════════════════
//  MODAL — WIZARD DE 5 PASSOS
// ══════════════════════════════════════════════════════════════════════════

let currentStep = 1;
let replyGiven = false;

const TOTAL_STEPS = 5;

const stepTitles = {
  1: '📝 Nova Contribuição',
  2: '🤖 IA a Processar...',
  3: '🔗 Contexto e Comunidade',
  4: '💬 Conversa com a IA',
  5: '✅ Contribuição Enviada'
};

function openModal() {
  if (!isLoggedIn) {
    openLogin('Para fazer uma contribuição precisa de ter sessão iniciada.');
    return;
  }
  resetModal();
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (currentStep === 5) {
    currentStep = -1; // Prevent multiple triggers
    const desc = document.getElementById('fieldDescricao')?.value || 'Ocorrência reportada pelo utilizador';
    createOccurrenceCard(desc);
  }
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── LEAFLET MAP LOGIC ──
let map = null;
const mapMarkers = [];

function initLeafletMap() {
  if (map) return;
  map = L.map('leafletMap').setView([41.4425, -8.2918], 14); // Guimarães center
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  const defaultLocs = [
    { lat: 41.4385, lng: -8.2945, title: 'Falta de passadeira junto à EB 2,3 de Urgeses' },
    { lat: 41.4412, lng: -8.2923, title: 'Iluminação pública deficiente na Rua de Couros' },
    { lat: 41.4451, lng: -8.2891, title: 'Construção de parque infantil na Alameda da Resistência' },
    { lat: 41.4428, lng: -8.2961, title: 'Contentores de lixo a transbordar na Rua de Santo António' },
    { lat: 41.4435, lng: -8.2935, title: 'Fuga de água na Praça de S. Tiago' }
  ];

  defaultLocs.forEach(loc => addMarkerToMap(loc.lat, loc.lng, loc.title));
}

function addMarkerToMap(lat, lng, title) {
  if (!map) return;
  const marker = L.marker([lat, lng]).addTo(map);
  marker.bindPopup(`<strong>${title}</strong>`);
  mapMarkers.push(marker);
}

function createOccurrenceCard(title) {
  const grids = document.querySelectorAll('.communities-grid');
  // Use the second grid if it exists (for isolated occurrences), or fallback to the first
  const grid = grids.length > 1 ? grids[1] : grids[0];
  
  const div = document.createElement('div');
  div.className = 'community-card reveal visible'; // visible to bypass intersection observer delay
  div.setAttribute('data-cat', 'ocorrencia');
  div.setAttribute('data-mine', 'true');
  
  let shortTitle = title;
  if (shortTitle.length > 60) shortTitle = shortTitle.substring(0, 57) + '...';

  div.innerHTML = `
    <button class="delete-card-btn" onclick="deleteOccurrence(this, event)" title="Eliminar Ocorrência">🗑️</button>
    <div class="card-img" style="background: linear-gradient(135deg, #fef3c7, #fde68a);">📍</div>
    <div class="card-body">
      <span class="card-badge tag-orange">⚠️ Aguarda Validação</span>
      <div class="card-title">${shortTitle}</div>
      <div class="card-meta" style="margin-top:30px;">
        <span>👥 <strong>1</strong> pessoa afetada</span>
        <span>📅 Agora mesmo</span>
      </div>
      <button class="card-join-btn" onclick="openModal()">Editar Ocorrência →</button>
    </div>
  `;
  grid.prepend(div);
  
  if (currentOccLat && currentOccLng) {
    addMarkerToMap(currentOccLat, currentOccLng, shortTitle);
    if (map) {
      map.setView([currentOccLat, currentOccLng], 15, { animate: true });
    }
  }

  // Re-apply filter so it shows up correctly based on the active tab
  const activePill = document.querySelector('#exploreFilters .pill.active');
  if (activePill) {
    const text = activePill.textContent;
    if (text.includes('Todas') || text.includes('Minhas Ocorrências')) {
       div.style.display = '';
    } else {
       div.style.display = 'none';
    }
  }
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

// ── Tecla Escape — fecha qualquer modal/overlay aberto ────────────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeModal();
  closeLogin();
  closeCommunityChat();
  closeXPPopup();
  closeLevelUp();
  closeBadgesPanel();
});

// ── Step navigation ────────────────────────────────────────────────────────
function showStep(n) {
  document.querySelectorAll('.mstep').forEach((el, i) => {
    el.classList.toggle('hidden', i + 1 !== n);
  });
  document.getElementById('progressFill').style.width = (n / TOTAL_STEPS * 100) + '%';
  document.getElementById('stepIndicator').textContent = `Passo ${n} de ${TOTAL_STEPS}`;
  document.getElementById('modalTitle').textContent = stepTitles[n];
  currentStep = n;

  if (n === 2) startProcessing();
  if (n === 4) initChat();
  if (n === 5) triggerConfirmAnimation();
}

function nextStep() {
  if (currentStep < TOTAL_STEPS) showStep(currentStep + 1);
}

function prevStep() {
  if (currentStep > 1) showStep(currentStep - 1);
}

// ── Reset ──────────────────────────────────────────────────────────────────
function resetModal() {
  currentStep = 1;
  replyGiven = false;
  chatMsgCount = 0;

  // Step 1 — canal + upload
  selectChannel('web');
  document.getElementById('uploadZone').classList.remove('hidden');
  document.getElementById('uploadPreview').classList.add('hidden');
  document.getElementById('step1Btn').disabled = true;

  // Step 1 — form fields
  ['fieldCategoria', 'fieldMorada', 'fieldDescricao', 'fieldData'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
    document.getElementById('cf-' + id.replace('field', '').toLowerCase())?.classList.remove('ai-filled');
  });
  const status = document.getElementById('aiSuggestStatus');
  if (status) status.textContent = '⏳ IA a analisar a imagem...';

  // Step 2 proc steps
  ['proc1', 'proc2', 'proc3', 'proc4'].forEach(id => {
    document.getElementById(id)?.classList.remove('done');
  });

  // Step 3 join btn
  const jb = document.getElementById('joinBtn');
  if (jb) { jb.textContent = '👥 Entrar na Comunidade'; jb.style.background = ''; }

  // Step 4 chat
  const chat = document.getElementById('chatSession');
  if (chat) chat.innerHTML = '';
  const ci = document.getElementById('chatInput');
  if (ci) ci.value = '';

  showStep(1);
}

// ── Step 1: upload + AI field fill ────────────────────────────────────────
function simulateUpload() {
  document.getElementById('uploadZone').classList.add('hidden');
  document.getElementById('uploadPreview').classList.remove('hidden');

  setTimeout(() => {
    const fills = {
      fieldCategoria: 'pavimento',
      fieldMorada: 'Rua de Couros, 18, Guimarães',
      fieldDescricao: 'Buraco de aproximadamente 40 cm no passeio junto ao poste de luz nº 12. Representa risco de queda, especialmente para idosos e crianças.',
      fieldData: new Date().toISOString().split('T')[0]
    };
    Object.entries(fills).forEach(([id, val]) => {
      const el = document.getElementById(id);
      const cf = document.getElementById('cf-' + id.replace('field', '').toLowerCase());
      if (el) el.value = val;
      if (cf) cf.classList.add('ai-filled');
    });
    const status = document.getElementById('aiSuggestStatus');
    if (status) status.textContent = '✨ Preenchido pela IA — pode editar';
    document.getElementById('step1Btn').disabled = false;
  }, 1800);
}

function onFormInput() {
  const desc = document.getElementById('fieldDescricao')?.value.trim() ?? '';
  document.getElementById('step1Btn').disabled = desc.length < 5;
}


function selectChannel(ch) {
  ['web', 'email', 'sms'].forEach(c => {
    document.getElementById('chtab-' + c)?.classList.toggle('active', c === ch);
    document.getElementById('chpanel-' + c)?.classList.toggle('hidden', c !== ch);
  });
  const btn = document.getElementById('step1Btn');
  if (ch === 'web') {
    btn.textContent = 'Continuar →';
    btn.disabled = (document.getElementById('fieldDescricao')?.value.trim().length ?? 0) < 5;
    btn.style.display = '';
  } else {
    btn.style.display = 'none';
  }
}

function filterJornal(cat, btn) {
  document.querySelectorAll('.jfilter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // scope to jornal section only — avoid hiding Explore cards that share data-cat
  document.querySelectorAll('.jornal-bento [data-cat]').forEach(card => {
    card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
  });
}

function copyAddress(text, btn) {
  navigator.clipboard?.writeText(text).then(() => {
    btn.textContent = 'Copiado ✓';
    btn.style.background = 'var(--green)';
    setTimeout(() => { btn.textContent = 'Copiar'; btn.style.background = ''; }, 2000);
  });
}

let currentOccLat = null;
let currentOccLng = null;
let currentOccAddressValid = true;
let isVerifyingAddress = false;

async function geocodeAddress(address) {
  try {
    const q = encodeURIComponent(address + ', Guimarães, Portugal');
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch(e) {
    console.error(e);
    return null;
  }
}

// ── Step 2: AI processing animation ───────────────────────────────────────
function startProcessing() {
  const address = document.getElementById('fieldMorada')?.value || '';
  geocodeAddress(address).then(coords => {
    if (coords) {
      currentOccLat = coords.lat;
      currentOccLng = coords.lng;
      currentOccAddressValid = true;
    } else {
      currentOccAddressValid = false;
    }
  });

  const ids = ['proc1', 'proc2', 'proc3', 'proc4'];
  ids.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('done');
    }, (i + 1) * 550);
  });
  setTimeout(() => showStep(3), ids.length * 550 + 600);
}

// ── Step 3: join community ────────────────────────────────────────────────
function joinCommunity() {
  const btn = document.getElementById('joinBtn');
  btn.textContent = '✓ Entrou na Comunidade!';
  btn.style.background = 'linear-gradient(135deg,#10b981,#34d399)';
  setTimeout(() => nextStep(), 800);
}

// ── Step 4: chatbot ───────────────────────────────────────────────────────
let chatMsgCount = 0;

const aiChatResponses = [
  'Para enriquecer o relatório enviado ao município, gostaria de perceber melhor a situação. <strong>Há quanto tempo este problema existe neste local?</strong>',
  'Entendido. Este tipo de problema representa um risco para cidadãos com mobilidade reduzida. Sabe se foi reportado anteriormente à Junta de Freguesia ou à Câmara?',
  'Muito útil. A IA identificou <strong>3 ocorrências similares</strong> nas ruas adjacentes. Tem conhecimento de outros pontos problemáticos na mesma zona?',
  'Excelente. Tem alguma questão sobre o que está planeado para esta área ou sobre como o processo municipal funciona?',
  'Obrigado pela informação adicional. Tudo foi registado e será tido em conta. Pode continuar a colocar questões ou clicar em <strong>Concluir</strong> quando quiser.'
];

function initChat() {
  chatMsgCount = 0;
  isVerifyingAddress = false;
  const chat = document.getElementById('chatSession');
  if (!chat) return;
  chat.innerHTML = '';
  setTimeout(() => {
    if (!currentOccAddressValid) {
      isVerifyingAddress = true;
      appendAiMsg(chat, 'A IA não conseguiu localizar a morada indicada no mapa de Guimarães. Podes confirmar e reescrever o nome correto da rua ou praça?');
    } else {
      appendAiMsg(chat, 'A sua contribuição foi registada! Posso fazer-lhe algumas perguntas para enriquecer o relatório? Esta conversa ficará sempre disponível em <strong>Minhas Contribuições</strong>.');
    }
  }, 350);
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg = input?.value.trim();
  if (!msg) return;
  input.value = '';

  const chat = document.getElementById('chatSession');

  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user-msg';
  userDiv.innerHTML = `<div class="chat-bubble-msg">${msg}</div>`;
  chat.appendChild(userDiv);
  chat.scrollTop = chat.scrollHeight;

  const typing = document.createElement('div');
  typing.className = 'chat-msg ai-msg';
  typing.id = 'typingIndicator';
  typing.innerHTML = `<div class="chat-avatar">🤖</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  setTimeout(async () => {
    document.getElementById('typingIndicator')?.remove();
    
    if (isVerifyingAddress) {
      const coords = await geocodeAddress(msg);
      if (coords) {
        currentOccLat = coords.lat;
        currentOccLng = coords.lng;
        currentOccAddressValid = true;
        isVerifyingAddress = false;
        const addressField = document.getElementById('fieldMorada');
        if (addressField) addressField.value = msg;
        appendAiMsg(chat, `Perfeito, encontrei a localização: ${msg}. A contribuição foi registada. Há quanto tempo este problema existe neste local?`);
      } else {
        appendAiMsg(chat, `Ainda não consegui localizar essa rua no mapa de Guimarães. Tenta usar o formato "Rua X" ou "Praça Y".`);
      }
      return;
    }

    const response = aiChatResponses[Math.min(chatMsgCount, aiChatResponses.length - 1)];
    chatMsgCount++;
    appendAiMsg(chat, response);
  }, 1100 + Math.random() * 700);
}

function appendAiMsg(chat, html) {
  const div = document.createElement('div');
  div.className = 'chat-msg ai-msg';
  div.innerHTML = `<div class="chat-avatar">🤖</div><div class="chat-bubble-msg">${html}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ── Step 5: confirm animation ──────────────────────────────────────────────
function triggerConfirmAnimation() {
  const check = document.querySelector('.confirm-check');
  if (check) {
    check.style.animation = 'none';
    void check.offsetWidth;
    check.style.animation = 'popIn .4s ease';
  }
  // Award XP after a short pause so the user sees the confirm step first
  setTimeout(() => awardContributionXP(), 900);
}

// ══════════════════════════════════════════════════════════════════════════
//  LOGIN / REGISTO — GLASSMORPHISM
// ══════════════════════════════════════════════════════════════════════════

let loginDone = false;

function openLogin(hint) {
  loginDone = false;
  showLScreen('ls-email');
  const hintEl = document.getElementById('loginContextHint');
  const hintMsg = document.getElementById('loginContextMsg');
  if (hint && hintEl && hintMsg) {
    hintMsg.textContent = hint;
    hintEl.classList.remove('hidden');
  } else if (hintEl) {
    hintEl.classList.add('hidden');
  }
  document.getElementById('loginOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLogin() {
  document.getElementById('loginOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  if (loginDone) {
    loginDone = false;
    updateAuthUI(true);
    smoothScrollTo(0, 900);
  }
}

function handleLoginOverlay(e) {
  if (e.target === document.getElementById('loginOverlay')) closeLogin();
}

function showLScreen(id) {
  document.querySelectorAll('.login-screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  // swap icon opacity as visual feedback
  btn.style.opacity = isHidden ? '0.9' : '';
}

function simulateLogin(method) {
  loginDone = true;

  const titles = {
    email: 'Bem-vindo de volta, António!',
    cmd: 'Autenticado com sucesso!',
    register: 'Conta criada com sucesso!'
  };
  const subs = {
    email: 'Está autenticado via email na plataforma CivicPulse.',
    cmd: 'Autenticação via Chave Móvel Digital confirmada.',
    register: 'Bem-vindo à comunidade CivicPulse!'
  };

  document.getElementById('ls-success-title').textContent = titles[method] || titles.email;
  document.getElementById('ls-success-sub').textContent = subs[method] || subs.email;

  showLScreen('ls-success');

  // replay check animation
  const check = document.querySelector('.login-success-check');
  if (check) {
    check.style.animation = 'none';
    void check.offsetWidth;
    check.style.animation = 'popIn .4s ease';
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  AUTH STATE — sincronização do site com o utilizador autenticado
// ══════════════════════════════════════════════════════════════════════════

const USER = {
  name: 'António Silva',
  firstName: 'António',
  initials: 'A',
  email: 'antonio@cm-guimaraes.pt',
  level: 3,
  levelName: 'Cidadão Ativo',
  xp: 2340,
  xpMax: 3000,
  contributions: 23,
  validations: 87,
  communities: 5,
  streak: 7
};

let isLoggedIn = false;

function updateAuthUI(loggedIn) {
  isLoggedIn = loggedIn;
  updateNavbar(loggedIn);
  updateGamification(loggedIn);
  updateExplorePills(loggedIn);
  
  const mapSection = document.getElementById('occurrencesMapSection');
  if (mapSection) {
    if (loggedIn) {
      mapSection.classList.remove('hidden');
      if (!map) setTimeout(initLeafletMap, 100);
      else setTimeout(() => map.invalidateSize(), 100);
    } else {
      mapSection.classList.add('hidden');
    }
  }

  if (loggedIn) {
    showToast('👋', `Bem-vindo de volta, ${USER.firstName}!`);
  }
}

/* ── Navbar ── */
function updateNavbar(loggedIn) {
  const area = document.getElementById('navAuthArea');
  if (!area) return;
  if (loggedIn) {
    area.innerHTML = `
      <div class="nav-user-wrap" id="navUserWrap">
        <button class="nav-user-btn" id="navUserBtn" onclick="toggleUserDropdown(event)">
          <div class="nav-user-avatar">${USER.initials}</div>
          <span>${USER.firstName}</span>
          <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
        </button>
        <div class="nav-dropdown hidden" id="userDropdown">
          <div class="dd-header">
            <div class="dd-avatar">${USER.initials}</div>
            <div>
              <div class="dd-name">${USER.name}</div>
              <div class="dd-email">${USER.email}</div>
            </div>
          </div>
          <div class="dd-stats">
            <div class="dd-stat">
              <span class="dd-stat-val">${USER.contributions}</span>
              <span class="dd-stat-key">Contribuições</span>
            </div>
            <div class="dd-stat">
              <span class="dd-stat-val">${USER.xp.toLocaleString('pt')}</span>
              <span class="dd-stat-key">XP</span>
            </div>
            <div class="dd-stat">
              <span class="dd-stat-val">Nv.${USER.level}</span>
              <span class="dd-stat-key">${USER.levelName}</span>
            </div>
          </div>
          <div class="dd-divider"></div>
          <a href="#gamification" class="dd-item" onclick="closeUserDropdown()">🏆 As Minhas Recompensas</a>
          <a href="#explore"      class="dd-item" onclick="closeUserDropdown(); highlightMyCards()">📍 As Minhas Contribuições</a>
          <a href="#communities"  class="dd-item" onclick="closeUserDropdown()">👥 As Minhas Comunidades</a>
          <div class="dd-divider"></div>
          <button class="dd-item dd-logout" onclick="logout()">🚪 Terminar Sessão</button>
        </div>
      </div>`;
  } else {
    area.innerHTML = `
      <a href="#" class="btn-login" id="navLoginBtn" onclick="openLogin(); return false;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
        </svg>
        Entrar
      </a>`;
  }
}

/* ── Dropdown ── */
function toggleUserDropdown(e) {
  e.stopPropagation();
  const dd = document.getElementById('userDropdown');
  const btn = document.getElementById('navUserBtn');
  if (!dd) return;
  const isOpen = !dd.classList.contains('hidden');
  dd.classList.toggle('hidden', isOpen);
  btn?.classList.toggle('open', !isOpen);
}

function closeUserDropdown() {
  const dd = document.getElementById('userDropdown');
  const btn = document.getElementById('navUserBtn');
  dd?.classList.add('hidden');
  btn?.classList.remove('open');
}

document.addEventListener('click', () => closeUserDropdown());

/* ── Gamification sync ── */
function updateGamification(loggedIn) {
  const guest     = document.getElementById('gamiGuest');
  const grid      = document.getElementById('gamiGrid');
  const banner    = document.getElementById('gamiUserBanner');
  const levelCard = document.querySelector('.level-card');

  if (loggedIn) {
    guest?.classList.add('hidden');
    grid?.classList.remove('hidden');
    levelCard?.classList.add('user-active');

    // Populate and show the personal banner with live USER data
    if (banner) {
      const avatarEl  = banner.querySelector('.gami-user-avatar');
      const welcomeEl = banner.querySelector('.gami-user-welcome');
      const statVals  = banner.querySelectorAll('.gami-ustat-val');
      if (avatarEl)  avatarEl.textContent  = USER.initials;
      if (welcomeEl) welcomeEl.textContent = `Olá, ${USER.firstName}! 👋`;
      if (statVals[0]) statVals[0].textContent = USER.contributions;
      if (statVals[1]) statVals[1].textContent = USER.communities;
      if (statVals[2]) statVals[2].textContent = `🔥 ${USER.streak}`;
      banner.classList.remove('hidden');
    }

    // Animate XP bar from 0 to current value
    const fill = document.getElementById('xpFillBar');
    if (fill) {
      fill.style.width = '0%';
      setTimeout(() => updateLevelCard(true), 400);
    }
  } else {
    guest?.classList.remove('hidden');
    grid?.classList.add('hidden');
    banner?.classList.add('hidden');
    levelCard?.classList.remove('user-active');
    const fill = document.getElementById('xpFillBar');
    if (fill) { fill.style.transition = ''; fill.style.width = '78%'; }
    const title = document.getElementById('levelTitle');
    if (title) title.textContent = '🏅 Nível 3 — Cidadão Ativo';
    const label = document.getElementById('xpLabel');
    if (label) label.textContent = '2.340 / 3.000 XP';
    const contrib = document.getElementById('statContributions');
    if (contrib) contrib.textContent = '23';
  }
}

/* ── Explore pills sync ── */
function filterExplore(filterType, btn) {
  if (!isLoggedIn && (filterType === 'minhas_ocorrencias' || filterType === 'minhas_comunidades')) {
    openLogin('Para ver as suas ocorrências e comunidades, precisa de ter sessão iniciada.');
    return;
  }

  if (btn) {
    document.querySelectorAll('#exploreFilters .pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
  }

  const cards = document.querySelectorAll('.community-card');
  cards.forEach(card => {
    const isMine = card.getAttribute('data-mine') === 'true';
    const isComunidade = card.getAttribute('data-cat') === 'comunidade';
    const isOcorrencia = card.getAttribute('data-cat') === 'ocorrencia';

    let show = false;
    
    if (filterType === 'todas') {
      show = true;
    } else if (filterType === 'minhas_ocorrencias') {
      show = isOcorrencia && isMine;
    } else if (filterType === 'comunidades_disponiveis') {
      show = isComunidade && !isMine;
    } else if (filterType === 'minhas_comunidades') {
      show = isComunidade && isMine;
    }

    card.style.display = show ? '' : 'none';
  });
}

function highlightMyCards() {
  // Activate "As Minhas Ocorrências" filter
  const myPill = document.querySelector('#exploreFilters .pill:nth-child(2)');
  if (myPill) filterExplore('minhas_ocorrencias', myPill);
  // Apply visual highlight to owned cards
  document.querySelectorAll('.community-card[data-mine="true"]').forEach(card => {
    card.classList.add('my-card');
  });
}

function updateExplorePills(loggedIn) {
  if (!loggedIn) {
    // Reset to "Todas" if a personal filter was active
    const activePill = document.querySelector('#exploreFilters .pill.active');
    if (activePill && activePill.textContent.includes('As Minhas')) {
      const allPill = document.querySelector('#exploreFilters .pill');
      filterExplore('todas', allPill);
    }
    // Remove visual highlight from own cards
    document.querySelectorAll('.community-card.my-card').forEach(card => {
      card.classList.remove('my-card');
    });
  }
}

/* ── Logout ── */
function logout() {
  closeUserDropdown();
  updateAuthUI(false);
  showToast('👋', 'Sessão terminada. Até já!');
}

/* ── Toast ── */
function showToast(icon, msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastIcon').textContent = icon;
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ══════════════════════════════════════════════════════════════════════════
//  COMMUNITY CHAT MODAL
// ══════════════════════════════════════════════════════════════════════════

const communityChats = {};
let currentCommunityTitle = '';

function getInitialCommunityChat(title) {
  return `
    <div class="chat-msg ai-msg">
      <div class="chat-avatar" style="background:var(--blue-lt);font-size:1rem;">👤</div>
      <div class="chat-bubble-msg"><strong>Maria F.</strong><br/>Olá a todos! Alguém sabe o ponto de situação sobre: ${title}?</div>
    </div>
    <div class="chat-msg ai-msg">
      <div class="chat-avatar" style="background:#3b82f6;">🏛️</div>
      <div class="chat-bubble-msg" style="border:1.5px solid #bfdbfe; background: #eff6ff;"><strong>CM Guimarães</strong><br/>A previsão de início é na próxima semana. A equipa já está mobilizada e atenta a esta ocorrência.</div>
    </div>
  `;
}

function openCommunityChat(title) {
  if (!isLoggedIn) {
    openLogin('Para participar no chat da comunidade precisa de ter sessão iniciada.');
    return;
  }
  
  title = title || 'Comunidade';
  currentCommunityTitle = title;
  
  document.getElementById('chatCommunityTitle').textContent = title;
  document.getElementById('chatOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  const chat = document.getElementById('communityChatSession');
  
  if (!communityChats[title]) {
    communityChats[title] = getInitialCommunityChat(title);
  }
  
  chat.innerHTML = communityChats[title];
  chat.scrollTop = chat.scrollHeight;
}

function closeCommunityChat() {
  document.getElementById('chatOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function handleChatOverlay(e) {
  if (e.target === document.getElementById('chatOverlay')) closeCommunityChat();
}


function sendCommunityChatMessage() {
  const input = document.getElementById('communityChatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  const chat = document.getElementById('communityChatSession');
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user-msg';
  userDiv.innerHTML = `<div class="chat-bubble-msg">${msg}</div>`;
  chat.appendChild(userDiv);
  chat.scrollTop = chat.scrollHeight;
  
  // Save user message to this specific community's history
  communityChats[currentCommunityTitle] = chat.innerHTML;
  
  const activeCommunity = currentCommunityTitle;
  
  // Simulate someone replying occasionally
  if (Math.random() > 0.4) {
    const typing = document.createElement('div');
    typing.className = 'chat-msg ai-msg';
    typing.id = 'communityTypingIndicator';
    typing.innerHTML = `<div class="chat-avatar" style="background:var(--teal);font-size:1rem;">👤</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;

    setTimeout(() => {
      if (currentCommunityTitle === activeCommunity && document.getElementById('chatOverlay').classList.contains('open')) {
        const ind = document.getElementById('communityTypingIndicator');
        if (ind) ind.remove();
        
        const replyDiv = document.createElement('div');
        replyDiv.className = 'chat-msg ai-msg';
        replyDiv.innerHTML = `<div class="chat-avatar" style="background:var(--teal);font-size:1rem;">👤</div><div class="chat-bubble-msg"><strong>João P.</strong><br/>Concordo plenamente! É muito importante acompanharmos isto de perto.</div>`;
        chat.appendChild(replyDiv);
        chat.scrollTop = chat.scrollHeight;
        communityChats[activeCommunity] = chat.innerHTML;
      } else {
        communityChats[activeCommunity] += `<div class="chat-msg ai-msg"><div class="chat-avatar" style="background:var(--teal);font-size:1rem;">👤</div><div class="chat-bubble-msg"><strong>João P.</strong><br/>Concordo plenamente! É muito importante acompanharmos isto de perto.</div></div>`;
      }
    }, 1500 + Math.random() * 1000);
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  DELETE OCCURRENCE
// ══════════════════════════════════════════════════════════════════════════
function deleteOccurrence(btn, event) {
  event.stopPropagation();
  if (confirm('Tem a certeza que deseja eliminar esta ocorrência permanentemente?')) {
    const card = btn.closest('.community-card');
    if (card) {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      setTimeout(() => card.remove(), 300);
      showToast('🗑️', 'Ocorrência eliminada com sucesso.');
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  SISTEMA DE NÍVEIS & XP
// ══════════════════════════════════════════════════════════════════════════

const LEVEL_CONFIG = [
  { level: 1, name: 'Novato Cívico',         medal: '🎖️', xpRequired: 0,     xpNext: 500   },
  { level: 2, name: 'Cidadão Participativo', medal: '🥉',  xpRequired: 500,   xpNext: 1500  },
  { level: 3, name: 'Cidadão Ativo',         medal: '🏅',  xpRequired: 1500,  xpNext: 3000  },
  { level: 4, name: 'Defensor Urbano',       medal: '🥈',  xpRequired: 3000,  xpNext: 5500  },
  { level: 5, name: 'Embaixador Cívico',     medal: '🥇',  xpRequired: 5500,  xpNext: 9000  },
  { level: 6, name: 'Guardião da Cidade',    medal: '🏆',  xpRequired: 9000,  xpNext: 14000 },
  { level: 7, name: 'Herói de Guimarães',   medal: '👑',  xpRequired: 14000, xpNext: 21000 },
];

const XP_PER_CONTRIBUTION = 150;

function getLevelConfig(xp) {
  let current = LEVEL_CONFIG[0];
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_CONFIG[i].xpRequired) { current = LEVEL_CONFIG[i]; break; }
  }
  return current;
}

function updateLevelCard(animated = true) {
  const cfg = getLevelConfig(USER.xp);

  const xpInLevel  = USER.xp - cfg.xpRequired;
  const xpForLevel = cfg.xpNext - cfg.xpRequired;
  const pct = Math.min(100, (xpInLevel / xpForLevel * 100)).toFixed(1);

  const titleEl   = document.getElementById('levelTitle');
  const labelEl   = document.getElementById('xpLabel');
  const fillEl    = document.getElementById('xpFillBar');
  const contribEl = document.getElementById('statContributions');

  if (titleEl) titleEl.textContent = `${cfg.medal} Nível ${cfg.level} — ${cfg.name}`;
  if (labelEl) labelEl.textContent = `${USER.xp.toLocaleString('pt')} / ${cfg.xpNext.toLocaleString('pt')} XP`;

  if (fillEl) {
    if (animated) {
      fillEl.style.transition = 'width 1.2s cubic-bezier(.4,0,.2,1)';
    } else {
      fillEl.style.transition = 'none';
    }
    fillEl.style.width = pct + '%';
  }

  if (contribEl) contribEl.textContent = USER.contributions;

  // Keep USER in sync
  USER.xpMax    = cfg.xpNext;
  USER.level    = cfg.level;
  USER.levelName = cfg.name;
}

function awardContributionXP() {
  if (!isLoggedIn) return;

  const oldLevel = getLevelConfig(USER.xp).level;

  USER.xp          += XP_PER_CONTRIBUTION;
  USER.contributions += 1;

  const newCfg   = getLevelConfig(USER.xp);
  const leveledUp = newCfg.level > oldLevel;

  // Animate the level card
  updateLevelCard(true);

  // Show XP popup (slight delay for card animation to start first)
  setTimeout(() => showXPRewardPopup(XP_PER_CONTRIBUTION, leveledUp), 300);
}

function showXPRewardPopup(xpGained, leveledUp) {
  const cfg = getLevelConfig(USER.xp);

  const xpInLevel  = USER.xp - cfg.xpRequired;
  const xpForLevel = cfg.xpNext - cfg.xpRequired;
  const pct = Math.min(100, (xpInLevel / xpForLevel * 100)).toFixed(1);

  // Fill in popup content
  const gainedEl = document.getElementById('xpGainedBig');
  if (gainedEl) gainedEl.textContent = `+${xpGained} XP`;

  const progressText = document.getElementById('xpPopupProgressText');
  const nextLevel = cfg.level < LEVEL_CONFIG.length ? cfg.level + 1 : cfg.level;
  if (progressText) progressText.textContent = `Progresso para Nível ${nextLevel}`;

  const progressVal = document.getElementById('xpPopupProgressVal');
  if (progressVal)
    progressVal.textContent = `${USER.xp.toLocaleString('pt')} / ${cfg.xpNext.toLocaleString('pt')} XP`;

  // Animate fill bar
  const fill = document.getElementById('xpPopupFill');
  if (fill) {
    fill.style.transition = 'none';
    fill.style.width = '0%';
    setTimeout(() => {
      fill.style.transition = 'width 1s cubic-bezier(.4,0,.2,1)';
      fill.style.width = pct + '%';
    }, 80);
  }

  // Store level-up flag so closeXPPopup knows what to do
  const overlay = document.getElementById('xpPopupOverlay');
  if (overlay) overlay.dataset.leveledUp = leveledUp ? '1' : '0';

  // Replay popup animation
  const popup = document.getElementById('xpPopup');
  if (popup) { popup.style.animation = 'none'; void popup.offsetWidth; popup.style.animation = ''; }

  overlay?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeXPPopup() {
  const overlay   = document.getElementById('xpPopupOverlay');
  const leveledUp = overlay?.dataset.leveledUp === '1';
  overlay?.classList.add('hidden');
  document.body.style.overflow = '';

  if (leveledUp) {
    setTimeout(() => showLevelUpModal(), 320);
  }
}

function handleXPPopupOverlay(e) {
  if (e.target === document.getElementById('xpPopupOverlay')) closeXPPopup();
}

function showLevelUpModal() {
  const cfg = getLevelConfig(USER.xp);

  const badgeEl   = document.getElementById('levelupBadge');
  const levelEl   = document.getElementById('levelupLevel');
  const nameEl    = document.getElementById('levelupName');
  const xpEl      = document.getElementById('levelupXP');
  const contribEl = document.getElementById('levelupContribs');

  if (badgeEl)   badgeEl.textContent   = cfg.medal;
  if (levelEl)   levelEl.textContent   = `Nível ${cfg.level}`;
  if (nameEl)    nameEl.textContent    = cfg.name;
  if (xpEl)      xpEl.textContent      = `${USER.xp.toLocaleString('pt')} XP`;
  if (contribEl) contribEl.textContent = USER.contributions;

  // Replay animation
  const modal = document.getElementById('levelupModal');
  if (modal) { modal.style.animation = 'none'; void modal.offsetWidth; modal.style.animation = ''; }

  document.getElementById('levelupOverlay')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLevelUp() {
  document.getElementById('levelupOverlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

function handleLevelupOverlay(e) {
  if (e.target === document.getElementById('levelupOverlay')) closeLevelUp();
}


// ══════════════════════════════════════════════════════════════════════════
//  CONQUISTAS / BADGES
// ══════════════════════════════════════════════════════════════════════════


const ALL_BADGES = [
  // ── Desbloqueadas (earned: true) ──────────────────────────────────────
  {
    icon: '📍',
    name: 'Primeiro Reporte',
    desc: 'Submeteu a sua primeira ocorrência na plataforma CivicPulse.',
    earned: true
  },
  {
    icon: '🔍',
    name: 'Validador Ativo',
    desc: 'Validou 10 ou mais ocorrências reportadas por outros cidadãos.',
    earned: true
  },
  {
    icon: '📷',
    name: 'Fotógrafo Urbano',
    desc: 'Anexou fotografia em pelo menos 5 contribuições.',
    earned: true
  },
  {
    icon: '👥',
    name: 'Membro de Comunidade',
    desc: 'Entrou na sua primeira comunidade ativa de cidadãos.',
    earned: true
  },
  {
    icon: '🔥',
    name: 'Sequência de 7 Dias',
    desc: 'Participou na plataforma 7 dias consecutivos sem falhas.',
    earned: true
  },
  {
    icon: '🤝',
    name: 'Colaborador',
    desc: 'Apoiou a ocorrência de outro cidadão com uma validação ou comentário.',
    earned: true
  },
  {
    icon: '💬',
    name: 'Dialogante',
    desc: 'Completou uma conversa completa com a IA de enriquecimento de contribuição.',
    earned: true
  },
  {
    icon: '⚡',
    name: 'Contribuidor Rápido',
    desc: 'Reportou uma ocorrência em menos de 2 minutos após registar conta.',
    earned: true
  },
  {
    icon: '🏘️',
    name: 'Vizinho Solidário',
    desc: 'Apoiou ocorrências em 3 bairros diferentes de Guimarães.',
    earned: true
  },
  // ── Bloqueadas (earned: false) ────────────────────────────────────────
  {
    icon: '🌟',
    name: 'Embaixador Cívico',
    desc: 'Alcance o Nível 5 e tenha 50 ou mais contribuições aceites.',
    earned: false
  },
  {
    icon: '🏆',
    name: 'Cidadão do Mês',
    desc: 'Seja o cidadão com mais contribuições validadas num mês.',
    earned: false
  },
  {
    icon: '🌍',
    name: 'Impacto Real',
    desc: 'Uma das suas contribuições resultou numa obra aprovada pela câmara.',
    earned: false
  },
  {
    icon: '📰',
    name: 'No Jornal',
    desc: 'A sua contribuição foi destacada no Jornal de Guimarães da plataforma.',
    earned: false
  },
  {
    icon: '🎯',
    name: 'Precisão Máxima',
    desc: 'Submeteu 20 contribuições com localização GPS exata confirmada.',
    earned: false
  },
  {
    icon: '🏅',
    name: 'Veterano Cívico',
    desc: 'Utiliza a plataforma há mais de 1 ano com atividade regular.',
    earned: false
  }
];

const BADGES_VISIBLE_COUNT = 9;

function buildBadgeHTML(badge) {
  const stateClass = badge.earned ? 'earned' : 'locked';
  const lockIcon   = badge.earned ? '' : '<div class="badge-lock">🔒</div>';
  const tooltip    = `<div class="badge-tooltip">${badge.desc}</div>`;
  return `
    <div class="badge-item ${stateClass}">
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
      ${tooltip}
      ${lockIcon}
    </div>`;
}

function renderBadges() {
  const earnedCount = ALL_BADGES.filter(b => b.earned).length;
  const totalCount  = ALL_BADGES.length;

  // ── Main card (9 badges) ──────────────────────────────────────────────
  const mainGrid = document.getElementById('badgesGridMain');
  const counter  = document.getElementById('badgesCounter');
  if (mainGrid) {
    mainGrid.innerHTML = ALL_BADGES.slice(0, BADGES_VISIBLE_COUNT).map(b => buildBadgeHTML(b)).join('');
  }
  if (counter) {
    counter.textContent = `${earnedCount} / ${totalCount}`;
  }

  // ── Panel (all badges) ────────────────────────────────────────────────
  const panelGrid    = document.getElementById('badgesPanelGrid');
  const panelCounter = document.getElementById('badgesPanelCounter');
  if (panelGrid) {
    panelGrid.innerHTML = ALL_BADGES.map(b => buildBadgeHTML(b)).join('');
  }
  if (panelCounter) {
    panelCounter.textContent = `${earnedCount} / ${totalCount} desbloqueadas`;
  }
}

function openBadgesPanel() {
  const overlay = document.getElementById('badgesPanelOverlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeBadgesPanel() {
  const overlay = document.getElementById('badgesPanelOverlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

function handleBadgesPanelOverlay(e) {
  if (e.target === document.getElementById('badgesPanelOverlay')) closeBadgesPanel();
}


// Render badges on load
renderBadges();

// ══════════════════════════════════════════
//   GSAP — Cinematic Scroll Experience
// ══════════════════════════════════════════
(function initCinematicScroll() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // ── 1. Hero: pin + zoom da cidade + fade do conteúdo ──────────────────────
  const heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '+=700',
      pin: true,
      pinSpacing: true,
      scrub: 1.8,
      anticipatePin: 1,
      onLeave: () => ScrollTrigger.refresh(),
    }
  });

  heroTl
    // Cidade faz zoom lento e dramático
    .to('.hero-bg', {
      scale: 1.18,
      ease: 'none',
    }, 0)
    // Texto sobe e desvanece
    .to('.hero-content', {
      y: -90,
      opacity: 0,
      ease: 'power2.in',
    }, 0)
    // Seta de scroll desaparece rapidamente
    .to('.hero-scroll-cue', {
      opacity: 0,
      y: 20,
      ease: 'none',
      duration: 0.15,
    }, 0);

  // ── 2. Secções: títulos e subs já têm CSS reveal — GSAP não interfere ─────
  // (os .section-title estão dentro de .reveal containers, o IntersectionObserver
  //  trata deles; não aplicamos fromTo para não pôr opacity:0 por engano)

  // ── 3. Jornal featured: entra da esquerda ────────────────────────────────
  // Remove classe reveal para evitar conflito CSS ↔ GSAP
  const jFeat = document.querySelector('.jornal-featured');
  if (jFeat) {
    jFeat.classList.remove('reveal', 'reveal-delay-1', 'reveal-delay-2');
    gsap.fromTo(jFeat,
      { x: -70, opacity: 0 },
      {
        x: 0, opacity: 1,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: jFeat,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  }

  // ── 4. Sidebar do jornal: entra da direita ────────────────────────────────
  const jSide = document.querySelector('.jornal-sidebar');
  if (jSide) {
    jSide.classList.remove('reveal', 'reveal-delay-1', 'reveal-delay-2');
    gsap.fromTo(jSide,
      { x: 70, opacity: 0 },
      {
        x: 0, opacity: 1,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: jSide,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  }

  // ── 5. Steps: entram todos juntos em stagger rápido ──────────────────────
  const steps = gsap.utils.toArray('.step');
  steps.forEach(el => {
    el.classList.remove('reveal', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3', 'reveal-delay-4');
  });
  if (steps.length) {
    gsap.fromTo(steps,
      { y: 40, opacity: 0, scale: 0.97 },
      {
        y: 0, opacity: 1, scale: 1,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '#how',
          start: 'top 80%',
          toggleActions: 'play none none none',
        }
      }
    );
  }

})();
