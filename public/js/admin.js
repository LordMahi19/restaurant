let allItems = [];
let categories = [];
let allTags = [];
let editingItemId = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in (simplified session check)
    // For this demo, we use a simple variable in localStorage but real app would use session cookie
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
    }
});

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
        .then(res => {
            if (res.ok) {
                localStorage.setItem('adminLoggedIn', 'true');
                showDashboard();
            } else {
                alert('Invalid credentials');
            }
        })
        .catch(err => console.error(err));
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.reload();
}

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
    loadData();
}

async function loadData() {
    try {
        const [menuRes, catRes, tagsRes] = await Promise.all([
            fetch('/api/menu'),
            fetch('/api/categories'),
            fetch('/api/tags')
        ]);
        allItems = await menuRes.json();
        categories = await catRes.json();
        allTags = await tagsRes.json();
        renderAdminMenu();
        renderTagsDashboard();
    } catch (err) {
        console.error('Failed to load data', err);
    }
}

function renderAdminMenu() {
    const container = document.getElementById('admin-menu-container');
    container.innerHTML = '';

    categories.forEach(cat => {
        // Filter items for this category
        const items = allItems.filter(item => item.category === cat.name);

        const section = document.createElement('div');
        section.className = 'category-section';
        section.id = `cat-${cat.name}`;
        // section.style.marginBottom = '40px'; // Controlled by CSS now

        // Header
        const headerName = capitalize(cat.name === 'rulla' ? 'rolls' : cat.name);

        section.innerHTML = `
            <div class="category-header" onclick="toggleCategory('${cat.name}')">
                <h2>${headerName} <span style="font-size: 0.8em; opacity: 0.7;">(${items.length})</span></h2>
                <span id="icon-${cat.name}" class="icon">+</span>
            </div>
            <div class="category-content" id="content-${cat.name}">
                <!-- Items injected below -->
            </div>
        `;

        // Grid (is category-content itself now)
        const grid = section.querySelector('.category-content');

        // Add Item Card (First card)
        const addCard = document.createElement('div');
        addCard.className = 'menu-item';
        addCard.style.display = 'flex';
        addCard.style.flexDirection = 'column';
        addCard.style.justifyContent = 'center';
        addCard.style.alignItems = 'center';
        addCard.style.cursor = 'pointer';
        addCard.style.border = '2px dashed var(--accent-color)';
        addCard.style.background = 'rgba(255,255,255,0.4)';
        addCard.onclick = (e) => {
            e.stopPropagation(); // Prevent toggling category when clicking add
            openItemModal(null, cat.name);
        };
        addCard.innerHTML = `
            <div style="font-size: 3rem; color: var(--accent-color); margin-bottom: 10px;">+</div>
            <div style="font-weight: 600; color: var(--accent-color);">Add New Item</div>
        `;
        grid.appendChild(addCard);

        // Existing Items
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'menu-item';
            card.style.position = 'relative'; // For overlay matching

            const price = parseFloat(item.price).toFixed(2);

            card.innerHTML = `
                <img src="${item.image_url || 'images/default-food.png'}" alt="${item.name}" onerror="this.src='https://placehold.co/400x300?text=No+Image'">
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <h3>${item.name}</h3>
                        <span class="price">$${price}</span>
                    </div>
                    <p class="description">${item.description || ''}</p>
                    ${item.tags ? `<div class="tags">${item.tags.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('')}</div>` : ''}
                </div>
                <!-- Admin Overlay -->
                <div class="admin-overlay" style="
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex; justify-content: center; align-items: center; gap: 20px;
                    opacity: 0; transition: opacity 0.3s; border-radius: inherit;
                ">
                    <button onclick="event.stopPropagation(); openItemModal(${item.id})" class="btn" style="padding: 10px 20px; min-width: auto; background: white;">✏️ Edit</button>
                    <button onclick="event.stopPropagation(); deleteItem(${item.id})" class="btn" style="padding: 10px 20px; min-width: auto; background: #ff4757; color: white; border-color: #ff4757;">🗑️ Delete</button>
                </div>
            `;

            // Setup hover effect for overlay via JS or CSS. 
            // We'll use inline style helper or global CSS. Let's add simple mouse events here for simplicity
            card.onmouseenter = () => card.querySelector('.admin-overlay').style.opacity = '1';
            card.onmouseleave = () => card.querySelector('.admin-overlay').style.opacity = '0';

            grid.appendChild(card);
        });

        container.appendChild(section);
    });
}

