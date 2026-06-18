// Skrypty strony P.U.H. DROGMET - wydzielone z index.html

// -- SMOOTH ANCHOR SCROLL v2 --
// Visible, cancellable animation for navbar anchors and the scroll-to-top button.
// CSS smooth scrolling stays disabled, so the browser does not run a second scroll animation.
const navbar = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scrollTop');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

let activeScrollFrame = null;
let navScrollTicking = false;

function cancelSmoothScroll() {
  if (activeScrollFrame !== null) {
    cancelAnimationFrame(activeScrollFrame);
    activeScrollFrame = null;
  }
}

function isMobileScrollMode() {
  return window.matchMedia && window.matchMedia('(max-width: 960px)').matches;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getNavOffset() {
  const navHeight = navbar ? navbar.getBoundingClientRect().height : 72;
  return Math.ceil(navHeight) + (isMobileScrollMode() ? 8 : 12);
}

function clampScrollY(y) {
  const doc = document.documentElement;
  const maxY = Math.max(0, doc.scrollHeight - window.innerHeight);
  return Math.max(0, Math.min(Math.round(y), maxY));
}

function getPageY() {
  return window.pageYOffset || document.documentElement.scrollTop || 0;
}

function scrollToY(targetY) {
  cancelSmoothScroll();

  const startY = getPageY();
  const endY = clampScrollY(targetY);
  const distance = endY - startY;

  if (Math.abs(distance) < 2) {
    window.scrollTo(0, endY);
    return;
  }

  const mobile = isMobileScrollMode();

  // The old scroll could take 1200-1600 ms and stack multiple RAF loops.
  // This keeps the animation visible, but caps it so weaker phones do not crawl.
  const duration = Math.min(
    mobile ? 760 : 900,
    Math.max(mobile ? 520 : 600, Math.abs(distance) * (mobile ? 0.22 : 0.26) + 360)
  );

  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const nextY = startY + distance * easeInOutCubic(progress);
    window.scrollTo(0, Math.round(nextY));

    if (progress < 1) {
      activeScrollFrame = requestAnimationFrame(step);
    } else {
      activeScrollFrame = null;
      window.scrollTo(0, endY);
    }
  }

  activeScrollFrame = requestAnimationFrame(step);
}

function smoothScrollTop() {
  scrollToY(0);
}
window.smoothScrollTop = smoothScrollTop;

// Cancel only when the user actually starts scrolling, not on a simple tap.
window.addEventListener('wheel', cancelSmoothScroll, { passive: true });
window.addEventListener('touchmove', cancelSmoothScroll, { passive: true });
window.addEventListener('keydown', function(e) {
  const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
  if (keys.includes(e.key)) cancelSmoothScroll();
});

// NAV scroll - throttled with requestAnimationFrame.
function updateNavOnScroll() {
  const y = window.scrollY || window.pageYOffset || 0;
  if (navbar) navbar.classList.toggle('scrolled', y > 60);
  if (scrollTopBtn) scrollTopBtn.classList.toggle('show', y > 300);
  navScrollTicking = false;
}

window.addEventListener('scroll', function() {
  if (!navScrollTicking) {
    navScrollTicking = true;
    requestAnimationFrame(updateNavOnScroll);
  }
}, { passive: true });
updateNavOnScroll();

// HAMBURGER
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
  });
}

function closeMobile() {
  if (hamburger) hamburger.classList.remove('active');
  if (mobileMenu) mobileMenu.classList.remove('open');
}
window.closeMobile = closeMobile;

