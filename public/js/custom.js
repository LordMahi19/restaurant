let ingredients = [];
let drinks = [];
let selectedToppings = new Set();
let selectedDrinks = {}; // id -> qty
let currentSizePrice = 8;
let currentSize = 'small';

document.addEventListener('DOMContentLoaded', () => {
    fetchIngredients();
    fetchDrinks(); // From menu items
    setupSizeListeners();
});

async function fetchIngredients() {
    try {
        const res = await fetch('/api/ingredients');
        ingredients = await res.json();

        // Populate Dips and Sauces
        const dips = ingredients.filter(i => i.type === 'dip');
        const sauces = ingredients.filter(i => i.type === 'sauce'); // Sauce selector logic

        const dipSelect = document.getElementById('dip-selector');
        dips.forEach(dip => {
            const opt = document.createElement('option');
            opt.value = dip.id;
            opt.textContent = `${dip.name} (+$${dip.price.toFixed(2)})`;
            opt.dataset.price = dip.price;
            dipSelect.appendChild(opt);
        });
        dipSelect.addEventListener('change', updatePrice);

        const sauceSelect = document.getElementById('sauce-selector');
        sauces.forEach(sauce => {
            const opt = document.createElement('option');
            opt.value = sauce.id;
            opt.textContent = `${sauce.name} (+$${sauce.price.toFixed(2)})`;
            opt.dataset.price = sauce.price;
            sauceSelect.appendChild(opt);
        });
        sauceSelect.addEventListener('change', updatePrice);

    } catch (err) { console.error(err); }
}

async function fetchDrinks() {
    try {
        const res = await fetch('/api/menu');
        const allItems = await res.json();
        drinks = allItems.filter(i => i.category === 'drinks');
        renderDrinksPopup();
    } catch (err) { console.error(err); }
}

function setupSizeListeners() {
    const radios = document.querySelectorAll('input[name="size"]');
    radios.forEach(r => {
        r.addEventListener('change', (e) => {
            currentSizePrice = parseFloat(e.target.dataset.price);
            currentSize = e.target.value;
            updatePrice();
        });
    });
}

function showToppingsByCategory() {
    const category = document.getElementById('topping-category').value;
    const list = document.getElementById('toppings-list');
    list.innerHTML = '';

    if (!category) return; // clear if none

    const filtered = ingredients.filter(i => i.type === category);

    filtered.forEach(ing => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>
                <input type="checkbox" value="${ing.id}" data-price="${ing.price}" onchange="toggleTopping(this, '${ing.name}', ${ing.price})"> 
                ${ing.name} (+$${ing.price.toFixed(2)})
            </label>
        `;
        // Check if already selected
        if (selectedToppings.has(ing.id)) {
            div.querySelector('input').checked = true;
        }
        list.appendChild(div);
    });
}

function toggleTopping(checkbox, name, price) {
    const id = parseInt(checkbox.value);
    if (checkbox.checked) {
        selectedToppings.add(id);
    } else {
        selectedToppings.delete(id);
    }
    updatePrice();
}

function renderDrinksPopup() {
    const container = document.getElementById('drinks-list-popup');
    container.innerHTML = drinks.map(drink => `
        <div class="drink-item">
            <div style="display:flex; align-items:center;">
                <img src="${drink.image_url}" style="width:40px; height:40px; border-radius:4px; margin-right:10px;">
                <span>${drink.name} ($${drink.price.toFixed(2)})</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="changeDrinkQty(${drink.id}, -1)">-</button>
                <span id="qty-${drink.id}">0</span>
                <button onclick="changeDrinkQty(${drink.id}, 1)">+</button>
            </div>
        </div>
    `).join('');
}

function changeDrinkQty(id, delta) {
    if (!selectedDrinks[id]) selectedDrinks[id] = 0;
    selectedDrinks[id] += delta;
    if (selectedDrinks[id] < 0) selectedDrinks[id] = 0;

    document.getElementById(`qty-${id}`).textContent = selectedDrinks[id];
    updatePrice();
}

function openDrinksPopup() {
    document.getElementById('drinks-popup').classList.add('active');
}
function closeDrinksPopup() {
    document.getElementById('drinks-popup').classList.remove('active');
}

function updatePrice() {
    let total = currentSizePrice;

    // Toppings
    // We need to find prices for all selected toppings in global set.
    // Since we only query by category, we need to lookup price from master list 'ingredients'.
    selectedToppings.forEach(id => {
        const ing = ingredients.find(i => i.id === id);
        if (ing) total += ing.price;
    });

    // Drinks
    Object.keys(selectedDrinks).forEach(id => {
        const qty = selectedDrinks[id];
        const drink = drinks.find(d => d.id == id);
        if (drink) total += drink.price * qty;
    });

    // Dip
    const dipSelect = document.getElementById('dip-selector');
    if (dipSelect.value) {
        const opt = dipSelect.options[dipSelect.selectedIndex];
        total += parseFloat(opt.dataset.price || 0);
    }

    // Sauce
    const sauceSelect = document.getElementById('sauce-selector');
    if (sauceSelect.value) {
        const opt = sauceSelect.options[sauceSelect.selectedIndex];
        total += parseFloat(opt.dataset.price || 0);
    }

    document.getElementById('total-price').textContent = total.toFixed(2);
    renderBreakdown();
}

function renderBreakdown() {
    // Optional: Show detailed list of selected items in UI
    const breakdown = document.getElementById('breakdown');
    let html = `<ul>`;
    html += `<li>Size: ${currentSize} ($${currentSizePrice.toFixed(2)})</li>`;

    selectedToppings.forEach(id => {
        const ing = ingredients.find(i => i.id === id);
        if (ing) html += `<li>${ing.name} ($${ing.price.toFixed(2)})</li>`;
    });

    Object.keys(selectedDrinks).forEach(id => {
        const qty = selectedDrinks[id];
        if (qty > 0) {
            const drink = drinks.find(d => d.id == id);
            html += `<li>${drink.name} x${qty} ($${(drink.price * qty).toFixed(2)})</li>`;
        }
    });

    // Dip/Sauce...
    html += `</ul>`;
    breakdown.innerHTML = html;
}

function addToCartCustom() {
    const total = parseFloat(document.getElementById('total-price').textContent);
    const details = {
        type: 'Custom Pizza',
        size: currentSize,
        toppings: Array.from(selectedToppings),
        drinks: selectedDrinks,
        dip: document.getElementById('dip-selector').value,
        sauce: document.getElementById('sauce-selector').value
    };

    // Use the main.js logic if possible, or simple fetch here
    // Since this is a separate page, we need to implement cart or persist it. 
    // For simplicity, we just send "Custom Pizza" as an order immediately?
    // "add to cart button". 
    // Usually websites use localStorage for Cart.
    // I didn't implement localStorage in main.js cart.
    // I'll use localStorage to share cart between pages.

    const item = {
        name: `Custom Pizza (${currentSize})`,
        price: total,
        details: details
    };

    let cart = JSON.parse(localStorage.getItem('restaurant_cart') || '[]');
    cart.push(item);
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));

    alert('Added to cart!');
    window.location.href = 'menu.html'; // Go back to menu to see cart
}
