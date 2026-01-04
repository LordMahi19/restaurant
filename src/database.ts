import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';


const dbPath = './restaurant.db';

export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users table (for admin)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        // Insert default admin if not exists (admin/admin)
        db.get("SELECT * FROM users WHERE username = 'admin'", async (err, row) => {
            if (!row) {
                const hashedPassword = await bcrypt.hash('admin', 10);
                db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ['admin', hashedPassword]);
            }
        });

        // Menu Items table
        db.run(`CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL,
            category TEXT,
            tags TEXT, 
            image_url TEXT
        )`);
        // Tags: 'beef', 'chicken', 'vegetarian', etc.
        // Category: 'pizza', 'kebab', 'rulla', 'salad', 'drinks', 'desserts'

        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            details TEXT, -- JSON string of items
            total_price REAL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            customer_name TEXT,
            customer_phone TEXT,
            customer_address TEXT,
            customer_note TEXT,
            type TEXT
        )`);

        // Ingredients table (for custom orders)
        db.run(`CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT, -- meat, vegetables, cheese, sauce, spice, dip
            price REAL
        )`);

        // Seed simple data if empty
        db.get("SELECT count(*) as count FROM menu_items", (err, row: any) => {
            if (row && row.count === 0) {
                seedMenuItems();
            }
        });

        db.get("SELECT count(*) as count FROM ingredients", (err, row: any) => {
            if (row && row.count === 0) {
                seedIngredients();
            }
        });
    });
}

function seedMenuItems() {
    const items = [
        { name: 'Beef Pizza', description: 'Delicious beef pizza', price: 12.0, category: 'pizza', tags: 'beef', image_url: '/images/menu/beef-pizza.jpg' },
        { name: 'Chicken Pizza', description: 'Tasty chicken pizza', price: 11.0, category: 'pizza', tags: 'chicken', image_url: '/images/menu/chicken-pizza.jpg' },
        { name: 'Veggie Pizza', description: 'Fresh vegetable pizza', price: 10.0, category: 'pizza', tags: 'vegetarian', image_url: '/images/menu/veggie-pizza.jpg' },
        { name: 'Kebab Plate', description: 'Kebab with fries', price: 13.0, category: 'kebab', tags: 'beef', image_url: '/images/menu/kebab-plate.jpg' },
        { name: 'Chicken Kebab', description: 'Chicken kebab', price: 13.0, category: 'kebab', tags: 'chicken', image_url: '/images/menu/chicken-kebab.jpg' },
        { name: 'Rulla Kebab', description: 'Rolled kebab', price: 11.5, category: 'rulla', tags: 'beef', image_url: '/images/menu/rulla-kebab.jpg' },
        { name: 'Greek Salad', description: 'Fresh salad', price: 8.0, category: 'salad', tags: 'vegetarian', image_url: '/images/menu/greek-salad.jpg' },
        { name: 'Cola', description: 'Cold drink', price: 3.0, category: 'drinks', tags: '', image_url: '/images/menu/cola.jpg' },
        { name: 'Ice Cream', description: 'Vanilla ice cream', price: 4.0, category: 'desserts', tags: 'vegetarian', image_url: '/images/menu/ice-cream.jpg' },
    ];

    const insert = db.prepare(`INSERT INTO menu_items (name, description, price, category, tags, image_url) VALUES (?, ?, ?, ?, ?, ?)`);
    items.forEach(item => {
        insert.run(item.name, item.description, item.price, item.category, item.tags, item.image_url);
    });
    insert.finalize();
    console.log("Seeded menu items.");
}

function seedIngredients() {
    const ingredients = [
        { name: 'Pepperoni', type: 'meat', price: 1.5 },
        { name: 'Ham', type: 'meat', price: 1.5 },
        { name: 'Chicken', type: 'meat', price: 1.5 },
        { name: 'Onion', type: 'vegetables', price: 0.5 },
        { name: 'Tomato', type: 'vegetables', price: 0.5 },
        { name: 'Olives', type: 'vegetables', price: 0.5 },
        { name: 'Mozzarella', type: 'cheese', price: 1.0 },
        { name: 'Blue Cheese', type: 'cheese', price: 1.5 },
        { name: 'Tomato Sauce', type: 'sauce', price: 0.5 },
        { name: 'BBQ Sauce', type: 'sauce', price: 0.5 },
        { name: 'Garlic Dip', type: 'dip', price: 1.0 },
        { name: 'Oregano', type: 'spice', price: 0.0 },
    ];

    const insertIng = db.prepare(`INSERT INTO ingredients (name, type, price) VALUES (?, ?, ?)`);
    ingredients.forEach(ing => {
        insertIng.run(ing.name, ing.type, ing.price);
    });
    insertIng.finalize();

    console.log("Seeded ingredients.");
}

export function getAllMenuItems() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM menu_items", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

export function getIngredients() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM ingredients", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

export function addOrder(details: string, totalPrice: number, customer: any) {
    return new Promise((resolve, reject) => {
        const { name, phone, address, note, type } = customer;
        db.run(`INSERT INTO orders (details, total_price, customer_name, customer_phone, customer_address, customer_note, type) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [details, totalPrice, name, phone, address, note, type], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
    });
}

export function getOrders() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

export function updateOrderStatus(id: number, status: string) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id], function (err) {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

export function addMenuItem(name: string, category: string, price: number, tags: string, description: string = '', imageUrl: string = '') {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO menu_items (name, category, price, tags, description, image_url) VALUES (?, ?, ?, ?, ?, ?)",
            [name, category, price, tags, description, imageUrl], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
    });
}

export function updateMenuItem(id: number, name: string, category: string, price: number, tags: string, description: string) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE menu_items SET name = ?, category = ?, price = ?, tags = ?, description = ? WHERE id = ?",
            [name, category, price, tags, description, id], function (err) {
                if (err) reject(err);
                else resolve(true);
            });
    });
}

export function deleteMenuItem(id: number) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM menu_items WHERE id = ?", [id], function (err) {
            if (err) reject(err);
            else resolve(true);
        });
    });
}
