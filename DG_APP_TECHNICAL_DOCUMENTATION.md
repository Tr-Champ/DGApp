# DG Retail App — Complete Technical & Operational Documentation
**Version:** 1.0.0 (Production-Ready)  
**Target Market:** Rwandan Fashion & Retail Ecosystem  
**Default Currency:** Rwandan Franc (RWF)  
**Supported Languages:** English (🇬🇧), Ikinyarwanda (🇷🇼), Français (🇫🇷)

---

## 1. Executive Summary

**DG Retail** is a mobile commerce and store management platform designed for the Rwandan retail and fashion market. It connects customers with quality fashion items (clothing, shoes, bags, cosmetics, jewelry, and household goods) while equipping store administrators with a mobile management system.

### Key Value Propositions
* **Rwandan Localization**: Native currency throughout (**RWF**), district-based delivery routing (Gasabo, Kicukiro, Nyarugenge, Musanze, Rubavu, Huye, etc.), and local mobile payment channels (MTN MoMo, Airtel Money, Bank Transfer).
* **Instant Multilingual Support**: Seamless switching between **English**, **Kinyarwanda**, and **French** across all screens without reloading.
* **Two-Way Delivery Handshake**: Live order status synchronization between customers and store admins, guaranteeing transparent delivery confirmations.
* **Automated Real-Time Inventory Control**: Exact copy tracking (`#Items`), automatic stock decrement upon payment, and immediate removal of sold-out products.
* **Instant Navigation (Zero-Spinner UX)**: In-memory caching architecture eliminating tab switching loading spinners.

---

## 2. System Architecture

```mermaid
graph TD
    subgraph Client ["Client Device (Android / iOS / Web)"]
        UI["React Native + Expo Router v58"]
        Contexts["AuthContext | CartContext | LanguageContext"]
        Cache["In-Memory Screen Caches (0ms Tab Load)"]
    end

    subgraph External ["External Services"]
        Cloudinary["Cloudinary CDN (Multi-Image Storage)"]
        Payments["Rwandan Payment Gateways (MTN MoMo / Airtel Money / Bank)"]
    end

    subgraph Backend ["FastAPI Cloud Backend (Render)"]
        API["FastAPI REST Endpoints (/api)"]
        AuthMiddleware["JWT Authentication & RBAC Guard"]
        CRUD["SQLAlchemy ORM (Users, Products, Orders, Carts)"]
    end

    subgraph Database ["Persistent Storage"]
        Postgres["PostgreSQL Database (Neon / Render)"]
    end

    UI --> Contexts
    Contexts --> Cache
    UI -->|Image Uploads| Cloudinary
    UI -->|Payments Push| Payments
    UI -->|REST Requests + JWT| API
    API --> AuthMiddleware
    AuthMiddleware --> CRUD
    CRUD --> Postgres
```

---

## 3. Frontend Architecture

### 3.1 Technology Stack
* **Framework**: React Native 0.88 with React 19
* **Toolchain**: Expo SDK 58 (Expo Router v58 file-based routing)
* **Language**: TypeScript 5.8+ (Strict type-checking verified with `tsc --noEmit`)
* **State Management**: React Context API (`AuthContext`, `CartContext`, `LanguageContext`) + In-Memory Module Caching
* **Networking**: Axios with interceptors for automatic JWT injection and unified error handling
* **Media Management**: `expo-image-picker` with Cloudinary CDN integration
* **Styling**: Vanilla React Native `StyleSheet` with unified color tokens in `Colors.ts`

