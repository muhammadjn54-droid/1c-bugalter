# Accounting & Inventory Management System

A professional accounting and inventory management system inspired by 1C accounting software. Features multi-user support with complete data isolation, comprehensive accounting workflows, inventory tracking, and financial reporting.

## Architecture

```
Frontend (React + TypeScript)
    ↓
API Client (Axios + JWT)
    ↓
Backend API (Express + TypeScript)
    ↓
Database (PostgreSQL)
    ↓
Email Service (Nodemailer)
```

## Key Features

### Authentication & Security
- User registration and login
- JWT-based authentication
- Password reset via email
- Change password functionality
- Multi-user data isolation (all data scoped to authenticated user)
- Secure password hashing with bcryptjs

### Accounting Core
- **Products Management**: SKU, barcode, pricing, inventory tracking
- **Categories**: Organize products
- **Warehouses**: Multiple warehouse support
- **Purchases**: Record supplier purchases with automatic inventory increase
- **Sales**: Create sales with automatic inventory decrease
- **Stock Movements**: Complete history of all inventory changes with reason tracking
- **Customers**: Customer contact and transaction history
- **Suppliers**: Supplier management
- **Expenses**: Track business expenses by category
- **Income**: Additional income sources

### Financial Reports
- **Dashboard**: Real-time summary of sales, purchases, profit, expenses
- **Inventory Report**: Current stock value and quantity
- **Profit Report**: Revenue, cost of goods, gross profit, net profit
- **Stock Movements**: Detailed history of inventory changes

### API Documentation
- Complete Swagger/OpenAPI documentation at `/api-docs`
- All endpoints documented with schemas and authentication requirements
- Testable directly from Swagger UI

## Database Schema

### Core Tables
- `users` - User accounts
- `password_reset_tokens` - Secure password reset
- `products` - Product catalog
- `categories` - Product categories
- `warehouses` - Warehouse locations
- `customers` - Customer information
- `suppliers` - Supplier information
- `purchases` - Purchase records
- `purchase_items` - Line items for purchases
- `sales` - Sale records
- `sale_items` - Line items for sales
- `stock_movements` - Inventory transaction history
- `expenses` - Expense records
- `income` - Additional income

All tables enforce user ownership through `user_id` foreign key.

## Setup Instructions

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. **Install dependencies**
```bash
cd server
npm install
```

2. **Configure environment variables**
Create `.env` file:
```
DATABASE_URL=postgresql://user:password@localhost:5432/accounting_db
JWT_SECRET=your-secret-key-here-minimum-32-characters
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=muhammadjn54@gmail.com
EMAIL_APP_PASSWORD=your_app_password_here
EMAIL_FROM=muhammadjn54@gmail.com
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5000
NODE_ENV=development
PORT=5000
```

3. **Run migrations**
```bash
npm run migrate
```

4. **Start development server**
```bash
npm run dev
```

Server runs on `http://localhost:5000`
Swagger docs available at `http://localhost:5000/api-docs`

### Frontend Setup

1. **Install dependencies**
```bash
cd client
npm install
```

2. **Configure environment variables**
Create `.env` file:
```
VITE_API_URL=http://localhost:5000
```

3. **Start development server**
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

### Running Both Servers

From root directory:
```bash
npm run dev
```

This starts both backend and frontend concurrently.

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/change-password` - Change password (authenticated)

### Products
- `GET /products` - List products (with search/filter/pagination)
- `POST /products` - Create product
- `GET /products/:id` - Get product details
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Categories
- `GET /categories` - List categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Warehouses
- `GET /warehouses` - List warehouses
- `POST /warehouses` - Create warehouse
- `PUT /warehouses/:id` - Update warehouse
- `DELETE /warehouses/:id` - Delete warehouse

### Customers
- `GET /customers` - List customers (with search)
- `POST /customers` - Create customer
- `GET /customers/:id` - Get customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

### Suppliers
- `GET /suppliers` - List suppliers (with search)
- `POST /suppliers` - Create supplier
- `GET /suppliers/:id` - Get supplier
- `PUT /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier

### Purchases
- `GET /purchases` - List purchases (with filters)
- `POST /purchases` - Create purchase (with items)
- `GET /purchases/:id` - Get purchase details

### Sales
- `GET /sales` - List sales (with filters)
- `POST /sales` - Create sale (with items, validates stock)
- `GET /sales/:id` - Get sale details

### Expenses
- `GET /expenses` - List expenses
- `POST /expenses` - Create expense
- `DELETE /expenses/:id` - Delete expense

### Income
- `GET /income` - List income entries
- `POST /income` - Create income entry
- `DELETE /income/:id` - Delete income entry

### Reports
- `GET /reports/dashboard` - Dashboard statistics
- `GET /reports/inventory` - Inventory report
- `GET /reports/profit` - Profit report with date filtering
- `GET /reports/stock-movements` - Stock movement history

## Email Configuration

The system uses environment variables for email configuration. For Gmail:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Set `EMAIL_APP_PASSWORD` to the generated password
4. Never commit `.env` file to version control

## Multi-User Data Isolation

The system enforces complete data isolation per user:

