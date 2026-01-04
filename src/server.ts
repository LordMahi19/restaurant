import express from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db, getAllMenuItems, getIngredients, addOrder, getOrders, updateOrderStatus, addMenuItem, updateMenuItem, deleteMenuItem } from './database';

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
        const { details, customer } = req.body;

        // --- Backend Price Validation ---
        const menuItems: any = await getAllMenuItems();
        const ingredients: any = await getIngredients();

        let calculatedTotal = 0;

        // details expected to be an array of objects (if coming from our updated frontend) or JSON string
        // The frontend will send it as a JSON string or object. Let's handle both but prefer object if possible.
        // For security, we re-parse if string
        let orderItems = typeof details === 'string' ? JSON.parse(details) : details;
        if (!Array.isArray(orderItems)) orderItems = [];

        orderItems.forEach((item: any) => {
            const menuItem = menuItems.find((m: any) => m.id === item.id);
            if (menuItem) {
                let itemPrice = menuItem.price;
                // Check for custom details/toppings
                if (item.details && item.details.toppings && Array.isArray(item.details.toppings)) {
                    item.details.toppings.forEach((toppingName: string) => {
                        const ing = ingredients.find((i: any) => i.name === toppingName);
                        if (ing) itemPrice += ing.price;
                    });
                }
                calculatedTotal += itemPrice;
            }
        });

        // Optional: add Delivery Fee logic here if needed, but for now just item validation
        // calculatedTotal = parseFloat(calculatedTotal.toFixed(2));

        const detailsStr = JSON.stringify(orderItems);
        const id = await addOrder(detailsStr, calculatedTotal, customer);
        res.json({ success: true, orderId: id });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Add Menu Item (Admin)
app.post('/api/menu', async (req, res) => {
    try {
        const { name, category, price, tags, image_url } = req.body;
        await addMenuItem(name, category, parseFloat(price), tags || '', '', image_url);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Update Menu Item
app.put('/api/menu/:id', async (req, res) => {
    try {
        const { name, category, price, tags } = req.body;
        await updateMenuItem(Number(req.params.id), name, category, parseFloat(price), tags, '');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete Menu Item
app.delete('/api/menu/:id', async (req, res) => {
    try {
        await deleteMenuItem(Number(req.params.id));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete item' });
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

// Simple Login with bcrypt
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row: any) => {
        if (err) {
            res.status(500).json({ error: 'Internal error' });
        } else if (row) {
            const match = await bcrypt.compare(password, row.password);
            if (match) {
                res.json({ success: true });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
