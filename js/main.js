// ===== Navbar : indicateur animé sous l'onglet actif =====
function initNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const links = Array.from(navbar.querySelectorAll(".navbar__link"));
  const indicator = navbar.querySelector(".navbar__indicator");
  if (!indicator) return;

  function moveIndicatorTo(link) {
    // largeur posée instantanément (pas de transition dessus), seule la position
    // glisse via transform pour rester sur le compositeur (pas de layout animé)
    indicator.style.width = link.offsetWidth + "px";
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  }

  const active = links.find((link) => link.classList.contains("is-active")) || links[0];
  if (active) {
    // attendre que la mise en page soit prête avant de positionner l'indicateur
    requestAnimationFrame(() => moveIndicatorTo(active));
  }

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => moveIndicatorTo(link));
    link.addEventListener("mouseleave", () => moveIndicatorTo(active));
  });

  window.addEventListener("resize", () => moveIndicatorTo(active));
}

// ===== Bouton à particules (effet magnétique au survol) =====
function initMagnetButtons() {
  document.querySelectorAll(".btn--magnet").forEach((button) => {
    const particleCount = 10;
    const spread = 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("span");
      particle.className = "btn__particle";
      const angle = Math.random() * Math.PI * 2;
      const distance = spread + Math.random() * spread;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      particle.style.left = "50%";
      particle.style.top = "50%";
      particle.style.translate = `${x}px ${y}px`;
      particle.dataset.restX = x;
      particle.dataset.restY = y;
      button.appendChild(particle);
    }

    const particles = button.querySelectorAll(".btn__particle");

    button.addEventListener("mouseenter", () => {
      particles.forEach((particle) => {
        particle.style.transition = "translate 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
        particle.style.translate = "0px 0px";
      });
    });

    button.addEventListener("mouseleave", () => {
      particles.forEach((particle) => {
        particle.style.transition = "translate 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
        particle.style.translate = `${particle.dataset.restX}px ${particle.dataset.restY}px`;
      });
    });
  });
}

// ===== Carrousel de cartes extensibles =====
function initCarousels() {
  document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel__track");
    const prevBtn = carousel.querySelector(".carousel__nav--prev");
    const nextBtn = carousel.querySelector(".carousel__nav--next");
    if (!track) return;

    const scrollByCard = (direction) => {
      const card = track.querySelector(".card");
      const gap = 24;
      const amount = card ? card.offsetWidth + gap : 320;
      track.scrollBy({ left: direction * amount, behavior: "smooth" });
    };

    prevBtn?.addEventListener("click", () => scrollByCard(-1));
    nextBtn?.addEventListener("click", () => scrollByCard(1));

    track.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("click", () => openCardModal(card));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCardModal(card);
        }
      });
    });
  });

  const modal = document.querySelector(".card-modal");
  modal?.querySelector(".card-modal__close")?.addEventListener("click", closeCardModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeCardModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCardModal();
  });
}

let lastFocusedBeforeModal = null;

function setInertOutsideModal(isInert) {
  document.querySelectorAll("body > *").forEach((el) => {
    if (!el.classList.contains("card-modal")) {
      el.toggleAttribute("inert", isInert);
    }
  });
}

function openCardModal(card) {
  const modal = document.querySelector(".card-modal");
  const panel = modal?.querySelector(".card-modal__panel");
  if (!modal || !panel) return;
  modal.querySelector(".card-modal__title").textContent = card.dataset.title || "";
  modal.querySelector(".card-modal__tag").textContent = card.dataset.tag || "";
  modal.querySelector(".card-modal__body").textContent = card.dataset.description || "";
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
  lastFocusedBeforeModal = card;
  setInertOutsideModal(true);
  panel.focus();
}

function closeCardModal() {
  const modal = document.querySelector(".card-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
  setInertOutsideModal(false);
  lastFocusedBeforeModal?.focus();
  lastFocusedBeforeModal = null;
}

// ===== Scroll reveal : repli pour les navigateurs sans animation-timeline =====
function initScrollReveal() {
  if (CSS.supports("animation-timeline: view()")) return;

  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((item) => observer.observe(item));
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initMagnetButtons();
  initCarousels();
  initScrollReveal();
});
