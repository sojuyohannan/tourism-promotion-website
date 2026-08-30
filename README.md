# Tourism Promotion Website & Marketplace

A comprehensive digital platform developed to stimulate local economic growth and sustainable tourism. Built with Node.js, Express, and MySQL.

## Prerequisites

Before you can run the project, make sure you have installed:
1. **Node.js** (v16 or higher)
2. **MySQL** (You can use XAMPP, WAMP, or standalone MySQL)

## How to Run

### Step 1: Start your Database
1. Open XAMPP (or your preferred MySQL tool).
2. Start the **MySQL** module.
3. Go to phpMyAdmin (usually `http://localhost/phpmyadmin`) or your database GUI.
4. Create a new database named exactly: **`tourism_db`**

*(Note: The server will automatically create all the required tables and seed the default admin account when it starts.)*

### Step 2: Install Project Dependencies
Open your terminal (Command Prompt or VS Code Terminal) in the project folder (`d:\sgd project`) and run:
```bash
npm install
```

### Step 3: Start the Server
In the same terminal, run:
```bash
npm start
```
You should see messages in the terminal confirming that the server is running and the MySQL database is connected.

### Step 4: Access the Website
Open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

## Default Accounts
If you need to log in as an administrator, the default seeded account is:
* **Email:** `admin@tourismpro.com`
* **Password:** `admin123`

You can create Tourist or Provider accounts directly from the Register page.

## System Modules
- **Authentication & RBAC**: Tourists, Tourism Providers, and Administrators
- **Destination & Package Discovery**: Dynamic listing, filtering, search, and pricing calculator
- **Booking & Checkout Pipeline**: Direct booking management with automated transaction recording
- **Provider Management**: Provider verification, onboarding, and service listing dashboard
- **Administrative Control Panel**: Platform analytics, user management, and provider approvals
- **Automated Testing Suite**: Full end-to-end test automation with Selenium WebDriver
