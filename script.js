/* Shared main.js for index, shop, deals, contact pages
   - loads data/products.json
   - renders featured items (index), shop grid (shop), deals (deals)
   - shared modal for product details
   - simple add-to-cart (localStorage) + toast
   - mobile menu toggle
*/

const DATA_URL = '/data/products.json'; // adjust if your folder structure differs

document.addEventListener('DOMContentLoaded', () => {
  // footer years
  const yearElems = document.querySelectorAll('#year, #year-shop, #year-deals, #year-contact');
  yearElems.forEach(el => el && (el.textContent = new Date().getFullYear()));

  // mobile menu toggle (common button ids across pages)
  ['mobile-menu-btn','mobile-menu-btn-2','mobile-menu-btn-3','mobile-menu-btn-4'].forEach(id=>{
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        // simple visual toggle: show alert or implement real mobile nav if desired
        alert('Mobile menu toggle — replace with your preferred mobile nav.');
      });
    }
  });

  // load products and then render depending on page
  fetchProducts().then(products => {
    const path = location.pathname.split('/').pop() || 'index.html';
    if (path === 'index.html' || path === '') {
      renderFeatured(products);
    } else if (path === 'shop.html') {
      renderShop(products);
    } else if (path === 'deals.html') {
      renderDeals(products);
    } else if (path === 'contact.html') {
      // nothing product-specific to render
    }
    // update cart count from localStorage
    updateCartCount();
  }).catch(err => {
    console.error('Failed to fetch products:', err);
  });

  // Modal close handlers (single shared modal id variants)
  setupModalHandlers();
});

// Fetch products JSON
async function fetchProducts() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Could not load products.json');
  const json = await res.json();
  return json.products;
}

/* ------------------ INDEX ------------------ */
function renderFeatured(products) {
  // pick first 6 featured (or first 6 items)
  const featured = products.slice(0, 6);
  const container = document.getElementById('featured-grid');
  if (!container) return;
  container.innerHTML = featured.map(p => featuredCardHTML(p)).join('');
  // attach click listeners
  container.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(btn.dataset.id);
      const prod = products.find(x=>x.id===id);
      if (prod) openModal(prod);
    });
  });
  container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => addToCartById(btn.dataset.id));
  });
}

function featuredCardHTML(p) {
  return `
    <div class="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-lg">
      <div class="h-48 overflow-hidden bg-gray-100">
        <img src="${p.images[0]}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover">
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-lg mb-1">${escapeHtml(p.name)}</h3>
        <p class="text-green-600 font-bold">KES ${numberWithCommas(p.price)}</p>
        <p class="text-sm text-gray-600 mt-2 line-clamp-2">${escapeHtml(p.description)}</p>
        <div class="mt-3 flex gap-2">
          <button class="add-to-cart-btn bg-yellow-400 text-black px-3 py-2 rounded font-semibold" data-id="${p.id}">Add to Cart</button>
          <button class="view-details-btn bg-white/10 text-white px-3 py-2 rounded" data-id="${p.id}">Details</button>
        </div>
      </div>
    </div>
  `;
}

/* ------------------ SHOP ------------------ */
function renderShop(products) {
  const shopGrid = document.getElementById('shop-grid');
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sort');
  const filterCategory = document.getElementById('filter-category');

  if (!shopGrid) return;

  // initial render
  function renderList(list) {
    shopGrid.innerHTML = list.map(p => shopCardHTML(p)).join('');
    attachShopButtons(list);
  }

  renderList(products);

  // search
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // sort
  if (sortSelect) {
    sortSelect.addEventListener('change', applyFilters);
  }

  // category filter
  if (filterCategory) {
    filterCategory.addEventListener('change', applyFilters);
  }

  function applyFilters() {
    let filtered = [...products];
    const q = (searchInput && searchInput.value.trim().toLowerCase()) || '';
    const category = (filterCategory && filterCategory.value) || 'all';
    const sort = (sortSelect && sortSelect.value) || 'default';

    if (q) {
      filtered = filtered.filter(p => (p.name + ' ' + p.brand + ' ' + p.description).toLowerCase().includes(q));
    }
    if (category !== 'all') filtered = filtered.filter(p => p.category === category);

    if (sort === 'price-asc') filtered.sort((a,b)=>a.price-b.price);
    if (sort === 'price-desc') filtered.sort((a,b)=>b.price-a.price);
    if (sort === 'name-asc') filtered.sort((a,b)=>a.name.localeCompare(b.name));

    renderList(filtered);
  }
}

function shopCardHTML(p) {
  return `
    <div class="bg-white text-gray-900 rounded-2xl shadow-lg overflow-hidden">
      <div class="h-48 overflow-hidden bg-gray-100">
        <img src="${p.images[0]}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover">
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-lg mb-1">${escapeHtml(p.name)}</h3>
        <p class="text-green-600 font-bold">KES ${numberWithCommas(p.price)}</p>
        <p class="text-sm text-gray-600 mt-2 line-clamp-2">${escapeHtml(p.description)}</p>
        <div class="mt-3 flex gap-2">
          <button class="add-to-cart-btn bg-yellow-400 text-black px-3 py-2 rounded font-semibold" data-id="${p.id}">Add to Cart</button>
          <button class="view-details-btn bg-white/10 text-white px-3 py-2 rounded" data-id="${p.id}">Details</button>
        </div>
      </div>
    </div>
  `;
}

