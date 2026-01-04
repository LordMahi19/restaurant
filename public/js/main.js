let allItems = [];
let activeFilters = new Set();
let cart = JSON.parse(localStorage.getItem('restaurant_cart') || '[]');

document.addEventListener('DOMContentLoaded', () => {
    fetchMenu();
    updateCartUI(); // Update UI immediately
});

async function fetchMenu() {
    try {
        const res = await fetch('/api/menu');
        allItems = await res.json();
        renderMenu();
    } catch (err) {
        console.error('Failed to load menu', err);
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
                <span id="icon-${category}">+</span>
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
    cartItems.innerHTML = cart.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>${item.name}</span>
            <span>$${item.price.toFixed(2)}</span>
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

    // Send order to backend
    const total = cart.reduce((acc, item) => acc + item.price, 0);
    const details = JSON.stringify(cart);

    fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details, totalPrice: total })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Order placed! Order ID: " + data.orderId);
                cart = [];
                localStorage.setItem('restaurant_cart', '[]');
                updateCartUI();
                toggleCart();
            } else {
                alert("Failed to place order.");
            }
        });
}
