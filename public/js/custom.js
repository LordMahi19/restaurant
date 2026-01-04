let ingredients = [];
let toppings = [];
let dips = [];
let sauces = [];
let drinks = [];

let selectedToppings = new Set();
let selectedDrinks = {}; // id -> qty
let selectedDips = {}; // id -> qty
let selectedSauces = {}; // id -> qty

let currentSizePrice = 8;
let currentSize = 'small';

document.addEventListener('DOMContentLoaded', () => {
    fetchIngredients();
    fetchDrinks();
    setupSizeListeners();
});

async function fetchIngredients() {
    try {
        const res = await fetch('/api/ingredients');
        const all = await res.json();
        ingredients = all;

        // Categorize
        toppings = all.filter(i => i.type !== 'dip' && i.type !== 'sauce');
        dips = all.filter(i => i.type === 'dip');
        sauces = all.filter(i => i.type === 'sauce');

        renderToppingsPopup();
        renderDipsPopup();
        renderSaucesPopup();

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

/* --- Render Functions --- */

function renderDrinksPopup() {
    renderGenericQtyPopup('drinks-list-popup', drinks, selectedDrinks, 'changeDrinkQty');
}

function renderDipsPopup() {
    renderGenericQtyPopup('dips-list-popup', dips, selectedDips, 'changeDipQty');
}

function renderSaucesPopup() {
    renderGenericQtyPopup('sauces-list-popup', sauces, selectedSauces, 'changeSauceQty');
}

function renderGenericQtyPopup(containerId, items, selectionObj, changeFnName) {
    const container = document.getElementById(containerId);
    if (!container) return; // Guard
    container.innerHTML = items.map(item => {
        const qty = selectionObj[item.id] || 0;
        const isActive = qty > 0;
        const img = item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : '';

        return `
        <div class="drink-item">
            <div class="drink-info">
                ${img}
                <div>
                    <div style="font-weight:600;">${item.name}</div>
                    <div style="font-size:0.9rem; color:var(--text-muted);">$${item.price.toFixed(2)}</div>
                </div>
            </div>
            <div class="qty-controls ${isActive ? 'active' : ''}" id="controls-${changeFnName}-${item.id}">
                <button class="qty-btn minus" onclick="${changeFnName}(${item.id}, -1)" 
                    style="${!isActive ? 'display:none' : ''}">-</button>
                <span class="qty-display" id="qty-${changeFnName}-${item.id}" 
                    style="${!isActive ? 'display:none' : ''}">${qty}</span>
                <button class="qty-btn plus" onclick="${changeFnName}(${item.id}, 1)">+</button>
            </div>
        </div>
    `}).join('');
}

function renderToppingsPopup() {
    const container = document.getElementById('toppings-list-popup');
    if (!container) return;

    container.innerHTML = toppings.map(item => {
        const isSelected = selectedToppings.has(item.id);

        return `
        <div class="drink-item" onclick="toggleTopping(${item.id})" style="cursor:pointer;">
            <div class="drink-info">
                <div>
                    <div style="font-weight:600;">${item.name}</div>
                    <div style="font-size:0.9rem; color:var(--text-muted);">$${item.price.toFixed(2)}</div>
                </div>
            </div>
            <div class="qty-controls ${isSelected ? 'active' : ''}" style="width: auto; height: auto; border-radius: 8px; padding: 5px 10px;">
                ${isSelected ? '<span style="color:var(--accent-color); font-weight:bold;">Selected</span>' : '<span style="font-size:1.2rem; color:var(--accent-color);">+</span>'}
            </div>
        </div>
    `}).join('');
}

/* --- Logic Functions --- */

function changeDrinkQty(id, delta) {
    changeGenericQty(id, delta, selectedDrinks, 'changeDrinkQty');
}

function changeDipQty(id, delta) {
    changeGenericQty(id, delta, selectedDips, 'changeDipQty');
}

function changeSauceQty(id, delta) {
    changeGenericQty(id, delta, selectedSauces, 'changeSauceQty');
}

function changeGenericQty(id, delta, selectionObj, fnName) {
    if (!selectionObj[id]) selectionObj[id] = 0;
    selectionObj[id] += delta;
    if (selectionObj[id] < 0) selectionObj[id] = 0;

    const qty = selectionObj[id];
    // Dom updates
    const qtySpan = document.getElementById(`qty-${fnName}-${id}`);
    const controlsDiv = document.getElementById(`controls-${fnName}-${id}`);

    if (qtySpan && controlsDiv) {
        const minusBtn = controlsDiv.querySelector('.minus');

        qtySpan.textContent = qty;
        if (qty > 0) {
            controlsDiv.classList.add('active');
            minusBtn.style.display = 'flex';
            qtySpan.style.display = 'block';
        } else {
            controlsDiv.classList.remove('active');
            minusBtn.style.display = 'none';
            qtySpan.style.display = 'none';
        }
    }
    updatePrice();
}

function toggleTopping(id) {
    if (selectedToppings.has(id)) {
        selectedToppings.delete(id);
    } else {
        selectedToppings.add(id);
    }
    renderToppingsPopup(); // Re-render to show state
    updatePrice();
}

/* --- Modal Toggles --- */

function openDrinksPopup() { document.getElementById('drinks-popup').style.display = 'flex'; }
function closeDrinksPopup() {
    document.getElementById('drinks-popup').style.display = 'none';
    renderSummary('selected-drinks-list', drinks, selectedDrinks);
}

function openToppingsPopup() { document.getElementById('toppings-popup').style.display = 'flex'; }
function closeToppingsPopup() {
    document.getElementById('toppings-popup').style.display = 'none';
    renderToppingsSummary();
}

function openDipsPopup() { document.getElementById('dips-popup').style.display = 'flex'; }
function closeDipsPopup() {
    document.getElementById('dips-popup').style.display = 'none';
    renderSummary('selected-dips-list', dips, selectedDips);
}

function openSaucesPopup() { document.getElementById('sauces-popup').style.display = 'flex'; }
function closeSaucesPopup() {
    document.getElementById('sauces-popup').style.display = 'none';
    renderSummary('selected-sauces-list', sauces, selectedSauces);
}

/* --- Summaries --- */

function renderSummary(elementId, itemsList, selectionObj) {
    const list = document.getElementById(elementId);
    if (!list) return;
    const items = [];
    Object.keys(selectionObj).forEach(id => {
        const qty = selectionObj[id];
        if (qty > 0) {
            const item = itemsList.find(i => i.id == id);
            if (item) items.push(`${item.name} x${qty}`);
        }
    });
    list.textContent = items.length ? items.join(', ') : '';
}

function renderToppingsSummary() {
    const list = document.getElementById('selected-toppings-list');
    if (!list) return;
    const items = [];
    selectedToppings.forEach(id => {
        const item = toppings.find(i => i.id == id);
        if (item) items.push(item.name);
    });
    list.textContent = items.length ? items.join(', ') : '';
}

/* --- Calculations --- */

function updatePrice() {
    let total = currentSizePrice;

    selectedToppings.forEach(id => {
        const item = toppings.find(i => i.id === id);
        if (item) total += item.price;
    });

    [selectedDrinks, selectedDips, selectedSauces].forEach((selection, idx) => {
        const source = [drinks, dips, sauces][idx];
        Object.keys(selection).forEach(id => {
            const qty = selection[id];
            const item = source.find(i => i.id == id);
            if (item) total += item.price * qty;
        });
    });

    // Dips/Sauces from selectors? No, we use popup selection now.
    // The previous code checked `document.getElementById('dip-selector').value`.
    // We removed that selector.
    // Logic above handles `selectedDips` and `selectedSauces` loops.
    // So we are good.

    const totalEl = document.getElementById('total-price');
    if (totalEl) totalEl.textContent = total.toFixed(2);
    renderBreakdown();
}

function renderBreakdown() {
    const breakdown = document.getElementById('breakdown');
    if (!breakdown) return;
    let html = `<ul>`;
    html += `<li>Size: ${currentSize} ($${currentSizePrice.toFixed(2)})</li>`;

    selectedToppings.forEach(id => {
        const item = toppings.find(i => i.id === id);
        if (item) html += `<li>${item.name} ($${item.price.toFixed(2)})</li>`;
    });

    // Helper to render qty items
    const renderQtyItems = (source, selection) => {
        Object.keys(selection).forEach(id => {
            const qty = selection[id];
            if (qty > 0) {
                const item = source.find(i => i.id == id);
                if (item) html += `<li>${item.name} x${qty} ($${(item.price * qty).toFixed(2)})</li>`;
            }
        });
    };

    renderQtyItems(drinks, selectedDrinks);
    renderQtyItems(dips, selectedDips);
    renderQtyItems(sauces, selectedSauces);

    html += `</ul>`;
    breakdown.innerHTML = html;
}

function addToCartCustom() {
    const totalEl = document.getElementById('total-price');
    const total = totalEl ? parseFloat(totalEl.textContent) : 0;

    // Flatten dips/sauces for cart simplicity or consistency
    const details = {
        type: 'Custom Pizza',
        size: currentSize,
        toppings: Array.from(selectedToppings).map(id => toppings.find(i => i.id == id)?.name),
        drinks: selectedDrinks,
        dips: selectedDips,
        sauces: selectedSauces
    };

    const item = {
        name: `Custom Pizza (${currentSize})`,
        price: total,
        details: details
    };

    // Use global cart from main.js and update localStorage
    cart.push(item);
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));

    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }

    alert('Custom Pizza added to cart!');
    // Removed: window.location.href = 'menu.html';
}
