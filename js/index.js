// ── Smooth scroll ──────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href === '#') { e.preventDefault(); smoothScrollTo(0, 900); return; }
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navH = document.querySelector('nav').offsetHeight;
    smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - navH - 12, 900);
  });
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

// ── Progress bar animation on scroll ──────────────────────────────────────
const barObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.style.width = e.target.style.width;
  });
}, { threshold: 0.3 });
document.querySelectorAll('.progress-fill').forEach(el => barObserver.observe(el));

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

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

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
