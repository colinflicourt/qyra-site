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
  });
}

// ===== Nav compacte au scroll (pilule qui se resserre une fois qu'on a quitté le haut) =====
function initNavScroll() {
  const navbar = document.querySelector(".navbar");
  const logo = document.querySelector(".site-logo");
  if (!navbar) return;

  function update() {
    const scrolled = window.scrollY > 40;
    navbar.classList.toggle("navbar--compact", scrolled);
    logo?.classList.toggle("site-logo--compact", scrolled);
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
      }
    },
    { passive: true }
  );
  update();
}

// ===== Hero à défilement (page d'accueil) =====
// Un long conteneur (.scrollytell) contient une scène épinglée (position: sticky en CSS).
// On traduit la progression du scroll dans ce conteneur en opacité/translation par ligne,
// chacune définie par une fenêtre [in-start, in-end] (apparition) et [out, out-end] (disparition,
// absente pour le bloc final qui reste affiché jusqu'à la fin du couloir de scroll).
function initScrollytell() {
  const root = document.querySelector(".scrollytell");
  if (!root) return;

  const lines = Array.from(root.querySelectorAll(".scrollytell__line"));
  const final = root.querySelector(".scrollytell__final");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    // Le CSS gère déjà ce cas (voir @media prefers-reduced-motion), rien à animer en JS.
    return;
  }

  function readPhase(el) {
    return {
      el,
      inStart: parseFloat(el.dataset.in) || 0,
      inEnd: parseFloat(el.dataset.inEnd) || 0,
      outStart: el.dataset.out !== undefined ? parseFloat(el.dataset.out) : null,
      outEnd: el.dataset.outEnd !== undefined ? parseFloat(el.dataset.outEnd) : null,
    };
  }

  const phases = lines.map(readPhase);
  if (final) phases.push(readPhase(final));

  function opacityFor(progress, { inStart, inEnd, outStart, outEnd }) {
    if (progress <= inStart) return 0;
    if (progress < inEnd) return (progress - inStart) / (inEnd - inStart);
    if (outStart == null || progress < outStart) return 1;
    if (progress < outEnd) return 1 - (progress - outStart) / (outEnd - outStart);
    return 0;
  }

  function apply(phase, progress) {
    const o = opacityFor(progress, phase);
    phase.el.style.opacity = o;
    phase.el.style.transform =
      phase.el === final
        ? `translateY(${(1 - o) * 16}px) scale(${0.97 + o * 0.03})`
        : `translate(-50%, calc(-50% + ${(1 - o) * 18}px))`;
  }

  function update() {
    const rect = root.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 1;
    phases.forEach((phase) => apply(phase, progress));
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
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
  initNavScroll();
  initScrollytell();
  initMagnetButtons();
  initCarousels();
  initScrollReveal();
});
