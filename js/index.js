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
  function ease(t) { return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
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

// ── Float card dismiss ─────────────────────────────────────────────────────
function dismissCard(btn) {
  const card = btn.closest('.float-card');
  card.style.transition = 'opacity .35s ease, transform .35s ease';
  card.style.opacity = '0';
  card.style.transform = 'translateY(-10px)';
  card.style.animation = 'none';
  setTimeout(() => card.style.display = 'none', 360);
}

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
let replyGiven  = false;

const TOTAL_STEPS = 5;

const stepTitles = {
  1: '📎 Partilhe o Problema',
  2: '🤖 IA a Processar...',
  3: '💬 Diálogo com a IA',
  4: '🔗 Contexto e Comunidade',
  5: '✅ Enviado para o Município'
};

function openModal() {
  resetModal();
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeLogin(); } });

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
  replyGiven  = false;

  // Step 1
  document.getElementById('uploadZone').classList.remove('hidden');
  document.getElementById('uploadPreview').classList.add('hidden');
  document.getElementById('step1Btn').disabled = true;
  const ta = document.getElementById('step1Text');
  if (ta) ta.value = '';

  // Step 2 proc steps
  ['proc1','proc2','proc3','proc4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('done');
  });

  // Step 3 chat
  const chat = document.getElementById('chatSession');
  if (chat) {
    chat.innerHTML = `
      <div class="chat-msg ai-msg">
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble-msg">Confirmei os detalhes com base na sua foto. Existe alguma situação de perigo imediato neste local?</div>
      </div>`;
  }
  const qr = document.getElementById('quickReplies');
  if (qr) { qr.style.display = 'flex'; qr.querySelectorAll('button').forEach(b => b.disabled = false); }
  const s3f = document.getElementById('step3Footer');
  if (s3f) s3f.classList.add('hidden');

  // Step 4 join btn
  const jb = document.getElementById('joinBtn');
  if (jb) { jb.textContent = '👥 Entrar na Comunidade'; jb.style.background = ''; }

  showStep(1);
}

// ── Step 1: upload / text ──────────────────────────────────────────────────
function simulateUpload() {
  document.getElementById('uploadZone').classList.add('hidden');
  document.getElementById('uploadPreview').classList.remove('hidden');
  document.getElementById('step1Btn').disabled = false;
}

function onTextInput() {
  const val = document.getElementById('step1Text').value.trim();
  document.getElementById('step1Btn').disabled = val.length < 10;
}

// ── Step 2: AI processing animation ───────────────────────────────────────
function startProcessing() {
  const ids = ['proc1','proc2','proc3','proc4'];
  ids.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('done');
    }, (i + 1) * 550);
  });
  setTimeout(() => showStep(3), ids.length * 550 + 600);
}

