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
  currentStep  = 1;
  replyGiven   = false;
  chatMsgCount = 0;

  // Step 1 — canal + upload
  selectChannel('web');
  document.getElementById('uploadZone').classList.remove('hidden');
  document.getElementById('uploadPreview').classList.add('hidden');
  document.getElementById('step1Btn').disabled = true;

  // Step 1 — form fields
  ['fieldCategoria','fieldMorada','fieldDescricao','fieldData'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
    document.getElementById('cf-' + id.replace('field','').toLowerCase())?.classList.remove('ai-filled');
  });
  const status = document.getElementById('aiSuggestStatus');
  if (status) status.textContent = '⏳ IA a analisar a imagem...';

  // Step 2 proc steps
  ['proc1','proc2','proc3','proc4'].forEach(id => {
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
      fieldMorada:    'Rua de Couros, 18, Guimarães',
      fieldDescricao: 'Buraco de aproximadamente 40 cm no passeio junto ao poste de luz nº 12. Representa risco de queda, especialmente para idosos e crianças.',
      fieldData:      new Date().toISOString().split('T')[0]
    };
    Object.entries(fills).forEach(([id, val]) => {
      const el = document.getElementById(id);
      const cf = document.getElementById('cf-' + id.replace('field','').toLowerCase());
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

function onTextInput() { onFormInput(); }

function selectChannel(ch) {
  ['web','email','sms'].forEach(c => {
    document.getElementById('chtab-' + c)?.classList.toggle('active', c === ch);
    document.getElementById('chpanel-' + c)?.classList.toggle('hidden', c !== ch);
  });
  const btn = document.getElementById('step1Btn');
  if (ch === 'web') {
    btn.textContent = 'Enviar →';
    btn.disabled = (document.getElementById('fieldDescricao')?.value.trim().length ?? 0) < 5;
    btn.style.display = '';
  } else {
    btn.style.display = 'none';
  }
}

function filterJornal(cat, btn) {
  document.querySelectorAll('.jfilter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('[data-cat]').forEach(card => {
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
  const chat = document.getElementById('chatSession');
  if (!chat) return;
  chat.innerHTML = '';
  setTimeout(() => {
    appendAiMsg(chat, 'A sua contribuição foi registada! Posso fazer-lhe algumas perguntas para enriquecer o relatório? Esta conversa ficará sempre disponível em <strong>Minhas Contribuições</strong>.');
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

  setTimeout(() => {
    document.getElementById('typingIndicator')?.remove();
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
}

// ══════════════════════════════════════════════════════════════════════════
//  LOGIN / REGISTO — GLASSMORPHISM
// ══════════════════════════════════════════════════════════════════════════

let loginDone = false;

function openLogin(hint) {
  loginDone = false;
  showLScreen('ls-email');
  const hintEl  = document.getElementById('loginContextHint');
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
  const guest     = document.getElementById('gamiGuest');
  const grid      = document.getElementById('gamiGrid');
  const levelCard = document.querySelector('.level-card');
  const xpFill    = document.querySelector('.level-card .xp-fill');

  if (loggedIn) {
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