function toggleCategory(category) {
    const section = document.getElementById(`cat-${category}`);
    const icon = document.getElementById(`icon-${category}`);
    section.classList.toggle('open');
    if (section.classList.contains('open')) {
        icon.textContent = '-';
        icon.style.transform = 'rotate(180deg)';
    } else {
        icon.textContent = '+';
        icon.style.transform = 'rotate(0deg)';
    }
}

// --- Item Modal Functions ---

function openItemModal(itemId = null, categoryName = '') {
    const modal = document.getElementById('item-modal');
    modal.style.display = 'flex';
    editingItemId = itemId;

    if (itemId) {
        const item = allItems.find(i => i.id === itemId);
        document.getElementById('modal-title').textContent = 'Edit Item';
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-desc').value = item.description || '';
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-image').value = item.image_url || '';
        document.getElementById('item-tags').value = item.tags || '';
        updateTagsDisplay();
    } else {
        document.getElementById('modal-title').textContent = 'Add New Item';
        document.getElementById('item-form').reset();
        document.getElementById('item-id').value = '';
        document.getElementById('item-category').value = categoryName; // Pre-fill category
        updateTagsDisplay();
    }
}

// --- Tags Modal Logic ---
const defaultTags = ['spicy', 'vegetarian', 'vegan', 'gluten-free', 'popular', 'new', 'recommend', 'nuts', 'dairy-free', 'halal'];

function openTagsModal() {
    document.getElementById('tags-modal').style.display = 'flex';
    renderTagsGrid();
}

function closeTagsModal() {
    // Collect selected tags
    const container = document.getElementById('tags-grid');
    const selectedElements = container.querySelectorAll('.tag-option.selected');
    const selectedTags = Array.from(selectedElements).map(el => el.dataset.tag);

    // Update hidden input and display
    document.getElementById('item-tags').value = selectedTags.join(', ');
    updateTagsDisplay();

    document.getElementById('tags-modal').style.display = 'none';
}

function renderTagsGrid() {
    const container = document.getElementById('tags-grid');
    const currentTagsStr = document.getElementById('item-tags').value;
    const currentTags = currentTagsStr ? currentTagsStr.split(',').map(t => t.trim()) : [];

    // Collect all unique tags
    const allTagsSet = new Set(defaultTags);
    allItems.forEach(item => {
        if (item.tags) {
            item.tags.split(',').forEach(t => allTagsSet.add(t.trim()));
        }
    });
    const uniqueTags = Array.from(allTagsSet).sort();

    container.innerHTML = '';

    uniqueTags.forEach(tag => {
        const btn = document.createElement('div');
        btn.className = 'tag-option ' + (currentTags.includes(tag) ? 'selected' : '');
        btn.textContent = tag;
        btn.dataset.tag = tag;

        btn.onclick = () => {
            btn.classList.toggle('selected');
        };

        container.appendChild(btn);
    });
}