// Gdy uzytkownik zmienia orientacje / szerokosc ekranu, nie zostawiamy otwartego menu.
window.addEventListener('resize', () => {
  if (window.innerWidth > 960) closeMobile();
});

  // INTERSECTION OBSERVER
  const cards = document.querySelectorAll('.service-card, .machine-card');
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        const idx = [...cards].indexOf(e.target);
        e.target.style.animationDelay = `${(idx % 6) * 0.08}s`;
        e.target.classList.add('in-view');
      }
    });
  }, { threshold:0.15 });
  cards.forEach(c => cardObserver.observe(c));

  // Cities animation
  const cityItems = document.querySelectorAll('.city-item');
  const citiesObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      cityItems.forEach((item, i) => {
        setTimeout(() => item.classList.add('visible'), i * 250);
      });
    }
  }, { threshold:0.3 });
  const cl = document.getElementById('citiesList');
  if (cl) citiesObs.observe(cl);

  // ── COUNTER ANIMATION ──
  const counter = document.getElementById('counter12');
  let counterStarted = false;
  const counterObs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !counterStarted) {
      counterStarted = true;
      let start = 0; const end = 15; const duration = 1800;
      const step = duration / end;
      const timer = setInterval(() => {
        start++;
        counter.textContent = start;
        if (start >= end) clearInterval(timer);
      }, step);
    }
  }, { threshold: 0.5 });
  if (counter) counterObs.observe(counter);

  // ── LEAFLET MAP ──
  const mapEl = document.getElementById('serviceMap');
  if (mapEl) {
    const map = L.map('serviceMap', {
      center: [53.55, 22.85],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 14,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);



    // ── WOJ. PODLASKIE — obszar cofnięty do środka, bez zahaczania o Litwę i Białoruś ──
    const podlaskiePoly = [
  [
  
  [53.3993485619479, 23.68781840993384],
  [53.5859169843809, 23.62684717952402],
  [53.672902286070396, 23.596714657820158],
  [53.709860361535014, 23.584391314844957],
  [53.72808497148836, 23.585537021353215],
  [53.73696702056178, 23.583712364730616],
  [53.744078332766286, 23.58210082647713],
  [53.74543830974591, 23.579460953841362],
  [53.76012366631808, 23.560018447911435],
  [53.767578512968505, 23.548668510115895],
  [53.780332108039886, 23.54660711854948],
  [53.791755688870055, 23.544483756212237],
  [53.80133043437391, 23.544601417570828],
  [53.82243278093665, 23.54553693417124],
  [53.82763436924026, 23.54616281393541],
  [53.831756971319514, 23.550007330138488],
  [53.834782518830195, 23.547231018570592],
  [53.83621089614077, 23.548047191569218],
  [53.83826542420034, 23.55100489973705],
  [53.8409350803841, 23.551355563287444],
  [53.84319508102538, 23.547962501609792],
  [53.844531376466435, 23.545525425753432],
  [53.84689134005092, 23.545310469745687],
  [53.84883947390507, 23.546498846154964],
  [53.84914544329679, 23.550463641563645],
  [53.85109555552687, 23.55130235007466],
  [53.85253191925132, 23.550158039580168],
  [53.856121238757275, 23.547960540721046],
  [53.85695141702358, 23.535127657682565],
  [53.86259918053541, 23.523452369064593],
  [53.864721453878666, 23.524860573367448],
  [53.86448221620434, 23.526431328545918],
  [53.86670774005661, 23.525908263778646],
  [53.86848762231796, 23.525567359778872],
  [53.873349461623164, 23.523686174083835],
  [53.883584214931766, 23.520632564340293],
  [53.902828450763536, 23.51312228738294],
  [53.916523301843974, 23.51113198137064],
  [53.929859474215576, 23.510707405133044],
  [53.93633598977689, 23.51314787137813],
  [53.94301744367532, 23.513500796866104],
  [53.95617549318527, 23.51455490664079],
  [53.98839756441118, 23.481457769111714],
  [54.009435170738314, 23.488029024921396],
  [54.00587035646113, 23.498300141935307],
  [54.01123105239464, 23.508571258949218],
  [54.027631523376385, 23.515284922022428],
  [54.054685478004686, 23.524963496591575],
  [54.073639097777416, 23.521902829273547],
  [54.08569864971473, 23.51950980216921],
  [54.093359468880706, 23.511101083497685],
  [54.121666626591455, 23.492352470950962],
  [54.11766320156414, 23.363104035917303],
  [54.12260603233038, 23.14128816219869],
  [54.11687990775468, 22.879947542510337],
  [54.092093509639696, 22.87072599480897],
  [54.0679820316185, 22.890952880676696],
  [54.02107777018873, 22.889496474584696],
  [53.92660203041048, 22.772164610468096],
  [53.894489273994054, 22.70181758495073],
  [53.733255711860465, 22.682149240109055],
  [53.57288922037495, 22.88941342403899],
  [53.380157987163415, 23.04144602866529],
  [53.38857764708639, 23.480409150601957],
  [53.3993485619479, 23.68781840993384]

]
];

    const podlaskieArea = L.polygon(podlaskiePoly, {
      color: '#F5A623',
      weight: 2,
      fillColor: '#F5A623',
      fillOpacity: 0.14,
      dashArray: '7,5',
      smoothFactor: 1.5,
      interactive: false
    }).addTo(map);

    map.fitBounds(podlaskieArea.getBounds(), {
      padding: [24, 24]
    });

    // Custom pulsing icon for main HQ
    const pulseIcon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:32px;height:32px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(245,166,35,0.3);animation:mapPulse 2s ease-out infinite;"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:#F5A623;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
      </div>`,
      iconSize: [32,32], iconAnchor: [16,16]
    });

    const cityIcon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;border-radius:50%;background:#F5A623;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.4);"></div>',
      iconSize: [14,14], iconAnchor: [7,7]
    });

    // Main marker
    // Na telefonach i tabletach nie pokazujemy karty popup nad bazą.
    const isTouchLayout = window.matchMedia('(max-width: 960px)').matches;
    const mainPopup = `<div style="font-family:Oswald,sans-serif;padding:6px 2px;">
      <div style="font-size:1rem;font-weight:700;color:#F5A623;">🏭 ŻWIROWNIA SKIEBLEWO</div>
      <div style="font-size:0.78rem;color:#333;margin-top:4px;">P.U.H. DROGMET · Lipsk</div>
      <div style="font-size:0.75rem;color:#666;margin-top:2px;">ul. Złobikowskiego 3A, 16-315 Lipsk</div>
      <a href="tel:784103957" style="display:block;margin-top:8px;background:#F5A623;color:#1e1e1e;padding:5px 10px;text-align:center;text-decoration:none;font-weight:700;font-size:0.82rem;border-radius:3px;">📞 784 103 957</a>
    </div>`;

    const mainMarker = L.marker([53.7581, 23.4215], { icon: pulseIcon })
      .addTo(map);

    if (!isTouchLayout) {
      mainMarker
        .bindPopup(mainPopup, { maxWidth: 220 })
        .openPopup();
    }

    // City markers
    const cities = [
      { name: 'Augustów', coords: [53.8447, 23.0027], dist: '~50 km' },
      { name: 'Suwałki', coords: [54.0993, 22.9365], dist: '~75 km' },
      { name: 'Dąbrowa Białostocka', coords: [53.6623, 23.3470], dist: '~35 km' },
      { name: 'Sokółka', coords: [53.4027, 23.5033], dist: '~60 km' },
      { name: 'Suchowola', coords: [53.5883, 23.0611], dist: '~20 km' }
    ];

    cities.forEach(c => {
      // Punkty miast są tylko wizualne — bez popupów i bez klikalności.
      L.marker(c.coords, { icon: cityIcon, interactive: false })
        .addTo(map);

      // Draw line from HQ to city
      L.polyline([[53.7581, 23.4215], c.coords], {
        color: 'rgba(245,166,35,0.45)',
        weight: 2,
        dashArray: '8,6',
        interactive: false
      }).addTo(map);
    });

    // Attribution
    L.control.attribution({ prefix: false, position: 'bottomright' })
      .addAttribution('© OpenStreetMap · © CartoDB')
      .addTo(map);
  }

  // -- ANCHOR SCROLL --
  function getTargetScrollY(target) {
    const targetTop = target.getBoundingClientRect().top + getPageY();
    return clampScrollY(targetTop - getNavOffset());
  }

  function smoothScrollTo(target) {
    if (typeof target === 'number') {
      scrollToY(target);
      return;
    }

    if (target && target.getBoundingClientRect) {
      scrollToY(getTargetScrollY(target));
    }
  }
  window.smoothScrollTo = smoothScrollTo;

  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      const href = a.getAttribute('href');

      if (!href || href === '#') {
        e.preventDefault();
        closeMobile();
        smoothScrollTop();
        return;
      }

      let id = href.slice(1);
      try { id = decodeURIComponent(id); } catch (err) {}

      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      closeMobile();

      // Wait two frames so the mobile menu starts closing before measuring the section position.
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          smoothScrollTo(target);
        });
      });

      // Keep the URL useful without triggering the browser's instant hash jump.
      if (history.pushState) {
        history.pushState(null, '', '#' + id);
      }
    });
  });

  // FORM submit - Formspree
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formStatus = document.getElementById('formStatus');

  function setFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.style.color = type === 'success' ? '#27ae60' : '#c0392b';
    formStatus.style.fontWeight = '700';
  }

  function resetSubmitButton() {
    if (!submitBtn) return;
    submitBtn.textContent = 'Wyślij zapytanie →';
    submitBtn.style.background = '';
    submitBtn.style.color = '';
    submitBtn.disabled = false;
  }

  if (form && submitBtn) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const endpoint = form.getAttribute('action');

      if (!endpoint || endpoint.includes('TWOJ_FORM_ID')) {
        setFormStatus('Najpierw wklej swój endpoint z Formspree w atrybucie action formularza.', 'error');
        return;
      }

      submitBtn.textContent = 'Wysyłanie...';
      submitBtn.style.background = '#888';
      submitBtn.disabled = true;
      setFormStatus('', '');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          submitBtn.textContent = '✓ Wysłano!';
          submitBtn.style.background = '#27ae60';
          submitBtn.style.color = '#fff';
          setFormStatus('Dziękujemy. Wiadomość została wysłana.', 'success');
          form.reset();

          setTimeout(resetSubmitButton, 3500);
          return;
        }

        let errorMessage = 'Nie udało się wysłać formularza. Spróbuj ponownie albo zadzwoń.';
        try {
          const data = await response.json();
          if (data && data.errors && data.errors.length) {
            errorMessage = data.errors.map(function(error) {
              return error.message;
            }).join(' ');
          }
        } catch (err) {}

        setFormStatus(errorMessage, 'error');
        resetSubmitButton();
      } catch (err) {
        setFormStatus('Brak połączenia albo błąd formularza. Spróbuj ponownie.', 'error');
        resetSubmitButton();
      }
    });
  }

// ================================================================
//  GALERIA v3 — mobile/tablet: kategorie startują zwinięte do 4 zdjęć
// ================================================================

(function() {
  'use strict';

  var grid       = document.getElementById('galleryGrid');
  var toggleBtn  = document.getElementById('galleryToggleBtn');
  var filterBtns = document.querySelectorAll('.gf-btn');
  var isExpanded = false;
  var currentFilter = 'all';
  var MOBILE_QUERY = '(max-width: 960px)';
  var MOBILE_LIMIT = 4;

  if (!grid) return;

  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));

  function isMobileTablet() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function getMatchingItems() {
    return galleryItems.filter(function(item) {
      var cat = item.getAttribute('data-cat');
      return currentFilter === 'all' || cat === currentFilter;
    });
  }

  function animateItems(items) {
    items.forEach(function(item, i) {
      if (!item.classList.contains('gi-visible')) {
        item.style.animationDelay = ((i % 10) * 0.05) + 's';
        item.classList.add('gi-visible');
      }
    });
  }

  function updateToggle(matchingCount, mobile) {
    if (!toggleBtn) return;
    var toggleWrap = toggleBtn.parentElement;

    if (mobile) {
      // Na telefonach/tabletach przycisk pojawia się tylko wtedy,
      // gdy w danej kategorii faktycznie jest więcej niż 4 zdjęcia.
      if (matchingCount <= MOBILE_LIMIT) {
        toggleBtn.style.display = 'none';
        if (toggleWrap) toggleWrap.style.display = 'none';
        toggleBtn.classList.remove('expanded');
        return;
      }

      if (toggleWrap) toggleWrap.style.display = 'flex';
      toggleBtn.style.display = 'inline-flex';
      toggleBtn.querySelector('.gt-label').textContent = isExpanded ? 'Pokaż mniej' : 'Pokaż więcej';
      toggleBtn.classList.toggle('expanded', isExpanded);
      return;
    }

    // Desktop zostaje bez zasady limitu 4 zdjęć.
    if (toggleWrap) toggleWrap.style.display = 'flex';
    toggleBtn.style.display = 'inline-flex';
    toggleBtn.querySelector('.gt-label').textContent = isExpanded ? 'Pokaż mniej' : 'Pokaż wszystkie zdjęcia';
    toggleBtn.classList.toggle('expanded', isExpanded);
  }

  function applyGalleryState(shouldAnimate) {
    var mobile = isMobileTablet();
    var matching = getMatchingItems();

    grid.classList.toggle('gallery-mobile-mode', mobile);
    grid.classList.toggle('collapsed', !isExpanded);

    galleryItems.forEach(function(item) {
      var cat = item.getAttribute('data-cat');
      var matches = currentFilter === 'all' || cat === currentFilter;

      item.classList.toggle('gi-hidden', !matches);
      item.classList.remove('mobile-limit-hidden');
    });

    if (mobile && !isExpanded) {
      matching.forEach(function(item, index) {
        if (index >= MOBILE_LIMIT) item.classList.add('mobile-limit-hidden');
      });
    }

    updateToggle(matching.length, mobile);

    if (shouldAnimate) {
      var visible = matching.filter(function(item) {
        return !item.classList.contains('mobile-limit-hidden');
      });
      visible.forEach(function(item, i) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(14px) scale(0.97)';
        item.style.animationDelay = (i * 0.05) + 's';
        item.classList.remove('gi-visible');
        void item.offsetWidth;
        item.classList.add('gi-visible');
      });
    }

    rebuildVisibleList();
  }

  // ── INTERSECTION OBSERVER dla kafli ──
  if (galleryItems.length) {
    var giObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el  = entry.target;
          var idx = parseInt(el.getAttribute('data-index') || '0');
          el.style.animationDelay = (idx % 10 * 0.05) + 's';
          el.classList.add('gi-visible');
          giObserver.unobserve(el);
        }
      });
    }, { threshold: 0.08 });
    galleryItems.forEach(function(item) { giObserver.observe(item); });
  }

  // ── PRZYCISK POKAŻ WIĘCEJ / MNIEJ ──
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      isExpanded = !isExpanded;
      applyGalleryState(true);

      if (!isExpanded) {
        var section = document.getElementById('galeria');
        if (section) smoothScrollTo(section);
      }
    });
  }

  // ── FILTRY ──
  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      currentFilter = btn.getAttribute('data-filter') || 'all';

      // TYLKO mobile/tablet: każda zmiana kategorii zwija zdjęcia do 4.
      // Desktop zachowuje dotychczasowe wygodne rozwijanie kategorii.
      isExpanded = !isMobileTablet();

      applyGalleryState(true);
    });
  });

  // ── LIGHTBOX ──
  var lbOverlay = document.getElementById('lbOverlay');
  var lbImg     = document.getElementById('lbImg');
  var lbCaption = document.getElementById('lbCaption');
  var lbCounter = document.getElementById('lbCounter');
  var lbClose   = document.getElementById('lbClose');
  var lbPrev    = document.getElementById('lbPrev');
  var lbNext    = document.getElementById('lbNext');
  var visibleItems = [];
  var currentIdx   = 0;

  function rebuildVisibleList() {
    visibleItems = [];
    grid.querySelectorAll('.gallery-item:not(.gi-hidden):not(.mobile-limit-hidden)').forEach(function(item) {
      visibleItems.push(item);
    });
  }

  function openLightbox(item) {
    rebuildVisibleList();
    var pos = visibleItems.indexOf(item);
    currentIdx = pos >= 0 ? pos : 0;
    showLbSlide(currentIdx, false);
    lbOverlay.classList.add('lb-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lbOverlay.classList.remove('lb-open');
    document.body.style.overflow = '';
  }

  function showLbSlide(idx, animate) {
    var item = visibleItems[idx];
    if (!item) return;
    var imgEl = item.querySelector('img');
    var txtEl = item.querySelector('.gallery-ov-txt');
    if (animate !== false) {
      lbImg.style.opacity = '0';
      lbImg.style.transform = 'scale(0.92)';
    }
    lbImg.src = imgEl ? imgEl.src : '';
    lbImg.alt = imgEl ? (imgEl.alt || '') : '';
    lbCaption.textContent = txtEl ? txtEl.textContent : '';
    lbCounter.textContent = (idx + 1) + ' / ' + visibleItems.length;
    setTimeout(function() {
      lbImg.style.opacity = '';
      lbImg.style.transform = '';
    }, 20);
  }

  function lbGoPrev() {
    if (!visibleItems.length) return;
    currentIdx = (currentIdx - 1 + visibleItems.length) % visibleItems.length;
    showLbSlide(currentIdx, true);
  }

  function lbGoNext() {
    if (!visibleItems.length) return;
    currentIdx = (currentIdx + 1) % visibleItems.length;
    showLbSlide(currentIdx, true);
  }

  grid.addEventListener('click', function(e) {
    var item = e.target.closest('.gallery-item');
    if (item && !item.classList.contains('gi-hidden') && !item.classList.contains('mobile-limit-hidden')) {
      openLightbox(item);
    }
  });

  if (lbClose)  lbClose.addEventListener('click', closeLightbox);
  if (lbPrev)   lbPrev.addEventListener('click', lbGoPrev);
  if (lbNext)   lbNext.addEventListener('click', lbGoNext);

  if (lbOverlay) {
    lbOverlay.addEventListener('click', function(e) {
      if (e.target === lbOverlay) closeLightbox();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (!lbOverlay || !lbOverlay.classList.contains('lb-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  lbGoPrev();
    if (e.key === 'ArrowRight') lbGoNext();
  });

  var touchStartX = 0, touchStartY = 0;
  if (lbOverlay) {
    lbOverlay.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    lbOverlay.addEventListener('touchend', function(e) {
      if (!lbOverlay.classList.contains('lb-open')) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
        if (dx > 0) lbGoPrev(); else lbGoNext();
      }
    }, { passive: true });
  }

  var resizeTimer;
  var lastMobileState = isMobileTablet();
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      var nowMobile = isMobileTablet();
      if (nowMobile !== lastMobileState) {
        // Po wejściu na mobile/tablet resetujemy kategorię do zwiniętego widoku.
        isExpanded = !nowMobile;
        lastMobileState = nowMobile;
      }
      applyGalleryState(false);
    }, 120);
  });

  // Start: mobile/tablet zwinięte do 4, desktop standardowo zwinięty jak wcześniej.
  isExpanded = false;
  applyGalleryState(false);

})();