- All database queries filter by `user_id` from authenticated JWT
- Frontend never sends `user_id` - it comes from the token
- Users cannot access, modify, or delete other users' data
- This is enforced at the database query level, not the application level

Example:
- User A registers and creates products, sales, purchases
- User B registers and cannot see User A's data
- User B sees only their own data
- Backend validates ownership on every request

## Security Implementation

- ✓ Password hashing with bcryptjs (10 rounds)
- ✓ JWT authentication with 7-day expiration
- ✓ Ownership validation on all protected endpoints
- ✓ Input validation on all endpoints
- ✓ No secrets exposed in frontend or Swagger responses
- ✓ CORS configured for frontend
- ✓ Environment variables for all sensitive data
- ✓ Secure password reset tokens with expiration
- ✓ Database transactions for atomic accounting operations

## Accounting Logic

### Purchase Workflow
1. Create purchase with supplier, items, quantity, price
2. On confirmation:
   - Inventory increases
   - Stock movement recorded
   - Total amount calculated

### Sales Workflow
1. Create sale with customer, items, quantity, price
2. On confirmation:
   - Validates sufficient stock exists
   - Inventory decreases
   - Stock movement recorded
   - Prevents negative inventory
   - Total amount calculated

### Profit Calculation
```
Gross Profit = Total Sales Revenue - Total Purchase Cost
Net Profit = Gross Profit - Expenses + Income
```

All calculations are performed on actual database data, not estimates.

## Project Structure

```
swager/
├── server/
│   ├── src/
│   │   ├── index.ts              # Main Express app
│   │   ├── config/
│   │   │   └── database.ts        # PostgreSQL connection
│   │   ├── database/
│   │   │   └── migrations.ts      # Database schema
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   ├── categories.ts
│   │   │   ├── warehouses.ts
│   │   │   ├── customers.ts
│   │   │   ├── suppliers.ts
│   │   │   ├── purchases.ts
│   │   │   ├── sales.ts
│   │   │   ├── expenses.ts
│   │   │   ├── income.ts
│   │   │   └── reports.ts
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types
│   │   └── utils/
│   │       └── email.ts           # Email service
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── client/
│   ├── src/
│   │   ├── App.tsx                # Main app router
│   │   ├── main.tsx               # React entry point
│   │   ├── api/
│   │   │   └── client.ts          # Axios API client
│   │   ├── context/
│   │   │   └── AuthContext.tsx    # Authentication context
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx # Route protection
│   │   ├── pages/
│   │   │   ├── Auth.tsx           # Login/Register/Reset
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   └── Products.tsx       # Products page
│   │   └── styles/
│   │       ├── index.css
│   │       ├── Auth.css
│   │       ├── Dashboard.css
│   │       └── Products.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.example
│
├── package.json
├── .env.example
└── .gitignore
```

## Testing the System

### 1. Register & Login
```bash
# Register
POST /auth/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### 2. Create Products
```bash
POST /products
Authorization: Bearer {token}
{
  "name": "Pen",
  "sku": "PEN001",
  "purchase_price": 2,
  "sale_price": 3,
  "minimum_stock": 10
}
```

### 3. Create Purchase (Increase Inventory)
```bash
POST /purchases
Authorization: Bearer {token}
{
  "supplier_id": "{supplier_uuid}",
  "purchase_date": "2026-09-11",
  "items": [
    {
      "product_id": "{product_uuid}",
      "quantity": 100,
      "unit_price": 2
    }
  ]
}
```

### 4. Create Sale (Decrease Inventory)
```bash
POST /sales
Authorization: Bearer {token}
{
  "customer_id": "{customer_uuid}",
  "sale_date": "2026-09-11",
  "items": [
    {
      "product_id": "{product_uuid}",
      "quantity": 20,
      "unit_price": 3
    }
  ]
}
```

### 5. View Dashboard
```bash
GET /reports/dashboard
Authorization: Bearer {token}
```

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Verify DATABASE_URL is correct
- Check database exists and user has permissions

### Email Not Sending
- Verify EMAIL_APP_PASSWORD is set (not regular Gmail password)
- Check EMAIL_USER matches the account
- Enable "Less secure apps" if not using app password
- Check email logs in backend console

### CORS Issues
- Ensure FRONTEND_URL matches client URL
- Verify API client uses correct API_URL
- Check browser console for specific CORS errors

### Authentication Errors
- Verify JWT_SECRET is set to same value
- Check token expiration (7 days)
- Clear browser localStorage and re-login

## Future Enhancements

- [ ] Invoice generation and PDF export
- [ ] Stock transfer between warehouses
- [ ] Audit logging
- [ ] Tax calculation and compliance
- [ ] Multi-currency support
- [ ] Advanced reporting with date range exports
- [ ] User roles and permissions
- [ ] API rate limiting
- [ ] Database backups
- [ ] Two-factor authentication

## Security Notes

**CRITICAL**: Never commit `.env` file to version control. Use `.env.example` as template.

The EMAIL_APP_PASSWORD should be treated as a secret. For Gmail:
- Do NOT use your regular Gmail password
- Generate an app-specific password
- Store only in `.env` file
- Never log or expose in frontend

## License

ISC

## Support

For issues or questions, refer to the Swagger documentation at `/api-docs` for complete API reference.
