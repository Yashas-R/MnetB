/* ============================================================
   VOLTRIDE — Global JavaScript
   ============================================================ */

'use strict';

/* ── Custom Cursor ─────────────────────────────────────────── */
(function initCursor() {
  var cursor = document.getElementById('cursor');
  if (!cursor) return;
  document.addEventListener('mousemove', function(e) {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });
  document.addEventListener('mousedown', function() { cursor.classList.add('clicking'); });
  document.addEventListener('mouseup',   function() { cursor.classList.remove('clicking'); });
  document.querySelectorAll('a, button').forEach(function(el) {
    el.addEventListener('mouseenter', function() { cursor.classList.add('hovered'); });
    el.addEventListener('mouseleave', function() { cursor.classList.remove('hovered'); });
  });
})();

/* ── Nav scroll shrink + active link ───────────────────────── */
(function initNav() {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
  var current = window.location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('.nav-links a').forEach(function(a) {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });
})();

/* ── Mobile menu ────────────────────────────────────────────── */
function openMobileMenu()  {
  var m = document.getElementById('mobileMenu');
  if (m) m.classList.add('open');
}
function closeMobileMenu() {
  var m = document.getElementById('mobileMenu');
  if (m) m.classList.remove('open');
}

/* ══════════════════════════════════════════════════════════════
   VOLTCART — localStorage cart engine shared across all pages
   Storage key: 'voltride_cart'  (array of {name,price,qty,color,emoji})
══════════════════════════════════════════════════════════════ */
var VoltCart = (function() {

  var KEY = 'voltride_cart';

  /* Read fresh from storage every time — avoids stale in-memory state */
  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e) { return []; }
  }

  function _save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  /* After any mutation: update badge + drawer + cart page table */
  function _sync() {
    _updateBadge();
    _renderDrawer();
    /* cart.html defines renderCartPage() — call it if present */
    if (typeof renderCartPage === 'function') renderCartPage();
  }

  /* Nav badge counter */
  function _updateBadge() {
    var el = document.getElementById('cartCount');
    if (el) el.textContent = count();
  }

  /* Slide-out drawer (on every page) */
  function _renderDrawer() {
    var body = document.getElementById('cartBody');
    if (!body) return;
    var items = _load();
    if (items.length === 0) {
      body.innerHTML = '<p class="cart-empty">Your cart is empty.<br><small>Start adding some bikes ⚡</small></p>';
    } else {
      body.innerHTML = items.map(function(item, i) {
        return '<div class="cart-item">' +
          '<div class="cart-item-thumb" style="color:' + item.color + '">' + item.emoji + '</div>' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">'  + item.name + '</div>' +
            '<div class="cart-item-price">₹' + (item.price * item.qty).toLocaleString('en-IN') + '</div>' +
            '<div class="cart-item-qty">' +
              '<button class="qty-btn" onclick="VoltCart.changeQty(' + i + ',-1)">−</button>' +
              '<span class="qty-val">' + item.qty + '</span>' +
              '<button class="qty-btn" onclick="VoltCart.changeQty(' + i + ',1)">+</button>' +
            '</div>' +
          '</div>' +
          '<button class="cart-item-remove" onclick="VoltCart.remove(' + i + ')">✕</button>' +
        '</div>';
      }).join('');
    }
    var tp = document.getElementById('cartTotal');
    if (tp) tp.textContent = '₹' + total().toLocaleString('en-IN');
  }

  /* ── Public API ── */

  function get()   { return _load(); }
  function count() { return _load().reduce(function(s,i){ return s + i.qty; }, 0); }
  function total() { return _load().reduce(function(s,i){ return s + i.price * i.qty; }, 0); }

  function add(name, price, color, emoji) {
    color = color || 'var(--volt)';
    emoji = emoji || '⚡';
    var items = _load();
    var idx   = -1;
    for (var x = 0; x < items.length; x++) {
      if (items[x].name === name) { idx = x; break; }
    }
    if (idx > -1) { items[idx].qty++; }
    else          { items.push({ name: name, price: price, qty: 1, color: color, emoji: emoji }); }
    _save(items);
    _sync();
  }

  function remove(index) {
    var items = _load();
    items.splice(index, 1);
    _save(items);
    _sync();
  }

  function changeQty(index, delta) {
    var items = _load();
    if (!items[index]) return;
    items[index].qty += delta;
    if (items[index].qty < 1) items.splice(index, 1);
    _save(items);
    _sync();
  }

  function clear() {
    _save([]);
    _sync();
  }

  function init() {
    _updateBadge();
    _renderDrawer();
  }

  return { get: get, count: count, total: total, add: add, remove: remove, changeQty: changeQty, clear: clear, init: init };

})();

