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

    if (tabName === 'orders') fetchOrders();
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

                return `
                <div class="order-card">
                    <div style="display:flex; justify-content:space-between;">
                        <h3>Order #${order.id}</h3>
                        <span>Status: <strong>${order.status}</strong></span>
                    </div>
                    <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
                    <div style="background: rgba(0,0,0,0.2); padding: 10px; margin: 10px 0;">
                        ${detailsHtml}
                    </div>
                    <h4>Total: $${order.total_price.toFixed(2)}</h4>
                    ${order.status !== 'completed' ? `<button class="btn" onclick="updateStatus(${order.id}, 'completed')">Mark Completed</button>` : ''}
                </div>`;
            }).join('');
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

    fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, price, tags })
    }).then(res => {
        if (res.ok) {
            alert('Item added!');
            document.getElementById('new-name').value = '';
            document.getElementById('new-category').value = '';
            document.getElementById('new-price').value = '';
            document.getElementById('new-tags').value = '';
        } else {
            alert('Failed to add item');
        }
    });
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
