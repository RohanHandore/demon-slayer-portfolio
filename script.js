/* rohanhandore.com — site behaviour.
   Small and deliberate: navigation, scroll reveal, the contact form and the
   blog filters. No effects for the sake of effects, and no third-party script
   is fetched until the contact form is actually used. */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var Motion = window.Motion || null;
  var EASE = [0.16, 1, 0.3, 1];

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initReveal();
    initHeroIntro();
    initIntroVideo();
    initIdCard();
    initMilestoneRail();
    initScrollProgress();
    initNavOnScroll();
    initCardPointer();
    initSmoothScroll();
    initContactForm();
    initBlogFilters();
    initBlogCards();
    initPhotoView();
    initEmailJS();
  });

  /* ------------------------------------------------------------ navigation */
  function initNavigation() {
    var navbar = document.querySelector('.navbar');
    var toggle = document.querySelector('.hamburger');
    var menu = document.querySelector('.nav-menu');
    if (!navbar || !toggle || !menu) return;

    function setOpen(open) {
      navbar.classList.toggle('is-open', open);
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      setOpen(!navbar.classList.contains('is-open'));
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });

    // Highlight the section currently in view.
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-menu .nav-link[href^="#"]'));
    var sections = links
      .map(function (link) { return document.querySelector(link.getAttribute('href')); })
      .filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      var current = null;
      sections.forEach(function (section) {
        if (current === null && visible.has(section.id)) current = section.id;
      });
      links.forEach(function (link) {
        var isActive = current !== null && link.getAttribute('href') === '#' + current;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---------------------------------------------------------- scroll reveal */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (item) { observer.observe(item); });
  }

  /* -------------------------------------------------- hero entrance (Motion) */
  function initHeroIntro() {
    var items = document.querySelectorAll('[data-reveal="hero"]');
    if (!items.length) return;
    if (reducedMotion || !Motion || !Motion.animate) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    items.forEach(function (el, i) {
      el.classList.add('is-visible');
      Motion.animate(
        el,
        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0px)'] },
        { duration: 0.75, delay: 0.04 + i * 0.085, ease: EASE }
      );
    });
  }

  /* ------------------------------------------------- scroll progress (Motion) */
  function initScrollProgress() {
    var rail = document.getElementById('scrollProgress');
    if (!rail) return;
    if (reducedMotion) { rail.style.display = 'none'; return; }

    if (Motion && Motion.scroll && Motion.animate) {
      try {
        Motion.scroll(
          Motion.animate(rail, { scaleX: [0, 1] }, { ease: 'linear' }),
          { offset: ['start start', 'end end'] }
        );
        return;
      } catch (error) { /* fall back below */ }
    }

    var update = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      rail.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* --------------------------------------- nav hides on the way down, returns */
  function initNavOnScroll() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;
    var last = window.scrollY;
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY;
        navbar.classList.toggle('nav-compact', y > 40);
        if (!navbar.classList.contains('is-open')) {
          navbar.classList.toggle('nav-hidden', y > last && y > 420);
        }
        last = y;
        queued = false;
      });
    }, { passive: true });
  }

  /* ------------------------------------ cursor-tracked wash behind card copy */
  function initCardPointer() {
    if (reducedMotion) return;
    document.addEventListener('pointermove', function (event) {
      var card = event.target.closest('.card, .job, .post');
      if (!card) return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 100) + '%');
      card.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 100) + '%');
    }, { passive: true });
  }

  /* -------------------------------------------------------- smooth scrolling */
  function initSmoothScroll() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  }

  /* --------------------------------------------------------- contact form */
  var EMAILJS = {
    publicKey: '2_8uMrBuH0mkkl-cZ',
    serviceID: 'service_g3ep51n',
    templateID: 'template_3elsi69',
    src: 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
  };
  var emailjsLoading = null;

  function loadEmailJS() {
    if (window.emailjs) return Promise.resolve(window.emailjs);
    if (emailjsLoading) return emailjsLoading;
    emailjsLoading = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = EMAILJS.src;
      script.async = true;
      script.onload = function () {
        try { window.emailjs.init(EMAILJS.publicKey); } catch (err) { /* already set up */ }
        resolve(window.emailjs);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return emailjsLoading;
  }

  // The library is only useful to a visitor who is going to write a message,
  // so it is fetched when they first touch the form rather than on every page.
  function initEmailJS() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var trigger = function () { loadEmailJS().catch(function () {}); };
    form.addEventListener('focusin', trigger, { once: true });
    form.addEventListener('pointerdown', trigger, { once: true });
    window.addEventListener('load', function () {
      if ('requestIdleCallback' in window) requestIdleCallback(trigger, { timeout: 3000 });
      else setTimeout(trigger, 2000);
    });
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      var name = (form.elements.name.value || '').trim();
      var email = (form.elements.email.value || '').trim();
      var message = (form.elements.message.value || '').trim();

      if (!name || !email || !message) {
        notify('Please fill in every field.', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        notify('That email address does not look right.', 'error');
        return;
      }

      var original = button.textContent;
      button.disabled = true;
      button.textContent = 'Sending...';

      var fallback = 'mailto:rohanhandore021@gmail.com'
        + '?subject=' + encodeURIComponent('Portfolio enquiry from ' + name)
        + '&body=' + encodeURIComponent(message + '\n\nFrom: ' + name + ' <' + email + '>');

      loadEmailJS()
        .then(function (lib) {
          return lib.send(EMAILJS.serviceID, EMAILJS.templateID, {
            title: 'Portfolio contact',
            subject: 'New contact form submission',
            from_name: name,
            from_email: email,
            message: message
          });
        })
        .then(function () {
          notify('Message sent. I will come back to you soon.', 'success');
          form.reset();
        })
        .catch(function () {
          // Never let a failed send swallow the visitor's message: hand them a
          // prefilled mailto instead of an apology.
          notify('That did not send. Email me directly:', 'error', fallback, 'rohanhandore021@gmail.com');
        })
        .then(function () {
          button.disabled = false;
          button.textContent = original;
        });
    });
  }

  /* ------------------------------------------------------------- blog list */
  function initBlogFilters() {
    var filters = document.querySelectorAll('.category-filter');
    var items = document.querySelectorAll('.blog-posts-container .blog-item, .blog-grid .blog-item');
    if (!filters.length || !items.length) return;

    filters.forEach(function (filter) {
      filter.addEventListener('click', function () {
        var category = filter.getAttribute('data-category');
        filters.forEach(function (other) {
          var active = other === filter;
          other.classList.toggle('active', active);
          other.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        items.forEach(function (item) {
          var match = category === 'all' || item.getAttribute('data-category') === category;
          item.hidden = !match;
        });
      });
    });
  }

  function initBlogCards() {
    document.querySelectorAll('.blog-item').forEach(function (item) {
      var link = item.querySelector('.blog-read-more');
      if (!link) return;
      item.addEventListener('click', function (event) {
        if (event.target.closest('a')) return;
        link.click();
      });
    });
  }

  /* --------------------------------------------------------- photo viewer */
  // The nav avatar opens the full photograph in a lightbox. The trigger stays a
  // real link to the image, so with JS off (or a new-tab click) the photo still
  // opens on its own.
  function initPhotoView() {
    var triggers = document.querySelectorAll('[data-photo-view]');
    if (!triggers.length) return;

    var overlay = null;
    var image = null;
    var closeBtn = null;
    var lastFocus = null;
    var closeTimer = null;

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'photo-view';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Profile photo');
      overlay.hidden = true;

      var frame = document.createElement('figure');
      frame.className = 'photo-view-frame';

      image = document.createElement('img');
      image.className = 'photo-view-img';
      image.alt = '';
      image.decoding = 'async';
      frame.appendChild(image);

      var caption = document.createElement('figcaption');
      caption.className = 'photo-view-caption';
      caption.textContent = 'Rohan Handore';
      frame.appendChild(caption);

      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'photo-view-close';
      closeBtn.setAttribute('aria-label', 'Close photo');
      closeBtn.innerHTML = '&times;';

      overlay.appendChild(frame);
      overlay.appendChild(closeBtn);
      document.body.appendChild(overlay);

      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) close();
      });
      closeBtn.addEventListener('click', close);
      document.addEventListener('keydown', function (event) {
        if (!overlay.hidden && event.key === 'Escape') close();
      });
    }

    function open(src, alt) {
      if (!overlay) build();
      if (closeTimer) { window.clearTimeout(closeTimer); closeTimer = null; }
      lastFocus = document.activeElement;
      image.setAttribute('src', src);
      image.setAttribute('alt', alt || 'Rohan Handore');
      overlay.hidden = false;
      document.documentElement.classList.add('is-photo-open');
      void overlay.offsetWidth; // let the browser see the un-hidden state first
      overlay.classList.add('is-open');
      closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('is-open');
      document.documentElement.classList.remove('is-photo-open');
      var done = function () {
        overlay.hidden = true;
        image.removeAttribute('src');
      };
      if (reducedMotion) done();
      else closeTimer = window.setTimeout(done, 300);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    Array.prototype.forEach.call(triggers, function (trigger) {
      trigger.addEventListener('click', function (event) {
        // Let modified and middle clicks behave like the plain link they are.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        var thumb = trigger.querySelector('img');
        open(trigger.getAttribute('data-photo-view'), thumb ? thumb.getAttribute('alt') : '');
      });
    });
  }

  /* ------------------------------------------------------- thirty second intro
     The recording plays itself on arrival, muted, and never announces itself
     when there is no file to play: the placeholder in the markup stands in. */
  function initIntroVideo() {
    var media = document.getElementById('introMedia');
    var video = document.getElementById('introVideo');
    var button = document.getElementById('introSound');
    if (!media || !video) return;

    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var thrifty = !!(connection && (connection.saveData ||
      /(^|-)2g$/.test(connection.effectiveType || '')));
    var autoPlay = !reducedMotion && !thrifty;

    function label(text, pressed) {
      if (!button) return;
      button.textContent = text;
      button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    }

    function start(muted) {
      video.muted = muted;
      var attempt = video.play();
      if (attempt && attempt.catch) attempt.catch(function () { /* blocked: the poster stays */ });
      label(muted ? 'Sound on' : 'Sound off', !muted);
    }

    video.addEventListener('canplay', function () {
      media.classList.add('is-live');
      label(autoPlay && !video.paused ? 'Sound on' : 'Play intro', false);
    });

    // No file yet, or a broken one: leave the placeholder alone.
    video.addEventListener('error', function () { media.classList.remove('is-live'); });
    var source = video.querySelector('source');
    if (source) source.addEventListener('error', function () { media.classList.remove('is-live'); });

    if (autoPlay) start(true);

    if (button) {
      button.addEventListener('click', function () {
        if (video.paused || video.ended) { start(false); return; }
        video.muted = !video.muted;
        label(video.muted ? 'Sound on' : 'Sound off', !video.muted);
      });
    }

    // Do not leave a video running in a tab nobody is looking at.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            if (!video.paused) video.pause();
          } else if (autoPlay && video.paused) {
            start(true);
          }
        });
      }, { threshold: 0.2 }).observe(video);
    }
  }

  /* --------------------------------------------------------------- ID card */
  function initIdCard() {
    var card = document.getElementById('idcard');
    var button = document.getElementById('idcardFlip');
    var photo = document.getElementById('idcardPhoto');

    if (photo) {
      var img = photo.querySelector('img');
      if (img) {
        // The initials stand in only when there is no portrait to show, and
        // never while it is still downloading: hiding the image mid-flight
        // stops the browser fetching it at all.
        if (img.complete && !img.naturalWidth) photo.classList.add('is-empty');
        img.addEventListener('load', function () {
          if (img.naturalWidth) photo.classList.remove('is-empty');
        });
        img.addEventListener('error', function () { photo.classList.add('is-empty'); });
      }
    }

    if (!card || !button) return;
    button.addEventListener('click', function () {
      var flipped = card.classList.toggle('is-flipped');
      button.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    });
  }

  /* --------------------------------------------------------- milestone rail */
  function initMilestoneRail() {
    var rail = document.getElementById('milestoneRail');
    var prev = document.getElementById('railPrev');
    var next = document.getElementById('railNext');
    if (!rail || !prev || !next) return;

    function stepSize() {
      var card = rail.querySelector('.rail-card');
      return card ? card.getBoundingClientRect().width + 14 : rail.clientWidth * 0.8;
    }

    function update() {
      var max = rail.scrollWidth - rail.clientWidth - 1;
      prev.disabled = rail.scrollLeft <= 0;
      next.disabled = rail.scrollLeft >= max;
    }

    function nudge(direction) {
      rail.scrollBy({ left: direction * stepSize(), behavior: reducedMotion ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', function () { nudge(-1); });
    next.addEventListener('click', function () { nudge(1); });
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    rail.setAttribute('tabindex', '0');
    rail.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); nudge(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); nudge(-1); }
    });

    update();
  }

  /* --------------------------------------------------------- notifications */
  function notify(message, type, linkHref, linkText) {
    var existing = document.querySelector('.notification');
    if (existing) existing.remove();

    var box = document.createElement('div');
    box.className = 'notification notification-' + (type || 'info');
    box.setAttribute('role', type === 'error' ? 'alert' : 'status');

    var text = document.createElement('span');
    text.textContent = message;
    box.appendChild(text);

    if (linkHref) {
      var link = document.createElement('a');
      link.href = linkHref;
      link.textContent = linkText || linkHref;
      box.appendChild(link);
    }

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'notification-close';
    close.setAttribute('aria-label', 'Dismiss');
    close.innerHTML = '&times;';
    close.addEventListener('click', function () { box.remove(); });
    box.appendChild(close);

    document.body.appendChild(box);
    setTimeout(function () { if (box.parentNode) box.remove(); }, linkHref ? 25000 : 6000);
  }
})();
