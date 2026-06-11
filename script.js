// Skrypty strony P.U.H. DROGMET — zoptymalizowana wersja (2026)

'use strict';

// ══════════════════════════════════════════════════════════
// 0. POPRAWKA CSS — wyłącz scroll-behavior:smooth z arkusza
//    bo kolizja z naszym JS-owym scrollem powoduje szarpanie
// ══════════════════════════════════════════════════════════
document.documentElement.style.scrollBehavior = 'auto';

// ══════════════════════════════════════════════════════════
// 1. SMOOTH SCROLL — jedna implementacja, bez konfliktów
//    Używamy will-change i requestAnimationFrame z passive scroll
// ══════════════════════════════════════════════════════════
function smoothScrollTo(targetY, onDone) {
  const start    = window.scrollY;
  const dist     = targetY - start;
  const absD     = Math.abs(dist);

  // Dla bardzo krótkich dystansów — natychmiastowy skok (nie ma co animować)
  if (absD < 4) {
    window.scrollTo(0, targetY);
    if (onDone) onDone();
    return;
  }

  // Czas proporcjonalny do dystansu, ale ograniczony rozsądnymi granicami
  const duration = Math.max(300, Math.min(absD * 0.55, 900));
  const startTime = performance.now();

  // easeOutCubic — szybszy start, miękki koniec (bardziej naturalny niż InOut)
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  let rafId;
  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + dist * ease(progress));
    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      if (onDone) onDone();
    }
  }
  rafId = requestAnimationFrame(step);
}

function smoothScrollTop() {
  smoothScrollTo(0);
}

// ══════════════════════════════════════════════════════════
// 2. NAV — scroll listener z throttlingiem
//    requestAnimationFrame jako throttle > setInterval/scroll bez throttla
// ══════════════════════════════════════════════════════════
const navbar      = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scrollTop');

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 60);
      scrollTopBtn.classList.toggle('show', y > 300);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });   // ← passive:true = przeglądarka nie blokuje scrola


// ══════════════════════════════════════════════════════════
// 3. HAMBURGER
// ══════════════════════════════════════════════════════════
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  mobileMenu.classList.toggle('open');
});

function closeMobile() {
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('open');
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 960) closeMobile();
}, { passive: true });


// ══════════════════════════════════════════════════════════
// 4. ANCHOR SCROLL — jeden handler, bez preventDefault na pasywnych
// ══════════════════════════════════════════════════════════
const NAV_OFFSET = 82;  // wysokość navbara

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;
    smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET);
  });
});


// ══════════════════════════════════════════════════════════
// 5. INTERSECTION OBSERVERS — animacje kart i cities
//    threshold niższy = trigger wcześniej, mniej pracy podczas scrola
// ══════════════════════════════════════════════════════════
const cards = document.querySelectorAll('.service-card, .machine-card');
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const idx = [...cards].indexOf(e.target);
      e.target.style.animationDelay = `${(idx % 6) * 0.08}s`;
      e.target.classList.add('in-view');
      cardObserver.unobserve(e.target);  // ← unobserve po odpaleniu = mniej pracy
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
cards.forEach(c => cardObserver.observe(c));


const cityItems = document.querySelectorAll('.city-item');
const citiesObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    cityItems.forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), i * 200);
    });
    citiesObs.disconnect();  // ← po jednym odpaleniu — koniec obserwacji
  }
}, { threshold: 0.2 });
const cl = document.getElementById('citiesList');
if (cl) citiesObs.observe(cl);


// ══════════════════════════════════════════════════════════
// 6. COUNTER — licznik lat doświadczenia
// ══════════════════════════════════════════════════════════
const counter = document.getElementById('counter12');
let counterStarted = false;
const counterObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !counterStarted) {
    counterStarted = true;
    counterObs.disconnect();
    let n = 0; const end = 15; const step = 1800 / end;
    const timer = setInterval(() => {
      n++;
      counter.textContent = n;
      if (n >= end) clearInterval(timer);
    }, step);
  }
}, { threshold: 0.5 });
if (counter) counterObs.observe(counter);


// ══════════════════════════════════════════════════════════
// 7. LEAFLET MAP — leniwa inicjalizacja (tylko gdy widoczna)
//    Na słabych urządzeniach mapa nie blokuje renderowania strony
// ══════════════════════════════════════════════════════════
const mapEl = document.getElementById('serviceMap');
let mapInitialized = false;

