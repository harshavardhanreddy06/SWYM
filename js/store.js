// js/store.js — Wishlist Storage & Business Logic
// All localStorage reads/writes + wishlist CRUD + merge logic
// Exposes everything via window.Store

(function () {

  const STORAGE_KEY = 'swym_wishlists';

  // ── Helpers ────────────────────────────────────────────────────

  function generateId() {
    return 'wl_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  function now() {
    return new Date().toISOString();
  }

  // ── Read / Write ───────────────────────────────────────────────

  function getWishlists() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[Store] Failed to read from localStorage', e);
      return [];
    }
  }

  function saveWishlists(lists) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch (e) {
      console.error('[Store] Failed to write to localStorage', e);
    }
  }

  function getWishlistById(id) {
    return getWishlists().find(l => l.id === id) || null;
  }

  // ── Wishlist CRUD ──────────────────────────────────────────────

  function createWishlist(name) {
    const lists = getWishlists();
    const newList = {
      id: generateId(),
      name: (name || '').trim() || 'My Wishlist',
      createdAt: now(),
      updatedAt: now(),
      items: [],
      isDefault: lists.length === 0   // first list auto-becomes default
    };
    lists.push(newList);
    saveWishlists(lists);
    return newList;
  }

  function deleteWishlist(id) {
    let lists = getWishlists();
    const target = lists.find(l => l.id === id);
    if (!target) return;
    const wasDefault = target.isDefault;
    lists = lists.filter(l => l.id !== id);
    // If the deleted list was default, promote the oldest remaining
    if (wasDefault && lists.length > 0) {
      lists.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      lists[0].isDefault = true;
    }
    saveWishlists(lists);
  }

  function renameWishlist(id, newName) {
    const lists = getWishlists();
    const list = lists.find(l => l.id === id);
    if (!list) return;
    list.name = (newName || '').trim() || list.name;
    list.updatedAt = now();
    saveWishlists(lists);
  }

  function setDefaultWishlist(id) {
    const lists = getWishlists();
    lists.forEach(l => { l.isDefault = (l.id === id); });
    saveWishlists(lists);
  }

  // When no list has isDefault:true (e.g. after an edge-case deletion),
  // mark lists[0] as default and persist it so the UI badge renders correctly.
  function getDefaultWishlist() {
    const lists = getWishlists();
    const found = lists.find(l => l.isDefault);
    if (found) return found;
    if (lists.length > 0) {
      lists[0].isDefault = true;   // ✅ persist so badge renders correctly
      saveWishlists(lists);
      return lists[0];
    }
    return null;
  }

  // ── Item CRUD ──────────────────────────────────────────────────

  function addItemToWishlist(listId, productId) {
    const lists = getWishlists();
    const list = lists.find(l => l.id === listId);
    if (!list) return false;
    // Guard: don't duplicate within same list
    if (list.items.some(i => i.productId === productId)) return false;
    list.items.push({
      productId,
      addedAt: now(),
      note: '',
      priority: 'medium'
    });
    list.updatedAt = now();
    saveWishlists(lists);
    return true;
  }

  function removeItemFromWishlist(listId, productId) {
    const lists = getWishlists();
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    list.items = list.items.filter(i => i.productId !== productId);
    list.updatedAt = now();
    saveWishlists(lists);
  }

  function updateItem(listId, productId, patch) {
    const lists = getWishlists();
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    const item = list.items.find(i => i.productId === productId);
    if (!item) return;
    Object.assign(item, patch);
    list.updatedAt = now();
    saveWishlists(lists);
  }

  // Returns array of list IDs (strings) that contain the given productId
  function getListsContainingProduct(productId) {
    return getWishlists()
      .filter(l => l.items.some(i => i.productId === productId))
      .map(l => l.id);   // ✅ fixed: was .map(l => l) — returning objects not IDs
  }

  // ── Merge ──────────────────────────────────────────────────────

  /**
   * previewMerge — pure computation, no side effects.
   * Returns breakdown of what a merge would produce.
   */
  function previewMerge(idA, idB) {
    const listA = getWishlistById(idA);
    const listB = getWishlistById(idB);
    if (!listA || !listB) return null;

    const setA = new Set(listA.items.map(i => i.productId));
    const setB = new Set(listB.items.map(i => i.productId));

    const onlyInA = listA.items.filter(i => !setB.has(i.productId));
    const onlyInB = listB.items.filter(i => !setA.has(i.productId));
    const inBoth  = listA.items.filter(i =>  setB.has(i.productId));

    const totalUnique       = onlyInA.length + onlyInB.length + inBoth.length;
    const duplicatesResolved = inBoth.length;

    return { listA, listB, onlyInA, onlyInB, inBoth, totalUnique, duplicatesResolved };
  }

  /**
   * mergeWishlists — executes the merge and writes to localStorage.
   *
   * mode "into_a"   → merged result written into listA; listB untouched
   * mode "new_list" → new list created; both originals kept
   *
   * Tiebreaker spec: keep the item with the EARLIER addedAt (older intent wins).
   *
   * ── MISTAKE #2 planted here ──────────────────────────────────
   * Comparison is written as > instead of <
   * So the NEWER item wins instead of the OLDER one — opposite of spec.
   */
  function mergeWishlists(idA, idB, mode, newListName) {
    const lists   = getWishlists();
    const listA   = lists.find(l => l.id === idA);
    const listB   = lists.find(l => l.id === idB);
    if (!listA || !listB) return null;

    const combinedMap = new Map();

    // Seed map with all items from listA
    for (const item of listA.items) {
      combinedMap.set(item.productId, { ...item });
    }

    // Merge listB items in
    for (const item of listB.items) {
      if (combinedMap.has(item.productId)) {
        const existing = combinedMap.get(item.productId);

        // ✅ fixed: was > (kept newer), now < correctly keeps the OLDER item
        const winner = (item.addedAt < existing.addedAt)
          ? { ...item }
          : { ...existing };

        // Merge notes if both have content and they differ
        const noteA = (existing.note || '').trim();
        const noteB = (item.note     || '').trim();
        if (noteA && noteB && noteA !== noteB) {
          winner.note = noteA + ' / ' + noteB;
        } else {
          winner.note = noteA || noteB || '';
        }

        combinedMap.set(item.productId, winner);
      } else {
        combinedMap.set(item.productId, { ...item });
      }
    }

    // Sort merged result by addedAt ascending
    const mergedItems = [...combinedMap.values()]
      .sort((a, b) => a.addedAt.localeCompare(b.addedAt));

    const duplicatesResolved =
      listA.items.length + listB.items.length - mergedItems.length;

    if (mode === 'into_a') {
      listA.items     = mergedItems;
      listA.updatedAt = now();
      saveWishlists(lists);
      return { targetListId: listA.id, duplicatesResolved };
    }

    if (mode === 'new_list') {
      const name = (newListName || `${listA.name} + ${listB.name}`).trim();
      const newList = {
        id: generateId(),
        name,
        createdAt: now(),
        updatedAt: now(),
        items: mergedItems,
        isDefault: false
      };
      lists.push(newList);
      saveWishlists(lists);
      return { targetListId: newList.id, duplicatesResolved };
    }

    return null;
  }

  // ── Public API ─────────────────────────────────────────────────

  window.Store = {
    // Read
    getWishlists,
    getWishlistById,
    getDefaultWishlist,
    // Wishlist CRUD
    createWishlist,
    deleteWishlist,
    renameWishlist,
    setDefaultWishlist,
    // Item CRUD
    addItemToWishlist,
    removeItemFromWishlist,
    updateItem,
    getListsContainingProduct,
    // Merge
    previewMerge,
    mergeWishlists
  };

})();