### 3.2 Directory Structure
```
Frontend/
├── assets/
│   ├── splash.jpg                   # 3-second splash screen background
│   └── images/                      # App icon, adaptive launcher icons, favicon
├── src/
│   ├── app/
│   │   ├── _layout.tsx              # Root Layout: Splash Screen Timer, Providers (Language, Auth, Cart)
│   │   ├── index.tsx                # Root redirect to /(tabs)/tab1
│   │   ├── checkout.tsx             # 2-step checkout: Delivery details + Payment method
│   │   ├── (auth)/                  # Isolated Authentication Stack
│   │   │   ├── _layout.tsx          # Auth Stack Navigator
│   │   │   ├── login.tsx            # Login with eye toggle & role redirection
│   │   │   ├── register.tsx         # Account registration with validation
│   │   │   └── forgot-password.tsx  # Password reset request screen
│   │   ├── (tabs)/                  # Role-Aware Bottom Tab Navigator
│   │   │   ├── _layout.tsx          # Dynamic tab labels, icons, and Android soft-key inset handling
│   │   │   ├── index.tsx            # Legacy redirect to tab1
│   │   │   ├── tab1.tsx             # Tab 1: CustomerHome OR AdminDashboard
│   │   │   ├── tab2.tsx             # Tab 2: CustomerSearch OR AdminProductsCrud
│   │   │   ├── tab3.tsx             # Tab 3: CustomerCart OR AdminConfirmOrders
│   │   │   ├── tab4.tsx             # Tab 4: CustomerOrders OR AdminReports
│   │   │   └── profile.tsx          # Shared Profile: Language switcher, Account info, Delete Account
│   │   └── product/
│   │       └── [id].tsx             # Swipeable multi-image product detail with stock guard
│   ├── components/
│   │   ├── Button.tsx               # Reusable styled button with loading state
│   │   ├── Input.tsx                # Reusable form text input
│   │   ├── ProductCard.tsx          # Product card with RWF price, image count badge, low-stock pill
│   │   └── CartItemRow.tsx          # Cart row with image, quantity controls, and delete button
│   ├── constants/
│   │   ├── Colors.ts                # App theme tokens (Forest Green #2E7D32, Amber #FFB300)
│   │   └── i18n.ts                  # Multilingual dictionary (EN, RW, FR) + formatRWF() engine
│   ├── context/
│   │   ├── AuthContext.tsx          # JWT authentication, user profile, account deletion
│   │   ├── CartContext.tsx          # Shopping cart persistence, items, total calculation
│   │   └── LanguageContext.tsx      # Global language provider (useLanguage hook)
│   ├── screens/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx      # Real-time analytics, revenue, order notifications
│   │   │   ├── AdminProductsCrud.tsx   # Catalog management, multi-image Cloudinary upload, edit/delete
│   │   │   ├── AdminConfirmOrders.tsx  # Delivery handshake dashboard, customer email search
│   │   │   └── AdminReports.tsx        # Fulfillment KPIs, inventory distribution, sales logs
│   │   └── user/
│   │       ├── CustomerHome.tsx        # Product catalog, delivery transit banner, category filter
│   │       ├── CustomerSearch.tsx      # Debounced search, RWF price tiers, sort ascending/descending
│   │       ├── CustomerCart.tsx        # Cart preview, subtotal, checkout transition
│   │       └── CustomerOrders.tsx      # Order history, receipt confirmation handshake
│   └── services/
│       ├── api.ts                   # Axios client with Render base URL & JWT interceptors
│       ├── imageService.ts          # Cloudinary direct upload utility for multipart images
│       └── paymentService.ts        # Payment processing engine with MTN/Airtel/Bank hooks
└── package.json
```

---

## 4. Core Features & Technical Implementation

### 4.1 Role-Based Dual Interface
The application dynamically adapts its navigation based on the authenticated user's role (`is_admin`):

| Tab | Customer Experience | Administrator Experience |
|---|---|---|
| **Tab 1** | **Home**: Catalog, categories, delivery transit banner | **Dashboard**: Revenue, order KPIs, fast order alerts |
| **Tab 2** | **Search**: Multilingual search, RWF price tiers, sorting | **Products**: Create, edit, Cloudinary upload, delete products |
| **Tab 3** | **Cart**: Item management, quantities, checkout | **Deliveries**: Customer delivery handshake & search by email |
| **Tab 4** | **Orders**: Order history & package receipt confirmation | **Reports**: Fulfillment KPIs, inventory distribution, transaction logs |
| **Tab 5** | **Profile**: Shared language switcher, account info, account deletion modal, logout |

### 4.2 Instant Language Switching (`LanguageContext`)
* Supported Languages:
  * `en`: English (Default)
  * `rw`: Ikinyarwanda
  * `fr`: Français
