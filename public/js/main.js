let allItems = [];
let activeFilters = new Set();
let cart = JSON.parse(localStorage.getItem('restaurant_cart') || '[]');
let categories = [];
let allTags = [];

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        fetchCategories(),
        fetchTags()
    ]);
    fetchMenu();
    updateCartUI(); // Update UI immediately
});

async function fetchTags() {
    try {
        const res = await fetch('/api/tags');
        allTags = await res.json();
        renderFilters();
    } catch (err) {
        console.error('Failed to load tags', err);
    }
}

function renderFilters() {
    const container = document.getElementById('filters-container');
    if (!container) return;
    container.innerHTML = '';

    allTags.forEach(tagObj => {
        const filter = tagObj.name;
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (activeFilters.has(filter) ? ' active' : '');
        btn.dataset.filter = filter;
        btn.textContent = capitalize(filter);
        btn.onclick = () => toggleFilter(filter);
        container.appendChild(btn);
    });
}

async function fetchMenu() {
    try {
        const res = await fetch('/api/menu');
        allItems = await res.json();
        renderMenu();
    } catch (err) {
        console.error('Failed to load menu', err);
    }
}

async function fetchCategories() {
    try {
        const res = await fetch('/api/categories');
        categories = (await res.json()).map(c => c.name);
    } catch (err) {
        console.error('Failed to load categories', err);
    }
}

function toggleFilter(filter) {
    if (activeFilters.has(filter)) {
        activeFilters.delete(filter);
        document.querySelector(`button[data-filter="${filter}"]`).classList.remove('active');
    } else {
        activeFilters.add(filter);
        document.querySelector(`button[data-filter="${filter}"]`).classList.add('active');
    }
    renderMenu();
}

function renderMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return; // Exit if not on menu page
    container.innerHTML = '';

    categories.forEach(category => {
        // Filter items for this category
        const catItems = allItems.filter(item => {
            if (item.category !== category) return false;
            if (activeFilters.size === 0) return true;
            // distinct tags in DB are comma separated e.g. "beef, spicy"
            // check if item tags intersect with active filters
            const tags = item.tags ? item.tags.split(',').map(t => t.trim()) : [];
            return tags.some(tag => activeFilters.has(tag));
        });

        // Even if empty, instructions say "dropdown menu for...". 
        // We can show it empty or hide. I'll show it but it will be empty if filtered out.
        // Actually, if filtered out, maybe hide the category? 
        // I'll keep the category header but content wil be empty or "No items".

        const section = document.createElement('div');
        section.className = 'category-section';
        section.id = `cat-${category}`;

        const isOpen = false; // Default closed

        section.innerHTML = `
            <div class="category-header" onclick="toggleCategory('${category}')">
                <h2>${capitalize(category)} <span style="font-size: 0.8em; opacity: 0.7;">(${catItems.length})</span></h2>
                <span id="icon-${category}" class="icon">+</span>
            </div>
            <div class="category-content" id="content-${category}">
                ${catItems.map(item => createMenuItemCard(item)).join('')}
                ${catItems.length === 0 ? '<p style="padding: 10px;">No items match filters.</p>' : ''}
            </div>
        `;
        container.appendChild(section);
    });
}

function createMenuItemCard(item) {
    return `
        <div class="menu-item">
            <img src="${item.image_url || 'https://placehold.co/200x150'}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <div class="price">$${item.price.toFixed(2)}</div>
            <button class="btn" style="margin-top: 10px; font-size: 0.8rem;" onclick="addToCart(${item.id})">Add to Cart</button>
        </div>
    `;
}

function toggleCategory(category) {
    const section = document.getElementById(`cat-${category}`);
    const icon = document.getElementById(`icon-${category}`);
    section.classList.toggle('open');
    if (section.classList.contains('open')) {
        icon.textContent = '-';
    } else {
        icon.textContent = '+';
    }
}

function capitalize(s) {
    if (s === 'rulla') return 'Rolls';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Cart Logic (Basic In-Memory for demo)
function addToCart(itemId) {
    const item = allItems.find(i => i.id === itemId);
    if (item) {
        cart.push(item);
        localStorage.setItem('restaurant_cart', JSON.stringify(cart));
        updateCartUI();
        alert(`Added ${item.name} to cart!`);
    }
}

function updateCartUI() {
    const indicator = document.getElementById('cart-indicator');
    indicator.textContent = `Cart (${cart.length})`;

    // Update popup table
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = cart.map((item, index) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; align-items: center; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight: 600; color: var(--text-main);">${item.name}</span>
                <span style="font-size:0.85em; color: var(--accent-color); font-weight: 500;">$${item.price.toFixed(2)}</span>
            </div>
            <span style="cursor:pointer; color: #ff7675; font-size:1.5rem; line-height: 1;" onclick="removeFromCart(${index})">&times;</span>
        </div>
    `).join('');

    const total = cart.reduce((acc, item) => acc + item.price, 0);
    document.getElementById('cart-total').textContent = total.toFixed(2);
}

function toggleCart() {
    const popup = document.getElementById('cart-popup');
    popup.classList.toggle('active');
}

function checkout() {
    if (cart.length === 0) return alert("Cart is empty");

    // Close Cart when opening checkout
    toggleCart();

    // Open Modal
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'none';
}

function toggleAddress(show) {
    const el = document.getElementById('address-field');
    const input = document.getElementById('cust-address');
    if (show) {
        el.style.display = 'block';
        input.required = true;
    } else {
        el.style.display = 'none';
        input.required = false;
    }
}

function submitOrder(e) {
    e.preventDefault();
    if (cart.length === 0) return alert("Cart is empty");

    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const address = document.getElementById('cust-address').value;
    const note = document.getElementById('cust-note').value;
    const orderType = document.querySelector('input[name="orderType"]:checked').value;

    const customer = { name, phone, address, note, type: orderType };

    // Send order to backend
    // Logic: backend will recalculate price, but we send our calc just in case (ignored by secure backend)
    const total = cart.reduce((acc, item) => acc + item.price, 0);

    fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details: cart, totalPrice: total, customer })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Redirect to success page
                cart = [];
                localStorage.setItem('restaurant_cart', '[]');
                updateCartUI();
                closeCheckoutModal();
                toggleCart(); // Close cart popup
                window.location.href = `order-success.html?id=${data.orderId}`;
            } else {
                alert("Failed to place order.");
            }
        });
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
    updateCartUI();
}