function attachShopButtons(list) {
  // view details
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const prod = list.find(x=>x.id===id) || null;
      if (prod) openModal(prod);
    });
  });
  // add to cart
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => addToCartById(btn.dataset.id));
  });
}

/* ------------------ DEALS ------------------ */
function renderDeals(products) {
  const deals = products.filter(p=>p.deal === true);
  const container = document.getElementById('deals-grid');
  if (!container) return;
  if (deals.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center text-gray-300">No deals available right now.</div>`;
    return;
  }
  container.innerHTML = deals.map(p => shopCardHTML(p)).join('');
  attachShopButtons(deals);
}

/* ------------------ Modal ------------------ */
function setupModalHandlers() {
  // generic modal elements
  const modal = document.getElementById('product-modal') || document.getElementById('product-modal-shop') || document.getElementById('product-modal-deals');
  const modalClose = document.getElementById('modal-close') || document.getElementById('modal-close-shop') || document.getElementById('modal-close-deals');

  // These modal elements are duplicated per page; we use whichever exists
  if (modal && modalClose) {
    modalClose.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }
}

function openModal(product) {
  // find which page's modal elements exist
  const pages = [
    {wrap: 'product-modal', title: 'modal-title', images: 'modal-images', info: 'modal-info', close: 'modal-close'},
    {wrap: 'product-modal-shop', title: 'modal-title-shop', images: 'modal-images-shop', info: 'modal-info-shop', close: 'modal-close-shop'},
    {wrap: 'product-modal-deals', title: 'modal-title-deals', images: 'modal-images-deals', info: 'modal-info-deals', close: 'modal-close-deals'}
  ];

  const found = pages.find(p => document.getElementById(p.wrap));
  if (!found) return;
  const wrap = document.getElementById(found.wrap);
  const titleEl = document.getElementById(found.title);
  const imagesEl = document.getElementById(found.images);
  const infoEl = document.getElementById(found.info);

  titleEl.textContent = `${product.name}`;
  imagesEl.innerHTML = product.images.map(src => `<img src="${src}" class="w-full rounded">`).join('');
  infoEl.innerHTML = `
    <p class="text-2xl font-bold text-green-600">KES ${numberWithCommas(product.price)}</p>
    <p><strong>Brand:</strong> ${escapeHtml(product.brand)}</p>
    <p><strong>Condition:</strong> ${escapeHtml(product.condition || 'Refurbished')}</p>
    <p class="mt-2 text-gray-700">${escapeHtml(product.description)}</p>
    ${product.specifications && product.specifications.length ? `<div class="mt-3"><p class="font-semibold">Specifications</p><ul class="list-disc list-inside text-gray-700">${product.specifications.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul></div>` : ''}
    <div class="mt-4 flex gap-2">
      <button class="buy-now-btn bg-blue-600 text-white px-4 py-2 rounded" data-id="${product.id}">Buy Now</button>
      <button class="add-to-cart-btn bg-yellow-400 text-black px-4 py-2 rounded" data-id="${product.id}">Add to Cart</button>
    </div>
  `;
  // attach buttons inside modal
  infoEl.querySelectorAll('.add-to-cart-btn').forEach(b=>b.addEventListener('click', ()=>addToCartById(b.dataset.id)));
  infoEl.querySelectorAll('.buy-now-btn').forEach(b=>b.addEventListener('click', ()=>{ addToCartById(b.dataset.id); alert('Proceed to checkout — not implemented in demo.'); }));

  wrap.classList.remove('hidden');
}

/* ------------------ Cart (simple localStorage) ------------------ */
function addToCartById(id) {
  const pid = parseInt(id);
  fetchProducts().then(products => {
    const prod = products.find(p=>p.id===pid);
    if(!prod) return;
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const exists = cart.find(i=>i.id===pid);
    if (exists) exists.qty += 1;
    else cart.push({ id: pid, name: prod.name, price: prod.price, qty: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast(`${prod.name} added to cart`);
    updateCartCount();
  }).catch(err => console.error(err));
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((s,i)=>s + (i.qty||1), 0);
  const el = document.getElementById('cart-count') || document.getElementById('cart-count-2') || document.getElementById('cart-count-3') || document.getElementById('cart-count-4') || document.getElementById('cart-count');
  if (el) el.textContent = count;
  // also top-right variant on index
  const idx = document.getElementById('cart-count');
  if(idx) idx.textContent = count;
}

function showToast(msg, duration = 2200) {
  const t = document.createElement('div');
  t.className = 'fixed top-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), duration);
}

/* ------------------ Utilities ------------------ */
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
