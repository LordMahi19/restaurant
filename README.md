# Gourmet Pizza & Kebab Restaurant App

A full-stack, single-page application (SPA) for a restaurant, featuring online ordering, custom pizza building, and a robust admin dashboard for staff.

## Features

### Customer Features
*   **Menu Browsing:** Filter items by category (Pizza, Kebab, Vegetarian, etc.).
*   **Custom Orders:** Build your own pizza with custom size, toppings, drinks, and dips.
*   **Cart System:** Add/remove items, view total price.
*   **Checkout:** Secure checkout with Delivery vs Pickup options.
    *   Dynamic address field (hidden for pickup).
    *   Form validation.
*   **Order Tracking:** Receive a unique Order ID upon successful placement.

### Admin/Staff Features
*   **Secure Login:** Password-protected dashboard (bcrypt hashed).
*   **Order Management:**
    *   Real-time order polling (auto-refresh).
    *   Audio notifications for new orders.
    *   Detailed view of customer info (Name, Phone, Address, Note).
    *   Order status management (Pending -> Completed).
*   **Menu Management:**
    *   Add new items.
    *   Edit existing items (Price, Name, Tags).
    *   Delete items.
*   **Analytics:** View total sales, order count, and sales by day.

### Backend & Security
*   **Price Validation:** Backend recalculates all prices based on database values to prevent tampering.
*   **Database:** SQLite database storing users, menu items, orders, and ingredients.
*   **Security:** Passwords hashed with `bcryptjs`.

## Tech Stack
*   **Frontend:** HTML5, Vanilla JavaScript, CSS3.
*   **Backend:** Node.js, Express, TypeScript.
*   **Database:** SQLite (`sqlite3`).

## specific installation & Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    *This runs the server using `nodemon` and `ts-node` for hot-reloading.*

3.  **Access the App:**
    *   **Customer View:** [http://localhost:3000](http://localhost:3000)
    *   **Admin Dashboard:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

## Default Credentials

*   **Username:** `admin`
*   **Password:** `admin`

## Project Structure

*   `public/`: Frontend static files (HTML, CSS, JS, Images).
*   `src/`: Backend TypeScript source code.
    *   `server.ts`: Express server implementation.
    *   `database.ts`: Database connection and schema definitions.
*   `restaurant.db`: SQLite database file (created automatically on first run).