function initMap() {
  if (mapInitialized || !mapEl) return;
  mapInitialized = true;

  const map = L.map('serviceMap', {
    center: [53.55, 22.85],
    zoom: 14,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false,
    // Wyłącz animacje mapy — mniej GPU na słabych urządzeniach
    zoomAnimation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    fadeAnimation: false,
    markerZoomAnimation: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 14,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);

  const podlaskiePoly = [[
    [53.3993485619479,  23.68781840993384],
    [53.5859169843809,  23.62684717952402],
    [53.672902286070396,23.596714657820158],
    [53.709860361535014,23.584391314844957],
    [53.72808497148836, 23.585537021353215],
    [53.73696702056178, 23.583712364730616],
    [53.744078332766286,23.58210082647713],
    [53.74543830974591, 23.579460953841362],
    [53.76012366631808, 23.560018447911435],
    [53.767578512968505,23.548668510115895],
    [53.780332108039886,23.54660711854948],
    [53.791755688870055,23.544483756212237],
    [53.80133043437391, 23.544601417570828],
    [53.82243278093665, 23.54553693417124],
    [53.82763436924026, 23.54616281393541],
    [53.831756971319514,23.550007330138488],
    [53.834782518830195,23.547231018570592],
    [53.83621089614077, 23.548047191569218],
    [53.83826542420034, 23.55100489973705],
    [53.8409350803841,  23.551355563287444],
    [53.84319508102538, 23.547962501609792],
    [53.844531376466435,23.545525425753432],
    [53.84689134005092, 23.545310469745687],
    [53.84883947390507, 23.546498846154964],
    [53.84914544329679, 23.550463641563645],
    [53.85109555552687, 23.55130235007466],
    [53.85253191925132, 23.550158039580168],
    [53.856121238757275,23.547960540721046],
    [53.85695141702358, 23.535127657682565],
    [53.86259918053541, 23.523452369064593],
    [53.864721453878666,23.524860573367448],
    [53.86448221620434, 23.526431328545918],
    [53.86670774005661, 23.525908263778646],
    [53.86848762231796, 23.525567359778872],
    [53.873349461623164,23.523686174083835],
    [53.883584214931766,23.520632564340293],
    [53.902828450763536,23.51312228738294],
    [53.916523301843974,23.51113198137064],
    [53.929859474215576,23.510707405133044],
    [53.93633598977689, 23.51314787137813],
    [53.94301744367532, 23.513500796866104],
    [53.95617549318527, 23.51455490664079],
    [53.98839756441118, 23.481457769111714],
    [54.009435170738314,23.488029024921396],
    [54.00587035646113, 23.498300141935307],
    [54.01123105239464, 23.508571258949218],
    [54.027631523376385,23.515284922022428],
    [54.054685478004686,23.524963496591575],
    [54.073639097777416,23.521902829273547],
    [54.08569864971473, 23.51950980216921],
    [54.093359468880706,23.511101083497685],
    [54.121666626591455,23.492352470950962],
    [54.11766320156414, 23.363104035917303],
    [54.12260603233038, 23.14128816219869],
    [54.11687990775468, 22.879947542510337],
    [54.092093509639696,22.87072599480897],
    [54.0679820316185,  22.890952880676696],
    [54.02107777018873, 22.889496474584696],
    [53.92660203041048, 22.772164610468096],
    [53.894489273994054,22.70181758495073],
    [53.733255711860465,22.682149240109055],
    [53.57288922037495, 22.88941342403899],
    [53.380157987163415,23.04144602866529],
    [53.38857764708639, 23.480409150601957],
    [53.3993485619479,  23.68781840993384]
  ]];

  const podlaskieArea = L.polygon(podlaskiePoly, {
    color: '#F5A623', weight: 2,
    fillColor: '#F5A623', fillOpacity: 0.14,
    dashArray: '7,5', smoothFactor: 1.5, interactive: false
  }).addTo(map);

  map.fitBounds(podlaskieArea.getBounds(), { padding: [24, 24] });

  const pulseIcon = L.divIcon({
    className: '',
    html: `<div style="position:relative;width:32px;height:32px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(245,166,35,0.3);animation:mapPulse 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#F5A623;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
    </div>`,
    iconSize: [32, 32], iconAnchor: [16, 16]
  });

  const cityIcon = L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:#F5A623;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.4);"></div>',
    iconSize: [14, 14], iconAnchor: [7, 7]
  });

  const isTouchLayout = window.matchMedia('(max-width: 960px)').matches;
  const mainPopup = `<div style="font-family:Oswald,sans-serif;padding:6px 2px;">
    <div style="font-size:1rem;font-weight:700;color:#F5A623;">🏭 ŻWIROWNIA SKIEBLEWO</div>
    <div style="font-size:0.78rem;color:#333;margin-top:4px;">P.U.H. DROGMET · Lipsk</div>
    <div style="font-size:0.75rem;color:#666;margin-top:2px;">ul. Złobikowskiego 3A, 16-315 Lipsk</div>
    <a href="tel:784103957" style="display:block;margin-top:8px;background:#F5A623;color:#1e1e1e;padding:5px 10px;text-align:center;text-decoration:none;font-weight:700;font-size:0.82rem;border-radius:3px;">📞 784 103 957</a>
  </div>`;

  const mainMarker = L.marker([53.7581, 23.4215], { icon: pulseIcon }).addTo(map);
  if (!isTouchLayout) {
    mainMarker.bindPopup(mainPopup, { maxWidth: 220 }).openPopup();
  }

  const cities = [
    { name: 'Augustów',           coords: [53.8447, 23.0027] },
    { name: 'Suwałki',            coords: [54.0993, 22.9365] },
    { name: 'Dąbrowa Białostocka',coords: [53.6623, 23.3470] },
    { name: 'Sokółka',            coords: [53.4027, 23.5033] },
    { name: 'Suchowola',          coords: [53.5883, 23.0611] }
  ];

  cities.forEach(c => {
    L.marker(c.coords, { icon: cityIcon, interactive: false }).addTo(map);
    L.polyline([[53.7581, 23.4215], c.coords], {
      color: 'rgba(245,166,35,0.45)', weight: 2, dashArray: '8,6', interactive: false
    }).addTo(map);
  });

  L.control.attribution({ prefix: false, position: 'bottomright' })
    .addAttribution('© OpenStreetMap · © CartoDB')
    .addTo(map);
}

