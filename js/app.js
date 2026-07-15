// js/app.js — Router, View Renderers, Event Handlers
// Depends on: window.PRODUCTS (data.js), window.Store (store.js)

(function () {
  'use strict';

  // ── App State ──────────────────────────────────────────────────
  let currentCategory = 'All';
  let currentSort     = 'featured';
  let searchQuery     = '';
  let searchDebounce  = null;

  // ── Utility: Stars ─────────────────────────────────────────────
  function getStars(rating) {
    const full  = Math.floor(rating);
    const half  = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  }

  // ── Utility: Format price ──────────────────────────────────────
  function fmt(n) {
    return '$' + n.toFixed(0);
  }

  // ── Utility: Navigate ──────────────────────────────────────────
  function navigate(hash) {
    window.location.hash = hash;
  }

  // ── Toast Notifications ────────────────────────────────────────
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ── Nav Badge ──────────────────────────────────────────────────
  function updateNavBadge() {
    const lists  = Store.getWishlists();
    const total  = lists.reduce((acc, l) => acc + l.items.length, 0);
    const badge  = document.getElementById('nav-badge');
    if (!badge) return;
    badge.textContent = total;
    badge.classList.toggle('hidden', total === 0);

    // Active state on nav links
    const hash = window.location.hash || '#shop';
    document.getElementById('nav-shop-link')
      ?.classList.toggle('active', hash === '#shop');
    document.getElementById('nav-wishlists-link')
      ?.classList.toggle('active', hash.startsWith('#wishlist'));
  }

  // ── Dark Mode ──────────────────────────────────────────────────
  function initDarkMode() {
    const saved = localStorage.getItem('swym_theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
    document.getElementById('dark-toggle')?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('swym_theme', isDark ? 'dark' : 'light');
      document.getElementById('dark-toggle').textContent = isDark ? '☀️' : '🌙';
    });
  }

  // ── Router ─────────────────────────────────────────────────────
  function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    updateNavBadge();
  }

  function router() {
    const hash = window.location.hash || '#shop';

    if (hash === '#shop' || hash === '') {
      showView('view-shop');
      renderShop();
    } else if (hash === '#wishlists') {
      showView('view-wishlists');
      renderWishlists();
    } else if (hash.startsWith('#wishlist/')) {
      const id = hash.replace('#wishlist/', '');
      showView('view-wishlist-detail');
      renderWishlistDetail(id);
    } else {
      // Unknown hash → default to shop
      showView('view-shop');
      renderShop();
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  VIEW: SHOP
  // ══════════════════════════════════════════════════════════════

  function renderShop() {
    let products = [...window.PRODUCTS];

    // Filter by category
    if (currentCategory !== 'All') {
      products = products.filter(p => p.category === currentCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q)   ||
        p.brand.toLowerCase().includes(q)  ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    if (currentSort === 'price-asc')  products.sort((a, b) => a.price - b.price);
    if (currentSort === 'price-desc') products.sort((a, b) => b.price - a.price);
    if (currentSort === 'rating')     products.sort((a, b) => b.rating - a.rating);
    // 'featured' → original order

    const grid = document.getElementById('product-grid');
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try a different search term or category.</p>
        </div>`;
      return;
    }

    grid.innerHTML = products.map(renderProductCard).join('');
    attachProductCardEvents();
  }

  function renderProductCard(product) {
    const inLists   = Store.getListsContainingProduct(product.id);
    const wishlisted = inLists.length > 0;
    const onSale     = product.price < product.originalPrice;
    const discount   = onSale
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

    return `
      <article class="product-card" data-product-id="${product.id}" id="card-${product.id}">
        ${!product.inStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ''}
        ${onSale ? `<span class="sale-badge">-${discount}%</span>` : ''}

        <button
          class="heart-btn ${wishlisted ? 'wishlisted' : ''}"
          id="heart-${product.id}"
          data-product-id="${product.id}"
          title="${wishlisted ? 'In your wishlist' : 'Add to wishlist'}"
          aria-label="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
        >${wishlisted ? '♥' : '♡'}</button>

        <img
          class="product-card-img"
          src="${product.imageUrl}"
          alt="${product.name}"
          loading="lazy"
        />

        <div class="product-card-body">
          <div class="product-brand">${product.brand}</div>
          <div class="product-name">${product.name}</div>
          <div class="product-description">${product.description}</div>

          <div class="product-price-row">
            <span class="product-price ${onSale ? 'sale' : ''}">${fmt(product.price)}</span>
            ${onSale ? `<span class="product-original-price">${fmt(product.originalPrice)}</span>` : ''}
          </div>

          <div class="product-rating">
            <span class="stars">${getStars(product.rating)}</span>
            <span>${product.rating} (${product.reviewCount})</span>
          </div>
        </div>
      </article>`;
  }

  function attachProductCardEvents() {
    document.querySelectorAll('.heart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const card = document.getElementById(`card-${productId}`);
        openAddDropdown(productId, card, btn);
      });
    });

    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', closeAllDropdowns, { once: true });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.add-dropdown').forEach(d => d.remove());
  }

  // ── Add-to-Wishlist Dropdown ───────────────────────────────────

  function openAddDropdown(productId, cardEl, heartBtn) {
    closeAllDropdowns();
    const lists   = Store.getWishlists();
    const inLists = Store.getListsContainingProduct(productId);

    // If no lists exist, open create modal first
    if (lists.length === 0) {
      openNewListModal((newList) => {
        Store.addItemToWishlist(newList.id, productId);
        showToast(`Added to "${newList.name}" ✨`);
        // ── BUG #1 planted here ──────────────────────────────
        // After adding, the heart button is NOT updated in the DOM.
        // heartBtn should get class 'wishlisted' and text '♥' here,
        // but we skip that update. The button stays hollow until refresh.
        updateNavBadge();
      });
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'add-dropdown';
    dropdown.id = `dropdown-${productId}`;

    const items = lists.map(list => {
      const checked = inLists.includes(list.id);
      return `
        <label class="add-dropdown-item" data-list-id="${list.id}">
          <input
            type="checkbox"
            data-list-id="${list.id}"
            data-product-id="${productId}"
            ${checked ? 'checked' : ''}
          />
          <span class="list-name">${list.name}</span>
          ${list.isDefault ? '<span class="default-tag">Default</span>' : ''}
        </label>`;
    }).join('');

    dropdown.innerHTML = `
      <div class="add-dropdown-header">Save to list</div>
      ${items}
      <div class="add-dropdown-divider"></div>
      <div class="add-dropdown-new" id="dropdown-new-${productId}">＋ New list</div>`;

    cardEl.appendChild(dropdown);

    // Checkbox toggle
    dropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const listId = cb.dataset.listId;
        if (cb.checked) {
          Store.addItemToWishlist(listId, productId);
          showToast(`Added to "${lists.find(l=>l.id===listId)?.name}" ✨`);
        } else {
          Store.removeItemFromWishlist(listId, productId);
          showToast(`Removed from list`, 'info');
        }
        // Fix Bug #1: re-check storage and update heart button immediately
        const nowInLists = Store.getListsContainingProduct(productId);
        const isWishlisted = nowInLists.length > 0;
        heartBtn.classList.toggle('wishlisted', isWishlisted);
        heartBtn.textContent = isWishlisted ? '\u2665' : '\u2661';
        heartBtn.title = isWishlisted ? 'In your wishlist' : 'Add to wishlist';
        updateNavBadge();
      });
    });

    // New list from dropdown
    document.getElementById(`dropdown-new-${productId}`)
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        openNewListModal((newList) => {
          Store.addItemToWishlist(newList.id, productId);
          showToast(`Added to "${newList.name}" ✨`);
          updateNavBadge();
        });
      });

    dropdown.addEventListener('click', e => e.stopPropagation());
  }

  // ══════════════════════════════════════════════════════════════
  //  VIEW: WISHLISTS
  // ══════════════════════════════════════════════════════════════

  function renderWishlists() {
    const lists = Store.getWishlists();
    const grid  = document.getElementById('wishlists-grid');
    if (!grid) return;

    // Merge button disabled if fewer than 2 lists
    const mergeBtn = document.getElementById('btn-merge-lists');
    if (mergeBtn) {
      mergeBtn.disabled = lists.length < 2;
      mergeBtn.title = lists.length < 2
        ? 'You need at least 2 lists to merge'
        : 'Combine two wishlists into one';
    }

    if (lists.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🤍</div>
          <h3>No wishlists yet</h3>
          <p>Create your first list to start saving products.</p>
          <button class="btn btn-primary" onclick="document.getElementById('btn-new-list').click()">
            ＋ Create a List
          </button>
        </div>`;
      return;
    }

    grid.innerHTML = lists.map(renderWishlistCard).join('');
    attachWishlistCardEvents();
  }

  function renderWishlistCard(list) {
    const previews = list.items.slice(0, 4).map(item => {
      const product = window.PRODUCTS.find(p => p.id === item.productId);
      return product
        ? `<img class="preview-thumb" src="${product.imageUrl}" alt="${product.name}" loading="lazy" />`
        : '';
    }).join('');

    const extra = list.items.length > 4
      ? `<div class="preview-more">+${list.items.length - 4}</div>` : '';

    const updated = new Date(list.updatedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });

    return `
      <div class="wishlist-card" data-list-id="${list.id}" id="wcard-${list.id}">
        <div class="wishlist-card-header">
          <div class="wishlist-card-name">${list.name}</div>
          ${list.isDefault ? '<span class="default-badge">Default</span>' : ''}
        </div>

        <div class="wishlist-card-meta">
          <span>${list.items.length} item${list.items.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>Updated ${updated}</span>
        </div>

        <div class="wishlist-card-preview">${previews}${extra}</div>

        <div class="wishlist-card-actions" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm wl-view"   data-id="${list.id}">View</button>
          <button class="btn btn-ghost btn-sm wl-rename" data-id="${list.id}">Rename</button>
          ${!list.isDefault
            ? `<button class="btn btn-ghost btn-sm wl-default" data-id="${list.id}">Set Default</button>`
            : ''}
          <button class="btn btn-danger btn-sm wl-delete" data-id="${list.id}">Delete</button>
        </div>
      </div>`;
  }

  function attachWishlistCardEvents() {
    // Card click → detail view
    document.querySelectorAll('.wishlist-card').forEach(card => {
      card.addEventListener('click', () => {
        navigate(`#wishlist/${card.dataset.listId}`);
      });
    });

    document.querySelectorAll('.wl-view').forEach(btn => {
      btn.addEventListener('click', () => navigate(`#wishlist/${btn.dataset.id}`));
    });

    document.querySelectorAll('.wl-rename').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = Store.getWishlistById(btn.dataset.id);
        const name = prompt('Rename list:', list?.name || '');
        if (name && name.trim()) {
          Store.renameWishlist(btn.dataset.id, name.trim());
          renderWishlists();
          showToast('List renamed ✏️');
        }
      });
    });

    document.querySelectorAll('.wl-default').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.setDefaultWishlist(btn.dataset.id);
        renderWishlists();
        showToast('Default list updated ⭐');
      });
    });

    document.querySelectorAll('.wl-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = Store.getWishlistById(btn.dataset.id);
        if (!confirm(`Delete "${list?.name}"? This cannot be undone.`)) return;
        Store.deleteWishlist(btn.dataset.id);
        renderWishlists();
        showToast('List deleted', 'info');
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  VIEW: WISHLIST DETAIL
  // ══════════════════════════════════════════════════════════════

  function renderWishlistDetail(listId) {
    const list = Store.getWishlistById(listId);
    if (!list) {
      navigate('#wishlists');
      return;
    }

    // Title input
    const titleInput = document.getElementById('detail-title-input');
    if (titleInput) {
      titleInput.value = list.name;
      titleInput.oninput = () => {
        clearTimeout(titleInput._debounce);
        titleInput._debounce = setTimeout(() => {
          Store.renameWishlist(listId, titleInput.value);
        }, 600);
      };
    }

    // Item count
    const countEl = document.getElementById('detail-item-count');
    if (countEl) {
      countEl.textContent = `${list.items.length} item${list.items.length !== 1 ? 's' : ''}`;
    }

    // Items list
    const itemsEl = document.getElementById('items-list');
    if (!itemsEl) return;

    if (list.items.length === 0) {
      itemsEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>This list is empty</h3>
          <p>Go to the shop and add products to this list.</p>
          <button class="btn btn-primary" onclick="navigate('#shop')">Browse Shop</button>
        </div>`;
      return;
    }

    itemsEl.innerHTML = list.items.map(item => {
      const product = window.PRODUCTS.find(p => p.id === item.productId);
      return product ? renderItemRow(item, product, listId) : '';
    }).join('');

    attachItemRowEvents(listId);
  }

  function renderItemRow(item, product, listId) {
    const onSale = product.price < product.originalPrice;
    const priorityLabels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };

    return `
      <div class="item-row" id="item-row-${product.id}" data-product-id="${product.id}">
        <img class="item-thumb" src="${product.imageUrl}" alt="${product.name}" loading="lazy" />

        <div class="item-info">
          <div class="item-brand">${product.brand}</div>
          <div class="item-name">${product.name}</div>
          <div class="item-price">
            ${fmt(product.price)}
            ${onSale ? `<span class="product-original-price" style="font-size:13px; margin-left:4px">${fmt(product.originalPrice)}</span>` : ''}
            ${!product.inStock ? '<span class="text-muted" style="font-size:12px; margin-left:6px">· Out of stock</span>' : ''}
          </div>
          <textarea
            class="item-note-input"
            id="note-${product.id}"
            data-product-id="${product.id}"
            data-list-id="${listId}"
            placeholder="Add a note (size, colour, occasion…)"
            rows="2"
          >${item.note || ''}</textarea>
        </div>

        <div class="item-actions">
          <span
            class="priority-badge ${item.priority}"
            id="priority-${product.id}"
            data-product-id="${product.id}"
            data-list-id="${listId}"
            data-priority="${item.priority}"
            title="Click to change priority"
          >${priorityLabels[item.priority] || '🟡 Medium'}</span>

          <button
            class="btn btn-danger btn-sm"
            data-product-id="${product.id}"
            data-list-id="${listId}"
            id="remove-${product.id}"
          >✕ Remove</button>
        </div>
      </div>`;
  }

  function attachItemRowEvents(listId) {
    // Note: debounced auto-save
    document.querySelectorAll('.item-note-input').forEach(ta => {
      ta.addEventListener('input', () => {
        clearTimeout(ta._debounce);
        ta._debounce = setTimeout(() => {
          Store.updateItem(ta.dataset.listId, ta.dataset.productId, { note: ta.value });
        }, 600);
      });
    });

    // Priority: click cycles high → medium → low → high
    const cycle = { high: 'medium', medium: 'low', low: 'high' };
    const labels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };

    document.querySelectorAll('.priority-badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const next = cycle[badge.dataset.priority] || 'medium';
        Store.updateItem(badge.dataset.listId, badge.dataset.productId, { priority: next });
        badge.dataset.priority = next;
        badge.className = `priority-badge ${next}`;
        badge.textContent = labels[next];
      });
    });

    // Remove item
    document.querySelectorAll('.item-actions .btn-danger').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.removeItemFromWishlist(btn.dataset.listId, btn.dataset.productId);
        document.getElementById(`item-row-${btn.dataset.productId}`)?.remove();
        // Update count
        const list = Store.getWishlistById(listId);
        const countEl = document.getElementById('detail-item-count');
        if (countEl && list) {
          countEl.textContent = `${list.items.length} item${list.items.length !== 1 ? 's' : ''}`;
        }
        showToast('Item removed', 'info');
        updateNavBadge();
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  MERGE MODAL
  // ══════════════════════════════════════════════════════════════

  function openMergeModal() {
    const overlay = document.getElementById('merge-modal-overlay');
    overlay?.classList.remove('hidden');
    populateMergeSelectA();
    document.getElementById('merge-preview')?.classList.add('hidden');
    document.getElementById('merge-mode-section')?.classList.add('hidden');
    document.getElementById('merge-confirm')?.classList.add('hidden');
    document.getElementById('merge-select-a').value = '';
    document.getElementById('merge-select-b').value = '';
  }

  function closeMergeModal() {
    document.getElementById('merge-modal-overlay')?.classList.add('hidden');
  }

  function populateMergeSelectA() {
    const lists = Store.getWishlists();
    const selA  = document.getElementById('merge-select-a');
    if (!selA) return;
    selA.innerHTML = '<option value="">— choose a list —</option>' +
      lists.map(l => `<option value="${l.id}">${l.name} (${l.items.length} items)</option>`).join('');
  }

  // Fix Bug #2: filter out selectedAId so same list can't be picked for both A and B
  function populateMergeSelectB(selectedAId) {
    const lists = Store.getWishlists().filter(l => l.id !== selectedAId);
    const selB  = document.getElementById('merge-select-b');
    if (!selB) return;
    selB.innerHTML = '<option value="">\u2014 choose a list \u2014</option>' +
      lists.map(l => `<option value="${l.id}">${l.name} (${l.items.length} items)</option>`).join('');
  }

  function updateMergePreview() {
    const idA = document.getElementById('merge-select-a')?.value;
    const idB = document.getElementById('merge-select-b')?.value;

    if (!idA || !idB) return;

    const preview = Store.previewMerge(idA, idB);
    if (!preview) return;

    document.getElementById('stat-total').textContent  = preview.totalUnique;
    document.getElementById('stat-dupes').textContent  = preview.duplicatesResolved;
    document.getElementById('stat-new').textContent    = preview.onlyInB.length;

    document.getElementById('group-a-label').textContent =
      `Only in ${preview.listA.name} (${preview.onlyInA.length})`;
    document.getElementById('group-b-label').textContent =
      `Only in ${preview.listB.name} (${preview.onlyInB.length})`;

    renderMergeThumbs(preview.onlyInA,  'group-only-a');
    renderMergeThumbs(preview.inBoth,   'group-in-both');
    renderMergeThumbs(preview.onlyInB,  'group-only-b');

    // Update "Merge into List A" label
    document.getElementById('mode-a-text').textContent =
      `Merge into "${preview.listA.name}"`;

    // Auto-fill new list name input
    document.getElementById('new-list-name-input').value =
      `${preview.listA.name} + ${preview.listB.name}`;

    document.getElementById('merge-preview')?.classList.remove('hidden');
    document.getElementById('merge-mode-section')?.classList.remove('hidden');
    document.getElementById('merge-confirm')?.classList.remove('hidden');
    document.getElementById('merge-confirm').disabled = false;
  }

  function renderMergeThumbs(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.slice(0, 5).map(item => {
      const product = window.PRODUCTS.find(p => p.id === item.productId);
      return product
        ? `<img class="merge-thumb" src="${product.imageUrl}" alt="${product.name}" title="${product.name}" loading="lazy" />`
        : '';
    }).join('');
  }

  function attachMergeModalEvents() {
    const selA = document.getElementById('merge-select-a');
    const selB = document.getElementById('merge-select-b');

    selA?.addEventListener('change', () => {
      populateMergeSelectB(selA.value);
      document.getElementById('merge-select-b').value = '';
      document.getElementById('merge-preview')?.classList.add('hidden');
      document.getElementById('merge-mode-section')?.classList.add('hidden');
      document.getElementById('merge-confirm')?.classList.add('hidden');
    });

    selB?.addEventListener('change', updateMergePreview);

    // Mode radio toggle
    document.querySelectorAll('input[name="merge-mode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        document.getElementById('new-list-name-wrap')
          ?.classList.toggle('visible', radio.value === 'new_list');
        document.querySelectorAll('.merge-mode-option').forEach(opt => {
          opt.classList.toggle('selected',
            opt.querySelector('input')?.value === radio.value);
        });
      });
    });

    // Confirm merge
    document.getElementById('merge-confirm')?.addEventListener('click', () => {
      const idA  = selA?.value;
      const idB  = selB?.value;
      const mode = document.querySelector('input[name="merge-mode"]:checked')?.value || 'into_a';
      const newName = document.getElementById('new-list-name-input')?.value?.trim();

      if (!idA || !idB) return;

      const result = Store.mergeWishlists(idA, idB, mode, newName || undefined);
      if (!result) return;

      closeMergeModal();
      showToast(`✨ Merged! ${result.duplicatesResolved} duplicate${result.duplicatesResolved !== 1 ? 's' : ''} resolved.`);
      navigate(`#wishlist/${result.targetListId}`);
    });

    // Close
    document.getElementById('merge-modal-close')?.addEventListener('click', closeMergeModal);
    document.getElementById('merge-cancel')?.addEventListener('click', closeMergeModal);
    document.getElementById('merge-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeMergeModal();
    });

    // Merge button on wishlists page
    document.getElementById('btn-merge-lists')?.addEventListener('click', openMergeModal);
  }

  // ══════════════════════════════════════════════════════════════
  //  NEW LIST MODAL
  // ══════════════════════════════════════════════════════════════

  let _newListCallback = null;

  function openNewListModal(onSuccess) {
    _newListCallback = onSuccess;
    const overlay = document.getElementById('new-list-modal-overlay');
    overlay?.classList.remove('hidden');
    const input = document.getElementById('new-list-name');
    if (input) { input.value = ''; setTimeout(() => input.focus(), 50); }
  }

  function closeNewListModal() {
    document.getElementById('new-list-modal-overlay')?.classList.add('hidden');
    _newListCallback = null;
  }

  function attachNewListModalEvents() {
    const confirm = () => {
      const name = document.getElementById('new-list-name')?.value?.trim();
      if (!name) return;
      const list = Store.createWishlist(name);
      closeNewListModal();
      if (_newListCallback) _newListCallback(list);
      showToast(`List "${list.name}" created 🎉`);
      if (window.location.hash === '#wishlists') renderWishlists();
    };

    document.getElementById('new-list-confirm')?.addEventListener('click', confirm);
    document.getElementById('new-list-cancel')?.addEventListener('click', closeNewListModal);
    document.getElementById('new-list-modal-close')?.addEventListener('click', closeNewListModal);

    // Enter key confirms
    document.getElementById('new-list-name')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirm();
    });

    // New list button on wishlists page
    document.getElementById('btn-new-list')?.addEventListener('click', () => {
      openNewListModal((list) => {
        renderWishlists();
        updateNavBadge();
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  SHOP FILTER & SORT EVENTS
  // ══════════════════════════════════════════════════════════════

  function attachShopEvents() {
    // Category pills
    document.getElementById('filter-pills')?.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.dataset.category;
      renderShop();
    });

    // Search
    document.getElementById('search-input')?.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        searchQuery = e.target.value;
        renderShop();
      }, 280);
    });

    // Sort
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderShop();
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════════════════════════

  function init() {
    initDarkMode();
    attachShopEvents();
    attachMergeModalEvents();
    attachNewListModalEvents();
    router();
  }

  window.addEventListener('hashchange', router);
  document.addEventListener('DOMContentLoaded', init);

  // Expose navigate globally (used in inline onclick in empty states)
  window.navigate = navigate;

})();
