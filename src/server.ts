import express from 'express';
import path from 'path';
import { db, getAllMenuItems, getIngredients, addOrder, getOrders, updateOrderStatus, addMenuItem } from './database';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes

// Get all menu items
app.get('/api/menu', async (req, res) => {
    try {
        const items = await getAllMenuItems();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

// Get ingredients for custom pizza
app.get('/api/ingredients', async (req, res) => {
    try {
        const ingredients = await getIngredients();
        res.json(ingredients);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch ingredients' });
    }
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const { details, totalPrice } = req.body;
        // details expected to be a JSON object or string
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
        const id = await addOrder(detailsStr, totalPrice);
        res.json({ success: true, orderId: id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Add Menu Item (Admin)
app.post('/api/menu', async (req, res) => {
    try {
        const { name, category, price, tags } = req.body;
        await addMenuItem(name, category, parseFloat(price), tags || '');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Get all orders (for admin)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await getOrders();
        res.json(orders);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await updateOrderStatus(Number(req.params.id), status);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Simple Login (hardcoded for simplicity as requested 'beginner friendly', but using DB check is better)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Internal error' });
        } else if (row) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
