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
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('dashboard-section').style.display = 'block';
                showTab('orders');
            } else {
                alert('Invalid credentials');
            }
        });
}

function showTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    if (tabName === 'orders') {
        fetchOrders();
        // Start polling if not already
        if (!window.orderInterval) {
            window.orderInterval = setInterval(fetchOrders, 10000);
        }
    } else {
        if (window.orderInterval) clearInterval(window.orderInterval);
        window.orderInterval = null;
    }

    if (tabName === 'menu') fetchAdminMenu();
    if (tabName === 'analytics') fetchAnalytics();
}

function fetchOrders() {
    fetch('/api/orders')
        .then(res => res.json())
        .then(orders => {
            const list = document.getElementById('orders-list');
            if (orders.length === 0) {
                list.innerHTML = '<p>No orders yet.</p>';
                return;
            }
            list.innerHTML = orders.map(order => {
                let details;
                try {
                    details = JSON.parse(order.details);
                } catch (e) { details = order.details; }

                // Format details
                let detailsHtml = '';
                if (Array.isArray(details)) {
                    detailsHtml = details.map(d => {
                        let txt = `${d.name} ($${d.price.toFixed(2)})`;
                        if (d.details && d.details.type === 'Custom Pizza') {
                            txt += `<br><small>Size: ${d.details.size}, Toppings: ${d.details.toppings.length} </small>`;
                        }
                        return `<div>${txt}</div>`;
                    }).join('');
                } else {
                    detailsHtml = JSON.stringify(details);
                }

                const customerHtml = order.customer_name ? `
                    <div style="background: rgba(255,255,255,0.1); padding: 5px; margin-bottom: 5px; font-size: 0.9em;">
                        <strong>Customer:</strong> ${order.customer_name} (${order.customer_phone})<br>
                        <strong>Type:</strong> ${order.type ? order.type.toUpperCase() : 'N/A'}<br>
                        ${order.type === 'delivery' ? `<strong>Address:</strong> ${order.customer_address}<br>` : ''}
                        ${order.customer_note ? `<strong>Note:</strong> ${order.customer_note}` : ''}
                    </div>
                ` : '';

                return `
                    <div style="display:flex; justify-content:space-between;">
                        <h3>Order #${order.id}</h3>
                        <span>Status: <strong>${order.status}</strong></span>
                    </div>
                    <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
                    ${customerHtml}
                    <div style="background: rgba(0,0,0,0.2); padding: 10px; margin: 10px 0;">
                        ${detailsHtml}
                    </div>
                    <h4>Total: $${order.total_price.toFixed(2)}</h4>
                    ${order.status !== 'completed' ? `<button class="btn" onclick="updateStatus(${order.id}, 'completed')">Mark Completed</button>` : ''}
                </div>`;
            }).join('');

            // Audio Notification
            const currentCount = orders.filter(o => o.status === 'pending').length;
            if (window.lastOrderCount !== undefined && currentCount > window.lastOrderCount) {
                document.getElementById('notification-sound').play().catch(e => console.log('Audio play failed', e));
            }
            window.lastOrderCount = currentCount;
        });
}

function updateStatus(id, status) {
    fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    }).then(() => fetchOrders());
}

function addMenuItem() {
    const name = document.getElementById('new-name').value;
    const category = document.getElementById('new-category').value.toLowerCase();
    const price = document.getElementById('new-price').value;
    const tags = document.getElementById('new-tags').value;
    const btn = document.querySelector('button[onclick="addMenuItem()"]');

    if (window.editingId) {
        // Update
        fetch(`/api/menu/${window.editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, price, tags })
        }).then(() => {
            alert('Item updated!');
            resetForm();
            fetchAdminMenu();
        });
    } else {
        // Create
        fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category, price, tags })
        }).then(res => {
            if (res.ok) {
                alert('Item added!');
                resetForm();
                fetchAdminMenu();
            } else {
                alert('Failed to add item');
            }
        });
    }
}

function resetForm() {
    document.getElementById('new-name').value = '';
    document.getElementById('new-category').value = '';
    document.getElementById('new-price').value = '';
    document.getElementById('new-tags').value = '';
    window.editingId = null;
    document.querySelector('button[onclick="addMenuItem()"]').textContent = 'Add';
}

function fetchAdminMenu() {
    fetch('/api/menu')
        .then(res => res.json())
        .then(items => {
            const list = document.getElementById('admin-menu-list');
            list.innerHTML = items.map(item => `
                <div style="background: rgba(255,255,255,0.05); padding: 10px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${item.name}</strong> (${item.category}) - $${item.price}
                    </div>
                    <div>
                        <button onclick="editItem(${item.id}, '${item.name}', '${item.category}', ${item.price}, '${item.tags}')">Edit</button>
                        <button onclick="deleteItem(${item.id})" style="color:red;">Delete</button>
                    </div>
                </div>
            `).join('');
        });
}

function deleteItem(id) {
    if (!confirm('Delete this item?')) return;
    fetch(`/api/menu/${id}`, { method: 'DELETE' })
        .then(() => fetchAdminMenu());
}

function editItem(id, name, cat, price, tags) {
    window.editingId = id;
    document.getElementById('new-name').value = name;
    document.getElementById('new-category').value = cat;
    document.getElementById('new-price').value = price;
    document.getElementById('new-tags').value = tags;
    document.querySelector('button[onclick="addMenuItem()"]').textContent = 'Update';
}

function fetchAnalytics() {
    fetch('/api/orders')
        .then(res => res.json())
        .then(orders => {
            const totalSales = orders.reduce((acc, o) => acc + o.total_price, 0);
            const count = orders.length;

            // Group by day (simplified)
            const salesByDay = {};
            orders.forEach(o => {
                const date = new Date(o.created_at).toLocaleDateString();
                salesByDay[date] = (salesByDay[date] || 0) + o.total_price;
            });

            let dayHtml = '<ul>';
            for (const [day, total] of Object.entries(salesByDay)) {
                dayHtml += `<li>${day}: $${total.toFixed(2)}</li>`;
            }
            dayHtml += '</ul>';

            document.getElementById('analytics-stats').innerHTML = `
            <h3>Total Sales: $${totalSales.toFixed(2)}</h3>
            <h3>Total Orders: ${count}</h3>
            <h4>Sales per Day:</h4>
            ${dayHtml}
        `;
        });
}
