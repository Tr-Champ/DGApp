# D&G E-Commerce — Backend API Reference

> **Base URL:** `http://<your-server-host>:<port>`  
> **Interactive Docs:** `http://<your-server-host>:<port>/docs` (Swagger UI)  
> **Auth:** All protected routes require a `Bearer` token in the `Authorization` header.

---

## Table of Contents

1. [General](#general)
2. [Authentication — `/api/auth`](#authentication--apiauth)
3. [Users — `/api/users`](#users--apiusers)
4. [Products — `/api/products`](#products--apiproducts)
5. [Cart — `/api/carts`](#cart--apicarts)
6. [Orders — `/api/orders`](#orders--apiorders)
7. [Cloudinary — Upload & Load Images](#cloudinary--upload--load-images)

---

## General

### Health Check
| Method | URL | Auth |
|--------|-----|------|
| `GET` | `/` | No |
| `GET` | `/api/health` | No |

**`GET /`** — Returns a simple status message.

```json
// Response 200
{ "message": "D&G E-Commerce Backend is up and running successfully!" }
```

**`GET /api/health`** — Ping to check if the server is alive.

```json
// Response 200
{ "status": "ok" }
```

---

## Authentication — `/api/auth`

### Register
| Method | URL | Auth |
|--------|-----|------|
| `POST` | `/api/auth/register` | No |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response `200`:**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "is_admin": false
}
```

**Errors:**
- `400` — `"Email already registered"`

---

### Login
| Method | URL | Auth |
|--------|-----|------|
| `POST` | `/api/auth/login` | No |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response `200`:**
```json
{
  "access_token": "<jwt_token>",
  "token_type": "bearer"
}
```

> Save `access_token` — pass it as `Authorization: Bearer <access_token>` on all protected requests.

**Errors:**
- `401` — `"Incorrect email or password"`

---

### Forgot Password
| Method | URL | Auth |
|--------|-----|------|
| `POST` | `/api/auth/forgot-password` | No |

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response `200`:**
```json
{
  "message": "If an account with that email exists, a reset link has been sent."
}
```

> Always returns success regardless of whether the email exists (security by design).

---

## Users — `/api/users`

### Get Current User
| Method | URL | Auth |
|--------|-----|------|
| `GET` | `/api/users/me` | Bearer |

**Response `200`:**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "is_admin": false
}
```

---

### Delete Current User's Account
| Method | URL | Auth |
|--------|-----|------|
| `DELETE` | `/api/users/me` | Bearer |

**Response `200`:**
```json
{
  "message": "Account, orders, cart, and all user info deleted successfully"
}
```

> This deletes the user's account, orders, and cart — it's irreversible.

---

### Delete a User by ID (Admin or Self)
| Method | URL | Auth |
|--------|-----|------|
| `DELETE` | `/api/users/{user_id}` | Bearer |

**Path Parameter:**
- `user_id` — UUID string of the user to delete.

**Response `200`:**
```json
{
  "message": "Account, orders, cart, and all user info deleted successfully"
}
```

**Errors:**
- `403` — Not authorized (non-admin deleting another user)
- `404` — User not found

---

## Products — `/api/products`

### List All Products
| Method | URL | Auth |
|--------|-----|------|
| `GET` | `/api/products/` | No |

**Query Parameters (optional):**
| Param | Type | Description |
|-------|------|-------------|
| `category` | `string` | Filter by category name |
| `search` | `string` | Search by product name (partial match) |

**Example:**
```
GET /api/products/?category=Shoes&search=air
```

**Response `200`:**
```json
[
  {
    "id": "uuid-string",
    "name": "Air Max",
    "category": "Shoes",
    "price": 120.00,
    "quantity": 10,
    "info": { "color": "white", "sizes": [40, 41, 42] },
    "images": ["https://res.cloudinary.com/.../image.jpg"]
  }
]
```

---

### Get Single Product
| Method | URL | Auth |
|--------|-----|------|
| `GET` | `/api/products/{product_id}` | No |

**Path Parameter:**
- `product_id` — UUID string.

**Response `200`:** Single product object (same shape as above).

**Errors:**
- `404` — `"Product not found"`

---

### Create Product
| Method | URL | Auth |
|--------|-----|------|
| `POST` | `/api/products/` | No |

**Request Body:**
```json
{
  "name": "Air Max",
  "category": "Shoes",
  "price": 120.00,
  "quantity": 10,
  "info": { "color": "white", "sizes": [40, 41, 42] },
  "images": ["https://res.cloudinary.com/.../image.jpg"],
  "id": "optional-custom-uuid"
}
```

> `id` is optional — if omitted, the backend auto-generates a UUID.  
> `info` is a free-form JSON object for any extra metadata.  
> `images` is an array of Cloudinary URLs (see Cloudinary section below).

**Response `201`:** Created product object.

---

### Update Product
| Method | URL | Auth |
|--------|-----|------|
| `PUT` | `/api/products/{product_id}` | No |

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "category": "Bags",
  "price": 99.99,
  "quantity": 5,
  "info": { "color": "black" },
  "images": ["https://res.cloudinary.com/.../new_image.jpg"]
}
```

**Response `200`:** Updated product object.

**Errors:**
- `404` — `"Product not found"`

---

### Delete Product
| Method | URL | Auth |
|--------|-----|------|
| `DELETE` | `/api/products/{product_id}` | No |

**Response `200`:**
```json
{ "message": "Product deleted successfully" }
```

**Errors:**
- `404` — `"Product not found"`

---

## Cart — `/api/carts`

> All cart routes require authentication.

### Get My Cart
| Method | URL | Auth |
|--------|-----|------|
| `GET` | `/api/carts/` | Bearer |

**Response `200`:**
```json
{
  "id": "uuid-string",
  "user_id": "uuid-string",
  "items": [
    {
      "product_id": "uuid-string",
      "name": "Air Max",
      "price": 120.00,
      "quantity": 2,
      "image": "https://res.cloudinary.com/.../image.jpg"
    }
  ],
  "total_price": 240.00
}
```

---

### Update My Cart
| Method | URL | Auth |
|--------|-----|------|
| `PUT` | `/api/carts/` | Bearer |

**Request Body:**
```json
{
  "items": [
    {
      "product_id": "uuid-string",
      "name": "Air Max",
      "price": 120.00,
      "quantity": 2,
      "image": "https://res.cloudinary.com/.../image.jpg"
    }
  ],
  "total_price": 240.00
}
```

> `items` is a free-form array — pass the full cart snapshot each time (replace strategy).

**Response `200`:** Updated cart object.

---

### Clear My Cart
| Method | URL | Auth |
|--------|-----|------|
| `DELETE` | `/api/carts/` | Bearer |

**Response `200`:**
```json
{
  "id": "uuid-string",
  "user_id": "uuid-string",
  "items": [],
  "total_price": 0.0
}
```

---

## Orders — `/api/orders`

> All order routes require authentication.

### Place an Order (Checkout)
| Method | URL | Auth |
|--------|-----|------|
| `POST` | `/api/orders/` | Bearer |

**Request Body:**
```json
{
  "items": [
    {
      "product_id": "uuid-string",
      "name": "Air Max",
      "price": 120.00,
      "quantity": 2
    }
  ],
  "total_price": 240.00,
  "id": "optional-custom-uuid"
}
```

> Placing an order **automatically clears the cart**.

**Response `200`:**
```json
{
  "id": "uuid-string",
  "user_id": "uuid-string",
  "items": [...],
  "total_price": 240.00,
  "paid": false,
  "delivered": false,
  "created_at": "2026-10-24T19:00:00"
}
```

---

### Get My Orders
| Method | URL | Auth |
|--------|-----|------|
| `GET` | `/api/orders/` | Bearer |

**Response `200`:** Array of order objects (same shape as above).

---

### Get All Orders (Admin)
| Method | URL | Auth |
|--------|-----|------|
| `GET` | `/api/orders/all` | Bearer |

> If `is_admin = true` returns all orders.  
> If `is_admin = false` returns only your own orders.

**Response `200`:** Array of order objects.

---

### Mark Order as Delivered
| Method | URL | Auth |
|--------|-----|------|
| `PATCH` | `/api/orders/{order_id}/deliver` | Bearer |

**Path Parameter:**
- `order_id` — UUID string of the order.

**Response `200`:** Updated order object with `"delivered": true`.

**Errors:**
- `404` — Order not found or not authorized.

---

## Cloudinary — Upload & Load Images

Product images are stored in **Cloudinary**. The backend stores Cloudinary URLs inside the `images` array of each product. The **frontend** is responsible for uploading images to Cloudinary and then passing the resulting URLs to the backend.

---

### Step 1 — Create a Cloudinary Account

1. Go to https://cloudinary.com and sign up for free.
2. From your **Dashboard**, note down:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
   - `Upload Preset` (create one below)

---

### Step 2 — Create an Unsigned Upload Preset

1. Dashboard → **Settings** → **Upload** → scroll to **Upload Presets**.
2. Click **Add upload preset**.
3. Set **Signing Mode** to `Unsigned` (easiest for mobile/frontend).
4. Name it, e.g. `dg_products`.
5. Optionally set a **Folder**, e.g. `dg/products`.
6. Save.

---

### Step 3 — Upload an Image from the Frontend

Use the Cloudinary unsigned upload endpoint directly from React Native / web.

**Endpoint:**
```
POST https://api.cloudinary.com/v1_1/<CLOUD_NAME>/image/upload
```

**Form Data (multipart/form-data):**
| Field | Value |
|-------|-------|
| `file` | The image file or base64 string |
| `upload_preset` | Your preset name, e.g. `dg_products` |

**React Native / JavaScript Example:**
```js
const uploadImageToCloudinary = async (imageUri) => {
  const CLOUD_NAME = "your_cloud_name";
  const UPLOAD_PRESET = "dg_products";

  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,        // local file URI from image picker
    type: "image/jpeg",
    name: "product.jpg",
  });
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();
  return data.secure_url; // <- This is the URL you store in the backend
};
```

**Cloudinary Response (partial):**
```json
{
  "public_id": "dg/products/abc123",
  "secure_url": "https://res.cloudinary.com/your_cloud/image/upload/v1234567890/dg/products/abc123.jpg",
  "width": 800,
  "height": 800
}
```

> Use `secure_url` — pass it to the backend when creating or updating a product.

---

### Step 4 — Save the URL to the Backend

```js
const secure_url = await uploadImageToCloudinary(localImageUri);

await fetch("http://<your-server>/api/products/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Air Max",
    category: "Shoes",
    price: 120.00,
    quantity: 10,
    info: {},
    images: [secure_url],  // <- Cloudinary URL here
  }),
});
```

---

### Step 5 — Display the Image

Cloudinary URLs are plain HTTPS — display them like any image:

```jsx
// React Native
<Image source={{ uri: product.images[0] }} style={{ width: 200, height: 200 }} />