/* ── Cart drawer open / close ───────────────────────────────── */
function openCart() {
  var o = document.getElementById('cartOverlay');
  var d = document.getElementById('cartDrawer');
  if (o) o.classList.add('open');
  if (d) d.classList.add('open');
}
function closeCart() {
  var o = document.getElementById('cartOverlay');
  var d = document.getElementById('cartDrawer');
  if (o) o.classList.remove('open');
  if (d) d.classList.remove('open');
}

/* ── Checkout drawer button → go to cart page ───────────────── */
function checkout() {
  if (VoltCart.count() === 0) { showToast('Your cart is empty!'); return; }
  window.location.href = 'cart.html';
}

/* ── Toast notification ─────────────────────────────────────── */
var _toastTimer = null;
function showToast(msg, duration) {
  duration = duration || 2800;
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { el.classList.remove('show'); }, duration);
}

/* ── Newsletter subscribe ───────────────────────────────────── */
function subscribe(inputId) {
  inputId = inputId || 'nlEmail';
  var input = document.getElementById(inputId);
  if (!input) return;
  var val = input.value.trim();
  if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
    showToast('⚠️ Enter a valid email address');
    return;
  }
  input.value = '';
  showToast('✓ Subscribed! Welcome to VoltRide.');
}

/* ── Scroll reveal ──────────────────────────────────────────── */
(function initReveal() {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(function(el) { obs.observe(el); });
})();

/* ── Filter chips — bikes.html ──────────────────────────────── */
function initFilters() {
  var chips   = document.querySelectorAll('.filter-chip[data-filter]');
  var cards   = document.querySelectorAll('.product-card[data-category]');
  var countEl = document.getElementById('filterCount');

  function updateCount() {
    var visible = Array.from(cards).filter(function(c) { return c.style.display !== 'none'; }).length;
    if (countEl) countEl.textContent = visible + ' bikes';
  }

  chips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      chips.forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      var f = chip.dataset.filter;
      cards.forEach(function(card) {
        card.style.display = (f === 'all' || card.dataset.category === f) ? '' : 'none';
      });
      updateCount();
    });
  });
  updateCount();
}

/* ── Tabs — index.html featured bikes ──────────────────────── */
function initTabs() {
  var tabs   = document.querySelectorAll('[data-tab-btn]');
  var panels = document.querySelectorAll('[data-tab-panel]');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var target = document.querySelector('[data-tab-panel="' + tab.dataset.tabBtn + '"]');
      if (target) target.classList.add('active');
    });
  });
}

/* ── Accordion — about.html FAQ ─────────────────────────────── */
function initAccordions() {
  document.querySelectorAll('.accordion-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item   = btn.closest('.accordion-item');
      var body   = item.querySelector('.accordion-body');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(function(i) {
        i.classList.remove('open');
        i.querySelector('.accordion-body').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/* ── Contact form — contact.html ────────────────────────────── */
function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var valid = true;
    form.querySelectorAll('[required]').forEach(function(input) {
      var err = input.parentElement.querySelector('.form-error');
      if (!input.value.trim()) {
        if (err) err.classList.add('show');
        valid = false;
      } else {
        if (err) err.classList.remove('show');
      }
    });
    if (valid) {
      showToast('✓ Message sent! We\'ll be in touch soon.');
      form.reset();
    }
  });
}

/* ── Initialise on DOM ready ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  VoltCart.init();
  initFilters();
  initTabs();
  initAccordions();
  initContactForm();
});