function updateTagsDisplay() {
    const val = document.getElementById('item-tags').value;
    const trigger = document.getElementById('tags-trigger');

    if (val) {
        trigger.innerHTML = '';
        val.split(',').forEach(t => {
            const span = document.createElement('span');
            span.style.background = '#f0f0f0';
            span.style.padding = '4px 10px';
            span.style.borderRadius = '20px';
            span.style.fontSize = '0.9em';
            span.style.color = '#333';
            span.textContent = t.trim();
            trigger.appendChild(span);
        });

        // Add a small "+" button at the end to show addibility
        const addSmall = document.createElement('span');
        addSmall.textContent = '+';
        addSmall.style.width = '24px';
        addSmall.style.height = '24px';
        addSmall.style.borderRadius = '50%';
        addSmall.style.background = 'var(--accent-color)';
        addSmall.style.color = 'white';
        addSmall.style.display = 'flex';
        addSmall.style.alignItems = 'center';
        addSmall.style.justifyContent = 'center';
        addSmall.style.marginLeft = '5px';
        addSmall.style.fontSize = '1.2em';
        addSmall.style.fontWeight = 'bold';
        trigger.appendChild(addSmall);

    } else {
        trigger.innerHTML = `
            <div class="tags-placeholder">
                <span class="icon">+</span>
                <span>Add Tags</span>
            </div>
        `;
    }
}

function closeItemModal() {
    document.getElementById('item-modal').style.display = 'none';
}

async function handleItemSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('item-id').value;
    const data = {
        name: document.getElementById('item-name').value,
        description: document.getElementById('item-desc').value, // Add description field logic in backend if missed
        price: parseFloat(document.getElementById('item-price').value),
        category: document.getElementById('item-category').value,
        image_url: document.getElementById('item-image').value,
        tags: document.getElementById('item-tags').value
    };

    try {
        const url = id ? `/api/menu/${id}` : '/api/menu';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            closeItemModal();
            loadData(); // Refresh grid
        } else {
            alert('Failed to save item');
        }
    } catch (err) {
        console.error(err);
        alert('Error saving item');
    }
}

async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        await fetch(`/api/menu/${id}`, { method: 'DELETE' });
        loadData();
    } catch (err) {
        console.error(err);
        alert('Failed to delete item');
    }
}

// --- Category Modal Functions ---

function openAddCategoryModal() {
    document.getElementById('category-modal').style.display = 'flex';
    document.getElementById('cat-name').value = '';
}

function closeCategoryModal() {
    document.getElementById('category-modal').style.display = 'none';
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;

    try {
        const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (res.ok) {
            closeCategoryModal();
            loadData();
        } else {
            alert('Failed to add category');
        }
    } catch (err) {
        console.error(err);
        alert('Error adding category');
    }
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Manage Tags Functions ---

function renderTagsDashboard() {
    const container = document.getElementById('admin-tags-bar');
    if (!container) return; // In case element missing

    container.innerHTML = '';
    allTags.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag';
        badge.style.background = 'rgba(255,255,255,0.8)';
        badge.textContent = capitalize(tag.name);
        container.appendChild(badge);
    });
}

function openManageTagsModal() {
    document.getElementById('manage-tags-modal').style.display = 'flex';
    renderManageTagsList();
}

function closeManageTagsModal() {
    document.getElementById('manage-tags-modal').style.display = 'none';
}

function renderManageTagsList() {
    const container = document.getElementById('manage-tags-list');
    container.innerHTML = '';

    allTags.forEach(tag => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 0';
        row.style.borderBottom = '1px solid #eee';

        row.innerHTML = `
            <span style="font-weight: 500;">${capitalize(tag.name)}</span>
            <button class="btn" style="padding: 4px 10px; background: #ff4757; color: white; border-color: #ff4757; min-width: auto; font-size: 0.8em;" onclick="deleteTag(${tag.id})">Delete</button>
        `;
        container.appendChild(row);
    });
}

async function handleAddTag(e) {
    e.preventDefault();
    const nameInput = document.getElementById('new-tag-name');
    const name = nameInput.value.trim();
    if (!name) return;

    try {
        const res = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (res.ok) {
            nameInput.value = '';
            loadData().then(() => renderManageTagsList());
        } else {
            alert('Failed to add tag');
        }
    } catch (err) {
        console.error(err);
        alert('Error adding tag');
    }
}

async function deleteTag(id) {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
        const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadData().then(() => renderManageTagsList());
        } else {
            alert('Failed to delete tag');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting tag');
    }
}
