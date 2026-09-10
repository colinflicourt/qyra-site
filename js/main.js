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

// ===== Story scroll (page Mon parcours) =====
// Section haute de N*100vh avec une scène épinglée (même schéma que .scrollytell). La
// progression du scroll (0..1) est reconvertie en position sur une timeline à N-1 "pas" :
// le texte de chaque étape apparaît/disparaît sur une fraction rapide de son pas, pendant
// que son image effectue un fondu-balayage plus lent, étalé sur tout le pas (clip-path qui
// grignote le bas de l'image du dessus pour révéler celle du dessous, qui grandit un peu en
// même temps) — texte et image sont volontairement désynchronisés : le texte change vite,
// l'image continue de se transformer pendant qu'on lit la suite.
function initStoryScroll() {
  const root = document.getElementById("storySection");
  if (!root) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // .story-fallback prend le relais (voir CSS)

  const contents = Array.from(root.querySelectorAll(".story__content"));
  const images = Array.from(root.querySelectorAll(".story__image"));
  const hint = root.querySelector(".story__hint");
  const count = contents.length;
  if (!count || images.length !== count) return;

  const CONTENT_TRANS = 0.45;
  const CONTENT_DELAY = 0.175;
  const ENTER_Y = 2;
  const EXIT_Y = -2;
  const SCALE_INITIAL = 1.5;
  const SCALE_ACTIVE = 1.2;
  const SCALE_EXIT = 1;
  const totalSteps = Math.max(1, count - 1);

  function contentState(i, t) {
    let opacity = 1;
    let y = 0;
    if (i > 0) {
      const enterStart = i - 1 + CONTENT_TRANS + CONTENT_DELAY;
      const enterEnd = enterStart + CONTENT_TRANS;
      if (t <= enterStart) {
        opacity = 0;
        y = ENTER_Y;
      } else if (t < enterEnd) {
        const p = (t - enterStart) / (enterEnd - enterStart);
        opacity = p;
        y = ENTER_Y * (1 - p);
      }
    }
    if (i < count - 1) {
      const exitStart = i;
      const exitEnd = i + CONTENT_TRANS;
      if (t >= exitEnd) {
        opacity = 0;
        y = EXIT_Y;
      } else if (t > exitStart) {
        const p = (t - exitStart) / (exitEnd - exitStart);
        opacity = Math.min(opacity, 1 - p);
        y = EXIT_Y * p;
      }
    }
    return { opacity, y };
  }

  function imageState(i, t) {
    let scale = SCALE_ACTIVE;
    let clip = 0;
    if (i > 0) {
      const start = i - 1;
      const end = i;
      if (t <= start) scale = SCALE_INITIAL;
      else if (t < end) scale = SCALE_INITIAL + (SCALE_ACTIVE - SCALE_INITIAL) * ((t - start) / (end - start));
      else scale = SCALE_ACTIVE;
    }
    if (i < count - 1) {
      const start = i;
      const end = i + 1;
      if (t > start) {
        const p = Math.min(1, (t - start) / (end - start));
        clip = p * 100;
        scale = SCALE_ACTIVE + (SCALE_EXIT - SCALE_ACTIVE) * p;
      }
    }
    return { scale, clip };
  }

  function render(progress) {
    const t = progress * totalSteps;
    contents.forEach((content, i) => {
      const { opacity, y } = contentState(i, t);
      content.style.opacity = opacity;
      content.style.transform = `translateY(${y}%)`;
    });
    images.forEach((image, i) => {
      const { scale, clip } = imageState(i, t);
      image.style.transform = `scale(${scale})`;
      image.style.clipPath = `inset(0% 0% ${clip}% 0%)`;
      image.style.zIndex = count - i;
    });
    if (hint) hint.style.opacity = progress > 0.015 && progress < 0.985 ? 1 : 0;
  }

  function update() {
    const rect = root.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 1;
    render(progress);
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

// ===== Reel de projets (page Projets) =====
// Anneau de cartes positionnées via un seul angle (rotation) : chaque carte i est à
// θ = i·pas + rotation, sa profondeur = (cos θ + 1) / 2 pilote à la fois son échelle,
// son opacité et son empilement (z-index) — une seule valeur ne peut jamais se
// contredire elle-même. La position x est dérivée de l'écart angulaire signé par
// rapport au devant (et non de sin θ brut) pour que les 6 cartes occupent 6 positions
// distinctes de part et d'autre du centre, sans que deux cartes symétriques se
// superposent exactement à la même abscisse.
function initProjectsReel() {
  const reel = document.getElementById("projectsReel");
  if (!reel) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // .reel-fallback prend le relais (voir CSS)

  const stage = reel.querySelector(".reel__stage");
  const cards = Array.from(reel.querySelectorAll(".reel__card"));
  const count = cards.length;
  if (!stage || !count) return;

  const caption = document.getElementById("reelCaption");
  const captionTag = document.getElementById("reelTag");
  const captionTitle = document.getElementById("reelTitle");
  const captionDesc = document.getElementById("reelDesc");
  const captionCta = document.getElementById("reelCta");
  const prevBtn = reel.parentElement.querySelector(".reel__nav--prev");
  const nextBtn = reel.parentElement.querySelector(".reel__nav--next");

  const TAU = Math.PI * 2;
  const MIN_SCALE = 0.55;
  const RADIUS_X_RATIO = 0.42;
  const RADIUS_Y_RATIO = 0.14;
  const BASE_CARD_W = 210;
  const BASE_CARD_H = 294;
  const HOLD_MS = 2200;
  const STEP_MS = 700;
  const SNAP_MS = 500;
  const DRAG_START_THRESHOLD = 8;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const step = TAU / count;

  let rotation = 0;
  let radiusX = 0;
  let radiusY = 0;
  let frontIndex = -1;
  let dragging = false;
  let dragStartX = 0;
  let dragStartRotation = 0;
  let dragMoved = 0;
  let hovering = false;
  let focused = false;
  let rafId = null;
  let autoplayTimer = null;

  function shortestDelta(from, to) {
    return (((to - from + Math.PI) % TAU) + TAU) % TAU - Math.PI;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function cancelAnimation() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function animateRotationTo(target, duration, easing, onDone) {
    cancelAnimation();
    const start = rotation;
    const delta = target - start;
    const t0 = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - t0) / duration);
      rotation = start + delta * easing(t);
      render();
      if (t < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = null;
        if (onDone) onDone();
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  function setCta(href, cta, status) {
    captionCta.textContent = "";
    if (href) {
      const a = document.createElement("a");
      a.className = "reel__caption-link";
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      a.append((cta || "Voir le projet") + " ");
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "→";
      a.append(arrow);
      captionCta.append(a);
    } else if (status) {
      const span = document.createElement("span");
      span.className = "reel__caption-status";
      span.textContent = status;
      captionCta.append(span);
    }
  }

  function updateCaption(card) {
    captionTag.textContent = card.dataset.tag || "";
    captionTitle.textContent = card.dataset.title || "";
    captionDesc.textContent = card.dataset.desc || "";
    setCta(card.dataset.href, card.dataset.cta, card.dataset.status);
    const accent = getComputedStyle(card).getPropertyValue("--accent").trim();
    caption.style.setProperty("--reel-accent-active", accent);
  }

  function updateFront() {
    let bestIdx = 0;
    let bestCos = -Infinity;
    cards.forEach((card, i) => {
      const cos = Math.cos(i * step + rotation);
      if (cos > bestCos) {
        bestCos = cos;
        bestIdx = i;
      }
    });
    if (bestIdx !== frontIndex) {
      if (frontIndex >= 0) cards[frontIndex].classList.remove("is-front");
      frontIndex = bestIdx;
      cards[frontIndex].classList.add("is-front");
      updateCaption(cards[frontIndex]);
    }
  }

  function render() {
    cards.forEach((card, i) => {
      const raw = i * step + rotation;
      const delta = shortestDelta(0, raw);
      const depth = (Math.cos(delta) + 1) / 2;
      const x = (delta / Math.PI) * radiusX;
      const y = (1 - depth) * radiusY;
      const scale = MIN_SCALE + (1 - MIN_SCALE) * depth;
      const opacity = 0.35 + 0.65 * depth;
      card.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
      card.style.zIndex = Math.round(scale * 1000);
      card.style.opacity = opacity;
    });
    updateFront();
  }

  function computeLayout() {
    const w = reel.clientWidth;
    const h = reel.clientHeight;
    radiusX = w * RADIUS_X_RATIO;
    radiusY = h * RADIUS_Y_RATIO;
    const fit = clamp(
      Math.min(w / (radiusX * 2 + BASE_CARD_W), h / (radiusY * 2 + BASE_CARD_H)),
      0.55,
      1
    );
    const cardW = BASE_CARD_W * fit;
    const cardH = BASE_CARD_H * fit;
    cards.forEach((card) => {
      card.style.width = cardW + "px";
      card.style.height = cardH + "px";
    });
    render();
  }

  function goTo(i) {
    cancelAnimation();
    const target = rotation + shortestDelta(rotation, -i * step);
    animateRotationTo(target, STEP_MS, easeInOutCubic, scheduleAutoplay);
  }

  function scheduleAutoplay() {
    clearTimeout(autoplayTimer);
    autoplayTimer = setTimeout(() => {
      if (dragging || hovering || focused) {
        scheduleAutoplay();
        return;
      }
      goTo((frontIndex + 1) % count);
    }, HOLD_MS);
  }

  // La capture du pointeur n'est prise qu'une fois un vrai mouvement détecté (au-delà
  // de DRAG_START_THRESHOLD), jamais dès le pointerdown : la capturer plus tôt reciblerait
  // le pointerup vers .reel, et le clic serait alors calculé sur l'ancêtre commun (.reel)
  // au lieu du bouton-carte — le clic natif de chaque carte ne se déclencherait plus.
  let activePointerId = null;

  reel.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    activePointerId = e.pointerId;
    dragging = false;
    dragMoved = 0;
    dragStartX = e.clientX;
    dragStartRotation = rotation;
    cancelAnimation();
    clearTimeout(autoplayTimer);
  });

  reel.addEventListener("pointermove", (e) => {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    const dx = e.clientX - dragStartX;
    dragMoved = Math.abs(dx);
    if (!dragging) {
      if (dragMoved < DRAG_START_THRESHOLD) return;
      dragging = true;
      reel.classList.add("reel--dragging");
      reel.setPointerCapture(activePointerId);
    }
    rotation = dragStartRotation + (dx / (radiusX || 1)) * Math.PI;
    render();
  });

  function endDrag(e) {
    if (activePointerId === null || e.pointerId !== activePointerId) return;
    activePointerId = null;
    if (!dragging) {
      // Simple clic/tap sans glissement : on ne capture rien, le clic natif de la
      // carte (ou du fond) se charge de la sélection.
      scheduleAutoplay();
      return;
    }
    dragging = false;
    reel.classList.remove("reel--dragging");
    if (reel.hasPointerCapture(e.pointerId)) reel.releasePointerCapture(e.pointerId);
    const target = Math.round(rotation / step) * step;
    animateRotationTo(target, SNAP_MS, easeOutCubic, scheduleAutoplay);
  }

  reel.addEventListener("pointerup", endDrag);
  reel.addEventListener("pointercancel", endDrag);

  reel.addEventListener("pointerenter", () => {
    hovering = true;
  });
  reel.addEventListener("pointerleave", () => {
    hovering = false;
  });
  reel.addEventListener("focusin", () => {
    focused = true;
  });
  reel.addEventListener("focusout", () => {
    focused = false;
  });

  reel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo((frontIndex + 1) % count);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo((frontIndex - 1 + count) % count);
    }
  });

  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      if (i === frontIndex) {
        const href = card.dataset.href;
        if (href) window.open(href, "_blank", "noopener");
      } else {
        goTo(i);
      }
    });
  });

  prevBtn?.addEventListener("click", () => goTo((frontIndex - 1 + count) % count));
  nextBtn?.addEventListener("click", () => goTo((frontIndex + 1) % count));

  window.addEventListener("resize", computeLayout);

  computeLayout();
  scheduleAutoplay();
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
  initProjectsReel();
  initStoryScroll();
  initScrollReveal();
});
