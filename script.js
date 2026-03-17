/* ============================================================
   VOLTRIDE — Global JavaScript
   ============================================================ */

'use strict';

// ── Cursor ──────────────────────────────────────────────────
(function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });
  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));
  document.querySelectorAll('a, button, [data-hover]').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
  });
})();

// ── Nav scroll shrink ────────────────────────────────────────
(function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Active link
  const links = nav.querySelectorAll('.nav-links a');
  links.forEach(a => {
    if (a.getAttribute('href') === window.location.pathname.split('/').pop()) {
      a.classList.add('active');
    }
  });
})();

// ── Mobile menu ──────────────────────────────────────────────
function openMobileMenu() {
  document.getElementById('mobileMenu')?.classList.add('open');
}
function closeMobileMenu() {
  document.getElementById('mobileMenu')?.classList.remove('open');
}

// ── Cart ─────────────────────────────────────────────────────
const VoltCart = (() => {
  let items = JSON.parse(localStorage.getItem('voltride_cart') || '[]');

  function save() { localStorage.setItem('voltride_cart', JSON.stringify(items)); }

  function get() { return [...items]; }

  function count() { return items.reduce((s, i) => s + i.qty, 0); }

  function total() { return items.reduce((s, i) => s + i.price * i.qty, 0); }

  function add(name, price, color = 'var(--volt)', emoji = '⚡') {
    const idx = items.findIndex(i => i.name === name);
    if (idx > -1) { items[idx].qty++; }
    else { items.push({ name, price, qty: 1, color, emoji }); }
    save(); render(); updateBadge();
  }

  function remove(index) {
    items.splice(index, 1);
    save(); render(); updateBadge();
  }

  function changeQty(index, delta) {
    items[index].qty += delta;
    if (items[index].qty < 1) { items.splice(index, 1); }
    save(); render(); updateBadge();
  }

  function clear() { items = []; save(); render(); updateBadge(); }

  function updateBadge() {
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = count();
  }

  function render() {
    const body = document.getElementById('cartBody');
    if (!body) return;
    if (items.length === 0) {
      body.innerHTML = '<p class="cart-empty">Your cart is empty.<br><small>Start adding some bikes ⚡</small></p>';
    } else {
      body.innerHTML = items.map((item, i) => `
        <div class="cart-item">
          <div class="cart-item-thumb" style="color:${item.color}">${item.emoji}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="VoltCart.changeQty(${i}, -1)">−</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" onclick="VoltCart.changeQty(${i}, 1)">+</button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="VoltCart.remove(${i})">✕</button>
        </div>
      `).join('');
    }
    // total
    const tp = document.getElementById('cartTotal');
    if (tp) tp.textContent = '₹' + total().toLocaleString('en-IN');
  }

  function init() { updateBadge(); render(); }

  return { get, count, total, add, remove, changeQty, clear, render, init, save };
})();

// ── Cart drawer ──────────────────────────────────────────────
function openCart() {
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartDrawer')?.classList.add('open');
}
function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
}
function goToCartPage() {
  window.location.href = 'cart.html';
}
function checkout() {
  if (VoltCart.count() === 0) { showToast('Your cart is empty!'); return; }
  showToast('Redirecting to payment... ⚡');
  setTimeout(() => alert('Integrate your payment gateway here (Razorpay, Stripe, PayU)'), 1500);
}

// ── Toast ────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 2800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// ── Newsletter ───────────────────────────────────────────────
function subscribe(inputId = 'nlEmail') {
  const input = document.getElementById(inputId);
  if (!input) return;
  const val = input.value.trim();
  if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
    showToast('⚠️ Enter a valid email address');
    return;
  }
  input.value = '';
  showToast('✓ Subscribed! Welcome to VoltRide.');
}

// ── Scroll reveal ────────────────────────────────────────────
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();

// ── Filters (bikes page) ─────────────────────────────────────
function initFilters() {
  const chips = document.querySelectorAll('.filter-chip[data-filter]');
  const cards = document.querySelectorAll('.product-card[data-category]');
  const countEl = document.getElementById('filterCount');

  function updateCount() {
    const visible = [...cards].filter(c => c.style.display !== 'none').length;
    if (countEl) countEl.textContent = `${visible} bikes`;
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.filter;
      cards.forEach(card => {
        card.style.display = (f === 'all' || card.dataset.category === f) ? '' : 'none';
      });
      updateCount();
    });
  });
  updateCount();
}

// ── Tabs ─────────────────────────────────────────────────────
function initTabs() {
  const tabs = document.querySelectorAll('[data-tab-btn]');
  const panels = document.querySelectorAll('[data-tab-panel]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.querySelector(`[data-tab-panel="${tab.dataset.tabBtn}"]`);
      if (target) target.classList.add('active');
    });
  });
}

// ── Image Gallery (product page) ────────────────────────────
function initGallery() {
  const thumbs = document.querySelectorAll('.gallery-thumb');
  const main   = document.getElementById('galleryMain');
  if (!thumbs.length || !main) return;
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      main.innerHTML = thumb.innerHTML;
    });
  });
}

// ── Range slider ─────────────────────────────────────────────
function initRangeSliders() {
  document.querySelectorAll('input[type="range"][data-output]').forEach(range => {
    const out = document.getElementById(range.dataset.output);
    if (!out) return;
    range.addEventListener('input', () => { out.textContent = range.value; });
  });
}

// ── Counter animation ────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    let current  = 0;
    const step   = Math.ceil(target / 50);
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString('en-IN') + suffix;
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

// ── Contact form validation ──────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach(input => {
      const err = input.parentElement.querySelector('.form-error');
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

// ── Accordion ────────────────────────────────────────────────
function initAccordions() {
  document.querySelectorAll('.accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('open');
      // close all
      document.querySelectorAll('.accordion-item').forEach(i => {
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

// ── Init on DOM ready ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  VoltCart.init();
  initFilters();
  initTabs();
  initGallery();
  initRangeSliders();
  initContactForm();
  initAccordions();
});
