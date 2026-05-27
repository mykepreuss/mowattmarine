const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const root = document.documentElement;
const whatsappFallbackDelay = 1400;
let urgentNoteTimer;

function headerOffset() {
  return Math.ceil(header.getBoundingClientRect().bottom);
}

function setHeaderOffset() {
  root.style.setProperty("--header-offset", `${headerOffset()}px`);
}

function setScrolledHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

function scrollToTarget(hash, replaceHistory = false, forceInstant = false) {
  const target = hash === "#top" ? document.body : document.querySelector(hash);

  if (!target) {
    return;
  }

  const top = hash === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - headerOffset();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion || forceInstant ? "auto" : "smooth",
  });

  if (replaceHistory) {
    history.replaceState(null, "", hash);
  } else {
    history.pushState(null, "", hash);
  }
}

function closeNavigation() {
  document.body.classList.remove("nav-open");
  header.classList.remove("nav-active");
  nav.classList.remove("is-open");
  navToggle.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
}

function highlightUrgentNote() {
  const urgentNote = document.querySelector("[data-emergency-note]");

  if (!urgentNote) {
    return;
  }

  urgentNote.classList.remove("is-highlighted");
  urgentNote.removeAttribute("data-highlighted");
  urgentNote.getBoundingClientRect();
  urgentNote.classList.add("is-highlighted");
  urgentNote.setAttribute("data-highlighted", "true");
  window.clearTimeout(urgentNoteTimer);
  urgentNoteTimer = window.setTimeout(() => {
    urgentNote.classList.remove("is-highlighted");
    urgentNote.removeAttribute("data-highlighted");
  }, 3200);
}

function setEmergencyIntakeMode() {
  const intakeNeed = document.querySelector('select[name="need"]');

  if (intakeNeed) {
    intakeNeed.value = "Emergency repair";
  }

  highlightUrgentNote();
}

function fallbackToEmergencyIntake() {
  setEmergencyIntakeMode();
  closeNavigation();
  scrollToTarget("#contact");
}

function tryWhatsAppThenFallback(link) {
  const whatsappScheme = link.dataset.whatsappScheme;

  if (!whatsappScheme) {
    fallbackToEmergencyIntake();
    return;
  }

  let pageLeftForWhatsApp = false;
  let fallbackTimer;
  const launcher = document.createElement("iframe");

  launcher.hidden = true;
  launcher.setAttribute("aria-hidden", "true");
  launcher.style.display = "none";

  function cleanup() {
    window.clearTimeout(fallbackTimer);
    document.removeEventListener("visibilitychange", detectWhatsAppHandoff);
    window.removeEventListener("pagehide", markWhatsAppHandoff);
    launcher.remove();
  }

  function markWhatsAppHandoff() {
    pageLeftForWhatsApp = true;
    cleanup();
  }

  function detectWhatsAppHandoff() {
    if (document.visibilityState === "hidden") {
      markWhatsAppHandoff();
    }
  }

  document.addEventListener("visibilitychange", detectWhatsAppHandoff);
  window.addEventListener("pagehide", markWhatsAppHandoff, { once: true });

  fallbackTimer = window.setTimeout(() => {
    cleanup();

    if (!pageLeftForWhatsApp) {
      fallbackToEmergencyIntake();
    }
  }, whatsappFallbackDelay);

  document.body.append(launcher);
  launcher.src = whatsappScheme;
}

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", isOpen);
  header.classList.toggle("nav-active", isOpen);
  navToggle.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeNavigation();
  }
});

document.addEventListener("click", (event) => {
  const clickedLink = event.target instanceof Element ? event.target.closest("a") : null;

  if (!(clickedLink instanceof HTMLAnchorElement)) {
    return;
  }

  if (clickedLink.hasAttribute("data-emergency-intake")) {
    event.preventDefault();
    closeNavigation();
    tryWhatsAppThenFallback(clickedLink);
    return;
  }

  if (!clickedLink.matches('a[href^="#"]')) {
    return;
  }

  const link = clickedLink;

  const hash = link.getAttribute("href");

  if (!hash || hash === "#") {
    return;
  }

  const target = hash === "#top" ? document.body : document.querySelector(hash);

  if (!target) {
    return;
  }

  event.preventDefault();

  closeNavigation();
  scrollToTarget(hash);
});

window.addEventListener("scroll", setScrolledHeader, { passive: true });
window.addEventListener("resize", () => {
  setHeaderOffset();

  if (window.innerWidth > 1050) {
    closeNavigation();
  }
});

function restoreInitialHashPosition() {
  setHeaderOffset();

  if (window.location.hash) {
    window.setTimeout(() => {
      window.requestAnimationFrame(() => scrollToTarget(window.location.hash, true, true));
    }, 80);
  }
}

if (document.readyState === "complete") {
  restoreInitialHashPosition();
} else {
  window.addEventListener("load", restoreInitialHashPosition);
}

setHeaderOffset();
setScrolledHeader();
