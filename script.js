/* rohanhandore.com — site behaviour.
   Small and deliberate: navigation, scroll reveal, the contact form and the
   blog filters. No effects for the sake of effects, and no third-party script
   is fetched until the contact form is actually used. */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initReveal();
    initSmoothScroll();
    initContactForm();
    initBlogFilters();
    initBlogCards();
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