* When a user changes the language in [`profile.tsx`](file:///c:/Users/user/Desktop/Y3%20Modules%20Notes/Mobile%20Applications/DG/Frontend/src/app/(tabs)/profile.tsx), `setLang(newLang)` updates the React Context, triggering an immediate re-render across all screens.
* Text resources and translations are centralized in [`i18n.ts`](file:///c:/Users/user/Desktop/Y3%20Modules%20Notes/Mobile%20Applications/DG/Frontend/src/constants/i18n.ts).

### 4.3 Rwandan Currency Standardization (RWF)
* Standardized formatting engine:
  ```typescript
  export function formatRWF(amount: number): string {
      if (isNaN(amount) || amount === null || amount === undefined) {
          return 'RWF 0';
      }
      return `RWF ${Math.round(amount).toLocaleString('en-US')}`;
  }
  ```
* Applied consistently across:
  * Product cards & detail screens
  * Shopping cart subtotal & checkout review
  * Payment receipts and simulated transaction messages
  * Admin revenue reporting, KPIs, and customer transaction logs
  * Admin product registration (`Price (RWF) *`)

### 4.4 Automated Real-Time Inventory Control
1. **Accurate Item Tracking**: Every product maintains a `quantity` attribute representing the exact number of copies available.
2. **Stock Decrement on Purchase**: When a customer completes checkout, the system decrements `quantity` for each item.
3. **Instant Auto-Delete on Zero Stock**:
   * **Backend**: In `crud_order.py`, if a product's copies reach `quantity <= 0`, `db.delete(product)` removes it from the database immediately.
   * **Frontend**: In `checkout.tsx`, a client-side verification confirms remaining stock and deletes depleted products immediately to prevent race conditions.
4. **Low Stock Warnings**: Products with $\le 5$ copies display an alert badge (`Only X left!`). Products with 0 copies disable the "Add to Cart" button.

### 4.5 Two-Way Delivery Handshake
* **The Problem**: Customers should not continue seeing an "In Transit" banner after receiving their order, and administrators need confirmation before closing deliveries.
* **The Solution**:
  * When an order is placed, it starts in `delivered: false`.
  * The customer sees a notification banner on the Home screen: *"Delivery In Transit 🚚 Order #ORD-XXXX is arriving! Tap to confirm receipt."*
  * When the customer taps **"Yes, Package Received"**, the banner is dismissed **optimistically in 0ms**, and `PATCH /orders/{id}/deliver` marks the order as delivered.
  * In the Admin Deliveries screen, admins can view customer delivery details (Email, Phone, WhatsApp, District, Address) and also trigger delivery confirmation.
  * Polling runs on a **5-second heartbeat**, keeping both admin and customer screens synchronized in real time.

### 4.6 0ms Zero-Spinner Tab Navigation
* To prevent blocking spinners during navigation, each primary screen implements an **In-Memory Module Cache**:
  ```typescript
  let cachedProducts: any[] = [];
  const [products, setProducts] = useState(cachedProducts);
  const [loading, setLoading] = useState(cachedProducts.length === 0);
  ```
* When switching tabs, previously cached data renders instantly (0ms delay). A silent background request verifies and updates data seamlessly.

### 4.7 Multi-Image Cloudinary Integration
* Administrators can upload up to 10 images per product directly from their device gallery.
* Images are converted to multipart `FormData` in `imageService.ts` and uploaded to the Cloudinary CDN under preset `DGAppImages`.
* Customers can swipe through product images horizontally with pagination dots (1/5) in `product/[id].tsx`.

### 4.8 Account Deletion Flow
* In compliance with privacy standards, users can permanently delete their accounts from the Profile screen.
* **Verification**: The user must confirm their email and password.
* **Execution**: Re-authenticates via `/auth/login` to confirm credentials, then executes `DELETE /users/{id}` or `DELETE /users/me`.
* **Cascade Cleanup**: Backend deletes all user orders, carts, and user records, then clears local AsyncStorage.

---

## 5. Backend Architecture & API Specification

### 5.1 Technology Stack
* **Framework**: FastAPI (Python 3.11)
* **ORM**: SQLAlchemy
* **Database**: PostgreSQL (Production) / SQLite (Local testing fallback)
* **Authentication**: OAuth2 Password Bearer with JWT (HS256) & bcrypt password hashing

### 5.2 Database Schema (`schema.sql`)

```sql
-- Users Table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Products Table
CREATE TABLE products (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 0,
    info JSON DEFAULT '{}',
    images JSON DEFAULT '[]'
);

-- Orders Table
CREATE TABLE orders (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSON NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carts Table
CREATE TABLE carts (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSON DEFAULT '[]',
    total_price DECIMAL(10, 2) DEFAULT 0.0
);
```

### 5.3 REST API Endpoints

#### Authentication & Users (`/api/auth` & `/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new customer account (`email`, `password`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT `access_token` |
| `GET` | `/api/users/me` | Authenticated | Get current authenticated user profile & role |
| `DELETE` | `/api/users/me` | Authenticated | Delete own account and all associated orders/cart |
| `DELETE` | `/api/users/{user_id}` | Admin / Owner | Delete user account and wipe associated records |

#### Products (`/api/products`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products/` | Public | List products (supports `?category=` and `?search=`) |
| `GET` | `/api/products/{id}` | Public | Retrieve single product details by ID |
| `POST` | `/api/products/` | Admin | Create product with multiple images and copy count |
| `PUT` | `/api/products/{id}` | Admin | Update product details, price, category, copies, images |
| `DELETE` | `/api/products/{id}` | Admin | Remove product from catalog |

#### Orders & Deliveries (`/api/orders`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders/` | Authenticated | Create order, clear cart, auto-decrement copies |
| `GET` | `/api/orders/` | Authenticated | Get customer's own order history |
| `GET` | `/api/orders/all` | Admin | Get all system orders with customer delivery details |
| `PATCH` | `/api/orders/{id}/deliver` | Admin / Customer | Delivery handshake: mark order as delivered |

#### Shopping Cart (`/api/carts`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/carts/` | Authenticated | Retrieve user's current shopping cart |
| `PUT` | `/api/carts/` | Authenticated | Update items and quantities in cart |
| `DELETE` | `/api/carts/` | Authenticated | Clear user's shopping cart |

---

## 6. Developer Setup & Operations

### 6.1 Prerequisites
* Node.js v18+ and npm
* Python 3.11+ and virtualenv
* Expo Go app on iOS/Android or an emulator

### 6.2 Running Frontend Locally
```bash
cd Frontend
npm install
npx expo start
```
* Press `a` for Android Emulator or scan the QR code using the Expo Go application.
* Verify TypeScript compilation at any time:
  ```bash
  npx tsc --noEmit
  ```

### 6.3 Running Backend Locally
```bash
cd Backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6.4 Environment Variables

#### Frontend (`Frontend/.env` or build config)
```env
EXPO_PUBLIC_API_URL=https://dgapp.onrender.com/api
```

#### Backend (`Backend/.env`)
```env
DATABASE_URL=postgresql://user:password@host/dbname
SECRET_KEY=your-secure-jwt-secret-key-32-chars-minimum
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

---

## 7. Customer & Administrator Usage Guide

### For Customers
1. **Browsing**: Explore curated catalog items by category (Clothes, Shoes, Bags, Household, Jewelry, Cosmetics).
2. **Search & Filters**: Search products by name, filter by Rwandan Franc price tiers (<50k, 50k-150k, >150k RWF), and sort prices ascending/descending.
3. **Cart & Checkout**:
   * Add available products to cart (respects available copy counts).
   * Enter recipient full name, primary phone number, WhatsApp contact number, and select delivery District.
   * Select payment method (MTN Mobile Money, Airtel Money, Bank Account).
4. **Order Tracking & Handshake**:
   * Track orders in real-time under the Orders tab.
   * When the delivery courier arrives, tap **"Yes, Package Received"** to confirm the delivery handshake.
5. **Language & Profile**: Switch anytime between English, Kinyarwanda, and French in the Profile tab.

### For Store Administrators
1. **Performance Dashboard**: Real-time overview of revenue in RWF, total orders, pending orders, and delivered orders.
2. **Product Catalog Management**:
   * Add new products with multiple images from the device photo gallery.
   * Edit existing product prices, categories, and inventory copy counts.
   * Delete products or allow automatic zero-inventory removal.
3. **Delivery Management**:
   * Search orders by customer email or order reference.
   * View customer phone and WhatsApp contacts for delivery coordination.
   * Mark deliveries as completed upon courier confirmation.
4. **Sales & Inventory Reports**: Review fulfillment rates, average order values, and catalog inventory distribution by category.

---

## 8. Verification & Release Checklist

- [x] TypeScript compilation: `0 errors` via `npx tsc --noEmit`.
- [x] Currency audit: 100% RWF format across all customer and admin screens.
- [x] Multilingual engine: English, Kinyarwanda, and French operational with zero reload.
- [x] Zero-spinner caching: In-memory cache implemented across all 5 tab screens.
- [x] Real-time delivery sync: 5-second polling with instant optimistic dismissals.
- [x] Inventory management: Product copies decrement upon payment, and auto-delete on zero quantity.
- [x] Admin product CRUD: Full Create, Read, Update, Delete with Cloudinary image upload.
- [x] Account deletion: Secure modal verification wiping user records and order history.
- [x] Dead code cleanup: Unused files and legacy templates removed.
