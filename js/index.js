// Filter pills toggle
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// Fechar card flutuante manualmente com animação suave
function dismissCard(btn) {
  const card = btn.closest('.float-card');
  card.style.transition = 'opacity .35s ease, transform .35s ease';
  card.style.opacity = '0';
  card.style.transform = 'translateY(-10px)';
  card.style.animation = 'none';
  setTimeout(() => card.style.display = 'none', 360);
}

// Modal
function openModal() {
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
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Smooth progress bar animation on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.width = entry.target.dataset.width || entry.target.style.width;
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.progress-fill').forEach(el => {
  observer.observe(el);
});

// Navbar scroll shadow
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 20) {
    nav.style.boxShadow = '0 4px 24px rgba(15,45,110,.12)';
  } else {
    nav.style.boxShadow = '0 1px 12px rgba(15,45,110,.07)';
  }
});