// Inicjalizuj mapę dopiero gdy sekcja #obszar wejdzie w viewport
if (mapEl) {
  const mapSectionObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      initMap();
      mapSectionObs.disconnect();
    }
  }, { threshold: 0.01, rootMargin: '200px 0px' });
  mapSectionObs.observe(mapEl);
}


// ══════════════════════════════════════════════════════════
// 8. FORM SUBMIT
// ══════════════════════════════════════════════════════════
const form      = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
if (form) {
  form.addEventListener('submit', () => {
    submitBtn.textContent = 'Wysyłanie...';
    submitBtn.style.background = '#888';
    submitBtn.disabled = true;
    setTimeout(() => {
      submitBtn.textContent = '✓ Wysłano! Odezwiemy się wkrótce.';
      submitBtn.style.background = '#27ae60';
      submitBtn.style.color = '#fff';
    }, 1500);
  });
}


// ══════════════════════════════════════════════════════════
// 9. GALERIA v3 — mobile/tablet: kategorie zwinięte do 4 zdjęć
// ══════════════════════════════════════════════════════════
(function () {
  const grid      = document.getElementById('galleryGrid');
  const toggleBtn = document.getElementById('galleryToggleBtn');
  const filterBtns = document.querySelectorAll('.gf-btn');

  if (!grid) return;

  let isExpanded    = false;
  let currentFilter = 'all';
  const MOBILE_QUERY = '(max-width: 960px)';
  const MOBILE_LIMIT = 4;

  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

  function isMobile() { return window.matchMedia(MOBILE_QUERY).matches; }

  function getMatching() {
    return galleryItems.filter(item =>
      currentFilter === 'all' || item.dataset.cat === currentFilter
    );
  }

  function updateToggle(matchingCount) {
    if (!toggleBtn) return;
    const wrap = toggleBtn.parentElement;
    const mobile = isMobile();

    if (mobile && matchingCount <= MOBILE_LIMIT) {
      toggleBtn.style.display = 'none';
      if (wrap) wrap.style.display = 'none';
      toggleBtn.classList.remove('expanded');
      return;
    }
    if (wrap) wrap.style.display = 'flex';
    toggleBtn.style.display = 'inline-flex';
    toggleBtn.querySelector('.gt-label').textContent =
      isExpanded ? 'Pokaż mniej' : (mobile ? 'Pokaż więcej' : 'Pokaż wszystkie zdjęcia');
    toggleBtn.classList.toggle('expanded', isExpanded);
  }

  function applyState(animate) {
    const mobile   = isMobile();
    const matching = getMatching();

    grid.classList.toggle('gallery-mobile-mode', mobile);
    grid.classList.toggle('collapsed', !isExpanded);

    galleryItems.forEach(item => {
      const matches = currentFilter === 'all' || item.dataset.cat === currentFilter;
      item.classList.toggle('gi-hidden', !matches);
      item.classList.remove('mobile-limit-hidden');
    });

    if (mobile && !isExpanded) {
      matching.forEach((item, i) => {
        if (i >= MOBILE_LIMIT) item.classList.add('mobile-limit-hidden');
      });
    }

    updateToggle(matching.length);

    if (animate) {
      const visible = matching.filter(item =>
        !item.classList.contains('mobile-limit-hidden')
      );
      visible.forEach((item, i) => {
        item.style.animationDelay = `${i * 0.05}s`;
        item.classList.remove('gi-visible');
        // Force reflow — minimum potrzebne dla ponownej animacji
        void item.offsetWidth;
        item.classList.add('gi-visible');
      });
    }

    rebuildVisible();
  }

  // IntersectionObserver dla kafli galerii
  const giObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el  = entry.target;
        const idx = parseInt(el.dataset.index || '0');
        el.style.animationDelay = `${(idx % 10) * 0.05}s`;
        el.classList.add('gi-visible');
        giObs.unobserve(el);
      }
    });
  }, { threshold: 0.06 });
  galleryItems.forEach(item => giObs.observe(item));

  // Przycisk pokaż więcej / mniej
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      applyState(true);
      if (!isExpanded) {
        const section = document.getElementById('galeria');
        if (section) smoothScrollTo(section.getBoundingClientRect().top + window.scrollY - 90);
      }
    });
  }

  // Filtry
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || 'all';
      isExpanded    = !isMobile();
      applyState(true);
    });
  });

  // ── LIGHTBOX ──
  const lbOverlay = document.getElementById('lbOverlay');
  const lbImg     = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  const lbCounter = document.getElementById('lbCounter');
  const lbClose   = document.getElementById('lbClose');
  const lbPrev    = document.getElementById('lbPrev');
  const lbNext    = document.getElementById('lbNext');

  let visibleItems = [];
  let currentIdx   = 0;

  function rebuildVisible() {
    visibleItems = Array.from(
      grid.querySelectorAll('.gallery-item:not(.gi-hidden):not(.mobile-limit-hidden)')
    );
  }

  function openLb(item) {
    rebuildVisible();
    currentIdx = Math.max(0, visibleItems.indexOf(item));
    showSlide(currentIdx, false);
    lbOverlay.classList.add('lb-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLb() {
    lbOverlay.classList.remove('lb-open');
    document.body.style.overflow = '';
  }

  function showSlide(idx, animate) {
    const item  = visibleItems[idx];
    if (!item)  return;
    const imgEl = item.querySelector('img');
    const txtEl = item.querySelector('.gallery-ov-txt');
    if (animate) {
      lbImg.style.opacity   = '0';
      lbImg.style.transform = 'scale(0.92)';
    }
    lbImg.src = imgEl ? imgEl.src : '';
    lbImg.alt = imgEl ? (imgEl.alt || '') : '';
    if (lbCaption) lbCaption.textContent = txtEl ? txtEl.textContent : '';
    if (lbCounter) lbCounter.textContent = `${idx + 1} / ${visibleItems.length}`;
    setTimeout(() => {
      lbImg.style.opacity   = '';
      lbImg.style.transform = '';
    }, 20);
  }

  function goPrev() {
    if (!visibleItems.length) return;
    currentIdx = (currentIdx - 1 + visibleItems.length) % visibleItems.length;
    showSlide(currentIdx, true);
  }
  function goNext() {
    if (!visibleItems.length) return;
    currentIdx = (currentIdx + 1) % visibleItems.length;
    showSlide(currentIdx, true);
  }

  grid.addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (item && !item.classList.contains('gi-hidden') && !item.classList.contains('mobile-limit-hidden')) {
      openLb(item);
    }
  });

  if (lbClose)   lbClose.addEventListener('click', closeLb);
  if (lbPrev)    lbPrev.addEventListener('click', goPrev);
  if (lbNext)    lbNext.addEventListener('click', goNext);
  if (lbOverlay) lbOverlay.addEventListener('click', e => { if (e.target === lbOverlay) closeLb(); });

  document.addEventListener('keydown', e => {
    if (!lbOverlay?.classList.contains('lb-open')) return;
    if (e.key === 'Escape')     closeLb();
    if (e.key === 'ArrowLeft')  goPrev();
    if (e.key === 'ArrowRight') goNext();
  });

  // Swipe na mobile
  let tx = 0, ty = 0;
  if (lbOverlay) {
    lbOverlay.addEventListener('touchstart', e => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    }, { passive: true });
    lbOverlay.addEventListener('touchend', e => {
      if (!lbOverlay.classList.contains('lb-open')) return;
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
        if (dx > 0) goPrev(); else goNext();
      }
    }, { passive: true });
  }

  // Resize — debounced
  let resizeTimer;
  let lastMobile = isMobile();
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const nowMobile = isMobile();
      if (nowMobile !== lastMobile) {
        isExpanded  = !nowMobile;
        lastMobile  = nowMobile;
      }
      applyState(false);
    }, 150);
  }, { passive: true });

  // Init
  isExpanded = false;
  applyState(false);
})();
