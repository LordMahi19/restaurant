## **1. Critical Functionality (Must-Haves)**

*These features are essential for the website to actually accept and process real orders.*

### **1.1. Customer Details at Checkout**

**Issue:** Currently, the `checkout()` function in `main.js` immediately sends the order to the server. It does not ask for the customer's name, phone number, or delivery address.
**Solution:**

* **Frontend:** Create a "Checkout" modal or page that appears after clicking "Checkout" in the cart.
* **Form Fields:** Add inputs for `Name`, `Phone Number`, `Address`, and `Delivery Note`.
* **Database:** Update the `orders` table in `database.ts` to include columns for these details (`customer_name`, `customer_phone`, `customer_address`).
* **Backend:** Update the `POST /api/orders` route to accept and save these fields.

### **1.2. Backend Price Validation (Security)**

**Issue:** The total price is calculated in the browser (`main.js` and `custom.js`) and sent to the server. A tech-savvy user could modify the JavaScript to send a price of $0.01 for a large order.
**Solution:**

* **Backend:** When an order receives `details` (list of item IDs), the server should look up the prices from the `menu_items` and `ingredients` tables and calculate the total itself.
* **Logic:** The server should ignore the `totalPrice` sent by the client (or compare it) and use its own calculated value for the database record.

### **1.3. Cart Management**

**Issue:** Users can add items to the cart, but `main.js` does not have a function to **remove** an item or change the quantity once it is in the cart.
**Solution:**

* **UI:** In `updateCartUI()`, add a small "X" or "Remove" button next to each item in the list.
* **Logic:** Add a `removeFromCart(index)` function that removes the item from the `cart` array and updates `localStorage`.

### **1.4. Basic Admin Security**

**Issue:** Passwords are stored in plain text (`admin`/`admin` in `database.ts`).
**Solution:**

* **Backend:** Use a simple library like `bcrypt` (or `bcryptjs`) to hash passwords.
* **Login:** When checking credentials in `server.ts`, compare the input password against the hashed password in the database.

---

## **2. Operational Features (Recommended)**

*Features that make the system usable for daily restaurant staff operations.*

### **2.1. Order Sound/Notification**

**Issue:** The admin has to manually refresh the page or click "Orders" to see new orders.
**Solution:**

* **Frontend (Admin):** Add a simple polling mechanism in `admin.js` (e.g., `setInterval` every 30 seconds) to fetch pending orders.
* **Alert:** Play a simple notification sound (using an HTML `<audio>` element) when the number of pending orders increases.

### **2.2. Menu Management (Edit/Delete)**

**Issue:** The Admin panel only allows **Adding** items. If you make a typo or change a price, you cannot fix it.
**Solution:**

* **Backend:** Add `PUT /api/menu/:id` (update) and `DELETE /api/menu/:id` routes.
* **Frontend (Admin):** In the "Menu Management" tab, list existing items with "Edit" and "Delete" buttons next to them.

### **2.3. Delivery vs. Pickup**

**Issue:** All orders are treated the same.
**Solution:**

* **Checkout:** Add a simple toggle switch or radio button for "Delivery" vs. "Pickup".
* **Logic:** If "Pickup" is selected, hide the Address field.
* **Fee:** (Optional) Add a fixed Delivery Fee to the total if Delivery is selected.

---

## **3. User Experience Improvements**

*Visual and flow improvements to make the site feel professional.*

### **3.1. Order Confirmation Page**

**Issue:** Currently, the user gets a browser `alert()` saying "Order placed!".
**Solution:**

* **Page:** Create a simple `order-success.html` page.
* **Content:** Display the Order ID, estimated time, and a summary of what they ordered.
* **Flow:** Redirect the user to this page upon successful checkout.

### **3.2. Real Images**

**Issue:** The code uses `https://placehold.co/100x100`.
**Solution:**

* **Storage:** Create a folder `public/images/menu`.
* **Data:** Update the database seed data to point to these local files (e.g., `/images/menu/pepperoni.jpg`) instead of the placeholder URL.
* **Admin:** Allow the admin to paste an image URL when adding a new item.

### **3.3. Form Validation**

**Issue:** Users can potentially submit empty forms.
**Solution:**

* **HTML:** Add the `required` attribute to critical inputs (Name, Phone, Address).
* **JS:** Check if `cart.length > 0` before allowing checkout (already partially implemented, but ensure it's robust).

---

## **4. Technical Implementation Checklist**

If you are implementing this yourself, follow this order to minimize bugs:

1. **Database Update:** Add `customer_name`, `phone`, `address`, `type` (delivery/pickup) to the `orders` table.
2. **API Update:** Update `server.ts` to receive and save these new fields.
3. **Frontend Update:** Update `main.js` to create the checkout form modal and capture user input.
4. **Admin Update:** Update `admin.js` to display the customer's address and phone number on the order card so the driver knows where to go.