// ── Step 3: quick-reply conversation ─────────────────────────────────────
function quickReply(type) {
  if (replyGiven) return;
  replyGiven = true;

  const chat = document.getElementById('chatSession');
  const qr   = document.getElementById('quickReplies');

  // Disable buttons immediately
  qr.querySelectorAll('button').forEach(b => b.disabled = true);

  // User bubble
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user-msg';
  userMsg.innerHTML = `<div class="chat-bubble-msg">${type === 'urgent' ? '⚠️ Sim, é urgente' : '📋 Não, é gradual'}</div>`;
  chat.appendChild(userMsg);
  chat.scrollTop = chat.scrollHeight;

  // Typing indicator
  const typing = document.createElement('div');
  typing.className = 'chat-msg ai-msg';
  typing.id = 'typingIndicator';
  typing.innerHTML = `<div class="chat-avatar">🤖</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  setTimeout(() => {
    document.getElementById('typingIndicator')?.remove();

    const aiReply = document.createElement('div');
    aiReply.className = 'chat-msg ai-msg';

    if (type === 'urgent') {
      aiReply.innerHTML = `<div class="chat-avatar">🤖</div><div class="chat-bubble-msg">Entendido. Marquei como <strong>Alta Prioridade</strong> e alertei os serviços municipais. A sua contribuição entra na fila urgente. Quer ver as ocorrências similares encontradas?</div>`;
    } else {
      aiReply.innerHTML = `<div class="chat-avatar">🤖</div><div class="chat-bubble-msg">Obrigado. Registei como <strong>Prioridade Média</strong>. Encontrei 8 situações similares na sua zona que podem ser tratadas em conjunto pelo município. Quer ver o contexto?</div>`;
    }

    chat.appendChild(aiReply);
    chat.scrollTop = chat.scrollHeight;

    const s3f = document.getElementById('step3Footer');
    if (s3f) s3f.classList.remove('hidden');
    qr.style.display = 'none';
  }, 1600);
}

// ── Step 4: join community ─────────────────────────────────────────────────
function joinCommunity() {
  const btn = document.getElementById('joinBtn');
  btn.textContent = '✓ Entrou na Comunidade!';
  btn.style.background = 'linear-gradient(135deg,#10b981,#34d399)';
  setTimeout(() => nextStep(), 800);
}

// ── Step 5: confirm animation ──────────────────────────────────────────────
function triggerConfirmAnimation() {
  const check = document.querySelector('.confirm-check');
  if (check) {
    check.style.animation = 'none';
    void check.offsetWidth;
    check.style.animation = 'popIn .4s ease';
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  LOGIN / REGISTO — GLASSMORPHISM
// ══════════════════════════════════════════════════════════════════════════

let loginDone = false;

function openLogin() {
  loginDone = false;
  showLScreen('ls-email');
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
    email:    'Bem-vindo de volta, António!',
    cmd:      'Autenticado com sucesso!',
    register: 'Conta criada com sucesso!'
  };
  const subs = {
    email:    'Está autenticado via email na plataforma CivicPulse.',
    cmd:      'Autenticação via Chave Móvel Digital confirmada.',
    register: 'Bem-vindo à comunidade CivicPulse!'
  };

  document.getElementById('ls-success-title').textContent = titles[method] || titles.email;
  document.getElementById('ls-success-sub').textContent   = subs[method]   || subs.email;

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
  email: 'antonio@civicpulse.pt',
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
  const dd  = document.getElementById('userDropdown');
  const btn = document.getElementById('navUserBtn');
  if (!dd) return;
  const isOpen = !dd.classList.contains('hidden');
  dd.classList.toggle('hidden', isOpen);
  btn?.classList.toggle('open', !isOpen);
}

function closeUserDropdown() {
  const dd  = document.getElementById('userDropdown');
  const btn = document.getElementById('navUserBtn');
  dd?.classList.add('hidden');
  btn?.classList.remove('open');
}

document.addEventListener('click', () => closeUserDropdown());

/* ── Gamification sync ── */
function updateGamification(loggedIn) {
  const banner    = document.getElementById('gamiUserBanner');
  const guest     = document.getElementById('gamiGuest');
  const grid      = document.getElementById('gamiGrid');
  const levelCard = document.querySelector('.level-card');
  const xpFill    = document.querySelector('.level-card .xp-fill');

  if (loggedIn) {
    banner?.classList.remove('hidden');
    guest?.classList.add('hidden');
    grid?.classList.remove('hidden');
    levelCard?.classList.add('user-active');
    if (xpFill) {
      xpFill.style.width = '0%';
      setTimeout(() => {
        xpFill.style.transition = 'width 1.2s ease';
        xpFill.style.width = `${(USER.xp / USER.xpMax * 100).toFixed(1)}%`;
      }, 400);
    }
  } else {
    banner?.classList.add('hidden');
    guest?.classList.remove('hidden');
    grid?.classList.add('hidden');
    levelCard?.classList.remove('user-active');
    if (xpFill) {
      xpFill.style.transition = '';
      xpFill.style.width = '78%';
    }
  }
}

/* ── Explore pills sync ── */
function updateExplorePills(loggedIn) {
  const existing = document.getElementById('myContribPill');
  if (loggedIn && !existing) {
    const pills = document.querySelector('.filter-pills');
    if (!pills) return;
    const pill = document.createElement('button');
    pill.className = 'pill';
    pill.id = 'myContribPill';
    pill.textContent = `📌 As Minhas (${USER.contributions})`;
    pill.onclick = () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      highlightMyCards();
    };
    pills.appendChild(pill);
  } else if (!loggedIn && existing) {
    existing.remove();
    document.querySelectorAll('.community-card').forEach(c => c.classList.remove('my-card'));
  }
}

function highlightMyCards() {
  const cards = document.querySelectorAll('.community-card');
  cards.forEach((c, i) => c.classList.toggle('my-card', i < 2));
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
  document.getElementById('toastMsg').textContent  = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}