// React / HTML
<img src={product.images[0]} alt={product.name} />
```

---

### Cloudinary URL Transformations (Optional)

Resize/optimize images on-the-fly by injecting parameters into the URL:

```
// Original
https://res.cloudinary.com/<cloud>/image/upload/v123/dg/products/abc.jpg

// 400x400, auto quality, WebP
https://res.cloudinary.com/<cloud>/image/upload/w_400,h_400,c_fill,q_auto,f_webp/v123/dg/products/abc.jpg
```

| Parameter | Description |
|-----------|-------------|
| `w_<n>` | Width in pixels |
| `h_<n>` | Height in pixels |
| `c_fill` | Crop mode fill |
| `q_auto` | Auto quality |
| `f_webp` | Convert to WebP |
| `f_auto` | Auto best format |

---

### `.env` for Server-Side Cloudinary (if needed later)

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> Currently, upload is handled entirely on the frontend (unsigned preset). No Cloudinary keys are needed in the backend unless you add server-side secure uploads.

---

## Quick Reference Table

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/` | GET | No | Root status |
| `/api/health` | GET | No | Health check |
| `/api/auth/register` | POST | No | Register user |
| `/api/auth/login` | POST | No | Login, get JWT |
| `/api/auth/forgot-password` | POST | No | Request password reset |
| `/api/users/me` | GET | Bearer | Get current user |
| `/api/users/me` | DELETE | Bearer | Delete own account |
| `/api/users/{user_id}` | DELETE | Bearer | Delete user by ID |
| `/api/products/` | GET | No | List products (filterable) |
| `/api/products/` | POST | No | Create product |
| `/api/products/{product_id}` | GET | No | Get product by ID |
| `/api/products/{product_id}` | PUT | No | Update product |
| `/api/products/{product_id}` | DELETE | No | Delete product |
| `/api/carts/` | GET | Bearer | Get my cart |
| `/api/carts/` | PUT | Bearer | Update my cart |
| `/api/carts/` | DELETE | Bearer | Clear my cart |
| `/api/orders/` | POST | Bearer | Checkout (creates order, clears cart) |
| `/api/orders/` | GET | Bearer | Get my orders |
| `/api/orders/all` | GET | Bearer | Get all orders (admin sees all) |
| `/api/orders/{order_id}/deliver` | PATCH | Bearer | Mark order delivered |
